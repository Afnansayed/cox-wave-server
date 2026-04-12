import { Router } from "express";
import { bookingController } from "./booking.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { BookingValidation } from "./booking.validation";

const router = Router();

// Create new booking (Customer Only)
router.post(
    '/',
    checkAuth(Role.CUSTOMER),
    validateRequest(BookingValidation.createBookingValidationSchema),
    bookingController.createBooking
);

// Get my logged in bookings (Customer Only)
router.get(
    '/my-bookings',
    checkAuth(Role.CUSTOMER),
    bookingController.getMyBookings
);

// Get all bookings cluster (Admin Only)
router.get(
    '/',
    checkAuth(Role.ADMIN),
    bookingController.getAllBookings
);

// Get a single booking by ID (Accessible strictly by Admin, Event Owner, and Booking Customer via Service guard)
router.get(
    '/:id',
    checkAuth(Role.ADMIN, Role.OWNER, Role.CUSTOMER),
    bookingController.getBookingById
);

// Update booking status directly (Admin Only)
router.patch(
    '/:id/status',
    checkAuth(Role.ADMIN),
    validateRequest(BookingValidation.updateBookingStatusValidationSchema),
    bookingController.updateBookingStatus
);

// Delete booking (Admin Only)
router.delete(
    '/:id',
    checkAuth(Role.ADMIN),
    bookingController.deleteBooking
);

export const bookingRoutes = router;
