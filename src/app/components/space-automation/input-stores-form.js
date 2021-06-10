import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import FormFieldsCollectionGroup from 'onedata-gui-common/utils/form-component/form-fields-collection-group';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import JsonField from 'onedata-gui-common/utils/form-component/json-field';
import TagsField from 'onedata-gui-common/utils/form-component/tags-field';
import { tag, not, getBy, eq, raw, promise, conditional } from 'ember-awesome-macros';
import EmberObject, { computed, observer, get, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { validator } from 'ember-cp-validations';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { scheduleOnce } from '@ember/runloop';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import guidToCdmiObjectId from 'oneprovider-gui/utils/guid-to-cdmi-object-id';
import cdmiObjectIdToGuid from 'onedata-gui-common/utils/cdmi-object-id-to-guid';
import { resolve, all as allFulfilled } from 'rsvp';
import { dateFormat } from 'onedata-gui-common/helpers/date-format';

const FileTag = EmberObject.extend(I18n, OwnerInjector, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.inputStoresForm.fileTag',

  /**
   * @type {Models.File|Models.Dataset|Models.Archive}
   */
  value: undefined,

  /**
   * @type {ComputedProperty<String>}
   */
  label: computed('value.{name,creationTime}', function label() {
    if (this.get('value.constructor.modelName') === 'archive') {
      return dateFormat([this.get('value.creationTime')], { format: 'dateWithMinutes' });
    }
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
  archiveManager: service(),

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
   * @virtual
   * @type {Function}
   * @param {Object} fileBrowserConstraints
   *   ```
   *   {
   *     type: String, // one of `'file'`, `'dataset'`, `'archive'`
   *     allowedFileTypes: Array<String>|undefined, // meaningful when
   *       // `type` is `'file'`. Should be an array of values:
   *       // `'regular'`, `'directory'`. If undefined, then all types
   *       // of files are allowed.
   *     limit: Number|undefined, // maximum number of items, that can be selected.
   *       // If undefined, then there is no upper limit.
   *   }
   *   ```
   * @returns {Promise} resolves with an array of selected files, rejects when
   *   user cancel selection process.
   */
  onSelectFiles: notImplementedReject,

  /**
   * ```
   * {
   *   promise: Promise, // promise returned from `onSelectFiles`
   *   onTagsAddedCallback: Function, // callback received from tags-field
   *   onEndTagCreationCallback: Function, // callback received from tags-field
   * }
   * ```
   * Is undefined if there is not active files selection process.
   * @type {Object|undefined}
   */
  activeFilesSelectionProcess: undefined,

  /**
   * Set by `updateDefaultFormValues`
   * @type {Object}
   */
  defaultFormValuesProxy: promise.object(
    computed('atmWorkflowSchema', async function defaultFormValues() {
      const {
        atmWorkflowSchema,
        fileManager,
        datasetManager,
        archiveManager,
      } = this.getProperties(
        'atmWorkflowSchema',
        'fileManager',
        'datasetManager',
        'archiveManager'
      );
      return await atmWorkflowSchemaToFormData(atmWorkflowSchema, {
        fileManager,
        datasetManager,
        archiveManager,
      });
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
        }).create({
          name: 'inputStore',
          valueName: uniqueFieldValueName,
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
                'parent.value.storeDataSpec',
                function tagEditorSettings() {
                  const storeDataSpec = this.get('parent.value.storeDataSpec');
                  return {
                    startTagCreationCallback: (...args) =>
                      component.startFilesSelection(storeDataSpec, ...args),
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
        this.get('fields').reset();
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.defaultFormValuesProxyObserver();
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

  startFilesSelection(dataSpec, {
    onTagsAddedCallback,
    onEndTagCreationCallback,
    tagsLimit,
  }) {
    const {
      activeFilesSelectionProcess,
      onSelectFiles,
    } = this.getProperties('activeFilesSelectionProcess', 'onSelectFiles');

    if (activeFilesSelectionProcess) {
      this.endFilesSelection();
    }

    const type = dataSpec && dataSpec.type;
    if (!onSelectFiles || !['file', 'dataset', 'archive'].includes(type)) {
      return;
    }

    const filesSelectionSpec = {
      type,
      limit: tagsLimit,
    };

    if (type === 'file') {
      const fileType = get(dataSpec, 'valueConstraints.fileType');
      let allowedFileType;
      switch (fileType) {
        case 'REG':
          allowedFileType = 'regular';
          break;
        case 'DIR':
          allowedFileType = 'directory';
          break;
      }
      if (allowedFileType) {
        filesSelectionSpec.allowedFileTypes = [allowedFileType];
      }
    }

    const selectionPromise = onSelectFiles(filesSelectionSpec);
    selectionPromise.then(selectedFiles => safeExec(this, () => {
      const activeSelectionPromise = this.get('activeFilesSelectionProcess.promise');
      if (activeSelectionPromise === selectionPromise) {
        const newTags = (selectedFiles || []).map(file =>
          FileTag.create({ value: file, ownerSource: this })
        );
        onTagsAddedCallback(newTags);
      }
    })).finally(() => safeExec(this, () => {
      const activeSelectionPromise = this.get('activeFilesSelectionProcess.promise');
      if (activeSelectionPromise === selectionPromise) {
        this.endFilesSelection();
      }
    }));

    this.set('activeFilesSelectionProcess', {
      promise: selectionPromise,
      onTagsAddedCallback,
      onEndTagCreationCallback,
    });
  },

  endFilesSelection() {
    const onEndTagCreationCallback =
      this.get('activeFilesSelectionProcess.onEndTagCreationCallback');
    onEndTagCreationCallback && onEndTagCreationCallback();
    this.set('activeFilesSelectionProcess', undefined);
  },
});

async function atmWorkflowSchemaToFormData(atmWorkflowSchema, managerServices) {
  const inputStoresFormValues = {
    __fieldsValueNames: [],
  };
  const formValues = {
    inputStores: inputStoresFormValues,
  };

  if (!atmWorkflowSchema) {
    return formValues;
  }

  const inputStores = (get(atmWorkflowSchema, 'stores') || [])
    .filterBy('requiresInitialValue');

  if (!inputStores.length) {
    return formValues;
  }
  const storePromises = inputStores.map(async (inputStore, idx) => {
    if (!inputStore) {
      return;
    }

    const valueName = `inputStore${idx}`;
    inputStoresFormValues.__fieldsValueNames.push(valueName);

    const {
      name,
      description,
      type,
      dataSpec,
      defaultInitialValue,
    } = getProperties(
      inputStore,
      'name',
      'description',
      'type',
      'dataSpec',
      'defaultInitialValue',
    );

    const editor = getValueEditorForStoreType(type, dataSpec);
    let editorValue = defaultInitialValue;
    if (editor === 'rawValue' && editorValue !== undefined) {
      editorValue = JSON.stringify(editorValue, null, 2);
    } else if (editor === 'filesValue') {
      const modelName = dataSpec && dataSpec.type;
      if (editorValue && ['file', 'dataset', 'archive'].includes(modelName)) {
        editorValue = (await allFulfilled(
          defaultInitialValue.mapBy('id').compact().map(id =>
            getFileRecord(modelName, id, managerServices)
          )
        )).compact();
      } else {
        editorValue = [];
      }
    }

    const inputStoreFormValues = {
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
    case 'auditLog':
      return ['file', 'dataset', 'archive'].includes(dataSpecType) ?
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
    case 'histogram':
    case 'auditLog':
      return Array.isArray(initialValue) &&
        initialValue.every(element => validateStoreElement(element, dataSpec));
    case 'map':
      return typeof initialValue === 'object' &&
        initialValue !== null &&
        !Array.isArray(initialValue) &&
        Object.values(initialValue)
        .every(element => validateStoreElement(element, dataSpec));
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
    case 'file':
    case 'dataset':
    case 'archive': {
      const idValue = element && element.id;
      return idValue && typeof idValue === 'string';
    }
    default:
      return true;
  }
}

function formDataToInputStoresValues(formData, stores) {
  const inputStores = get(formData, 'inputStores') || {};
  const storeValues = {};
  (get(inputStores, '__fieldsValueNames') || []).forEach((valueName, idx) => {
    const inputStore = get(inputStores, valueName);
    const storeSpec = stores[idx];
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
      initialValue = (get(inputStore, editor) || [])
        .map(item => ({ id: get(item, 'entityId') }));
      if (type === 'singleValue') {
        initialValue = initialValue[0];
      }
    }

    storeValues[id] = initialValue;
  });

  return storeValues;
}

async function getFileRecord(modelName, id, {
  fileManager,
  datasetManager,
  archiveManager,
}) {
  switch (modelName) {
    case 'file': {
      const entityId = cdmiObjectIdToGuid(id);
      return fileManager.getFileById(cdmiObjectIdToGuid(id))
        .catch(() => ({ entityId }));
    }
    case 'dataset':
      return datasetManager.getDataset(id).catch(() => ({ entityId: id }));
    case 'archive':
      return archiveManager.getArchive(id).catch(() => ({ entityId: id }));
    default:
      return resolve(null);
  }
}
