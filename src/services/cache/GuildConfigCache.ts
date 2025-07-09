import CustomCache from '.';
import { Guilds } from '../database/orm/init';

const guildConfigCache = new CustomCache<Guilds>('guildConfigCache', 86400);

export { guildConfigCache };
