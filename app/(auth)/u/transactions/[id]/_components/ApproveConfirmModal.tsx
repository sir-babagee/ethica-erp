interface ApproveConfirmModalProps {
  investmentRef: string;
  customerName: string;
  investmentAmount: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function ApproveConfirmModal({
  investmentRef,
  customerName,
  investmentAmount,
  onConfirm,
  onCancel,
  loading,
}: ApproveConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-6 w-6 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-base font-semibold text-gray-900">
          Approve Investment
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Are you sure you want to approve this investment entry?
        </p>
        <div className="mb-6 space-y-2 rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Reference</span>
            <span className="font-mono font-medium text-gray-900">
              {investmentRef}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Customer</span>
            <span className="font-medium text-gray-900">{customerName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium text-gray-900">{investmentAmount}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Approving…
              </>
            ) : (
              "Confirm Approve"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
