export function isMatchId(matchId: any): boolean {
  try {
    const isNumeric = /^\d+$/.test(matchId);
    const isValidLength = matchId.length < 10;

    return isNumeric && isValidLength;
  } catch (error) {
    return false;
  }
}
