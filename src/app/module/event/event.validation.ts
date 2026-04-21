import { z } from "zod";
import { EventStatus } from "../../../generated/prisma/enums";

export const createEventValidationSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters long" })
    .max(100),
  description: z.string().optional(),
  location: z
    .string()
    .min(5, { message: "Location is required with proper detail" })
    .optional(),
  capacity: z.coerce
    .number()
    .int()
    .positive({ message: "Capacity must be a positive integer" }),

  per_person_price: z.coerce
    .number()
    .nonnegative({ message: "Price cannot be negative" }),
});

export const updateEventValidationSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().optional(),
  location: z.string().min(5).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  per_person_price: z.coerce.number().nonnegative().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  isActive: z
  .union([
    z.literal("true").transform(() => true),
    z.literal("false").transform(() => false),
  ])
  .optional(),
  imagesToDelete: z.array(z.string()).optional(),
});
