export function redactSecret(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "<empty>";
  }

  if (trimmed.length <= 8) {
    return "*".repeat(trimmed.length);
  }

  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}
