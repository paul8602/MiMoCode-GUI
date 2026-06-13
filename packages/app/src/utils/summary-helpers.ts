import type { Part } from "@mimo-ai/sdk/v2/client"
import type { SourceItem } from "@/components/summary/summary-pane"

export function extractSourcesFromParts(parts: Part[][]): SourceItem[] {
  const sourceMap = new Map<string, SourceItem>()

  for (const partList of parts) {
    for (const part of partList) {
      if (part.type !== "file") continue
      const filePart = part as Part & { filename?: string; source?: { text?: { start?: number; end?: number } } }
      const path = filePart.filename
      if (!path) continue

      const existing = sourceMap.get(path)
      if (existing) {
        existing.references++
        if (filePart.source?.text?.start !== undefined) {
          existing.lineStart = filePart.source.text.start
          existing.lineEnd = filePart.source.text.end
        }
      } else {
        sourceMap.set(path, {
          path,
          lineStart: filePart.source?.text?.start,
          lineEnd: filePart.source?.text?.end,
          references: 1,
        })
      }
    }
  }

  return [...sourceMap.values()].sort((a, b) => b.references - a.references)
}

export function extractArtifactsFromDiffs(
  diffs: { file: string; additions: number; deletions: number; status?: string }[],
): { id: string; type: "file_created" | "file_modified" | "diff"; path: string; description: string; timestamp: number }[] {
  const now = Date.now()
  return diffs.map((diff, index) => ({
    id: `diff-${index}`,
    type: diff.status === "added" ? "file_created" as const : "file_modified" as const,
    path: diff.file,
    description: `+${diff.additions} / -${diff.deletions}`,
    timestamp: now,
  }))
}
