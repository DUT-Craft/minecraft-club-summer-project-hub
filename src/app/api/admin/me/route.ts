import { isAdminRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const authenticated = await isAdminRequest();
    return jsonOk({ authenticated });
  } catch (error) {
    return jsonError(error);
  }
}
