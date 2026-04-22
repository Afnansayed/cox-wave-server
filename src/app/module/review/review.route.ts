import { Router } from "express";
import { reviewController } from "./review.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { ReviewValidation } from "./review.validation";

const router: Router = Router();

// Create new review (Customer Only)
router.post(
    '/',
    checkAuth(Role.CUSTOMER),
    validateRequest(ReviewValidation.createReviewValidationSchema),
    reviewController.createReview
);

// Get all reviews
router.get(
    '/',
    checkAuth(Role.ADMIN, Role.CUSTOMER , Role.OWNER),
    reviewController.getAllReviews
);

// Get a single review by ID
router.get(
    '/:id',
    reviewController.getReviewById
);

// Update a review (Customer Only)
router.patch(
    '/:id',
    checkAuth(Role.CUSTOMER),
    validateRequest(ReviewValidation.updateReviewValidationSchema),
    reviewController.updateReview
);

// Update review approval status (Admin Only)
router.patch(
    '/:id/status',
    checkAuth(Role.ADMIN),
    validateRequest(ReviewValidation.updateApprovalValidationSchema),
    reviewController.updateApprovalStatus
);

// Delete a review (Customer & Admin)
router.delete(
    '/:id',
    checkAuth(Role.CUSTOMER, Role.ADMIN),
    reviewController.deleteReview
);

export const reviewRoutes: Router = router;
