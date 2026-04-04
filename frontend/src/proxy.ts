import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Pass through - no middleware logic needed currently
  return NextResponse.next();
}

export const config = {
  matcher: [], // Empty matcher means proxy won't run
};