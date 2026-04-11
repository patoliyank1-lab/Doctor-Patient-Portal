import { type Response } from "express";
const ONE_HOUR = 60 * 60 * 1000;

/**
 * send formatted Response
 * @param req express Request
 * @param res express Response
 * @param data data which is send to be user.
 * @param status - optional - status code by default 200.
 * @param accessToken - optional - access Token.
 * @param refreshToken - optional - refresh Token.
 */
export const formattedResponse = (
  res: Response,
  status: number = 200,
  data?: unknown,
  message?: string,
  accessToken?: string,
  refreshToken?: string,
) => {
  const response: Record<string, unknown> = { success: true, status };

  if (data) response.data = data;
  if (message) response.message = message;

  if (accessToken) {
    res.cookie("access-token", accessToken, {
      maxAge: ONE_HOUR,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  }
  if (refreshToken) {
    res.cookie("refresh-token", refreshToken, {
      maxAge: 24 * ONE_HOUR,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  }

  return res.status(status).json(response);
};
