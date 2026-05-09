// Runs on the server: gets session for this request.
import { getExistingUserSessionOrNull } from "@/lib/existingUserSession";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  // Resolve only sessions that still map to an existing DB user.
  const existingSessionResult = await getExistingUserSessionOrNull();
  const session = existingSessionResult?.session ?? null;

  // Pass session to the client header as initial state.
  // HeaderClient can still refresh it with useSession().
  return <HeaderClient session={session} />;
}
