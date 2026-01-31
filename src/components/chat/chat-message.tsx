import { Message } from "@/hooks/use-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { BotHead } from "@/components/bot-head";
import { ThinkingBubble } from "@/components/thinking-bubble";
import { Check, Copy } from "lucide-react";
import { useState, ComponentPropsWithoutRef } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
          <div className="flex-1 overflow-hidden">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Text styling
                  p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                  strong: ({ children }) => <span className="font-bold text-zinc-100">{children}</span>,
                  em: ({ children }) => <span className="italic text-zinc-200">{children}</span>,

                  // Lists
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-4 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="pl-1">{children}</li>,

                  // Code blocks
                  code: ({ className, children, ...props }: ComponentPropsWithoutRef<"code">) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match && !className?.includes("language-") && !String(children).includes("\n");

                    return isInline ? (
                      <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-sm font-mono border border-zinc-700/50" {...props}>
                        {children}
                      </code>
                    ) : (
                      <div className="relative my-6 rounded-lg overflow-hidden border border-zinc-700/50 bg-zinc-900/50">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/50 border-b border-zinc-700/50">
                          <span className="text-xs text-zinc-400 font-mono">{match?.[1] || "text"}</span>
                        </div>
                        <div className="p-3 overflow-x-auto">
                          <code className={cn("font-mono text-sm text-zinc-300", className)} {...props}>
                            {children}
                          </code>
                        </div>
                      </div>
                    );
                  },

                  // Tables
                  table: ({ children }) => (
                    <div className="my-4 w-full overflow-hidden rounded-lg border border-zinc-700/50">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">{children}</table>
                      </div>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-zinc-800/50 text-zinc-200 uppercase text-xs font-semibold">{children}</thead>,
                  tbody: ({ children }) => <tbody className="divide-y divide-zinc-700/50 bg-zinc-900/20">{children}</tbody>,
                  tr: ({ children }) => <tr className="hover:bg-zinc-800/30 transition-colors">{children}</tr>,
                  th: ({ children }) => <th className="px-4 py-3 whitespace-nowrap">{children}</th>,
                  td: ({ children }) => <td className="px-4 py-3">{children}</td>,

                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-cyan-500/30 pl-4 my-2 text-zinc-400 italic">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              </div>
            )}
          </div>
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
            <div className="w-10 h-10 -ml-1">
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
