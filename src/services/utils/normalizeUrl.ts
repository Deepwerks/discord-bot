export function normalizeUrl(url: string): string {
  return url
    .split('/')
    .map((segment) => {
      if (/^\d+$/.test(segment)) return ':id';
      if (/^[0-9a-fA-F-]{36}$/.test(segment)) return ':uuid';
      return segment;
    })
    .join('/');
}
