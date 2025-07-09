import { Sequelize } from 'sequelize';
import { logger } from '../../..';

import config from '../../../config';
import { Guilds } from './models/Guilds.model';
import { FailedUserInteractions } from './models/FailedUserInteractions.model';
import { StoredPlayers } from './models/StoredPlayers.model';
import { BotActivities } from './models/BotActivities.model';

const sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  port: config.db_port,
  host: config.db_host,
  dialect: 'postgres',
  logging: (msg) => logger.info(msg),
  sync: {
    force: false,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  timezone: 'Europe/Budapest',
});

const models = [Guilds, FailedUserInteractions, StoredPlayers, BotActivities];
models.forEach((model) => model.initialize(sequelize));

export { sequelize, Guilds, FailedUserInteractions, StoredPlayers, BotActivities };
