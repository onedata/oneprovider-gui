import Component from '@ember/component';
import { computed, get, getProperties } from '@ember/object';
import { collect } from '@ember/object/computed';
import { sum, array, equal, raw, or } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import _ from 'lodash';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: ['oneproviders-distribution-item'],

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
  spaceHasSingleOneprovider: undefined,

  /**
   * @type {Function}
   * @returns {undefined}
   */
  onReplicate: notImplementedThrow,

  /**
   * @type {Function}
   * @returns {undefined}
   */
  onMigrate: notImplementedThrow,

  /**
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
   * `fileDistributionData` narrowed to files only
   * @type {Array<Utils.FileDistributionDataContainer>}
   */
  filesOnlyDistributionData: array.filterBy(
    'fileDistributionData',
    raw('fileType'),
    raw('file')
  ),

  hasAllFilesDistributions: array.isEvery(
    'filesOnlyDistributionData',
    raw('isFileDistributionModelLoaded')
  ),

  neverSynchronized: computed(
    'filesOnlyDistributionData.@each.fileDistribution',
    'oneprovider',
    function neverSynchronized() {
      const {
        filesOnlyDistributionData,
        oneprovider,
      } = this.getProperties('filesOnlyDistributionData', 'oneprovider');
      return filesOnlyDistributionData
        .map(fileDistDataContainer =>
          fileDistDataContainer.getDistributionForOneprovider(oneprovider)
        ).isEvery('neverSynchronized');
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasSingleFile: equal('files.length', raw(1)),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  filesSize: sum(array.mapBy('filesOnlyDistributionData', raw('fileSize'))),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  percentage: computed(
    'hasAllFilesDistributions',
    'filesSize',
    'filesOnlyDistributionData.@each.{fileSize,fileDistribution}',
    'oneprovider',
    function () {
      const {
        filesSize,
        filesOnlyDistributionData,
        hasAllFilesDistributions,
        oneprovider,
      } = this.getProperties(
        'filesSize',
        'filesOnlyDistributionData',
        'hasAllFilesDistributions',
        'oneprovider'
      );

      if (hasAllFilesDistributions && filesSize) {
          let availableBytes = 0;
          filesOnlyDistributionData.forEach(fileDistDataContainer => {
            const fileSize = get(fileDistDataContainer, 'fileSize');
            const fileDistribution =
              fileDistDataContainer.getDistributionForOneprovider(oneprovider);
            const blocksPercentage = get(fileDistribution, 'blocksPercentage');
            availableBytes += fileSize * ((blocksPercentage || 0) / 100);
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
    'hasAllFilesDistributions',
    'filesSize',
    'filesOnlyDistributionData.@each.{fileSize,fileDistribution}',
    'hasSingleFile',
    'oneprovider',
    function chunksBarData() {
      const {
        filesOnlyDistributionData,
        filesSize,
        hasAllFilesDistributions,
        hasSingleFile,
        oneprovider,
      } = this.getProperties(
        'filesOnlyDistributionData',
        'filesSize',
        'hasAllFilesDistributions',
        'hasSingleFile',
        'oneprovider'
      );

      if (!hasAllFilesDistributions || !filesSize) {
        return { 0: 0 };
      } else if (hasSingleFile) {
        const fileDistribution =
          filesOnlyDistributionData[0].getDistributionForOneprovider(oneprovider);
        return get(fileDistribution, 'chunksBarData');
      } else {
        const chunks = {};
        let chunksOffset = 0;
        filesOnlyDistributionData.forEach(fileDistDataContainer => {
          const fileSize = get(fileDistDataContainer, 'fileSize');
          if (fileSize) {
            const fileShare = fileSize / filesSize;
            const fileDistribution =
              fileDistDataContainer.getDistributionForOneprovider(oneprovider);
            const chunksBarData = get(fileDistribution, 'chunksBarData');
            if (chunksBarData) {
              Object.keys(chunksBarData).forEach(key => {
                chunks[Number(key) * fileShare + chunksOffset] = get(chunksBarData, key);
              });
            }
            chunksOffset += fileShare * 320;
          }
        });
        return chunks;
      }
    }
  ),

  /**
   * Array of roles in which oneprovider is used in active transfers. Possible
   * roles:
   *   - 'replicationSource',
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
        const activeTransfers = get(fileDistributionDataContainer, 'activeTransfers');
        if (activeTransfers) {
          activeTransfers.forEach(transfer => {
            const replicatingOneproviderGri = transfer.belongsTo('replicatingOneprovider').id();
            const evictingOneproviderGri = transfer.belongsTo('evictingOneprovider').id();

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
  isReplicationInProgress: or(
    'replicationInvoked',
    array.includes('oneproviderRolesInTransfers', raw('replicationSource'))
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
    'replicationInProgress',
    function replicateHereActionState() {
      const {
        spaceHasSingleOneprovider,
        fileDistributionData,
        percentage,
        oneprovider,
        replicationInProgress,
      } = this.getProperties(
        'spaceHasSingleOneprovider',
        'fileDistributionData',
        'percentage',
        'oneprovider',
        'replicationInProgress',
      );

      const hasDirs = fileDistributionData.isAny('fileType', 'dir');
      const someNeverSynchronized = hasDirs ? false : fileDistributionData
        .map(fileDistDataContainer =>
          fileDistDataContainer.getDistributionForOneprovider(oneprovider)
        )
        .isAny('neverSynchronized');

      const state = { enabled: false };

      if (replicationInProgress) {
        state.tooltip = this.t('disabledReplicationInProgress');
      } else if (spaceHasSingleOneprovider) {
        state.tooltip = this.t('disabledReplicationSingleOneprovider');
      } else if (!(hasDirs || someNeverSynchronized || percentage < 100)) {
        if (!someNeverSynchronized && percentage === 100) {
          state.tooltip = this.t('disabledReplicationIsComplete');
        }
      } else {
        state.enabled = true;
        state.tooltip = this.t('replicationStart');
      }

      state.tooltip = state.tooltip.string;
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
    'percentage',
    'migrationInProgress',
    function migrateActionState() {
      const {
        spaceHasSingleOneprovider,
        fileDistributionData,
        neverSynchronized,
        percentage,
        migrationInProgress,
      } = this.getProperties(
        'spaceHasSingleOneprovider',
        'fileDistributionData',
        'neverSynchronized',
        'percentage',
        'migrationInProgress'
      );

      const hasDirs = fileDistributionData.isAny('fileType', 'dir');

      const state = { enabled: false };

      if (migrationInProgress) {
        state.tooltip = this.t('disabledMigrationInProgress');
      } else if (spaceHasSingleOneprovider) {
        state.tooltip = this.t('disabledMigrationSingleOneprovider');
      } else if (!hasDirs && (neverSynchronized || !percentage)) {
        state.tooltip = this.t('disabledMigrationIsEmpty');
      } else {
        state.enabled = true;
        state.tooltip = this.t('migrationStart');
      }

      state.tooltip = state.tooltip.string;
      return state;
    }
  ),

  /**
   * @type {Object} {enabled: boolean, tooltip: string}
   */
  evictActionState: computed(
    'isEvictionInProgress',
    'spaceHasSingleOneprovider',
    'blocksExistOnOtherOneproviders',
    'percentage',
    function evictActionState() {
      const {
        isEvictionInProgress,
        spaceHasSingleOneprovider,
        blocksExistOnOtherOneproviders,
        percentage,
      } = this.getProperties(
        'isEvictionInProgress',
        'spaceHasSingleOneprovider',
        'blocksExistOnOtherOneproviders',
        'percentage'
      );

      const state = { enabled: false };
      
      if (isEvictionInProgress) {
        state.tooltip = this.t('disabledEvictionInProgress');
      } else if (spaceHasSingleOneprovider) {
        state.tooltip = this.t('disabledEvictionSingleOneprovider');
      } else if (!blocksExistOnOtherOneproviders || !percentage) {
        state.tooltip = this.t('disabledEvictionNoBlocks');
      } else {
        state.enabled = true;
        state.tooltip = this.t('migrationStart');
      }

      state.tooltip = state.tooltip.string;
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
        icon: 'replicate',
        title: this.t('replicateHere'),
        tip: tooltip,
        class: 'replicate-here-action-trigger',
        action: () => this.startReplication(),
        disabled: !enabled,
      };
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  migrateAction: computed('migrateActionState', function migrateAction() {
    const {
      enabled,
      tooltip,
    } = getProperties(this.get('migrateActionState'), 'enabled', 'tooltip');
    return {
      icon: 'migrate',
      title: this.t('migrate'),
      tip: tooltip,
      class: 'migrate-action-trigger',
      action: () => this.startMigration(),
      disabled: !enabled,
    };
  }),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  evictAction: computed('evictActionState', function evictAction() {
    const {
      enabled,
      tooltip,
    } = getProperties(this.get('evictActionState'), 'enabled', 'tooltip');

    return {
      icon: 'invalidate',
      title: this.t('evict'),
      tip: tooltip,
      class: 'evict-action-trigger',
      action: () => this.startEviction(),
      disabled: !enabled,
    };
  }),

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
    'fileDistributionData.@each(fileType,fileDistribution}',
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
          const singleFileDistribution = get(fileDistributionData.objectAt(i), 'fileDistribution');
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
    this.set('replicationInvoked', true);
    this.get('onReplicate')().finally(() =>
      safeExec(this, () => this.set('replicationInvoked', false))
    );
  },

  startMigration() {
    this.set('migrationInvoked', true);
    this.get('onMigrate')().finally(() =>
      safeExec(this, () => this.set('migrationInvoked', false))
    );
  },

  startEviction() {
    this.set('evictionInvoked', true);
    this.get('onEviction')().finally(() =>
      safeExec(this, () => this.set('evictionInvoked', false))
    );
  },
});
