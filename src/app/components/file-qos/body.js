/**
 * Shows and allows to add QoS requirements for file or directory.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-qos-body', 'fill-flex-using-column'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileQos.body',

  /**
   * @virtual
   * @type {Utils.FileQosViewModel}
   */
  viewModel: undefined,

  files: reads('viewModel.files'),

  filesTypeText: computed('files.@each.type', function fileTypeText() {
    const types = new Set(this.files.mapBy('type'));
    if (types.size > 1) {
      return this.t('fileType.multi');
    } else {
      return this.t(`fileType.${[...types][0] || 'file'}`);
    }
  }),

  noQosRequirementsProxy: reads('viewModel.noQosRequirementsProxy'),

  dataProxy: reads('viewModel.dataProxy'),

  multipleFiles: reads('viewModel.multipleFiles'),

  fileItems: reads('viewModel.fileItems'),

  valuesBuilder: reads('viewModel.valuesBuilder'),

  storages: reads('viewModel.storagesProxy.content'),

  providers: reads('viewModel.providersProxy.content'),

  queryPropertiesProxy: reads('viewModel.queryPropertiesProxy'),

  activeSlideId: reads('viewModel.activeSlideId'),

  isSaveDisabled: reads('viewModel.isSaveDisabled'),

  isAddDisabled: reads('viewModel.isAddDisabled'),

  isAddDisabledTip: reads('viewModel.isAddDisabledTip'),

  queryProperties: reads('queryPropertiesProxy.content'),

  noQosRequirements: reads('noQosRequirementsProxy.content'),

  getDataUrl() {
    this.appProxy.callParent('getDataUrl', ...arguments);
  },

  actions: {
    addQosRequirement() {
      return this.viewModel.openQosRequirementCreator();
    },
    evaluateQosExpression(expression) {
      return this.viewModel.evaluateQosExpression(expression);
    },
    removeQosRequirement(qosItem) {
      return this.viewModel.removeQosRequirement(qosItem);
    },
    changeNewEntry(data, isValid) {
      this.viewModel.changeNewEntry(data, isValid);
    },
    refreshQueryProperties() {
      this.viewModel.refreshQueryProperties();
    },
    cancelQosRequirementCreation() {
      this.viewModel.closeQosRequirementCreator();
    },
    saveQosRequirement() {
      this.viewModel.saveNewEntry();
      this.viewModel.closeQosRequirementCreator();
    },
    close() {
      this.viewModel.onClose?.();
    },
  },
});
