import Service, { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import { EdmMetadataInvalidObjectOcurrence } from 'oneprovider-gui/utils/edm/metadata-validator';
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
import { sortProperties } from '../utils/edm/sort';
import { empty } from '@ember/object/computed';

export default Service.extend(I18n, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'services.visualEdmValidation',

  /**
   * @param {Array<EdmValidatorError>} errors
   * @returns {Array<SafeString>}
   */
  stringify(errors) {
    const messages = [];
    let emptyProperties = [];
    let invalidEnumProperties = [];
    for (const error of errors) {
      if (error instanceof EdmPropertyEmptyValueError) {
        emptyProperties.push(error.edmProperty);
      } else if (error instanceof EdmPropertyNonEnumValueError) {
        invalidEnumProperties.push(error.edmProperty);
      } else {
        messages.push(error.toString());
      }
    }
    emptyProperties = sortProperties(emptyProperties, 'visual');
    invalidEnumProperties = sortProperties(invalidEnumProperties, 'visual');
    if (emptyProperties.length) {
      messages.push(
        this.t(`valueEmpty.${emptyProperties.length === 1 ? 'singular' : 'plural'}`, {
          propertyString: this.createPropertyString(emptyProperties),
        })
      );
    }
    if (invalidEnumProperties.length) {
      messages.push(
        this.t(`valueInvalidEnum.${invalidEnumProperties.length === 1 ? 'singular' : 'plural'}`, {
          propertyString: this.createPropertyString(invalidEnumProperties),
        })
      );
    }
    return messages;
  },

  createPropertyString(edmProperties) {
    return htmlSafe(joinStrings(
      this.i18n,
      edmProperties.map(property => `<code>${property.xmlTagName}</code>`),
      'and'
    ));
  },
});
