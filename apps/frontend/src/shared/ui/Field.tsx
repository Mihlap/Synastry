import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  error?: string;
  hint?: ReactNode;
};

type InputFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaFieldProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

const controlClasses =
  "w-full rounded-[18px] border border-line bg-white/82 px-4 py-3.5 font-ui text-ink outline-none transition focus:border-blue focus:bg-white focus:shadow-[0_0_0_4px_rgb(117_187_253/0.18)]";

const hintClasses = "font-main text-sm text-muted";
const errorClasses = "font-ui text-[0.84rem] font-medium leading-snug text-crimson";

export function InputField({ label, error, hint, id, className = "", ...props }: InputFieldProps) {
  const fieldId = id ?? useId();

  return (
    <label className="grid gap-2 font-semibold text-ink" htmlFor={fieldId}>
      <span>{label}</span>
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`${controlClasses} ${className}`.trim()}
        {...props}
      />
      {hint ? <small className={hintClasses}>{hint}</small> : null}
      {error ? (
        <strong role="alert" className={errorClasses}>
          {error}
        </strong>
      ) : null}
    </label>
  );
}

export function TextareaField({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: TextareaFieldProps) {
  const fieldId = id ?? useId();

  return (
    <label className="grid gap-2 font-semibold text-ink" htmlFor={fieldId}>
      <span>{label}</span>
      <textarea
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`${controlClasses} ${className}`.trim()}
        {...props}
      />
      {hint ? <small className={hintClasses}>{hint}</small> : null}
      {error ? (
        <strong role="alert" className={errorClasses}>
          {error}
        </strong>
      ) : null}
    </label>
  );
}
