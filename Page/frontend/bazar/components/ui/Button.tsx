"use client";
// ============================================================
// components/ui/Button.tsx — Botón reutilizable con variantes
// ============================================================
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "gradient-brand text-white font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50",
  secondary:
    "bg-[#FFC22F] text-[#111] font-semibold hover:bg-[#E5A800] active:scale-[0.98] disabled:opacity-50",
  outline:
    "border-2 border-[#FB4318] text-[#FB4318] font-semibold bg-transparent hover:bg-[#FFF7ED] active:scale-[0.98] disabled:opacity-50",
  ghost:
    "bg-transparent text-[#6B6B6B] hover:bg-[#F1F1F1] font-medium active:scale-[0.98] disabled:opacity-50",
  danger:
    "bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-[0.98] disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  "px-3 py-1.5 text-sm rounded-lg",
  md:  "px-5 py-2.5 text-sm rounded-xl",
  lg:  "px-7 py-3.5 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none focus-ring",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Cargando...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
