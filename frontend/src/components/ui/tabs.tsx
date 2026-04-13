"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

// ── Re-exports ────────────────────────────────────────────────────────────────

export const TabsRoot = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

// ── Tabs (compound component) ─────────────────────────────────────────────────

interface TabItem {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
}

export function Tabs({
  tabs,
  value,
  onValueChange,
  className,
  listClassName,
}: TabsProps) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsPrimitive.List
        className={cn(
          "inline-flex h-10 items-center gap-1 rounded-lg bg-muted p-1",
          listClassName
        )}
      >
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium",
              "text-muted-foreground transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50",
              "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-medium",
                  "bg-muted text-muted-foreground",
                  "data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                )}
              >
                {tab.count}
              </span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
