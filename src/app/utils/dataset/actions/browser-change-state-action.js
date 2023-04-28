/**
 * Adds dataset-browser-specific implementation for change-state action.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ChangeStateAction from './change-state-action';

export default ChangeStateAction.extend({
  /**
   * A browserModel if the action is invoked from the datasets browser.
   * @virtual
   * @type {Utils.DatasetBrowserModel}
   */
  browserModel: undefined,

  /**
   * Remembers parent of dataset dir before performing dataset modification, to redirect
   * to the parent after modification.
   * @type {Models.Dataset}
   */
  currentDirParent: null,

  /**
   * @override
   */
  async onStateChanged(changedDatasets) {
    if (changedDatasets?.includes(this.browserModel.dir) && this.currentDirParent) {
      await this.browserModel.changeDir(this.currentDirParent);
    } else {
      await this.browserModel.refresh();
    }
  },

  /**
   * @override
   */
  onExecute(datasets) {
    // In case there was former invocation of this action - reset currentDirParent.
    this.set('currentDirParent', null);
    const currentDir = this.browserModel.dir;
    // Super invocation must be done before any async operations - the super method
    // of this action shows attach/detach question modal, so invoking async block right
    // after showing modal should invoke before user clicks proceed button in modal.
    this._super(datasets);
    (async () => {
      const isChangingCurrentDirState = datasets.includes(currentDir);
      if (isChangingCurrentDirState) {
        this.set(
          'currentDirParent',
          await this.browserModel.resolveFileParentFun(currentDir)
        );
      }
    })();
  },
});
