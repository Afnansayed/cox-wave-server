import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateBooking, IBookingFilters } from "./booking.interface";
import { IPaginationOptions } from "../../interfaces/pagination.interface";
import { calculatePagination } from "../../utils/calculatePagination";
import { Prisma } from "../../../generated/prisma/client";
import { BookingStatus, PaymentStatus, Role } from "../../../generated/prisma/enums";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";
import { v7 as uuidv7 } from 'uuid';

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

        const transactionId = String(uuidv7());

        const paymentData = await tx.payment.create({
            data: {
                booking_id: booking.id,
                amount: totalAmount,
                transaction_id: transactionId
            }
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: "bdt",
                        product_data: {
                            name: `Booking for ${event.title}`,
                        },
                        unit_amount: totalAmount * 100,
                    },
                    quantity: 1,
                }
            ],
            metadata: {
                bookingId: booking.id,
                paymentId: paymentData.id,
            },

            success_url: `${envVars.FRONTEND_URL}/payment/payment-success?bookingId=${booking.id}&paymentId=${paymentData.id}`,

            // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
            cancel_url: `${envVars.FRONTEND_URL}/payment/payment-failed?bookingId=${booking.id}&paymentId=${paymentData.id}`,
        })

        return {
            booking,
            paymentData,
            paymentUrl: session.url,
        };
    });

    return {
        booking: result.booking,
        payment: result.paymentData,
        paymentUrl: result.paymentUrl,
    };
};

const bookingWithPayLater = async (userId: string, payload: ICreateBooking) => {
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


        const transactionId = String(uuidv7());

        const paymentData = await tx.payment.create({
            data: {
                booking_id: booking.id,
                amount: totalAmount,
                transaction_id: transactionId
            }
        });
        return {
            booking,
            payment: paymentData
        };
    });

    return result;
};

const initiatePayment = async (bookingId: string, userId: string) => {
    const customer = await prisma.customer.findUniqueOrThrow({
        where: {
            user_id: userId,
        }
    });

    const bookingData = await prisma.booking.findUniqueOrThrow({
        where: {
            id: bookingId,
            customer_id: customer.id,
        },
        include: {
            event: true,
            payment: true,
        }
    });

    if (!bookingData) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    if (!bookingData.payment) {
        throw new AppError(status.NOT_FOUND, "Payment data not found for this booking");
    }

    if (bookingData.payment?.status === PaymentStatus.PAID) {
        throw new AppError(status.BAD_REQUEST, "Payment already completed for this booking");
    };

    if (bookingData.status === BookingStatus.CANCELLED) {
        throw new AppError(status.BAD_REQUEST, "Booking is canceled");
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: `Booking for ${bookingData.event.title}`,
                    },
                    unit_amount: bookingData.total_amount * 100,
                },
                quantity: 1,
            }
        ],
        metadata: {
            bookingId: bookingData.id,
            paymentId: bookingData.payment.id,
        },

        success_url: `${envVars.FRONTEND_URL}/payment/payment-success?booking_id=${bookingData.id}&payment_id=${bookingData.payment.id}`,

        // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
        cancel_url: `${envVars.FRONTEND_URL}/payment/payment-failed?booking_id=${bookingData.id}&payment_id=${bookingData.payment.id}`,
    })

    return {
        paymentUrl: session.url,
    }
}


