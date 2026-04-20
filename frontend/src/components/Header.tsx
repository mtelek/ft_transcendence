// Runs on the server: gets session for this request.
import { auth } from "@/auth";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  // Resolve auth data from cookies/session on the server.
  const session = await auth();

  // Pass session to the client header as initial state.
  // HeaderClient can still refresh it with useSession().
  return <HeaderClient session={session} />;
}
