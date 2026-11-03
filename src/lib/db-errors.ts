import type { PostgrestError } from "@supabase/supabase-js";

const messages: Record<string, string> = {
  "23503": "Связанная запись не найдена.",
  "23505": "Такая запись уже существует.",
  "23514": "Проверьте заполнение полей.",
  "42501": "Недостаточно прав для этого действия.",
  P0001: "Действие запрещено.",
  P0002: "Запись не найдена.",
};

export function mapDbError(error: PostgrestError | null | undefined): string {
  if (!error) return "Не удалось выполнить действие.";
  return messages[error.code] ?? "Не удалось выполнить действие. Попробуйте ещё раз.";
}
