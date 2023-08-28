/**
 * Tab model for showing dir size stats in file-info-modal
 *
 * @author Michał Borzęcki
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { promise, eq, conditional, raw, and, not } from 'ember-awesome-macros';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { resolve } from 'rsvp';
import FileSizeViewModel from 'oneprovider-gui/utils/file-size-view-model';

export default BaseTabModel.extend({
  /**
   * @override
   */
  i18nPrefix: 'utils.fileInfo.sizeTabModel',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {DirStatsServiceState}
   */
  dirStatsServiceState: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  isDirStatsFeatureHidden: false,

  /**
   * @virtual
   * @type {({ providerId: string }) => string}
   */
  getProvidersUrl: undefined,

  /**
   * @override
   */
  tabId: 'size',

  /**
   * @override
   */
  headerComponent: conditional(
    and('isSpaceRootDir', not('isSizeStatsDisabled')),
    raw('file-size/header'),
    raw(undefined)
  ),

  /**
   * @override
   */
  bodyComponent: 'file-size/body',

  /**
   * @override
   */
  statusIcon: computed(
    'areSomeProvidersOffline',
    'isSizeStatsDisabled',
    function tabClass() {
      if (this.areSomeProvidersOffline) {
        return 'sign-warning-rounded';
      } else if (!this.isSizeStatsDisabled) {
        return 'checkbox-filled';
      }
    }
  ),

  /**
   * @override
   */
  tabClass: computed(
    'areSomeProvidersOffline',
    'isSizeStatsDisabled',
    function tabClass() {
      if (this.areSomeProvidersOffline) {
        return 'tab-status-warning';
      } else if (!this.isSizeStatsDisabled) {
        return 'tab-status-success';
      }
    }
  ),

  /**
   * @override
   */
  isVisible: computed('isDirStatsFeatureHidden', 'file.type', function isVisible() {
    if (!this._super(...arguments)) {
      return false;
    }
    return !this.isDirStatsFeatureHidden && get(this.file, 'type') === 'dir';
  }),

  /**
   * @type {ComputedProperty<Utils.FileSizeViewModel>}
   */
  viewModel: computed(
    'file',
    'space',
    'dirStatsServiceState',
    'getProvidersUrl',
    function viewModel() {
      return FileSizeViewModel.create({
        ownerSource: this,
        file: this.file,
        space: this.space,
        dirStatsServiceState: this.dirStatsServiceState,
        getProvidersUrl: this.getProvidersUrl,
      });
    }
  ),

  /**
   * One of `enabled`, `disabled`, `stopping`, `initializing`
   * @type {ComputedProperty<String>}
   */
  dirStatsServiceStatus: reads('dirStatsServiceState.status'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSizeStatsDisabled: computed('dirStatsServiceStatus', function isSizeStatsDisabled() {
    return ['disabled', 'stopping'].includes(this.dirStatsServiceStatus);
  }),

  /**
   * @type {ComputedProperty<boolean>}
   */
  areSomeProvidersOffline: computed('providers', function areSomeProvidersOffline() {
    return Boolean(this.providers?.find((p) => !p.online));
  }),

  /**
   * @type {ComputedProperty<Array<Models.Provider>>}
   */
  providers: reads('providersProxy.content'),

  /**
   * List of providers that support this space.
   * @type {ComputedProperty<Ember.Array<Provider>>}
   */
  providersProxy: promise.array(
    computed('space', function providersProxy() {
      if (this.space) {
        return this.space.getRelation('providerList')
          .then(providerList => get(providerList, 'list'));
      } else {
        resolve([]);
      }
    })
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSpaceRootDir: eq('file.entityId', 'space.rootDir.entityId'),

  /**
   * @override
   */
  willDestroy() {
    try {
      this.cacheFor('viewModel')?.destroy();
    } finally {
      this._super(...arguments);
    }
  },
});
