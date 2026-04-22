import { Router } from "express";
import { UserController } from "./user.controller";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";
import { createOwnerSchema } from "./user.validation";


const router: Router = Router();

router.post(
	"/create-owner",
	multerUpload.fields([
		{ name: "trade_license", maxCount: 1 },
		{ name: "profile_picture", maxCount: 1 },
	]),
	validateRequest(createOwnerSchema),
	UserController.createOwner,
);

export const UserRoutes: Router = router;