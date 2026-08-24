import { cn } from "@/lib/utils";

interface SectionTitleProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}

export function SectionTitle({
  label,
  title,
  description,
  align = "left",
  light = false,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn(align === "center" && "text-center mx-auto", className)}>
      {label && (
        <p className={cn("label-caps mb-4", light ? "text-orange" : "text-magenta")}>{label}</p>
      )}
      <h2
        className={cn(
          "font-display font-medium tracking-tightest text-4xl sm:text-5xl md:text-6xl leading-[1.05]",
          light ? "text-cream-light" : "text-navy"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 text-base sm:text-lg max-w-xl leading-relaxed",
            align === "center" && "mx-auto",
            light ? "text-cream-light/80" : "text-navy/70"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
