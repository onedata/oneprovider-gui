/**
 * Main content for file distribution view (distribution components).
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend({
  classNames: ['file-distribution-body'],

  i18n: service(),
  appProxy: service(),

  /**
   * @virtual
   * @type {Utils.FileDistributionViewModel}
   */
  viewModel: undefined,

  /**
   * @type {ComputedProperty<Models.File>}
   */
  files: reads('viewModel.files'),

  space: reads('viewModel.space'),

  activeTab: reads('viewModel.activeTab'),

  fileDistributionData: reads('viewModel.fileDistributionData'),

  oneprovidersProxy: reads('viewModel.oneprovidersProxy'),

  oneproviders: reads('oneprovidersProxy.content'),

  isMultiFile: reads('viewModel.isMultiFile'),

  itemsNumber: reads('viewModel.itemsNumber'),

  summaryText: reads('viewModel.summaryText'),

  filesSizeDetails: reads('viewModel.filesSizeDetails'),

  actions: {
    getTransfersUrl() {
      return this.appProxy.callParent('getTransfersUrl', ...arguments);
    },
    async replicate(file, destinationOneprovider) {
      return await this.viewModel.replicate([file], destinationOneprovider);
    },
    async migrate(file, sourceProvider, destinationOneprovider) {
      return await this.viewModel.migrate([file], sourceProvider, destinationOneprovider);
    },
    async evict(file, sourceOneprovider) {
      return await this.viewModel.evict([file], sourceOneprovider);
    },
    getProvidersUrl(...args) {
      return this.viewModel.getProvidersUrl?.(...args);
    },
  },
});
