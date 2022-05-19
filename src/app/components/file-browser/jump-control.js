/**
 * FIXME: jsdoc
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Component.extend({
  classNames: ['jump-control'],

  fileManager: service(),
  appProxy: service(),

  /**
   * Entity ID of items container (directory, dataset directory, etc.)
   * to search the item by prefix in.
   * @virtual
   * @type {string}
   */
  parentDirId: undefined,

  //#region state

  /**
   * @type {string}
   */
  inputValue: '',

  /**
   * @virtual
   * @type {boolean}
   */
  isJumpInProgress: false,

  //#endregion

  actions: {
    async performJump(onPopoverClose) {
      // FIXME: implement
      const parentDirId = this.get('parentDirId');
      const fileManager = this.get('fileManager');
      const inputValue = this.get('inputValue');
      const appProxy = this.get('appProxy');
      if (!inputValue) {
        return;
      }
      try {
        this.set('jumpInProgress', true);
        let fileData =
          await fileManager.getFileDataByName(parentDirId, inputValue);
        if (!fileData) {
          fileData = await fileManager.getFileDataByName(
            parentDirId,
            inputValue, {
              offset: -1,
            });
        }
        if (!fileData) {
          // FIXME: error handling
          return;
        }
        // FIXME: sytuacja: znaleziono plik, bo jest nowy, ale na naszej liście go nie ma
        // więc trzeba by odświeżać najpierw listę przed skokiem, a może i odświeżać zawsze
        const fileId = get(fileData, 'guid');
        appProxy.callParent('updateSelected', [fileId]);
      } finally {
        this.set('jumpInProgress', false);
      }
      // FIXME: error handling
      if (typeof onPopoverClose === 'function') {
        onPopoverClose();
      }
    },
  },
});
