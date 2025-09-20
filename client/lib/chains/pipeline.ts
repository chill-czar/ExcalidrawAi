import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";
import { RunnableLambda } from "@langchain/core/runnables";
import { DSL_PROMPT } from "../prompts/dslPrompt";
import { DSLJson } from "../converter";

// ---------- Error Types ----------
export type AIDrawingErrorType =
  | "validation_error"
  | "classification_error"
  | "subclassification_error"
  | "optimization_error"
  | "dsl_generation_error"
  | "api_error"
  | "unknown_error";

export interface AIDrawingResponse {
  success: boolean;
  dsl?: DSLJson;
  type?: AIDrawingErrorType;
  message?: string;
  details?: any;
}

// ---------- Setup LLM ----------
const groqModel = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY!,
  maxRetries: 2,
  timeout: 30000, // 30 seconds timeout
});

// ---------- Helper Functions ----------
const handleLLMError = (error: any, context: string): AIDrawingResponse => {
  console.error(`Error in ${context}:`, error);

  if (error?.name === "AbortError") {
    return {
      success: false,
      type: "api_error",
      message: "Request timeout. Please try again.",
      details: error,
    };
  }

  if (error?.status === 429) {
    return {
      success: false,
      type: "api_error",
      message: "Rate limit exceeded. Please try again later.",
      details: error,
    };
  }

  if (error?.status >= 400 && error.status < 500) {
    return {
      success: false,
      type: "api_error",
      message: "API request failed. Please check your input.",
      details: error,
    };
  }

  return {
    success: false,
    type: "unknown_error",
    message: `Unexpected error in ${context}. Please try again.`,
    details: error,
  };
};

const validateInput = (input: string): AIDrawingResponse | null => {
  if (!input || typeof input !== "string") {
    return {
      success: false,
      type: "validation_error",
      message: "Input is required and must be a string.",
    };
  }

  if (input.trim().length < 3) {
    return {
      success: false,
      type: "validation_error",
      message: "Input must be at least 3 characters long.",
    };
  }

  if (input.length > 1000) {
    return {
      success: false,
      type: "validation_error",
      message: "Input must be less than 1000 characters.",
    };
  }

  return null;
};

// ---------- Main Classifier ----------
const classifierPrompt = ChatPromptTemplate.fromTemplate(`
You are an intent classifier.  
Decide the intent of the user request.  
Classify into one of:
- create
- edit
- question
- reference
- general

Rules:
- Focus on meaning, not just keywords.
- If unsure → general.

User Input: {input}
Answer with only the label.
`);

const classifierChain = classifierPrompt
  .pipe(groqModel)
  .pipe(new StringOutputParser());

// ---------- Visualizability Classifier ----------
const visualizabilityPrompt = ChatPromptTemplate.fromTemplate(`
You are a semantic classifier. 
Decide if the input can be represented as a diagram/drawing.

Categories:
- system_design (system architecture, workflows, infra diagrams)
- technical_diagram (flowcharts, UML, ERD, ecosystems, process diagrams)
- drawing (creative/artistic sketch)
- not_visualizable (cannot be expressed visually, e.g., jokes, trivia, greetings)

Rules:
- Even if the input is a "question", check if it can be explained visually.
- Example: "What is TypeScript?" → technical_diagram (ecosystem diagram)
- Example: "Payment gateway architecture" → system_design
- Example: "Tell me a joke" → not_visualizable

User Input: {input}
Answer with only one label.
`);

const visualizabilityChain = visualizabilityPrompt
  .pipe(groqModel)
  .pipe(new StringOutputParser());

// ---------- Optimization Prompts ----------
const systemDesignPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert system designer and prompt optimizer.
Transform a raw user description into a structured prompt 
for a DSL-based diagram generator (Excalidraw DSL).

Steps:
1. Identify all key elements (components, entities, nodes).
2. Describe relationships/flows between elements.
3. Specify labels/content.
4. Suggest layout (top-to-bottom, left-to-right, grouped).

User Input:
{input}
`);

const technicalDiagramPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert in technical diagrams.
Generate an optimized prompt for a technical diagram:
User Input: {input}
`);

const drawingPrompt = ChatPromptTemplate.fromTemplate(`
You are a creative AI.
Generate an optimized prompt for a general drawing:
User Input: {input}
`);

const systemDesignChain = systemDesignPrompt
  .pipe(groqModel)
  .pipe(new StringOutputParser());

const technicalDiagramChain = technicalDiagramPrompt
  .pipe(groqModel)
  .pipe(new StringOutputParser());

const drawingChain = drawingPrompt
  .pipe(groqModel)
  .pipe(new StringOutputParser());

// ---------- DSL Generator ----------
const dslPrompt = ChatPromptTemplate.fromTemplate(`
You are a DSL generator.  
Convert the optimized prompt into valid DSL JSON.  

DslMaker Instructions: {dsl}
Optimized Prompt: {optimized}
`);

const dslParser = new JsonOutputParser<DSLJson>();
const dslChain = dslPrompt.pipe(groqModel).pipe(dslParser);

// ---------- Main Orchestration ----------
export const mainChain = RunnableLambda.from(
  async (input: { input: string }): Promise<AIDrawingResponse> => {
    try {
      // Input validation
      const validationError = validateInput(input.input);
      if (validationError) return validationError;

      // Step 1: Main classification (for logging/future use)
      let classification: string;
      try {
        classification = await classifierChain.invoke({ input: input.input });
        if (
          !["create", "edit", "general", "question", "reference"].includes(
            classification
          )
        ) {
          return {
            success: false,
            type: "classification_error",
            message: "Invalid classification result from AI.",
          };
        }
      } catch (error) {
        return handleLLMError(error, "classification");
      }

      // Step 2: Visualizability check
      let subtype: string;
      try {
        subtype = await visualizabilityChain.invoke({ input: input.input });
        if (
          !["system_design", "technical_diagram", "drawing", "not_visualizable"].includes(
            subtype
          )
        ) {
          return {
            success: false,
            type: "subclassification_error",
            message: "Invalid visualizability result from AI.",
          };
        }
      } catch (error) {
        return handleLLMError(error, "visualizability");
      }

      // If not visualizable → return early
      if (subtype === "not_visualizable") {
        return {
          success: true,
          message: `Classification: ${classification}/${subtype}. Not suitable for DSL generation.`,
        };
      }

      // Step 3: Optimization
      let optimized: string;
      try {
        if (subtype === "system_design") {
          optimized = await systemDesignChain.invoke({ input: input.input });
        } else if (subtype === "technical_diagram") {
          optimized = await technicalDiagramChain.invoke({ input: input.input });
        } else {
          optimized = await drawingChain.invoke({ input: input.input });
        }

        if (!optimized || optimized.length < 10) {
          return {
            success: false,
            type: "optimization_error",
            message: "Optimized prompt generation failed.",
          };
        }
      } catch (error) {
        return handleLLMError(error, "optimization");
      }

      // Step 4: DSL Generation
      try {
        const dsl = await dslChain.invoke({
          dsl: DSL_PROMPT,
          optimized,
        });

        console.log("Final DSL object:", dsl);

        if (!dsl || typeof dsl !== "object") {
          return {
            success: false,
            type: "dsl_generation_error",
            message: "Invalid DSL structure generated.",
          };
        }

        return {
          success: true,
          dsl,
        };
      } catch (error) {
        return handleLLMError(error, "DSL generation");
      }
    } catch (error) {
      return handleLLMError(error, "main orchestration");
    }
  }
);
