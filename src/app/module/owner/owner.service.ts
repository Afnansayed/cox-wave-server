import AppError from "../../errorHelpers/AppError";
import { IOwnerFilters, IUpdateOwner } from "./owner.interface";
import { prisma } from "../../lib/prisma";
import status from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";
import { IPaginationOptions } from "../../interfaces/pagination.interface";
import { calculatePagination } from "../../utils/calculatePagination";
import { Prisma } from "../../../generated/prisma/browser";

const getOwnerProfile = async (userId: string) => {
    const owner = await prisma.owner.findUnique({
        where: {
            user_id: userId,
            isDeleted: false
        },
        include: {
            events: true
        }
    });

    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Owner profile not found");
    }

    return owner;
};

const getOwnerProfileById = async (ownerId: string) => {
    const owner = await prisma.owner.findUnique({
        where: {
            id: ownerId,
            isDeleted: false
        },
        include: {
            events: true
        }
    });

    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Owner profile not found");
    }

    return owner;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateOwnerProfile = async (userId: string, payload: IUpdateOwner, files?: any) => {
    const owner = await prisma.owner.findUnique({
        where: { user_id: userId },
    });

    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Owner profile not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...payload };

    if (files) {
        if (files.profile_picture?.[0]?.path) {
            updateData.profile_picture = files.profile_picture[0].path;
        }
        if (files.trade_license?.[0]?.path) {
            updateData.trade_license = files.trade_license[0].path;
        }
    }

    const updatedOwner = await prisma.owner.update({
        where: { user_id: userId },
        data: updateData,
    });

    return updatedOwner;
};

const getAllOwners = async (filters: IOwnerFilters, options: IPaginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

    const andConditions: Prisma.OwnerWhereInput[] = [];

    if (filters.searchTerm?.trim()) {
        const searchTerm = filters.searchTerm.trim();
        andConditions.push({
            OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
        });
    }

    const whereCondition: Prisma.OwnerWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    whereCondition.isDeleted = false;

    const owners = await prisma.owner.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    const total = await prisma.owner.count({ where: whereCondition });
    return {
        meta: { page, limit, total },
        data: owners
    };
};

const updateOwnerApproval = async (ownerId: string) => {
    const owner = await prisma.owner.findUnique({
        where: { id: ownerId },
    });

    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Owner not found!");
    }

    const updatedOwner = await prisma.owner.update({
        where: { id: ownerId },
        data: { isApproved: true },
    });

    return updatedOwner;
};

const deleteOwner = async (ownerId: string) => {
    const existOwner = await prisma.owner.findUnique({
        where: { id: ownerId },
        include: {
            user: true
        }
    });

    if (!existOwner) {
        throw new AppError(status.NOT_FOUND, "Owner not found!");
    }

    if (existOwner.user.isDeleted) {
        throw new AppError(status.BAD_REQUEST, "Owner is already deleted!");
    }

    const result = await prisma.$transaction(async (tx) => {
        const deletedOwner = await tx.owner.update({
            where: { id: ownerId },
            data: {
                isDeleted: true,
                deletedAt: new Date()
            }
        });

        await tx.user.update({
            where: { id: existOwner.user_id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: UserStatus.DELETED
            }
        });

        await tx.session.deleteMany({
            where: {
                userId: existOwner.user_id
            }
        })

        return deletedOwner;
    })



    return result;
};

export const ownerService = {
    getOwnerProfile,
    getOwnerProfileById,
    updateOwnerProfile,
    getAllOwners,
    updateOwnerApproval,
    deleteOwner
};