/**
 * Configuration of archive form for viewing existing archive properties.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import ArchiveFormBaseModel from 'oneprovider-gui/utils/archive-form/-base-model';
import _ from 'lodash';
import { promise } from 'ember-awesome-macros';

export default ArchiveFormBaseModel.extend({
  archiveManager: service(),

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,

  /**
   * @override
   */
  configIncrementalField: computed(function configIncrementalField() {
    const configIncrementalFieldClass = this.get('configIncrementalFieldClass');
    return configIncrementalFieldClass
      .create({
        formModel: this,
      });
  }),

  valuesSource: computed('archive', function valuesSource() {
    const archive = this.get('archive');
    const description = get(archive, 'description');
    const archiveConfig = get(archive, 'config');
    const formConfig = _.cloneDeep(archiveConfig);

    const incrementalConfig = get(archiveConfig, 'incremental');
    formConfig.incremental = Boolean(
      incrementalConfig &&
      get(incrementalConfig, 'enabled')
    );

    return {
      description,
      config: formConfig,
    };
  }),

  /**
   * @override
   */
  baseArchiveProxy: promise.object(computed('archive', async function baseArchiveProxy() {
    const {
      archiveManager,
      archive,
    } = this.getProperties(
      'archiveManager',
      'archive',
    );
    const archiveIncrementalConfig = get(archive, 'config.incremental');
    if (!archiveIncrementalConfig || !get(archiveIncrementalConfig, 'enabled')) {
      return null;
    }
    return await archiveManager.getBrowsableArchive(
      archive.relationEntityId('baseArchive')
    );
  })),

  rootFieldGroup: computed(function rootFieldGroup() {
    const baseRootFieldGroup = this._super(...arguments);
    baseRootFieldGroup.set('valuesSource', reads('formModel.valuesSource'));
    return baseRootFieldGroup;
  }),

  init() {
    this._super(...arguments);
    this.get('rootFieldGroup').changeMode('view');
  },
});
