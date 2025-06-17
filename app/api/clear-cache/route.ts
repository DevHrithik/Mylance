import { NextResponse } from "next/server";

export async function POST() {
  // This endpoint doesn't actually need to do anything
  // since the middleware cache is in-process and will clear naturally
  // This is just to provide a successful response
  return NextResponse.json({ success: true });
}
