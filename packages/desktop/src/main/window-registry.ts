import { BrowserWindow } from "electron"

export interface WindowEntry {
  id: string
  window: BrowserWindow
  projectPath?: string
  createdAt: number
}

const windows = new Map<string, WindowEntry>()

export function registerWindow(entry: WindowEntry): void {
  windows.set(entry.id, entry)
  entry.window.once("closed", () => {
    windows.delete(entry.id)
  })
}

export function unregisterWindow(id: string): void {
  windows.delete(id)
}

export function getWindow(id: string): WindowEntry | undefined {
  return windows.get(id)
}

export function getAllWindows(): WindowEntry[] {
  return [...windows.values()]
}

export function getWindowCount(): number {
  return windows.size
}

export function getFocusedWindow(): WindowEntry | undefined {
  const focused = BrowserWindow.getFocusedWindow()
  if (!focused) return undefined
  for (const entry of windows.values()) {
    if (entry.window === focused) return entry
  }
  return undefined
}

export function findWindowByProject(projectPath: string): WindowEntry | undefined {
  for (const entry of windows.values()) {
    if (entry.projectPath === projectPath) return entry
  }
  return undefined
}

export function generateWindowId(): string {
  return `win_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
