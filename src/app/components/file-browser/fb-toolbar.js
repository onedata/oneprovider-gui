import Component from '@ember/component';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend({
  classNames: ['fb-toolbar'],

  fileActions: service(),

  dir: undefined,

  buttonClicked: notImplementedReject,

  // TODO: title should be a translation key, when rendered, it will get
  // name of element: directory, directories, file, files, elements or current directory
  // To avoid using "element"

  buttons: reads('fileActions.buttons'),

  actions: {
    buttonClicked(buttonId) {
      this.get('buttonClicked')(buttonId);
    },
  },
});
