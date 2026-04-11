import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ownerService } from "./owner.service";


const getOwnerProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await ownerService.getOwnerProfile(userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Owner profile retrieved successfully',
        data: result
    });
});
const getOwnerProfileById = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.params.id as string;
    const result = await ownerService.getOwnerProfileById(ownerId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Owner profile retrieved successfully',
        data: result
    });
});

const updateOwnerProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const files = req.files as | { [fieldname: string]: Express.Multer.File[] } | undefined;

    console.log({ payload: req.body });
    console.log({ files });

    const result = await ownerService.updateOwnerProfile(userId, req.body, files);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Owner profile updated successfully',
        data: result
    });
});

const updateOwnerApproval = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.params.id as string;
    const result = await ownerService.updateOwnerApproval(ownerId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Owner approval updated successfully',
        data: result
    });
});

const getAllOwners = catchAsync(async (req: Request, res: Response) => {
    const result = await ownerService.getAllOwners();

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Owners retrieved successfully',
        data: result
    });
});

const deleteOwner = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.params.id as string;
    const result = await ownerService.deleteOwner(ownerId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Owner deleted successfully',
        data: result
    });
});


export const ownerController = {
    getOwnerProfile,
    getOwnerProfileById,
    updateOwnerProfile,
    getAllOwners,
    deleteOwner,
    updateOwnerApproval
};