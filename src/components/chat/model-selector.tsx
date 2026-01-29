import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
    id: string;
    name: string;
    description?: string;
    provider?: string;
}

interface ModelSelectorProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type: 'agent' | 'model';
    disabled?: boolean;
}

export function ModelSelector({
    options,
    value,
    onChange,
    placeholder,
    type,
    disabled
}: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.id === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const Icon = type === 'agent' ? Bot : Sparkles;

    if (options.length === 0) return null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                    "bg-zinc-800/50 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-transparent hover:border-white/10",
                    isOpen && "bg-zinc-700/80 text-white border-white/10",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <Icon className="w-3.5 h-3.5 opacity-70" />
                <span className="truncate max-w-[120px]">
                    {selectedOption ? selectedOption.name : placeholder || "Select..."}
                </span>
                {isOpen ? (
                    <ChevronUp className="w-3 h-3 opacity-50" />
                ) : (
                    <ChevronDown className="w-3 h-3 opacity-50" />
                )}
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-[240px] bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 slide-in-from-bottom-2">
                    <div className="p-1">
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                            {options.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                                        "hover:bg-zinc-800",
                                        option.id === value ? "bg-zinc-800/50 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option.name}</span>
                                        {option.id === value && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        )}
                                    </div>
                                    {option.description && (
                                        <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{option.description}</p>
                                    )}
                                    {option.provider && (
                                        <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{option.provider}</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
