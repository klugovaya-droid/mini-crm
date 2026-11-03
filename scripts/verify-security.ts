import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

const prod = process.argv.includes("--prod");
config({ path: prod ? ".env.production.local" : ".env.local" });

const url =
  process.env.SUPABASE_URL ??
  process.env.PROD_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.PROD_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY;
const password = process.env.DEMO_PASSWORD ?? process.env.PROD_DEMO_PASSWORD;

if (!url || !anonKey || !password) {
  throw new Error(
    "Set SUPABASE_URL, SUPABASE_ANON_KEY and DEMO_PASSWORD in the environment file.",
  );
}

const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

function check(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function signIn(email: string): Promise<SupabaseClient<Database> | null> {
  const client = createClient<Database>(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: password! });
  if (error) {
    check(`Вход ${email}`, false, error.message);
    return null;
  }
  check(`Вход ${email}`, true);
  return client;
}

const anon = createClient<Database>(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const worker1 = await signIn("worker1@demo.local");
const worker2 = await signIn("worker2@demo.local");
const manager = await signIn("manager@demo.local");

if (!worker1 || !worker2 || !manager) {
  console.error("Не удалось войти тестовыми пользователями. Проверьте seed и пароль.");
  process.exit(1);
}

const { data: worker1Tasks } = await worker1.from("tasks").select("id").is("deleted_at", null);
const { data: worker2Tasks } = await worker2.from("tasks").select("id").is("deleted_at", null);
const worker1Ids = new Set((worker1Tasks ?? []).map((task) => task.id));
const worker2Ids = new Set((worker2Tasks ?? []).map((task) => task.id));
check(
  "Исполнители не видят задачи друг друга",
  [...worker1Ids].every((id) => !worker2Ids.has(id)),
);

const ownTask = [...worker1Ids][0];
const otherTask = [...worker2Ids][0];

if (ownTask) {
  const directUpdate = await worker1
    .from("tasks")
    .update({ status: "accepted" })
    .eq("id", ownTask);
  check("Прямая смена статуса исполнителем запрещена", directUpdate.error !== null);
} else {
  check("Прямая смена статуса исполнителем запрещена", false, "у worker1 нет задач");
}

if (otherTask) {
  const readOther = await worker1.from("tasks").select("id").eq("id", otherTask);
  check(
    "Чужая задача не читается",
    (readOther.data ?? []).length === 0,
    `ожидали 0, получили ${readOther.data?.length ?? 0}`,
  );
}

const { data: history } = await worker1
  .from("task_status_history")
  .select("id")
  .limit(1);

if (history?.[0]) {
  const historyId = history[0].id;
  const insertHistory = await worker1.from("task_status_history").insert({
    task_id: ownTask ?? historyId.toString(),
    changed_by: (await worker1.auth.getUser()).data.user!.id,
    from_status: "new",
    to_status: "accepted",
  });
  check("Вставка истории запрещена", insertHistory.error !== null);

  const updateHistory = await worker1
    .from("task_status_history")
    .update({ comment: "verify" })
    .eq("id", historyId);
  check("Изменение истории запрещено", updateHistory.error !== null);

  const deleteHistory = await worker1
    .from("task_status_history")
    .delete()
    .eq("id", historyId);
  check("Удаление истории запрещено", deleteHistory.error !== null);
} else {
  check("История доступна исполнителю", false, "нет строк истории");
}

const { error: signupError } = await anon.auth.signUp({
  email: `verify-signup-${Date.now()}@gmail.com`,
  password: "Verify1234!",
});
check("Открытая регистрация выключена", signupError !== null);

const { data: profiles } = await manager.from("profiles").select("id, role");
check("Руководитель видит профили", (profiles ?? []).length >= 3);

const { data: allTasks } = await manager.from("tasks").select("id").is("deleted_at", null);
check("Руководитель видит все активные задачи", (allTasks ?? []).length >= 6);

const failed = results.filter((result) => !result.ok);
console.log(`\nПроверка завершена: ${results.length - failed.length}/${results.length} успешно.`);
if (failed.length > 0) process.exit(1);
