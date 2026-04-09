import AppError from "../../errorHelpers/AppError";
import { ICreateOwner } from "./owner.interface";

const createOwner = async (payload: ICreateOwner) => {
    throw new AppError(500, "Owner creation is not implemented yet");
    console.log({payload})
};

export const ownerService = {
    createOwner,
    
}