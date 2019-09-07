import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { collect } from '@ember/object/computed';
import { sum, array, equal, raw } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

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

      if (hasAllFilesDistributions) {
        // check filesSize to not divide by 0 (in return statement)
        if (filesSize) {
          let availableBytes = 0;
          filesOnlyDistributionData.forEach(fileDistDataContainer => {
            const fileSize = get(fileDistDataContainer, 'fileSize');
            const fileDistribution =
              fileDistDataContainer.getDistributionForOneprovider(oneprovider);
            const blocksPercentage = get(fileDistribution, 'blocksPercentage');
            availableBytes += fileSize * ((blocksPercentage || 0) / 100);
          });
    
          return Math.floor(
            (Math.min(availableBytes, filesSize) / filesSize) * 100
          );
        } else {
          return 100;
        }
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

  replicateHereTooltip: computed(function replicateHereTooltip() {
    // FIXME: implement
  }),

  isReplicationHereEnabled: computed(function isReplicationHereEnabled() {
    // FIXME: implement
    return true;
  }),

  migrateTooltip: computed(function replicateHereTooltip() {
    // FIXME: implement
  }),

  isMigrationEnabled: computed(function isMigrationEnabled() {
    // FIXME: implement
    return true;
  }),

  evictTooltip: computed(function replicateHereTooltip() {
    // FIXME: implement
  }),

  isEvictionEnabled: computed(function isMigrationEnabled() {
    // FIXME: implement
    return true;
  }),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  replicateHereAction: computed(
    'onReplicate',
    'replicateHereTooltip',
    'isReplicationHereEnabled',
    function replicateHereAction() {
      const {
        onReplicate,
        replicateHereTooltip,
        isReplicationHereEnabled,
      } = this.getProperties(
        'onReplicate',
        'replicateHereTooltip',
        'isReplicationHereEnabled'
      );

      return {
        icon: 'replicate',
        title: this.t('replicateHere'),
        tip: replicateHereTooltip,
        class: 'replicate-here-action-trigger',
        action: onReplicate,
        disabled: !isReplicationHereEnabled,
      };
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  migrateAction: computed(
    'onMigrate',
    'migrateTooltip',
    'isMigrationEnabled',
    function migrateAction() {
      const {
        onMigrate,
        migrateTooltip,
        isMigrationEnabled,
      } = this.getProperties(
        'onMigrate',
        'migrateTooltip',
        'isMigrationEnabled'
      );

      return {
        icon: 'migrate',
        title: this.t('migrate'),
        tip: migrateTooltip,
        class: 'migrate-action-trigger',
        action: onMigrate,
        disabled: !isMigrationEnabled,
      };
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  evictAction: computed(
    'onEvict',
    'evictTooltip',
    'isEvictionEnabled',
    function evictAction() {
      const {
        onEvict,
        evictTooltip,
        isEvictionEnabled,
      } = this.getProperties(
        'onEvict',
        'evictTooltip',
        'isEvictionEnabled'
      );

      return {
        icon: 'invalidate',
        title: this.t('evict'),
        tip: evictTooltip,
        class: 'evict-action-trigger',
        action: onEvict,
        disabled: !isEvictionEnabled,
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
});
