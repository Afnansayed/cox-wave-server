import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { eventService } from "./event.service";
import { EventStatus } from "../../../generated/prisma/enums";

const createEvent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const files = req.files as | { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    // Note: the multipart/form-data payload will be available in req.body
    const result = await eventService.createEvent(userId, req.body, files);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: 'Event created successfully',
        data: result
    });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
    const filters = {
        searchTerm: req.query.searchTerm as string,
        status: req.query.status as EventStatus,
    };
    
    const options = {
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await eventService.getAllEvents(filters, options);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Events retrieved successfully',
        data: result
    });
});

const getEventById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await eventService.getEventById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Event retrieved successfully',
        data: result
    });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const files = req.files as | { [fieldname: string]: Express.Multer.File[] } | undefined;

    const result = await eventService.updateEvent(id, userId, req.body, files);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Event updated successfully',
        data: result
    });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    
    await eventService.deleteEvent(id, userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Event deleted successfully',
        data: null
    });
});

export const eventController = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent
};
