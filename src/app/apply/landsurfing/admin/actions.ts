"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_PATH,
  ADMIN_TTL,
  checkPassword,
  makeToken,
} from "./auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: ADMIN_COOKIE_PATH,
    maxAge: ADMIN_TTL,
  });
  revalidatePath(ADMIN_COOKIE_PATH);
  return {};
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete({ name: ADMIN_COOKIE, path: ADMIN_COOKIE_PATH });
  revalidatePath(ADMIN_COOKIE_PATH);
}
