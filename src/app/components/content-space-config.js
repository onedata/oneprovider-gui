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
import { promise, or, not } from 'ember-awesome-macros';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';

const mixins = [
  I18n,
  ContentSpaceBaseMixin,
  createDataProxyMixin('dirStatsServiceState'),
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
  dirStatsServiceStatus: reads('dirStatsServiceStateProxy.content.status'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  enforcedByAccounting: reads('dirStatsServiceStateProxy.content.enforcedByAccounting'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDirStatsCount: computed(
    'dirStatsServiceStatus',
    function isDirStatsCount() {
      const dirStatsServiceStatus = this.get('dirStatsServiceStatus');
      return ['enabled', 'initializing'].includes(dirStatsServiceStatus);
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
   * @type {ComputedProperty<boolean>}
   */
  dirStatsToggleDisabled: or(not('hasEditPrivilege'), 'enforcedByAccounting'),

  /**
   * @type {ComputedProperty<SafeString|undefined>}
   */
  dirStatsToggleLockHint: computed(
    'hasEditPrivilege',
    'enforcedByAccounting',
    function dirStatsToggleLockHint() {
      const {
        hasEditPrivilege,
        enforcedByAccounting,
        insufficientEditPrivilegesMessage,
      } = this.getProperties(
        'hasEditPrivilege',
        'enforcedByAccounting',
        'insufficientEditPrivilegesMessage'
      );

      if (!hasEditPrivilege) {
        return insufficientEditPrivilegesMessage;
      } else if (enforcedByAccounting) {
        return this.t('toggleDisabledDueAccounting');
      }
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
    this.updateDirStatsServiceStateProxy();
  },

  /**
   * @override
   * @returns {Promise<DirStatsServiceState>}
   */
  fetchDirStatsServiceState() {
    const {
      spaceManager,
      spaceEntityId,
    } = this.getProperties('spaceManager', 'spaceEntityId');
    return spaceManager.fetchDirStatsServiceState(spaceEntityId);
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
      const dirStatsServiceState = {
        enabled,
      };
      return spaceManager
        .saveDirStatsServiceState(spaceEntityId, dirStatsServiceState)
        .then(() => this.updateDirStatsServiceStateProxy())
        .catch(error => {
          this.get('globalNotify').backendError(
            this.t('configuringDirStats'),
            error
          );
          throw error;
        });
    },
  },
});
