type ApiErrorPayload = {
  error?: string;
};

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackError: string
) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok || data.error) {
    throw new Error(data.error || fallbackError);
  }

  return data as T;
}
