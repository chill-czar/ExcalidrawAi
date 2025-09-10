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

// ---------- Chains with Error Handling ----------
const classifierPrompt = ChatPromptTemplate.fromTemplate(`
You are a guardrailed classifier.
Classify the user prompt into one of:
- create
- edit
- general
- question
- reference
User prompt: {input}
Answer with only the label.
`);

const classifierChain = classifierPrompt
  .pipe(groqModel)
  .pipe(new StringOutputParser());

const createTypePrompt = ChatPromptTemplate.fromTemplate(`
You are a prompt identifier.
Classify the following 'create' request into one of:
- system_design
- technical_diagram
- general
- drawing
Prompt: {input}
Answer with only the label.
`);

const createTypeChain = createTypePrompt
  .pipe(groqModel)
  .pipe(new StringOutputParser());

const systemDesignPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert system designer and prompt optimizer.
Your task is to transform a raw user description into a precise, structured prompt 
for a DSL-based diagram generator (Excalidraw DSL).

## Instructions
1. Identify and **list all key elements** (components, entities, nodes).
2. Describe the **relationships/flows** between elements (arrows, directions).
3. Specify **content/labels** for each element.
4. Suggest **layout flow** (e.g., top-to-bottom, left-to-right, grouped).
5. Be clear and unambiguous — the DSL generator should directly translate it into shapes.

## Output Requirements
- List **all elements** (components, services, databases, APIs, users, etc.) with suggested shape type (rect, ellipse, diamond, text).
- Define **relationships/flows** between elements (arrows with start → end).
- Provide **labels/text** for each element.
- Suggest **layout guidance** (top-to-bottom, left-to-right, grouped).
- Keep the language precise, minimal, and structured.

## Output Format
Return a single optimized prompt in this structure:

Elements:
- [id]: [shape type] - [label/content]

Flows:
- [startId] → [endId]

Layout:
- [brief description of layout strategy]

User Input:
{input}
`);

const technicalDiagramPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert in technical diagrams.
Generate an optimized prompt for a technical diagram based on:
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

const dslPrompt = ChatPromptTemplate.fromTemplate(`
You are a DSL generator.  
Take the DslMaker Instruction & user's optimized prompt and convert it **directly into valid DSL JSON**.  

DslMaker Instructions: {dsl}
Optimized Prompt: {optimized}
`);

const dslParser = new JsonOutputParser<DSLJson>();
const dslChain = dslPrompt.pipe(groqModel).pipe(dslParser);

// ---------- Main Orchestration with Error Handling ----------
export const mainChain = RunnableLambda.from(
  async (input: { input: string }): Promise<AIDrawingResponse> => {
    try {
      // Input validation
      const validationError = validateInput(input.input);
      if (validationError) return validationError;

      // Classification
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

      if (classification !== "create") {
        return {
          success: true,
          message: `Classification: ${classification}. No DSL generation needed.`,
        };
      }

      // Sub-classification
      let subtype: string;
      try {
        subtype = await createTypeChain.invoke({ input: input.input });
        if (
          ![
            "system_design",
            "technical_diagram",
            "general",
            "drawing",
          ].includes(subtype)
        ) {
          return {
            success: false,
            type: "subclassification_error",
            message: "Invalid subclassification result from AI.",
          };
        }
      } catch (error) {
        return handleLLMError(error, "subclassification");
      }

      // Optimization
      let optimized: string;
      try {
        if (subtype === "system_design") {
          optimized = await systemDesignChain.invoke({ input: input.input });
        } else if (subtype === "technical_diagram") {
          optimized = await technicalDiagramChain.invoke({
            input: input.input,
          });
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

      // DSL Generation
      try {
        const dsl = await dslChain.invoke({
          dsl: DSL_PROMPT,
          optimized,
        });

        console.log("Final DSL object:", dsl);

        // Validate DSL structure
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
