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

export default OneEmbeddedComponent.extend(
  I18n,
  createDataProxyMixin('dirSizeStatsConfig'), {
    classNames: ['content-space-config'],

    store: service(),
    spaceManager: service(),
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
     * One of `enabled`, `disabled`, `stopping`, `initializing`
     * @type {ComputedProperty<String>}
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

    init() {
      this._super(...arguments);
      this.updateDirSizeStatsConfigProxy();
    },

    /**
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
