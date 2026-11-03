import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, it } from "vitest";

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
  await page.waitForURL((url) => url.pathname !== "/login");
}

async function createTask(page: Page, title: string): Promise<string> {
  await login(page, "manager@demo.local");
  await page.getByRole("heading", { name: "Объекты" }).waitFor();
  await page.getByRole("link", { name: "ЖК «Северный»" }).click();
  await page.getByRole("heading", { name: "ЖК «Северный»" }).waitFor();
  await page.getByRole("button", { name: "Создать задачу" }).click();
  await page.getByLabel("Название").fill(title);
  await page.getByLabel("Описание").fill("Описание для workflow e2e");
  await page.getByRole("combobox", { name: "Исполнитель" }).click();
  await page.getByRole("option", { name: "Алексей Смирнов" }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.getByRole("heading", { name: title }).waitFor();
  return page.url();
}

function statusBadge(page: Page, label: string) {
  return page.locator('[data-slot="badge"]').filter({ hasText: label });
}

describe("task workflow", () => {
  it("passes the full lifecycle with history and RLS", async () => {
    const managerPage = await newPage();
    const workerPage = await newPage();
    const otherWorkerPage = await newPage();
    const title = `Workflow e2e ${Date.now()}`;

    const taskUrl = await createTask(managerPage, title);

    await login(workerPage, "worker1@demo.local");
    await workerPage.getByRole("heading", { name: "Мои задачи" }).waitFor();
    await workerPage.goto(taskUrl);
    await workerPage.getByRole("heading", { name: title }).waitFor();
    await workerPage.getByRole("button", { name: "Взять в работу" }).click();
    await statusBadge(workerPage, "В работе").waitFor();

    await workerPage.getByRole("button", { name: "Отправить на проверку" }).click();
    await statusBadge(workerPage, "На проверке").waitFor();

    await managerPage.goto(taskUrl);
    await managerPage.getByRole("button", { name: "Вернуть на доработку" }).click();
    const dialog = managerPage.getByRole("dialog");
    await dialog.getByRole("button", { name: "Вернуть на доработку" }).click();
    await dialog.getByText("Комментарий обязателен.").waitFor();
    await dialog.getByLabel("Комментарий").fill("Добавьте фотоотчёт.");
    await dialog.getByRole("button", { name: "Вернуть на доработку" }).click();
    await statusBadge(managerPage, "На доработке").waitFor();
    await managerPage.getByText("Добавьте фотоотчёт.").waitFor();

    await workerPage.goto(taskUrl);
    await workerPage.getByRole("button", { name: "Продолжить работу" }).click();
    await statusBadge(workerPage, "В работе").waitFor();
    await workerPage.getByRole("button", { name: "Отправить на проверку" }).click();
    await statusBadge(workerPage, "На проверке").waitFor();

    await managerPage.goto(taskUrl);
    await managerPage.getByRole("button", { name: "Принять" }).click();
    await statusBadge(managerPage, "Принята").waitFor();

    for (const entry of [
      "Задача создана",
      "Новая → В работе",
      "В работе → На проверке",
      "На проверке → На доработке",
      "На доработке → В работе",
      "На проверке → Принята",
    ]) {
      await managerPage.getByText(entry, { exact: true }).first().waitFor();
    }

    await login(otherWorkerPage, "worker2@demo.local");
    await otherWorkerPage.getByRole("heading", { name: "Мои задачи" }).waitFor();
    await otherWorkerPage.goto(taskUrl);
    await otherWorkerPage.getByText("Задача не найдена").waitFor();
  });
});
