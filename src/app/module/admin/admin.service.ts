import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IUpdateAdmin } from "./admin.interface";


const getAdminProfile = async (userId: string) => {
    const owner = await prisma.admin.findUnique({
        where: {
            user_id: userId,
            isDeleted: false
        }
    });


    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Admin profile not found");
    }

    if(userId !== owner.user_id) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to access this profile");
    }

    return owner;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateAdminProfile = async (userId: string, payload: IUpdateAdmin, files?: any) => {
    const owner = await prisma.admin.findUnique({
        where: { user_id: userId },
    });

    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Admin profile not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...payload };

    if (files) {
        if (files.profile_picture?.[0]?.path) {
            updateData.profile_picture = files.profile_picture[0].path;
        }
    }

    const updatedAdmin = await prisma.admin.update({
        where: { user_id: userId },
        data: updateData,
    });

    return updatedAdmin;
};

export const AdminService = {
    getAdminProfile,
    updateAdminProfile
}
