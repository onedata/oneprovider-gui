import Component from '@ember/component';
import { get, computed } from '@ember/object';
import dcXmlParser from 'oneprovider-gui/utils/parse-dc-xml';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['open-data-preview', 'open-data-view'],

  /**
   * @override
   */
  i18nPrefix: 'components.openDataPreview',

  /**
   * @virtual
   * @type {String}
   */
  xml: undefined,

  /**
   * @type {String}
   */
  mode: 'visual',

  /**
   * @type {ComputedProperty<Array<{ type: String, value: String }>>}
   */
  groupedEntries: computed('xml', function groupedEntries() {
    return get(
      dcXmlParser.create({ xmlSource: this.get('xml') }),
      'groupedEntries'
    );
  }),
});
