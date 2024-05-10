/**
 * Base (abstract) component for handling Dublin Core Metadata.
 * See components that inherit for specific usage.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import Component from '@ember/component';
import { observer } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/i18n';
import scrollTopClosest from 'onedata-gui-common/utils/scroll-top-closest';

const defaultMode = 'visual';

export default Component.extend(I18n, {
  classNames: ['share-show-dc'],

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.dc',

  /**
   * @virtual
   * @type {String}
   */
  xmlValue: undefined,

  /**
   * Set the initial mode.
   * Note that changing this property after component is rendered does not change the
   * mode.
   * @virtual optional
   * @type {'visual'|'xml'}
   */
  initialMode: undefined,

  /**
   * @virtual optional
   * @type {(mode: 'visual'|'xml') => void}
   */
  onModeChange: undefined,

  /**
   * @type {'visual'|'xml'}
   */
  mode: defaultMode,

  /**
   * Entries for visual form data. Each entry has type for which values are grouped
   * visually. For each visual group, there can be multiple values.
   * For more see: `util:dublin-core-xml-generator#groupedEntries`.
   * @type {Array<{ type: String, values: Array<String> }>}
   */
  groupedEntries: undefined,

  modeScrollObserver: observer('mode', function modeScrollObserver() {
    this.scrollTop();
  }),

  scrollTop() {
    if (this.element) {
      scrollTopClosest(this.element);
    }
  },

  changeMode(mode) {
    if (typeof this.onModeChange === 'function') {
      this.onModeChange(mode);
    } else {
      this.set('mode', mode);
    }
  },
});
