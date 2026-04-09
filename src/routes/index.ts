import { Router } from "express";
import { authRoutes } from "../app/module/auth/auth.route";
import { ownerRoutes } from "../app/module/owner/owner.route";
import { UserRoutes } from "../app/module/user/user.route";



const router = Router();

router.use("/auth", authRoutes);
router.use("/user", UserRoutes);
router.use("/owner", ownerRoutes);

export const indexRoutes = router;