import { Message } from "@/hooks/use-chat";
import { ChatMessage } from "./chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

interface ChatListProps {
  messages: Message[];
  gazeTarget?: [number, number];
  isWaitingForResponse?: boolean;
}

export function ChatList({ messages, gazeTarget, isWaitingForResponse }: ChatListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Find the index of the last assistant message
  const lastAssistantIndex = messages.findLastIndex(msg => msg.role === 'assistant');
  // Find the index of the last user message
  const lastUserIndex = messages.findLastIndex(msg => msg.role === 'user');

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="flex flex-col gap-4">
        {messages.map((msg, index) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLatestAssistant={index === lastAssistantIndex}
            isLatestUser={index === lastUserIndex}
            isWaitingForResponse={isWaitingForResponse}
            gazeTarget={gazeTarget}
          />
        ))}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
