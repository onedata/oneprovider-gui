import EmberObject, { getProperties, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { dasherize } from '@ember/string';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default EmberObject.extend(OwnerInjector, I18n, {
  //#region API for file-browser component

  /**
   * @virtual optional
   * @type {Array<String>}
   */
  buttonNames: Object.freeze([]),

  /**
   * Maps button name => button object.
   * MUST be recomputed if some button object reference is changed (not necessary if only
   * mutated).
   * @virtual optional
   * @type {Object}
   */
  allButtonsHash: Object.freeze({}),

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
   * @type {Function}
   */
  onClearFileClipboard: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function<(fileIds: Array<String>) => Promise>}
   */
  onOpenFile: notImplementedIgnore,

  /**
   * @type {String}
   */
  rootIcon: 'space',

  /**
   * All button objects. Order is significant.
   * @type {ComputedProperty<Array<Object>>}
   */
  allButtonsArray: computed('allButtonsHash', function allButtonsArray() {
    return Object.values(this.get('allButtonsHash'));
  }),

  getCurrentDirMenuButtons(availableActions) {
    return availableActions;
  },

  //#endregion

  //#region file-browser state

  dir: reads('browserInstance.dir'),
  selectedFiles: reads('browserInstance.selectedFiles'),
  element: reads('browserInstance.element'),
  spacePrivileges: reads('browserInstance.spacePrivileges'),
  spaceId: reads('browserInstance.spaceId'),
  previewMode: reads('browserInstance.previewMode'),
  fileClipboardMode: reads('browserInstance.fileClipboardMode'),
  fileClipboardFiles: reads('browserInstance.fileClipboardFiles'),

  //#endregion

  //#region file-browser API

  fbTableApi: reads('browserInstance.fbTableApi'),

  /**
   * You can push and remove file IDs to alter row icons loading state
   * @type {Ember.Array<String>}
   */
  loadingIconFileIds: reads('browserInstance.loadingIconFileIds'),

  //#endregion
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
