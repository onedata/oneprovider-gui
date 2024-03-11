import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe } from '@ember/string';
import humanizeString from 'oneprovider-gui/utils/humanize-string';

export default Component.extend(I18n, {
  classNames: ['visual-edm-property-group', 'edm-property-group-box'],

  i18nPrefix: 'components.visualEdm.property',

  /**
   * @virtual
   * @type {EdmPropertyGroup}
   */
  edmPropertyGroupModel: undefined,

  /**
   * @virtual
   * @type {Utils.VisualEdmViewModel}
   */
  viewModel: undefined,

  /**
   * @virtual
   * @type {EdmObject}
   */
  edmObjectModel: undefined,

  edmProperties: reads('edmPropertyGroupModel.edmProperties'),

  isAddAnotherEnabled: computed('model.edmPropertyType', function inputType() {
    if (this.model.edmPropertyType === 'title') {
      return true;
    } else {
      return false;
    }
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedPropertyName: computed(
    'model.{namespace,edmPropertyType}',
    function displayedPropertyName() {
      let text;
      text = this.t(
        `propertyName.${this.model.namespace}.${this.model.edmPropertyType}.${this.edmObjectModel.edmObjectType}`, {}, {
          defaultValue: null,
        }
      );
      if (text) {
        return text;
      }
      text = this.t(
        `propertyName.${this.model.namespace}.${this.model.edmPropertyType}`, {}, {
          defaultValue: null,
        }
      );
      if (text) {
        return text;
      }
      return htmlSafe(humanizeString(this.model.edmPropertyType));
    }
  ),
});
