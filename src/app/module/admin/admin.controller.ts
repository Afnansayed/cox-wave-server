import { Request, Response } from "express";
import { sendResponse } from "../../shared/sendResponse";

import { catchAsync } from "../../shared/catchAsync";
import status from "http-status";
import { AdminService } from "./admin.service";


const getAdminProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await AdminService.getAdminProfile(userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Admin profile retrieved successfully',
        data: result
    });
});

const updateAdminProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const files = req.files as | { [fieldname: string]: Express.Multer.File[] } | undefined;

    // console.log({ payload: req.body });
    // console.log({ files });

    const result = await AdminService.updateAdminProfile(userId, req.body, files);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Admin profile updated successfully',
        data: result
    });
});

export const AdminController = {
  getAdminProfile,
  updateAdminProfile
};