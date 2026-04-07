import { Router } from "express";
import { authRoutes } from "../app/module/auth/auth.route";
import { ownerRoutes } from "../app/module/owner/owner.route";



const router = Router();

router.use("/auth", authRoutes);
router.use("/owner", ownerRoutes);

export const indexRoutes = router;