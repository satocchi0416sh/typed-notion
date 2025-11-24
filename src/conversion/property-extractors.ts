/**
 * Property Extractor Framework for typed-notion-core-ts
 *
 * Handles automatic data conversion from Notion API property values
 * to typed TypeScript values with validation and error handling.
 */

import type { Result } from '../errors/index.js';
import { createOk, createErr, ConversionError } from '../errors/index.js';

/**
 * Notion API raw property value base structure
 */
export interface NotionPropertyValue {
  id: string;
  type: string;
  [key: string]: unknown;
}

/**
 * Rich text object structure from Notion API
 */
export interface RichTextObject {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string } | null;
  };
  mention?: {
    type: string;
    [key: string]: unknown;
  };
  equation?: {
    expression: string;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href?: string | null;
}

/**
 * Notion user object structure
 */
export interface NotionUser {
  object: 'user';
  id: string;
  type: 'person' | 'bot';
  name?: string | null;
  avatar_url?: string | null;
  person?: {
    email?: string;
  };
  bot?: {
    owner: {
      type: 'workspace' | 'user';
      workspace?: boolean;
      user?: NotionUser;
    };
    workspace_name?: string | null;
  };
}

/**
 * Base property extractor interface
 */
export interface PropertyExtractor<T = unknown> {
  /**
   * Extract typed value from Notion property response
   * @param property - Raw Notion property value
   * @returns Result with extracted typed value or error
   */
  extract(property: NotionPropertyValue): Result<T>;

  /**
   * Validate property structure matches expected type
   * @param property - Property to validate
   * @returns True if structure is valid
   */
  validate(property: NotionPropertyValue): boolean;

  /**
   * Get default value for this property type when missing
   * @returns Default value appropriate for property type
   */
  getDefaultValue(): T;
}

/**
 * Title property extractor
 */
export class TitleExtractor implements PropertyExtractor<string | null> {
  extract(property: NotionPropertyValue): Result<string | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid title property structure`,
          'VALIDATION_ERROR',
          property,
          'title',
          'title property with rich text array',
          typeof property
        )
      );
    }

    try {
      const titleProperty = property as unknown as { title: RichTextObject[] };
      const richTextArray = titleProperty.title;

      if (!richTextArray || richTextArray.length === 0) {
        return createOk(null);
      }

      // Extract plain text from rich text objects
      const text = richTextArray.map(item => item.plain_text || '').join('');

      return createOk(text || null);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract title: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'title',
          'string',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'title' && 'title' in property && Array.isArray(property.title);
  }

  getDefaultValue(): string | null {
    return null;
  }
}

/**
 * Rich text property extractor
 */
export class RichTextExtractor implements PropertyExtractor<string | null> {
  extract(property: NotionPropertyValue): Result<string | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid rich_text property structure`,
          'VALIDATION_ERROR',
          property,
          'rich_text',
          'rich_text property with array',
          typeof property
        )
      );
    }

    try {
      const richTextProperty = property as unknown as { rich_text: RichTextObject[] };
      const richTextArray = richTextProperty.rich_text;

      if (!richTextArray || richTextArray.length === 0) {
        return createOk(null);
      }

      // Extract plain text from rich text objects
      const text = richTextArray.map(item => item.plain_text || '').join('');

      return createOk(text || null);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract rich text: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'rich_text',
          'string',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return (
      property.type === 'rich_text' && 'rich_text' in property && Array.isArray(property.rich_text)
    );
  }

  getDefaultValue(): string | null {
    return null;
  }
}

/**
 * Number property extractor
 */
