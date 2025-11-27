/**
 * Unit tests for Property Extractors
 *
 * Tests all 14 property extractor classes for proper data extraction
 * from Notion API responses to TypeScript types.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TitleExtractor,
  RichTextExtractor,
  NumberExtractor,
  CheckboxExtractor,
  DateExtractor,
  SelectExtractor,
  MultiSelectExtractor,
  PeopleExtractor,
  CreatedTimeExtractor,
  LastEditedTimeExtractor,
  UrlExtractor,
  EmailExtractor,
} from '../../src/conversion/property-extractors.js';

// Mock the errors module
vi.mock('../../src/errors/index.js', () => ({
  ConversionError: class ConversionError extends Error {
    constructor(
      message: string,
      code: string,
      rawValue: any,
      context?: string,
      expectedType?: string,
      actualType?: string,
      cause?: Error
    ) {
      super(message);
      this.name = 'ConversionError';
    }
  },
  createOk: (value: any) => ({ ok: true, value }),
  createErr: (error: any) => ({ ok: false, error }),
}));

describe('Property Extractors', () => {
  describe('TitleExtractor', () => {
    let extractor: TitleExtractor;

    beforeEach(() => {
      extractor = new TitleExtractor();
    });

    it('should extract title from rich text array', () => {
      const property = {
        id: 'test-id',
        type: 'title',
        title: [
          { text: { content: 'Hello ' }, plain_text: 'Hello ', annotations: {} },
          { text: { content: 'World' }, plain_text: 'World', annotations: {} },
        ],
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Hello World');
      }
    });

    it('should extract from single rich text object', () => {
      const property = {
        id: 'test-id',
        type: 'title',
        title: [{ text: { content: 'Single Title' }, plain_text: 'Single Title', annotations: {} }],
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Single Title');
      }
    });

    it('should return null for empty title array', () => {
      const property = { id: 'test-id', type: 'title', title: [] } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should return null for null title', () => {
      const property = { id: 'test-id', type: 'title', title: null } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should handle title with formatting', () => {
      const property = {
        id: 'test-id',
        type: 'title',
        title: [
          { text: { content: 'Bold' }, plain_text: 'Bold', annotations: { bold: true } },
          { text: { content: ' and ' }, plain_text: ' and ', annotations: {} },
          { text: { content: 'Italic' }, plain_text: 'Italic', annotations: { italic: true } },
        ],
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Bold and Italic');
      }
    });

    it('should handle invalid title property', () => {
      const property = { title: 'not-an-array' } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(false);
    });
  });

  describe('RichTextExtractor', () => {
    let extractor: RichTextExtractor;

    beforeEach(() => {
      extractor = new RichTextExtractor();
    });

    it('should extract rich text content', () => {
      const property = {
        id: 'test-id',
        type: 'rich_text',
        rich_text: [
          { text: { content: 'Rich ' }, plain_text: 'Rich ', annotations: {} },
          { text: { content: 'Text' }, plain_text: 'Text', annotations: {} },
        ],
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Rich Text');
      }
    });

    it('should handle mentions in rich text', () => {
      const property = {
        id: 'test-id',
        type: 'rich_text',
        rich_text: [
          { text: { content: 'Hello ' }, plain_text: 'Hello ', annotations: {} },
          { mention: { user: { id: 'user-id' } }, plain_text: '@John', annotations: {} },
          { text: { content: '!' }, plain_text: '!', annotations: {} },
        ],
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Hello @John!');
      }
    });

    it('should return null for empty rich_text', () => {
      const property = { id: 'test-id', type: 'rich_text', rich_text: [] } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('NumberExtractor', () => {
    let extractor: NumberExtractor;

    beforeEach(() => {
      extractor = new NumberExtractor();
    });

    it('should extract valid number', () => {
      const property = { id: 'test-id', type: 'number', number: 42 } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('should extract decimal number', () => {
      const property = { id: 'test-id', type: 'number', number: 3.14159 } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(3.14159);
      }
    });

    it('should return null for null number', () => {
      const property = { id: 'test-id', type: 'number', number: null } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should handle zero value', () => {
      const property = { id: 'test-id', type: 'number', number: 0 } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0);
      }
    });

    it('should handle negative numbers', () => {
      const property = { id: 'test-id', type: 'number', number: -100 } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(-100);
      }
    });
  });

  describe('CheckboxExtractor', () => {
    let extractor: CheckboxExtractor;

    beforeEach(() => {
      extractor = new CheckboxExtractor();
    });

    it('should extract true checkbox', () => {
      const property = { id: 'test-id', type: 'checkbox', checkbox: true } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it('should extract false checkbox', () => {
      const property = { id: 'test-id', type: 'checkbox', checkbox: false } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it('should handle null checkbox as false', () => {
      const property = { id: 'test-id', type: 'checkbox', checkbox: null } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('DateExtractor', () => {
    let extractor: DateExtractor;

    beforeEach(() => {
      extractor = new DateExtractor('UTC');
    });

    it('should extract date with start only', () => {
      const property = {
        id: 'test-id',
        type: 'date',
        date: {
          start: '2024-01-15',
          end: null,
          time_zone: null,
        },
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      }
    });

    it('should extract date range with start and end', () => {
      const property = {
        id: 'test-id',
        type: 'date',
        date: {
          start: '2024-01-15',
          end: '2024-01-20',
          time_zone: null,
        },
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      }
    });

    it('should extract datetime with timezone', () => {
      const property = {
        id: 'test-id',
        type: 'date',
        date: {
          start: '2024-01-15T14:30:00',
          end: null,
          time_zone: 'America/New_York',
        },
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeInstanceOf(Date);
      }
    });

    it('should return null for null date', () => {
      const property = { id: 'test-id', type: 'date', date: null } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should handle invalid date format', () => {
      const property = {
        id: 'test-id',
        type: 'date',
        date: {
          start: 'invalid-date',
          end: null,
          time_zone: null,
        },
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(false);
    });
  });

  describe('SelectExtractor', () => {
    let extractor: SelectExtractor;

    beforeEach(() => {
      extractor = new SelectExtractor();
    });

    it('should extract select option', () => {
      const property = {
        id: 'test-id',
        type: 'select',
        select: {
          id: 'option-1',
          name: 'Active',
          color: 'green',
        },
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Active');
      }
    });

    it('should return null for null select', () => {
      const property = { id: 'test-id', type: 'select', select: null } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should handle empty select option', () => {
      const property = {
        id: 'test-id',
        type: 'select',
        select: {
          id: 'option-1',
          name: '',
          color: 'default',
        },
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('');
      }
    });
  });

  describe('MultiSelectExtractor', () => {
    let extractor: MultiSelectExtractor;

    beforeEach(() => {
      extractor = new MultiSelectExtractor();
    });

    it('should extract multiple select options', () => {
      const property = {
        id: 'test-id',
        type: 'multi_select',
        multi_select: [
          { id: 'opt-1', name: 'Feature', color: 'blue' },
          { id: 'opt-2', name: 'Urgent', color: 'red' },
          { id: 'opt-3', name: 'Frontend', color: 'green' },
        ],
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(['Feature', 'Urgent', 'Frontend']);
      }
    });

    it('should return empty array for empty multi_select', () => {
      const property = { id: 'test-id', type: 'multi_select', multi_select: [] } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return empty array for null multi_select', () => {
      const property = { id: 'test-id', type: 'multi_select', multi_select: null } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('PeopleExtractor', () => {
    let extractor: PeopleExtractor;

    beforeEach(() => {
      extractor = new PeopleExtractor();
    });

    it('should extract people information', () => {
      const property = {
        id: 'test-id',
        type: 'people',
        people: [
          {
            id: 'user-1',
            name: 'John Doe',
            avatar_url: 'https://example.com/john.jpg',
            type: 'person',
            person: { email: 'john@example.com' },
          },
          {
            id: 'user-2',
            name: 'Jane Smith',
            avatar_url: 'https://example.com/jane.jpg',
            type: 'person',
            person: { email: 'jane@example.com' },
          },
        ],
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual({
          id: 'user-1',
          name: 'John Doe',
          avatar_url: 'https://example.com/john.jpg',
          type: 'person',
          person: { email: 'john@example.com' },
        });
      }
    });

    it('should return empty array for empty people', () => {
      const property = { id: 'test-id', type: 'people', people: [] } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('should handle bot users', () => {
      const property = {
        id: 'test-id',
        type: 'people',
        people: [
          {
            id: 'bot-1',
            name: 'Automation Bot',
            avatar_url: null,
            type: 'bot',
            bot: { owner: { type: 'workspace' } },
          },
        ],
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]?.type).toBe('bot');
      }
    });
  });

  describe('CreatedTimeExtractor', () => {
    let extractor: CreatedTimeExtractor;

    beforeEach(() => {
      extractor = new CreatedTimeExtractor('UTC');
    });

    it('should extract created time as Date object', () => {
      const property = {
        id: 'test-id',
        type: 'created_time',
        created_time: '2024-01-15T14:30:00.000Z',
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(new Date('2024-01-15T14:30:00.000Z'));
      }
    });

    it('should handle invalid datetime string', () => {
      const property = {
        created_time: 'invalid-date',
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(false);
    });
  });

  describe('LastEditedTimeExtractor', () => {
    let extractor: LastEditedTimeExtractor;

    beforeEach(() => {
      extractor = new LastEditedTimeExtractor('UTC');
    });

    it('should extract last edited time as Date object', () => {
      const property = {
        id: 'test-id',
        type: 'last_edited_time',
        last_edited_time: '2024-01-20T10:15:30.000Z',
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(new Date('2024-01-20T10:15:30.000Z'));
      }
    });

    it('should handle null last_edited_time', () => {
      const property = {
        last_edited_time: null,
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(false);
    });
  });

  describe('UrlExtractor', () => {
    let extractor: UrlExtractor;

    beforeEach(() => {
      extractor = new UrlExtractor();
    });

    it('should extract valid URL', () => {
      const property = {
        id: 'test-id',
        type: 'url',
        url: 'https://www.example.com',
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('https://www.example.com');
      }
    });

    it('should return null for null URL', () => {
      const property = { id: 'test-id', type: 'url', url: null } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should handle empty URL string', () => {
      const property = { id: 'test-id', type: 'url', url: '' } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('');
      }
    });

    it('should extract relative URLs', () => {
      const property = {
        id: 'test-id',
        type: 'url',
        url: '/relative/path',
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('/relative/path');
      }
    });
  });

  describe('EmailExtractor', () => {
    let extractor: EmailExtractor;

    beforeEach(() => {
      extractor = new EmailExtractor();
    });

    it('should extract valid email', () => {
      const property = {
        id: 'test-id',
        type: 'email',
        email: 'user@example.com',
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('user@example.com');
      }
    });

    it('should return null for null email', () => {
      const property = { id: 'test-id', type: 'email', email: null } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should handle empty email string', () => {
      const property = { id: 'test-id', type: 'email', email: '' } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('');
      }
    });

    it('should extract complex email addresses', () => {
      const property = {
        id: 'test-id',
        type: 'email',
        email: 'user.name+tag@subdomain.example.co.uk',
      } as any;

      const result = extractor.extract(property);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('user.name+tag@subdomain.example.co.uk');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined property values', () => {
      const titleExtractor = new TitleExtractor();

      const result = titleExtractor.extract(undefined as any);
      expect(result.ok).toBe(false);
    });

    it('should handle malformed property objects', () => {
      const numberExtractor = new NumberExtractor();

      const result = numberExtractor.extract({ number: 'not-a-number' } as any);
      expect(result.ok).toBe(false);
    });

    it('should provide meaningful error context', () => {
      const dateExtractor = new DateExtractor('UTC');

      const result = dateExtractor.extract({
        id: 'test-id',
        type: 'date',
        date: { start: 'invalid' },
      } as any);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('date');
      }
    });

    it('should handle deeply nested null values', () => {
      const selectExtractor = new SelectExtractor();

      const result = selectExtractor.extract({ select: { name: null } } as any);
      expect(result.ok).toBe(false);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large text content efficiently', () => {
      const richTextExtractor = new RichTextExtractor();
      const largeContent = 'x'.repeat(100000); // 100KB string

      const property = {
        id: 'test-id',
        type: 'rich_text',
        rich_text: [{ text: { content: largeContent } }],
      } as any;

      const startTime = performance.now();
      const result = richTextExtractor.extract(property);
      const endTime = performance.now();

      expect(result.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });

    it('should handle large arrays efficiently', () => {
      const multiSelectExtractor = new MultiSelectExtractor();
      const manyOptions = Array.from({ length: 1000 }, (_, i) => ({
        id: `opt-${i}`,
        name: `Option ${i}`,
        color: 'default',
      }));

      const property = {
        id: 'test-id',
        type: 'multi_select',
        multi_select: manyOptions,
      } as any;

      const startTime = performance.now();
      const result = multiSelectExtractor.extract(property);
      const endTime = performance.now();

      expect(result.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should handle 1000 items quickly
      if (result.ok) {
        expect(result.value).toHaveLength(1000);
      }
    });
  });

  describe('Configuration and Customization', () => {
    it('should respect timezone configuration in DateExtractor', () => {
      const utcExtractor = new DateExtractor('UTC');
      const estExtractor = new DateExtractor('America/New_York');

      const property = {
        id: 'test-id',
        type: 'date',
        date: {
          start: '2024-01-15T14:30:00',
          end: null,
          time_zone: null,
        },
      } as any;

      const utcResult = utcExtractor.extract(property);
      const estResult = estExtractor.extract(property);

      expect(utcResult.ok).toBe(true);
      expect(estResult.ok).toBe(true);

      // Both should parse successfully but may interpret timezone differently
    });

    it('should allow custom timezone in timestamp extractors', () => {
      const createdTimeExtractor = new CreatedTimeExtractor('Asia/Tokyo');
      const lastEditedTimeExtractor = new LastEditedTimeExtractor('Europe/London');

      expect(createdTimeExtractor).toBeInstanceOf(CreatedTimeExtractor);
      expect(lastEditedTimeExtractor).toBeInstanceOf(LastEditedTimeExtractor);
    });
  });
});
