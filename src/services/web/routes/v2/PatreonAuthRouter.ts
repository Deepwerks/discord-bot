import express from 'express';
import limiter from '../../middlewares/rateLimit';
import { logger } from '../../../..';
import { PatreonLinks } from '../../../database/orm/init';
import { patreonLinkTokenStore } from '../../../redis/stores/PatreonLinkTokenStore';

const router = express.Router();

router.get('/auth/patreon/callback', limiter, async (req, res, next) => {
  try {
    const { session_token, tier, tier_name, rate_limit, state } = req.query;

    if (!session_token || !state) {
      res.status(400).send(errorPage('Missing required parameters. Please try linking again.'));
      return;
    }

    const stateData = await patreonLinkTokenStore.consumeState(state as string);

    if (!stateData) {
      res.status(400).send(errorPage('Invalid or expired link request. Please run /link-patreon again.'));
      return;
    }

    const { discordUserId, guildId } = stateData;

    await PatreonLinks.upsert({
      discordUserId,
      guildId,
      patreonSessionToken: session_token as string,
      tier: tier ? Number(tier) : 0,
      tierName: (tier_name as string) || null,
      rateLimit: rate_limit ? Number(rate_limit) : null,
      isActive: true,
    });

    logger.info('Patreon account linked', {
      discordUserId,
      guildId,
      tier,
      tierName: tier_name,
      route: '/auth/patreon/callback',
    });

    res.status(200).send(successPage());
  } catch (err) {
    logger.error('Patreon OAuth callback failed', {
      error: err,
      ip: req.ip,
      route: '/auth/patreon/callback',
    });
    next(err);
  }
});

function successPage(): string {
  return `<!DOCTYPE html>
<html>
<head><title>Patreon Linked</title></head>
<body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
  <div style="text-align: center;">
    <h1>Patreon account linked successfully!</h1>
    <p>You can close this tab.</p>
  </div>
</body>
</html>`;
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html>
<head><title>Link Failed</title></head>
<body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
  <div style="text-align: center;">
    <h1>Something went wrong</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

export default router;
