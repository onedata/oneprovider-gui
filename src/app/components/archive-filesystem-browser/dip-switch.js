import Component from '@ember/component';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.archiveFilesystemBrowser.dipSwitch',

  /**
   * @virtual optional
   * @type {Boolean}
   */
  disabled: false,

  /**
   * @virtual
   * @type {String}
   */
  archiveDipMode: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onArchiveDipModeChange: notImplementedThrow,
});
