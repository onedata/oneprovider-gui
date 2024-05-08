/**
 * Gathers user input to fill in workflow input stores.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import FormFieldsCollectionGroup from 'onedata-gui-common/utils/form-component/form-fields-collection-group';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import HiddenField from 'onedata-gui-common/utils/form-component/hidden-field';
import { tag, not, getBy, raw, conditional, array } from 'ember-awesome-macros';
import { computed, observer, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import FilesystemModel from 'oneprovider-gui/utils/items-select-browser/filesystem-model';
import DatasetModel from 'oneprovider-gui/utils/items-select-browser/dataset-model';
import { normalizedFileTypes } from 'onedata-gui-websocket-client/transforms/file-type';
import { getDataSpecForStoreDefaultValue } from 'onedata-gui-common/utils/atm-workflow/store-config';
import {
  ValueEditorField as AtmValueEditorField,
  rawValueToFormValue as atmRawValueToFormValue,
  formValueToRawValue as atmFormValueToRawValue,
} from 'onedata-gui-common/utils/atm-workflow/value-editors';
import _ from 'lodash';
import ExecutionDataFetcher from 'oneprovider-gui/utils/workflow-visualiser/execution-data-fetcher';
import { isAtmDataSpecMatchingFilters } from 'onedata-gui-common/utils/atm-workflow/data-spec/filters';
import { AtmDataSpecType } from 'onedata-gui-common/utils/atm-workflow/data-spec/types';
import globals from 'onedata-gui-common/utils/globals';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

export const executeWorkflowDataLocalStorageKey = 'executeWorkflowInputData';

export default Component.extend(I18n, {
  classNames: ['input-stores-form'],
  classNameBindings: ['isDisabled:form-disabled:form-enabled'],

  i18n: service(),
  spaceManager: service(),
  modalManager: service(),

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
   *   selectorModel: Utils.ItemsSelectBrowser.FilesystemModel|Utils.ItemsSelectBrowser.DatasetModel,
   *   atmStore: Object,
   *   onSelected: Function,
   *   onCancelled: Function,
   * }
   * ```
   * Is undefined if there is not active files selection process.
   * @type {Object|null}
   */
  itemsSelectionProcess: null,

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
      .filterBy('requiresInitialContent');
  }),

  /**
   * Set by `updateDefaultFormValues`
   * @type {Object}
   */
  defaultFormValues: computed(
    'inputStores.[]',
    'localStorageData',
    function defaultFormValues() {
      const {
        inputStores,
        localStorageData,
      } = this.getProperties('inputStores', 'localStorageData');

      return inputStoresToFormData(
        inputStores,
        localStorageData
      );
    }
  ),

  /**
   * @type {ComputedProperty<Utils.FormComponent.FormFieldsRootGroup>}
   */
  fields: computed(function fields() {
    return FormFieldsRootGroup.extend({
      i18nPrefix: tag `${'component.i18nPrefix'}.fields`,
      ownerSource: reads('component'),
      isEnabled: not('component.isDisabled'),
      onValueChange() {
        this._super(...arguments);
        scheduleOnce('afterRender', this.component, 'notifyAboutChange');
      },
    }).create({
      component: this,
      fields: [
        this.inputStoresFieldsCollectionGroup,
      ],
    });
  }),

  /**
   * @type {ComputedProperty<Utils.FormComponent.FormFieldsCollectionGroup>}
   */
  inputStoresFieldsCollectionGroup: computed(function inputStoresFieldsCollectionGroup() {
    const component = this;
    return FormFieldsCollectionGroup.extend({
      defaultValue: getBy('component', tag `defaultFormValues.${'path'}`),
      useSelectionPossibilitesCount: array.length(
        array.filterBy('fields', raw('storeUseSelectionData'))
      ),
      fieldFactoryMethod(uniqueFieldValueName) {
        return FormFieldsGroup.extend({
          context: reads('value.context'),
          label: reads('context.atmStore.name'),
          tip: reads('context.atmStore.description'),
          afterComponentName: conditional(
            'storeUseSelectionData',
            raw('space-automation/input-stores-form/use-selection-button'),
            raw(undefined)
          ),
          storeValueField: computed('fields.[]', function storeValueField() {
            return this.fields.find(({ name }) => name === 'storeValue') ?? null;
          }),
          storeUseSelectionData: reads('context.storeUseSelectionData'),
          storeUseSelectionDataCount: computed(
            'storeUseSelectionData.length',
            function storeUseSelectionDataCount() {
              if (!this.storeUseSelectionData) {
                return 0;
              } else if (!Array.isArray(this.storeUseSelectionData)) {
                return 1;
              } else {
                return this.storeUseSelectionData.length;
              }
            }
          ),
          hasValueEqualToValueFromSelection: computed(
            'storeUseSelectionData',
            'value.storeValue',
            function hasValueEqualToValueFromSelection() {
              if (!this.storeUseSelectionData) {
                return false;
              }
              return _.isEqual(
                this.value?.storeValue,
                atmRawValueToFormValue(this.storeUseSelectionData)
              );
            }
          ),
          useValueFromSelection() {
            if (this.context?.storeUseSelectionData) {
              this.storeValueField?.valueChanged(
                atmRawValueToFormValue(this.context.storeUseSelectionData)
              );
            }
          },
        }).create({
          name: 'inputStore',
          valueName: uniqueFieldValueName,
          fields: [
            HiddenField.create({ name: 'context' }),
            AtmValueEditorField.extend({
              atmDataSpec: computed('parent.context.atmStore', function atmDataSpec() {
                const atmStore = this.parent?.context?.atmStore;
                return atmStore ? getDataSpecForStoreDefaultValue(atmStore) : null;
              }),
              editorContext: computed(
                'parent.context.atmStore',
                function editorContext() {
                  const atmStore = this.parent?.context?.atmStore;
                  return atmStore ?
                    component.createAtmValueEditorContext(atmStore) : null;
                }
              ),
            }).create({
              name: 'storeValue',
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

  defaultFormValuesObserver: observer(
    'defaultFormValues',
    function defaultFormValuesObserver() {
      this.fields.reset();
    }
  ),

  init() {
    this._super(...arguments);
    this.loadDataFromLocalStorage();
    this.defaultFormValuesObserver();
  },

  loadDataFromLocalStorage() {
    const atmWorkflowSchemaId = this.get('atmWorkflowSchema.entityId');

    let data = null;
    if (atmWorkflowSchemaId && this.loadValuesFromLocalStorage) {
      const localStorageData =
        globals.localStorage.getItem(executeWorkflowDataLocalStorageKey);
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
            data.atmWorkflowSchemaRevisionNumber !== this.atmWorkflowSchemaRevisionNumber
          )) {
          data = null;
        }
      }
    }

    globals.localStorage.removeItem(executeWorkflowDataLocalStorageKey);
    this.set('localStorageData', data);
  },

  notifyAboutChange() {
    this.onChange?.({
      data: formDataToInputStoresValues(this.fields.dumpValue()),
      isValid: this.fields.isValid,
    });
  },

  /**
   * @param {Object} atmStore
   * @returns {AtmValueEditorContext}
   */
  createAtmValueEditorContext(atmStore) {
    const editorContext = ExecutionDataFetcher.create({
        ownerSource: this,
        spaceId: this.space?.entityId,
      })
      .getStoreContentPresenterContext();
    editorContext.selectFiles = (selectorConfig) => {
      this.startFilesSelection(atmStore, selectorConfig);
    };
    editorContext.selectDatasets = (selectorConfig) => {
      this.startDatasetsSelection(atmStore, selectorConfig);
    };
    editorContext.selectGroups = (selectorConfig) => {
      this.startGroupsSelection(atmStore, selectorConfig);
    };
    return editorContext;
  },

  startFilesSelection(atmStore, {
    atmFileType,
    allowMany,
    onSelected,
    onCancelled,
  }) {
    const constraintSpec = {};
    if (!allowMany) {
      constraintSpec.maxItems = 1;
    }
    if (atmFileType in normalizedFileTypes) {
      constraintSpec.allowedFileTypes = [normalizedFileTypes[atmFileType]];
    }

    const selectorModel = FilesystemModel.create({
      ownerSource: this,
      constraintSpec,
      space: this.space,
    });

    this.startItemsSelection({ atmStore, selectorModel, onSelected, onCancelled });
  },

  startDatasetsSelection(atmStore, {
    allowMany,
    onSelected,
    onCancelled,
  }) {
    const constraintSpec = {};
    if (!allowMany) {
      constraintSpec.maxItems = 1;
    }

    const selectorModel = DatasetModel.create({
      ownerSource: this,
      constraintSpec,
      space: this.space,
    });

    this.startItemsSelection({ atmStore, selectorModel, onSelected, onCancelled });
  },

  async startGroupsSelection(atmStore, {
    allowMany,
    onSelected,
    onCancelled,
  }) {
    let wasSubmitted = false;
    await this.modalManager.show('record-list-selector-modal', {
      recordListContainer: promiseObject(
        this.spaceManager.getSpaceEffGroups(get(this.space, 'entityId'))
      ),
      allowMany,
      header: this.t(`groupSelector.header.${allowMany ? 'multi' : 'single'}`),
      subheader: this.t('itemsSelectorSubheader', { storeName: atmStore.name }),
      listHeader: this.t('groupSelector.listHeader'),
      incompleteListText: this.t('groupSelector.incompleteListText'),
      incompleteListTipText: this.t('groupSelector.incompleteListTipText'),
      onSubmit(selectedRecords) {
        wasSubmitted = true;
        const atmGroups = selectedRecords.map((record) => ({
          groupId: get(record, 'entityId'),
        }));
        onSelected(atmGroups);
      },
    }).hiddenPromise;
    if (!wasSubmitted) {
      onCancelled();
    }
  },

  startItemsSelection({ atmStore, selectorModel, onSelected, onCancelled }) {
    if (this.itemsSelectionProcess) {
      this.cancelItemsSelection();
      return;
    }

    this.set('itemsSelectionProcess', {
      atmStore,
      selectorModel,
      onSelected,
      onCancelled,
    });
  },

  cancelItemsSelection() {
    if (!this.itemsSelectionProcess) {
      return;
    }

    this.itemsSelectionProcess?.onCancelled();
    this.terminateItemsSelectionProcess();
  },

  /**
   * @param {Array<Models.File|Models.Dataset>} items
   * @returns {Array<AtmFile|AtmDataset>}
   */
  convertFilesAndDatasetsToAtmValues(items) {
    return items.map((item) => {
      const record = item?.content ?? item;
      switch (record?.constructor?.modelName) {
        case 'file':
          return {
            fileId: record.cdmiObjectId,
          };
        case 'dataset':
          return {
            datasetId: record.entityId,
          };
        default:
          return null;
      }
    }).filter(Boolean);
  },

  terminateItemsSelectionProcess() {
    this.itemsSelectionProcess?.selectorModel?.destroy();
    this.set('itemsSelectionProcess', null);
  },

  actions: {
    itemsSelected(items) {
      const onSelected = this.itemsSelectionProcess?.onSelected;
      if (!onSelected || !items?.length) {
        return;
      }

      onSelected(this.convertFilesAndDatasetsToAtmValues(items));
      this.terminateItemsSelectionProcess();
    },
    itemsSelectorClose() {
      if (this.itemsSelectionProcess) {
        this.cancelItemsSelection();
      }
    },
  },
});

function inputStoresToFormData(inputStores, localStorageData) {
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

  inputStores.forEach((inputStore) => {
    if (!inputStore) {
      return;
    }

    const valueName = `inputStore${inputStore.id}`;
    inputStoresFormValues.__fieldsValueNames.push(valueName);

    let storeUseSelectionData;
    if (inputStoresForSelection.includes(inputStore)) {
      const rawUseSelectionData = get(localStorageData || {}, 'inputStoresData.data');
      if (rawUseSelectionData) {
        storeUseSelectionData =
          getDataSpecForStoreDefaultValue(inputStore)?.type !== 'array' &&
          Array.isArray(rawUseSelectionData) ?
          rawUseSelectionData[0] : rawUseSelectionData;
      }
    }
    const isOnlyStoreForSelection = storeUseSelectionData &&
      inputStoresForSelection.length === 1;

    const inputStoreFormValues = {
      context: {
        atmStore: inputStore,
        storeUseSelectionData,
      },
      storeValue: atmRawValueToFormValue(
        isOnlyStoreForSelection ?
        storeUseSelectionData : inputStore.defaultInitialContent,
        false,
      ),
    };
    inputStoresFormValues[valueName] = inputStoreFormValues;
  });

  return formValues;
}

function formDataToInputStoresValues(formData) {
  const atmStoreValues = {};
  formData?.inputStores?.__fieldsValueNames?.forEach((fieldValueName) => {
    const formGroupValue = formData.inputStores[fieldValueName];
    const atmStoreSchemaId = formGroupValue?.context?.atmStore?.id;
    if (atmStoreSchemaId) {
      atmStoreValues[atmStoreSchemaId] =
        atmFormValueToRawValue(formGroupValue.storeValue);
    }
  });

  return atmStoreValues;
}

function hasUseSelectionInputMethod(inputStore, localStorageData) {
  const dataSpec = localStorageData?.inputStoresData?.dataSpec;
  const data = localStorageData?.inputStoresData?.data;
  if (!inputStore || !dataSpec || !data?.length) {
    return false;
  }

  const dataSpecInArray = {
    type: AtmDataSpecType.Array,
    itemDataSpec: dataSpec,
  };

  const defaultValueAtmDataSpecFilters = [{
    filterType: 'typeOrSubtype',
    types: [getDataSpecForStoreDefaultValue(inputStore)],
  }];
  return isAtmDataSpecMatchingFilters(dataSpec, defaultValueAtmDataSpecFilters) ||
    isAtmDataSpecMatchingFilters(dataSpecInArray, defaultValueAtmDataSpecFilters);
}
