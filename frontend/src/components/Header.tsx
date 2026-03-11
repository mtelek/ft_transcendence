import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <Link href="/" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
        ft_transcendence
      </Link>
      <nav className="flex gap-4">
        <Link
          href="/"
          //className="px-4 py-2 rounded hover:bg-gray-100"
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Home
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Login
        </Link>
      </nav>
    </header>
  );
}
