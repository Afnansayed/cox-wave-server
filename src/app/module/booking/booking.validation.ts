import { z } from "zod";
import { BookingStatus, PaymentStatus } from "../../../generated/prisma/enums";

const createBookingValidationSchema = z.object({
    event_id: z.string().uuid({ message: "Invalid Event ID format" }),
    seats: z.number().int().positive({ message: "Seats must be an integer and at least 1" })
});

const updateBookingStatusValidationSchema = z.object({
    status: z.nativeEnum(BookingStatus)
});

const updatePaymentStatusValidationSchema = z.object({
    payment_status: z.nativeEnum(PaymentStatus)
});

export const BookingValidation = {
    createBookingValidationSchema,
    updateBookingStatusValidationSchema,
    updatePaymentStatusValidationSchema
};
