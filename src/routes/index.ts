import { Router } from "express";
import { authRoutes } from "../app/module/auth/auth.route";
import { ownerRoutes } from "../app/module/owner/owner.route";
import { UserRoutes } from "../app/module/user/user.route";
import { eventRoutes } from "../app/module/event/event.route";
import { reviewRoutes } from "../app/module/review/review.route";
import { bookingRoutes } from "../app/module/booking/booking.route";
import { customerRoutes } from "../app/module/customer/customer.route";
import { adminRoutes } from "../app/module/admin/admin.route";



const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/user", UserRoutes);
router.use("/owner", ownerRoutes);
router.use("/event", eventRoutes);
router.use("/review", reviewRoutes);
router.use("/booking", bookingRoutes);
router.use("/customer", customerRoutes);
router.use("/admin", adminRoutes);


export const indexRoutes: Router = router;