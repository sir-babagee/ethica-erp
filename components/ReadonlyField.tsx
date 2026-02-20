interface ReadonlyFieldProps {
  value: string;
}

export function ReadonlyField({ value }: ReadonlyFieldProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
      {value || "—"}
    </div>
  );
}
