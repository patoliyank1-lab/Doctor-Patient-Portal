import jwt from "jsonwebtoken";
import type { JWTPayload } from "../types";
import { lodVariable } from "./dotenv";

const secret: jwt.Secret = lodVariable("JWT_SECRET");
const ACCESS_TOKEN_EXPIRES_IN: jwt.SignOptions["expiresIn"] = "15m";
const REFRESH_TOKEN_EXPIRES_IN: jwt.SignOptions["expiresIn"] = "7d";

/**
 * create new JWT token with deffult expires one week
 * @param param0 JWT payload
 * @param ex expires time
 * @returns return new created JWT token.
 */
export const createToken = (
  pl: JWTPayload,
  ex?: jwt.SignOptions["expiresIn"],
) => {
  const payload: Record<string, unknown> = {
    userId: pl.userId,
    email: pl.email,
    role: pl.role,
  };

  if(pl.doctorId){
    payload.doctorId = pl.doctorId;
    payload.isApproved = pl.isApproved;
  }

  if(pl.patientId) payload.patientId = pl.patientId;

  const token = jwt.sign(payload, secret, {
    expiresIn: ex ?? "1w",
  });

  return token;
};

export const createAccessToken = (pl: JWTPayload) => {
  return createToken(pl, ACCESS_TOKEN_EXPIRES_IN);
};

export const createRefreshToken = (pl: JWTPayload) => {
  return createToken(pl, REFRESH_TOKEN_EXPIRES_IN);
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
