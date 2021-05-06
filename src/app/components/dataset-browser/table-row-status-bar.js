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
    'dataIsEffProtected',
    'metadataIsEffProtected',
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  dataIsEffProtected: and(
    'dataset.isAttached',
    'dataset.dataIsEffProtected'
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsEffProtected: and(
    'dataset.isAttached',
    'dataset.metadataIsEffProtected'
  ),

  /**
   * Content for protection tag tooltip
   * @type {ComputedProperty<SafeString>}
   */
  protectionFlagsInfo: computed(
    'metadataIsEffProtected',
    'dataIsEffProtected',
    function protectionFlagsInfo() {
      const {
        metadataIsEffProtected,
        dataIsEffProtected,
      } = this.getProperties('metadataIsEffProtected', 'dataIsEffProtected');
      let translationKey;
      if (dataIsEffProtected && metadataIsEffProtected) {
        translationKey = 'both';
      } else if (dataIsEffProtected) {
        translationKey = 'data';
      } else if (metadataIsEffProtected) {
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
