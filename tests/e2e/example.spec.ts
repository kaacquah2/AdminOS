import { test, expect } from "@playwright/test"

test("homepage loads", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/AdminOS/i)
})

test("login page is accessible", async ({ page }) => {
  await page.goto("/")
  // Add your login page tests here
})

