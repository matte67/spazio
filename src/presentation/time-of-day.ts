const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 18;

/** Local-clock indicator only; it does not infer weather or astronomical sunrise. */
export function timeOfDay(date: Date): 'day' | 'night' {
  const hour = date.getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? 'day' : 'night';
}
