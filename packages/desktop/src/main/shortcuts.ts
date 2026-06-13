import { globalShortcut, app } from "electron"

export interface ShortcutConfig {
  showHide: string
  newSession: string
}

const DEFAULT_SHORTCUTS: ShortcutConfig = {
  showHide: "CommandOrControl+Shift+M",
  newSession: "CommandOrControl+Shift+N",
}

export function registerGlobalShortcuts(opts: {
  config?: Partial<ShortcutConfig>
  onShowHide: () => void
  onNewSession: () => void
}): void {
  const config = { ...DEFAULT_SHORTCUTS, ...opts.config }

  const showHideSuccess = globalShortcut.register(config.showHide, () => {
    opts.onShowHide()
  })

  if (!showHideSuccess) {
    console.warn(`Failed to register shortcut: ${config.showHide}`)
  }

  const newSessionSuccess = globalShortcut.register(config.newSession, () => {
    opts.onNewSession()
  })

  if (!newSessionSuccess) {
    console.warn(`Failed to register shortcut: ${config.newSession}`)
  }
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
}

export function isShortcutRegistered(accelerator: string): boolean {
  return globalShortcut.isRegistered(accelerator)
}
