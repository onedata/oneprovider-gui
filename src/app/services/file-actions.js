import Service from '@ember/service';
import { computed } from '@ember/object';
import { collect } from '@ember/object/computed';

export default Service.extend({
  btnNewDir: computed(function btnNewDir() {
    return {
      action: () => {},
      title: 'Create new directory',
      icon: 'browser-new-directory',
    };
  }),

  btnShare: computed(function btnShare() {
    return {
      action: () => {},
      title: 'Share element',
      icon: 'browser-share',
    };
  }),

  btnMetadata: computed(function btnMetadata() {
    return {
      action: () => {},
      title: 'Show element metadata',
      icon: 'browser-metadata',
    };
  }),

  btnInfo: computed(function btnInfo() {
    return {
      action: () => {},
      title: 'Show element info',
      icon: 'browser-info',
    };
  }),

  btnRename: computed(function btnRename() {
    return {
      action: () => {},
      title: 'Rename element',
      icon: 'browser-rename',
    };
  }),

  btnPermissions: computed(function btnPermissions() {
    return {
      action: () => {},
      title: 'Show element permissions',
      icon: 'browser-permissions',
    };
  }),

  btnCopy: computed(function btnCopy() {
    return {
      action: () => {},
      title: 'Copy element',
      icon: 'browser-copy',
    };
  }),

  btnCut: computed(function btnCut() {
    return {
      action: () => {},
      title: 'Cut element',
      icon: 'browser-cut',
    };
  }),

  btnDelete: computed(function btnDelete() {
    return {
      action: () => {},
      title: 'Delete element',
      icon: 'browser-delete',
    };
  }),

  btnDistribution: computed(function btnDistribution() {
    return {
      action: () => {},
      title: 'Show data distribution',
      icon: 'browser-distribution',
    };
  }),

  btnUpload: computed(function btnUpload() {
    return {
      action: () => {},
      title: 'Upload files',
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
});
