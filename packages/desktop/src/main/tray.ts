import { app, Menu, nativeImage, Tray, BrowserWindow } from "electron"
import { join } from "node:path"
import type { CHANNEL } from "./constants"

let tray: Tray | null = null

export function createTray(opts: {
  channel: string
  onShowWindow: () => void
  onNewSession: () => void
  onQuit: () => void
}): Tray {
  const iconPath = getTrayIconPath(opts.channel)
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  tray.setToolTip(opts.channel === "prod" ? "MiMo Code" : `MiMo Code (${opts.channel})`)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show MiMo Code",
      click: opts.onShowWindow,
    },
    { type: "separator" },
    {
      label: "New Session",
      click: opts.onNewSession,
    },
    { type: "separator" },
    {
      label: "Quit",
      click: opts.onQuit,
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on("click", () => {
    opts.onShowWindow()
  })

  return tray
}

export function destroyTray() {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

export function updateTrayIcon(channel: string) {
  if (!tray) return
  const iconPath = getTrayIconPath(channel)
  const icon = nativeImage.createFromPath(iconPath)
  tray.setImage(icon.resize({ width: 16, height: 16 }))
}

function getTrayIconPath(channel: string): string {
  const isProd = channel === "prod"
  const name = isProd ? "tray-icon.png" : "tray-icon-dev.png"
  return join(__dirname, "../../resources", name)
}

export function minimizeToTray(window: BrowserWindow) {
  window.hide()
}

export function restoreFromTray(window: BrowserWindow) {
  window.show()
  window.focus()
}
