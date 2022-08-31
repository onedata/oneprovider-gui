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
import { computed, get } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import { all as allFulfilled } from 'rsvp';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-qos-body'],

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

  /**
   * Resolves to true if there is no QoS requirement in any file.
   * @type {ComputedProperty<PromiseObject<boolean>>}
   */
  noQosRequirementsProxy: promise.object(computed(
    'files.@each.fileQosSummary',
    async function noQosRequirementsProxy() {
      /** @type {Array<Promise<number>>} */
      const requirementsNumberPromises = this.files.map(async file => {
        const fileQosSummary = await get(file, 'fileQosSummary');
        return Object.keys(get(fileQosSummary, 'requirements')).length;
      });
      return !(await allFulfilled(requirementsNumberPromises)).some(Boolean);
    }
  )),

  noQosRequirements: reads('noQosRequirementsProxy.content'),

  dataProxy: reads('viewModel.dataProxy'),

  multipleFiles: reads('viewModel.multipleFiles'),

  fileItems: reads('viewModel.fileItems'),

  valuesBuilder: reads('viewModel.valuesBuilder'),

  storages: reads('viewModel.storagesProxy.content'),

  providers: reads('viewModel.providersProxy.content'),

  queryProperties: reads('viewModel.queryPropertiesProxy.content'),

  getDataUrl() {
    this.appProxy.callParent('getDataUrl', ...arguments);
  },

  actions: {
    createQosRequirement() {

    },
    evaluateQosExpression(expression) {
      return this.viewModel.evaluateQosExpression(expression);
    },
    removeQosRequirement(qosItem) {
      return this.viewModel.removeQosRequirement(qosItem);
    },
    close() {
      // FIXME: implement
    },
  },
});
