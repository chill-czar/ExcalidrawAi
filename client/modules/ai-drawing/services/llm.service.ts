import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";
import { logger } from "@/core/logger";
import type { DSLJson } from "../schemas";

/**
 * LLM Service - Handles all LLM interactions
 * This is the core AI service layer
 */
export class LLMService {
  private groqModel: ChatGroq | null = null;

  private getModel(): ChatGroq {
    if (!this.groqModel) {
      this.groqModel = new ChatGroq({
        model: "llama-3.3-70b-versatile",
        apiKey: process.env.GROQ_API_KEY!,
        maxRetries: 2,
        timeout: 30000,
      });
    }
    return this.groqModel;
  }

  /**
   * Classify user intent
   */
  async classifyIntent(input: string): Promise<string> {
    const prompt = ChatPromptTemplate.fromTemplate(`
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

    const chain = prompt.pipe(this.getModel()).pipe(new StringOutputParser());
    const result = await chain.invoke({ input });
    logger.debug("Intent classification:", result);
    return result.trim().toLowerCase();
  }

  /**
   * Classify visualizability
   */
  async classifyVisualizability(input: string): Promise<string> {
    const prompt = ChatPromptTemplate.fromTemplate(`
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

    const chain = prompt.pipe(this.getModel()).pipe(new StringOutputParser());
    const result = await chain.invoke({ input });
    logger.debug("Visualizability classification:", result);
    return result.trim().toLowerCase();
  }

  /**
   * Optimize prompt for system design
   */
  async optimizeSystemDesignPrompt(input: string): Promise<string> {
    const prompt = ChatPromptTemplate.fromTemplate(`
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

    const chain = prompt.pipe(this.getModel()).pipe(new StringOutputParser());
    return chain.invoke({ input });
  }

  /**
   * Optimize prompt for technical diagram
   */
  async optimizeTechnicalDiagramPrompt(input: string): Promise<string> {
    const prompt = ChatPromptTemplate.fromTemplate(`
You are an expert in technical diagrams.
Generate an optimized prompt for a technical diagram:
User Input: {input}
`);

    const chain = prompt.pipe(this.getModel()).pipe(new StringOutputParser());
    return chain.invoke({ input });
  }

  /**
   * Optimize prompt for general drawing
   */
  async optimizeDrawingPrompt(input: string): Promise<string> {
    const prompt = ChatPromptTemplate.fromTemplate(`
You are a creative AI.
Generate an optimized prompt for a general drawing:
User Input: {input}
`);

    const chain = prompt.pipe(this.getModel()).pipe(new StringOutputParser());
    return chain.invoke({ input });
  }

  /**
   * Generate DSL from optimized prompt
   */
  async generateDSL(optimizedPrompt: string, dslInstructions: string): Promise<DSLJson> {
    const prompt = ChatPromptTemplate.fromTemplate(`
You are a DSL generator.
Convert the optimized prompt into valid DSL JSON.

DslMaker Instructions: {dsl}
Optimized Prompt: {optimized}
`);

    const parser = new JsonOutputParser<DSLJson>();
    const chain = prompt.pipe(this.getModel()).pipe(parser);

    const result = await chain.invoke({
      dsl: dslInstructions,
      optimized: optimizedPrompt,
    });

    logger.debug("Generated DSL:", result);
    return result;
  }
}
