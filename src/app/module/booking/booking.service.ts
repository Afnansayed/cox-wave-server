import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateBooking, IBookingFilters } from "./booking.interface";
import { IPaginationOptions } from "../../interfaces/pagination.interface";
import { calculatePagination } from "../../utils/calculatePagination";
import { Prisma } from "../../../generated/prisma/client";
import { BookingStatus, Role } from "../../../generated/prisma/enums";

const createBooking = async (userId: string, payload: ICreateBooking) => {
    const customer = await prisma.customer.findUnique({
        where: { user_id: userId }
    });

    if (!customer) {
        throw new AppError(status.NOT_FOUND, "Customer profile not found. Please complete profile setup.");
    }

    const event = await prisma.event.findUnique({
        where: { id: payload.event_id }
    });

    if (!event) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    if (!event.isActive || event.status !== 'APPROVED') {
        throw new AppError(status.BAD_REQUEST, "Event is not currently available for booking");
    }

    if (event.remaining_seats < payload.seats) {
        throw new AppError(status.BAD_REQUEST, `Unsufficient seats. Only ${event.remaining_seats} seats are available.`);
    }

    const totalAmount = event.per_person_price * payload.seats;

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create the booking record
        const booking = await tx.booking.create({
            data: {
                event_id: event.id,
                customer_id: customer.id,
                seats: payload.seats,
                total_amount: totalAmount,
            }
        });

        // 2. Decrement the remaining seats atomically
        await tx.event.update({
            where: { id: event.id },
            data: {
                remaining_seats: event.remaining_seats - payload.seats
            }
        });

        /*
         * TODO: [PAYMENT_INTEGRATION]
         * 1. Initialize Stripe/SSLCommerz payment session using `booking.id` and `totalAmount`.
         * 2. Create a `Payment` record in the database mapping to `booking.id` with status UNPAID and the `transaction_id`.
         * 3. Return the generated Payment Gateway Session URL or client secret to the frontend so the client can securely pay.
         * 
         * Example:
         * const paymentSession = await stripe.checkout.sessions.create({...});
         * await tx.payment.create({ data: { booking_id: booking.id, amount: totalAmount, transaction_id: paymentSession.id } });
         * booking.paymentUrl = paymentSession.url;
         */

        return booking;
    });

    return result;
};

const getAllBookings = async (filters: IBookingFilters, options: IPaginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

    const andConditions: Prisma.BookingWhereInput[] = [];

    if (filters.status) {
        andConditions.push({ status: filters.status });
    }

    if (filters.payment_status) {
        andConditions.push({ payment_status: filters.payment_status });
    }

    const whereCondition: Prisma.BookingWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const bookings = await prisma.booking.findMany({
        where: whereCondition,
        include: {
            customer: true,
            event: true,
            payment: true
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    const total = await prisma.booking.count({ where: whereCondition });

    return {
        meta: { page, limit, total },
        data: bookings
    };
};

const getCustomerBookings = async (userId: string, options: IPaginationOptions) => {
    const customer = await prisma.customer.findUnique({ where: { user_id: userId } });

    if (!customer) throw new AppError(status.NOT_FOUND, "Customer not found");

    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

    const bookings = await prisma.booking.findMany({
        where: { customer_id: customer.id },
        include: { event: true, payment: true },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
    });

    const total = await prisma.booking.count({ where: { customer_id: customer.id } });

    return {
        meta: { page, limit, total },
        data: bookings
    };
};

const getBookingById = async (id: string, userId: string, role: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { customer: true, event: { include: { owner: true } }, payment: true }
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    // Security Verification: 
    // - Customers can only view their own bookings.
    // - Owners can only view bookings for events they own.
    // - Admins can view all.
    if (role === Role.CUSTOMER && booking.customer.user_id !== userId) {
        throw new AppError(status.FORBIDDEN, "You do not have access to this booking");
    }

    if (role === Role.OWNER && booking.event.owner.user_id !== userId) {
        throw new AppError(status.FORBIDDEN, "You do not have access to this booking");
    }

    return booking;
};

const updateBookingStatus = async (id: string, bookingStatus: BookingStatus) => {
    const booking = await prisma.booking.findUnique({
        where: { id }
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
        const result = await tx.booking.update({
            where: { id },
            data: { status: bookingStatus }
        });

        // If the booking gets CANCELLED, we must mathematically refund the event seats. 
        if (bookingStatus === BookingStatus.CANCELLED && booking.status !== BookingStatus.CANCELLED) {
            await tx.event.update({
                where: { id: booking.event_id },
                data: {
                    remaining_seats: { increment: booking.seats }
                }
            });

            /*
             * TODO: [PAYMENT_INTEGRATION]
             * If booking.payment_status was PAID, initialize Stripe/SSLCommerz Refund API here.
             * Then update Payment record status to REFUNDED.
             */
        }

        return result;
    });

    return updatedBooking;
};

const deleteBooking = async (id: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id }
    });

    if (!booking) throw new AppError(status.NOT_FOUND, "Booking not found");

    // Reverting seats cleanly when a booking is deleted (if it was taking up seats)
    if (booking.status !== BookingStatus.CANCELLED) {
        await prisma.$transaction(async (tx) => {
            await tx.booking.delete({ where: { id } });
            await tx.event.update({
                where: { id: booking.event_id },
                data: { remaining_seats: { increment: booking.seats } }
            });
        });
    } else {
        await prisma.booking.delete({ where: { id } });
    }

    return null;
};

/*
 * TODO: [PAYMENT_INTEGRATION] Webhook Listeners
 * 
 * export const handlePaymentSuccessWebhook = async (reqBody: any) => {
 *     // 1. Validate signature
 *     // 2. Extract transaction_id and booking_id from metadata
 *     // 3. Mark Payment record as PAID
 *     // 4. Mark Booking record as CONFIRMED, payment_status as PAID
 * };
 */

export const bookingService = {
    createBooking,
    getAllBookings,
    getCustomerBookings,
    getBookingById,
    updateBookingStatus,
    deleteBooking
};
