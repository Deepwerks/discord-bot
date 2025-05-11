const tokenStore = new Map<string, { discordId: string; expiresAt: number }>();

export function storeToken(
  token: string,
  discordId: string,
  expiresAt: number
) {
  tokenStore.set(token, { discordId, expiresAt });
}

export function consumeToken(token: string): string | null {
  const entry = tokenStore.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(token);
    return null;
  }

  tokenStore.delete(token);
  return entry.discordId;
}

export function cleanUpTokens() {
  setInterval(() => {
    const now = Date.now();
    for (const [token, entry] of tokenStore.entries()) {
      if (entry.expiresAt < now) tokenStore.delete(token);
    }
  }, 5 * 60 * 1000);
}
