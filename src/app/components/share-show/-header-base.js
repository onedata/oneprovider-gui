import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * One of: share, handle.
   * If share - it is a link to Onezone's share.
   * If handle - it is a link to published Open Data (in handle service).
   * Initialized in init, if left undefined.
   * @type {String}
   */
  selectedUrlType: undefined,

  init() {
    this._super(...arguments);
    if (!this.get('selectedUrlType')) {
      this.set('selectedUrlType', this.get('share.hasHandle') ? 'handle' : 'share');
    }
  },
});
