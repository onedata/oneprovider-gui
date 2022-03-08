// FIXME: jsdoc

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { validArchiveStates } from 'oneprovider-gui/models/archive';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  i18nPrefix: 'components.archiveFilesystemBrowser.fileFeaturesExtension',

  i18n: service(),

  // FIXME: jsdoc
  browserModel: undefined,
  item: undefined,
  displayedState: undefined,
  onChangeTagHover: undefined,

  inheritedIcon: 'inheritance',

  archive: reads('browserModel.archive'),

  // FIXME: maybe do not use these disabled flags

  effArchiveCreatingDisabled: false,

  effArchiveFailedDisabled: false,

  creatingStateLabel: computed('archive.state', function stateLabel() {
    const archiveState = this.get('archive.state');
    if (validArchiveStates.includes(archiveState)) {
      return this.t(`state.${archiveState}`);
    } else {
      return this.t('state.unknown');
    }
  }),

  actions: {
    changeTagHover(tag, hovered) {
      this.get('onChangeTagHover')(tag, hovered);
    },
  },
});
