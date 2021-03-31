import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: ['hardlink-entry'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbInfoModal.hardlinkEntry',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {String}
   */
  fileUrl: undefined,

  /**
   * @virtual
   * @type {String}
   */
  path: undefined,

  /**
   * @virtual
   * @type {Function}
   * @returns {any}
   */
  closeModal: notImplementedIgnore,

  /**
   * @type {ComputedProperty<String>}
   */
  icon: computed('file.{type,linkedFile.type}', function icon() {
    const type = this.get('file.type');
    const linkedType = this.get('file.linkedFile.type');

    if (linkedType === 'directory' || type === 'directory') {
      return 'browser-directory';
    } else {
      return 'browser-file';
    }
  }),

  actions: {
    linkClicked() {
      this.get('closeModal')();
    },
  },
});
