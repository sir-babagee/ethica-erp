interface AfterSaveModalProps {
  investmentRef: string;
  onEnterAnother: () => void;
  onDone: () => void;
}

export function AfterSaveModal({
  investmentRef,
  onEnterAnother,
  onDone,
}: AfterSaveModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-base font-semibold text-gray-900">
          Entry Saved
        </h3>
        <p className="mb-6 text-sm text-gray-500">
          Investment <strong>{investmentRef}</strong> has been created and is
          pending CFO approval.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onEnterAnother}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Enter Another Entry
          </button>
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Done — Back to Transactions
          </button>
        </div>
      </div>
    </div>
  );
}
