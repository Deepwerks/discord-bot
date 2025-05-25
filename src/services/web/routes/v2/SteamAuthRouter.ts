import express from 'express';
import limiter from '../../middlewares/rateLimit';
import { consumeToken } from '../../../stores/SteamLinkTokenStore';
import { authenticateSteamOpenID, getSteamRedirectUrl } from '../../helpers/steamOpenIdClient';
import { logger } from '../../../..';
import SteamID from 'steamid';
import StoredPlayerSchema from '../../../../base/schemas/StoredPlayerSchema';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/auth/steam', limiter, async (req, res, next) => {
  const token = req.query.token as string;
  if (!token) return next('Missing token');

  const discordId = consumeToken(token);
  if (!discordId) return next('Invalid or expired token');

  const storedProfile = await StoredPlayerSchema.findOne({ discordId }).lean();

  if (storedProfile && storedProfile.authenticated) {
    if (
      storedProfile.reauthenticateAfter &&
      dayjs().isBefore(dayjs(storedProfile.reauthenticateAfter)) &&
      (storedProfile.authenticationCount ?? 0) > 5
    ) {
      logger.warn('Reauthentication blocked due to cooldown', {
        discordId: storedProfile.discordId,
        steamId: storedProfile.steamId,
        ip: req.ip,
        authenticationCount: storedProfile.authenticationCount,
        reauthenticateAfter: storedProfile.reauthenticateAfter.toISOString(),
        route: '/auth/steam',
      });
      return next(
        `🕒 You can reauthenticate after ${dayjs(storedProfile.reauthenticateAfter).format('YYYY-MM-DD HH:mm:ss')}`
      );
    }
  }

  res.cookie('discordId', discordId, {
    httpOnly: true,
    maxAge: 5 * 60 * 1000,
    sameSite: 'lax',
  });

  try {
    const redirectUrl = getSteamRedirectUrl(token);
    logger.info('Redirecting to Steam', { discordId, redirectUrl });
    res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
});

router.get('/auth/steam/authenticate', limiter, async (req, res, next) => {
  try {
    const discordId = req.cookies?.discordId;
    if (!discordId) {
      res.clearCookie('discordId');
      return next('Missing discordId in session');
    }

    const { steamId64 } = await authenticateSteamOpenID(req);

    const sid = new SteamID(steamId64);
    const statlockerId = sid.getSteam3RenderedID().replace('[', '').replace(']', '').split(':')[2];

    await StoredPlayerSchema.updateOne(
      { discordId },
      {
        steamId: statlockerId,
        steamIdType: 'steamID3',
        authenticated: true,
        reauthenticateAfter: dayjs().add(24, 'hours').toDate(),
        $inc: { authenticationCount: 1 },
      },
      { upsert: true }
    );

    res.status(200).send("✅ Steam account linked! You're all set — this window can be closed.");
  } catch (err) {
    logger.error('Steam OpenID auth failed', {
      error: err,
      ip: req.ip,
      discordId: req.cookies?.discordId,
      route: '/auth/steam/authenticate',
    });
    next(err);
  }
});

export default router;
