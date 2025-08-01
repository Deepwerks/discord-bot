import dayjs from 'dayjs';
import { logger } from '../../..';
import { GuildSubscriptions, sequelize } from '../../database/orm/init';
import CustomClient from '../../../base/classes/CustomClient';

const SUPPORT_SERVER_ID = '1363157938558210079';
const CHATBOT_PREMIUM_T1_ROLE_ID = '1396131129068752948';
const CHATBOT_PREMIUM_T2_ROLE_ID = '1396131850950410250';
const CHATBOT_PREMIUM_T3_ROLE_ID = '1398352188685942855';
const CHATBOT_PREMIUM_PLUS_ID = '1396229921382076496';

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

        const hasPlusRole = member.roles.cache.has(CHATBOT_PREMIUM_PLUS_ID);
        if (hasPlusRole) {
          logger.info(`Manager has partner role...`);
          await renewSubscription(subscription, '+');
          continue;
        }

        const hasT3Role = member.roles.cache.has(CHATBOT_PREMIUM_T3_ROLE_ID);
        if (hasT3Role) {
          logger.info(`Manager has T3 role...`);
          await renewSubscription(subscription, 'T3');
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

  const baseQuery = `UPDATE app.guild_subscriptions SET "updatedAt" = NOW(), "isActive" = TRUE`;
  const setLimit = tier === '+' ? '' : `, "dailyLimit" = :dailyLimit`;
  const fullQuery = `${baseQuery}${setLimit} WHERE "id" = :id`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const replacements: any = { id: subscription.id };
  if (tier !== '+') {
    replacements.dailyLimit = tier === 'T1' ? 300 : tier === 'T2' ? 750 : 2000;
  }

  await sequelize.query(fullQuery, { replacements });
};
