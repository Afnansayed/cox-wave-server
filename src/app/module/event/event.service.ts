/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ICreateEvent, IEventFilters, IUpdateEvent } from "./event.interface";
import { Prisma } from "../../../generated/prisma/client";
import { IPaginationOptions } from "../../interfaces/pagination";
import { calculatePagination } from "../../utils/calculatePagination";
import { deleteFileFromCloudinary } from "../../config/cloudinary.config";

const createEvent = async (userId: string, payload: ICreateEvent, files?: { [fieldname: string]: Express.Multer.File[] }) => {
    const owner = await prisma.owner.findUnique({
        where: { user_id: userId }
    });

    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Owner profile not found. Please create an owner profile first.");
    }

    if (!owner.isApproved) {
        throw new AppError(status.FORBIDDEN, "Owner profile not approved. Please wait for admin approval.");
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
            remaining_seats: capacity,
            per_person_price: per_person_price,
            images: images,
            owner_id: owner.id,
            status: EventStatus.PENDING,
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

    whereCondition.isActive = true;
    whereCondition.status = EventStatus.APPROVED;
    whereCondition.isDeleted = false;

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

const updateEvent = async (eventId: string, userId: string, role: string, payload: IUpdateEvent, files?: { [fieldname: string]: Express.Multer.File[] }) => {
    const isExistEvent = await prisma.event.findUnique({
        where: { id: eventId },
        include: { owner: true }
    });

    if (!isExistEvent) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    if (isExistEvent.owner.user_id !== userId && role !== Role.ADMIN) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to update this event");
    }

    const updateData: any = { ...payload };
    delete updateData.imagesToDelete;

    if (payload.capacity !== undefined) {
        const newCapacity = Number(payload.capacity);
        const bookedSeats = isExistEvent.capacity - isExistEvent.remaining_seats;

        if (newCapacity < bookedSeats) {
            throw new AppError(status.BAD_REQUEST, `Cannot reduce capacity below currently booked seats (${bookedSeats})`);
        }

        updateData.capacity = newCapacity;
        updateData.remaining_seats = newCapacity - bookedSeats;
    }

    if (payload.per_person_price !== undefined) {
        updateData.per_person_price = Number(payload.per_person_price);
    }

    let currentImages = isExistEvent.images ? [...isExistEvent.images] : [];

    // Handle Image Deletions
    if (payload.imagesToDelete && Array.isArray(payload.imagesToDelete)) {
        currentImages = currentImages.filter((img: string) => !payload.imagesToDelete!.includes(img));
    }

    // Handle New Image Appends
    if (files && files.images) {
        const newImages = files.images.map((file: Express.Multer.File) => file.path);
        currentImages = [...currentImages, ...newImages];
    }

    // Evaluate if any structural changes occurred inside images payload or file uploads
    if ((payload.imagesToDelete && payload.imagesToDelete.length > 0) || (files && files.images && files.images.length > 0)) {
        updateData.images = currentImages;
    }

    const result = await prisma.$transaction(async (tx) => {
        const updatedEvent = await tx.event.update({
            where: { id: eventId },
            data: updateData
        });

        if (payload.imagesToDelete && Array.isArray(payload.imagesToDelete) && payload.imagesToDelete.length > 0) {
            await Promise.all(payload.imagesToDelete.map((url) => deleteFileFromCloudinary(url)));
        }

        return updatedEvent;
    });

    return result;
};

const updateStatus = async (eventId: string, newStatus: EventStatus) => {
    const isExistEvent = await prisma.event.findUnique({
        where: { id: eventId },
    })

    if (!isExistEvent) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    const result = await prisma.event.update({
        where: { id: eventId },
        data: {
            status: newStatus,
        }
    })

    return result;
}
const updateActiveStatus = async (eventId: string) => {
    const isExistEvent = await prisma.event.findUnique({
        where: { id: eventId },
    })

    if (!isExistEvent) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    const result = await prisma.event.update({
        where: { id: eventId },
        data: {
            isActive: !isExistEvent.isActive,
        }
    })

    return result;
}


const deleteEvent = async (eventId: string, userId: string, role: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { owner: true }
    });

    if (!event) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    if (event.owner.user_id !== userId && role !== Role.ADMIN) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to delete this event");
    }

    // Since Event doesn't have soft-delete right now in schema, hard delete
    await prisma.event.update({
        where: { id: eventId },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        }
    });

    return null;
};

export const eventService = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    updateStatus,
    updateActiveStatus
};
