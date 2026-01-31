import { Message } from "@/hooks/use-chat";
import { ChatMessage } from "./chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { BotHead } from "@/components/bot-head";
import { ThinkingBubble } from "@/components/thinking-bubble";

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
    <ScrollArea className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-4">
        {messages.map((msg, index) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLatestAssistant={index === lastAssistantIndex && (index === messages.length - 1 || !isWaitingForResponse)}
            isLatestUser={index === lastUserIndex}
            isWaitingForResponse={isWaitingForResponse}
            gazeTarget={gazeTarget}
          />
        ))}

        {/* Show ghost head when waiting for response and last message is from user */}
        {isWaitingForResponse && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex flex-col w-full gap-2 mb-4">
            {/* Placeholder for text area while thinking if needed, or just show the head below */}
            <div className="flex items-center gap-3 mt-1 pl-1 fade-in">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center relative">
                <ThinkingBubble visible={true} className="top-[-8px] scale-75 origin-center thinking-bubble-small" />
                <div className="w-10 h-10 -ml-1 -mt-1">
                  <BotHead className="w-full h-full" gazeTarget={gazeTarget} />
                </div>
              </div>
              <span className="text-xs text-zinc-500 font-medium">
                Thinking...
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
