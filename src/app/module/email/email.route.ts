import { Router } from "express";
import { emailController } from "./email.controller";


const router: Router = Router();

router.post('/subscribe', emailController.subscribeNewsletter);


export const emailRoutes: Router = router;