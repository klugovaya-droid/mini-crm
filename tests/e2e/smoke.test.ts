import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = "http://127.0.0.1:4173";

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
});

describe("smoke", () => {
  it("opens the login screen", async () => {
    const page = await browser.newPage();
    await page.goto(baseUrl);
    await page.getByRole("heading", { name: "Вход" }).waitFor();
    expect(await page.title()).toContain("Мини-CRM");
    await page.close();
  });
});
