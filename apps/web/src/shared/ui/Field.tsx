import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  error?: string;
  hint?: ReactNode;
};

type InputFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaFieldProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function InputField({ label, error, hint, ...props }: InputFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input aria-invalid={Boolean(error)} {...props} />
      {hint ? <small>{hint}</small> : null}
      {error ? <strong role="alert">{error}</strong> : null}
    </label>
  );
}

export function TextareaField({
  label,
  error,
  hint,
  ...props
}: TextareaFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea aria-invalid={Boolean(error)} {...props} />
      {hint ? <small>{hint}</small> : null}
      {error ? <strong role="alert">{error}</strong> : null}
    </label>
  );
}
