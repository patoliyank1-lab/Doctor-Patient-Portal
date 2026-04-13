import crypto from "node:crypto";
import { TokenType } from "../../prisma/generated/client/enums";
import { prisma } from "../config/database";

const sha256 = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const createOneTimeToken = async (params: {
  userId: string;
  type: TokenType;
  ttlMs: number;
}) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + params.ttlMs);

  // Ensure only one active token per (user,type)
  await prisma.verificationToken.deleteMany({
    where: {
      userId: params.userId,
      type: params.type,
      usedAt: null,
    },
  });

  await prisma.verificationToken.create({
    data: {
      userId: params.userId,
      type: params.type,
      token: tokenHash,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
};

export const consumeOneTimeToken = async (params: {
  rawToken: string;
  type: TokenType;
}) => {
  const tokenHash = sha256(params.rawToken);
  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!record || record.type !== params.type) return null;
  if (record.usedAt) return { record, status: "USED" as const };
  if (record.expiresAt.getTime() <= Date.now())
    return { record, status: "EXPIRED" as const };

  // Mark used (single-use)
  const used = await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { record: used, status: "OK" as const };
};

