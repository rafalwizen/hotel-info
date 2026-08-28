import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  /** primary = ink pill, secondary = outlined, invert = for dark bands. */
  variant?: "primary" | "secondary" | "invert";
  size?: "sm" | "lg";
  className?: string;
};

/** Pill CTA — the one button component shared by all marketing sections. */
export function CtaLink({ href, children, variant = "primary", size = "lg", className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors",
        size === "sm" ? "h-9 px-4 text-sm" : "h-12 px-7 text-[15px]",
        variant === "primary" && "bg-neutral-900 text-white hover:bg-neutral-700",
        variant === "secondary" &&
          "border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50",
        variant === "invert" && "bg-white text-neutral-900 hover:bg-neutral-200",
        className,
      )}
    >
      {children}
    </Link>
  );
}
