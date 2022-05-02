/**
 * Control of dataset estabilished directly for some file/directory
 *
 * @module components/file-dataset/direct-dataset-control
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { equal, reads } from '@ember/object/computed';
import { tag } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';

export default Component.extend(I18n, {
  classNames: ['direct-dataset-control'],

  datasetManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.directDatasetControl',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {PromiseObject<Models.Dataset>}
   */
  directDatasetProxy: undefined,

  /**
   * @virtual
   * @type {() => Promise<void>}
   */
  onEstablishDirectDataset: notImplementedReject,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  readonly: false,

  /**
   * @virtual optional
   * @type {SafeString}
   */
  readonlyMessage: undefined,

  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  directDataset: reads('directDatasetProxy.content'),

  /**
   * Valid only if `directDatasetProxy` resolves
   * @type {ComputedProperty<Boolean>}
   */
  isDatasetAttached: equal('directDataset.state', 'attached'),

  toggleId: tag `${'elementId'}-direct-dataset-attached-toggle`,

  actions: {
    async toggleDatasetAttachment(state) {
      const {
        directDataset,
        datasetManager,
        onEstablishDirectDataset,
      } = this.getProperties(
        'directDataset',
        'datasetManager',
        'onEstablishDirectDataset'
      );
      if (directDataset) {
        return await datasetManager.toggleDatasetAttachment(directDataset, state);
      } else if (state) {
        return await onEstablishDirectDataset();
      } else {
        return null;
      }
    },
  },
});
