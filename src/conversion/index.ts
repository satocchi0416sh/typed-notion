/**
 * Conversion module exports for typed-notion-core-ts
 *
 * Re-exports all data conversion functionality including property extractors,
 * page transformers, and factory classes.
 */

// Property Extractors
export {
  PropertyExtractor,
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
} from './property-extractors.js';

export type { NotionPropertyValue, RichTextObject, NotionUser } from './property-extractors.js';

// Page Transformer
export { NotionPageTransformer, DEFAULT_CONVERSION_CONFIG } from './page-transformer.js';

export type {
  NotionAPIResponse,
  ConversionConfig,
  TransformationMetrics,
} from './page-transformer.js';

// Transformer Factory
export {
  TransformerFactory,
  StreamingTransformer,
  getTransformerFactory,
  resetTransformerFactory,
} from './transformer-factory.js';

export type { EnhancedTypedSchema } from './transformer-factory.js';
