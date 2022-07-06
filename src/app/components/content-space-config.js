/**
 * Container for space configuration per provider view to use in an iframe 
 * with injected properties.
 * 
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { promise } from 'ember-awesome-macros';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';

const mixins = [
  I18n,
  ContentSpaceBaseMixin,
  createDataProxyMixin('dirSizeStatsConfig'),
];

export default OneEmbeddedComponent.extend(...mixins, {
  classNames: ['content-space-config', 'row', 'content-row', 'no-border'],

  store: service(),
  spaceManager: service(),
  providerManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.contentSpaceConfig',

  /**
   * @override
   */
  iframeInjectedProperties: Object.freeze([
    'spaceEntityId',
  ]),

  /**
   * @type {ComputedProperty<'enabled'|'disabled'|'stopping'|'initializing'>}
   */
  statsCollectionStatus: reads('dirSizeStatsConfigProxy.content.statsCollectionStatus'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDirStatsCount: computed(
    'statsCollectionStatus',
    function isDirStatsCount() {
      const statsCollectionStatus = this.get('statsCollectionStatus');
      return ['enabled', 'initializing'].includes(statsCollectionStatus);
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  spaceName: reads('spaceProxy.content.name'),

  /**
   * @type {Ember.ComputedProperty <boolean>}
   */
  hasEditPrivilege: reads('spaceProxy.content.privileges.update'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  insufficientEditPrivilegesMessage: computed(
    function insufficientEditPrivilegesMessage() {
      return insufficientPrivilegesMessage({
        i18n: this.get('i18n'),
        modelName: 'space',
        privilegeFlag: 'space_update',
      });
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  providerName: reads('providerProxy.content.name'),

  /**
   * @type {PromiseObject<Models.Space>}
   */
  providerProxy: promise.object(computed(function providerProxy() {
    return this.get('providerManager').getCurrentProvider();
  })),

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  requiredDataProxy: promise.object(promise.all('spaceProxy', 'providerProxy')),

  init() {
    this._super(...arguments);
    this.updateDirSizeStatsConfigProxy();
  },

  /**
   * @override
   * @returns {Promise<DirSizeStatsConfig>}
   */
  fetchDirSizeStatsConfig() {
    const {
      spaceManager,
      spaceEntityId,
    } = this.getProperties('spaceManager', 'spaceEntityId');
    return spaceManager.fetchDirSizeStatsConfig(spaceEntityId);
  },

  actions: {
    /**
     * @param {boolean} enabled
     * @returns {Promise<any>}
     */
    changeStatsCount(enabled) {
      const {
        spaceManager,
        spaceEntityId,
      } = this.getProperties('spaceManager', 'spaceEntityId');
      const dirSizeStatsConfig = {
        statsCollectionEnabled: enabled,
      };
      return spaceManager.saveDirSizeStatsConfig(spaceEntityId, dirSizeStatsConfig)
        .then(() => this.updateDirSizeStatsConfigProxy())
        .catch(error => {
          this.get('globalNotify').backendError(
            this.t('configuringDirSizeStats'),
            error
          );
          throw error;
        });
    },
  },
});