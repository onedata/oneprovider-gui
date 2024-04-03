import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe } from '@ember/string';
import humanizeString from 'oneprovider-gui/utils/humanize-string';

export default Component.extend(I18n, {
  classNames: ['visual-edm-property-group', 'edm-property-group-box'],

  i18nPrefix: 'components.visualEdm.property',

  /**
   * @virtual
   * @type {Utils.VisualEdm.PropertyGroupViewModel}
   */
  viewModel: undefined,

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedPropertyName: computed(
    'viewModel.{namespace,edmPropertyType}',
    function displayedPropertyName() {
      let text;
      text = this.t(
        `propertyName.${this.viewModel.namespace}.${this.viewModel.edmPropertyType}.${this.viewModel.edmObjectType}`, {}, {
          defaultValue: null,
        }
      );
      if (text) {
        return text;
      }
      text = this.t(
        `propertyName.${this.viewModel.namespace}.${this.viewModel.edmPropertyType}`, {}, {
          defaultValue: null,
        }
      );
      if (text) {
        return text;
      }
      return htmlSafe(humanizeString(this.viewModel.edmPropertyType));
    }
  ),
});
