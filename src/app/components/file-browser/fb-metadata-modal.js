/**
 * Shows and allows edit file or directory metadata
 * 
 * @module components/file-browser/fb-metadata-modal
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { reads } from '@ember/object/computed';
import { conditional, equal, raw, or, not, eq } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import _ from 'lodash';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { camelize } from '@ember/string';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { all as allFulfilled } from 'rsvp';

export const emptyValue = { ___empty___: true };

const metadataTypes = ['xattrs', 'json', 'rdf'];

/**
 * Maps tab state to fragment of class name of tab indicator
 */
const tabStateClassTypes = {
  blank: 'inactive',
  invalid: 'danger',
  modified: 'warning',
  saved: 'success',
};

export default Component.extend(
  I18n,
  ...metadataTypes.map(type => createDataProxyMixin(`${type}Original`)), {
    i18n: service(),
    metadataManager: service(),
    globalNotify: service(),

    open: false,

    /**
     * @override
     */
    i18nPrefix: 'components.fileBrowser.fbMetadataModal',

    /**
     * @virtual
     * @type {Models.File}
     */
    file: undefined,

    /**
     * @virtual
     * Callback when the modal is starting to hide
     * @type {Function}
     */
    onHide: notImplementedIgnore,

    /**
     * @virtual
     * Callback when the modal is shown
     * @type {Function}
     */
    onShow: notImplementedIgnore,

    metadataTypes: Object.freeze(metadataTypes),

    tabStateClassTypes: Object.freeze(tabStateClassTypes),

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

    closeBtnText: conditional(
      'isAnyModified',
      computedT('discardChanges'),
      computedT('close'),
    ),

    closeBtnType: conditional(
      'isAnyModified',
      raw('warning'),
      raw('default'),
    ),

    saveAllDisabled: or(not('isAnyModified'), 'isAnyInvalid'),

    isAnyModified: or(...metadataTypes.map(type => `${type}IsModified`)),

    isAnyInvalid: or(...metadataTypes.map(type => eq(`${type}IsValid`, raw(false)))),

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
     * - `xattrsTabState` string, one of `tabStateClassTypes`, defines state of tab
     */
    initMetadataProperties() {
      metadataTypes.forEach(type => {
        const originalName = metadataOriginalName(type);
        const currentName = metadataCurrentName(type);
        const isModifiedName = metadataIsModifiedName(type);
        const isValidName = metadataIsValidName(type);
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
        this[metadataFetcherName(type)] = function () {
          const {
            metadataManager,
            file,
          } = this.getProperties('metadataManager', 'file');
          return metadataManager
            .getMetadata(file, type)
            .then(({ metadata }) => {
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
        ];
        // eg. `xattrsTabState`
        this[tabStateName] =
          computed(...tabStateDeps, function () {
            const currentValue = this.get(currentName);
            const isModified = this.get(isModifiedName);
            const isValid = this.get(isValidName);
            if (currentValue === emptyValue && !isModified) {
              return 'blank';
            } else {
              if (isValid === false) {
                return 'invalid';
              } else if (isModified) {
                return 'modified';
              } else {
                return 'saved';
              }
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
        savePromise = this.saveXattrs(originalValue, currentValue);
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
          })
          .then(() => {
            this.get('onHide')();
          });
      },
      metadataChanged(type, data) {
        if (data.metadata !== undefined) {
          this.set(metadataCurrentName(type), data.metadata);
        }
        if (data.isValid !== undefined) {
          this.set(metadataIsValidName(type), data.isValid);
        }
      },
    },
  }
);

function metadataFetcherName(type) {
  return camelize(`fetch-${type}-original`);
}

function metadataUpdaterName(type) {
  return camelize(`update-${type}-original-proxy`);
}

function metadataIsModifiedName(type) {
  return `${type}IsModified`;
}

function metadataIsValidName(type) {
  return `${type}IsValid`;
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
