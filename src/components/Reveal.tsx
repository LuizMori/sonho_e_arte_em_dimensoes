import type { ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";

interface RevealProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
}

export function Reveal({ children, className, as: Tag = "div", delay = 0 }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
