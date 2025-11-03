import { AIDrawingController } from "@/modules/ai-drawing";

// Initialize controller
const controller = new AIDrawingController();

// Delegate to controller
export async function POST(req: Request) {
  return controller.handleGenerateDrawing(req);
}
