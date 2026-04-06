import { Router } from "express";
import { authController } from "./auth.controller";


const router = Router();

router.post('/register', authController.registerCustomer);
router.post('/login', authController.loginUser);

export const authRoutes = router;