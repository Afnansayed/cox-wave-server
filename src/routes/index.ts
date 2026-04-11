import { Router } from "express";
import { authRoutes } from "../app/module/auth/auth.route";
import { ownerRoutes } from "../app/module/owner/owner.route";
import { UserRoutes } from "../app/module/user/user.route";
import { eventRoutes } from "../app/module/event/event.route";
import { reviewRoutes } from "../app/module/review/review.route";



const router = Router();

router.use("/auth", authRoutes);
router.use("/user", UserRoutes);
router.use("/owner", ownerRoutes);
router.use("/event", eventRoutes);
router.use("/review", reviewRoutes);

export const indexRoutes = router;