import FbTableRowStatusBar from 'oneprovider-gui/components/file-browser/fb-table-row-status-bar';
import { or, and } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default FbTableRowStatusBar.extend(I18n, {
  classNames: ['dataset-table-row-status-bar'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.datasetBrowser.tableRowStatusBar',

  /**
   * @virtual
   * @type {Object}
   */
  fileRowModel: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  invokeFileAction: notImplementedThrow,

  dataset: reads('file'),

  /**
   * If true, should display dataset tag
   * @type {ComputedProperty<Boolean>}
   */
  showProtectionTag: or(
    'dataIsProtected',
    'metadataIsProtected',
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  dataIsProtected: and(
    'dataset.isAttached',
    'dataset.dataIsProtected'
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsProtected: and(
    'dataset.isAttached',
    'dataset.metadataIsProtected'
  ),

  /**
   * Content for protection tag tooltip
   * @type {ComputedProperty<SafeString>}
   */
  protectionFlagsInfo: computed(
    'metadataIsProtected',
    'dataIsProtected',
    function protectionFlagsInfo() {
      const {
        metadataIsProtected,
        dataIsProtected,
      } = this.getProperties('metadataIsProtected', 'dataIsProtected');
      let translationKey;
      if (dataIsProtected && metadataIsProtected) {
        translationKey = 'both';
      } else if (dataIsProtected) {
        translationKey = 'data';
      } else if (metadataIsProtected) {
        translationKey = 'metadata';
      }
      if (translationKey) {
        return this.t(`protectionFlagsInfo.${translationKey}`);
      } else {
        return '';
      }
    }
  ),
});
