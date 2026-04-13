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

// booking with pay later (Customer Only)
router.post("/pay-later", checkAuth(Role.CUSTOMER), bookingController.bookingWithPayLater);

// initiate payment for unpaid booking (Customer Only)
router.post("/initiate-payment/:id", checkAuth(Role.CUSTOMER), bookingController.initiatePayment);

// Get bookings by role (Customer: own bookings, Owner: bookings of own events, Admin: all bookings)
router.get(
    '/',
    checkAuth(Role.ADMIN, Role.OWNER, Role.CUSTOMER),
    bookingController.getBookings
);

// Get a single booking by ID (Accessible strictly by Admin, Event Owner, and Booking Customer via Service guard)
router.get(
    '/:id',
    checkAuth(Role.ADMIN, Role.OWNER, Role.CUSTOMER),
    bookingController.getBookingById
);

// Update booking status (Customer: only CANCELLED, Owner: any status for own events, Admin: any status)
router.patch(
    '/:id/status',
    checkAuth(Role.ADMIN, Role.OWNER, Role.CUSTOMER),
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
