//This catch-all auth route only forwards requests to the centralized NextAuth handlers
//All auth logic (providers, callbacks, adapter, session config) lives in src/auth.ts
export { GET, POST } from "@/auth";
