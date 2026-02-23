interface SubmitConfirmModalProps {
  counterParty: string;
  investmentAmount: string;
  profitRate: string;
  tenorDays: number;
  startDate: string;
  endDate: string;
  accruedDaysCutoff: number;
  daysToMaturity: number;
  accruedProfitCutoff: string;
  accruedProfitEndDate: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function SubmitConfirmModal({
  counterParty,
  investmentAmount,
  profitRate,
  tenorDays,
  startDate,
  endDate,
  accruedDaysCutoff,
  daysToMaturity,
  accruedProfitCutoff,
  accruedProfitEndDate,
  onConfirm,
  onCancel,
  isSubmitting,
}: SubmitConfirmModalProps) {
  const formattedStart = startDate
    ? new Date(startDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
  const formattedEnd = endDate
    ? new Date(endDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Confirm Portfolio Asset
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Please review the details below before creating.
        </p>

        <div className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Counter Party</span>
            <span className="font-medium text-gray-900">{counterParty}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Investment Amount</span>
            <span className="font-medium text-gray-900">
              ₦{investmentAmount || "0"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Profit Rate</span>
            <span className="font-medium text-gray-900">{profitRate}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Tenor</span>
            <span className="font-medium text-gray-900">{tenorDays} days</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Period</span>
            <span className="font-medium text-gray-900">
              {formattedStart} → {formattedEnd}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Accrued Days (Cut-off)</span>
            <span className="font-medium text-gray-900">
              {accruedDaysCutoff} days
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Days to Maturity</span>
            <span className="font-medium text-gray-900">{daysToMaturity} days</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Accrued Profit (Cut-off)</span>
            <span className="font-medium text-gray-900">
              {accruedProfitCutoff}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Accrued Profit (End Date)</span>
            <span className="font-medium text-gray-900">
              {accruedProfitEndDate}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating…
              </>
            ) : (
              "Confirm & Create"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
