import type { CookieOptions, Response } from "express";

export type ApiSuccessResponse<TData> = {
  success: true;
  message: string;
  data: TData;
  errors: null;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  data: null;
  errors: string[] | null;
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

const ONE_MINUTE_MS = 60 * 1000;
const ACCESS_TOKEN_MAX_AGE_MS = 15 * ONE_MINUTE_MS;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * ONE_MINUTE_MS;

export const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

const defaultCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
  };
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) => {
  const opts = defaultCookieOptions();
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, {
    ...opts,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
    ...opts,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
};

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
  const opts = defaultCookieOptions();
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    ...opts,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
};

export const clearAuthCookies = (res: Response) => {
  const opts = defaultCookieOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, opts);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, opts);
};

export const formattedResponse = <TData>(
  res: Response,
  status: number,
  data: TData,
  message: string,
  tokens?: { accessToken: string; refreshToken: string },
) => {
  if (tokens) setAuthCookies(res, tokens);
  const body: ApiSuccessResponse<TData> = {
    success: true,
    message,
    data,
    errors: null,
  };
  return res.status(status).json(body);
};

export const formattedError = (
  res: Response,
  status: number,
  message: string,
  errors: string[] | null = null,
) => {
  const body: ApiErrorResponse = {
    success: false,
    message,
    data: null,
    errors,
  };
  return res.status(status).json(body);
};
