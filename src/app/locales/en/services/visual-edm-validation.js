import { objectTypeName } from '../components/visual-edm/object';

export default {
  tooMuchObjectOccurrences: 'there must be exactly {{count}} occurrences of {{objectTypes}}',
  valueBoth: {
    property: {
      singular: 'both value and reference/resource is specified',
    },
    object: {
      singular: 'property {{propertyString}} has both value and reference/resource specified',
      plural: 'properties {{propertyString}} have both value and reference/resource specified',
    },
    metadata: {
      singular: 'property {{propertyString}} has both value and reference/resource specified',
      plural: 'properties {{propertyString}} have both value and reference/resource specified',
    },
  },
  valueEmpty: {
    property: {
      singular: 'property has empty value',
    },
    object: {
      singular: 'property {{propertyString}} has empty value',
      plural: 'properties {{propertyString}} have empty values',
    },
    metadata: {
      singular: 'property {{propertyString}} has empty value',
      plural: 'properties {{propertyString}} have empty values',
    },
  },
  valueInvalidEnum: {
    property: {
      singular: 'the value does not come from a predefined set',
    },
    object: {
      singular: 'property {{propertyString}} has value that does not come from a predefined set',
      plural: 'properties {{propertyString}} have values that do not come from their predefined sets',
    },
    metadata: {
      singular: 'property {{propertyString}} has value that does not come from a predefined set',
      plural: 'properties {{propertyString}} have values that do not come from their predefined sets',
    },
  },
  nonUriReference: {
    property: {
      singular: 'the reference-type property should be a URI – consider changing its type to "Literal"',
    },
    object: {
      singular: 'the {{propertyString}} property is a reference, but the value is not a URI',
      plural: 'the {{propertyString}} properties are references, but values are not URIs',
    },
    metadata: {
      singular: 'the {{propertyString}} property is a reference, but the value is not a URI',
      plural: 'the {{propertyString}} properties are references, but values are not URIs',
    },
  },
  uriLiteral: {
    property: {
      singular: 'the literal-type property should not be a URI – consider changing its type to "Reference"',
    },
    object: {
      singular: 'the {{propertyString}} property value type is a literal, but the value is a URI',
      plural: 'the {{propertyString}} properties type are literal, but values are URIs',
    },
    metadata: {
      singular: 'the {{propertyString}} property value type is a literal, but the value is a URI',
      plural: 'the {{propertyString}} properties type are literal, but values are URIs',
    },
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
  missingPropertySpecificValue: {
    object: 'the object should contain {{propertyString}} property with "{{value}}" literal value',
    metadata: 'the "{{objectType}}" object should contain {{propertyString}} property with "{{value}}" literal value',
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
