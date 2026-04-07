import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import status from "http-status";
import { sendResponse } from "../../shared/sendResponse";
import { ownerService } from "./owner.service";


const createOwner = catchAsync(
    async (req: Request, res: Response) => {
        // const payload = req.body;
       await ownerService.createOwner();
         
     

   
        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "User logged in successfully",
            data: "testing auth"
        })
    }
);

export const ownerController = {
    createOwner
}