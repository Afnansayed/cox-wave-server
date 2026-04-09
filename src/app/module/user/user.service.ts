import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateOwner } from "./user.interface";
import { auth } from "../../lib/auth";
import { Role } from "../../../generated/prisma/enums";

const createOwner = async (owner: ICreateOwner) => {
  const { password, owner: ownerData } = owner;

  const existUser = await prisma.user.findUnique({
    where: {
      email: ownerData.email,
    },
  });

  if (existUser) {
    throw new AppError(
      status.BAD_REQUEST,
      "User with this email already exists",
    );
  }

  const newUser = await auth.api.signUpEmail({
    body: {
      name: ownerData.name,
      email: ownerData.email,
      password: password,
      role: Role.OWNER,
      needPasswordChange: true,
    },
  });

  if (!newUser.user) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create user");
  }

  try {
      const result = await prisma.$transaction(async (tx) => {
        const createdOwner = await tx.owner.create({
          data: {
            user_id: newUser.user.id,
            ...ownerData
          },
        });

        const owner = await tx.owner.findUnique({
          where: {
            id: createdOwner.id,
          },
            include: {
              events: true,
            }

        });
        return owner;
      });
      return result;
  }catch (error) {
    //* If any error occurs during the transaction, delete the created user in auth service to maintain data consistency
    console.error("Transaction error:", error);
    await prisma.user.delete({
        where: {
            id: newUser.user.id
        }
    });
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create owner record, registration rolled back");
  }
};

export const UserService = {
  createOwner,
};
