type SkeletonRowsProps = {
  /** Number of columns to render. Default 5 (Staff, Activity, Description, IP, Date). */
  columnCount?: number;
};

export default function SkeletonRows({ columnCount = 5 }: SkeletonRowsProps) {
  const cells = columnCount === 4 ? (
    <>
      <td className="px-6 py-4">
        <div className="h-5 w-24 rounded-full bg-gray-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-56 rounded bg-gray-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 rounded bg-gray-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
      </td>
    </>
  ) : (
    <>
      <td className="px-6 py-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-1 h-3 w-20 rounded bg-gray-100" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 w-24 rounded-full bg-gray-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-56 rounded bg-gray-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 rounded bg-gray-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
      </td>
    </>
  );

  return (
    <>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <tr key={i} className="animate-pulse">
          {cells}
        </tr>
      ))}
    </>
  );
}
