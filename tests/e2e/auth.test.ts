import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const baseUrl = "http://127.0.0.1:4173";
const password = process.env.DEMO_PASSWORD ?? "Demo1234!";

let browser: Browser;
const contexts: BrowserContext[] = [];

beforeAll(async () => {
  browser = await chromium.launch();
});

afterEach(async () => {
  await Promise.all(contexts.splice(0).map((context) => context.close()));
});

afterAll(async () => {
  await browser?.close();
});

async function newPage(): Promise<Page> {
  const context = await browser.newContext();
  contexts.push(context);
  return context.newPage();
}

async function login(page: Page, email: string): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
}

describe("authentication", () => {
  it("logs a manager in and redirects to objects", async () => {
    const page = await newPage();
    await login(page, "manager@demo.local");

    await page.getByRole("heading", { name: "Объекты" }).waitFor();
    expect(await page.getByText("Ирина Петрова").isVisible()).toBe(true);
  });

  it("logs a worker in and redirects to my tasks", async () => {
    const page = await newPage();
    await login(page, "worker1@demo.local");

    await page.getByRole("heading", { name: "Мои задачи" }).waitFor();
    expect(await page.getByText("Алексей Смирнов").isVisible()).toBe(true);
  });

  it("shows an error for a wrong password", async () => {
    const page = await newPage();
    await page.goto(`${baseUrl}/login`);
    await page.getByLabel("Email").fill("manager@demo.local");
    await page.getByLabel("Пароль").fill("wrong-password");
    await page.getByRole("button", { name: "Войти" }).click();

    await page.getByText("Неверный email или пароль.").waitFor();
  });

  it("logs out", async () => {
    const page = await newPage();
    await login(page, "manager@demo.local");
    await page.getByRole("heading", { name: "Объекты" }).waitFor();

    await page.getByRole("button", { name: /Ирина Петрова/ }).click();
    await page.getByRole("menuitem", { name: "Выйти" }).click();

    await page.getByRole("heading", { name: "Вход" }).waitFor();
  });

  it("does not let a manager open the worker-only route", async () => {
    const page = await newPage();
    await login(page, "manager@demo.local");
    await page.getByRole("heading", { name: "Объекты" }).waitFor();

    await page.goto(`${baseUrl}/my-tasks`);
    await page.getByRole("heading", { name: "Объекты" }).waitFor();
  });
});
