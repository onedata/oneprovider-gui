/**
 * Table body with one dataset item: direct dataset for a file
 *
 * @module components/dataset-protection/direct-dataset
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
  classNames: ['dataset-protection-direct-dataset', 'datasets-table-tbody'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.datasetProtection.directDataset',

  /**
   * @virtual
   * @type {PromiseObject<Models.Dataset>}
   */
  directDatasetProxy: undefined,

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
});
