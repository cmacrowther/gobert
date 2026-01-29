import { Message } from "@/hooks/use-gobert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { GobertHead } from "@/components/gobert-head";

interface ChatMessageProps {
  message: Message;
  isLatestAssistant?: boolean;
  gazeTarget?: [number, number];
}

export function ChatMessage({ message, isLatestAssistant, gazeTarget }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full items-start gap-4 mb-6", isUser && "justify-end")}>
      {!isUser && isLatestAssistant ? (
        <div className="flex-shrink-0 mt-1 w-12 h-12 flex items-center justify-center">
          <div className="w-12 h-12 -ml-1 -mt-1">
            <GobertHead className="w-full h-full" gazeTarget={gazeTarget} />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[85%] leading-relaxed text-[15px] sm:text-base",
          isUser
            ? "bg-zinc-800 text-zinc-100 px-5 py-3 rounded-[24px] rounded-br-none"
            : "text-zinc-300 py-1"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {isUser && (
        <Avatar className="h-10 w-10 mt-1 border border-white/10">
          <AvatarImage src="/user-avatar.jpg" />
          <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
