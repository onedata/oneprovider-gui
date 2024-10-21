/**
 * Model containing tab models for FileInfoModal component.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';

export default EmberObject.extend({
  tabOptions: reads('fileInfoModal.tabOptions'),
  previewMode: reads('fileInfoModal.previewMode'),
  tabModelFactory: reads('fileInfoModal.tabModelFactory'),

  size: destroyableComputed(function size() {
    return this.tabModelFactory.createTabModel('size');
  }),

  metadata: destroyableComputed(
    'tabModelFactory',
    'previewMode',
    'tabOptions.metadata',
    function metadata() {
      return this.tabModelFactory.createTabModel('metadata', {
        previewMode: this.previewMode,
        ...this.tabOptions?.metadata,
      });
    }
  ),

  permissions: destroyableComputed(
    'tabModelFactory',
    'previewMode',
    'tabOptions.permissions',
    function permissions() {
      return this.tabModelFactory.createTabModel('permissions', {
        readonly: this.previewMode,
        ...this.tabOptions?.permissions,
      });
    }
  ),

  shares: destroyableComputed(
    'tabModelFactory',
    'tabOptions.shares',
    function shares() {
      return this.tabModelFactory.createTabModel('shares', {
        ...this.tabOptions?.shares,
      });
    }
  ),

  qos: destroyableComputed(function qos() {
    return this.tabModelFactory.createTabModel('qos');
  }),

  distribution: destroyableComputed(function distribution() {
    return this.tabModelFactory.createTabModel('distribution');
  }),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      destroyDestroyableComputedValues(this);
    } finally {
      this._super(...arguments);
    }
  },
});
