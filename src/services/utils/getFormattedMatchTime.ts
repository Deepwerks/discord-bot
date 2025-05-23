export const getFormattedMatchTime = (s: number) => {
  const hours = Math.floor(s / 60);
  const minutes = s % 60;

  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}`;
};
