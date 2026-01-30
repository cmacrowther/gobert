'use client';

import { useState, useCallback } from "react";
import { useGobert } from "@/hooks/use-gobert";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatList } from "@/components/chat/chat-list";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GobertHead, DEFAULT_GAZE } from "@/components/gobert-head";

// Gaze target when looking at the text input (looking down)
const INPUT_GAZE_BASE: [number, number] = [0, -0.8];

export default function Home() {
  const {
    messages,
    sendMessage,
    isConnected,
    error,
    clearHistory,
    isLoaded,
    isWaitingForResponse,
    availableAgents,
    selectedAgent,
    setSelectedAgent
  } = useGobert();
  const [gazeTarget, setGazeTarget] = useState<[number, number]>(DEFAULT_GAZE);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Update gaze when input focus changes
  const handleInputFocusChange = useCallback((isFocused: boolean) => {
    setIsInputFocused(isFocused);
    if (isFocused) {
      // Look down at the input when focused
      setGazeTarget(INPUT_GAZE_BASE);
    } else {
      // Return to default gaze when input loses focus
      setGazeTarget(DEFAULT_GAZE);
    }
  }, []);

  const handleCursorPositionChange = useCallback((normalizedX: number) => {
    if (isInputFocused) {
      // Scale the horizontal movement (reduce intensity for subtlety)
      const scaledX = normalizedX * 0.4;
      setGazeTarget([scaledX, INPUT_GAZE_BASE[1]]);
    }
  }, [isInputFocused]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-foreground relative">
      {/* Header */}
      <header className="fixed top-0 w-full flex items-center justify-between p-4 z-10 bg-background/80 backdrop-blur-md">
        <div className="flex items-center inline-flex gap-2">
          <h1 className="text-xl font-bold tracking-tight inline-flex items-center">Gobert. <span style={{ marginLeft: "6px" }} className="gradient-badge inline-flex items-center rounded-md px-2 py-1 text-sm font-light">Web Chat</span></h1>
        </div>
        <Button variant="ghost" size="icon" onClick={clearHistory} title="Clear History" className="hover:bg-zinc-800 rounded-full">
          <Trash2 className="h-5 w-5 text-muted-foreground" />
        </Button>
      </header>

      {/* Main Chat Area - Centered and constrained width */}
      <div className="flex-1 w-full max-w-3xl flex flex-col pt-20 pb-32 px-4 sm:px-0">
        {!isLoaded ? null : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Floating Head for Empty State */}
            <div className="relative w-[200px] h-[200px] flex items-center justify-center animate-fade-in-up -mb-2">
              <GobertHead className="w-full h-full" style={{ marginLeft: "6px" }} gazeTarget={gazeTarget} />
              {/* Orbiting Electrons - Atomic Model */}
              <div className="orbit-container" style={{ zIndex: "-100" }}>
                {/* Ring 1 with orbiting electron */}
                <div className="orbit-ring orbit-ring-1">
                  <div className="electron-carrier electron-carrier-1">
                    <div className="electron"></div>
                  </div>
                </div>
                {/* Ring 2 with orbiting electron */}
                <div className="orbit-ring orbit-ring-2">
                  <div className="electron-carrier electron-carrier-2">
                    <div className="electron"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center" style={{ marginTop: "-45px" }}>
              <h1 className="text-3xl font-bold tracking-tight animate-fade-in-up animate-delay-100 inline-flex items-center gap-2">
                Gobert. <span className="gradient-badge inline-flex items-center rounded-md px-2 py-1 text-lg font-light">Web Chat</span>
              </h1>
              <p className="text-lg font-light text-muted-foreground animate-fade-in-up animate-delay-200 mt-1">How can I help you today?</p>
            </div>
          </div>
        ) : (
          <ChatList messages={messages} gazeTarget={gazeTarget} isWaitingForResponse={isWaitingForResponse} />
        )}
      </div>

      {/* Error Message */}

      {!isConnected ? (
        <div style={{ marginBottom: "65px" }} className="fixed inline-flex items-center bottom-24 left-1/2 transform animate-pulse -translate-x-1/2 bg-red-900/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Reconnecting...</span>
        </div>
      ) : ""}

      {/* Input Area - Floating at bottom */}
      <div className="fixed bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 z-20 flex justify-center px-4">
        <div className="w-full max-w-3xl">
          <ChatInput
            onSend={sendMessage}
            disabled={!isConnected}
            onFocusChange={handleInputFocusChange}
            onCursorPositionChange={handleCursorPositionChange}
            availableAgents={availableAgents}
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
          />
          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] uppercase tracking-widest text-white/20 select-none font-medium">
            {isConnected ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full animate-pulse bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Connected at {process.env.NEXT_PUBLIC_CLAWDBOT_URL || "ws://localhost:18789"}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Could not connect to {process.env.NEXT_PUBLIC_CLAWDBOT_URL || "ws://localhost:18789"}
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
