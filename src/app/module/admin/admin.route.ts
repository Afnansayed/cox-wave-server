import { Router } from "express";
import { Role } from "../../../generated/prisma/browser";
import { checkAuth } from "../../middleware/checkAuth";

import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { updateAdminValidationSchema } from "./admin.validation";



const router = Router();
// Get the logged-in owner's profile
router.get(
    '/profile',
    checkAuth(Role.ADMIN),
    AdminController.getAdminProfile
);

router.patch(
    '/profile',
    checkAuth(Role.ADMIN),
    multerUpload.fields([
        { name: 'profile_picture', maxCount: 1 },
    ]),
    validateRequest(updateAdminValidationSchema),
    AdminController.updateAdminProfile
);

export const adminRoutes = router;