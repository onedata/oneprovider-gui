import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

const mixins = [
  I18n,
  createDataProxyMixin('podsActivityRegistry'),
];

export default Component.extend(...mixins, {
  tagName: '',

  i18n: service(),
  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.atmTaskExecutionPodsActivityModal',

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
   * @type {OpenfaasPodId|undefined}
   */
  selectedPodId: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  atmTaskName: reads('modalOptions.atmTaskName'),

  /**
   * @type {ComputedProperty<string>}
   */
  atmTaskExecutionId: reads('modalOptions.atmTaskExecutionId'),

  /**
   * @override
   */
  async fetchPodsActivityRegistry() {
    const {
      atmTaskExecutionId,
      workflowManager,
    } = this.getProperties('atmTaskExecutionId', 'workflowManager');

    if (!atmTaskExecutionId) {
      throw { id: 'notFound' };
    }

    return await workflowManager
      .getAtmTaskExecutionOpenfaasActivityRegistry(atmTaskExecutionId, { reload: true });
  },

  actions: {
    podSelected(podId) {
      this.set('selectedPodId', podId);
    },
  },
});
