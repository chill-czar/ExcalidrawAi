"use client";

import ChatInput from "./ChatInput";


export default function ChatPanel() {
  return (
    <div className="flex justify-end flex-col h-full border-r">
      <ChatInput />
    </div>
  );
}
