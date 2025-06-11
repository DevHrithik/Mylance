import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  // Redirect to the main callback route with all query parameters
  const callbackUrl = new URL("/callback", url.origin);
  callbackUrl.search = url.search; // Copy all query parameters

  return NextResponse.redirect(callbackUrl);
}
