// FIXME: jsdoc

import Component from '@ember/component';
import { get, computed, observer } from '@ember/object';
import dcXmlParser from 'oneprovider-gui/utils/parse-dc-xml';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import scrollTopClosest from 'onedata-gui-common/utils/scroll-top-closest';

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

  modeObserver: observer('mode', function modeObserver() {
    scrollTopClosest(this.get('element'));
  }),
});
