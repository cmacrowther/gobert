'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ThinkingBubbleProps {
    visible: boolean;
    className?: string;
}

export function ThinkingBubble({ visible, className }: ThinkingBubbleProps) {
    return (
        <div
            className={cn(
                "thinking-bubble",
                visible ? "thinking-bubble-visible" : "thinking-bubble-hidden",
                className
            )}
        >
            <div className="thinking-dots">
                <span className="thinking-dot" style={{ animationDelay: '0ms' }}></span>
                <span className="thinking-dot" style={{ animationDelay: '150ms' }}></span>
                <span className="thinking-dot" style={{ animationDelay: '300ms' }}></span>
            </div>
        </div>
    );
}
