import { Router } from "express";
import { ownerController } from "./owner.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";




const router = Router();

router.post('/register', checkAuth(Role.CUSTOMER), ownerController.createOwner);


export const ownerRoutes = router;