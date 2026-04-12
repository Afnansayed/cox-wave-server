import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { bookingService } from "./booking.service";
import { BookingStatus, PaymentStatus } from "../../../generated/prisma/enums";

const createBooking = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await bookingService.createBooking(userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: 'Booking initialized successfully',
        data: result
    });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
    const filters = {
        status: req.query.status as BookingStatus,
        payment_status: req.query.payment_status as PaymentStatus
    };
    
    const options = {
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await bookingService.getAllBookings(filters, options);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        data: result
    });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    const options = {
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await bookingService.getCustomerBookings(userId, options);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Your bookings retrieved successfully',
        data: result
    });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const role = req.user!.role as string;

    const result = await bookingService.getBookingById(id, userId, role);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Booking retrieved successfully',
        data: result
    });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const bookingStatus = req.body.status as BookingStatus;
    
    const result = await bookingService.updateBookingStatus(id, bookingStatus);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Booking status updated successfully',
        data: result
    });
});

const deleteBooking = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    
    await bookingService.deleteBooking(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Booking deleted successfully',
        data: null
    });
});

export const bookingController = {
    createBooking,
    getAllBookings,
    getMyBookings,
    getBookingById,
    updateBookingStatus,
    deleteBooking
};
