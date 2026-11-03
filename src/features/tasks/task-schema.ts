import { z } from "zod";

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Введите название задачи")
    .max(200, "Название слишком длинное"),
  description: z.string().trim().max(4000, "Описание слишком длинное"),
  projectId: z.string().uuid("Выберите объект"),
  assigneeId: z.string().uuid("Выберите исполнителя"),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
