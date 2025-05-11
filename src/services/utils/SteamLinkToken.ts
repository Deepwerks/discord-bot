import crypto from "crypto";
import config from "../../config";
import { storeToken } from "../stores/SteamLinkTokenStore";

const SECRET = config.secret;

export function generateSteamLinkToken(discordId: string): string {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = `${discordId}:${expiresAt}`;
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  const token = Buffer.from(`${payload}:${hmac}`).toString("base64");

  storeToken(token, discordId, expiresAt);

  return token;
}

export function verifySteamLinkToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const [discordId, expiresAtStr, hmac] = decoded.split(":");
    const expiresAt = parseInt(expiresAtStr);
    if (Date.now() > expiresAt) return null;

    const expectedHmac = crypto
      .createHmac("sha256", SECRET)
      .update(`${discordId}:${expiresAt}`)
      .digest("hex");

    if (hmac !== expectedHmac) return null;
    return discordId;
  } catch {
    return null;
  }
}
