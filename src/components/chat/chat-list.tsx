import { Message } from "@/hooks/use-gobert";
import { ChatMessage } from "./chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

interface ChatListProps {
  messages: Message[];
  gazeTarget?: [number, number];
}

export function ChatList({ messages, gazeTarget }: ChatListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Find the index of the last assistant message
  const lastAssistantIndex = messages.findLastIndex(msg => msg.role === 'assistant');

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="flex flex-col gap-4">
        {messages.map((msg, index) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLatestAssistant={index === lastAssistantIndex}
            gazeTarget={gazeTarget}
          />
        ))}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
