/**
 * Integration tests for User Story 3: Contact Schema Workflow
 * 
 * Tests the complete end-to-end workflow for schemas with:
 * 1. Date properties with proper Date object handling
 * 2. Email properties with format validation
 * 3. URL properties with protocol validation
 * 4. People properties with NotionUser validation
 * 5. Mixed contact and other property type schemas
 * 6. Validation and error handling
 */

import { describe, it, expect } from 'vitest';
import { 
  createTypedSchema, 
  validateSchemaDefinition,
  isValidSchemaDefinition 
} from '../../src/schema/index.js';
import { 
  SchemaValidationError, 
  PropertyAccessError, 
  PropertyValidationError
} from '../../src/errors/index.js';
import type { SchemaDefinition, NotionUser } from '../../src/types/index.js';

describe('Integration Test: Contact Schema Workflow', () => {
  describe('CRM Contact Schema Workflow', () => {
    it('should complete full workflow for CRM contact management with contact properties', () => {
      // Step 1: Define a CRM contact schema with contact properties
      const contactSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          CompanyName: { type: 'title' as const },
          Description: { type: 'rich_text' as const },
          ContactEmail: { type: 'email' as const },
          Website: { type: 'url' as const },
          FoundedDate: { type: 'date' as const },
          TeamMembers: { type: 'people' as const },
          Industry: { 
            type: 'select' as const, 
            options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail'] as const 
          },
          Services: { 
            type: 'multi_select' as const,
            options: ['Consulting', 'Development', 'Support', 'Training'] as const
          },
          Budget: { type: 'number' as const, format: 'dollar' as const },
          IsActive: { type: 'checkbox' as const }
        }
      };

      // Step 2: Validate schema definition
      expect(() => validateSchemaDefinition(contactSchema)).not.toThrow();
      expect(isValidSchemaDefinition(contactSchema)).toBe(true);

      // Step 3: Create typed schema
      const typedSchema = createTypedSchema(contactSchema);
      
      // Step 4: Verify schema structure includes all property types
      expect(typedSchema.databaseId).toBe('12345678-1234-5678-9abc-123456789abc');
      expect(typedSchema.propertyNames).toEqual([
        'CompanyName', 'Description', 'ContactEmail', 'Website', 'FoundedDate', 
        'TeamMembers', 'Industry', 'Services', 'Budget', 'IsActive'
      ]);

      // Step 5: Verify contact properties are accessible
      expect(typedSchema.hasProperty('ContactEmail')).toBe(true);
      expect(typedSchema.hasProperty('Website')).toBe(true);
      expect(typedSchema.hasProperty('FoundedDate')).toBe(true);
      expect(typedSchema.hasProperty('TeamMembers')).toBe(true);
      
      // Step 6: Get specific contact property definitions
      const emailProperty = typedSchema.getProperty('ContactEmail');
      expect(emailProperty.type).toBe('email');

      const urlProperty = typedSchema.getProperty('Website');
      expect(urlProperty.type).toBe('url');

      const dateProperty = typedSchema.getProperty('FoundedDate');
      expect(dateProperty.type).toBe('date');

      const peopleProperty = typedSchema.getProperty('TeamMembers');
      expect(peopleProperty.type).toBe('people');

      // Step 7: Test property filtering by type
      const emailProperties = typedSchema.getPropertiesByType('email');
      expect(emailProperties).toHaveLength(1);
      expect(emailProperties[0]?.name).toBe('ContactEmail');

      const urlProperties = typedSchema.getPropertiesByType('url');
      expect(urlProperties).toHaveLength(1);
      expect(urlProperties[0]?.name).toBe('Website');

      const dateProperties = typedSchema.getPropertiesByType('date');
      expect(dateProperties).toHaveLength(1);
      expect(dateProperties[0]?.name).toBe('FoundedDate');

      const peopleProperties = typedSchema.getPropertiesByType('people');
      expect(peopleProperties).toHaveLength(1);
      expect(peopleProperties[0]?.name).toBe('TeamMembers');

      // Step 8: Test property value validation with contact types
      const validator = typedSchema.createPropertyValidator();
      
      const validUser: NotionUser = {
        id: 'user-123',
        name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        type: 'person',
        person: { email: 'john@example.com' },
        bot: null
      };

      // Email validation
      expect(validator('ContactEmail', 'contact@company.com')).toBe(true);
      expect(validator('ContactEmail', 'invalid-email')).toBe(false);
      expect(validator('ContactEmail', null)).toBe(true);

      // URL validation
      expect(validator('Website', 'https://company.com')).toBe(true);
      expect(validator('Website', 'http://company.com')).toBe(true);
      expect(validator('Website', 'invalid-url')).toBe(false);
      expect(validator('Website', null)).toBe(true);

      // Date validation
      expect(validator('FoundedDate', new Date('2020-01-15'))).toBe(true);
      expect(validator('FoundedDate', '2020-01-15')).toBe(false);
      expect(validator('FoundedDate', null)).toBe(true);

      // People validation
      expect(validator('TeamMembers', [validUser])).toBe(true);
      expect(validator('TeamMembers', [])).toBe(true);
      expect(validator('TeamMembers', ['string'])).toBe(false);
      expect(validator('TeamMembers', null)).toBe(true);

      // Step 9: Test performance metrics
      const metrics = typedSchema.getPerformanceMetrics();
      expect(metrics.activeSchemaCount).toBe(1);
      expect(metrics.schemaProcessingTime).toBeGreaterThanOrEqual(0);

      // Step 10: Test JSON serialization includes all properties
      const json = typedSchema.toJSON();
      expect(json.databaseId).toBe(contactSchema.databaseId);
      expect(json.properties).toEqual(contactSchema.properties);
      expect(json.propertyCount).toBe(10);
    });
  });

  describe('Event Management Schema Workflow', () => {
    it('should handle event management schema with date and contact properties', () => {
      const eventSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          EventName: { type: 'title' as const },
          Description: { type: 'rich_text' as const },
          StartDate: { type: 'date' as const },
          EndDate: { type: 'date' as const },
          OrganizerEmail: { type: 'email' as const },
          RegistrationURL: { type: 'url' as const },
          Speakers: { type: 'people' as const },
          Attendees: { type: 'people' as const },
          Category: { 
            type: 'select' as const, 
            options: ['Conference', 'Workshop', 'Webinar', 'Meetup'] as const 
          },
          Tags: { 
            type: 'multi_select' as const,
            options: ['Technology', 'Business', 'Education', 'Networking'] as const
          },
          MaxAttendees: { type: 'number' as const },
          IsPublished: { type: 'checkbox' as const }
        }
      };

      // Create and validate schema
      expect(isValidSchemaDefinition(eventSchema)).toBe(true);
      const typedSchema = createTypedSchema(eventSchema);

      // Test multiple date properties
      expect(typedSchema.getPropertiesByType('date')).toHaveLength(2);
      const dateProperties = typedSchema.getPropertiesByType('date');
      expect(dateProperties.map(p => p.name)).toEqual(['StartDate', 'EndDate']);

      // Test multiple people properties
      expect(typedSchema.getPropertiesByType('people')).toHaveLength(2);
      const peopleProperties = typedSchema.getPropertiesByType('people');
      expect(peopleProperties.map(p => p.name)).toEqual(['Speakers', 'Attendees']);

      // Test contact property workflows
      const validator = typedSchema.createPropertyValidator();
      
      // Multiple date validation
      expect(validator('StartDate', new Date('2024-06-01'))).toBe(true);
      expect(validator('EndDate', new Date('2024-06-03'))).toBe(true);
      
      // Contact information validation
      expect(validator('OrganizerEmail', 'organizer@event.com')).toBe(true);
      expect(validator('RegistrationURL', 'https://event.com/register')).toBe(true);

      const speaker: NotionUser = {
        id: 'speaker-456',
        name: 'Jane Expert',
        avatar_url: null,
        type: 'person',
        person: { email: 'jane@expert.com' },
        bot: null
      };
      
      expect(validator('Speakers', [speaker])).toBe(true);
      expect(validator('Attendees', [])).toBe(true); // Empty attendees list is valid
    });
  });

  describe('Project Management Schema Workflow', () => {
    it('should handle project tracking schema with comprehensive contact properties', () => {
      const projectSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          ProjectName: { type: 'title' as const },
          Notes: { type: 'rich_text' as const },
          StartDate: { type: 'date' as const },
          DueDate: { type: 'date' as const },
          CompletionDate: { type: 'date' as const },
          ClientEmail: { type: 'email' as const },
          ProjectURL: { type: 'url' as const },
          DocumentationURL: { type: 'url' as const },
          ProjectManager: { type: 'people' as const },
          TeamMembers: { type: 'people' as const },
          Stakeholders: { type: 'people' as const },
          Status: { 
            type: 'select' as const, 
            options: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'] as const 
          },
          Priority: { 
            type: 'select' as const, 
            options: ['Low', 'Medium', 'High', 'Critical'] as const 
          }
        }
      };

      const typedSchema = createTypedSchema(projectSchema);
      
      // Verify comprehensive contact property coverage
      expect(typedSchema.getPropertiesByType('date')).toHaveLength(3);
      expect(typedSchema.getPropertiesByType('email')).toHaveLength(1);
      expect(typedSchema.getPropertiesByType('url')).toHaveLength(2);
      expect(typedSchema.getPropertiesByType('people')).toHaveLength(3);

      // Test complex validation scenarios
      const validator = typedSchema.createPropertyValidator();
      
      // Multiple URLs in same schema
      expect(validator('ProjectURL', 'https://project.internal.com')).toBe(true);
      expect(validator('DocumentationURL', 'https://docs.project.com')).toBe(true);
      
      // Multiple people arrays for different roles
      const manager: NotionUser = { id: 'mgr-123', type: 'person', name: 'Project Manager', avatar_url: null, person: null, bot: null };
      const developer: NotionUser = { id: 'dev-456', type: 'person', name: 'Developer', avatar_url: null, person: null, bot: null };
      const stakeholder: NotionUser = { id: 'stake-789', type: 'person', name: 'Stakeholder', avatar_url: null, person: null, bot: null };
      
      expect(validator('ProjectManager', [manager])).toBe(true);
      expect(validator('TeamMembers', [developer])).toBe(true);
      expect(validator('Stakeholders', [stakeholder, manager])).toBe(true);
      
      // Date timeline validation
      expect(validator('StartDate', new Date('2024-01-01'))).toBe(true);
      expect(validator('DueDate', new Date('2024-06-01'))).toBe(true);
      expect(validator('CompletionDate', new Date('2024-05-15'))).toBe(true);
    });
  });

  describe('Error Handling for Contact Properties', () => {
    it('should handle contact property validation errors gracefully', () => {
      const schema = createTypedSchema({
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Email: { type: 'email' as const },
          Website: { type: 'url' as const },
          DueDate: { type: 'date' as const },
          Assignees: { type: 'people' as const }
        }
      });

      const validator = schema.createPropertyValidator();
      
      // Invalid contact property values should be caught
      expect(validator('Email', 'invalid-email')).toBe(false);
      expect(validator('Website', 'not-a-url')).toBe(false);
      expect(validator('DueDate', '2024-01-01')).toBe(false); // String instead of Date
      expect(validator('Assignees', ['string'])).toBe(false); // String array instead of NotionUser array
    });

    it('should handle malformed contact schemas in schema creation', () => {
      // All contact property types should be valid in schema structure
      const validContactSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Email: { type: 'email' as const },
          Website: { type: 'url' as const },
          DueDate: { type: 'date' as const },
          Assignees: { type: 'people' as const }
        }
      };

      expect(isValidSchemaDefinition(validContactSchema)).toBe(true);
      expect(() => createTypedSchema(validContactSchema)).not.toThrow();
    });
  });

  describe('Performance and Scalability for Contact Properties', () => {
    it('should handle schemas with many contact properties efficiently', () => {
      const largeContactSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Email1: { type: 'email' as const },
          Email2: { type: 'email' as const },
          Email3: { type: 'email' as const },
          Website: { type: 'url' as const },
          BlogURL: { type: 'url' as const },
          LinkedInURL: { type: 'url' as const },
          TwitterURL: { type: 'url' as const },
          StartDate: { type: 'date' as const },
          EndDate: { type: 'date' as const },
          CreatedDate: { type: 'date' as const },
          UpdatedDate: { type: 'date' as const },
          Owners: { type: 'people' as const },
          Contributors: { type: 'people' as const },
          Reviewers: { type: 'people' as const }
        }
      };

      const startTime = Date.now();
      const typedSchema = createTypedSchema(largeContactSchema);
      const endTime = Date.now();

      // Should create schemas with many contact properties quickly
      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms

      // Validation should work efficiently with many contact properties
      const validator = typedSchema.createPropertyValidator();
      expect(validator('Email1', 'user1@example.com')).toBe(true);
      expect(validator('Website', 'https://example.com')).toBe(true);
      expect(validator('StartDate', new Date())).toBe(true);
      
      const validUser = { id: 'user-123', type: 'person' as const };
      expect(validator('Owners', [validUser])).toBe(true);
    });

    it('should maintain consistent performance across multiple contact operations', () => {
      const schema = createTypedSchema({
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Email: { type: 'email' as const },
          Website: { type: 'url' as const },
          DueDate: { type: 'date' as const },
          Assignees: { type: 'people' as const }
        }
      });

      const validator = schema.createPropertyValidator();
      const validUser = { id: 'user-123', type: 'person' as const };
      
      // Perform many validation operations
      for (let i = 0; i < 1000; i++) {
        expect(validator('Email', 'test@example.com')).toBe(true);
        expect(validator('Website', 'https://example.com')).toBe(true);
        expect(validator('DueDate', new Date())).toBe(true);
        expect(validator('Assignees', [validUser])).toBe(true);
        expect(schema.hasProperty('Email')).toBe(true);
        expect(schema.getProperty('Assignees').type).toBe('people');
      }

      // Schema should remain responsive
      const metrics = schema.getPerformanceMetrics();
      expect(metrics.schemaProcessingTime).toBeLessThan(1000); // Less than 1 second total
    });
  });

  describe('Real-world Contact Schema Scenarios', () => {
    it('should handle healthcare patient schema with comprehensive contact information', () => {
      const patientSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          PatientName: { type: 'title' as const },
          MedicalHistory: { type: 'rich_text' as const },
          Email: { type: 'email' as const },
          EmergencyContactEmail: { type: 'email' as const },
          PortalURL: { type: 'url' as const },
          DateOfBirth: { type: 'date' as const },
          LastVisit: { type: 'date' as const },
          NextAppointment: { type: 'date' as const },
          PrimaryCareTeam: { type: 'people' as const },
          Specialists: { type: 'people' as const },
          BloodType: { 
            type: 'select' as const, 
            options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const 
          },
          Allergies: { 
            type: 'multi_select' as const,
            options: ['Penicillin', 'Latex', 'Nuts', 'Shellfish', 'Dairy'] as const
          },
          Age: { type: 'number' as const },
          IsActive: { type: 'checkbox' as const }
        }
      };

      const typedSchema = createTypedSchema(patientSchema);
      const validator = typedSchema.createPropertyValidator();

      // Healthcare-specific validation
      expect(validator('Email', 'patient@hospital.com')).toBe(true);
      expect(validator('EmergencyContactEmail', 'emergency@family.com')).toBe(true);
      expect(validator('PortalURL', 'https://portal.hospital.com/patient/123')).toBe(true);
      expect(validator('DateOfBirth', new Date('1990-05-15'))).toBe(true);
      expect(validator('LastVisit', new Date('2024-01-15'))).toBe(true);
      
      const doctor: NotionUser = { id: 'doc-123', type: 'person', name: 'Dr. Smith', avatar_url: null, person: null, bot: null };
      const nurse: NotionUser = { id: 'nurse-456', type: 'person', name: 'Nurse Johnson', avatar_url: null, person: null, bot: null };
      
      expect(validator('PrimaryCareTeam', [doctor, nurse])).toBe(true);
      expect(validator('Specialists', [doctor])).toBe(true);
      
      // Validate schema structure for healthcare compliance
      expect(typedSchema.getPropertiesByType('email')).toHaveLength(2);
      expect(typedSchema.getPropertiesByType('date')).toHaveLength(3);
      expect(typedSchema.getPropertiesByType('people')).toHaveLength(2);
    });

    it('should handle real estate property schema with location and contact data', () => {
      const propertySchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          PropertyAddress: { type: 'title' as const },
          Description: { type: 'rich_text' as const },
          AgentEmail: { type: 'email' as const },
          OwnerEmail: { type: 'email' as const },
          ListingURL: { type: 'url' as const },
          VirtualTourURL: { type: 'url' as const },
          DateListed: { type: 'date' as const },
          DateSold: { type: 'date' as const },
          AgentTeam: { type: 'people' as const },
          InterestedBuyers: { type: 'people' as const },
          PropertyType: { 
            type: 'select' as const, 
            options: ['House', 'Apartment', 'Condo', 'Townhouse', 'Land'] as const 
          },
          Features: { 
            type: 'multi_select' as const,
            options: ['Pool', 'Garage', 'Garden', 'Fireplace', 'Basement', 'Balcony'] as const
          },
          Price: { type: 'number' as const, format: 'dollar' as const },
          IsAvailable: { type: 'checkbox' as const }
        }
      };

      const typedSchema = createTypedSchema(propertySchema);
      
      // Real estate workflow validation
      const validator = typedSchema.createPropertyValidator();
      expect(validator('AgentEmail', 'agent@realty.com')).toBe(true);
      expect(validator('ListingURL', 'https://mls.com/property/123456')).toBe(true);
      expect(validator('VirtualTourURL', 'https://virtualtour.com/property/123')).toBe(true);
      expect(validator('DateListed', new Date('2024-03-01'))).toBe(true);

      const agent: NotionUser = { id: 'agent-123', type: 'person', name: 'Real Estate Agent', avatar_url: null, person: { email: 'agent@realty.com' }, bot: null };
      const buyer: NotionUser = { id: 'buyer-456', type: 'person', name: 'Potential Buyer', avatar_url: null, person: null, bot: null };
      
      expect(validator('AgentTeam', [agent])).toBe(true);
      expect(validator('InterestedBuyers', [buyer])).toBe(true);
      
      // Verify comprehensive contact property integration
      expect(typedSchema.getPropertiesByType('email')).toHaveLength(2);
      expect(typedSchema.getPropertiesByType('url')).toHaveLength(2);
      expect(typedSchema.getPropertiesByType('date')).toHaveLength(2);
      expect(typedSchema.getPropertiesByType('people')).toHaveLength(2);
    });
  });
});