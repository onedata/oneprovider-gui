/**
 * Shows and allows edit file or directory metadata
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';
import { conditional, equal, raw, or, not, eq, and, bool } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import _ from 'lodash';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { camelize } from '@ember/string';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { all as allFulfilled } from 'rsvp';
import { capitalize } from '@ember/string';
import { emptyValue } from 'oneprovider-gui/utils/file-metadata-view-model';

const metadataTypes = ['xattrs', 'json', 'rdf'];

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
  I18n,
  ...metadataTypes.map(type => createDataProxyMixin(`${type}Original`)),
];

export default Component.extend(...mixins, {
  classNames: ['file-metadata-body'],
  classNameBindings: ['fullVertical:full-height'],

  i18n: service(),
  metadataManager: service(),
  globalNotify: service(),
  fileManager: service(),

  open: false,

  /**
   * @override
   */
  i18nPrefix: 'components.fileMetadata.body',

  /**
   * @virtual
   * @type {Utils.FileMetadataViewModel}
   */
  viewModel: undefined,

  /**
   * Set to true, to make modal suitable for shares
   * @virtual optional
   * @type {Boolean}
   */
  previewMode: false,

  /**
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('viewModel.file'),

  fileModelScope: conditional(
    'previewMode',
    raw('public'),
    raw('private')
  ),

  /**
   * Set to true to disable metadata edition
   * @virtual optional
   */
  readonly: false,

  /**
   * @virtual optional
   * @type {String}
   */
  readonlyTip: '',

  metadataTypes: Object.freeze(metadataTypes),

  tabStateClassTypes: Object.freeze(tabStateClassTypes),

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

  activeTab: reads('metadataTypes.firstObject'),

  /**
   * @type {ComputedProperty<string>} one of: file, dir
   */
  fileType: reads('file.type'),

  /**
   * @type {ComputedProperty<string>}
   */
  typeTranslation: conditional(
    equal('fileType', raw('file')),
    computedT('file'),
    computedT('dir'),
  ),

  /**
   * If any value is invalid, we suppose that it must be modified (data from DB cannot
   * be invalid).
   * @type {ComputedProperty<boolean>}
   */
  isCloseBtnDiscard: or('isAnyModified', 'isAnyInvalid'),

  closeBtnText: conditional(
    'isCloseBtnDiscard',
    computedT('discardChanges'),
    computedT('close'),
  ),

  closeBtnType: conditional(
    'isCloseBtnDiscard',
    raw('warning'),
    raw('default'),
  ),

  saveAllDisabled: or(not('isAnyModified'), 'isAnyInvalid', 'isAnyValidating'),

  isAnyModified: or(...metadataTypes.map(type => `${type}IsModified`)),

  isAnyInvalid: or(...metadataTypes.map(type => eq(`${type}IsValid`, raw(false)))),

  isAnyValidating: or(...metadataTypes.map(type => `${type}IsValidating`)),

  saveAllDisabledMessage: or(
    and('isAnyInvalid', computedT('disabledReason.someInvalid')),
    and('isAnyValidating', computedT('disabledReason.validating')),
    and(not('isAnyModified'), computedT('disabledReason.noChanges')),
  ),

  fullVertical: not(eq('activeTab', raw('xattrs'))),

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
    metadataTypes.forEach(type => {
      const originalName = metadataOriginalName(type);
      const proxyName = metadataOriginalProxyName(type);
      const currentName = metadataCurrentName(type);
      const isModifiedName = metadataIsModifiedName(type);
      const isValidName = metadataIsValidName(type);
      const isValidatingName = metadataIsValidatingName(type);
      const tabStateName = metadataTabStateName(type);
      // eg. `xattrsCurrent`
      this[currentName] = reads(originalName);
      // eg. `xattrsIsModified`
      this[isModifiedName] = computed(currentName, originalName, function () {
        const currentValue = this.get(currentName);
        const originalValue = this.get(originalName);
        return originalValue !== emptyValue && currentValue === emptyValue ||
          !_.isEqual(currentValue, originalValue);
      });
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
      this[tabStateName] =
        computed(...tabStateDeps, 'previewMode', function () {
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
    });
  },

  save(type) {
    const {
      metadataManager,
      file,
    } = this.getProperties('metadataManager', 'file');
    const currentName = metadataCurrentName(type);
    const originalName = metadataOriginalName(type);
    const currentValue = this.get(currentName);
    const originalValue = this.get(originalName);
    let savePromise;
    if (type === 'xattrs') {
      savePromise = this.saveXattrs(
        originalValue,
        currentValue === emptyValue ? {} : currentValue
      );
    } else {
      if (currentValue === emptyValue) {
        savePromise = metadataManager.removeMetadata(file, type);
      } else {
        savePromise = metadataManager.setMetadata(file, type, currentValue);
      }
    }
    return savePromise
      .catch(error => {
        this.get('globalNotify').backendError(
          this.t('updatingMetadata', {
            type: this.t(`types.${type}`),
          }),
          error
        );
        throw error;
      });
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

  actions: {
    onHide() {
      return this.get('onHide')();
    },
    onShow() {
      return this.get('onShow')();
    },
    changeTab(tabId) {
      this.set('activeTab', tabId);
    },
    saveAll() {
      const modifiedTypes = metadataTypes
        .filter(type => this.get(metadataIsModifiedName(type)));
      return allFulfilled(
          modifiedTypes
          .map(type => this.save(type))
        )
        .then(() => {
          this.get('file').reload().then(() => {
            modifiedTypes.forEach(type => {
              const currentName = metadataCurrentName(type);
              const originalName = metadataOriginalName(type);
              this[metadataUpdaterName(type)]({ replace: true }).then(() => {
                safeExec(this, function setAliasedValueProperty() {
                  this.set(currentName, this.get(originalName));
                });
              });
            });
          });
          const {
            file,
            fileManager,
          } = this.getProperties('file', 'fileManager');
          if (get(file, 'hardlinksCount') > 1) {
            fileManager.fileParentRefresh(file);
          }
        })
        .then(() => {
          this.get('onHide')();
        });
    },
    metadataChanged(type, data) {
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
  },
});

function metadataFetcherName(type) {
  return camelize(`fetch-${type}-original`);
}

function metadataUpdaterName(type) {
  return camelize(`update-${type}-original-proxy`);
}

function metadataOriginalProxyName(type) {
  return `${type}OriginalProxy`;
}

function metadataIsModifiedName(type) {
  return `${type}IsModified`;
}

function metadataIsValidName(type) {
  return `${type}IsValid`;
}

function metadataIsValidatingName(type) {
  return `${type}IsValidating`;
}

function metadataOriginalName(type) {
  return `${type}Original`;
}

function metadataCurrentName(type) {
  return `${type}Current`;
}

function metadataTabStateName(type) {
  return `${type}TabState`;
}
