interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

const ToggleSwitch = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) => {
  return (
    <label
      htmlFor={id}
      className={`flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition dark:border-slate-700 dark:bg-slate-950 ${
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
        {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
          checked ? "bg-civic-teal" : "bg-slate-300 dark:bg-slate-700"
        } ${disabled ? "opacity-80" : ""}`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </label>
  );
};

export default ToggleSwitch;
