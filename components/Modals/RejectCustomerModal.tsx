"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "flowbite-react";
import { lightModalTheme } from "@/constants/theme";

type Props = {
  open: boolean;
  handleClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
};

export default function RejectCustomerModal({
  open,
  handleClose,
  onConfirm,
  isPending,
}: Props) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason("");
  };

  const handleCloseModal = () => {
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
      <ModalHeader>Reject application</ModalHeader>
      <ModalBody>
        <p className="mb-4 text-gray-900!">
          Please provide a reason for rejecting this application. This will be
          recorded and visible to the applicant.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={isPending}
        />
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
          disabled={isPending || !reason.trim()}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Rejecting…" : "Reject"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
