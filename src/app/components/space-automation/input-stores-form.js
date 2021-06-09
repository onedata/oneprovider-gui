import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import FormFieldsCollectionGroup from 'onedata-gui-common/utils/form-component/form-fields-collection-group';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import JsonField from 'onedata-gui-common/utils/form-component/json-field';
import { tag, not, getBy, eq, raw } from 'ember-awesome-macros';
import { computed, observer, get, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { validator } from 'ember-cp-validations';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { scheduleOnce } from '@ember/runloop';

export default Component.extend(I18n, {
  classNames: ['input-stores-form'],
  classNameBindings: ['isDisabled:form-disabled:form-enabled'],

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
   * Set by `updateDefaultFormValues`
   * @type {Object}
   */
  defaultFormValues: computed('atmWorkflowSchema', function defaultFormValues() {
    return atmWorkflowSchemaToFormData(this.get('atmWorkflowSchema'));
  }),

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
    return FormFieldsCollectionGroup.extend({
      defaultValue: getBy('component', tag `defaultFormValues.${'path'}`),
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
            JsonField.extend({
              isVisible: eq('parent.activeEditor', raw('filesValue')),
            }).create({
              name: 'filesValue',
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
    });
  }),

  atmWorkflowSchemaObserver: observer(
    'atmWorkflowSchema',
    function atmWorkflowSchemaObserver() {
      this.get('fields').reset();
    }
  ),

  init() {
    this._super(...arguments);
    this.atmWorkflowSchemaObserver();
  },

  notifyAboutChange() {
    const {
      onChange,
      fields,
    } = this.getProperties('onChange', 'fields');

    const stores = this.get('atmWorkflowSchema.stores') || [];

    onChange({
      data: {
        stores: formDataToInputStoresValues(fields.dumpValue(), stores),
      },
      isValid: get(fields, 'isValid'),
    });
  },
});

function atmWorkflowSchemaToFormData(atmWorkflowSchema) {
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
  inputStores.forEach((inputStore, idx) => {
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
      const idValue = element && element[`${dataSpec.type}Id`];
      return idValue && typeof idValue === 'string';
    }
    default:
      return true;
  }
}

function formDataToInputStoresValues(formData, stores) {
  const inputStores = get(formData, 'inputStores') || {};
  const storeValues = [];
  (get(inputStores, '__fieldsValueNames') || []).forEach((valueName, idx) => {
    const inputStore = get(inputStores, valueName);
    const storeSpec = stores[idx];
    if (!inputStore || !storeSpec) {
      return;
    }

    const {
      name,
      type,
      dataSpec,
    } = getProperties(storeSpec, 'name', 'type', 'dataSpec');

    const editor = getValueEditorForStoreType(type, dataSpec);
    let initialValue;
    if (editor === 'rawValue') {
      try {
        initialValue = JSON.parse(get(inputStore, editor));
      } catch (e) {
        return;
      }
    } else {
      initialValue = get(inputStore, editor);
    }

    storeValues.push({
      name,
      initialValue,
    });
  });

  return storeValues;
}
