interface LabeledFieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

export function LabeledField({ label, children, hint }: LabeledFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
