/**
 * Main content for file distribution view (distribution components).
 *
 * NOTE: file custom attributes for this component are declared in
 * FileDistributionViewModel.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

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
    async replicate(files, destinationOneprovider) {
      return await this.viewModel.replicate(
        Array.isArray(files) ? files : [files], destinationOneprovider
      );
    },
    async migrate(files, sourceProvider, destinationOneprovider) {
      return await this.viewModel.migrate(
        Array.isArray(files) ? files : [files],
        sourceProvider,
        destinationOneprovider
      );
    },
    async evict(files, sourceOneprovider) {
      return await this.viewModel.evict(
        Array.isArray(files) ? files : [files],
        sourceOneprovider
      );
    },
    getProvidersUrl(...args) {
      return this.viewModel.getProvidersUrl(...args);
    },
  },
});
