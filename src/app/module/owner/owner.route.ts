import { Router } from "express";
import { ownerController } from "./owner.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";
import { updateOwnerValidationSchema } from "./owner.validation";

const router: Router = Router();

// Get the logged-in owner's profile
router.get(
    '/profile',
    checkAuth(Role.OWNER),
    ownerController.getOwnerProfile
);

// Get owner profile by ID (Admin only)
router.get(
    '/:id',
    checkAuth(Role.ADMIN),
    ownerController.getOwnerProfileById
);

// Update the logged-in owner's profile with possible file uploads
router.patch(
    '/profile',
    checkAuth(Role.OWNER),
    multerUpload.fields([
        { name: 'profile_picture', maxCount: 1 },
        { name: 'trade_license', maxCount: 1 }
    ]),
    validateRequest(updateOwnerValidationSchema),
    ownerController.updateOwnerProfile
);

// Get all owners (Admin only)
router.get(
    '/',
    checkAuth(Role.ADMIN),
    ownerController.getAllOwners
);

router.patch(
    '/approval/:id',
    checkAuth(Role.ADMIN),
    ownerController.updateOwnerApproval
);

// Delete an owner (soft delete, Admin only)
router.delete(
    '/:id',
    checkAuth(Role.ADMIN),
    ownerController.deleteOwner
);

export const ownerRoutes: Router = router;