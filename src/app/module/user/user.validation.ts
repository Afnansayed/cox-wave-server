import { z } from "zod";

export const createOwnerSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(100, { message: "Password is too long" }),

  owner: z.object({
    name: z
      .string()
      .min(5, { message: "Name must be at least 5 characters" })
      .max(30, { message: "Name is too long" }),

    email: z
      .string()
      .email({ message: "Invalid email format" }),

    profile_picture: z
      .string()
      .url({ message: "Profile picture must be a valid URL" })
      .optional(),

    phone_number: z
      .string()
      .regex(/^(?:\+8801|01)[3-9]\d{8}$/, {
        message: "Invalid Bangladeshi phone number",
      })
      .optional(),

    address: z
      .string()
      .max(255, { message: "Address is too long" })
      .optional(),

    business_name: z
      .string()
      .min(2, { message: "Business name is required" })
      .max(150, { message: "Business name is too long" }),

    description: z
      .string()
      .max(500, { message: "Description is too long" })
      .optional(),

    business_address: z
      .string()
      .max(255, { message: "Business address is too long" })
      .optional(),

    bank_account: z
      .string()
      .min(6, { message: "Bank account must be valid" }),
  }),
});