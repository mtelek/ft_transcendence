import { NextResponse } from "next/server";

export function jsonOk<T>(payload: T, status = 200) {
  return NextResponse.json(payload, { status });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
