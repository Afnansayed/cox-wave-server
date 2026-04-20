import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateReview, IReviewFilters, IUpdateReview } from "./review.interface";
import { IPaginationOptions } from "../../interfaces/pagination.interface";
import { calculatePagination } from "../../utils/calculatePagination";
import { Prisma } from "../../../generated/prisma/client";
import { ReviewStatus, Role } from "../../../generated/prisma/enums";

const createReview = async (userId: string, payload: ICreateReview) => {
    const customer = await prisma.customer.findUnique({
        where: { user_id: userId }
    });

    if (!customer) {
        throw new AppError(status.NOT_FOUND, "Customer profile not found. Please setup a customer profile.");
    }

    const event = await prisma.event.findUnique({
        where: { id: payload.event_id }
    });

    if (!event) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    // Check existing review
    const existingReview = await prisma.review.findUnique({
        where: {
            unique_event_customer_review: {
                event_id: payload.event_id,
                customer_id: customer.id
            }
        }
    });

    if (existingReview) {
        throw new AppError(status.BAD_REQUEST, "You have already reviewed this event");
    }

    const review = await prisma.review.create({
        data: {
            event_id: payload.event_id,
            customer_id: customer.id,
            rating: payload.rating,
            comment: payload.comment,
            status: ReviewStatus.PENDING
        }
    });

    return review;
};

const getAllReviews = async (filters: IReviewFilters, options: IPaginationOptions , role: Role) => {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

    const andConditions: Prisma.ReviewWhereInput[] = [];

    if (filters.searchTerm) {
        andConditions.push({
            comment: { contains: filters.searchTerm, mode: 'insensitive' }
        });
    }
    // console.log({role})

    if (filters.status) {
        andConditions.push({ status: filters.status });
    }

    const whereCondition: Prisma.ReviewWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};
    
    if (role !== Role.ADMIN){
        whereCondition.status = ReviewStatus.APPROVED
    }

    const reviews = await prisma.review.findMany({
        where: whereCondition,
        include: {
            customer: true,
            event: true
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    const total = await prisma.review.count({ where: whereCondition });

    return {
        meta: { page, limit, total },
        data: reviews
    };
};

const getReviewById = async (id: string) => {
    const review = await prisma.review.findUnique({
        where: { id },
        include: { customer: true, event: true }
    });

    if (!review) {
        throw new AppError(status.NOT_FOUND, "Review not found");
    }

    return review;
};

const updateReview = async (id: string, userId: string, payload: IUpdateReview) => {
    const review = await prisma.review.findUnique({
        where: { id },
        include: { customer: true }
    });

    if (!review) {
        throw new AppError(status.NOT_FOUND, "Review not found");
    }

    if (review.customer.user_id !== userId) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to update this review");
    }

    const updatedReview = await prisma.review.update({
        where: { id },
        data: payload
    });

    return updatedReview;
};

const updateApprovalStatus = async (id: string, reviewStatus: ReviewStatus) => {
    const review = await prisma.review.findUnique({
        where: { id }
    });

    if (!review) {
        throw new AppError(status.NOT_FOUND, "Review not found");
    }

    const updatedReview = await prisma.review.update({
        where: { id },
        data: { status: reviewStatus }
    });

    return updatedReview;
};

const deleteReview = async (id: string, userId: string, role: string) => {
    const review = await prisma.review.findUnique({
        where: { id },
        include: { customer: true }
    });

    if (!review) {
        throw new AppError(status.NOT_FOUND, "Review not found");
    }

    if (review.customer.user_id !== userId && role !== Role.ADMIN) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to delete this review");
    }

    await prisma.review.delete({
        where: { id }
    });

    return null;
};

export const reviewService = {
    createReview,
    getAllReviews,
    getReviewById,
    updateReview,
    updateApprovalStatus,
    deleteReview
};
