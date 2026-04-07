import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createCustomerZodSchema } from "./auth.validation";


const router = Router();

router.post('/register', validateRequest(createCustomerZodSchema), authController.registerCustomer);
router.post('/login', authController.loginUser);

export const authRoutes = router;