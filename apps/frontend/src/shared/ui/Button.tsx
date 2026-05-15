import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
  }
>;

const variantClasses = {
  primary:
    "border border-transparent bg-blue text-white shadow-[0_14px_28px_rgb(117_187_253/0.26)] hover:enabled:bg-blue-dark",
  secondary:
    "border border-ink bg-transparent text-ink hover:enabled:border-muted hover:enabled:bg-muted hover:enabled:text-white",
  ghost: "bg-white/72 text-ink hover:enabled:bg-white",
} as const;

const baseClasses =
  "inline-flex min-h-12 w-auto shrink-0 cursor-pointer items-center justify-center rounded-full px-5 py-3 font-main text-base font-semibold no-underline transition duration-150 ease-out hover:enabled:-translate-y-px disabled:cursor-not-allowed disabled:opacity-55";

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
