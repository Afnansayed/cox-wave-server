import status from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";

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
            // role: "customer" as default
        }
    })
    if(!data.user){
        throw new AppError(status.BAD_REQUEST, "Failed to register customer");
    }

    try{
        //* crate a customer record in the database with the user_id from the auth service
        const customer =  await prisma.$transaction(async(tx) => {
            const createdCustomer = await tx.customer.create({
                data: {
                    user_id: data.user.id,
                    name,
                    email,
                }
            })
         return createdCustomer;   
        })
        
        //* generate access token and refresh token for the registered customer
        const accessToken = tokenUtils.getAccessToken({
            userId: data.user.id,
            email: data.user.email,
            role: data.user.role,
            status: data.user.status,
            name: data.user.name,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });

        const refreshToken = tokenUtils.getRefreshToken({
            userId: data.user.id,
            email: data.user.email,
            role: data.user.role,
            status: data.user.status,
            name: data.user.name,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });

        return{
            ...data,
            customer,
            accessToken,
            refreshToken
        }

    }catch(error){
        console.log("transaction error:", error);
        // if there is an error during the transaction, delete the user from the auth service to maintain data consistency
        await prisma.user.delete({
            where: {
                id: data.user.id
            }
        });
        throw new AppError(status.BAD_REQUEST, "Failed to register customer");
    }
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
        throw new AppError(status.BAD_REQUEST, "User is deleted and cannot login");
    }
    if(data.user.status === UserStatus.BLOCKED){
        throw new AppError(status.BAD_REQUEST, "User is blocked and cannot login");
    }
    
    //* generate access token and refresh token for the logged in user
    const accessToken = tokenUtils.getAccessToken({
            userId: data.user.id,
            email: data.user.email,
            role: data.user.role,
            status: data.user.status,
            name: data.user.name,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });
    const refreshToken = tokenUtils.getRefreshToken({
            userId: data.user.id,
            email: data.user.email,
            role: data.user.role,
            status: data.user.status,
            name: data.user.name,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });
    return {
        ...data,
        accessToken,
        refreshToken
    };
};

const getNewToken = async (refreshToken: string, sessionToken: string) => {
  const isSessionTokenExist = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!isSessionTokenExist) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }

  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET,
  );

  if (!verifiedRefreshToken.success && verifiedRefreshToken.error) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  //** create tokens */
  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });
  //  ** refresh token
  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const { token } = await prisma.session.update({
    where: {
      token: sessionToken,
    },
    data: {
      token: sessionToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
      updatedAt: new Date(),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: token,
  };
};

export const authService = {
    registerCustomer,
    loginUser,
    getNewToken
}