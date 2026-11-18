export function requiredText(value: string, max: number): string {
  const text = value.trim();
  if (!text || text.length > max)
    throw new Error(`Please enter between 1 and ${max} characters.`);
  return text;
}
export function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !!url.hostname;
  } catch {
    return false;
  }
}
