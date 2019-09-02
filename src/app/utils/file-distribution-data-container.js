import EmberObject, { get } from '@ember/object';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { resolve } from 'rsvp';
import { conditional, equal, raw } from 'ember-awesome-macros';

export default EmberObject.extend(
  createDataProxyMixin('fileDistributionModel'), 
  createDataProxyMixin('activeTransfers', { type: 'array' }), {
    /**
     * @type {Models.File}
     */
    file: undefined,

    /**
     * @type {Ember.ComputedProperty<string>}
     */
    fileType: reads('file.type'),

    fileSize: conditional(
      equal('fileType', raw('file')),
      'file.size',
      raw(0)
    ),

    isFileDistributionModelLoaded: reads('fileDistributionModelProxy.isFulfilled'),

    blocksPercentage: reads('fileDistributionModel.blocksPercentage'),

    chunksBarData: reads('fileDistributionModel.chunksBarData'),

    neverSynchronized: reads('fileDistributionModel.neverSynchronized'),

    fileDistribution: reads('fileDistributionModel.distribution'),

    /**
     * @override
     */
    fetchFileDistributionModel() {
      if (this.get('file.type') === 'file') {
        return get(this.get('file'), 'fileDistribution');
      } else {
        return resolve();
      }
    },

    /**
     * @override
     */
    fetchActiveTransfers() {
      return resolve();
    },

    getDistributionForOneprovider(oneprovider) {
      const {
        isFileDistributionModelLoaded,
        fileDistribution,
      } = this.getProperties('isFileDistributionModelLoaded', 'fileDistribution');
      if (isFileDistributionModelLoaded) {
        return get(fileDistribution, get(oneprovider, 'entityId'));
      } else {
        return {};
      }
    },
  }
);
