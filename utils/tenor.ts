export function parseTenorDays(tenorStr: string): number {
  if (!tenorStr) return 0;
  const match = tenorStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
