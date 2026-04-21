import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IUpdateCustomer } from "./customer.interface";

const getCustomerProfile = async (userId: string) => {
    const owner = await prisma.customer.findUnique({
        where: {
            user_id: userId,
            isDeleted: false
        }
    });


    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Customer profile not found");
    }

    if(userId !== owner.user_id) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to access this profile");
    }

    return owner;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateCustomerProfile = async (userId: string, payload: IUpdateCustomer, files?: any) => {
    const owner = await prisma.customer.findUnique({
        where: { user_id: userId },
    });

    if (!owner) {
        throw new AppError(status.NOT_FOUND, "Customer profile not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...payload };

    if (files) {
        if (files.profile_picture?.[0]?.path) {
            updateData.profile_picture = files.profile_picture[0].path;
        }
    }

    const updatedCustomer = await prisma.customer.update({
        where: { user_id: userId },
        data: updateData,
    });

    return updatedCustomer;
};

export const CustomerService = {
    getCustomerProfile,
    updateCustomerProfile
}
