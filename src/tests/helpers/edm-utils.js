export function makeAllPropertiesValid(edmObject) {
  for (const property of edmObject.edmProperties) {
    if (property.hasPredefinedValues) {
      property.setSupportedValue(property.predefinedValues[0].value);
    } else {
      property.setSupportedValue('dummy');
    }
  }
}
