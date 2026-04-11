import jwt from "jsonwebtoken";
import type { JWTPayload } from "../types";
import { lodVariable } from "./dotenv";

const secret = lodVariable("JWT_SECRET");

/**
 * create new JWT token with deffult expires one week
 * @param param0 JWT payload
 * @param ex expires time
 * @returns return new created JWT token.
 */
export const createToken = (
  { email, role, userId, doctorId, isApproved, patientId }: JWTPayload,
  ex?: number,
) => {
  const payload: JWTPayload = {
    userId,
    email,
    role,
    doctorId,
    isApproved,
    patientId,
  };

  const token = jwt.sign(payload, secret, {
    expiresIn: ex ?? "1w", // Token expires in 1 week hour
  });

  return token;
};
/**
 * verify JWT token 
 * @param token JWT token 
 * @returns return JWTPayload
 */
export const verifyToken = (token: string) => {
  const payload = jwt.verify(token, secret);
  return payload;
};
