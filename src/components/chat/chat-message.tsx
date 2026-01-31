import { Message } from "@/hooks/use-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { BotHead } from "@/components/bot-head";
import { ThinkingBubble } from "@/components/thinking-bubble";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: Message;
  isLatestAssistant?: boolean;
  isLatestUser?: boolean;
  isWaitingForResponse?: boolean;
  gazeTarget?: [number, number];
}

export function ChatMessage({ message, isLatestAssistant, isLatestUser, isWaitingForResponse, gazeTarget }: ChatMessageProps) {
  const isUser = message.role === "user";
  const showLoadingBorder = isUser && isLatestUser && isWaitingForResponse;
  // Show thinking bubble on bot head when waiting for response
  const showBotThinking = !isUser && isLatestAssistant && isWaitingForResponse;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={cn("flex w-full items-start gap-2 mb-4 group", isUser ? "justify-end" : "flex-col")}>
      <div
        className={cn(
          "leading-relaxed text-base relative",
          isUser
            ? "max-w-[80%] bg-zinc-800 text-zinc-100 px-5 py-3 rounded-[26px] rounded-br-none"
            : "w-full text-zinc-300 py-1"
        )}
      >
        <div className="flex justify-between items-start gap-4">
          <p className="whitespace-pre-wrap">{message.content}</p>
          {!isUser && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-300 flex-shrink-0 h-6 w-6"
              onClick={handleCopy}
              aria-label={isCopied ? "Copied" : "Copy message"}
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {!isUser && isLatestAssistant && (
        <div className="flex items-center gap-3 mt-1 pl-1 fade-in">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center relative">
            <ThinkingBubble visible={showBotThinking ?? false} className="top-[-8px] scale-75 origin-center thinking-bubble-small" />
            <div className="w-10 h-10 -ml-1 -mt-1">
              <BotHead className="w-full h-full" gazeTarget={gazeTarget} />
            </div>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            {showBotThinking ? "Thinking..." : "Gobert took 2s to reply"}
          </span>
        </div>
      )}

      {isUser && (
        <div className="relative h-10 w-10 mt-1 mr-1 overflow-visible">
          {showLoadingBorder && (
            <div className="absolute inset-[-3px] rounded-full animate-spin-slow bg-gradient-conic" />
          )}
          <Avatar className={cn("h-10 w-10 relative", showLoadingBorder ? "border border-black" : "border border-white/10")}>
            <AvatarImage src="/user-avatar.jpg" />
            <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">U</AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}
