"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "flowbite-react";
import { lightModalTheme } from "@/constants/theme";
import { getHigherEscalationTiers } from "@/constants/roles";

type Props = {
  open: boolean;
  handleClose: () => void;
  onConfirm: (toRole: string, reason?: string) => void;
  isPending: boolean;
  /** Current assignee role (or user's role for escalation options). */
  currentRole: string;
};

export default function EscalateCustomerModal({
  open,
  handleClose,
  onConfirm,
  isPending,
  currentRole,
}: Props) {
  const [toRole, setToRole] = useState("");
  const [reason, setReason] = useState("");

  const escalationTargets = getHigherEscalationTiers(currentRole);

  const handleConfirm = () => {
    if (!toRole) return;
    onConfirm(toRole, reason.trim() || undefined);
    setToRole("");
    setReason("");
  };

  const handleCloseModal = () => {
    setToRole("");
    setReason("");
    handleClose();
  };

  return (
    <Modal
      dismissible
      show={open}
      onClose={handleCloseModal}
      size="md"
      theme={lightModalTheme}
    >
      <ModalHeader>Escalate to higher tier</ModalHeader>
      <ModalBody>
        <p className="mb-4 text-gray-900!">
          Escalate this application to a higher approval tier. Select the role
          you want to escalate to. You can optionally add a reason.
        </p>
        <div className="mb-4">
          <label
            htmlFor="escalate-to-role"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Escalate to
          </label>
          <select
            id="escalate-to-role"
            value={toRole}
            onChange={(e) => setToRole(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select role</option>
            {escalationTargets.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="escalate-reason"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Reason (optional)
          </label>
          <textarea
            id="escalate-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for escalation..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isPending}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={handleCloseModal}
          disabled={isPending}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending || !toRole}
          className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Escalating…" : "Escalate"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
