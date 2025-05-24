import { logger } from '../..';

export function isMatchId(matchId: string): boolean {
  try {
    const isNumeric = /^\d+$/.test(matchId);
    const isValidLength = matchId.length < 10;

    return isNumeric && isValidLength;
  } catch (error) {
    logger.warn(error);
    return false;
  }
}
