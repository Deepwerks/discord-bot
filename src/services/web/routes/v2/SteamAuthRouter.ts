import express from 'express';
import limiter from '../../middlewares/rateLimit';
import { authenticateSteamOpenID, getSteamRedirectUrl } from '../../helpers/steamOpenIdClient';
import { logger } from '../../../..';
import SteamID from 'steamid';
import dayjs from 'dayjs';
import { StoredPlayers } from '../../../database/orm/init';
import { tokenStore } from '../../../redis/stores/SteamLinkTokenStore';

const router = express.Router();

router.get('/auth/steam', limiter, async (req, res, next) => {
  const token = req.query.token as string;
  if (!token) return next('Missing token');

  const discordId = await tokenStore.consumeToken(token);
  if (!discordId) return next('Invalid or expired token');

  const storedProfile = await StoredPlayers.findOne({ where: { discordId } });

  if (storedProfile?.authenticated) {
    if (
      storedProfile.reauthAfter &&
      dayjs().isBefore(dayjs(storedProfile.reauthAfter)) &&
      (storedProfile.authCount ?? 0) > 5
    ) {
      logger.warn('Reauthentication blocked due to cooldown', {
        discordId: storedProfile.discordId,
        steamId: storedProfile.steamId,
        ip: req.ip,
        authenticationCount: storedProfile.authCount,
        reauthenticateAfter: storedProfile.reauthAfter.toISOString(),
        route: '/auth/steam',
      });
      return next(
        `🕒 You can reauthenticate after ${dayjs(storedProfile.reauthAfter).format('YYYY-MM-DD HH:mm:ss')}`
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

    const [player, created] = await StoredPlayers.findOrCreate({
      where: { discordId },
      defaults: {
        steamId: statlockerId,
        authenticated: true,
        reauthAfter: dayjs().add(24, 'hours').toDate(),
        authCount: 1,
      },
    });

    if (!created) {
      await player.increment('authCount');
      await player.update({
        steamId: statlockerId,
        authenticated: true,
        reauthAfter: dayjs().add(24, 'hours').toDate(),
      });
    }

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
