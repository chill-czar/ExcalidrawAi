import ChatPanel from "@/components/ChatPanal";
import Excalidraw from "@/components/Excalidraw";

export default function Home() {
  return (
    <div className="h-screen flex flex-col lg:flex-row">
      <div className="w-1/4">
        <ChatPanel />
      </div>
      <div className="flex-1">
        <Excalidraw />
      </div>
    </div>
  );
}
