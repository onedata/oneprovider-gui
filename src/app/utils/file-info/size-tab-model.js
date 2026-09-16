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
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';
import { inject as service } from '@ember/service';

const FileSizeViewModelInTab = FileSizeViewModel.extend({
  /**
   * @virtual
   * @type {Component.SizeTabModel} sizeTabModel
   */
  sizeTabModel: undefined,

  isActive: reads('sizeTabModel.isActive'),
});

export default BaseTabModel.extend({
  providerManager: service(),

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
  modalClass: 'without-footer',

  /**
   * @override
   */
  statusIcon: computed(
    'areSomeProvidersOffline',
    'isSizeStatsDisabled',
    'isSizeStatsInitializing',
    'isErrorsForItemsLocalProvider',
    'isErrorsForItemsRemoteProvider',
    function statusIcon() {
      if (this.isSizeStatsInitializing) {
        return 'checkbox-pending';
      } else if (this.isErrorsForItemsLocalProvider) {
        return 'checkbox-filled-warning';
      } else if (this.areSomeProvidersOffline) {
        return 'sign-warning-rounded';
      } else if (this.isErrorsForItemsRemoteProvider) {
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
    'isSizeStatsInitializing',
    'isErrorsForItemsLocalProvider',
    'isErrorsForItemsRemoteProvider',
    function tabClass() {
      if (this.isSizeStatsInitializing) {
        return 'tab-status-warning';
      } else if (this.isErrorsForItemsLocalProvider) {
        return 'tab-status-danger';
      } else if (this.areSomeProvidersOffline ||
        this.isErrorsForItemsRemoteProvider) {
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
    return !this.isDirStatsFeatureHidden &&
      get(this.file, 'type') === LegacyFileType.Directory;
  }),

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
  isSizeStatsInitializing: computed(
    'dirStatsServiceStatus',
    function isSizeStatsInitializing() {
      return ['initializing'].includes(this.dirStatsServiceStatus);
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  currentProviderId: computed(function currentProviderId() {
    return this.providerManager.getCurrentProviderId();
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  isErrorsForItemsLocalProvider: computed(
    'currentProviderId',
    'viewModel.{completeLatestDirSizeStatsValues,dirStatsNotReady,dirStatsServiceState}',
    function isErrorsForItemsLocalProvider() {
      const sizeStats = this.viewModel.completeLatestDirSizeStatsValues?.['all']?.[
        this.currentProviderId
      ];
      if (
        this.viewModel.dirStatsServiceState.status !== 'enabled' ||
        this.viewModel.dirStatsNotReady ||
        !this.currentProviderId ||
        sizeStats?.type !== 'result'
      ) {
        return false;
      }
      return sizeStats?.dirErrorCount > 0 || sizeStats?.fileErrorCount > 0;
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isErrorsForItemsRemoteProvider: computed(
    'isErrorsForItemsLocalProvider',
    'viewModel.{completeLatestDirSizeStatsValues,dirStatsNotReady,dirStatsServiceState}',
    function isErrorsForItemsRemoteProvider() {
      const sizeStats = this.viewModel.completeLatestDirSizeStatsValues?.['all'];
      if (
        this.viewModel.dirStatsServiceState.status !== 'enabled' ||
        this.viewModel.dirStatsNotReady ||
        this.isErrorsForItemsLocalProvider ||
        !sizeStats
      ) {
        return false;
      }

      for (const sizeStatsPerProvider of Object.values(sizeStats)) {
        if (sizeStatsPerProvider?.type === 'result') {
          if (
            sizeStatsPerProvider?.dirErrorCount > 0 ||
            sizeStatsPerProvider?.fileErrorCount > 0
          ) {
            return true;
          }
        }
      }
      return false;
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  areSomeProvidersOffline: computed('providers', function areSomeProvidersOffline() {
    return Boolean(this.providers?.toArray().some((p) => !get(p, 'online')));
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
   * @type {FileSizeViewModelInTab}
   */
  viewModel: destroyableComputed(
    'file',
    'space',
    'dirStatsServiceState',
    'getProvidersUrl',
    function viewModel() {
      return FileSizeViewModelInTab.create({
        ownerSource: this,
        file: this.file,
        space: this.space,
        dirStatsServiceState: this.dirStatsServiceState,
        getProvidersUrl: this.getProvidersUrl,
        sizeTabModel: this,
      });
    }
  ),

  /**
   * @override
   */
  init() {
    this._super(...arguments);
    initDestroyableCache(this);
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      destroyDestroyableComputedValues(this);
    } finally {
      this._super(...arguments);
    }
  },
});
