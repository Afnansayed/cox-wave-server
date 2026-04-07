import status from "http-status";
import z from "zod";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";

export const handleZodError = (error: z.ZodError): TErrorResponse => {
       const statusCode = status.BAD_REQUEST;
       const message = "Validation error";
       const errorSources: TErrorSources[] = [];

       error.issues.forEach((issue) => {
        errorSources.push({
             path: issue.path.join(" => "),
             message: issue.message,
        });
       });

       return {
        statusCode,
        success: false,
        message,
        errorSources,
       }
}