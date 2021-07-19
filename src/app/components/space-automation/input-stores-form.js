/**
 * Gathers user input to fill in workflow input stores.
 *
 * @module components/space-automation/input-stores-form
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import FormFieldsCollectionGroup from 'onedata-gui-common/utils/form-component/form-fields-collection-group';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import JsonField from 'onedata-gui-common/utils/form-component/json-field';
import TagsField from 'onedata-gui-common/utils/form-component/tags-field';
import { tag, not, getBy, eq, raw, promise, conditional, array } from 'ember-awesome-macros';
import EmberObject, { computed, observer, get, getProperties, set } from '@ember/object';
import { reads } from '@ember/object/computed';
import { validator } from 'ember-cp-validations';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { scheduleOnce } from '@ember/runloop';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import guidToCdmiObjectId from 'oneprovider-gui/utils/guid-to-cdmi-object-id';
import cdmiObjectIdToGuid from 'onedata-gui-common/utils/cdmi-object-id-to-guid';
import { resolve, all as allFulfilled } from 'rsvp';
import FilesystemModel from 'oneprovider-gui/utils/items-select-browser/filesystem-model';
import DatasetModel from 'oneprovider-gui/utils/items-select-browser/dataset-model';
import { normalizedFileTypes } from 'onedata-gui-websocket-client/transforms/file-type';
import {
  getTargetStoreTypesForType,
  getTargetDataTypesForType,
  dataSpecToType,
} from 'onedata-gui-common/utils/workflow-visualiser/data-spec-converters';

export const executeWorkflowDataLocalStorageKey = 'executeWorkflowInputData';

const FileTag = EmberObject.extend(I18n, OwnerInjector, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.inputStoresForm.fileTag',

  /**
   * @type {Models.File|Models.Dataset}
   */
  value: undefined,

  /**
   * @type {ComputedProperty<String>}
   */
  label: computed('value.{name,creationTime}', function label() {
    // TODO: VFS-7816 uncomment or remove future code
    // if (this.get('value.constructor.modelName') === 'archive') {
    //   return dateFormat([this.get('value.creationTime')], { format: 'dateWithMinutes' });
    // }
    const name = this.get('value.name');
    if (!name) {
      return String(this.t('unknownName'));
    }
    return name;
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  tip: computed('value.{modelName,entityId}', function tip() {
    const {
      modelName,
      entityId,
    } = getProperties(this.get('value') || {}, 'modelName', 'entityId');

    if (!modelName || !entityId) {
      return;
    }

    return this.t('idTooltip', {
      id: modelName === 'file' ? guidToCdmiObjectId(entityId) : entityId,
    });
  }),
});

