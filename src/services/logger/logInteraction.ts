import { logger } from '../..';
import { InteractionType } from '../database/orm/models/FailedUserInteractions.model';
import { commandExecutions } from '../metrics';

export interface IUserInteractions {
  id: string;
  type: InteractionType;
  name: string;
  userId: string;
  guildId: string | null;
  options: object | null;
}

function logInteraction(options: IUserInteractions) {
  logger.info(`[INTERACTION] ${options.userId} used ${options.name}`);

  commandExecutions.inc({
    command: options.name,
  });
}

export default logInteraction;
