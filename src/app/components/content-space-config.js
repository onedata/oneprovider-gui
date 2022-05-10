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
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { promise } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default OneEmbeddedComponent.extend(I18n, ContentSpaceBaseMixin, {
  classNames: ['content-space-config'],

  store: service(),
  spaceManager: service(),

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
   * @virtual
   * @type {Promise<DirSizeStatsConfig>}
   */
  dirSizeStatsConfigProxy: promise.object(computed(
    'spaceEntityId',
    function dirSizeStatsConfigProxy() {
      const {
        spaceManager,
        spaceEntityId,
      } = this.getProperties('spaceManager', 'spaceEntityId');
      return spaceManager.fetchDirSizeStatsConfig(spaceEntityId);
    }
  )),

  /**
   * One of `enabled`, `disabled`, `stopping`, `initializing`
   * @type {ComputedProperty<String>}
   */
  statsCollectionStatus: reads('dirSizeStatsConfigProxy.content.statsCollectionStatus'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isSpaceStatisticCount: computed(
    'statsCollectionStatus',
    function isSpaceStatisticCount() {
      const statsCollectionStatus = this.get('statsCollectionStatus');
      return ['enabled', 'initializing'].includes(statsCollectionStatus);
    }
  ),

  actions: {
    changeStatisticCount(enabled) {
      const {
        spaceManager,
        spaceEntityId,
      } = this.getProperties('spaceManager', 'spaceEntityId');
      const dirSizeStatsConfig = {
        statsCollectionEnabled: enabled,
      };
      this.set('isSpaceStatisticCount', enabled);
      spaceManager.saveDirSizeStatsConfig(spaceEntityId, dirSizeStatsConfig);
    },
  },
});
