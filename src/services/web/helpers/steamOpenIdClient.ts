import Bottleneck from 'bottleneck';
import { Request } from 'express';
import config from '../../../config';

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';

const steamRealm = config.deadlock_assistant_url;
const steamReturnUrl = config.deadlock_assistant_url + '/auth/steam/authenticate';

// Enforce rate limit (1 request every 4 seconds)
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 4000,
});

export async function authenticateSteamOpenID(req: Request): Promise<{ steamId64: string }> {
  const params = req.query;

  // Construct OpenID assertion
  const identifierParam = params['openid.claimed_id'];
  let identifier: string | undefined;

  if (typeof identifierParam === 'string') {
    identifier = identifierParam;
  } else if (Array.isArray(identifierParam) && typeof identifierParam[0] === 'string') {
    identifier = identifierParam[0];
  }

  const match = identifier?.match(/https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/);

  if (!match) {
    throw new Error('Invalid Steam OpenID response');
  }

  return limiter.schedule(async () => {
    const steamId64 = match[1];
    return { steamId64 };
  });
}

// Helper to construct login URL
export function getSteamRedirectUrl(token: string) {
  const query = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${steamReturnUrl}?token=${token}`,
    'openid.realm': steamRealm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return `${STEAM_OPENID_ENDPOINT}?${query.toString()}`;
}
