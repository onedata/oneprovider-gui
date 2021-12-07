import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import Looper from 'onedata-gui-common/utils/looper';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

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
   * @type {string}
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
   * @type {number}
   */
  updateInterval: 3000,

  /**
   * @type {Utils.Looper}
   */
  updater: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  atmTaskName: reads('modalOptions.atmTaskName'),

  /**
   * @type {ComputedProperty<string>}
   */
  atmTaskExecutionId: reads('modalOptions.atmTaskExecutionId'),

  init() {
    this._super(...arguments);
    this.startUpdater();
  },

  willDestroyElement() {
    try {
      this.stopUpdater();
    } finally {
      this._super(...arguments);
    }
  },

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

  startUpdater() {
    const updater = Looper.create({
      immediate: false,
      interval: this.get('updateInterval'),
    });
    updater.on('tick', () => {
      this.updatePodsActivityRegistry();
    });
    this.set('updater', updater);
  },

  stopUpdater() {
    const updater = this.get('updater');
    updater && safeExec(updater, () => updater.destroy());
  },

  async updatePodsActivityRegistry() {
    await this.updatePodsActivityRegistryProxy({ replace: true });
    safeExec(this, () => {
      const selectedPodId = this.get('selectedPodId');
      const registry = this.get('podsActivityRegistry.registry');
      if (selectedPodId && (!registry || !registry[selectedPodId])) {
        this.set('selectedPodId', undefined);
      }
    });
  },

  actions: {
    podSelected(podId) {
      this.set('selectedPodId', podId);
    },
  },
});
