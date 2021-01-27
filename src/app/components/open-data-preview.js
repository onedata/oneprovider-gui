// FIXME: jsdoc

import Component from '@ember/component';
import { get, computed, observer } from '@ember/object';
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
   * @virtual
   * @type {String}
   */
  mode: 'visual',

  /**
   * For format reference see `util:generate-dc-xml#groupedEntries`.
   * @type {Array<{ type: String, value: String }>}
   */
  groupedEntries: computed('xml', function groupedEntries() {
    return get(
      dcXmlParser.create({ xmlSource: this.get('xml') }),
      'groupedEntries'
    );
  }),

  // TODO: VFS-6566 create common up-scroll function
  modeObserver: observer('mode', function modeObserver() {
    const scrollableParent = this.$().parents('.ps')[0];
    if (scrollableParent) {
      scrollableParent.scroll({
        top: 0,
        behavior: 'smooth',
      });
    }
  }),
});
