import Component from '@ember/component';
import { get, computed } from '@ember/object';
import dcXmlParser from 'oneprovider-gui/utils/parse-dc-xml';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['open-data-preview'],

  /**
   * @override
   */
  i18nPrefix: 'components.openDataPreview',

  /**
   * @type {String}
   */
  xmlSource: undefined,

  /**
   * @type {String}
   */
  handleServiceName: undefined,

  groupedEntries: computed('xmlSource', function groupedEntries() {
    return get(
      dcXmlParser.create({ xmlSource: this.get('xmlSource') }),
      'groupedEntries'
    );
  }),
});
