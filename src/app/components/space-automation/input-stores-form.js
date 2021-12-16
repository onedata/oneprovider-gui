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
   * @type {RevisionNumber}
   */
  atmWorkflowSchemaRevisionNumber: undefined,

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
   * @type {ComputedProperty<AtmWorkflowSchemaRevision>}
   */
  atmWorkflowSchemaRevision: computed(
    'atmWorkflowSchema.revisionRegistry',
    'atmWorkflowSchemaRevisionNumber',
    function atmWorkflowSchemaRevision() {
      return this.get(
        `atmWorkflowSchema.revisionRegistry.${this.get('atmWorkflowSchemaRevisionNumber')}`
      );
    }
  ),

  /**
   * @type {ComputedProperty<Array<Object>>}
   */
  inputStores: computed('atmWorkflowSchemaRevision.stores', function inputStores() {
    return (this.get('atmWorkflowSchemaRevision.stores') || [])
      .filterBy('requiresInitialValue');
  }),

  /**
   * Set by `updateDefaultFormValues`
   * @type {Object}
   */
  defaultFormValuesProxy: promise.object(computed(
    'inputStores.[]',
    'localStorageData',
    async function defaultFormValuesProxy() {
      const {
        inputStores,
        localStorageData,
      } = this.getProperties('inputStores', 'localStorageData');

      return await inputStoresToFormData(
        inputStores,
        (...args) => this.getFileRecord(...args),
        localStorageData
      );
    }
  )),

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
      useSelectionPossibilitesCount: array.length(
        array.filterBy('fields', raw('storeHasUseSelectionInputMethod'))
      ),
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
          activeEditorField: array.findBy('fields', raw('name'), 'activeEditor'),
          afterComponentName: conditional(
            'storeHasUseSelectionInputMethod',
            raw('space-automation/input-stores-form/use-selection-button'),
            raw(undefined)
          ),
          storeHasUseSelectionInputMethod: reads('value.storeHasUseSelectionInputMethod'),
          storeUseSelectionData: reads('value.storeUseSelectionData'),
          hasValueEqualToValueFromSelection: computed(
            'storeHasUseSelectionInputMethod',
            'storeUseSelectionData',
            'activeEditorField.value',
            function hasValueEqualToValueFromSelection() {
              const {
                storeHasUseSelectionInputMethod,
                storeUseSelectionData,
                activeEditorField,
              } = this.getProperties(
                'storeHasUseSelectionInputMethod',
                'storeUseSelectionData',
                'activeEditorField'
              );
              if (!storeHasUseSelectionInputMethod) {
                return false;
              }
              const {
                name,
                value,
              } = getProperties(activeEditorField, 'name', 'value');
              if (name === 'filesValue') {
                return Array.isArray(value) &&
                  storeUseSelectionData.length === value.length &&
                  storeUseSelectionData.every((elem, idx) =>
                    get(elem, 'entityId') === (get(value[idx], 'entityId'))
                  );
              } else {
                return storeUseSelectionData === value;
              }
            }
          ),
          useValueFromSelection() {
            const {
              activeEditorField,
              storeHasUseSelectionInputMethod,
              storeUseSelectionData,
            } = this.getProperties(
              'activeEditorField',
              'storeHasUseSelectionInputMethod',
              'storeUseSelectionData'
            );
            if (storeHasUseSelectionInputMethod) {
              activeEditorField.valueChanged(storeUseSelectionData);
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
              isClearButtonVisible: true,
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
    function defaultFormValuesProxyObserver() {
      if (this.get('defaultFormValuesProxy.isFulfilled')) {
        this.get('fields').reset();
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.loadDataFromLocalStorage();
    this.defaultFormValuesProxyObserver();
  },

  loadDataFromLocalStorage() {
    const {
      _localStorage,
      atmWorkflowSchema,
      atmWorkflowSchemaRevisionNumber,
      loadValuesFromLocalStorage,
    } = this.getProperties(
      '_localStorage',
      'atmWorkflowSchema',
      'atmWorkflowSchemaRevisionNumber',
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

        if (data && (
            data.atmWorkflowSchemaId !== atmWorkflowSchemaId ||
            data.atmWorkflowSchemaRevisionNumber !== atmWorkflowSchemaRevisionNumber
          )) {
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

    const stores = this.get('atmWorkflowSchemaRevision.stores') || [];

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

async function inputStoresToFormData(inputStores, getFileRecord, localStorageData) {
  const inputStoresFormValues = {
    __fieldsValueNames: [],
  };
  const formValues = {
    inputStores: inputStoresFormValues,
  };

  if (!inputStores || !inputStores.length) {
    return formValues;
  }

  const inputStoresForSelection = inputStores
    .filter(inputStore => hasUseSelectionInputMethod(inputStore, localStorageData));

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
    const { data: editorValue } = await storeValueToFormValue(
      type,
      dataSpec,
      defaultInitialValue,
      getFileRecord
    );
    const storeHasUseSelectionInputMethod =
      inputStoresForSelection.includes(inputStore);
    let storeUseSelectionData;
    let storeUseSelectionDataCount;
    if (storeHasUseSelectionInputMethod) {
      const rawUseSelectionData = get(localStorageData || {}, 'inputStoresData.data');
      if (rawUseSelectionData) {
        const {
          data,
          count,
        } = await storeValueToFormValue(
          type,
          dataSpec,
          rawUseSelectionData,
          getFileRecord
        );
        storeUseSelectionData = data;
        storeUseSelectionDataCount = count;
      }
    }
    const isOnlyStoreForSelection = storeUseSelectionData &&
      inputStoresForSelection.length === 1;

    const inputStoreFormValues = {
      storeId: id,
      storeName: name,
      storeDescription: description,
      storeType: type,
      storeDataSpec: dataSpec,
      storeHasUseSelectionInputMethod,
      storeUseSelectionData,
      storeUseSelectionDataCount,
      [editor]: isOnlyStoreForSelection ?
        storeUseSelectionData : editorValue,
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
      // return ['file', 'dataset', 'archive'].includes(dataSpecType) ?
      //   'filesValue' : 'rawValue';
      return ['file', 'dataset'].includes(dataSpecType) ?
        'filesValue' : 'rawValue';
    case 'treeForest':
      return 'filesValue';
    case 'auditLog':
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
      return validateStoreElement(initialValue, type, dataSpec);
    case 'list':
    case 'auditLog':
      // TODO: VFS-7816 uncomment or remove future code
      // case 'histogram':
      return Array.isArray(initialValue) &&
        initialValue.every(element => validateStoreElement(element, type, dataSpec));
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

function validateStoreElement(element, storeType, dataSpec) {
  let normalizedElement = element;
  if (storeType === 'auditLog') {
    if (typeof element === 'object') {
      if (!element) {
        return false;
      } else if ('entry' in element) {
        normalizedElement = element.entry;
      } else {
        // element can have field `severity`, but it should not break further validations
        normalizedElement = element;
      }
    }
  }

  switch (dataSpec && dataSpec.type) {
    case 'integer':
      return Number.isInteger(normalizedElement);
    case 'string':
      return typeof normalizedElement === 'string';
    case 'object':
      return typeof normalizedElement === 'object' &&
        normalizedElement !== null &&
        !Array.isArray(normalizedElement);
    case 'histogram':
      // Format of histograms is not known yet. For now both arrays and objects are valid.
      return typeof normalizedElement === 'object' && normalizedElement !== null;
      // TODO: VFS-7816 uncomment or remove future code
      // case 'archive':
    case 'file':
    case 'dataset': {
      const idValue = normalizedElement &&
        normalizedElement[getIdFieldNameForDataSpec(dataSpec)];
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
  let valuesCount;
  if (editor === 'rawValue') {
    const valueIsNone = editorValue === null || editorValue === undefined;
    if (storeType === 'singleValue' && Array.isArray(value)) {
      editorValue = value[0];
    } else if (storeType !== 'singleValue' && !Array.isArray(value) && !valueIsNone) {
      editorValue = [value];
    }
    valuesCount = Array.isArray(editorValue) ? editorValue.length : 1;
    editorValue = valueIsNone ?
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
    valuesCount = editorValue.length;
  }
  return {
    data: editorValue,
    count: valuesCount,
  };
}

function hasUseSelectionInputMethod(inputStore, localStorageData) {
  if (!inputStore || !localStorageData) {
    return false;
  }
  const {
    dataSpec,
    data,
  } = getProperties(
    get(localStorageData, 'inputStoresData') || {},
    'dataSpec',
    'data'
  );
  if (!dataSpec || !data || !data.length) {
    return false;
  }

  const requiredDataType = dataSpecToType(dataSpec);
  const targetStoreTypes = getTargetStoreTypesForType(
    requiredDataType.type,
    data.length > 1
  );
  const targetDataTypes = getTargetDataTypesForType(requiredDataType.type);
  const {
    dataSpec: storeDataSpec,
    type: storeType,
  } = getProperties(inputStore, 'dataSpec', 'type');
  const storeDataType = dataSpecToType(storeDataSpec);
  return targetStoreTypes.includes(storeType) &&
    targetDataTypes.includes(storeDataType.type);
}
