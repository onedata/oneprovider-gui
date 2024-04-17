// FIXME: jsdoc

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
import { tagToPropertyDataMap } from '../utils/edm/property-spec';
import humanizeString from 'oneprovider-gui/utils/humanize-string';

/**
 * @typedef {'visual'|'xml'} EdmValidationMessageViewType
 */

export default Service.extend(I18n, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'services.visualEdmTranslation',

  /**
   *
   * @param {EdmPropertyNamespace} namespace
   * @param {EdmPropertyName} name
   * @param {EdmObjectType} objectType
   * @returns {SafeString}
   */
  getDisplayedPropertyName(namespace, name, objectType) {
    let text;
    text = this.t(
      `propertyName.${namespace}.${name}.${objectType}`, {}, {
        defaultValue: null,
      }
    );
    if (text) {
      return text;
    }
    text = this.t(
      `propertyName.${namespace}.${name}`, {}, {
        defaultValue: null,
      }
    );
    if (text) {
      return text;
    }
    return htmlSafe(humanizeString(name));
  },
});
