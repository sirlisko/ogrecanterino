export function topTags(lists: string[][], limit: number): string[] {
  const counts = new Map<string, number>()
  for (const tags of lists) for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([t]) => t)
}
