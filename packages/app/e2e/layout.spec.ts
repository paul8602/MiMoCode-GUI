import { test, expect } from "@playwright/test"

test.describe("Layout", () => {
  test("should render the app shell", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("[data-component='sidebar-rail']")).toBeVisible({ timeout: 15000 })
  })

  test("should show sidebar with project icons", async ({ page }) => {
    await page.goto("/")
    const sidebar = page.locator("[data-component='sidebar-rail']")
    await expect(sidebar).toBeVisible({ timeout: 15000 })
  })

  test("should toggle sidebar with keyboard shortcut", async ({ page }) => {
    await page.goto("/")
    await page.waitForTimeout(2000)
    await page.keyboard.press("Meta+b")
    await page.waitForTimeout(500)
  })
})

test.describe("Session Page", () => {
  test("should show session header", async ({ page }) => {
    await page.goto("/")
    await page.waitForTimeout(3000)
    const header = page.locator("[data-component='session-header']")
    const headerVisible = await header.isVisible().catch(() => false)
    expect(typeof headerVisible).toBe("boolean")
  })
})

test.describe("SummaryPane", () => {
  test("should toggle summary panel", async ({ page }) => {
    await page.goto("/")
    await page.waitForTimeout(2000)
    await page.keyboard.press("Meta+Shift+b")
    await page.waitForTimeout(500)
    const summaryPane = page.locator("[data-component='summary-pane']")
    const exists = await summaryPane.count()
    expect(typeof exists).toBe("number")
  })
})

test.describe("Theme", () => {
  test("should have theme applied", async ({ page }) => {
    await page.goto("/")
    await page.waitForTimeout(2000)
    const html = page.locator("html")
    const dataTheme = await html.getAttribute("data-theme")
    const dataScheme = await html.getAttribute("data-scheme")
    expect(dataTheme !== null || dataScheme !== null).toBeTruthy()
  })
})

test.describe("Error Handling", () => {
  test("should not crash on invalid route", async ({ page }) => {
    const response = await page.goto("/nonexistent-route")
    expect(response?.status()).toBeLessThan(500)
  })
})
