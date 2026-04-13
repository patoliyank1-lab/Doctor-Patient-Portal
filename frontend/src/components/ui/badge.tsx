import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground border-transparent",
        secondary:   "bg-secondary text-secondary-foreground border-transparent",
        success:     "bg-green-50 text-green-700 border-green-200",
        warning:     "bg-amber-50 text-amber-700 border-amber-200",
        danger:      "bg-red-50 text-red-700 border-red-200",
        info:        "bg-blue-50 text-blue-700 border-blue-200",
        purple:      "bg-purple-50 text-purple-700 border-purple-200",
        outline:     "bg-transparent text-foreground border-border",
        ghost:       "bg-muted text-muted-foreground border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
