import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";
import type { AppRole } from "../src/types/domain";

const cloud = process.argv.includes("--cloud");
config({ path: cloud ? ".env.production.local" : ".env.local" });

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_PASSWORD;

if (!url || !serviceRoleKey || !password) {
  throw new Error(
    "Set SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD.",
  );
}

const admin = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface DemoUser {
  email: string;
  fullName: string;
  role: AppRole;
}

const users: DemoUser[] = [
  { email: "manager@demo.local", fullName: "Ирина Петрова", role: "manager" },
  { email: "worker1@demo.local", fullName: "Алексей Смирнов", role: "worker" },
  { email: "worker2@demo.local", fullName: "Мария Кузнецова", role: "worker" },
];

async function ensureUser(user: DemoUser): Promise<string> {
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  let id = list.users.find((item) => item.email?.toLowerCase() === user.email)?.id;

  if (id) {
    const { error } = await admin.auth.admin.updateUserById(id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: user.fullName },
      app_metadata: { role: user.role },
    });
    if (error) throw error;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: user.fullName },
      app_metadata: { role: user.role },
    });
    if (error) throw error;
    id = data.user.id;
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id,
    full_name: user.fullName,
    role: user.role,
  });
  if (profileError) throw profileError;

  return id;
}

const ids: Record<string, string> = {};

for (const user of users) {
  ids[user.email] = await ensureUser(user);
  console.log(`✓ ${user.role}: ${user.email}`);
}

interface DemoProject {
  name: string;
  address: string;
}

const projects: DemoProject[] = [
  { name: "ЖК «Северный»", address: "г. Москва, ул. Северная, 12" },
  { name: "Бизнес-центр «Высота»", address: "г. Москва, Ленинградский пр-т, 48" },
  { name: "Склад на Заводской", address: "г. Химки, ул. Заводская, 7" },
];

async function ensureProject(project: DemoProject, createdBy: string): Promise<string> {
  const { data: existing, error: selectError } = await admin
    .from("projects")
    .select("id")
    .eq("name", project.name)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data, error } = await admin
    .from("projects")
    .insert({ ...project, created_by: createdBy })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

const projectIds: Record<string, string> = {};

for (const project of projects) {
  projectIds[project.name] = await ensureProject(project, ids["manager@demo.local"]);
  console.log(`✓ объект: ${project.name}`);
}

interface DemoTask {
  project: string;
  title: string;
  description: string;
  assignee: string;
}

const tasks: DemoTask[] = [
  {
    project: "ЖК «Северный»",
    title: "Проверить армирование фундамента",
    description: "Сверить армирование с проектной документацией и зафиксировать замечания.",
    assignee: "worker1@demo.local",
  },
  {
    project: "ЖК «Северный»",
    title: "Согласовать поставку бетона",
    description: "Подтвердить график поставки и марку бетона на неделю.",
    assignee: "worker1@demo.local",
  },
  {
    project: "Бизнес-центр «Высота»",
    title: "Проверить остекление 3 этажа",
    description: "Проверить геометрию и крепления витражей.",
    assignee: "worker2@demo.local",
  },
  {
    project: "Бизнес-центр «Высота»",
    title: "Устранить замечания по вентиляции",
    description: "Закрыть замечания технадзора по воздуховодам.",
    assignee: "worker1@demo.local",
  },
  {
    project: "Склад на Заводской",
    title: "Принять площадку под монтаж",
    description: "Проверить основание и подготовить акт приёмки.",
    assignee: "worker2@demo.local",
  },
  {
    project: "Склад на Заводской",
    title: "Подготовить исполнительную документацию",
    description: "Собрать исполнительные схемы по каркасу.",
    assignee: "worker2@demo.local",
  },
];

async function ensureTask(task: DemoTask): Promise<string> {
  const projectId = projectIds[task.project];
  const { data: existing, error: selectError } = await admin
    .from("tasks")
    .select("id")
    .eq("project_id", projectId)
    .eq("title", task.title)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data, error } = await admin
    .from("tasks")
    .insert({
      project_id: projectId,
      title: task.title,
      description: task.description,
      assignee_id: ids[task.assignee],
      author_id: ids["manager@demo.local"],
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

for (const task of tasks) {
  await ensureTask(task);
  console.log(`✓ задача: ${task.title}`);
}

console.log(`Seed complete. Password: ${password}`);
console.log("Manager id:", ids["manager@demo.local"]);
