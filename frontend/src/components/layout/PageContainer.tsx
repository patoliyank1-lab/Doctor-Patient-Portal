import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function PageContainer({
  title,
  subtitle,
  action,
  children,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-8 space-y-6 md:space-y-8", 
        className
      )} 
      {...props}
    >
      {/* Header Section */}
      {(title || subtitle || action) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="flex items-center shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      
      {/* Main Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
