/**
 * Entry with information about an effective dataset for file/directory.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import EmberObject, { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { and, not, or } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import protectionIcons from 'oneprovider-gui/utils/dataset-protection/protection-icons';
import computedT from 'onedata-gui-common/utils/computed-t';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['dataset-item'],

  datasetManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.datasetProtection.datasetItem',

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  /**
   * @virtual optional
   */
  readonly: false,

  /**
   * @virtual optional
   * @type {String}
   */
  dataToggleReadonlyMessage: '',

  /**
   * @virtual optional
   * @type {String}
   */
  metadataToggleReadonlyMessage: '',

  /**
   * Used as tip displayed on both toggles when item is readonly.
   * To set separate tip texts for data or metadata set `*ToggleReadonlyMessage`
   * properties.
   * @virtual optional
   * @type {String}
   */
  togglesReadonlyMessage: '',

  /**
   * @virtual
   * @type {Function}
   */
  updateOpenedFileData: notImplementedIgnore,

  /**
   * @type {ComputedProeprty<string>}
   */
  metadataEffToggleReadonlyMessage: or(
    'metadataToggleReadonlyMessage',
    and(not('dataIsProtected'), computedT('metadataLockedDataDisabled')),
  ),

  dataEffToggleReadonlyMessage: reads('dataToggleReadonlyMessage'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAttached: reads('dataset.isAttached'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  dataIsProtected: and(
    'isAttached',
    'dataset.dataIsProtected',
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsProtected: and(
    'isAttached',
    'dataset.metadataIsProtected',
  ),

  toggleViewModels: computed(function toggleViewModels() {
    return [
      createToggleViewModel(this, 'data'),
      createToggleViewModel(this, 'metadata'),
    ];
  }),

  async toggleDatasetProtectionFlag(flag, state) {
    const setProtectionFlags = [];
    const unsetProtectionFlags = [];
    (state ? setProtectionFlags : unsetProtectionFlags).push(flag);
    // auto turn off metadata protection when data protection is set to off
    if (flag === 'data_protection' && !state) {
      unsetProtectionFlags.push('metadata_protection');
    }
    try {
      await this.datasetManager.changeMultipleDatasetProtectionFlags(
        this.dataset,
        setProtectionFlags,
        unsetProtectionFlags,
      );
    } catch (error) {
      this.globalNotify.backendError(this.t('changingWriteProtectionSettings'), error);
      throw error;
    } finally {
      // do not wait for resolve - it's only a side effect
      if (typeof this.updateOpenedFileData === 'function') {
        const rootFileProxy = get(this.dataset, 'rootFile');
        if (rootFileProxy) {
          rootFileProxy.then(file => {
            this.updateOpenedFileData({ fileInvokingUpdate: file });
          });
        }
      }
    }
  },
});

function createToggleViewModel(datasetItem, protectionType) {
  return EmberObject.extend(I18n, OwnerInjector, {
    i18n: service(),

    /**
     * @override
     */
    i18nPrefix: 'components.datasetProtection.datasetItem',

    /**
     * @virtual
     * @type {Components.DatasetProtection.DatasetItem}
     */
    datasetItem: undefined,

    protectionType,

    protectionTypeClass: `col-dataset-protection-${protectionType}`,

    flagToggleId: computed('datasetItem.elementId', function flagToggleId() {
      return `${this.datasetItem.elementId}-${protectionType}-flag-toggle`;
    }),

    protectionTypeText: computedT(`toggleLabels.${protectionType}`),

    cellProtectionTypeClass: `col-dataset-protection-${protectionType}`,

    flagToggleClass: `flag-toggle ${protectionType}-flag-toggle`,

    isChecked: reads(`datasetItem.${protectionType}IsProtected`),

    effToggleReadonlyMessage: reads(
      `datasetItem.${protectionType}EffToggleReadonlyMessage`
    ),

    isReadOnly: or(
      'datasetItem.readonly',
      'effToggleReadonlyMessage'
    ),

    lockHint: or('effToggleReadonlyMessage', 'datasetItem.togglesReadonlyMessage'),

    icon: protectionIcons[protectionType],

    updateAction: computed('datasetItem', function updateAction() {
      return (state) => {
        if (this.isReadOnly) {
          return;
        }
        return this.datasetItem.toggleDatasetProtectionFlag(
          `${protectionType}_protection`,
          state
        );
      };
    }),
  }).create({
    datasetItem,
    ownerSource: datasetItem,
  });
}
