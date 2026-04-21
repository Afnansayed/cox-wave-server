import { z } from "zod";

export const updateCustomerValidationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),

  email: z
    .string()
    .email({ message: "Invalid email format" })
    .optional(),

  profile_picture: z
    .string()
    .url({ message: "Profile picture must be a valid URL" })
    .optional(),

  phone_number: z
    .string()
    .min(6, "Phone number is too short")
    .optional(),

  address: z.string().optional(),
});