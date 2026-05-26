export function parseWeekRange(range: string): number[] {
  if (!range || range.trim() === '') {
    return [];
  }
  const trimmed = range.trim();
  if (trimmed === '单周') return [1, 3, 5, 7, 9, 11, 13, 15];
  if (trimmed === '双周') return [2, 4, 6, 8, 10, 12, 14, 16];

  const weeks: number[] = [];
  const parts = trimmed.split(',');
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (trimmedPart.includes('-')) {
      const [startStr, endStr] = trimmedPart.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) weeks.push(i);
      }
    } else {
      const week = parseInt(trimmedPart, 10);
      if (!isNaN(week)) weeks.push(week);
    }
  }
  return [...new Set(weeks)].sort((a, b) => a - b);
}

export function isInWeekRange(range: string, weekNumber: number): boolean {
  return parseWeekRange(range).includes(weekNumber);
}

export function formatWeekRange(weeks: number[]): string {
  if (weeks.length === 0) return '';
  const sorted = [...weeks].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? start.toString() : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? start.toString() : `${start}-${end}`);
  return ranges.join(',');
}

export function getCurrentWeek(startDate?: Date): number {
  const start = startDate || new Date('2026-02-24');
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 7));
}

export function getCurrentDay(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}
