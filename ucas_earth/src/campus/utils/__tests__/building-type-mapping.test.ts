// src/utils/__tests__/building-type-mapping.test.ts
import { describe, it, expect } from 'vitest';
import { getBuildingType } from '../../data/building-type-mapping';

describe('getBuildingType', () => {
  describe('name 关键词映射', () => {
    it('应识别教学楼', () => {
      expect(getBuildingType({ name: '教学楼A' })).toBe('teaching');
    });

    it('应识别图书馆', () => {
      expect(getBuildingType({ name: '阜阳师范大学逸夫图书馆' })).toBe('teaching');
    });

    it('应识别实验楼', () => {
      expect(getBuildingType({ name: '实验楼' })).toBe('teaching');
    });

    it('应识别宿舍', () => {
      expect(getBuildingType({ name: '学生宿舍1号楼' })).toBe('residential');
    });

    it('应识别食堂', () => {
      expect(getBuildingType({ name: '学生食堂' })).toBe('service');
    });

    it('应识别行政楼', () => {
      expect(getBuildingType({ name: '行政楼' })).toBe('office');
    });

    it('应识别体育馆', () => {
      expect(getBuildingType({ name: '体育馆' })).toBe('sports');
    });

    it('应识别操场', () => {
      expect(getBuildingType({ name: '操场' })).toBe('sports');
    });
  });

  describe('Function 字段映射', () => {
    it('应识别 Office', () => {
      expect(getBuildingType({ Function: 'Office' })).toBe('office');
    });

    it('应识别 Residence', () => {
      expect(getBuildingType({ Function: 'Residence' })).toBe('residential');
    });

    it('应识别 Public service', () => {
      expect(getBuildingType({ Function: 'Public service' })).toBe('service');
    });

    it('应识别 Education', () => {
      expect(getBuildingType({ Function: 'Education' })).toBe('teaching');
    });
  });

  describe('building 字段映射', () => {
    it('应识别 university', () => {
      expect(getBuildingType({ building: 'university' })).toBe('teaching');
    });

    it('应识别 apartments', () => {
      expect(getBuildingType({ building: 'apartments' })).toBe('residential');
    });

    it('应识别 commercial', () => {
      expect(getBuildingType({ building: 'commercial' })).toBe('service');
    });
  });

  describe('默认值', () => {
    it('空属性应返回 other', () => {
      expect(getBuildingType({})).toBe('other');
    });

    it('未知属性应返回 other', () => {
      expect(getBuildingType({ foo: 'bar' })).toBe('other');
    });

    it('building=yes 应返回 other', () => {
      expect(getBuildingType({ building: 'yes' })).toBe('other');
    });
  });

  describe('优先级', () => {
    it('name 优先于 Function', () => {
      expect(getBuildingType({ name: '教学楼A', Function: 'Office' })).toBe('teaching');
    });

    it('name 优先于 building', () => {
      expect(getBuildingType({ name: '食堂', building: 'university' })).toBe('service');
    });

    it('Function 优先于 building', () => {
      expect(getBuildingType({ Function: 'Office', building: 'university' })).toBe('office');
    });
  });
});
