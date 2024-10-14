/**
 * Configuration of archive form for viewing existing archive properties.
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get, computed, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import ClipboardField from 'onedata-gui-common/utils/form-component/clipboard-field';
import StaticUserField from 'onedata-gui-common/utils/form-component/static-user-field';
import ArchiveFormBaseModel from 'oneprovider-gui/utils/archive-form/-base-model';
import _ from 'lodash';
import { promise, bool } from 'ember-awesome-macros';
import { htmlSafe } from '@ember/string';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';

const CallbackFieldClass = ClipboardField
  .extend({
    type: 'input',
    isVisible: bool('value'),
  });

export default ArchiveFormBaseModel.extend({
  archiveManager: service(),
  i18n: service(),

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
    return configIncrementalFieldClass.create();
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
  rootFieldGroup: destroyableComputed('rootFieldGroupClass', function rootFieldGroup() {
    const {
      creatorField,
      rootFormGroupClass,
      archiveIdField,
      descriptionField,
      configField,
      preservedCallbackField,
      deletedCallbackField,
    } = this.getProperties(
      'creatorField',
      'rootFormGroupClass',
      'archiveIdField',
      'descriptionField',
      'configField',
      'preservedCallbackField',
      'deletedCallbackField',
    );

    const fieldGroup = rootFormGroupClass
      .create({
        fields: [
          creatorField,
          archiveIdField,
          descriptionField,
          configField,
          preservedCallbackField,
          deletedCallbackField,
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
    if (!archiveIncrementalConfig ||
      !get(archiveIncrementalConfig, 'enabled') ||
      !get(archiveIncrementalConfig, 'basedOn')
    ) {
      return null;
    }
    const baseArchiveId = archive.relationEntityId('baseArchive');
    if (!baseArchiveId) {
      return null;
    }
    return await archiveManager.getBrowsableArchive(baseArchiveId);
  })),

  /**
   * @override
   */
  baseArchiveTextProxy: promise.object(computed(
    'archive',
    'baseArchiveProxy',
    async function baseArchiveTextProxy() {
      const {
        archive,
        baseArchiveProxy,
      } = this.getProperties(
        'archive',
        'baseArchiveProxy',
      );
      const baseArchiveId = archive && archive.relationEntityId('baseArchive');
      try {
        const baseArchive = await baseArchiveProxy;
        return baseArchive && get(baseArchive, 'name') || '–';
      } catch (error) {
        if (
          error &&
          error.id === 'notFound'
        ) {
          // HTML without new lines to avoid whitespaces
          const htmlValue = `
            <code class="base-archive-id-container"><strong>${this.t('baseArchiveId')}:</strong>&nbsp;<span class="base-archive-id">${baseArchiveId}</span></code>
            <span class="text-muted base-archive-deleted">(${this.t('baseArchiveDeleted')})</span>
          `;
          return htmlSafe(htmlValue);
        } else {
          throw error;
        }
      }
    }
  )),

  creatorField: computed(function creatorField() {
    return StaticUserField.create({
      name: 'creator',
    });
  }),

  valuesSource: computed('archive', function valuesSource() {
    const archive = this.get('archive');
    const {
      description,
      creator,
      config: archiveConfig,
      entityId: archiveId,
      preservedCallback,
      deletedCallback,
    } = getProperties(
      archive,
      'description',
      'creator',
      'config',
      'entityId',
      'preservedCallback',
      'deletedCallback',
    );
    const formConfig = _.cloneDeep(archiveConfig);

    const incrementalConfig = get(archiveConfig, 'incremental');
    formConfig.incremental = Boolean(
      incrementalConfig &&
      get(incrementalConfig, 'enabled')
    );

    return {
      archiveId,
      description,
      creator,
      config: formConfig,
      preservedCallback,
      deletedCallback,
    };
  }),

  archiveIdField: computed(function archiveIdField() {
    return ClipboardField.create({
      name: 'archiveId',
      type: 'input',
      fieldStyle: 'monospace',
    });
  }),

  preservedCallbackField: computed(function preservedCallbackField() {
    return CallbackFieldClass.create({
      name: 'preservedCallback',
    });
  }),

  deletedCallbackField: computed(function deletedCallbackField() {
    return CallbackFieldClass.create({
      name: 'deletedCallback',
    });
  }),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
    this.rootFieldGroup.useCurrentValueAsDefault();
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
