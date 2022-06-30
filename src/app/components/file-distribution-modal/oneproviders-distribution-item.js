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
import { sum, array, equal, raw, or } from 'ember-awesome-macros';
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

  storage: undefined,

  storageName: computed('storage', 'storageManager', function storageName() {
    const storageId = this.get('storage');
    if (storageId.includes('unknown')) {
      return { name: 'unknown' };
    }
    const storageManager = this.get('storageManager');
    const spaceId = this.get('spaceId');
    return storageManager.getStorageById(storageId, {
      throughSpaceId: spaceId,
      backgroundReload: false,
    });
  }),

  space: undefined,

  spaceId: reads('space.entityId'),

  /**
   * @type {String}
   */
  statusIconActiveClasses: 'in-progress animated infinite semi-hinge',

  allFilesDistributionsLoaded: array.isEvery(
    'fileDistributionData',
    raw('isFileDistributionLoaded')
  ),

  unknownData: computed(
    'storage',
    function unknownData() {
      const storage = this.get('storage');
      return storage.includes('unknown');
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasSingleFile: equal('fileDistributionData.length', raw(1)),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  filesSize: sum(array.mapBy('fileDistributionData', raw('fileSize'))),

  fileSizePerProvider: computed(
    'fileDistributionData',
    'oneprovider',
    'storage',
    function fileSizePerProvider() {
      const {
        fileDistributionData,
        oneprovider,
        storage,
      } = this.getProperties('fileDistributionData', 'oneprovider', 'storage');
      let size = 0;
      fileDistributionData.forEach(fileDistDataContainer => {
        const fileDistribution =
          fileDistDataContainer.getDistributionForStorage(oneprovider, storage);
        if (get(fileDistribution, 'physicalSize')) {
          size += fileDistribution.physicalSize;
        } else {
          size += fileDistribution;
        }
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
   * @type {Ember.ComputedProperty<number>}
   */
  percentage: computed(
    'allFilesDistributionsLoaded',
    'filesSize',
    'fileDistributionData.@each.{fileSize,fileDistribution}',
    'oneprovider',
    'storage',
    'unknownData',
    function () {
      const {
        filesSize,
        fileDistributionData,
        allFilesDistributionsLoaded,
        oneprovider,
        storage,
        unknownData,
      } = this.getProperties(
        'filesSize',
        'fileDistributionData',
        'allFilesDistributionsLoaded',
        'oneprovider',
        'storage',
        'unknownData'
      );

      if (allFilesDistributionsLoaded && filesSize && !unknownData) {
        let availableBytes = 0;
        fileDistributionData.forEach(fileDistDataContainer => {
          const fileSize = get(fileDistDataContainer, 'fileSize');
          const fileType = get(fileDistDataContainer, 'fileType');
          const fileDistribution =
            fileDistDataContainer.getDistributionForStorage(oneprovider, storage);
          if (fileDistribution) {
            if (fileType === 'file') {
              const blocksPercentage = get(fileDistribution, 'blocksPercentage');
              availableBytes += fileSize * ((blocksPercentage || 0) / 100);
            } else {
              availableBytes += fileDistribution;
            }
          }
        });
        const percentage = Math.floor(
          (Math.min(availableBytes, filesSize) / filesSize) * 100
        );
        return availableBytes ? Math.max(percentage, 1) : 0;
      } else {
        return 0;
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
    'hasSingleFile',
    'oneprovider',
    'chunksRange',
    'percentage',
    'hasOnlyFiles',
    function chunksBarData() {
      const {
        fileDistributionData,
        filesSize,
        allFilesDistributionsLoaded,
        hasSingleFile,
        oneprovider,
        chunksRange,
        storage,
        hasOnlyFiles,
      } = this.getProperties(
        'fileDistributionData',
        'filesSize',
        'allFilesDistributionsLoaded',
        'hasSingleFile',
        'oneprovider',
        'chunksRange',
        'storage',
        'hasOnlyFiles',
      );
      if (!allFilesDistributionsLoaded || !filesSize) {
        return emptyChunksBarData;
      } else if (hasSingleFile && hasOnlyFiles) {
        if (hasSingleFile) {
          const fileDistribution =
            fileDistributionData[0].getDistributionForStorage(oneprovider, storage);
          return (fileDistribution && get(fileDistribution, 'chunksBarData')) ||
            emptyChunksBarData;
        } else {
          const chunks = {};
          let chunksOffset = 0;
          fileDistributionData.forEach(fileDistDataContainer => {
            const fileSize = get(fileDistDataContainer, 'fileSize');
            if (fileSize) {
              const fileShare = fileSize / filesSize;
              const fileDistribution =
                fileDistDataContainer.getDistributionForStorage(oneprovider, storage);
              const chunksBarData =
                (fileDistribution && get(fileDistribution, 'chunksBarData')) ||
                emptyChunksBarData;
              Object.keys(chunksBarData).forEach(key => {
                chunks[Number(key) * fileShare + chunksOffset] =
                  get(chunksBarData, key);
              });
              chunksOffset += fileShare * chunksRange;
            }
          });
          return chunks;
        }
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
    function replicateHereActionState() {
      const {
        i18n,
        hasReadonlySupport,
        spaceHasSingleOneprovider,
        fileDistributionData,
        replicationForbidden,
        percentage,
        oneprovider,
        storage,
      } = this.getProperties(
        'i18n',
        'hasReadonlySupport',
        'spaceHasSingleOneprovider',
        'fileDistributionData',
        'replicationForbidden',
        'percentage',
        'oneprovider',
        'storage',
      );

      const hasDirs = fileDistributionData.isAny('fileType', 'dir');

      const someNeverSynchronized = fileDistributionData
        .map(fileDistDataContainer =>
          fileDistDataContainer.getDistributionForStorage(oneprovider, storage)
        )
        .includes(undefined);

      const state = { enabled: false };
      let tooltipI18nKey;
      if (replicationForbidden) {
        state.tooltip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_schedule_replication',
        });
      } else if (spaceHasSingleOneprovider) {
        tooltipI18nKey = 'disabledReplicationSingleOneprovider';
      } else if (!(someNeverSynchronized || percentage < 100)) {
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
    'fileDistributionData.@each.fileType',
    'neverSynchronized',
    'evictionForbidden',
    'replicationForbidden',
    'percentage',
    function migrateActionState() {
      const {
        i18n,
        spaceHasSingleOneprovider,
        fileDistributionData,
        neverSynchronized,
        percentage,
        evictionForbidden,
        replicationForbidden,
      } = this.getProperties(
        'i18n',
        'spaceHasSingleOneprovider',
        'fileDistributionData',
        'neverSynchronized',
        'percentage',
        'evictionForbidden',
        'replicationForbidden',
      );

      const hasDirs = fileDistributionData.isAny('fileType', 'dir');

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
      } else if (!hasDirs && (neverSynchronized || !percentage)) {
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
    'fileDistributionData',
    'spaceHasSingleOneprovider',
    'blocksExistOnOtherOneproviders',
    'percentage',
    'evictionForbidden',
    function evictActionState() {
      const {
        i18n,
        fileDistributionData,
        spaceHasSingleOneprovider,
        blocksExistOnOtherOneproviders,
        percentage,
        evictionForbidden,
      } = this.getProperties(
        'i18n',
        'fileDistributionData',
        'spaceHasSingleOneprovider',
        'blocksExistOnOtherOneproviders',
        'percentage',
        'evictionForbidden',
      );

      const hasDirs = fileDistributionData.isAny('fileType', 'dir');

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
      } else if (!blocksExistOnOtherOneproviders || (!percentage && !hasDirs)) {
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
   * @type {Ember.ComputedProperty<boolean>}
   */
  blocksExistOnOtherOneproviders: computed(
    'oneprovider',
    'spaceHasSingleOneprovider',
    'fileDistributionData.@each.{fileType,fileDistribution}',
    'filesSize',
    function blocksExistOnOtherOneproviders() {
      const {
        fileDistributionData,
        spaceHasSingleOneprovider,
        oneprovider,
        filesSize,
      } = this.getProperties(
        'fileDistributionData',
        'spaceHasSingleOneprovider',
        'oneprovider',
        'filesSize'
      );
      const oneproviderId = get(oneprovider, 'entityId');

      if (spaceHasSingleOneprovider) {
        return false;
      } else if (fileDistributionData.isAny('fileType', 'dir')) {
        return true;
      } else if (!filesSize) {
        return false;
      } else {
        for (let i = 0; i < get(fileDistributionData, 'length'); i++) {
          const singleFileDistribution =
            get(fileDistributionData.objectAt(i), 'fileDistribution');
          const oneproviderIds = Object.keys(singleFileDistribution);
          const otherOneproviderIds = oneproviderIds.without(oneproviderId);
          for (let j = 0; j < get(otherOneproviderIds, 'length'); j++) {
            const blocksPercentage = get(
              singleFileDistribution,
              `${otherOneproviderIds.objectAt(j)}.blocksPercentage`
            );
            if (blocksPercentage) {
              return true;
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
