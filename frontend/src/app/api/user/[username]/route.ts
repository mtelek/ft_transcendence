import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const user = await prisma.user.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
        wins: true,
        losses: true,
        handsPlayed: true,
        achievements: {
          select: {
            type: true,
            unlockedAt: true,
                }
            }
        },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    //! JUST FOR TESTING ! DELETE LATER !
    console.log("Fetched user:", user);
    //

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}