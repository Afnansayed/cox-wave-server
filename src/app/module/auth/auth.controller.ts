import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";


const registerCustomer = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;

        console.log(payload);

        const result = await authService.registerCustomer(payload);

        sendResponse(res, {
            httpStatusCode: status.CREATED,
            success: true,
            message: "Customer registered successfully",
            data: result,
        })
    }
)

const loginUser = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;
        const result = await authService.loginUser(payload);
        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "User logged in successfully",
            data: result,
        })
    }
)

export const authController = {
    registerCustomer,
    loginUser
}