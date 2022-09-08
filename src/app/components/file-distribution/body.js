/**
 * FIXME: head doc
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';
import { conditional, equal, raw } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import { inject as service } from '@ember/service';
import { next } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { get, computed } from '@ember/object';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-distribution-body'],

  i18n: service(),
  appProxy: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistribution.body',

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
  },
});
