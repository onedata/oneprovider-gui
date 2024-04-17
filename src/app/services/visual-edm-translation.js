/**
 * Provides human-readable texts for the EDM.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import { htmlSafe } from '@ember/string';
import humanizeString from 'oneprovider-gui/utils/humanize-string';

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
