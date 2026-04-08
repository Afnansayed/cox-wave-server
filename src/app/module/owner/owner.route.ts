import { Router } from "express";
import { ownerController } from "./owner.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";
import { createOwnerSchema } from "./owner.validation";




const router = Router();

router.post('/register', checkAuth(Role.CUSTOMER), multerUpload.single('file'), validateRequest(createOwnerSchema),  ownerController.createOwner);


export const ownerRoutes = router;