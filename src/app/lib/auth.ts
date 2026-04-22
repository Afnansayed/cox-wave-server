import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { bearer, emailOTP, oAuthProxy } from "better-auth/plugins";
import { sendEmail } from "../utils/email";
import { envVars } from "../config/env";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),

    baseURL:envVars.FRONTEND_URL,
    trustedOrigins: [envVars.FRONTEND_URL!],

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },

    emailVerification: {
        sendOnSignIn: true,
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
    },

    user: {
        additionalFields: {
          role: {
                type: "string",
                required: true,
                defaultValue: Role.CUSTOMER
            },

            status: {
                type: "string",
                required: true,
                defaultValue: UserStatus.ACTIVE
            },

            needPasswordChange: {
                type: "boolean",
                required: true,
                defaultValue: false
            },

            isDeleted: {
                type: "boolean",
                required: true,
                defaultValue: false
            },

            deletedAt: {
                type: "date",
                required: false,
                defaultValue: null
            },
        }
    },

    advanced: {
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          partitioned: true,
        },
      },
      state: {
        attributes: {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          partitioned: true,
        },
      },
    },
  },

    plugins: [
        bearer(),
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp , type }) {
                if(type === "email-verification") {
                   const user = await prisma.user.findUnique({ where: { email } });

                    if(user && !user.emailVerified){
                        sendEmail({
                            to: email,
                            subject: "Verify Your Email",
                            templateName: "otp",
                            templateData: { name: user.name, otp }, 
                        })
                    } 
                }else if(type === "forget-password"){
                    const user = await prisma.user.findUnique({ where: { email } });

                    if(user){
                        sendEmail({
                            to: email,
                            subject: "Password Reset OTP",
                            templateName: "otp",
                            templateData: { name: user.name, otp }, 
                        })
                    }
                 }
            },
            expiresIn: 2 * 60,
            otpLength: 6,
        }),
        oAuthProxy()
    ],

    session: {
        expiresIn: 60 * 60 * 60 * 24, // 1 day in seconds
        updateAge: 60 * 60 * 60 * 24, // 1 day in seconds
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 60 * 24, // 1 day in seconds
        }
    },
});