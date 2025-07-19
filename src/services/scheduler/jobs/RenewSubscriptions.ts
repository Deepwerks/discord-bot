import dayjs from 'dayjs';
import { logger } from '../../..';
import { GuildSubscriptions, sequelize } from '../../database/orm/init';
import CustomClient from '../../../base/classes/CustomClient';

const SUPPORT_SERVER_ID = '1363157938558210079';
const CHATBOT_PREMIUM_T1_ROLE_ID = '1396131129068752948';
const CHATBOT_PREMIUM_T2_ROLE_ID = '1396131850950410250';

export default async (client: CustomClient) => {
  try {
    const subscriptions = await GuildSubscriptions.findAll({ where: { isActive: true } });
    const oneMonthAgo = dayjs().subtract(1, 'month');

    logger.info(`Checking subscriptions of ${subscriptions.length} servers...`);
    for (const subscription of subscriptions) {
      if (dayjs(subscription.updatedAt).isBefore(oneMonthAgo)) {
        logger.info(`Found a server that has expired subscription...`);

        const guild = client.guilds.cache.get(SUPPORT_SERVER_ID);
        if (!guild) {
          logger.error(`Failed to find support server!`);
          await deactivateSubscription(subscription);
          continue;
        }

        const member = await guild.members.fetch({ user: subscription.userId, force: true });
        if (!member) {
          logger.error(`The server manager is no longer on the support server!`);
          await deactivateSubscription(subscription);
          continue;
        }

        const hasT2Role = member.roles.cache.has(CHATBOT_PREMIUM_T2_ROLE_ID);
        if (hasT2Role) {
          logger.info(`Manager has T2 role...`);
          await renewSubscription(subscription, 'T2');
          continue;
        }

        const hasT1Role = member.roles.cache.has(CHATBOT_PREMIUM_T1_ROLE_ID);
        if (hasT1Role) {
          logger.info(`Manager has T1 role...`);
          await renewSubscription(subscription, 'T1');
          continue;
        }

        logger.error(`Manager was missing both premium roles...`);
        await deactivateSubscription(subscription);
      }
    }
  } catch (error) {
    logger.error('Error renewing subscriptions', error);
  }
};

const deactivateSubscription = async (subscription: GuildSubscriptions) => {
  logger.info(`Deactivating subscription: ${subscription.id}`);

  await subscription.update({
    isActive: false,
  });
};

const renewSubscription = async (subscription: GuildSubscriptions, tier: string) => {
  logger.info(`Renewing subscription: ${subscription.id}`);

  await sequelize.query(
    `UPDATE app.guild_subscriptions SET "updatedAt" = NOW(), "isActive" = True, "dailyLimit" = :dailyLimit WHERE "id" = :id`,
    {
      replacements: { id: subscription.id, dailyLimit: tier === 'T1' ? 1000 : 3000 },
    }
  );
};
