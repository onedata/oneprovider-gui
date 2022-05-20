/**
 * Input box capable to jump to browser item using name prefix (eg. to file in file
 * browser).
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { cancel, debounce } from '@ember/runloop';
import { conditional, raw } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['jump-control'],

  fileManager: service(),
  appProxy: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.jumpControl',

  /**
   * Entity ID of items container (directory, dataset directory, etc.)
   * to search the item by prefix in.
   * @virtual
   * @type {string}
   */
  parentDirId: undefined,

  /**
   * Debounced jump delay in milliseconds.
   * @type {number}
   */
  jumpScheduleDelay: 500,

  //#region state

  /**
   * @type {string}
   */
  inputValue: '',

  /**
   * @type {boolean}
   */
  isJumpInProgress: false,

  /**
   * @type {any}
   */
  timeoutId: null,

  /**
   * Is set to true when last jump does not found item with given prefix, but jumped
   * to next item.
   * @type {boolean}
   */
  isLastJumpFailed: false,

  //#endregion

  validationClass: conditional(
    'isLastJumpFailed',
    raw('has-error'),
    raw(''),
  ),

  scheduleJump() {
    const jumpScheduleDelay = this.get('jumpScheduleDelay');
    const timeoutId = debounce(this, 'performJump', jumpScheduleDelay);
    this.set('timeoutId', timeoutId);
  },

  async performJump() {
    const {
      fileManager,
      appProxy,
      parentDirId,
      inputValue,
    } = this.getProperties(
      'fileManager',
      'appProxy',
      'parentDirId',
      'inputValue',
    );
    if (!inputValue) {
      return;
    }
    try {
      this.set('isJumpInProgress', true);
      let fileData =
        await fileManager.getFileDataByName(parentDirId, inputValue);
      const isLastJumpFailed = !fileData || !fileData.name ||
        !fileData.name.startsWith(inputValue);
      this.set('isLastJumpFailed', isLastJumpFailed);
      if (!fileData) {
        fileData = await fileManager.getFileDataByName(
          parentDirId,
          inputValue, {
            offset: -1,
          });
      }
      if (!fileData) {
        return;
      }
      const fileId = get(fileData, 'guid');
      appProxy.callParent('updateSelected', [fileId]);
    } finally {
      this.set('isJumpInProgress', false);
    }
  },

  clearDebounce() {
    const timeoutId = this.get('timeoutId');
    if (!timeoutId) {
      return;
    }
    cancel(timeoutId);
    this.set('timeoutId', null);
  },

  actions: {
    async performJumpImmediately() {
      this.clearDebounce();
      return this.performJump();
    },
    changeValue(value) {
      this.setProperties({
        inputValue: value,
        isLastJumpFailed: false,
      });
      this.scheduleJump();
    },
  },
});
