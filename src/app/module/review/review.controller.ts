import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { reviewService } from "./review.service";
import { ReviewStatus } from "../../../generated/prisma/enums";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await reviewService.createReview(userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: 'Review created successfully',
        data: result
    });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    const filters = {
        searchTerm: req.query.searchTerm as string,
        status: req.query.status as ReviewStatus,
    };
    
    const options = {
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await reviewService.getAllReviews(filters, options, req.user!.role);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Reviews retrieved successfully',
        data: result
    });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await reviewService.getReviewById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Review retrieved successfully',
        data: result
    });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const result = await reviewService.updateReview(id, userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Review updated successfully',
        data: result
    });
});

const updateApprovalStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const reviewStatus = req.body.status as ReviewStatus;
    const result = await reviewService.updateApprovalStatus(id, reviewStatus);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Review approval status updated successfully',
        data: result
    });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const role = req.user!.role as string;
    
    await reviewService.deleteReview(id, userId, role);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Review deleted successfully',
        data: null
    });
});

export const reviewController = {
    createReview,
    getAllReviews,
    getReviewById,
    updateReview,
    updateApprovalStatus,
    deleteReview
};
