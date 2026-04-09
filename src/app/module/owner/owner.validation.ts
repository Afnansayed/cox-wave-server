import { z } from 'zod';

export const updateOwnerValidationSchema = z.object({
    name: z
      .string()
      .min(5, { message: "Name must be at least 5 characters long" })
      .max(30, { message: "Name cannot exceed 30 characters" })
      .optional(),

    phone_number: z
      .string()
      .regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, {
        message: "Please provide a valid Bangladesh phone number"
      })
      .optional(),

    address: z
      .string()
      .min(10, { message: "Please provide a more detailed personal address" })
      .optional(),

    business_name: z
      .string()
      .min(3, { message: "Business name must be at least 3 characters" })
      .optional(),

    description: z
      .string()
      .max(500, { message: "Description cannot exceed 500 characters" })
      .optional(),

    business_address: z
      .string()
      .min(10, { message: "Please provide a complete business location" })
      .optional(),

    bank_account: z
      .string()
      .min(8, { message: "Invalid bank account number length" })
      .regex(/^\d+$/, { message: "Bank account should only contain numbers" })
      .optional(),
});