const getBookings = async (
    userId: string,
    role: Role,
    filters: IBookingFilters,
    options: IPaginationOptions
) => {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

    const andConditions: Prisma.BookingWhereInput[] = [];

    if (filters.status) {
        andConditions.push({ status: filters.status });
    }

    if (filters.payment_status) {
        andConditions.push({ payment_status: filters.payment_status });
    }

    if (filters.searchTerm) {
        andConditions.push({
            OR: [
                { event: { title: { contains: filters.searchTerm, mode: 'insensitive' } } },
                { id: { contains: filters.searchTerm, mode: 'insensitive' } }
            ]
        });
    }

    if (role === Role.CUSTOMER) {
        andConditions.push({
            customer: {
                user_id: userId
            }
        });
    } else if (role === Role.OWNER) {
        andConditions.push({
            event: {
                owner: {
                    user_id: userId
                }
            }
        });
    } else if (role !== Role.ADMIN) {
        throw new AppError(status.BAD_REQUEST, "Invalid user role");
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

const getBookingById = async (id: string, userId: string, role: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { customer: true, event: { include: { owner: true } }, payment: true }
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    if (role === Role.CUSTOMER && booking.customer.user_id !== userId) {
        throw new AppError(status.FORBIDDEN, "You do not have access to this booking");
    }

    if (role === Role.OWNER && booking.event.owner.user_id !== userId) {
        throw new AppError(status.FORBIDDEN, "You do not have access to this booking");
    }

    return booking;
};

const updateBookingStatus = async (
    id: string,
    bookingStatus: BookingStatus,
    userId: string,
    role: Role
) => {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { event: { include: { owner: true } } }
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    if(booking.status === BookingStatus.CANCELLED) {
        throw new AppError(status.BAD_REQUEST, "Booking is cancelled and cannot be updated"); 
    }
    if(booking.status === BookingStatus.COMPLETED) {
        throw new AppError(status.BAD_REQUEST, "Booking is completed and cannot be updated"); 
    }

    // Role-based access control and validation
    if (role === Role.CUSTOMER) {
        // Customer can only update their own bookings and only to CANCELLED status
        const customer = await prisma.customer.findUnique({
            where: { user_id: userId }
        });

        if (!customer || booking.customer_id !== customer.id) {
            throw new AppError(status.FORBIDDEN, "You do not have access to this booking");
        }

        // Customer can only cancel bookings
        if (bookingStatus !== BookingStatus.CANCELLED) {
            throw new AppError(status.FORBIDDEN, "Customer can only cancel bookings");
        }

        if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
            throw new AppError(
                status.BAD_REQUEST,
                `Cannot cancel booking with status ${booking.status}. Only PENDING or CONFIRMED bookings can be cancelled.`
            );
        }
    } else if (role === Role.OWNER) {
        // Owner can update any status for bookings of their own events
        if (booking.event.owner.user_id !== userId) {
            throw new AppError(status.FORBIDDEN, "You do not have access to this booking");
        }
    } else if (role !== Role.ADMIN) {
        throw new AppError(status.BAD_REQUEST, "Invalid user role");
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

        // If the booking gets COMPLETED, we can release the held seats as well since the event has already occurred.
        if (bookingStatus === BookingStatus.COMPLETED && booking.status !== BookingStatus.COMPLETED) {
            await tx.event.update({
                where: { id: booking.event_id },
                data: {
                    remaining_seats: { increment: booking.seats }
                }
            });
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


const cancelUnpaidBookings = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const unpaidBookings = await prisma.booking.findMany({
        where: {
            createdAt: {
                lte: thirtyMinutesAgo,
            },
            payment_status: PaymentStatus.UNPAID,
            status: {
                not: BookingStatus.CANCELLED,
            },
        },
    });

    const bookingToCancel = unpaidBookings.map(booking => booking.id);
    const eventIds = unpaidBookings.map(booking => booking.event_id);

    await prisma.$transaction(async (tx) => {

        await tx.booking.updateMany({
            where: {
                id: {
                    in: bookingToCancel,
                },
            },
            data: {
                status: BookingStatus.CANCELLED,
            },
        });

        await tx.payment.deleteMany({
            where: {
                booking_id: {
                    in: bookingToCancel,
                },
            },
        });

        await tx.event.updateMany({
            where: {
                id: {
                    in: eventIds,
                },
            },
            data: {
                remaining_seats: {
                    increment: unpaidBookings.reduce((acc, booking) => acc + booking.seats, 0)
                }
            }
        });
    });
};

export const bookingService = {
        createBooking,
        bookingWithPayLater,
        initiatePayment,
    getBookings,
        getBookingById,
        updateBookingStatus,
        cancelUnpaidBookings,
        deleteBooking
    };
