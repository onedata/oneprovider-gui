import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { collect } from '@ember/object/computed';
import { camelize, dasherize } from '@ember/string';
import File from 'oneprovider-gui/models/file';
import _ from 'lodash';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { hash } from 'ember-awesome-macros';

export const actionContext = {
  none: 'none',
  inDir: 'inDir',
  singleDir: 'singleDir',
  singleFile: 'singleFile',
  multiDir: 'multiDir',
  multiFile: 'multiFile',
  multiMixed: 'multiMixed',
  desktopToolbar: 'desktopToolbar',
};

export function isContextMenuOpened() {
  return Boolean(document.querySelector(
    '.webui-popover.in .file-actions-popover'
  ));
}

const anySelected = [
  actionContext.singleDir,
  actionContext.singleFile,
  actionContext.multiDir,
  actionContext.multiFile,
  actionContext.multiMixed,
];

const buttonNames = [
  'btnUpload',
  'btnNewDirectory',
  'btnInfo',
  'btnShare',
  'btnMetadata',
  'btnPermissions',
  'btnDistribution',
  'btnRename',
  'btnCopy',
  'btnCut',
  'btnDelete',
];

export default Component.extend(I18n, {
  i18n: service(),
  fileActions: service(),
  classNames: ['file-browser'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser',

  selectedFiles: undefined,

  // FIXME: mock
  dir: computed(function dir() {
    return File.create({
      id: this.get('dirId'),
      name: 'My directory',
      size: 350000000,
      modificationTime: Date.now(),
      provider: null,
      totalChildrenCount: 0,
      canViewDir: true,
      permissions: 0o644,
      parent: null,
      children: [{
          name: 'Other file with very long name the longest the longest the longest the longest the longest the longest the longest the longest the longest the longest the longest the longest the longest the longest the longest the longest',
          size: 29311232312312,
          type: 'file',
        },
        {
          name: 'Some directory',
          size: 29311232312312,
          type: 'dir',
        },
        {
          name: 'Other directory',
          size: 29311232312312,
          type: 'dir',
        },
        ..._.range(1, 10).map(i => ({
          name: `File ${i}`,
          size: 3000000 * i,
          type: 'file',
        })),
      ],
    });
  }),

  /**
   * One of values from `actionContext` enum object
   * @type {ComputedProperty<string>}
   */
  selectionContext: computed('selectedFiles.[]', function selectionContext() {
    /** @type Array<object> */
    const selectedFiles = this.get('selectedFiles');
    if (selectedFiles) {
      const count = get(selectedFiles, 'length');
      if (count === 0) {
        return 'none';
      } else if (count === 1) {
        if (get(selectedFiles[0], 'type') === 'dir') {
          return actionContext.singleDir;
        } else {
          return actionContext.singleFile;
        }
      } else {
        if (selectedFiles.some(file => get(file, 'type') === 'dir')) {
          if (selectedFiles.some(file => get(file, 'type') === 'file')) {
            return actionContext.multiMixed;
          } else {
            return actionContext.multiDir;
          }
        } else {
          return actionContext.multiFile;
        }
      }
    }
  }),

  // #region Action buttons

  allButtonsArray: collect(...buttonNames),

  allButtonsHash: hash(...buttonNames),

  btnUpload: computed(function btnUpload() {
    return this.createFileAction({
      id: 'upload',
      showIn: [
        actionContext.inDir,
      ],
    });
  }),

  btnNewDirectory: computed(function btnNewDirectory() {
    return this.createFileAction({
      id: 'newDirectory',
      showIn: [
        actionContext.inDir,
      ],
    });
  }),

  btnShare: computed(function btnShare() {
    return this.createFileAction({
      id: 'share',
      showIn: [
        actionContext.singleDir,
      ],
    });
  }),

  btnMetadata: computed(function btnMetadata() {
    return this.createFileAction({
      id: 'metadata',
      showIn: [
        actionContext.singleDir,
        actionContext.singleFile,
      ],
    });
  }),

  btnInfo: computed(function btnInfo() {
    return this.createFileAction({
      id: 'info',
      showIn: anySelected,
    });
  }),

  btnRename: computed(function btnRename() {
    return this.createFileAction({
      id: 'rename',
      showIn: [
        actionContext.singleDir,
        actionContext.singleFile,
      ],
    });
  }),

  btnPermissions: computed(function btnPermissions() {
    return this.createFileAction({
      id: 'permissions',
      showIn: anySelected,
    });
  }),

  btnCopy: computed(function btnCopy() {
    return this.createFileAction({
      id: 'copy',
      showIn: anySelected,
    });
  }),

  btnCut: computed(function btnCut() {
    return this.createFileAction({
      id: 'cut',
      showIn: anySelected,
    });
  }),

  btnDelete: computed(function btnDelete() {
    return this.createFileAction({
      id: 'delete',
      showIn: anySelected,
    });
  }),

  btnDistribution: computed(function btnDistribution() {
    return this.createFileAction({
      id: 'distribution',
      showIn: anySelected,
    });
  }),

  separator: computed(function separator() {
    return {
      type: 'separator',
    };
  }),

  // #endregion

  init() {
    this._super(...arguments);
    this.set('selectedFiles', A());
  },

  clickOutsideDeselectHandler: computed(function clickOutsideDeselectHandler() {
    const component = this;
    return function clickOutsideDeselect(mouseEvent) {
      if (!isContextMenuOpened() &&
        !mouseEvent.target.matches(
          '.fb-table-row *, .fb-breadcrumbs-dir *, .fb-toolbar-button *')) {
        component.clearFilesSelection();
      }
    };
  }),

  didInsertElement() {
    this._super(...arguments);
    document.body.addEventListener(
      'click',
      this.get('clickOutsideDeselectHandler')
    );
  },

  willDestroyElement() {
    this._super(...arguments);
    document.body.removeEventListener(
      'click',
      this.get('clickOutsideDeselectHandler')
    );
  },

  // FIXME: invoke with selected files
  createFileAction(actionProto) {
    const id = get(actionProto, 'id');
    const fileActions = this.get('fileActions');
    return Object.assign({
      action: () => {
        return fileActions[camelize(`act-${id}`)](this.get('selectedFiles'));
      },
      icon: `browser-${dasherize(id)}`,
      title: this.t(`fileActions.${id}`),
      showIn: [],
    }, actionProto);
  },

  // FIXME: move to util or something
  getActions(context) {
    const allButtonsArray = this.get('allButtonsArray');
    return allButtonsArray.filter(btn => get(btn, 'showIn').includes(context));
  },

  clearFilesSelection() {
    this.get('selectedFiles').clear();
  },

  actions: {
    getActions() {
      return this.getActions(...arguments);
    },
  },
});
