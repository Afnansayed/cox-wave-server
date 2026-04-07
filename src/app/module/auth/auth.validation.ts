import z from "zod";


export const createCustomerZodSchema = z.object({
    name: z.string("Name is required").min(5, "Name must be at least 5 characters").max(30, "Name must be at most 30 characters"),
    email: z.email("Invalid email address"),
    password: z.string("Password is required").min(6, "Password must be at least 6 characters").max(20, "Password must be at most 20 characters"),
});