export class NumberExtractor implements PropertyExtractor<number | null> {
  extract(property: NotionPropertyValue): Result<number | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid number property structure`,
          'VALIDATION_ERROR',
          property,
          'number',
          'number property with numeric value',
          typeof property
        )
      );
    }

    try {
      const numberProperty = property as unknown as { number: number | null };
      const value = numberProperty.number;

      if (value === null || value === undefined) {
        return createOk(null);
      }

      if (typeof value !== 'number' || isNaN(value)) {
        return createErr(
          new ConversionError(
            `Invalid number value: ${value}`,
            'CONVERSION_ERROR',
            property,
            'number',
            'number',
            typeof value
          )
        );
      }

      return createOk(value);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract number: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'number',
          'number',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'number' && 'number' in property;
  }

  getDefaultValue(): number | null {
    return null;
  }
}

/**
 * Checkbox property extractor
 */
export class CheckboxExtractor implements PropertyExtractor<boolean | null> {
  extract(property: NotionPropertyValue): Result<boolean | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid checkbox property structure`,
          'VALIDATION_ERROR',
          property,
          'checkbox',
          'checkbox property with boolean value',
          typeof property
        )
      );
    }

    try {
      const checkboxProperty = property as unknown as { checkbox: boolean };
      const value = checkboxProperty.checkbox;

      if (typeof value !== 'boolean') {
        return createErr(
          new ConversionError(
            `Invalid checkbox value: ${value}`,
            'CONVERSION_ERROR',
            property,
            'checkbox',
            'boolean',
            typeof value
          )
        );
      }

      return createOk(value);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract checkbox: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'checkbox',
          'boolean',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'checkbox' && 'checkbox' in property;
  }

  getDefaultValue(): boolean | null {
    return null;
  }
}

/**
 * Date property extractor with timezone handling
 */
export class DateExtractor implements PropertyExtractor<Date | null> {
  constructor(_defaultTimezone?: string) {
    // Store timezone for future use if needed
    void _defaultTimezone;
  }

  extract(property: NotionPropertyValue): Result<Date | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid date property structure`,
          'VALIDATION_ERROR',
          property,
          'date',
          'date property with start field',
          typeof property
        )
      );
    }

    try {
      const dateProperty = property as unknown as {
        date: {
          start: string;
          end?: string | null;
          time_zone?: string | null;
        } | null;
      };

      const dateValue = dateProperty.date;
      if (!dateValue || !dateValue.start) {
        return createOk(null);
      }

      const parsedDate = this.parseDate(dateValue.start, dateValue.time_zone);
      if (!parsedDate) {
        return createErr(
          new ConversionError(
            `Invalid date format: ${dateValue.start}`,
            'CONVERSION_ERROR',
            property,
            'date',
            'valid ISO date string',
            dateValue.start
          )
        );
      }

      return createOk(parsedDate);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract date: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'date',
          'Date',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'date' && 'date' in property;
  }

  getDefaultValue(): Date | null {
    return null;
  }

  /**
   * Parse date with timezone handling
   * @param dateString - ISO date string
   * @param timezone - Target timezone (optional)
   * @returns Parsed Date object or null if invalid
   */
  parseDate(dateString: string, _timezone?: string | null): Date | null {
    try {
      // Basic validation of ISO date format
      if (!dateString || typeof dateString !== 'string') {
        return null;
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }

      // For now, we'll use the basic Date parsing
      // In a full implementation, you might want to use a library like date-fns or dayjs
      // to handle timezone conversions properly
      return date;
    } catch {
      return null;
    }
  }
}

/**
 * Select property extractor
 */
export class SelectExtractor implements PropertyExtractor<string | null> {
  extract(property: NotionPropertyValue): Result<string | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid select property structure`,
          'VALIDATION_ERROR',
          property,
          'select',
          'select property with option object',
          typeof property
        )
      );
    }

    try {
      const selectProperty = property as unknown as {
        select: { id: string; name: string; color: string } | null;
      };

      const selectValue = selectProperty.select;
      if (!selectValue) {
        return createOk(null);
      }

      return createOk(selectValue.name);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract select: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'select',
          'string',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'select' && 'select' in property;
  }

  getDefaultValue(): string | null {
    return null;
  }
}

/**
 * Multi-select property extractor
 */
