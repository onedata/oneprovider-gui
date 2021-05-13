/**
 * A base class for logic and co-related data for file-browser.
 * It acts as a strategy for `file-browser` component, while the component serves
 * state (see region file-browser state) and API (region file-browser API).
 * 
 * Extend this class to implement specific browsers like filesystem-browser.
 *
 * @module utils/base-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { getProperties, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { dasherize } from '@ember/string';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import animateCss from 'onedata-gui-common/utils/animate-css';
import {
  actionContext,
} from 'oneprovider-gui/components/file-browser';

export default EmberObject.extend(OwnerInjector, I18n, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.baseBrowserModel',

  //#region API for file-browser component

  /**
   * @virtual
   * @type {Components.FileBrowser} browserInstance
   */
  browserInstance: undefined,

  /**
   * @virtual
   * @type {Array<String>}
   */
  buttonNames: Object.freeze([]),

  /**
   * @virtual
   * @type {Function}
   * @param {Object} dir file-like object
   */
  onChangeDir: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  onInsertElement: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function<(fileIds: Array<String>) => Promise>}
   */
  onOpenFile: notImplementedIgnore,

  /**
   * @virtual
   * @type {String}
   */
  rowComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  statusBarComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  mobileInfoComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  columnsComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  headRowComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  dirLoadErrorComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  emptyDirComponentName: '',

  /**
   * @virtual optional
   * @type {String}
   */
  browserClass: '',

  /**
   * Custom text for "current directory" for current dir menu.
   * @virtual optional
   * @type {SafeString}
   */
  currentDirTranslation: '',

  /**
   * @type {String}
   */
  rootIcon: 'space',

  getCurrentDirMenuButtons(availableActions) {
    return availableActions;
  },

  /**
   * All button objects. Order is significant.
   * @type {ComputedProperty<Array<Object>>}
   */
  allButtonsArray: computed('buttonNames.[]', function allButtonsArray() {
    return this.get('buttonNames').map(name => this.get(name));
  }),

  /**
   * Maps button property name => button object.
   * @type {Object}
   */
  allButtonsHash: computed('buttonNames.[]', function allButtonsHash() {
    return this.get('buttonNames').reduce((hash, name) => {
      hash[name] = this.get(name);
      return hash;
    }, {});
  }),

  //#endregion

  //#region file-browser state

  dir: reads('browserInstance.dir'),
  selectedFiles: reads('browserInstance.selectedFiles'),
  selectionContext: reads('browserInstance.selectionContext'),
  element: reads('browserInstance.element'),
  spacePrivileges: reads('browserInstance.spacePrivileges'),
  spaceId: reads('browserInstance.spaceId'),
  previewMode: reads('browserInstance.previewMode'),
  // TODO: VFS-7643 refactor generic-browser to use names other than "file" for leaves
  fileClipboardMode: reads('browserInstance.fileClipboardMode'),
  fileClipboardFiles: reads('browserInstance.fileClipboardFiles'),

  //#endregion

  //#region file-browser API

  fbTableApi: reads('browserInstance.fbTableApi'),

  // TODO: VFS-7643 refactor generic-browser to use names other than "file" for leaves
  /**
   * You can push and remove file IDs to alter row icons loading state
   * @type {Ember.Array<String>}
   */
  loadingIconFileIds: reads('browserInstance.loadingIconFileIds'),

  //#endregion

  btnRefresh: computed(function btnRefresh() {
    return this.createFileAction({
      id: 'refresh',
      icon: 'refresh',
      action: () => {
        return this.refresh();
      },
      showIn: [
        actionContext.inDir,
        actionContext.inDirPreview,
        actionContext.currentDir,
        actionContext.currentDirPreview,
        actionContext.spaceRootDir,
        actionContext.spaceRootDirPreview,
      ],
    });
  }),

  refresh() {
    const {
      globalNotify,
      fbTableApi,
      element,
    } = this.getProperties('globalNotify', 'fbTableApi', 'element');
    animateCss(
      element.querySelector('.fb-toolbar-button.file-action-refresh'),
      'pulse-mint'
    );
    return fbTableApi.refresh()
      .catch(error => {
        globalNotify.backendError(this.t('refreshing'), error);
        throw error;
      });
  },

  /**
   * Create button or popover menu item for controlling files.
   * @param {object} actionProperties properties of action button:
   *  - id: string
   *  - action: optional function
   *  - icon: optional string, if not provided will be generated
   *  - title: string
   *  - showIn: array of strings from arrayContext
   *  - class: string, classes added to element
   * @returns {EmberObject}
   */
  createFileAction(actionProperties) {
    const {
      id,
      title,
      icon,
      showIn,
      action,
      disabled,
      class: elementClass,
    } = getProperties(
      actionProperties,
      'id',
      'title',
      'icon',
      'showIn',
      'action',
      'disabled',
      'class'
    );
    return Object.assign({}, actionProperties, {
      icon: icon || `browser-${dasherize(id)}`,
      title: title || this.t(`fileActions.${id}`),
      showIn: showIn || [],
      disabled: disabled === undefined ? false : disabled,
      action: (files, ...args) => {
        return action(files || this.get('selectedFiles'), ...args);
      },
      class: `file-action-${id} ${elementClass || ''}`,
    });
  },

});
