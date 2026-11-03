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

async function createTask(page: Page, title: string): Promise<void> {
  await login(page, "manager@demo.local");
  await page.getByRole("heading", { name: "Объекты" }).waitFor();
  await page.getByRole("link", { name: "ЖК «Северный»" }).click();
  await page.getByRole("heading", { name: "ЖК «Северный»" }).waitFor();
  await page.getByRole("button", { name: "Создать задачу" }).click();
  await page.getByLabel("Название").fill(title);
  await page.getByLabel("Описание").fill("Описание для e2e");
  await page.getByRole("combobox", { name: "Исполнитель" }).click();
  await page.getByRole("option", { name: "Алексей Смирнов" }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.getByRole("heading", { name: title }).waitFor();
}

describe("tasks", () => {
  it("creates a task for one worker and hides it from another", async () => {
    const managerPage = await newPage();
    const title = `E2E задача ${Date.now()}`;
    await createTask(managerPage, title);

    const worker1 = await newPage();
    await login(worker1, "worker1@demo.local");
    await worker1.getByRole("heading", { name: "Мои задачи" }).waitFor();
    await worker1.getByRole("link", { name: title }).waitFor();

    const worker2 = await newPage();
    await login(worker2, "worker2@demo.local");
    await worker2.getByRole("heading", { name: "Мои задачи" }).waitFor();
    expect(await worker2.getByRole("link", { name: title }).count()).toBe(0);
  });

  it("lets a manager edit and archive a task", async () => {
    const page = await newPage();
    const title = `E2E архив ${Date.now()}`;
    const editedTitle = `${title} (изм.)`;
    await createTask(page, title);

    await page.getByRole("button", { name: "Редактировать" }).click();
    await page.getByLabel("Название").fill(editedTitle);
    await page.getByRole("button", { name: "Сохранить" }).click();
    await page.getByRole("heading", { name: editedTitle }).waitFor();

    await page.getByRole("button", { name: "Архивировать" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Архивировать" })
      .click();

    await page.getByRole("heading", { name: "ЖК «Северный»" }).waitFor();
    expect(await page.getByRole("link", { name: editedTitle }).count()).toBe(0);
  });

  it("does not show task management to a worker", async () => {
    const page = await newPage();
    await login(page, "worker1@demo.local");
    await page.getByRole("heading", { name: "Мои задачи" }).waitFor();
    await page.getByRole("link", { name: "Проверить армирование фундамента" }).click();

    await page.getByRole("heading", { name: "Проверить армирование фундамента" }).waitFor();
    expect(await page.getByRole("button", { name: "Редактировать" }).count()).toBe(0);
    expect(await page.getByRole("button", { name: "Архивировать" }).count()).toBe(0);
  });
});
