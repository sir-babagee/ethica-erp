"use client";

import { Modal, ModalBody, ModalFooter, ModalHeader } from "flowbite-react";
import { lightModalTheme } from "@/constants/theme";

type Props = {
  open: boolean;
  handleClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
};

export default function ApproveCustomerModal({
  open,
  handleClose,
  onConfirm,
  isPending,
}: Props) {
  return (
    <Modal
      dismissible
      show={open}
      onClose={handleClose}
      size="md"
      theme={lightModalTheme}
    >
      <ModalHeader>Approve customer</ModalHeader>
      <ModalBody>
        <p className="text-gray-900!">
          Are you sure you want to approve this customer? This will mark the
          application as approved and assign a customer ID.
        </p>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          disabled={isPending}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Approving…" : "Confirm"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
