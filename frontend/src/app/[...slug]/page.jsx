import NotFound from "../not-found";

export default function SoftNotFoundPage() {
  // Render the 404-style UI for unknown routes, but return HTTP 200.
  return <NotFound />;
}
