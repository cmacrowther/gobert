import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useState, FormEvent, useRef, useEffect, useCallback } from "react";
import { ModelSelector } from "./model-selector";
import { Agent, Model } from "@/hooks/use-gobert";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onFocusChange?: (isFocused: boolean) => void;
  onCursorPositionChange?: (normalizedX: number) => void;
  availableAgents?: Agent[];
  availableModels?: Model[];
  selectedAgent?: string;
  selectedModel?: string;
  onAgentChange?: (agentId: string) => void;
  onModelChange?: (modelId: string) => void;
}

export function ChatInput({
  onSend,
  disabled,
  onFocusChange,
  onCursorPositionChange,
  availableAgents = [],
  availableModels = [],
  selectedAgent = "",
  selectedModel = "",
  onAgentChange,
  onModelChange
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      // Reset cursor position to center when submitted
      onCursorPositionChange?.(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Calculate and emit gaze position based on text length
  // The head follows the end of the string as it grows
  const updateGazePosition = useCallback(() => {
    if (!textareaRef.current) return;

    const textLength = textareaRef.current.value.length;

    // Normalize text length to a range of -1 to 1
    // Empty text = -1 (head looks left)
    // Max expected length (~100 chars) = 1 (head looks right)
    const maxLength = 100;
    const normalizedX = Math.min(textLength / maxLength, 1) * 2 - 1;

    onCursorPositionChange?.(normalizedX);
  }, [onCursorPositionChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Update gaze position based on new text length
    setTimeout(updateGazePosition, 0);

  };

  const handleSelect = () => {
    updateGazePosition();
  };

  const handleFocus = () => {
    onFocusChange?.(true);
    updateGazePosition();
  };

  const handleBlur = () => {
    onFocusChange?.(false);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col w-full gap-2 p-3 bg-zinc-800/50 backdrop-blur-xl border border-white/10 rounded-[32px] hover:border-white/20 transition-colors focus-within:border-white/20 focus-within:bg-zinc-800/80 shadow-lg"
    >
      <div className="flex w-full items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Message Gobert..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none resize-none max-h-[200px] py-3 px-2 text-base text-white placeholder:text-zinc-400 min-h-[52px]"
          style={{ scrollbarWidth: 'none' }}
        />
        <div className="pb-1.5 pr-1">
          <Button
            type="submit"
            size="icon"
            disabled={disabled || !input.trim()}
            className="rounded-full h-10 w-10 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-500"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 pb-1">
        {availableAgents.length > 0 && (
          <ModelSelector
            type="agent"
            options={availableAgents}
            value={selectedAgent}
            onChange={onAgentChange || (() => { })}
            disabled={disabled}
            placeholder="Select Agent"
          />
        )}
        {availableModels.length > 0 && (
          <ModelSelector
            type="model"
            options={availableModels}
            value={selectedModel}
            onChange={onModelChange || (() => { })}
            disabled={disabled}
            placeholder="Select Model"
          />
        )}
      </div>
    </form>
  );
}
