import { ICreateOwner } from "./owner.interface";

const createOwner = async (payload: ICreateOwner) => {
    console.log({payload})
};

export const ownerService = {
    createOwner,
    
}