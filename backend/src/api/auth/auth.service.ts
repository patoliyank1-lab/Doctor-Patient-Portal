import { Prisma } from "../../../prisma/generated/client/client";
import { prisma } from "../../config/database";
import type { UserType } from "../../types";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { comparePassword, hashPassword } from "../../utils/password";
import { createToken } from "../../utils/token";

/**
 * create new user
 * @param user user details
 * @returns return new created user's email and username
 */
export const register = async (user: UserType) => {
  try {
    user.passwordHash = await hashPassword(user.passwordHash);

    const newUser = await prisma.user.create({ data: user });

    return {
      email: newUser.email,
      role: newUser.role,
    };
  } catch (error) {
    if(error instanceof Prisma.PrismaClientKnownRequestError)
      throw new AppError("This Email is Alredy register", 409);
    throw new UnknownError(error);
  }
};


/**
 * login user with email or username.
 * @param param0 - user email or username and password.
 * @returns return user details and tokens
 */
export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  //check user is register or not.
  const user = await prisma.user.findFirst({where:{
    email
  }});
  if (!user) {
    throw new AppError("Email is not register.", 400);
  }

  const isSame = await comparePassword(password, user.passwordHash);
  if (!isSame) {
    throw new AppError("email or password incorrect.", 401);
  }

  // create access and refresh Tokens
  const accessToken = createToken(
    user.id,
    user.email,
    60 * 15, // expiry of access Token 15 min.
  );
  const refreshToken = createToken(user.id, user.email);

  /**
   * check user session by using userId, ipAddress, deviceType
   * if exist then update refresh token otherwise create new session
   */
  const userSession = await prisma.userSession.upsert({
    where: {
      userId_ipAddress_deviceType: {
        userId: user.id,
        ipAddress,
        deviceType,
      },
    },
    update: {
      refreshTokenHash: refreshToken,
    },
    create: {
      userId: user.id,
      ipAddress,
      deviceType,
      refreshTokenHash: refreshToken,
      // 7 Day from current Time
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(Date.now()),
    },
  });

  // return session details.
  return {
    userId: userSession.userId,
    emailOrUsername,
    lastActiveAt: userSession.lastActiveAt,
    expiresAt: userSession.expiresAt,
    Token: {
      refreshToken,
      accessToken,
    },
  };
};