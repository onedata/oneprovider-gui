import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';

// FIXME:
export default Component.extend({
  open: false,

  dataset: undefined,

  onHide: notImplementedIgnore,

  onArchiveCreate: notImplementedReject,

  actions: {
    hide() {
      this.get('onHide')();
    },
    submit(archiveData) {
      const {
        onArchiveCreate,
        dataset,
      } = this.getProperties('onArchiveCreate', 'dataset');
      return onArchiveCreate(dataset, archiveData);
    },
  },
});
