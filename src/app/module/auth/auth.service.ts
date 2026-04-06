import { UserStatus } from "../../../generated/prisma/enums";
import { auth } from "../../lib/auth";

interface IRegisterCustomer {
    name: string;
    email: string;
    password: string;
}

const registerCustomer = async (payload: IRegisterCustomer) => {
    const { name, email, password } = payload;

    const data = await auth.api.signUpEmail({
        body: {
            email,
            password,
            name,
            // role: "PATIENT" # better-auth will automatically set the default role to PATIENT, so we don't need to specify it here
        }
    })
    if(!data.user){
        throw new Error("Failed to register customer");
    }
    return data;
}

interface IloginUser  {
    email: string;
    password: string;
}

const loginUser = async (payload: IloginUser) => {
    const { email, password } = payload;
    
    const data = await auth.api.signInEmail({
        body: {
            email,
            password
        }
    })

    if(data.user.isDeleted || data.user.status === UserStatus.DELETED){
        throw new Error("User is deleted and cannot login");
    }
    if(data.user.status === UserStatus.BLOCKED){
        throw new Error("User is blocked and cannot login");
    }

    return data;
}

export const authService = {
    registerCustomer,
    loginUser
}