import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { UserService } from "./user.service";
import { Request, Response } from "express";


const createOwner =  catchAsync(
    async (req: Request, res: Response) => {
        const files = req.files as
          | { [fieldname: string]: Express.Multer.File[] }
          | undefined;

        const payload ={
            password: req.body.password,
            owner: {
                ...req.body.owner,
                trade_license: files?.trade_license?.[0]?.path,
                profile_picture: files?.profile_picture?.[0]?.path,
        }}
        console.log({payload})
        const result = await UserService.createOwner(payload);
        sendResponse(res, {
            httpStatusCode: status.CREATED,
            success: true,
            message: 'Owner created successfully',
            data: result
        });
    }
)
  

export const UserController = {
  createOwner,
};