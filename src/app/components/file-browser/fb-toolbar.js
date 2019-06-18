import Component from '@ember/component';
import { computed } from '@ember/object';
import { collect } from '@ember/object/computed';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';

export default Component.extend({
  classNames: ['fb-toolbar'],

  dir: undefined,

  buttonClicked: notImplementedReject,

  // TODO: hint should be a translation key, when rendered, it will get
  // name of element: directory, directories, file, files, elements or current directory
  // To avoid using "element"

  btnNewDir: computed(function btnNewDir() {
    return {
      hint: 'Create new directory',
      icon: 'browser-new-directory',
    };
  }),

  btnShare: computed(function btnShare() {
    return {
      hint: 'Share element',
      icon: 'browser-share',
    };
  }),

  btnMetadata: computed(function btnMetadata() {
    return {
      hint: 'Show element metadata',
      icon: 'browser-metadata',
    };
  }),

  btnInfo: computed(function btnInfo() {
    return {
      hint: 'Show element info',
      icon: 'browser-info',
    };
  }),

  btnRename: computed(function btnRename() {
    return {
      hint: 'Rename element',
      icon: 'browser-rename',
    };
  }),

  btnPermissions: computed(function btnPermissions() {
    return {
      hint: 'Show element permissions',
      icon: 'browser-permissions',
    };
  }),

  btnCopy: computed(function btnCopy() {
    return {
      hint: 'Copy element',
      icon: 'browser-copy',
    };
  }),

  btnCut: computed(function btnCut() {
    return {
      hint: 'Cut element',
      icon: 'browser-cut',
    };
  }),

  btnDelete: computed(function btnDelete() {
    return {
      hint: 'Delete element',
      icon: 'browser-delete',
    };
  }),

  btnDistribution: computed(function btnDistribution() {
    return {
      hint: 'Show data distribution',
      icon: 'browser-distribution',
    };
  }),

  btnUpload: computed(function btnUpload() {
    return {
      hint: 'Upload files',
      icon: 'browser-upload',
    };
  }),

  buttons: collect(
    'btnNewDir',
    'btnShare',
    'btnMetadata',
    'btnInfo',
    'btnRename',
    'btnPermissions',
    'btnCopy',
    'btnCut',
    'btnDelete',
    'btnDistribution',
    'btnUpload',
  ),

  actions: {
    buttonClicked(buttonId) {
      this.get('buttonClicked')(buttonId);
    },
  },
});
