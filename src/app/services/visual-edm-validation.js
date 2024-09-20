/**
 * Provides human-readable texts for the EDM validators.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import { EdmMetadataInvalidObjectOcurrenceError } from 'oneprovider-gui/utils/edm/metadata-validator';
import {
  EdmObjectMissingPropertiesError,
  EdmObjectPropertiesMaxSingleError,
  EdmObjectMissingPropertySpecificValue,
} from 'oneprovider-gui/utils/edm/object-validator';
import {
  EdmPropertyBothValueTypesError,
  EdmPropertyEmptyValueError,
  EdmPropertyNonEnumValueError,
  EdmPropertyNonUriReferenceError,
  EdmPropertyUriLiteralError,
} from 'oneprovider-gui/utils/edm/property-validator';
import joinStrings from 'onedata-gui-common/utils/i18n/join-strings';
import { htmlSafe } from '@ember/string';
import { sortProperties } from 'oneprovider-gui/utils/edm/sort';
import { getTagToPropertyDataMap } from 'oneprovider-gui/utils/edm/property-spec';
import EdmObjectValidator from 'oneprovider-gui/utils/edm/object-validator';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';
import _ from 'lodash';
import EdmPropertyValidator from '../utils/edm/property-validator';

/**
 * @typedef {'visual'|'xml'} EdmValidationMessageViewType
 */

/**
 * @typedef {'metadata'|'object'|'property'} EdmValidationMessageContext
 */

