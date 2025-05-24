import SteamOpenID from 'node-steam-openid';
import config from '../../../config';
import express from 'express';
import SteamID from 'steamid';
import { logger } from '../../..';
import { consumeToken } from '../../stores/SteamLinkTokenStore';
import limiter from '../middlewares/rateLimit';
import StoredPlayerSchema from '../../../base/schemas/StoredPlayerSchema';

const steam = new SteamOpenID({
  realm: config.deadlock_assistant_url,
  returnUrl: config.deadlock_assistant_url + '/auth/steam/authenticate',
  apiKey: config.steam_api_key,
});

const router = express.Router();

router.get('/auth/steam', limiter, async (req, res, next) => {
  const token = req.query.token as string;
  if (!token) return next('Missing token');

  const discordId = consumeToken(token);
  if (!discordId) return next('Invalid or expired token');

  res.cookie('discordId', discordId, {
    httpOnly: true,
    maxAge: 5 * 60 * 1000,
    sameSite: 'lax',
  });

  try {
    logger.info('Requesting Steam redirect URL', {
      discordId,
      ip: req.ip,
      route: '/auth/steam',
    });

    const redirectUrl = await steam.getRedirectUrl();
    res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
});

router.get('/auth/steam/authenticate', limiter, async (req, res, next) => {
  try {
    const discordId = req.cookies?.discordId;
    if (!discordId) return next('Missing discord id in session');

    logger.info('Authenticating with Steam', {
      discordId,
      ip: req.ip,
      route: '/auth/steam/authenticate',
    });

    const steamAccount = await steam.authenticate(req);
    const steamId64 = steamAccount.steamid;

    const sid = new SteamID(steamId64);
    const statlockerId = sid.getSteam3RenderedID().replace('[', '').replace(']', '').split(':')[2];

    await StoredPlayerSchema.updateOne(
      { discordId },
      { steamId: statlockerId, steamIdType: 'steamID3', authenticated: true },
      {
        upsert: true,
      }
    );

    res.status(200).send("✅ Steam account linked! You're all set — this window can be closed.");
  } catch (error) {
    logger.error('Steam authentication failed', {
      error,
      ip: req.ip,
      route: '/auth/steam/authenticate',
    });

    next(error);
  }
});

export default router;