export default Component.extend(I18n, {
  classNames: ['input-stores-form'],
  classNameBindings: ['isDisabled:form-disabled:form-enabled'],

  i18n: service(),
  fileManager: service(),
  datasetManager: service(),
  // TODO: VFS-7816 uncomment or remove future code
  // archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.inputStoresForm',

  /**
   * @virtual
   * @type {Models.AtmWorkflowSchema}
   */
  atmWorkflowSchema: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  loadValuesFromLocalStorage: false,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  isDisabled: false,

  /**
   * @virtual
   * @type {Function}
   * @param {Object} change
   *   ```
   *   {
   *     data: Object, // form data
   *     isValid: Boolean,
   *   }
   *   ```
   */
  onChange: notImplementedIgnore,

  /**
   * ```
   * {
   *   isActive: Boolean,
   *   filesSelectorModel: Utils.ItemsSelectBrowser.FilesystemModel|Utils.ItemsSelectBrowser.DatasetModel,
   *   storeName: String,
   *   onTagsAddedCallback: Function, // callback received from tags-field
   *   onEndTagCreationCallback: Function, // callback received from tags-field
   * }
   * ```
   * Is undefined if there is not active files selection process.
   * @type {Object|undefined}
   */
  filesSelectionProcess: undefined,

  /**
   * @type {Storage}
   */
  _localStorage: localStorage,

  /**
   * @type {any}
   */
  localStorageData: undefined,

  /**
   * @type {ComputedProperty<Array<Object>>}
   */
  inputStores: computed('atmWorkflowSchema.stores', function inputStores() {
    return (this.get('atmWorkflowSchema.stores') || []).filterBy('requiresInitialValue');
  }),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  storeIdsForUseSelectionInputMethod: computed(
    'inputStores.[]',
    'localStorageData',
    function storeIdsForUseSelectionInputMethod() {
      const {
        dataSpec,
        data,
      } = getProperties(
        this.get('localStorageData.inputStoresData') || {},
        'dataSpec',
        'data'
      );
      const inputStores = this.get('inputStores');
      if (!dataSpec || !data || !data.length || !inputStores.length) {
        return [];
      }

      const requiredDataType = dataSpecToType(dataSpec);
      const targetStoreTypes = getTargetStoreTypesForType(
        requiredDataType,
        data.length > 1
      );
      const targetDataTypes = getTargetDataTypesForType(requiredDataType);
      return inputStores.filter(store => {
        const {
          dataSpec: storeDataSpec,
          type: storeType,
        } = getProperties(store, 'dataSpec', 'type');
        const storeDataType = dataSpecToType(storeDataSpec);
        return targetStoreTypes.includes(storeType) &&
          targetDataTypes.includes(storeDataType);
      }).mapBy('id');
    }
  ),

  /**
   * Set by `updateDefaultFormValues`
   * @type {Object}
   */
  defaultFormValuesProxy: promise.object(
    computed('inputStores.[]', async function defaultFormValuesProxy() {
      return await inputStoresToFormData(
        this.get('inputStores'),
        (...args) => this.getFileRecord(...args)
      );
    })
  ),

  /**
   * @type {ComputedProperty<Utils.FormComponent.FormFieldsRootGroup>}
   */
  fields: computed(function fields() {
    const {
      inputStoresFieldsCollectionGroup,
    } = this.getProperties(
      'inputStoresFieldsCollectionGroup'
    );

    return FormFieldsRootGroup.extend({
      i18nPrefix: tag `${'component.i18nPrefix'}.fields`,
      ownerSource: reads('component'),
      isEnabled: not('component.isDisabled'),
      onValueChange() {
        this._super(...arguments);
        scheduleOnce('afterRender', this.get('component'), 'notifyAboutChange');
      },
    }).create({
      component: this,
      fields: [
        inputStoresFieldsCollectionGroup,
      ],
    });
  }),

  /**
   * @type {ComputedProperty<Utils.FormComponent.FormFieldsCollectionGroup>}
   */
  inputStoresFieldsCollectionGroup: computed(function inputStoresFieldsCollectionGroup() {
    const component = this;
    return FormFieldsCollectionGroup.extend({
      defaultValue: getBy('component', tag `defaultFormValuesProxy.content.${'path'}`),
      fieldFactoryMethod(uniqueFieldValueName) {
        return FormFieldsGroup.extend({
          label: reads('value.storeName'),
          tip: reads('value.storeDescription'),
          activeEditor: computed(
            'value.{storeType,storeDataSpec}',
            function activeEditor() {
              const {
                storeType,
                storeDataSpec,
              } = getProperties(this.get('value') || {}, 'storeType', 'storeDataSpec');
              return getValueEditorForStoreType(storeType, storeDataSpec);
            }
          ),
          afterComponentName: conditional(
            array.includes(
              'component.storeIdsForUseSelectionInputMethod',
              'value.storeId'
            ),
            raw('space-automation/input-stores-form/use-selection-button'),
            raw(undefined)
          ),
          async useValueFromSelection() {
            const injectedValue = get(component, 'localStorageData.inputStoresData.data');
            const {
              fields,
              activeEditor,
            } = this.getProperties('fields', 'activeEditor', 'value');
            const {
              storeType,
              storeDataSpec,
            } = getProperties(this.get('value') || {}, 'storeType', 'storeDataSpec');
            const editorField = fields.findBy('name', activeEditor);
            if (injectedValue && editorField) {
              const injectedFormValue = await storeValueToFormValue(
                storeType,
                storeDataSpec,
                injectedValue,
                (...args) => component.getFileRecord(...args)
              );
              editorField.valueChanged(injectedFormValue);
            }
          },
        }).create({
          name: 'inputStore',
          valueName: uniqueFieldValueName,
          component,
          fields: [
            JsonField.extend({
              isVisible: eq('parent.activeEditor', raw('rawValue')),
            }).create({
              name: 'rawValue',
              customValidators: [
                validator(function (value, options, model) {
                  let parsedValue;
                  try {
                    parsedValue = JSON.parse(value);
                  } catch (e) {
                    // If JSON is not valid, then return true. Invalid JSON format
                    // will cause error in default JSON field validator.
                    return true;
                  }
                  const field = get(model, 'field');
                  const storeType = get(field, 'parent.value.storeType');
                  const storeDataSpec = get(field, 'parent.value.storeDataSpec');
                  const isValid =
                    validateStoreInitialValue(parsedValue, storeType, storeDataSpec);
                  return isValid ||
                    String(field.t(`${get(field, 'path')}.errors.badValue`));
                }, {
                  dependentKeys: [
                    'model.field.parent.value.storeType',
                    'model.field.parent.value.storeDataSpec',
                  ],
                }),
              ],
            }),
            TagsField.extend({
              isVisible: eq('parent.activeEditor', raw('filesValue')),
              tagEditorSettings: computed(
                'parent.value.{storeDataSpec,storeName}',
                function tagEditorSettings() {
                  const storeDataSpec = this.get('parent.value.storeDataSpec');
                  const storeName = this.get('parent.value.storeName');
                  return {
                    startTagCreationCallback: (...args) =>
                      component.startFilesSelection(storeName, storeDataSpec, ...args),
                    endTagCreationCallback: () => component.endFilesSelection(),
                  };
                }
              ),
              tagsLimit: conditional(
                eq('parent.value.storeType', raw('singleValue')),
                raw(1),
                raw(undefined)
              ),
            }).create({
              name: 'filesValue',
              tagEditorComponentName: 'tags-input/external-editor',
              valueToTags(value) {
                return (value || []).map(val => FileTag.create({
                  ownerSource: this,
                  value: val,
                }));
              },
              tagsToValue(tags) {
                return tags.mapBy('value').uniqBy('entityId');
              },
            }),
          ],
        });
      },
      dumpDefaultValue() {
        return this.get('defaultValue') || this._super(...arguments);
      },
    }).create({
      component: this,
      name: 'inputStores',
      isCollectionManipulationAllowed: false,
    });
  }),

  defaultFormValuesProxyObserver: observer(
    'defaultFormValuesProxy.isFulfilled',
    function atmWorkflowSchemaObserver() {
      if (this.get('defaultFormValuesProxy.isFulfilled')) {
        const {
          fields,
          storeIdsForUseSelectionInputMethod,
        } = this.getProperties('fields', 'storeIdsForUseSelectionInputMethod');
        fields.reset();

        if (storeIdsForUseSelectionInputMethod.length === 1) {
          const storeId = storeIdsForUseSelectionInputMethod[0];
          const inputStoresFormGroup = fields.getFieldByPath('inputStores');
          if (inputStoresFormGroup) {
            const inputStoreFormGroup = get(inputStoresFormGroup, 'fields')
              .findBy('valueName', `inputStore${storeId}`);
            if (inputStoreFormGroup) {
              inputStoreFormGroup.useValueFromSelection();
            }
          }
        }
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.defaultFormValuesProxyObserver();
    this.loadDataFromLocalStorage();
  },

  loadDataFromLocalStorage() {
    const {
      _localStorage,
      atmWorkflowSchema,
      loadValuesFromLocalStorage,
    } = this.getProperties(
      '_localStorage',
      'atmWorkflowSchema',
      'loadValuesFromLocalStorage'
    );
    const atmWorkflowSchemaId = get(atmWorkflowSchema, 'entityId');

    let data = null;
    if (atmWorkflowSchemaId && loadValuesFromLocalStorage) {
      const localStorageData = _localStorage.getItem(executeWorkflowDataLocalStorageKey);
      if (localStorageData) {
        try {
          data = JSON.parse(localStorageData);
        } catch (error) {
          console.error(
            `Cannot read ${executeWorkflowDataLocalStorageKey} data from localStorage`,
            error
          );
        }

        if (data && data.atmWorkflowSchemaId !== atmWorkflowSchemaId) {
          data = null;
        }
      }
    }

    _localStorage.removeItem(executeWorkflowDataLocalStorageKey);
    this.set('localStorageData', data);
  },

  notifyAboutChange() {
    const {
      onChange,
      fields,
    } = this.getProperties('onChange', 'fields');

    const stores = this.get('atmWorkflowSchema.stores') || [];

    onChange({
      data: formDataToInputStoresValues(fields.dumpValue(), stores),
      isValid: get(fields, 'isValid'),
    });
  },

  async getFileRecord(modelName, id) {
    const {
      fileManager,
      datasetManager,
    } = this.getProperties('fileManager', 'datasetManager');
    switch (modelName) {
      case 'file': {
        const entityId = cdmiObjectIdToGuid(id);
        return fileManager.getFileById(cdmiObjectIdToGuid(id))
          .catch(() => ({ entityId }));
      }
      case 'dataset':
        return datasetManager.getDataset(id).catch(() => ({ entityId: id }));
        // TODO: VFS-7816 uncomment or remove future code
        // case 'archive':
        //   return archiveManager.getArchive(id).catch(() => ({ entityId: id }));
      default:
        return resolve(null);
    }
  },

  startFilesSelection(storeName, storeDataSpec, {
    onTagsAddedCallback,
    onEndTagCreationCallback,
    tagsLimit,
  }) {
    const space = this.get('space');
    if (this.get('filesSelectionProcess.isActive')) {
      this.endFilesSelection();
      onEndTagCreationCallback && onEndTagCreationCallback();
      return;
    }

    const type = storeDataSpec && storeDataSpec.type;
    // TODO: VFS-7816 uncomment or remove future code
    // if (!['file', 'dataset', 'archive'].includes(type)) {
    if (!['file', 'dataset'].includes(type)) {
      return;
    }

    const constraintSpec = {
      maxItems: tagsLimit,
    };

    let filesSelectorModel;
    switch (type) {
      case 'file': {
        const fileType = get(storeDataSpec, 'valueConstraints.fileType');
        if (fileType in normalizedFileTypes) {
          constraintSpec.allowedFileTypes = [normalizedFileTypes[fileType]];
        }
        filesSelectorModel = FilesystemModel.create({
          ownerSource: this,
          constraintSpec,
          space,
        });
        break;
      }
      case 'dataset':
        filesSelectorModel = DatasetModel.create({
          ownerSource: this,
          constraintSpec,
          space,
        });
        break;
      default:
        return;
    }

    this.set('filesSelectionProcess', {
      isActive: true,
      filesSelectorModel,
      storeName,
      onTagsAddedCallback,
      onEndTagCreationCallback,
    });
  },

  endFilesSelection() {
    const filesSelectionProcess = this.get('filesSelectionProcess');
    if (!filesSelectionProcess) {
      return;
    }

    set(filesSelectionProcess, 'isActive', false);
    const onEndTagCreationCallback =
      get(filesSelectionProcess, 'onEndTagCreationCallback');
    onEndTagCreationCallback && onEndTagCreationCallback();
  },

  actions: {
    filesSelected(files) {
      const onTagsAddedCallback =
        this.get('filesSelectionProcess.onTagsAddedCallback');

      if (!onTagsAddedCallback || !files || !files.length) {
        return;
      }

      onTagsAddedCallback(files.map(file => FileTag.create({
        ownerSource: this,
        value: file,
      })));
    },
    filesSelectorClose() {
      this.endFilesSelection();
    },
  },
});

async function inputStoresToFormData(inputStores, getFileRecord) {
  const inputStoresFormValues = {
    __fieldsValueNames: [],
  };
  const formValues = {
    inputStores: inputStoresFormValues,
  };

  if (!inputStores || !inputStores.length) {
    return formValues;
  }

  const storePromises = inputStores.map(async inputStore => {
    if (!inputStore) {
      return;
    }

    const {
      id,
      name,
      description,
      type,
      dataSpec,
      defaultInitialValue,
    } = getProperties(
      inputStore,
      'id',
      'name',
      'description',
      'type',
      'dataSpec',
      'defaultInitialValue',
    );

    const valueName = `inputStore${id}`;
    inputStoresFormValues.__fieldsValueNames.push(valueName);

    const editor = getValueEditorForStoreType(type, dataSpec);
    const editorValue = await storeValueToFormValue(
      type,
      dataSpec,
      defaultInitialValue,
      getFileRecord
    );

    const inputStoreFormValues = {
      storeId: id,
      storeName: name,
      storeDescription: description,
      storeType: type,
      storeDataSpec: dataSpec,
      [editor]: editorValue,
    };
    inputStoresFormValues[valueName] = inputStoreFormValues;
  });

  await allFulfilled(storePromises);
  return formValues;
}

function getValueEditorForStoreType(type, dataSpec) {
  const dataSpecType = dataSpec && dataSpec.type;
  switch (type) {
    case 'singleValue':
    case 'list':
      // TODO: VFS-7816 uncomment or remove future code
      // case 'auditLog':
      // return ['file', 'dataset', 'archive'].includes(dataSpecType) ?
      //   'filesValue' : 'rawValue';
      return ['file', 'dataset'].includes(dataSpecType) ?
        'filesValue' : 'rawValue';
    case 'treeForest':
      return 'filesValue';
    default:
      return 'rawValue';
  }
}

function validateStoreInitialValue(initialValue, type, dataSpec) {
  if (getValueEditorForStoreType(type, dataSpec) !== 'rawValue') {
    // Only raw JSONs entered by user are validated
    return true;
  }

  switch (type) {
    case 'singleValue':
      return validateStoreElement(initialValue, dataSpec);
    case 'list':
      // TODO: VFS-7816 uncomment or remove future code
      // case 'histogram':
      // case 'auditLog':
      return Array.isArray(initialValue) &&
        initialValue.every(element => validateStoreElement(element, dataSpec));
      // TODO: VFS-7816 uncomment or remove future code
      // case 'map':
      //   return typeof initialValue === 'object' &&
      //     initialValue !== null &&
      //     !Array.isArray(initialValue) &&
      //     Object.values(initialValue)
      //     .every(element => validateStoreElement(element, dataSpec));
    default:
      return true;
  }
}

function validateStoreElement(element, dataSpec) {
  switch (dataSpec && dataSpec.type) {
    case 'integer':
      return Number.isInteger(element);
    case 'string':
      return typeof element === 'string';
    case 'object':
      return typeof element === 'object' && element !== null && !Array.isArray(element);
    case 'histogram':
      // Format of histograms is not known yet. For now both arrays and objects are valid.
      return typeof element === 'object' && element !== null;
      // TODO: VFS-7816 uncomment or remove future code
      // case 'archive':
    case 'file':
    case 'dataset': {
      const idValue = element && element[getIdFieldNameForDataSpec(dataSpec)];
      return idValue && typeof idValue === 'string';
    }
    default:
      return true;
  }
}

function formDataToInputStoresValues(formData, stores) {
  const inputStores = get(formData, 'inputStores') || {};
  const inputStoresSpecs = (stores || []).filterBy('requiresInitialValue');
  const storeValues = {};
  (get(inputStores, '__fieldsValueNames') || []).forEach((valueName, idx) => {
    const inputStore = get(inputStores, valueName);
    const storeSpec = inputStoresSpecs[idx];
    if (!inputStore || !storeSpec) {
      return;
    }

    const {
      id,
      type,
      dataSpec,
    } = getProperties(storeSpec, 'id', 'type', 'dataSpec');

    const editor = getValueEditorForStoreType(type, dataSpec);
    let initialValue;
    if (editor === 'rawValue') {
      try {
        initialValue = JSON.parse(get(inputStore, editor));
      } catch (e) {
        return;
      }
    } else {
      const idFieldName = getIdFieldNameForDataSpec(dataSpec);
      const transformId = dataSpec && dataSpec.type === 'file' ?
        (id => guidToCdmiObjectId(id)) : (id => id);
      initialValue = (get(inputStore, editor) || []).map(item => ({
        [idFieldName]: transformId(get(item, 'entityId')),
      }));
      if (type === 'singleValue') {
        initialValue = initialValue[0];
      }
    }

    storeValues[id] = initialValue;
  });

  return storeValues;
}

function getIdFieldNameForDataSpec(dataSpec) {
  switch (dataSpec && dataSpec.type) {
    case 'file':
      return 'file_id';
    case 'dataset':
      return 'datasetId';
      // TODO: VFS-7816 uncomment or remove future code
      // case 'archive':
      //   return 'archiveId';
  }
}

async function storeValueToFormValue(storeType, dataSpec, value, getFileRecord) {
  const editor = getValueEditorForStoreType(storeType, dataSpec);
  let editorValue = value;
  if (editor === 'rawValue') {
    editorValue = [null, undefined].includes(editorValue) ?
      '' : JSON.stringify(editorValue, null, 2);
  } else if (editor === 'filesValue') {
    const modelName = dataSpec && dataSpec.type;
    // TODO: VFS-7816 uncomment or remove future code
    // if (editorValue && ['file', 'dataset', 'archive'].includes(modelName)) {
    if (editorValue && ['file', 'dataset'].includes(modelName)) {
      const idFieldName = getIdFieldNameForDataSpec(dataSpec);
      editorValue = (await allFulfilled(
        editorValue.mapBy(idFieldName).compact().map(id =>
          getFileRecord(modelName, id)
        )
      )).compact();
    } else {
      editorValue = [];
    }
  }
  return editorValue;
}
