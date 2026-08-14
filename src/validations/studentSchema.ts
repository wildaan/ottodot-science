import { z } from 'zod';

export const studentCreateSchema = z.object({
  students_parents_uuid: z.string().uuid({ message: "Parent UUID must be a valid UUID" }),
  students_name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  students_age: z.coerce.number().int().min(2, { message: "Age must be at least 2" }).max(18, { message: "Age must be at most 18" }),
});

export const studentUpdateSchema = z.object({
  students_parents_uuid: z.string().uuid({ message: "Parent UUID must be a valid UUID" }).optional(),
  students_name: z.string().min(2, { message: "Name must be at least 2 characters long" }).optional(),
  students_age: z.coerce.number().int().min(2, { message: "Age must be at least 2" }).max(18, { message: "Age must be at most 18" }).optional(),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
