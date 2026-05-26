import { describe, it, expect } from 'vitest';
import { parseWeekRange, isInWeekRange, formatWeekRange } from '../weekRange';

describe('weekRange', () => {
  describe('parseWeekRange', () => {
    it('should parse range format "1-16"', () => {
      const result = parseWeekRange('1-16');
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    });

    it('should parse list format "1,3,5,7"', () => {
      const result = parseWeekRange('1,3,5,7');
      expect(result).toEqual([1, 3, 5, 7]);
    });

    it('should parse mixed format "1-8,10-16"', () => {
      const result = parseWeekRange('1-8,10-16');
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16]);
    });

    it('should parse "单周" format', () => {
      const result = parseWeekRange('单周');
      expect(result).toEqual([1, 3, 5, 7, 9, 11, 13, 15]);
    });

    it('should parse "双周" format', () => {
      const result = parseWeekRange('双周');
      expect(result).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
    });

    it('should handle empty string', () => {
      const result = parseWeekRange('');
      expect(result).toEqual([]);
    });
  });

  describe('isInWeekRange', () => {
    it('should return true for week in range', () => {
      expect(isInWeekRange('1-16', 5)).toBe(true);
    });

    it('should return false for week not in range', () => {
      expect(isInWeekRange('1-8', 10)).toBe(false);
    });

    it('should handle "单周" format', () => {
      expect(isInWeekRange('单周', 1)).toBe(true);
      expect(isInWeekRange('单周', 2)).toBe(false);
    });
  });

  describe('formatWeekRange', () => {
    it('should format consecutive weeks as range', () => {
      const result = formatWeekRange([1, 2, 3, 4, 5]);
      expect(result).toBe('1-5');
    });

    it('should format non-consecutive weeks as list', () => {
      const result = formatWeekRange([1, 3, 5, 7]);
      expect(result).toBe('1,3,5,7');
    });

    it('should format mixed weeks', () => {
      const result = formatWeekRange([1, 2, 3, 5, 7, 8, 9]);
      expect(result).toBe('1-3,5,7-9');
    });
  });
});
