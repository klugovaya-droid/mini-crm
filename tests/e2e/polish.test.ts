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

async function newPage(options?: { viewport?: { width: number; height: number } }): Promise<Page> {
  const context = await browser.newContext(options);
  contexts.push(context);
  return context.newPage();
}

async function login(page: Page, email: string): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
}

async function createTask(page: Page, title: string): Promise<void> {
  await login(page, "manager@demo.local");
  await page.getByRole("heading", { name: "Объекты" }).waitFor();
  await page.getByRole("link", { name: "ЖК «Северный»" }).click();
  await page.getByRole("heading", { name: "ЖК «Северный»" }).waitFor();
  await page.getByRole("button", { name: "Создать задачу" }).click();
  await page.getByLabel("Название").fill(title);
  await page.getByRole("combobox", { name: "Исполнитель" }).click();
  await page.getByRole("option", { name: "Алексей Смирнов" }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.getByRole("heading", { name: title }).waitFor();
}

describe("UI polish", () => {
  it("uses the mobile navigation on a narrow viewport", async () => {
    const page = await newPage({ viewport: { width: 390, height: 844 } });
    await login(page, "worker1@demo.local");
    await page.getByRole("heading", { name: "Мои задачи" }).waitFor();

    await page.getByRole("button", { name: "Открыть меню" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Объекты" }).click();

    await page.getByRole("heading", { name: "Объекты" }).waitFor();
  });

  it("closes a dialog with Escape", async () => {
    const page = await newPage();
    await login(page, "manager@demo.local");
    await page.getByRole("heading", { name: "Объекты" }).waitFor();

    await page.getByRole("button", { name: "Создать объект" }).click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });

    expect(await page.getByRole("dialog").count()).toBe(0);
  });

  it("hides an archived task from the assigned worker", async () => {
    const managerPage = await newPage();
    const workerPage = await newPage();
    const title = `Архив e2e ${Date.now()}`;

    await createTask(managerPage, title);

    await login(workerPage, "worker1@demo.local");
    await workerPage.getByRole("heading", { name: "Мои задачи" }).waitFor();
    await workerPage.getByRole("link", { name: title }).waitFor();

    await managerPage.getByRole("button", { name: "Архивировать" }).click();
    await managerPage
      .getByRole("alertdialog")
      .getByRole("button", { name: "Архивировать" })
      .click();
    await managerPage.getByRole("heading", { name: "ЖК «Северный»" }).waitFor();

    await workerPage.reload();
    await workerPage.getByRole("heading", { name: "Мои задачи" }).waitFor();
    expect(await workerPage.getByRole("link", { name: title }).count()).toBe(0);
  });
});
