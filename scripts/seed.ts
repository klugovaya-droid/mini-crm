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

console.log(`Seed complete. Password: ${password}`);
console.log("Manager id:", ids["manager@demo.local"]);
