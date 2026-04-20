import { DEFAULT_AVATAR } from "@/lib/avatar";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    //Normalize incoming values once so checks stay compact and consistent
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const username = typeof body.username === "string" ? body.username.trim() : undefined;
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return jsonError("Email and password are required", 400);
    }

    if (!EMAIL_RE.test(email)) {
      return jsonError("Invalid email format", 400);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return jsonError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
    }

    //Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(username ? [{ username }] : [])],
      },
    });

    if (existingUser) {
      return jsonError("Email or username already taken", 400);
    }

    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        image: DEFAULT_AVATAR,
      },
    });

    return jsonOk({ message: "User created", userId: user.id }, 201);
  } catch {
    return jsonError("Something went wrong", 500);
  }
}