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

describe("projects", () => {
  it("lets a manager create, edit and archive an object", async () => {
    const page = await newPage();
    const name = `Тестовый ЖК ${Date.now()}`;
    const editedName = `${name} (изм.)`;

    await login(page, "manager@demo.local");
    await page.getByRole("heading", { name: "Объекты" }).waitFor();

    await page.getByRole("button", { name: "Создать объект" }).click();
    await page.getByLabel("Название").fill(name);
    await page.getByLabel("Адрес").fill("г. Москва, ул. Тестовая, 1");
    await page.getByRole("button", { name: "Сохранить" }).click();

    await page.getByRole("heading", { name }).waitFor();

    await page.getByRole("button", { name: "Редактировать" }).click();
    await page.getByLabel("Название").fill(editedName);
    await page.getByRole("button", { name: "Сохранить" }).click();
    await page.getByRole("heading", { name: editedName }).waitFor();

    await page.getByRole("button", { name: "Архивировать" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Архивировать" })
      .click();

    await page.getByRole("heading", { name: "Объекты" }).waitFor();
    expect(await page.getByRole("link", { name: editedName }).count()).toBe(0);
  });

  it("does not show project management to a worker", async () => {
    const page = await newPage();
    await login(page, "worker1@demo.local");
    await page.getByRole("heading", { name: "Мои задачи" }).waitFor();

    await page.getByRole("link", { name: "Объекты" }).click();
    await page.getByRole("heading", { name: "Объекты" }).waitFor();
    await page.getByRole("link", { name: "ЖК «Северный»" }).waitFor();

    expect(await page.getByRole("button", { name: "Создать объект" }).count()).toBe(0);
  });
});
