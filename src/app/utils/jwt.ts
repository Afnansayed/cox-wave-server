/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";



const createToken = (payload: JwtPayload , secret: string, {expiresIn}: SignOptions) => {
    const signOptions: SignOptions = expiresIn ? { expiresIn } : {};
    const token = jwt.sign(payload, secret, signOptions);
      return token;
}

const verifyToken = (token: string, secret: string) => {
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        return {
            success: true,
            data: decoded
        };
    } catch (error: any) {
        return {
            success: false,
            data: error.message,
            error
        }
    }
}

const decodeToken = (token: string) => {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
}

export const jwtUtils = {
    createToken,
    verifyToken,
    decodeToken
}