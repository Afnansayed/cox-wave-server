import { EventStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ICreateEvent, IEventFilters, IUpdateEvent } from "./event.interface";
import { Prisma } from "../../../generated/prisma/client";
import { IPaginationOptions } from "../../interfaces/pagination";
import { calculatePagination } from "../../utils/calculatePagination";

const createEvent = async (userId: string, payload: ICreateEvent, files?: { [fieldname: string]: Express.Multer.File[] }) => {
    const owner = await prisma.owner.findUnique({
        where: { user_id: userId, isApproved: true }
    });

    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Owner profile not found or not approved. Please create and get approval for an owner profile first.");
    }

    const capacity = Number(payload.capacity);
    const per_person_price = Number(payload.per_person_price);

    // Extract image URLs in a string of array
    const images = files?.images?.map((file: Express.Multer.File) => file.path) || [];

    const event = await prisma.event.create({
        data: {
            title: payload.title,
            description: payload.description,
            location: payload.location,
            capacity: capacity,
            remaining_seats: capacity, // At creation, remaining = capacity
            per_person_price: per_person_price,
            images: images,
            owner_id: owner.id,
            status: EventStatus.PENDING,
            isActive: false // Usually requires admin approval or explicit activation later
        }
    });

    return event;
};

const getAllEvents = async (filters: IEventFilters, options: IPaginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

    const andConditions: Prisma.EventWhereInput[] = [];

    if (filters.searchTerm) {
        andConditions.push({
            OR: [
                { title: { contains: filters.searchTerm, mode: 'insensitive' } },
                { location: { contains: filters.searchTerm, mode: 'insensitive' } }
            ]
        });
    }

    if (filters.status) {
        andConditions.push({
            status: filters.status
        });
    }

    const whereCondition: Prisma.EventWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const events = await prisma.event.findMany({
        where: whereCondition,
        include: {
            owner: true
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    const total = await prisma.event.count({
        where: whereCondition
    });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: events
    };
};

const getEventById = async (id: string) => {
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            owner: true,
            // later you could include bookings or reviews here
        }
    });

    if (!event) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    return event;
};

const updateEvent = async (eventId: string, userId: string, payload: IUpdateEvent, files?: { [fieldname: string]: Express.Multer.File[] }) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { owner: true }
    });

    if (!event) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    // Authorization: User must be the owner of the event (or an ADMIN)
    // Here we check if the user requesting is the actual owner linked to the event
    if (event.owner.user_id !== userId) {
        // We will assume ADMIN check could be done before or here
        // For simplicity, strictly checking owner right now:
        throw new AppError(status.FORBIDDEN, "You are not authorized to update this event");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...payload };

    if (payload.capacity !== undefined) {
        updateData.capacity = Number(payload.capacity);
        // Potential logic: Update remaining seats if capacity changes. A simple fix:
        // Or leave remaining_seats intact or throw error if capacity goes below booked.
        // For now just updating capacity blindly.
    }
    if (payload.per_person_price !== undefined) {
        updateData.per_person_price = Number(payload.per_person_price);
    }

    if (files && files.images) {
        const newImages = files.images.map((file: Express.Multer.File) => file.path);
        // We append to existing images or replace? Industry standard is replace or explicitly remove via another API. Let's append for now or replace depending on what the user prefers. Let's replace completely for simplicity:
        updateData.images = newImages;
    }

    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: updateData
    });

    return updatedEvent;
};

const deleteEvent = async (eventId: string, userId: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { owner: true }
    });

    if (!event) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    if (event.owner.user_id !== userId) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to delete this event");
    }

    // Since Event doesn't have soft-delete right now in schema, hard delete
    await prisma.event.delete({
        where: { id: eventId }
    });

    return null;
};

export const eventService = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent
};
