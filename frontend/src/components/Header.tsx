import Link from "next/link";
import { auth } from "@/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <Link href="/" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
        ft_transcendence
      </Link>
      <nav className="flex gap-4">
        {session ? (
          <>
            <span className="px-4 py-2 text-gray-600">Hey, {session.user?.name}</span>
            <Link href="/poker" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
              Poker
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
              Login
            </Link>
            <Link href="/register" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
