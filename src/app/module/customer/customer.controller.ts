import { Request, Response } from "express";
import { sendResponse } from "../../shared/sendResponse";
import { CustomerService } from "./customer.service";
import { catchAsync } from "../../shared/catchAsync";
import status from "http-status";


const getCustomerProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await CustomerService.getCustomerProfile(userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Customer profile retrieved successfully',
        data: result
    });
});

const updateCustomerProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const files = req.files as | { [fieldname: string]: Express.Multer.File[] } | undefined;

    console.log({ payload: req.body });
    console.log({ files });

    const result = await CustomerService.updateCustomerProfile(userId, req.body, files);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Customer profile updated successfully',
        data: result
    });
});

export const CustomerController = {
  getCustomerProfile,
  updateCustomerProfile
};