export default Service.extend(I18n, {
  i18n: service(),
  visualEdmTranslation: service(),

  /**
   * @override
   */
  i18nPrefix: 'services.visualEdmValidation',

  /**
   * @param {EdmMetadataValidator|EdmObjectValidator|EdmPropertyValidator} validator
   * @param {EdmValidationMessageViewType} viewType
   * @returns {Array<SafeString>}
   */
  getErrorMessages(validator, viewType = 'visual') {
    /** @type {EdmValidationMessageContext} */
    let validationContext;
    let edmObjectType;
    switch (validator.constructor) {
      case EdmPropertyValidator:
        validationContext = 'property';
        break;
      case EdmObjectValidator:
        validationContext = 'object';
        edmObjectType = validator.edmObject.edmObjectType;
        break;
      case EdmMetadataValidator:
        validationContext = 'metadata';
        break;
      default:
        throw new Error(
          `${validator.constructor} is not supported validator type in the messages translator
        `);
    }
    const messages = [];
    let bothValueProperties = [];
    let emptyProperties = [];
    let invalidEnumProperties = [];
    let nonUriProperties = [];
    let literalUriProperties = [];
    for (const error of validator.errors) {
      if (error instanceof EdmPropertyBothValueTypesError) {
        bothValueProperties.push(error.edmProperty);
      } else if (error instanceof EdmPropertyEmptyValueError) {
        emptyProperties.push(error.edmProperty);
      } else if (error instanceof EdmPropertyNonEnumValueError) {
        invalidEnumProperties.push(error.edmProperty);
      } else if (error instanceof EdmPropertyNonUriReferenceError) {
        nonUriProperties.push(error.edmProperty);
      } else if (error instanceof EdmPropertyUriLiteralError) {
        literalUriProperties.push(error.edmProperty);
      } else if (error instanceof EdmObjectMissingPropertiesError) {
        messages.push(this.createMissingPropertiesMessage(
          validationContext,
          error.edmObject,
          error.propertyTags,
          viewType
        ));
      } else if (error instanceof EdmObjectPropertiesMaxSingleError) {
        messages.push(this.createExceedingPropertiesMessage(
          validationContext,
          error.edmObject,
          error.properties,
          viewType
        ));
      } else if (error instanceof EdmObjectMissingPropertySpecificValue) {
        messages.push(this.createMissingPropertySpecificValueMessage(
          validationContext,
          error.edmObject,
          error.propertyTag,
          error.value,
          viewType,
        ));
      } else if (error instanceof EdmMetadataInvalidObjectOcurrenceError) {
        messages.push(this.createObjectOccurrenceMessage(
          error.edmObjectType,
          error.expectedOccurence,
          viewType
        ));
      } else {
        messages.push(error.toString());
      }
    }
    bothValueProperties = sortProperties(
      _.uniqBy(bothValueProperties, 'xmlTagName'),
      viewType
    );
    emptyProperties = sortProperties(
      _.uniqBy(emptyProperties, 'xmlTagName'),
      viewType
    );
    invalidEnumProperties = sortProperties(
      _.uniqBy(invalidEnumProperties, 'xmlTagName'),
      viewType
    );
    nonUriProperties = sortProperties(
      _.uniqBy(nonUriProperties, 'xmlTagName'),
      viewType
    );
    literalUriProperties = sortProperties(
      _.uniqBy(literalUriProperties, 'xmlTagName'),
      viewType
    );
    if (bothValueProperties.length) {
      messages.push(this.createBothValueMessage(
        bothValueProperties,
        viewType,
        edmObjectType
      ));
    }
    if (emptyProperties.length) {
      messages.push(this.createEmptyValuesMessage(
        emptyProperties,
        viewType,
        edmObjectType
      ));
    }
    if (invalidEnumProperties.length) {
      messages.push(this.createInvalidEnumValuesMessage(
        invalidEnumProperties,
        viewType,
        edmObjectType
      ));
    }
    if (nonUriProperties.length) {
      messages.push(this.createPropertyNonUriReferenceMessage(
        nonUriProperties,
        viewType,
        edmObjectType
      ));
    }
    if (literalUriProperties.length) {
      messages.push(this.createLiteralUriMessage(
        literalUriProperties,
        viewType,
        edmObjectType
      ));
    }
    return messages;
  },

  translateObjectType(edmObjectType) {
    return this.t(`objectTypeName.${edmObjectType}`, { defaultValue: edmObjectType });
  },

  createObjectOccurrenceMessage(edmObjectType, expectedOccurence) {
    const quantity = expectedOccurence === 1 ? 'singular' : 'plural';
    return this.t(
      `objectOccurrence.${quantity}`, {
        objectType: this.translateObjectType(edmObjectType),
        expectedOccurence,
      }
    );
  },

  createBothValueMessage(edmProperties, viewType, edmObjectType) {
    if (!edmProperties?.length) {
      return;
    }
    const quantity = edmProperties.length === 1 ? 'singular' : 'plural';
    return this.t(
      `valueBoth.${quantity}`, {
        propertyString: this.createPropertiesString(
          edmProperties,
          viewType,
          edmObjectType
        ),
      }
    );
  },

  createEmptyValuesMessage(edmProperties, viewType, edmObjectType) {
    if (!edmProperties?.length) {
      return;
    }
    const quantity = edmProperties.length === 1 ? 'singular' : 'plural';
    return this.t(
      `valueEmpty.${quantity}`, {
        propertyString: this.createPropertiesString(
          edmProperties,
          viewType,
          edmObjectType
        ),
      }
    );
  },

  createInvalidEnumValuesMessage(edmProperties, viewType, edmObjectType) {
    if (!edmProperties?.length) {
      return;
    }
    return this.t(
      `valueInvalidEnum.${edmProperties.length === 1 ? 'singular' : 'plural'}`, {
        propertyString: this.createPropertiesString(
          edmProperties,
          viewType,
          edmObjectType,
        ),
      }
    );
  },

  createPropertyNonUriReferenceMessage(
    edmProperties,
    viewType,
    edmObjectType
  ) {
    if (!edmProperties?.length) {
      return;
    }
    const quantity = edmProperties.length === 1 ? 'singular' : 'plural';
    return this.t(
      `nonUriReference.${quantity}`, {
        propertyString: this.createPropertiesString(
          edmProperties,
          viewType,
          edmObjectType,
        ),
        objectType: this.translateObjectType(edmObjectType),
      }
    );
  },

  createLiteralUriMessage(
    edmProperties,
    viewType,
    edmObjectType
  ) {
    if (!edmProperties?.length) {
      return;
    }
    const quantity = edmProperties.length === 1 ? 'singular' : 'plural';
    return this.t(
      `uriLiteral.${quantity}`, {
        propertyString: this.createPropertiesString(
          edmProperties,
          viewType,
          edmObjectType,
        ),
        objectType: this.translateObjectType(edmObjectType),
      }
    );
  },

  createMissingPropertySpecificValueMessage(
    validationContext,
    edmObject,
    propertyTag,
    value,
    viewType
  ) {
    const tagToPropertyDataMap = getTagToPropertyDataMap()[edmObject.xmlTagName];
    const propertyData = tagToPropertyDataMap[propertyTag];
    const objectType = edmObject.edmObjectType;
    return this.t(
      `missingPropertySpecificValue.${validationContext}`, {
        objectType,
        propertyString: this.createPropertiesString(
          [propertyData],
          viewType,
          objectType
        ),
        value,
      }
    );
  },

  /**
   * @param {EdmValidationMessageContext} validationContext
   * @param {EdmObject} edmObject
   * @param {string} propertyTags XML tags with namespaces.
   * @param {EdmValidationMessageViewType} viewType
   * @returns
   */
  createMissingPropertiesMessage(validationContext, edmObject, propertyTags, viewType) {
    const tagToPropertyDataMap = getTagToPropertyDataMap()[edmObject.xmlTagName];
    const propertiesData = propertyTags.map(tag => tagToPropertyDataMap[tag]);
    const quantity = propertyTags.length === 1 ? 'singular' : 'plural';
    const edmObjectType = edmObject.edmObjectType;
    return this.t(
      `missingProperties.${validationContext}.${quantity}`, {
        objectType: this.translateObjectType(edmObjectType),
        propertyString: this.createPropertiesString(
          propertiesData,
          viewType,
          edmObjectType
        ),
      }
    );
  },

  /**
   * @param {EdmValidationMessageContext} validationContext
   * @param {EdmObject} edmObject
   * @param {string} propertyTags XML tags with namespaces.
   * @param {EdmValidationMessageViewType} viewType
   * @returns
   */
  createExceedingPropertiesMessage(
    validationContext,
    edmObject,
    propertyTags,
    viewType
  ) {
    const tagToPropertyDataMap =
      getTagToPropertyDataMap()[edmObject.xmlTagName];
    const propertiesData = propertyTags.map(tag => tagToPropertyDataMap[tag]);
    const quantity = propertyTags.length === 1 ? 'singular' : 'plural';
    return this.t(
      `exceedingProperties.${validationContext}.${quantity}`, {
        objectType: this.translateObjectType(edmObject.edmObjectType),
        propertyString: this.createPropertiesString(
          propertiesData,
          viewType,
          edmObject.edmObjectType
        ),
      }
    );
  },

  /**
   * @param {Array<EdmProperty|EdmPropertyCreationData>} properties
   * @param {EdmValidationMessageViewType} viewType
   * @param {EdmObjectType} objectType
   * @returns {Array<SafeString>}
   */
  createPropertiesString(properties, viewType, objectType) {
    return htmlSafe(joinStrings(
      this.i18n,
      properties.map(property => this.createPropertyString(
        property,
        viewType,
        objectType
      )),
      'and'
    ));
  },

  translatePropertyName(tagName, objectType) {
    const [namespace, name] = tagName.split(':');
    return this.visualEdmTranslation.getDisplayedPropertyName(
      namespace,
      name,
      objectType
    );
  },

  /**
   * @param {Array<EdmProperty|EdmPropertyCreationData>} property
   * @param {EdmValidationMessageViewType} viewType
   * @param {EdmObjectType} objectType
   * @returns {SafeString}
   */
  createPropertyString(property, viewType, objectType) {
    const tagName = property.xmlTagName;
    switch (viewType) {
      case 'visual':
        return `"${this.translatePropertyName(tagName, objectType)}"`;
      case 'xml':
        return `<code>${tagName}</code>`;
      default:
        break;
    }
  },
});
