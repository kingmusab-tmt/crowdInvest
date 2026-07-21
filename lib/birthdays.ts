// Milestones (days before a birthday) that trigger an aggregated reminder
// notification to the whole community. Order matters for display purposes
// (largest window first).
export const BIRTHDAY_REMINDER_THRESHOLDS = [30, 15, 7, 2, 1] as const;

function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Next occurrence of a birth date's month/day from `from` (today by default).
// Feb 29 birthdays in a non-leap year naturally roll to Mar 1 via JS Date
// overflow — an acceptable approximation, no special-casing needed.
export function nextBirthdayDate(dob: Date | string, from: Date = new Date()): Date {
  const birth = new Date(dob);
  const today = atMidnight(from);
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next.getTime() < today.getTime()) {
    next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  return next;
}

export function daysUntilNextBirthday(
  dob: Date | string,
  from: Date = new Date()
): number {
  const today = atMidnight(from);
  const next = nextBirthdayDate(dob, today);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((next.getTime() - today.getTime()) / msPerDay);
}
