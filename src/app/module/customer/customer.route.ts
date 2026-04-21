import { Router } from "express";
import { Role } from "../../../generated/prisma/browser";
import { checkAuth } from "../../middleware/checkAuth";
import { CustomerController } from "./customer.controller";
import { multerUpload } from "../../config/multer.config";
import { updateCustomerValidationSchema } from "./customer.validation";
import { validateRequest } from "../../middleware/validateRequest";



const router = Router();
// Get the logged-in owner's profile
router.get(
	'/profile',
	checkAuth(Role.CUSTOMER),
	CustomerController.getCustomerProfile
);

router.patch(
    '/profile',
    checkAuth(Role.CUSTOMER),
    multerUpload.fields([
        { name: 'profile_picture', maxCount: 1 },
    ]),
    validateRequest(updateCustomerValidationSchema),
    CustomerController.updateCustomerProfile
);

export const customerRoutes = router;