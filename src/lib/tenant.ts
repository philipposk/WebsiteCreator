// Server-side tenant resolver. Returns a stable id per visitor (auth user id when
// signed in, otherwise an anonymous cookie id). Used to namespace blob keys so
// users do not overwrite each other's drafts.

import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { auth } from "@/auth";

const COOKIE_NAME = "wc_anon";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type Tenant = {
  id: string;
  kind: "user" | "anon";
};

export async function getTenant(): Promise<Tenant> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (userId) return { id: `u_${userId}`, kind: "user" };
  } catch {
    // Auth not configured — fall through to anon.
  }

  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return { id: `a_${existing}`, kind: "anon" };

  const fresh = nanoid(21);
  jar.set(COOKIE_NAME, fresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return { id: `a_${fresh}`, kind: "anon" };
}

export function tenantPrefix(t: Tenant): string {
  return `tenants/${t.id}`;
}
