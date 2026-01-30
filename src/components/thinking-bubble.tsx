'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ThinkingBubbleProps {
    visible: boolean;
    className?: string;
    icon?: LucideIcon;
    showIcon?: boolean;
}

export function ThinkingBubble({ visible, className, icon: Icon, showIcon }: ThinkingBubbleProps) {
    return (
        <div
            className={cn(
                "thinking-bubble text-white flex items-center justify-center min-w-[50px] min-h-[30px]",
                visible ? "thinking-bubble-visible" : "thinking-bubble-hidden",
                className
            )}
        >
            <div className="relative flex items-center justify-center w-full h-full">
                {/* Dots Layer */}
                <div
                    className={cn(
                        "thinking-dots absolute inset-0 flex items-center justify-center gap-1 transition-all duration-500 ease-out",
                        showIcon ? "opacity-0 scale-50" : "opacity-100 scale-100"
                    )}
                >
                    <span className="thinking-dot block shrink-0" style={{ animationDelay: '0ms' }}></span>
                    <span className="thinking-dot block shrink-0" style={{ animationDelay: '300ms' }}></span>
                    <span className="thinking-dot block shrink-0" style={{ animationDelay: '600ms' }}></span>
                </div>

                {/* Icon Layer */}
                {Icon && (
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out",
                            showIcon ? "opacity-100 scale-100" : "opacity-0 scale-50"
                        )}
                    >
                        <Icon className="thinking-icon w-5 h-5" />
                    </div>
                )}
            </div>
        </div>
    );
}
