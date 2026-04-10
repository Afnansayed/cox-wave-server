import { EventStatus } from "../../../generated/prisma/enums";

export interface ICreateEvent {
    title: string;
    description?: string;
    location?: string;
    capacity: number;
    per_person_price: number;
}

export interface IUpdateEvent {
    title?: string;
    description?: string;
    location?: string;
    capacity?: number;
    per_person_price?: number;
    status?: EventStatus;
    isActive?: boolean;
}

export interface IEventFilters {
    searchTerm?: string;
    status?: EventStatus;
}
