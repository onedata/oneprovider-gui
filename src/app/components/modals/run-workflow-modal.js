/**
 * A modal that allows to select workflow to run using passed data. modalOptions:
 * - runWorkflowCallback - callled after workflow schema selection.
 * - atmWorkflowInputDataSource - (optional) source of data passed to use in workflow.
 *   If not specified, then passed data will be ignored.
 * - atmWorkflowInputData - (optional) data to pass to the new workflow run.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import { serializedFileTypes } from 'onedata-gui-websocket-client/transforms/file-type';

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.runWorkflowModal',

  /**
   * @virtual
   * @type {String}
   */
  modalId: undefined,

  /**
   * Is described in the file header
   * @virtual
   * @type {Object}
   */
  modalOptions: undefined,

  /**
   * @type {ComputedProperty<Function>}
   * @param {String} options.atmWorkflowSchemaId
   * @param {RevisionNumber} options.atmWorkflowSchemaRevisionNumber
   * @param {any} options.fillInputStores
   */
  runWorkflowCallback: reads('modalOptions.runWorkflowCallback'),

  /**
   * May be empty or one of: `'filesSelection'`
   * @type {ComputedProperty<String|undefined>}
   */
  atmWorkflowInputDataSource: reads('modalOptions.atmWorkflowInputDataSource'),

  /**
   * @type {ComputedProperty<any>}
   */
  atmWorkflowInputData: reads('modalOptions.atmWorkflowInputData'),

  /**
   * @type {ComputedProperty<{ dataSpec: Object, valuesCount: Number }|null>}
   */
  requiredInputStoreSpec: computed(
    'atmWorkflowInputDataSource',
    'atmWorkflowInputData',
    function requiredInputStoreSpec() {
      const {
        atmWorkflowInputDataSource,
        atmWorkflowInputData,
      } = this.getProperties('atmWorkflowInputDataSource', 'atmWorkflowInputData');
      let valuesCount = 1;
      if ([undefined, null].includes(atmWorkflowInputData)) {
        return null;
      } else if (Array.isArray(atmWorkflowInputData)) {
        valuesCount = atmWorkflowInputData.length;
      }

      let dataSpec = null;
      switch (atmWorkflowInputDataSource) {
        case 'filesSelection':
          dataSpec = filesToMinimumDataSpec(atmWorkflowInputData);
          break;
        default:
          return null;
      }

      return {
        dataSpec,
        valuesCount,
      };
    }
  ),

  /**
   * @type {ComputedProperty<Array<any>|null>}
   */
  normalizedAtmWorkflowInputData: computed(
    'atmWorkflowInputDataSource',
    'atmWorkflowInputData',
    function normalizedAtmWorkflowInputData() {
      const {
        atmWorkflowInputDataSource,
        atmWorkflowInputData,
      } = this.getProperties('atmWorkflowInputDataSource', 'atmWorkflowInputData');
      if ([undefined, null].includes(atmWorkflowInputData)) {
        return null;
      }

      const atmWorkflowInputDataArray = Array.isArray(atmWorkflowInputData) ?
        atmWorkflowInputData : [atmWorkflowInputData];
      switch (atmWorkflowInputDataSource) {
        case 'filesSelection':
          return atmWorkflowInputDataArray.map(file => ({
            file_id: get(file, 'cdmiObjectId'),
          }));
        default:
          return null;
      }
    }
  ),

  actions: {
    atmWorkflowSchemaRevisionSelected(
      atmWorkflowSchema,
      atmWorkflowSchemaRevisionNumber
    ) {
      const {
        runWorkflowCallback,
        requiredInputStoreSpec,
        normalizedAtmWorkflowInputData,
      } = this.getProperties(
        'runWorkflowCallback',
        'requiredInputStoreSpec',
        'normalizedAtmWorkflowInputData'
      );
      const dataSpec = requiredInputStoreSpec && get(requiredInputStoreSpec, 'dataSpec');
      let inputStoresData;
      if (dataSpec && normalizedAtmWorkflowInputData) {
        inputStoresData = {
          dataSpec,
          data: normalizedAtmWorkflowInputData,
        };
      }
      runWorkflowCallback && runWorkflowCallback({
        atmWorkflowSchemaId: get(atmWorkflowSchema, 'entityId'),
        atmWorkflowSchemaRevisionNumber,
        inputStoresData,
      });
    },
  },
});

function filesToMinimumDataSpec(files) {
  let fileType = 'ANY';
  if (Array.isArray(files)) {
    const fileTypes = files.map(file => file && get(file, 'type')).compact().uniq();
    if (fileTypes.length === 1) {
      if (fileTypes[0] in serializedFileTypes) {
        fileType = serializedFileTypes[fileTypes[0]];
      }
    }
  }
  return {
    type: 'file',
    fileType,
  };
}
