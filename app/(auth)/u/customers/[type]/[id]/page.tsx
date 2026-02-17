"use client";

import { useParams } from "next/navigation";
import {
  PersonalCustomerDetail,
  CorporateCustomerDetail,
} from "@/components/customers";

export default function CustomerDetailPage() {
  const params = useParams();
  const type = params.type as string;
  const id = params.id as string;

  if (type === "corporate") {
    return <CorporateCustomerDetail id={id} />;
  }

  if (type === "personal") {
    return <PersonalCustomerDetail id={id} />;
  }

  return (
    <div className="p-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Invalid customer type. Please use a valid link.
      </div>
      <a
        href="/u/customers"
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
      >
        ← Back to customers
      </a>
    </div>
  );
}
