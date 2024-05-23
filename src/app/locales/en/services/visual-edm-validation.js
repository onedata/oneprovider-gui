import { objectTypeName } from '../components/visual-edm/object';

export default {
  tooMuchObjectOccurrences: 'there must be exactly {{count}} occurrences of {{objectTypes}}',
  valueBoth: {
    singular: 'property {{propertyString}} has both value and reference/resource specified',
    plural: 'properties {{propertyString}} have both value and reference/resource specified',
  },
  valueEmpty: {
    singular: 'property {{propertyString}} has empty value',
    plural: 'properties {{propertyString}} have empty values',
  },
  valueInvalidEnum: {
    singular: 'property {{propertyString}} has value that does not come from a predefined set',
    plural: 'properties {{propertyString}} have values that do not come from their predefined sets',
  },
  missingProperties: {
    object: {
      singular: 'missing {{propertyString}} mandatory property',
      plural: 'missing {{propertyString}} mandatory properties',
    },
    metadata: {
      singular: 'missing {{propertyString}} mandatory property for {{objectType}}',
      plural: 'missing {{propertyString}} mandatory properties for {{objectType}}',
    },
  },
  exceedingProperties: {
    object: {
      singular: 'the {{propertyString}} property can only appear single time',
      plural: 'the {{propertyString}} properties can only appear in single instances',
    },
    metadata: {
      singular: 'the {{propertyString}} property can only appear single time in the "{{objectType}}"',
      plural: 'the {{propertyString}} properties can only appear in single instances in the "{{objectType}}"',
    },
  },
  objectOccurrence: {
    singular: 'there should be excatly one "{{objectType}}" object in the metadata',
    plural: '"{{objectType}}" object should occur exactly {{expectedOccurence}} times in the metadata',
  },
  objectTypeName,
};
