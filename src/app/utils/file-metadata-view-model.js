import EmberObject, { computed, get, defineProperty } from '@ember/object';
import { reads } from '@ember/object/computed';
import { or, eq, raw, conditional, bool } from 'ember-awesome-macros';
import _ from 'lodash';
import { camelize, capitalize } from '@ember/string';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

/**
 * @typedef {'xattrs'|'json'|'rdf'} FileMetadataType
 */

export const emptyValue = { ___empty___: true };

/**
 * @type Array<FileMetadataType>
 */
export const metadataTypes = ['xattrs', 'json', 'rdf'];

/**
 * Maps tab state to fragment of class name of tab indicator
 */
const tabStateClassTypes = {
  blank: 'inactive',
  invalid: 'danger',
  error: 'disabled',
  validating: 'warning',
  modified: 'warning',
  saved: 'success',
  present: 'success',
};

const mixins = [
  OwnerInjector,
  I18n,
  ...metadataTypes.map(type => createDataProxyMixin(`${type}Original`)),
];

export default EmberObject.extend(...mixins, {
  i18n: service(),
  metadataManager: service(),
  fileManager: service(),
  globalNotify: service(),
  modalManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileMetadataViewModel',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * Set to true, to make the view suitable for shares
   * @virtual optional
   * @type {Boolean}
   */
  previewMode: false,

  /**
   * @virtual optional
   * @type {String}
   */
  readonlyTip: '',

  metadataTypes: Object.freeze(metadataTypes),

  tabStateClassTypes: Object.freeze(tabStateClassTypes),

  /**
   * Set to true to disable metadata edition
   * @virtual optional
   */
  readonly: false,

  //#region state

  /**
   * One of `metadataTypes` values. Computed value if for default value.
   * @type {string}
   */
  activeTab: reads('metadataTypes.firstObject'),

  //#endregion

  fileModelScope: conditional(
    'previewMode',
    raw('public'),
    raw('private')
  ),

  isAnyModified: or(
    ...metadataTypes.map(type => `${type}IsModified`)
  ),

  isCurrentModified: computed(
    'activeTab',
    'isAnyModified',
    function isCurrentModified() {
      return this[metadataIsModifiedName(this.activeTab)];
    }
  ),

  isAnyInvalid: or(
    ...metadataTypes.map(type => eq(`${type}IsValid`, raw(false)))
  ),

  isAnyValidating: or(
    ...metadataTypes.map(type => `${type}IsValidating`)
  ),

  /**
   * True if any file metadata is protected.
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsProtected: bool('file.metadataIsProtected'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  effectiveReadonly: or('readonly', 'previewMode', 'metadataIsProtected'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  effectiveReadonlyTip: computed(
    'readonlyTip',
    'metadataIsProtected',
    'file.type',
    function effectiveReadonlyTip() {
      const {
        readonlyTip,
        metadataIsProtected,
        file,
      } = this.getProperties('readonlyTip', 'metadataIsProtected', 'file');
      if (readonlyTip) {
        return readonlyTip;
      } else if (metadataIsProtected) {
        return this.t('metadataIsProtected', {
          fileTypeUpper: capitalize(
            this.t(file && get(file, 'type') || 'file').toString()
          ),
        });
      } else {
        return '';
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.initMetadataProperties();
  },

  /**
   * For each type of metadata (xattrs, rdf, json) adds properties and methods
   * for this component, eg.
   * - `fetchXattrsOriginal` method for fetching proxy data, returns direct metadata or null
   * - `xattrsOriginalProxy` proxy property for metadata (added with mixin)
   * - `xattrsOriginal` value of proxy property (added by mixin)
   * - `xattrsCurrent` currently viewed edited value of metadata; on init, it's aliased
   *      to resolved original value, until it's modified
   * - `xattrsIsModified` boolean, true if metadata value if modified in modal and not saved
   * - `xattrsIsValid` boolean, true if edited data is valid (can be submitted)
   * - `xattrsIsValidating` boolean, true if data changed, but it was not validated yet
   *      (used with async validators for JSON and RDF, for xattrs it is always falsy)
   * - `xattrsTabState` string, one of `tabStateClassTypes`, defines state of tab
   */
  initMetadataProperties() {
    this.metadataTypes.forEach(type => {
      const originalName = metadataOriginalName(type);
      const proxyName = metadataOriginalProxyName(type);
      const currentName = metadataCurrentName(type);
      const isModifiedName = metadataIsModifiedName(type);
      const isValidName = metadataIsValidName(type);
      const isValidatingName = metadataIsValidatingName(type);
      const tabStateName = metadataTabStateName(type);
      // eg. `xattrsCurrent`
      defineProperty(this, currentName, reads(originalName));
      // eg. `xattrsIsModified`
      const computedIsModified = computed(currentName, originalName, function () {
        const currentValue = this.get(currentName);
        const originalValue = this.get(originalName);
        return originalValue !== emptyValue && currentValue === emptyValue ||
          !_.isEqual(currentValue, originalValue);
      });
      defineProperty(this, isModifiedName, computedIsModified);
      // eg. fetchXattrsOriginal
      this[metadataFetcherName(type)] = function () {
        const {
          metadataManager,
          file,
          fileModelScope,
        } = this.getProperties('metadataManager', 'file', 'fileModelScope');
        return metadataManager
          .getMetadata(file, type, fileModelScope)
          .then(metadata => {
            if (type === 'xattrs' && _.isEmpty(metadata)) {
              return emptyValue;
            } else {
              return metadata;
            }
          })
          .catch(error => {
            const isNoDataError = error && error.id === 'posix' &&
              error.details && error.details.errno === 'enodata';
            if (isNoDataError) {
              return emptyValue;
            } else {
              throw error;
            }
          });
      };
      const tabStateDeps = [
        currentName,
        isModifiedName,
        isValidName,
        isValidatingName,
        `${proxyName}.isRejected`,
      ];
      // eg. `xattrsTabState`
      const computedState = computed(...tabStateDeps, 'previewMode', function () {
        const previewMode = this.get('previewMode');
        const originalProxy = this.get(proxyName);
        const currentValue = this.get(currentName);
        const isModified = this.get(isModifiedName);
        const isValid = this.get(isValidName);
        const isValidating = this.get(isValidatingName);
        if (get(originalProxy, 'isRejected')) {
          return 'error';
        } else if (isValid === false && isValidating === false) {
          return 'invalid';
        } else if (currentValue === emptyValue && !isModified) {
          return 'blank';
        } else if (isValidating) {
          return 'validating';
        } else if (isModified) {
          return 'modified';
        } else {
          return previewMode ? 'present' : 'saved';
        }
      });
      defineProperty(
        this,
        tabStateName,
        computedState
      );
    });
  },

  /**
   * Clears not-saved user metadata changes by replacing it with saved metadata.
   * @param {FileMetadataType} type
   */
  restoreOriginalMetadata(type) {
    const originalName = metadataOriginalName(type);
    const originalMetadata = this[originalName];
    this.onMetadataChanged(type, {
      metadata: originalMetadata === emptyValue ?
        emptyValue : _.cloneDeep(this[originalName]),
      isValidating: false,
      isValid: true,
    });
    this.set('lastResetTime', Date.now());
  },

  async save(type) {
    const file = this.file;
    if (!file) {
      throw new Error('no file to set metadata');
    }
    const currentName = metadataCurrentName(type);
    const originalName = metadataOriginalName(type);
    const updaterName = metadataUpdaterName(type);
    const currentValue = this[currentName];
    const originalValue = this[originalName];
    let savePromise;
    if (type === 'xattrs') {
      savePromise = this.saveXattrs(
        originalValue,
        currentValue === emptyValue ? {} : currentValue
      );
    } else {
      if (currentValue === emptyValue) {
        savePromise = this.metadataManager.removeMetadata(file, type);
      } else {
        savePromise = this.metadataManager.setMetadata(file, type, currentValue);
      }
    }
    try {
      await savePromise;
      await file.reload();
      await this[updaterName]({ replace: true });
      safeExec(this, function setAliasedValueProperty() {
        this.set(currentName, this[originalName]);
      });
      if (file && get(file, 'hardlinksCount') > 1) {
        this.fileManager.fileParentRefresh(file);
      }
    } catch (error) {
      this.globalNotify.backendError(
        this.t('updatingMetadata', {
          type: this.t(`types.${type}`),
        }),
        error
      );
      throw error;
    }
  },

  saveXattrs(originalXattrs, newXattrs) {
    const {
      metadataManager,
      file,
    } = this.getProperties('metadataManager', 'file');
    const removedKeys = _.difference(
      Object.keys(originalXattrs || {}),
      Object.keys(newXattrs || {})
    );
    const modifiedData = {};
    const errors = [];
    for (const key in newXattrs) {
      if (originalXattrs === emptyValue ||
        !_.isEqual(newXattrs[key], originalXattrs[key])) {
        modifiedData[key] = newXattrs[key];
      }
    }
    return metadataManager
      .removeXattrs(file, removedKeys)
      .catch(error => errors.push(error))
      .then(() => this.get('metadataManager').setMetadata(file, 'xattrs', modifiedData))
      .catch(error => errors.push(error))
      .finally(() => {
        if (errors.length) {
          for (let i = 0; i < errors.length; ++i) {
            console.error(`fb-metadata-modal#saveXattrs: ${errors[i]}`);
          }
          throw errors[0];
        }
      });
  },

  onMetadataChanged(type, data) {
    if (data.metadata !== undefined) {
      this.set(metadataCurrentName(type), data.metadata);
    }
    if (data.isValidating !== undefined) {
      this.set(metadataIsValidatingName(type), data.isValidating);
    }
    if (data.isValid !== undefined) {
      this.set(metadataIsValidName(type), data.isValid);
    }
  },

  /**
   *
   * @param {() => Promise|any} onSuccessClose
   * @returns {boolean} true if view can be closed
   */
  async handleUnsavedChanged(onSuccessClose) {
    const activeTab = this.activeTab;
    let canClose = false;
    await this.modalManager.show('unsaved-changes-question-modal', {
      onSubmit: async (data) => {
        if (data.shouldSaveChanges) {
          try {
            await this.save(activeTab);
            canClose = true;
          } catch (error) {
            canClose = false;
          }
        } else {
          this.restoreOriginalMetadata(activeTab);
          canClose = true;
        }
        await onSuccessClose?.();
        return canClose;
      },
    }).hiddenPromise;
    return canClose;
  },

  async tryCloseCurrentTypeTab(onSuccessClose) {
    if (this.isCurrentModified) {
      return await this.handleUnsavedChanged(onSuccessClose);
    } else {
      await onSuccessClose?.();
      return true;
    }
  },

  async changeTab(tabId) {
    if (tabId === this.activeTab) {
      return;
    }
    return this.tryCloseCurrentTypeTab(() => {
      this.set('activeTab', tabId);
    });
  },
});

export function metadataFetcherName(type) {
  return camelize(`fetch-${type}-original`);
}

export function metadataUpdaterName(type) {
  return camelize(`update-${type}-original-proxy`);
}

export function metadataOriginalProxyName(type) {
  return `${type}OriginalProxy`;
}

export function metadataIsModifiedName(type) {
  return `${type}IsModified`;
}

export function metadataIsValidName(type) {
  return `${type}IsValid`;
}

export function metadataIsValidatingName(type) {
  return `${type}IsValidating`;
}

export function metadataOriginalName(type) {
  return `${type}Original`;
}

export function metadataCurrentName(type) {
  return `${type}Current`;
}

export function metadataTabStateName(type) {
  return `${type}TabState`;
}
