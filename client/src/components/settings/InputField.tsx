import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  touched?: boolean;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  action?: ReactNode;
}

const InputField = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  helperText,
  error,
  touched = false,
  type = "text",
  autoComplete,
  disabled = false,
  icon: Icon,
  action,
}: InputFieldProps) => {
  const showError = touched && Boolean(error);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {label}
      </label>
      <div
        className={`group flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition dark:bg-slate-950 ${
          showError
            ? "border-rose-300 ring-2 ring-rose-100 dark:border-rose-800 dark:ring-rose-950/50"
            : "border-slate-200 hover:border-slate-300 focus-within:border-civic-teal focus-within:ring-2 focus-within:ring-civic-teal/20 dark:border-slate-700 dark:hover:border-slate-600"
        } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
      >
        {Icon ? <Icon size={18} className="shrink-0 text-slate-400 transition group-focus-within:text-civic-teal" /> : null}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0 shadow-none ring-0 placeholder:text-slate-400 focus:border-0 focus:ring-0 dark:bg-transparent"
          aria-invalid={showError}
          aria-describedby={`${id}-hint`}
        />
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <p id={`${id}-hint`} className={`text-sm ${showError ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
        {showError ? error : helperText}
      </p>
    </div>
  );
};

export default InputField;
