import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const authenticated = await isAdminRequest();
    return NextResponse.json({ authenticated });
  } catch (error) {
    return jsonError(error);
  }
}
