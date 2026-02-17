import { ACTION_LABELS, ACTION_STYLES } from "./constants";

export default function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action] ?? "bg-gray-100 text-gray-700";
  const label = ACTION_LABELS[action] ?? action.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {label}
    </span>
  );
}
