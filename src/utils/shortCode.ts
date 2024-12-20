export function extractShortcodeFromUrl(url: string | null) {
  if (url) {
    const match = url.match(/\/(p|r)\/([^/]+)\//);
    return match ? match[2] : null;
  }
  return null;
}
