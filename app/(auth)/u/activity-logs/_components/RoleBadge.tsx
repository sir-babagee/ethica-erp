import { ROLE_LABELS } from "./constants";

export default function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
      {ROLE_LABELS[role] ?? role.replace(/_/g, " ")}
    </span>
  );
}