export class MultiSelectExtractor implements PropertyExtractor<string[] | null> {
  extract(property: NotionPropertyValue): Result<string[] | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid multi_select property structure`,
          'VALIDATION_ERROR',
          property,
          'multi_select',
          'multi_select property with array of options',
          typeof property
        )
      );
    }

    try {
      const multiSelectProperty = property as unknown as {
        multi_select: Array<{ id: string; name: string; color: string }>;
      };

      const multiSelectArray = multiSelectProperty.multi_select;
      if (!multiSelectArray || multiSelectArray.length === 0) {
        return createOk(null);
      }

      const names = multiSelectArray.map(option => option.name);
      return createOk(names);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract multi_select: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'multi_select',
          'string[]',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return (
      property.type === 'multi_select' &&
      'multi_select' in property &&
      Array.isArray(property.multi_select)
    );
  }

  getDefaultValue(): string[] | null {
    return null;
  }
}

/**
 * People property extractor
 */
export class PeopleExtractor implements PropertyExtractor<NotionUser[] | null> {
  extract(property: NotionPropertyValue): Result<NotionUser[] | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid people property structure`,
          'VALIDATION_ERROR',
          property,
          'people',
          'people property with user array',
          typeof property
        )
      );
    }

    try {
      const peopleProperty = property as unknown as { people: NotionUser[] };
      const peopleArray = peopleProperty.people;

      if (!peopleArray || peopleArray.length === 0) {
        return createOk(null);
      }

      return createOk(peopleArray);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract people: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'people',
          'NotionUser[]',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'people' && 'people' in property && Array.isArray(property.people);
  }

  getDefaultValue(): NotionUser[] | null {
    return null;
  }
}

/**
 * Created time property extractor
 */
export class CreatedTimeExtractor implements PropertyExtractor<Date | null> {
  extract(property: NotionPropertyValue): Result<Date | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid created_time property structure`,
          'VALIDATION_ERROR',
          property,
          'created_time',
          'created_time property with ISO string',
          typeof property
        )
      );
    }

    try {
      const createdTimeProperty = property as unknown as { created_time: string };
      const dateString = createdTimeProperty.created_time;

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return createErr(
          new ConversionError(
            `Invalid created_time format: ${dateString}`,
            'CONVERSION_ERROR',
            property,
            'created_time',
            'valid ISO date string',
            dateString
          )
        );
      }

      return createOk(date);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract created_time: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'created_time',
          'Date',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'created_time' && 'created_time' in property;
  }

  getDefaultValue(): Date | null {
    return null;
  }
}

/**
 * Last edited time property extractor
 */
export class LastEditedTimeExtractor implements PropertyExtractor<Date | null> {
  extract(property: NotionPropertyValue): Result<Date | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid last_edited_time property structure`,
          'VALIDATION_ERROR',
          property,
          'last_edited_time',
          'last_edited_time property with ISO string',
          typeof property
        )
      );
    }

    try {
      const lastEditedTimeProperty = property as unknown as { last_edited_time: string };
      const dateString = lastEditedTimeProperty.last_edited_time;

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return createErr(
          new ConversionError(
            `Invalid last_edited_time format: ${dateString}`,
            'CONVERSION_ERROR',
            property,
            'last_edited_time',
            'valid ISO date string',
            dateString
          )
        );
      }

      return createOk(date);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract last_edited_time: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'last_edited_time',
          'Date',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'last_edited_time' && 'last_edited_time' in property;
  }

  getDefaultValue(): Date | null {
    return null;
  }
}

/**
 * URL property extractor
 */
export class UrlExtractor implements PropertyExtractor<string | null> {
  extract(property: NotionPropertyValue): Result<string | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid url property structure`,
          'VALIDATION_ERROR',
          property,
          'url',
          'url property with string value',
          typeof property
        )
      );
    }

    try {
      const urlProperty = property as unknown as { url: string | null };
      const value = urlProperty.url;

      return createOk(value);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract url: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'url',
          'string',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'url' && 'url' in property;
  }

  getDefaultValue(): string | null {
    return null;
  }
}

/**
 * Email property extractor
 */
export class EmailExtractor implements PropertyExtractor<string | null> {
  extract(property: NotionPropertyValue): Result<string | null> {
    if (!this.validate(property)) {
      return createErr(
        new ConversionError(
          `Invalid email property structure`,
          'VALIDATION_ERROR',
          property,
          'email',
          'email property with string value',
          typeof property
        )
      );
    }

    try {
      const emailProperty = property as unknown as { email: string | null };
      const value = emailProperty.email;

      return createOk(value);
    } catch (error) {
      return createErr(
        new ConversionError(
          `Failed to extract email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          property,
          'email',
          'string',
          typeof property,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  validate(property: NotionPropertyValue): boolean {
    return property.type === 'email' && 'email' in property;
  }

  getDefaultValue(): string | null {
    return null;
  }
}
