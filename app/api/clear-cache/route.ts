import { NextResponse } from "next/server";

// Import middleware cache (we'll need to export it from middleware)
declare global {
  // eslint-disable-next-line no-var
  var middlewareProfileCache:
    | Map<string, { data: any; timestamp: number }>
    | undefined;
}

export async function POST() {
  try {
    // Clear the global middleware cache
    if (global.middlewareProfileCache) {
      global.middlewareProfileCache.clear();
      console.log("Middleware cache cleared successfully");
    }

    return NextResponse.json({ success: true, message: "Cache cleared" });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
