import Service, { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import { EdmMetadataInvalidObjectOcurrence } from 'oneprovider-gui/utils/edm/metadata-validator';
import {
  EdmObjectMissingPropertiesError,
  EdmObjectPropertiesMaxSingleError,
} from 'oneprovider-gui/utils/edm/object-validator';
import { EdmPropertyEmptyValueError } from 'oneprovider-gui/utils/edm/property-validator';
import joinStrings from 'onedata-gui-common/utils/i18n/join-strings';
import { htmlSafe } from '@ember/string';
import { sortProperties } from '../utils/edm/sort';

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
    for (const error of errors) {
      if (error instanceof EdmPropertyEmptyValueError) {
        emptyProperties.push(error.edmProperty);
      } else {
        // FIXME: lepsza obsługa
        messages.push(error.toString());
      }
    }
    emptyProperties = sortProperties(emptyProperties, 'visual');
    if (emptyProperties.length) {
      const propertyString = joinStrings(
        this.i18n,
        emptyProperties.map(property => `<code>${property.xmlTagName}</code>`),
        'and'
      );
      messages.push(
        this.t(`valueEmpty.${emptyProperties.length === 1 ? 'singular' : 'plural'}`, {
          propertyString: htmlSafe(propertyString),
        })
      );
    }
    return messages;
  },
});
