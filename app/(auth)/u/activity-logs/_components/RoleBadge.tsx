import { useRoles } from "@/services/roles";

export default function RoleBadge({ role }: { role: string }) {
  const { data: roles = [] } = useRoles();
  const label =
    roles.find((r) => r.name === role)?.label ?? role.replace(/_/g, " ");

  return (
    <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
      {label}
    </span>
  );
}
