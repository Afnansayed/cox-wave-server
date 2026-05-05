import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createCustomerZodSchema } from "./auth.validation";
import { Role } from "../../../generated/prisma/browser";
import { checkAuth } from "../../middleware/checkAuth";


const router: Router = Router();

router.post('/register', validateRequest(createCustomerZodSchema), authController.registerCustomer);
router.post('/login', authController.loginUser);
router.post("/refresh-token", authController.getNewToken);
router.post("/change-password", checkAuth(Role.ADMIN, Role.CUSTOMER , Role.OWNER), authController.changePassword);
router.post("/logout", checkAuth(Role.ADMIN , Role.CUSTOMER , Role.OWNER), authController.logoutUser);
router.post("/verify-email", authController.verifyEmail);
router.post("/forget-password", authController.forgetPassword);
router.post("/reset-password", authController.resetPassword);

//** Google OAuth Routes */
router.get("/login/google", authController.googleLogin);
router.get("/google/success", authController.googleLoginSuccess);
router.get("/oauth/error", authController.handleOAuthError);

export const authRoutes: Router = router;