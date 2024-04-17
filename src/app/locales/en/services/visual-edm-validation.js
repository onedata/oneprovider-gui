import { objectTypeName } from '../components/visual-edm/object';

export default {
  tooMuchObjectOccurrences: 'there must be exactly {{count}} occurrences of {{objectTypes}}',
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
  objectTypeName,
};
