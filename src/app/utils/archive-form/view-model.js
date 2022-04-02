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
import ClipboardField from 'onedata-gui-common/utils/form-component/clipboard-field';
import ArchiveFormBaseModel from 'oneprovider-gui/utils/archive-form/-base-model';
import _ from 'lodash';
import { promise } from 'ember-awesome-macros';

export default ArchiveFormBaseModel.extend({
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.archiveForm.viewModel',

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

  /**
   * @override
   */
  rootFormGroupClass: computed(function rootFormGroupClass() {
    const baseRootFieldGroupClass = this._super(...arguments);
    return baseRootFieldGroupClass.extend({
      valuesSource: reads('formModel.valuesSource'),
    });
  }),

  /**
   * @override
   * @type {ComputedProperty<FormFieldsRootGroup>}
   */
  rootFieldGroup: computed('rootFieldGroupClass', function rootFieldGroup() {
    const {
      rootFormGroupClass,
      archiveIdField,
      descriptionField,
      configField,
    } = this.getProperties(
      'rootFormGroupClass',
      'archiveIdField',
      'descriptionField',
      'configField',
    );

    const fieldGroup = rootFormGroupClass
      .create({
        formModel: this,
        fields: [
          archiveIdField,
          descriptionField,
          configField,
        ],
      });
    fieldGroup.changeMode('view');
    return fieldGroup;
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

  valuesSource: computed('archive', function valuesSource() {
    const archive = this.get('archive');
    const description = get(archive, 'description');
    const archiveConfig = get(archive, 'config');
    const archiveId = get(archive, 'entityId');
    const formConfig = _.cloneDeep(archiveConfig);

    const incrementalConfig = get(archiveConfig, 'incremental');
    formConfig.incremental = Boolean(
      incrementalConfig &&
      get(incrementalConfig, 'enabled')
    );

    return {
      archiveId,
      description,
      config: formConfig,
    };
  }),

  // FIXME: small input, monospace font
  archiveIdField: computed(function archiveIdField() {
    return ClipboardField.create({
      name: 'archiveId',
      type: 'input',
      size: 'sm',
      clipboardLineClass: 'monospace-font',
    });
  }),
});
