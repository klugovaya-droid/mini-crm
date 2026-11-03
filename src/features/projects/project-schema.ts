import { z } from "zod";

export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Введите название объекта")
    .max(160, "Название слишком длинное"),
  address: z
    .string()
    .trim()
    .min(1, "Введите адрес объекта")
    .max(240, "Адрес слишком длинный"),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
