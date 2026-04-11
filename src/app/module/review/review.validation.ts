import { z } from "zod";
import { ReviewStatus } from "../../../generated/prisma/enums";

const createReviewValidationSchema = z.object({
    event_id: z.string().uuid({ message: 'Invalid Event ID format' }),
    rating: z.number().int().min(1).max(5, { message: 'Rating must be between 1 and 5' }),
    comment: z.string().optional(),
});

const updateReviewValidationSchema = z.object({
    rating: z.number().int().min(1).max(5, { message: 'Rating must be between 1 and 5' }).optional(),
    comment: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
});

const updateApprovalValidationSchema = z.object({
    status: z.nativeEnum(ReviewStatus)
});

export const ReviewValidation = {
    createReviewValidationSchema,
    updateReviewValidationSchema,
    updateApprovalValidationSchema
};
