import { ReviewStatus } from "../../../generated/prisma/enums";

export interface ICreateReview {
    event_id: string;
    rating: number;
    comment?: string;
}

export interface IUpdateReview {
    rating?: number;
    comment?: string;
}

export interface IReviewFilters {
    searchTerm?: string;
    status?: ReviewStatus;
}
