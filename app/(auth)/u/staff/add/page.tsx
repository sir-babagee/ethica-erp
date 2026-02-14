"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { useCreateStaff } from "@/services/staff";
import { CREATABLE_ROLES, PERMISSIONS } from "@/constants/roles";
import { useAuthStore } from "@/stores/authStore";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy {label}
        </>
      )}
    </button>
  );
}

export default function AddStaffPage() {
  const router = useRouter();
  const permissions = useAuthStore((s) => s.permissions);

  useEffect(() => {
    if (permissions.length > 0 && !permissions.includes(PERMISSIONS.STAFF_CREATE)) {
      router.replace("/u/dashboard");
    }
  }, [permissions, router]);

  const [createdStaff, setCreatedStaff] = useState<{
    email: string;
    tempPassword: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  const EMAIL_DOMAIN = "@ethicacapitalltd.com";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailLocalPart, setEmailLocalPart] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: createStaff, isPending } = useCreateStaff();

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    if (value.trim() && lastName.trim()) {
      const suggested = `${value.trim().toLowerCase().replace(/\s+/g, "")}.${lastName.trim().toLowerCase().replace(/\s+/g, "")}`;
      setEmailLocalPart(suggested);
    }
  };

  const handleLastNameChange = (value: string) => {
    setLastName(value);
    if (firstName.trim() && value.trim()) {
      const suggested = `${firstName.trim().toLowerCase().replace(/\s+/g, "")}.${value.trim().toLowerCase().replace(/\s+/g, "")}`;
      setEmailLocalPart(suggested);
    }
  };

  const fullEmail = emailLocalPart ? `${emailLocalPart}${EMAIL_DOMAIN}` : "";

  const validate = () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "First name is required";
    if (!lastName.trim()) next.lastName = "Last name is required";
    if (!emailLocalPart.trim()) next.email = "Email is required";
    else if (!/^[A-Z0-9._%+-]+$/i.test(emailLocalPart)) {
      next.email = "Invalid email format";
    }
    if (!role) next.role = "Role is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createStaff({ firstName, lastName, email: fullEmail, role }, {
      onSuccess: (res) => {
        const { email: resEmail, tempPassword, firstName: resFirstName, lastName: resLastName } = res.data;
        setCreatedStaff({ email: resEmail, tempPassword, firstName: resFirstName, lastName: resLastName });
        setFirstName("");
        setLastName("");
        setEmailLocalPart("");
        setRole("");
        setErrors({});
        toast.success("Staff created successfully");
      },
      onError: (error) => {
        const message =
          axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : "Failed to create staff";
        toast.error(message);
      },
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add Staff</h1>
        <p className="mt-1 text-gray-500">
          Create a new staff account. They will need to change their password on first login.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Staff Details
          </h2>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1.5 flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <input
                  id="email"
                  type="text"
                  value={emailLocalPart}
                  onChange={(e) => setEmailLocalPart(e.target.value)}
                  placeholder="john.doe"
                  className="flex-1 rounded-l-lg border-0 bg-transparent px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                  autoComplete="off"
                />
                <span className="select-none border-l border-gray-200 px-4 py-2.5 text-gray-500">
                  {EMAIL_DOMAIN}
                </span>
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select role</option>
                {CREATABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating..." : "Create Staff"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Login Credentials
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Share these details with the new staff member. The password can only be shown once.
          </p>

          {createdStaff ? (
            <div className="mt-6 space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                  Staff Name
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {createdStaff.firstName} {createdStaff.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                  Email (Username)
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-white px-2 py-1 font-mono text-sm text-gray-900">
                    {createdStaff.email}
                  </code>
                  <CopyButton text={createdStaff.email} label="email" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                  Temporary Password
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-white px-2 py-1 font-mono text-sm text-gray-900">
                    {createdStaff.tempPassword}
                  </code>
                  <CopyButton text={createdStaff.tempPassword} label="password" />
                </div>
              </div>
              <p className="text-xs text-amber-700">
                They will be prompted to change this password on first login.
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm text-gray-500">
                Create a staff member to see their login credentials here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
