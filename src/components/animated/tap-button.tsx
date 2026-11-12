"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type TapButtonProps = HTMLMotionProps<"button"> & {
  variant?: "primary" | "emerald" | "secondary" | "ghost";
};

const variantClasses: Record<string, string> = {
  primary:
    "bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-600/30 ring-1 ring-inset ring-white/20 disabled:bg-slate-400 disabled:bg-none disabled:shadow-none disabled:ring-0",
  emerald:
    "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-inset ring-white/20 disabled:bg-slate-400 disabled:bg-none disabled:shadow-none disabled:ring-0",
  secondary: "bg-muted text-foreground",
  ghost: "bg-transparent text-foreground",
};

export function TapButton({
  className,
  variant = "primary",
  disabled,
  children,
  ...props
}: TapButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-[15px] font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
