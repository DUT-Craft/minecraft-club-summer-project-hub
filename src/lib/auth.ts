import crypto from "node:crypto";

import { cookies } from "next/headers";

import { getAdminConfig } from "@/lib/env";

type SessionPayload = {
  role: "admin" | "project-owner";
  exp: number;
  projectId?: string;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(value: string, secret: string) {
  return base64Url(crypto.createHmac("sha256", secret).update(value).digest());
}

export function createSessionToken() {
  const config = getAdminConfig();
  const payload: SessionPayload = {
    role: "admin",
    exp: Date.now() + config.maxAgeSeconds * 1000,
  };
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, config.sessionSecret)}`;
}

export function createProjectOwnerSessionToken(projectId: string) {
  const config = getAdminConfig();
  const payload: SessionPayload = {
    role: "project-owner",
    projectId,
    exp: Date.now() + config.maxAgeSeconds * 1000,
  };
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, config.sessionSecret)}`;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | undefined) {
  if (!stored) {
    return false;
  }

  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    return false;
  }

  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  if (candidate.length !== hash.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

function decodeSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const config = getAdminConfig();
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded, config.sessionSecret);
  if (signature.length !== expected.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string | undefined) {
  const payload = decodeSessionToken(token);
  return payload?.role === "admin";
}

export async function isAdminRequest() {
  const config = getAdminConfig();
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(config.cookieName)?.value);
}

export async function getProjectOwnerSession() {
  const config = getAdminConfig();
  const cookieStore = await cookies();
  const payload = decodeSessionToken(cookieStore.get(`${config.cookieName}_project`)?.value);

  if (payload?.role !== "project-owner" || !payload.projectId) {
    return null;
  }

  return { projectId: payload.projectId };
}

export async function requireAdmin() {
  const ok = await isAdminRequest();
  if (!ok) {
    throw new Error("请先登录管理后台。");
  }
}
