import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { get, computed } from '@ember/object';
import { isContextMenuOpened } from 'oneprovider-gui/components/file-browser';
import { reads } from '@ember/object/computed';
import $ from 'jquery';

export default Component.extend(I18n, {
  classNames: ['fb-table'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbTable',

  dir: undefined,

  /**
   * @virtual
   */
  selectionContext: undefined,

  /**
   * @virtual
   */
  selectedFiles: undefined,

  lastSelectedFile: undefined,

  // TODO: replacing chunks array abstraction
  filesArray: computed('dir.children', function filesArray() {
    return this.get('dir.children');
  }),

  visibleFiles: reads('filesArray'),

  contextMenuButtons: computed('selectionContext', function buttons() {
    return this.getButtonActions(this.get('selectionContext'));
  }),

  getButtonActions(context) {
    return this.get('allButtonsArray')
      .filter(b => get(b, 'showIn').includes(context));
  },

  clearFilesSelection() {
    this.get('selectedFiles').clear();
  },

  /**
   * Do something if user clicks on a file. Consider modifier keys
   * @param {object} file
   * @param {boolean} ctrlKey
   * @param {boolean} shiftKey
   * @returns {undefined}
   */
  fileClicked(file, ctrlKey, shiftKey) {
    // do not change selection if only clicking to close context menu
    if (isContextMenuOpened()) {
      return;
    }

    /** @type {Array<object>} */
    const selectedFiles = this.get('selectedFiles');
    const selectedCount = get(selectedFiles, 'length');
    const fileIsSelected = selectedFiles.includes(file);
    const otherFilesSelected = selectedCount > (fileIsSelected ? 1 : 0);
    if (otherFilesSelected) {
      if (fileIsSelected) {
        if (ctrlKey) {
          this.selectRemoveSingleFile(selectedFiles, file);
        } else {
          this.selectOnlySingleFile(selectedFiles, file);
        }
      } else {
        if (ctrlKey) {
          this.selectAddSingleFile(selectedFiles, file);
        } else {
          if (shiftKey) {
            this.selectRangeToFile(file);
          } else {
            this.selectOnlySingleFile(selectedFiles, file);
          }
        }
      }
    } else {
      if (fileIsSelected) {
        this.selectRemoveSingleFile(selectedFiles, file);
      } else {
        this.selectAddSingleFile(selectedFiles, file);
      }
    }
  },

  selectRemoveSingleFile(selectedFiles, file) {
    selectedFiles.removeObject(file);
    this.set('lastSelectedFile', null);
  },

  selectAddSingleFile(selectedFiles, file) {
    selectedFiles.pushObject(file);
    this.set('lastSelectedFile', file);
  },

  selectOnlySingleFile(selectedFiles, file) {
    this.clearFilesSelection(selectedFiles, file);
    this.selectAddSingleFile(selectedFiles, file);
  },

  /**
   * Select files range using shift.
   * Use nearest selected file as range start.
   * @param {File} file
   * @returns {undefined}
   */
  selectRangeToFile(file) {
    const { visibleFiles, selectedFiles, lastSelectedFile } = this.getProperties(
      'selectedFiles',
      'visibleFiles',
      'lastSelectedFile'
    );
    let fileIndex = visibleFiles.indexOf(file);

    let startIndex;
    if (lastSelectedFile) {
      startIndex = visibleFiles.indexOf(lastSelectedFile);
    } else {
      startIndex = this.findNearestSelectedIndex(fileIndex);
    }

    let indexA = Math.min(startIndex, fileIndex);
    let indexB = Math.max(startIndex, fileIndex);
    selectedFiles.addObjects(visibleFiles.slice(indexA, indexB + 1));
  },

  findNearestSelectedIndex(fileIndex) {
    const { visibleFiles, selectedFiles } =
    this.getProperties('visibleFiles', 'selectedFiles');

    // [index: Number, distanceFromFile: Number]
    const selectedFilesIndexes = selectedFiles.map(sf => {
      const index = visibleFiles.indexOf(sf);
      return [index, Math.abs(index - fileIndex)];
    });
    const nearest = selectedFilesIndexes.reduce((prev, current) => {
      return current[1] < prev[1] ? current : prev;
    }, [-1, Infinity]);
    let [nearestIndex, nearestDist] = nearest;
    if (nearestDist === Infinity) {
      nearestIndex = fileIndex;
    }
    return nearestIndex;
  },

  actions: {
    // FIXME: allow to right click and open new menu when there is already opened
    openContextMenu(file, mouseEvent) {
      const selectedFiles = this.get('selectedFiles');
      if (get(selectedFiles, 'length') === 0 || !selectedFiles.includes(file)) {
        this.selectOnlySingleFile(selectedFiles, file);
      }
      let left;
      let top;
      const trigger = mouseEvent.currentTarget;
      if (trigger.matches('.one-menu-toggle')) {
        const $trigger = $(trigger);
        const toggleOffset = $trigger.offset();
        left = toggleOffset.left + trigger.clientWidth / 2;
        top = toggleOffset.top + trigger.clientHeight / 2;
      } else {
        left = mouseEvent.clientX;
        top = mouseEvent.clientY;
      }
      this.$('.file-actions-trigger').css({
        top,
        left,
      });
      this.actions.toggleFileActions.bind(this)(true, file);
    },
    toggleFileActions(open, file) {
      this.set('fileActionsOpen', open, file);
    },

    /**
     * @param {object} file 
     * @param {MouseEvent} clickEvent
     * @returns {any} result of this.fileClicked
     */
    fileClicked(file, clickEvent) {
      const { ctrlKey, metaKey, shiftKey } = clickEvent;
      return this.fileClicked(
        file,
        ctrlKey || metaKey,
        shiftKey
      );
      // this.get('selectedFiles')[selected ? 'add' : 'delete'](file);
    },
  },
});
