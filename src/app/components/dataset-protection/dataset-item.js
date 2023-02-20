/**
 * Entry with information about an effective dataset for file/directory.
 *
 * @module components/dataset-protection/dataset-item
 * @author Jakub Liput
 * @copyright (C) 2021-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { and, conditional, raw, not, or } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import protectionIcons from 'oneprovider-gui/utils/dataset-protection/protection-icons';
import computedT from 'onedata-gui-common/utils/computed-t';

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
   * Mapping of protection type (data or metadata) to name of icon representing it
   * @type {Object}
   */
  protectionIcons,

  /**
   * @type {ComputedProeprty<string>}
   */
  metadataEffToggleReadonlyMessage: or(
    'metadataToggleReadonlyMessage',
    and(not('dataIsProtected'), computedT('metadataLockedDataDisabled')),
  ),

  dataEffToggleReadonlyMessage: reads('dataToggleReadonlyMessage'),

  dataReadonly: or('readonly', 'dataEffToggleReadonlyMessage'),

  metadataReadonly: or('readonly', 'metadataEffToggleReadonlyMessage'),

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

  actions: {
    async toggleDatasetProtectionFlag(flag, state) {
      const setProtectionFlags = [];
      const unsetProtectionFlags = [];
      // illegal operation - cannot set metadata protection when data is not protected
      if (flag === 'metadata_protection' && state && !this.dataIsProtected) {
        return;
      }
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
        if (typeof updateOpenedFileData === 'function') {
          const rootFileProxy = get(this.dataset, 'rootFile');
          if (rootFileProxy) {
            rootFileProxy.then(file => {
              this.updateOpenedFileData({ fileInvokingUpdate: file });
            });
          }
        }
      }
    },
  },
});
