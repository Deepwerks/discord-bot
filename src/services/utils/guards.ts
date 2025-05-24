export function hasMiscProperty(error: unknown): error is { misc: unknown } {
  return typeof error === 'object' && error !== null && 'misc' in error;
}
