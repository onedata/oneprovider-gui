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
} from 'oneprovider-gui/utils/edm/object-validator';
import {
  EdmPropertyEmptyValueError,
  EdmPropertyNonEnumValueError,
} from 'oneprovider-gui/utils/edm/property-validator';
import joinStrings from 'onedata-gui-common/utils/i18n/join-strings';
import { htmlSafe } from '@ember/string';
import { sortProperties } from 'oneprovider-gui/utils/edm/sort';
import { tagToPropertyDataMap } from 'oneprovider-gui/utils/edm/property-spec';
import EdmObjectValidator from 'oneprovider-gui/utils/edm/object-validator';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';

/**
 * @typedef {'visual'|'xml'} EdmValidationMessageViewType
 */

/**
 * @typedef {'metadata'|'object'} EdmValidationMessageContext
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
    let validationContext;
    let edmObjectType;
    switch (validator.constructor) {
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
    let emptyProperties = [];
    let invalidEnumProperties = [];
    const errors = validator.errors;
    for (const error of errors) {
      if (error instanceof EdmPropertyEmptyValueError) {
        emptyProperties.push(error.edmProperty);
      } else if (error instanceof EdmPropertyNonEnumValueError) {
        invalidEnumProperties.push(error.edmProperty);
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
          error.edmObject.edmObjectType,
          error.properties,
          viewType
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
    emptyProperties = sortProperties(emptyProperties, 'visual');
    invalidEnumProperties = sortProperties(invalidEnumProperties, 'visual');
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

  /**
   * @param {EdmValidationMessageContext} validationContext
   * @param {EdmObject} edmObject
   * @param {string} propertyTags XML tags with namespaces.
   * @param {EdmValidationMessageViewType} viewType
   * @returns
   */
  createMissingPropertiesMessage(validationContext, edmObject, propertyTags, viewType) {
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
   * @param {EdmObjectType} edmObjectType
   * @param {string} propertyTags XML tags with namespaces.
   * @param {EdmValidationMessageViewType} viewType
   * @returns
   */
  createExceedingPropertiesMessage(
    validationContext,
    edmObjectType,
    propertyTags,
    viewType
  ) {
    const propertiesData = propertyTags.map(tag => tagToPropertyDataMap[tag]);
    const quantity = propertyTags.length === 1 ? 'singular' : 'plural';
    return this.t(
      `exceedingProperties.${validationContext}.${quantity}`, {
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
