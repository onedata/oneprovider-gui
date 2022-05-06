/**
 * Container for space config view to use in an iframe with injected properties.
 * 
 * @module component/content-space-config
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { promise } from 'ember-awesome-macros';
import { computed } from '@ember/object';

export default OneEmbeddedComponent.extend(
  I18n, ContentSpaceBaseMixin, {
    classNames: ['content-space-config'],

    /**
     * @override
     */
    i18nPrefix: 'components.contentSpaceConfig',

    store: service(),
    spaceManager: service(),

    /**
     * @virtual optional
     * @type {Function}
     */
    containerScrollTop: notImplementedIgnore,

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

    spaceStatisticCount: computed(
      'dirSizeStatsConfigProxy',
      function spaceStatisticCount() {
        const statsCollectionStatus = this.get('dirSizeStatsConfigProxy.statsCollectionStatus');
        return ['enabled', 'initializing'].includes(statsCollectionStatus);
      }
    ),

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze([
      'spaceEntityId',
    ]),

    actions: {
      changeStatisticCount(enabled) {
        const {
          spaceManager,
          spaceEntityId,
        } = this.getProperties('spaceManager', 'spaceEntityId');
        spaceManager.patchDirSizeStatsConfig(spaceEntityId, enabled).finally((result) => {
          console.log('wyniki', result);
        });
        this.set('spaceStatisticCount', enabled);
      },
    },
  }
);
