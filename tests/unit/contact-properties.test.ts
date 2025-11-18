/**
 * Unit tests for contact properties in User Story 3
 *
 * Tests individual contact property type behavior:
 * - Date properties with Date object validation
 * - Email properties with format validation
 * - URL properties with format validation
 * - People properties with NotionUser validation
 */

import { describe, it, expect } from 'vitest';
import {
  validatePropertyStructure,
  validatePropertyValue,
  validateSchemaStructure,
} from '../../src/schema/validator.js';
import { PropertyValidationError } from '../../src/errors/index.js';
import type { PropertyDefinition, NotionUser } from '../../src/types/core.js';

describe('Unit Tests: Contact Properties', () => {
  describe('Date Property', () => {
    it('should validate date property definition', () => {
      const definition: PropertyDefinition = { type: 'date' };
      const errors = validatePropertyStructure('DueDate', definition);
      expect(errors).toHaveLength(0);
    });

    it('should validate date property values', () => {
      const definition: PropertyDefinition = { type: 'date' };

      // Valid values
      expect(() => validatePropertyValue(new Date(), definition, 'DueDate')).not.toThrow();
      expect(() =>
        validatePropertyValue(new Date('2024-01-01'), definition, 'DueDate')
      ).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'DueDate')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'DueDate')).not.toThrow();
    });

    it('should reject invalid date property values', () => {
      const definition: PropertyDefinition = { type: 'date' };

      expect(() => validatePropertyValue('2024-01-01', definition, 'DueDate')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue(123456789, definition, 'DueDate')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue({}, definition, 'DueDate')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue([], definition, 'DueDate')).toThrow(
        PropertyValidationError
      );
    });

    it('should provide specific error details for date properties', () => {
      const definition: PropertyDefinition = { type: 'date' };

      try {
        validatePropertyValue('2024-01-01', definition, 'DueDate');
      } catch (error) {
        expect(error).toBeInstanceOf(PropertyValidationError);
        const propError = error as PropertyValidationError;
        expect(propError.context.property).toBe('DueDate');
        expect(propError.context.value).toBe('2024-01-01');
        expect(propError.context.expectedType).toBe('Date');
      }
    });
  });

  describe('Email Property', () => {
    it('should validate email property definition', () => {
      const definition: PropertyDefinition = { type: 'email' };
      const errors = validatePropertyStructure('ContactEmail', definition);
      expect(errors).toHaveLength(0);
    });

    it('should validate email property values', () => {
      const definition: PropertyDefinition = { type: 'email' };

      // Valid email formats
      expect(() =>
        validatePropertyValue('user@example.com', definition, 'ContactEmail')
      ).not.toThrow();
      expect(() =>
        validatePropertyValue('test.email+tag@domain.org', definition, 'ContactEmail')
      ).not.toThrow();
      expect(() =>
        validatePropertyValue('user@subdomain.example.com', definition, 'ContactEmail')
      ).not.toThrow();
      expect(() =>
        validatePropertyValue('firstname.lastname@company.co.uk', definition, 'ContactEmail')
      ).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'ContactEmail')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'ContactEmail')).not.toThrow();
    });

    it('should reject invalid email property values', () => {
      const definition: PropertyDefinition = { type: 'email' };

      // Invalid email formats
      expect(() => validatePropertyValue('invalid-email', definition, 'ContactEmail')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue('user@', definition, 'ContactEmail')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue('@domain.com', definition, 'ContactEmail')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue('user@domain', definition, 'ContactEmail')).toThrow(
        PropertyValidationError
      );
      expect(() =>
        validatePropertyValue('user space@domain.com', definition, 'ContactEmail')
      ).toThrow(PropertyValidationError);
      expect(() => validatePropertyValue(123, definition, 'ContactEmail')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue([], definition, 'ContactEmail')).toThrow(
        PropertyValidationError
      );
    });

    it('should provide specific error details for email properties', () => {
      const definition: PropertyDefinition = { type: 'email' };

      try {
        validatePropertyValue('invalid-email', definition, 'ContactEmail');
      } catch (error) {
        expect(error).toBeInstanceOf(PropertyValidationError);
        const propError = error as PropertyValidationError;
        expect(propError.context.property).toBe('ContactEmail');
        expect(propError.context.value).toBe('invalid-email');
        expect(propError.context.expectedType).toBe('valid email address');
      }
    });

    it('should handle edge cases for email validation', () => {
      const definition: PropertyDefinition = { type: 'email' };

      // Empty string should fail
      expect(() => validatePropertyValue('', definition, 'ContactEmail')).toThrow(
        PropertyValidationError
      );

      // Very long email should fail
      const longEmail = `${'a'.repeat(250)}@domain.com`;
      expect(() => validatePropertyValue(longEmail, definition, 'ContactEmail')).toThrow(
        PropertyValidationError
      );
    });
  });

  describe('URL Property', () => {
    it('should validate URL property definition', () => {
      const definition: PropertyDefinition = { type: 'url' };
      const errors = validatePropertyStructure('WebsiteURL', definition);
      expect(errors).toHaveLength(0);
    });

    it('should validate URL property values', () => {
      const definition: PropertyDefinition = { type: 'url' };

      // Valid URL formats
      expect(() =>
        validatePropertyValue('https://example.com', definition, 'WebsiteURL')
      ).not.toThrow();
      expect(() =>
        validatePropertyValue('http://example.com', definition, 'WebsiteURL')
      ).not.toThrow();
      expect(() =>
        validatePropertyValue('https://www.example.com/path?query=value', definition, 'WebsiteURL')
      ).not.toThrow();
      expect(() =>
        validatePropertyValue('http://subdomain.domain.com:8080/path', definition, 'WebsiteURL')
      ).not.toThrow();
      expect(() =>
        validatePropertyValue('https://api.example.com/v1/users/123', definition, 'WebsiteURL')
      ).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'WebsiteURL')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'WebsiteURL')).not.toThrow();
    });

    it('should reject invalid URL property values', () => {
      const definition: PropertyDefinition = { type: 'url' };

      // Invalid URL formats
      expect(() => validatePropertyValue('not-a-url', definition, 'WebsiteURL')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue('ftp://example.com', definition, 'WebsiteURL')).toThrow(
        PropertyValidationError
      );
      expect(() =>
        validatePropertyValue('mailto:user@example.com', definition, 'WebsiteURL')
      ).toThrow(PropertyValidationError);
      expect(() => validatePropertyValue('//example.com', definition, 'WebsiteURL')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue('http://', definition, 'WebsiteURL')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue(123, definition, 'WebsiteURL')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue([], definition, 'WebsiteURL')).toThrow(
        PropertyValidationError
      );
    });

    it('should provide specific error details for URL properties', () => {
      const definition: PropertyDefinition = { type: 'url' };

      try {
        validatePropertyValue('not-a-url', definition, 'WebsiteURL');
      } catch (error) {
        expect(error).toBeInstanceOf(PropertyValidationError);
        const propError = error as PropertyValidationError;
        expect(propError.context.property).toBe('WebsiteURL');
        expect(propError.context.value).toBe('not-a-url');
        expect(propError.context.expectedType).toBe('valid URL');
      }
    });

    it('should handle edge cases for URL validation', () => {
      const definition: PropertyDefinition = { type: 'url' };

      // Empty string should fail
      expect(() => validatePropertyValue('', definition, 'WebsiteURL')).toThrow(
        PropertyValidationError
      );

      // Only protocol should fail
      expect(() => validatePropertyValue('https://', definition, 'WebsiteURL')).toThrow(
        PropertyValidationError
      );
    });
  });

  describe('People Property', () => {
    it('should validate people property definition', () => {
      const definition: PropertyDefinition = { type: 'people' };
      const errors = validatePropertyStructure('Assignees', definition);
      expect(errors).toHaveLength(0);
    });

    it('should validate people property values', () => {
      const definition: PropertyDefinition = { type: 'people' };

      const validUser1: NotionUser = {
        id: 'user-123',
        name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        type: 'person',
        person: { email: 'john@example.com' },
        bot: null,
      };

      const validUser2: NotionUser = {
        id: 'bot-456',
        name: 'Bot Assistant',
        avatar_url: null,
        type: 'bot',
        person: null,
        bot: { workspace_name: 'My Workspace' },
      };

      const validUser3: NotionUser = {
        id: 'user-789',
        name: null,
        avatar_url: null,
        type: 'person',
        person: null,
        bot: null,
      };

      // Valid values
      expect(() => validatePropertyValue([], definition, 'Assignees')).not.toThrow();
      expect(() => validatePropertyValue([validUser1], definition, 'Assignees')).not.toThrow();
      expect(() =>
        validatePropertyValue([validUser1, validUser2], definition, 'Assignees')
      ).not.toThrow();
      expect(() => validatePropertyValue([validUser3], definition, 'Assignees')).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'Assignees')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'Assignees')).not.toThrow();
    });

    it('should reject invalid people property values', () => {
      const definition: PropertyDefinition = { type: 'people' };

      // Invalid user objects
      const invalidUser1 = { id: '', name: 'John', type: 'person' }; // Empty ID
      const invalidUser2 = { name: 'John', type: 'person' }; // Missing ID
      const invalidUser3 = { id: 'user-123', name: 'John', type: 'invalid' }; // Invalid type
      const invalidUser4 = { id: 'user-123', type: 'person' }; // Valid minimal user

      expect(() => validatePropertyValue('not-an-array', definition, 'Assignees')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue([invalidUser1], definition, 'Assignees')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue([invalidUser2], definition, 'Assignees')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue([invalidUser3], definition, 'Assignees')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue([{}], definition, 'Assignees')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue(['string'], definition, 'Assignees')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue(123, definition, 'Assignees')).toThrow(
        PropertyValidationError
      );

      // This should pass - valid minimal user
      expect(() => validatePropertyValue([invalidUser4], definition, 'Assignees')).not.toThrow();
    });

    it('should provide specific error details for people properties', () => {
      const definition: PropertyDefinition = { type: 'people' };

      try {
        validatePropertyValue('not-an-array', definition, 'Assignees');
      } catch (error) {
        expect(error).toBeInstanceOf(PropertyValidationError);
        const propError = error as PropertyValidationError;
        expect(propError.context.property).toBe('Assignees');
        expect(propError.context.value).toBe('not-an-array');
        expect(propError.context.expectedType).toBe('NotionUser[]');
      }
    });

    it('should handle mixed valid/invalid user arrays', () => {
      const definition: PropertyDefinition = { type: 'people' };

      const validUser: NotionUser = {
        id: 'user-123',
        name: 'John Doe',
        avatar_url: null,
        type: 'person',
        person: null,
        bot: null,
      };

      const invalidUser = { id: '', name: 'Invalid User', type: 'person' };

      expect(() =>
        validatePropertyValue([validUser, invalidUser], definition, 'Assignees')
      ).toThrow(PropertyValidationError);
    });
  });

  describe('Schema Validation with Contact Properties', () => {
    it('should validate schema with contact properties', () => {
      const contactSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          Email: { type: 'email' },
          Website: { type: 'url' },
          CreatedDate: { type: 'date' },
          Assignees: { type: 'people' },
        },
      };

      const result = validateSchemaStructure(contactSchema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle mixed property type schemas with contacts', () => {
      const crmSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          CompanyName: { type: 'title' },
          Description: { type: 'rich_text' },
          ContactEmail: { type: 'email' },
          Website: { type: 'url' },
          FollowUpDate: { type: 'date' },
          Assignees: { type: 'people' },
          Industry: {
            type: 'select',
            options: ['Technology', 'Healthcare', 'Finance', 'Education'],
          },
          Services: {
            type: 'multi_select',
            options: ['Consulting', 'Development', 'Support', 'Training'],
          },
          Budget: { type: 'number', format: 'dollar' },
          IsActive: { type: 'checkbox' },
        },
      };

      const result = validateSchemaStructure(crmSchema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Property Type Integration', () => {
    it('should distinguish between different contact property types', () => {
      const dateProperty: PropertyDefinition = { type: 'date' };
      const emailProperty: PropertyDefinition = { type: 'email' };
      const urlProperty: PropertyDefinition = { type: 'url' };
      const peopleProperty: PropertyDefinition = { type: 'people' };

      // Date properties accept Date objects
      expect(() => validatePropertyValue(new Date(), dateProperty, 'Date')).not.toThrow();
      expect(() => validatePropertyValue('2024-01-01', dateProperty, 'Date')).toThrow(
        PropertyValidationError
      );

      // Email properties only accept valid email strings
      expect(() => validatePropertyValue('user@example.com', emailProperty, 'Email')).not.toThrow();
      expect(() => validatePropertyValue('https://example.com', emailProperty, 'Email')).toThrow(
        PropertyValidationError
      );

      // URL properties only accept valid URL strings
      expect(() => validatePropertyValue('https://example.com', urlProperty, 'URL')).not.toThrow();
      expect(() => validatePropertyValue('user@example.com', urlProperty, 'URL')).toThrow(
        PropertyValidationError
      );

      // People properties only accept arrays of NotionUser objects
      const validUser = { id: 'user-123', type: 'person' as const };
      expect(() => validatePropertyValue([validUser], peopleProperty, 'People')).not.toThrow();
      expect(() => validatePropertyValue(['user-123'], peopleProperty, 'People')).toThrow(
        PropertyValidationError
      );
    });

    it('should handle edge cases for contact properties', () => {
      const dateProperty: PropertyDefinition = { type: 'date' };
      const emailProperty: PropertyDefinition = { type: 'email' };
      const urlProperty: PropertyDefinition = { type: 'url' };

      // All contact properties should accept null
      expect(() => validatePropertyValue(null, dateProperty, 'Date')).not.toThrow();
      expect(() => validatePropertyValue(null, emailProperty, 'Email')).not.toThrow();
      expect(() => validatePropertyValue(null, urlProperty, 'URL')).not.toThrow();

      // Date edge cases
      expect(() => validatePropertyValue(new Date('invalid'), dateProperty, 'Date')).not.toThrow(); // Invalid dates are still Date objects
      expect(() => validatePropertyValue(new Date(0), dateProperty, 'Date')).not.toThrow(); // Unix epoch

      // URL with various protocols (only http/https should be valid)
      expect(() =>
        validatePropertyValue('https://localhost:3000', urlProperty, 'URL')
      ).not.toThrow();
      expect(() =>
        validatePropertyValue('http://192.168.1.1:8080', urlProperty, 'URL')
      ).not.toThrow();
    });
  });
});
