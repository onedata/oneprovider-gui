/**
 * Table body with one dataset item: direct dataset for a file
 *
 * @module components/file-datasets/direct-dataset
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { reads, equal } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { raw, conditional, promise } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  tagName: 'tbody',
  classNames: ['file-datasets-direct-dataset', 'datasets-table-tbody'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.directDataset',

  /**
   * @virtual
   * @type {PromiseObject<Models.Dataset>}
   */
  directDatasetProxy: undefined,

  /**
   * Mapping of protection type to icon name
   * @virtual
   * @type {Object}
   */
  protectionIcons: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  readonly: false,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  getDatasetsUrl: notImplementedIgnore,

  navigateTarget: '_top',

  /**
   * Displayed name of dataset item
   * @type {ComputedProperty<String>}
   */
  label: reads('file.name'),

  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  directDataset: reads('directDatasetProxy.content'),

  /**
   * Icon displayed for dataset item
   * @type {ComputedProperty<String>}
   */
  directDatasetRowIcon: conditional(
    'directDataset.isAttached',
    conditional(
      equal('file.type', 'file'),
      raw('browser-dataset-file'),
      raw('browser-dataset'),
    ),
    conditional(
      equal('file.type', 'file'),
      raw('browser-file'),
      raw('browser-directory'),
    ),
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  archiveCountText: computed('directDataset.archiveCount', function archiveCountText() {
    const count = this.get('directDataset.archiveCount');
    if (!count) {
      return this.t('archiveCount.none');
    } else if (count === 1) {
      return this.t('archiveCount.single');
    } else {
      return this.t('archiveCount.multi', { count });
    }
  }),

  /**
   * Link to archives view of dataset, if it has a dataset established.
   * @type {ComputedProperty<String>}
   */
  datasetArchivesLinkProxy: promise.object(computed(
    'directDatasetProxy.content.{parent,state}',
    async function datasetLinkProxy() {
      const directDataset = await this.get('directDatasetProxy');
      if (directDataset) {
        const datasetId = get(directDataset, 'entityId');
        const options = {
          datasetId,
          viewMode: 'archives',
          attachmentState: get(directDataset, 'state'),
        };
        return this.get('getDatasetsUrl')(options);
      }
    }
  )),

  datasetArchivesLink: reads('datasetArchivesLinkProxy.content'),

  /**
   * Link on item text, if it has a dataset established.
   * @type {ComputedProperty<String>}
   */
  datasetLinkProxy: promise.object(computed(
    'directDatasetProxy.content.{parent,state}',
    async function datasetLinkProxy() {
      const directDataset = await this.get('directDatasetProxy');
      if (directDataset) {
        const datasetId = get(directDataset, 'entityId');
        const parentId = directDataset.relationEntityId('parent');
        const options = {
          datasetId: parentId,
          selected: datasetId,
          viewMode: 'datasets',
          attachmentState: get(directDataset, 'state'),
        };
        return this.get('getDatasetsUrl')(options);
      }
    }
  )),

  datasetLink: reads('datasetLinkProxy.content'),
});
