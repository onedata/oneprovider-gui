/**
 * Shows distribution and transfer-related operations for Oneprovider in
 * terms of selected files.
 * 
 * @module components/file-distribution-modal/oneproviders-distribution-item
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get, getProperties } from '@ember/object';
import { collect, notEmpty } from '@ember/object/computed';
import { sum, array, equal, raw, or, and } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import _ from 'lodash';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { reads } from '@ember/object/computed';

const emptyChunksBarData = { 0: 0 };

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: ['oneproviders-distribution-item'],

  i18n: service(),
  storageManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistributionModal.oneprovidersDistributionItem',

  /**
   * @virtual
   * @type {Models.Provider}
   */
  oneprovider: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Models.Storage}
   */
  storage: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  hasReadonlySupport: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  spaceHasSingleOneprovider: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  replicationForbidden: false,

  /**
   * @virtual
   * @type {Boolean}
   */
  evictionForbidden: false,

  /**
   * @virtual
   * @type {Function}
   * @returns {undefined}
   */
  onReplicate: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @returns {undefined}
   */
  onMigrate: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @returns {undefined}
   */
  onEvict: notImplementedThrow,

  /**
   * @type {Array<Utils.FileDistributionDataContainer>}
   */
  fileDistributionData: undefined,

  /**
   * @type {boolean}
   */
  replicationInvoked: false,

  /**
   * @type {boolean}
   */
  migrationInvoked: false,

  /**
   * @type {boolean}
   */
  evictionInvoked: false,

  /**
   * Describes max index of chunk, that can be received from backend
   * @type {number}
   */
  chunksRange: 320,

  /**
   * @type {ComputedProperty<String>}
   */
  storageId: reads('storage.entityId'),

  /**
   * @type {ComputedProperty<String>}
   */
  storageName: reads('storage.name'),

  /**
   * @type {ComputedProperty<String>}
   */
  spaceId: reads('space.entityId'),

  /**
   * @type {String}
   */
  statusIconActiveClasses: 'in-progress animated infinite semi-hinge',

  allFilesDistributionsLoaded: array.isEvery(
    'fileDistributionData',
    raw('isFileDistributionLoaded')
  ),

  neverSynchronized: computed(
    'fileDistributionData.@each.fileDistribution',
    'oneprovider',
    function neverSynchronized() {
      const {
        fileDistributionData,
        oneprovider,
      } = this.getProperties('fileDistributionData', 'oneprovider');
      const distributions = fileDistributionData
        .map(fileDistDataContainer =>
          fileDistDataContainer.getDistributionForOneprovider(oneprovider)
        )
        .compact();
      return get(distributions, 'length') === 0;
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasSingleRegFile: and(
    equal('fileDistributionData.length', raw(1)),
    array.isEvery('fileDistributionData', raw('fileType'), raw('file'))
  ),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  filesSize: sum(array.mapBy('fileDistributionData', raw('fileSize'))),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  blockCount: computed(
    'hasSingleRegFile',
    'fileDistDataContainer',
    'oneprovider',
    'storageId',
    'allFilesDistributionsLoaded',
    function blockCount() {
      const {
        hasSingleRegFile,
        fileDistributionData,
        oneprovider,
        storageId,
        allFilesDistributionsLoaded,
      } = this.getProperties(
        'hasSingleRegFile',
        'fileDistributionData',
        'oneprovider',
        'storageId',
        'allFilesDistributionsLoaded'
      );
      if (hasSingleRegFile && allFilesDistributionsLoaded) {
        const fileDistribution =
          fileDistributionData[0].getDistributionForStorageId(oneprovider, storageId);
        return get(fileDistribution, 'blockCount');
      } else {
        return undefined;
      }

    }
  ),

  /**
   * @type {Ember.ComputedProperty<number|undefined>}
   */
  filesSizeOnStorage: computed(
    'fileDistributionData.@each.fileDistribution',
    'oneprovider',
    'storageId',
    'isDistributionDataIncomplete',
    function filesSizeOnStorage() {
      const {
        fileDistributionData,
        oneprovider,
        storageId,
        isDistributionDataIncomplete,
      } = this.getProperties(
        'fileDistributionData',
        'oneprovider',
        'storageId',
        'isDistributionDataIncomplete'
      );
      let size = 0;
      if (isDistributionDataIncomplete) {
        return undefined;
      }
      fileDistributionData.forEach(fileDistDataContainer => {
        const fileDistribution =
          fileDistDataContainer.getDistributionForStorageId(oneprovider, storageId);
        size += get(fileDistribution, 'physicalSize');
      });
      return size;
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasOnlyDirs: array.isEvery('fileDistributionData', raw('fileType'), raw('dir')),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasOnlyFiles: array.isEvery('fileDistributionData', raw('fileType'), raw('file')),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isDistributionDataIncomplete: computed(
    'fileDistributionData.@each.{fileDistribution}',
    'oneprovider',
    function isDistributionDataIncomplete() {
      const {
        fileDistributionData,
        oneprovider,
      } = this.getProperties('fileDistributionData', 'oneprovider');
      let noStats = false;

      fileDistributionData.forEach(fileDistDataContainer => {
        const fileDistribution =
          fileDistDataContainer.getDistributionForOneprovider(oneprovider);
        if (!get(fileDistribution, 'success')) {
          noStats = true;
        }
      });
      return noStats;
    }),

  /**
   * @type {Ember.ComputedProperty<number|undefined>}
   */
  percentage: computed(
    'filesSizeOnStorage',
    'filesSize',
    'allFilesDistributionsLoaded',
    'isDistributionDataIncomplete',
    function () {
      const {
        filesSize,
        filesSizeOnStorage,
        allFilesDistributionsLoaded,
        isDistributionDataIncomplete,
      } = this.getProperties(
        'filesSize',
        'filesSizeOnStorage',
        'allFilesDistributionsLoaded',
        'isDistributionDataIncomplete',
      );

      if (allFilesDistributionsLoaded && filesSize && !isDistributionDataIncomplete) {
        const percentage = Math.floor(
          (Math.min(filesSizeOnStorage, filesSize) / filesSize) * 100
        );
        return filesSizeOnStorage ? Math.max(percentage, 1) : 0;
      } else {
        return undefined;
      }
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Object>}
   */
  chunksBarData: computed(
    'allFilesDistributionsLoaded',
    'filesSize',
    'fileDistributionData.@each.{fileSize,fileDistribution}',
    'hasSingleRegFile',
    'oneprovider',
    'chunksRange',
    'hasOnlyFiles',
    'storageId',
    function chunksBarData() {
      const {
        fileDistributionData,
        filesSize,
        allFilesDistributionsLoaded,
        hasSingleRegFile,
        oneprovider,
        storageId,
      } = this.getProperties(
        'fileDistributionData',
        'filesSize',
        'allFilesDistributionsLoaded',
        'hasSingleRegFile',
        'oneprovider',
        'storageId',
      );
      if (!allFilesDistributionsLoaded || !filesSize) {
        return emptyChunksBarData;
      } else if (hasSingleRegFile) {
        const fileDistribution =
          fileDistributionData[0].getDistributionForStorageId(oneprovider, storageId);
        return (fileDistribution && get(fileDistribution, 'chunksBarData')) ||
          emptyChunksBarData;
      } else {
        return emptyChunksBarData;
      }
    }
  ),

  /**
   * Array of roles in which oneprovider is used in active transfers. Possible
   * roles:
   *   - 'replicationDestination',
   *   - 'migrationSource',
   *   - 'evictionSource'.
   * @type {Ember.ComputedProperty<Array<string>>}
   */
  oneproviderRolesInTransfers: computed(
    'fileDistributionData.@each.activeTransfers',
    function oneproviderRolesInTransfers() {
      const itemOneproviderId = this.get('oneprovider.entityId');
      const fileDistributionData = this.get('fileDistributionData');

      const roles = [];
      fileDistributionData.forEach(fileDistributionDataContainer => {
        const activeTransfers =
          get(fileDistributionDataContainer, 'activeTransfers');
        if (activeTransfers) {
          activeTransfers.forEach(transfer => {
            const replicatingOneproviderGri =
              transfer.belongsTo('replicatingProvider').id();
            const evictingOneproviderGri =
              transfer.belongsTo('evictingProvider').id();

            const replicatingOneproviderId = replicatingOneproviderGri ?
              parseGri(replicatingOneproviderGri).entityId : null;
            const evictingOneproviderId = evictingOneproviderGri ?
              parseGri(evictingOneproviderGri).entityId : null;

            if (evictingOneproviderId === itemOneproviderId) {
              if (replicatingOneproviderId) {
                roles.push('migrationSource');
              } else {
                roles.push('evictionSource');
              }
            } else if (replicatingOneproviderId === itemOneproviderId) {
              roles.push('replicationDestination');
            }
          });
        }
      });

      return _.uniq(roles);
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  oneproviderHasActiveTransfers: notEmpty('oneproviderRolesInTransfers'),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isReplicationInProgress: or(
    'replicationInvoked',
    array.includes('oneproviderRolesInTransfers', raw('replicationDestination'))
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isMigrationInProgress: or(
    'migrationInvoked',
    array.includes('oneproviderRolesInTransfers', raw('migrationSource'))
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isEvictionInProgress: or(
    'evictionInvoked',
    array.includes('oneproviderRolesInTransfers', raw('evictionSource'))
  ),

  /**
   * @type {Object} {enabled: boolean, tooltip: string}
   */
  replicateHereActionState: computed(
    'spaceHasSingleOneprovider',
    'fileDistributionData.@each.{fileType,fileDistribution}',
    'percentage',
    'oneprovider',
    'replicationForbidden',
    'storageId',
    'isDistributionDataIncomplete',
    'filesSize',
    function replicateHereActionState() {
      const {
        i18n,
        hasReadonlySupport,
        spaceHasSingleOneprovider,
        replicationForbidden,
        percentage,
        filesSize,
      } = this.getProperties(
        'i18n',
        'hasReadonlySupport',
        'spaceHasSingleOneprovider',
        'replicationForbidden',
        'percentage',
        'filesSize',
      );

      const state = { enabled: false };
      let tooltipI18nKey;

      if (filesSize === 0) {
        return state;
      }
      if (replicationForbidden) {
        state.tooltip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_schedule_replication',
        });
      } else if (spaceHasSingleOneprovider) {
        tooltipI18nKey = 'disabledReplicationSingleOneprovider';
      } else if (percentage >= 100) {
        tooltipI18nKey = 'disabledReplicationIsComplete';
      } else if (hasReadonlySupport) {
        tooltipI18nKey = 'disabledReplicationReadonly';
      } else {
        state.enabled = true;
        tooltipI18nKey = 'replicationStart';
      }

      if (tooltipI18nKey) {
        state.tooltip = this.t(tooltipI18nKey).string;
      }
      return state;
    }
  ),

  /**
   * @type {Object} {enabled: boolean, tooltip: string}
   */
  migrateActionState: computed(
    'spaceHasSingleOneprovider',
    'neverSynchronized',
    'evictionForbidden',
    'replicationForbidden',
    'percentage',
    function migrateActionState() {
      const {
        i18n,
        spaceHasSingleOneprovider,
        neverSynchronized,
        percentage,
        evictionForbidden,
        replicationForbidden,
      } = this.getProperties(
        'i18n',
        'spaceHasSingleOneprovider',
        'neverSynchronized',
        'percentage',
        'evictionForbidden',
        'replicationForbidden',
      );

      const state = { enabled: false };
      let tooltipI18nKey;

      if (evictionForbidden || replicationForbidden) {
        state.tooltip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: [
            'space_schedule_replication',
            'space_schedule_eviction',
          ],
        });
      } else if (spaceHasSingleOneprovider) {
        tooltipI18nKey = 'disabledMigrationSingleOneprovider';
      } else if (neverSynchronized || !percentage) {
        tooltipI18nKey = 'disabledMigrationIsEmpty';
      } else {
        state.enabled = true;
        tooltipI18nKey = 'migrationStart';
      }

      if (tooltipI18nKey) {
        state.tooltip = this.t(tooltipI18nKey).string;
      }
      return state;
    }
  ),

  /**
   * @type {Object} {enabled: boolean, tooltip: string}
   */
  evictActionState: computed(
    'spaceHasSingleOneprovider',
    'dataExistOnOtherOneproviders',
    'percentage',
    'evictionForbidden',
    function evictActionState() {
      const {
        i18n,
        spaceHasSingleOneprovider,
        dataExistOnOtherOneproviders,
        percentage,
        evictionForbidden,
      } = this.getProperties(
        'i18n',
        'spaceHasSingleOneprovider',
        'dataExistOnOtherOneproviders',
        'percentage',
        'evictionForbidden',
      );

      const state = { enabled: false };
      let tooltipI18nKey;

      if (evictionForbidden) {
        state.tooltip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_schedule_eviction',
        });
      } else if (spaceHasSingleOneprovider) {
        tooltipI18nKey = 'disabledEvictionSingleOneprovider';
      } else if (!dataExistOnOtherOneproviders || !percentage) {
        tooltipI18nKey = 'disabledEvictionNoBlocks';
      } else {
        state.enabled = true;
        tooltipI18nKey = 'evictionStart';
      }

      if (tooltipI18nKey) {
        state.tooltip = this.t(tooltipI18nKey).string;
      }
      return state;
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  replicateHereAction: computed(
    'replicateHereActionState.{enabled,tooltip}',
    function replicateHereAction() {
      const {
        enabled,
        tooltip,
      } = getProperties(this.get('replicateHereActionState'), 'enabled', 'tooltip');

      return {
        icon: 'data-receive',
        title: this.t('replicateHere'),
        tip: tooltip,
        tipPlacement: 'left',
        class: 'replicate-here-action-trigger',
        action: () => this.startReplication(),
        disabled: !enabled,
      };
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  migrateAction: computed(
    'migrateActionState.{enabled,tooltip}',
    function migrateAction() {
      const {
        enabled,
        tooltip,
      } = getProperties(this.get('migrateActionState'), 'enabled', 'tooltip');
      return {
        icon: 'data-send',
        title: this.t('migrate'),
        tip: tooltip,
        tipPlacement: 'left',
        class: 'migrate-action-trigger',
        action: () => this.startMigration(),
        disabled: !enabled,
      };
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  evictAction: computed(
    'evictActionState.{enabled,tooltip}',
    function evictAction() {
      const {
        enabled,
        tooltip,
      } = getProperties(this.get('evictActionState'), 'enabled', 'tooltip');

      return {
        icon: 'x',
        title: this.t('evict'),
        tip: tooltip,
        tipPlacement: 'left',
        class: 'evict-action-trigger',
        action: () => this.startEviction(),
        disabled: !enabled,
      };
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Array<Action>>}
   */
  actionsArray: collect(
    'replicateHereAction',
    'migrateAction',
    'evictAction'
  ),

  /**
   * @type {Ember.ComputedProperty<boolean|undefined>}
   */
  dataExistOnOtherOneproviders: computed(
    'oneprovider',
    'spaceHasSingleOneprovider',
    'fileDistributionData.@each.{fileType,fileDistribution}',
    'filesSize',
    'isDistributionDataIncomplete',
    function dataExistOnOtherOneproviders() {
      const {
        fileDistributionData,
        spaceHasSingleOneprovider,
        oneprovider,
        filesSize,
        isDistributionDataIncomplete,
      } = this.getProperties(
        'fileDistributionData',
        'spaceHasSingleOneprovider',
        'oneprovider',
        'filesSize',
        'isDistributionDataIncomplete',
      );
      const oneproviderId = get(oneprovider, 'entityId');
      if (isDistributionDataIncomplete) {
        return undefined;
      }
      if (spaceHasSingleOneprovider) {
        return false;
      } else if (!filesSize) {
        return false;
      } else {
        for (let i = 0; i < get(fileDistributionData, 'length'); i++) {
          const singleFileDistribution =
            get(fileDistributionData.objectAt(i), 'fileDistribution');
          const type = get(fileDistributionData.objectAt(i), 'fileType');
          const oneproviderIds = Object.keys(singleFileDistribution);
          const otherOneproviderIds = oneproviderIds.without(oneproviderId);
          for (let j = 0; j < get(otherOneproviderIds, 'length'); j++) {
            const distributionPerStorage = get(
              singleFileDistribution,
              `${otherOneproviderIds.objectAt(j)}.distributionPerStorage`
            );
            for (const storageId in distributionPerStorage) {
              if (type === 'file') {
                const blocksPercentage = get(
                  distributionPerStorage[storageId], 'blocksPercentage'
                );
                if (blocksPercentage) {
                  return true;
                }
              } else {
                if (distributionPerStorage[storageId] > 0) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
  ),

  startReplication() {
    const {
      onReplicate,
      oneproviderHasActiveTransfers,
    } = this.getProperties('onReplicate', 'oneproviderHasActiveTransfers');

    this.set('replicationInvoked', true);
    onReplicate(oneproviderHasActiveTransfers).finally(() =>
      safeExec(this, () => this.set('replicationInvoked', false))
    );
  },

  startMigration() {
    const {
      onMigrate,
      oneproviderHasActiveTransfers,
    } = this.getProperties('onMigrate', 'oneproviderHasActiveTransfers');

    this.set('migrationInvoked', true);
    onMigrate(oneproviderHasActiveTransfers).finally(() =>
      safeExec(this, () => this.set('migrationInvoked', false))
    );
  },

  startEviction() {
    const {
      onEvict,
      oneproviderHasActiveTransfers,
    } = this.getProperties('onEvict', 'oneproviderHasActiveTransfers');

    this.set('evictionInvoked', true);
    onEvict(oneproviderHasActiveTransfers).finally(() =>
      safeExec(this, () => this.set('evictionInvoked', false))
    );
  },
});
