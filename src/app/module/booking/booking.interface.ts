import { BookingStatus, PaymentStatus } from "../../../generated/prisma/enums";

export interface ICreateBooking {
    event_id: string;
    seats: number;
}

export interface IBookingFilters {
    searchTerm?: string;
    status?: BookingStatus;
    payment_status?: PaymentStatus;
}
