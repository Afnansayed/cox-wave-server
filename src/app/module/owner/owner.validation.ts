import z from "zod";


export const createOwnerSchema = z.object({
        name: z.string("name is required").min(5 , "name must be at least 5 characters long").max(30, "name must be at most 100 characters long"),
        email: z.email("email is required"),
        password: z.string("password is required").min(6, "password must be at least 6 characters long").max(100, "password must be at most 100 characters long")
});
