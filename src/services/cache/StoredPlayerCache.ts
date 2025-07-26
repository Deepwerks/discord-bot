import CustomCache from '.';
import { StoredPlayers } from '../database/orm/init';

const storedPlayerCache = new CustomCache<StoredPlayers>('storedPlayerCache', 60 * 60);

export { storedPlayerCache };
