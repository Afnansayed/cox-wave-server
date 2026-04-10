import { Router } from "express";
import { eventController } from "./event.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";
import { createEventValidationSchema, updateEventValidationSchema } from "./event.validation";

const router = Router();

// Create new event (Owner Only)
router.post(
    '/',
    checkAuth(Role.OWNER),
    multerUpload.fields([{ name: 'images', maxCount: 5 }]),
    validateRequest(createEventValidationSchema),
    eventController.createEvent
);

// Get all events (Public - Everyone can view)
router.get(
    '/',
    eventController.getAllEvents
);

// Get a single event by ID (Public)
router.get(
    '/:id',
    eventController.getEventById
);

// Update an event (Owner Only)
router.patch(
    '/:id',
    checkAuth(Role.OWNER),
    multerUpload.fields([{ name: 'images', maxCount: 5 }]),
    validateRequest(updateEventValidationSchema),
    eventController.updateEvent
);

// Delete an event (Owner Only)
router.delete(
    '/:id',
    checkAuth(Role.OWNER),
    eventController.deleteEvent
);

export const eventRoutes = router;
