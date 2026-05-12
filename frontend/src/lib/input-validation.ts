const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
export const MAX_USERNAME_LENGTH = 15;

export function normalizeTextInput(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRequiredInput(value: string | null | undefined, label: string) {
  return normalizeTextInput(value) ? null : `${label} is required`;
}

export function validateEmailInput(value: string | null | undefined) {
  const normalized = normalizeTextInput(value);

  if (!normalized) {
    return "Email is required";
  }

  if (!EMAIL_RE.test(normalized)) {
    return "Invalid email format";
  }

  return null;
}

export function validateUsernameInput(value: string | null | undefined) {
  const normalized = normalizeTextInput(value);

  if (!normalized) {
    return "Username is required";
  }

  if (normalized.length > MAX_USERNAME_LENGTH) {
    return `Username must be ${MAX_USERNAME_LENGTH} characters or less`;
  }

  return null;
}

export function validatePasswordInput(value: string | null | undefined) {
  if (typeof value !== "string" || value.length === 0) {
    return "Password is required";
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  return null;
}
