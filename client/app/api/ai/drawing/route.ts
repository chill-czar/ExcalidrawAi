import { NextResponse } from "next/server";
import { AIDrawingRequest, AIDrawingResponse } from "@/types/ai";
import { mainChain } from "@/lib/chains/pipeline";

export async function POST(req: Request) {
  try {
    const body: AIDrawingRequest = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          type: "validation_error",
          message: "Prompt is required",
        },
        { status: 400 }
      );
    }

    const result = await mainChain.invoke({ input: prompt });
    // console.log("final result in route.ts", result);

    // Handle the response based on success/failure
    if (result.success && result.dsl) {
      const response: AIDrawingResponse = {
        success: true,
        dsl: result.dsl,
      };
      return NextResponse.json(response);
    } else {
      // Return the error response from the chain
      return NextResponse.json(
        {
          success: false,
          type: result.type || "unknown_error",
          message: result.message || "Failed to generate DSL",
        },
        { status: 422 } // Unprocessable Entity
      );
    }
  } catch (err: any) {
    console.error("AI Drawing API error:", err);
    return NextResponse.json(
      {
        success: false,
        type: "api_error",
        message: err.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
