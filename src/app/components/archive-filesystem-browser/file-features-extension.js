/**
 * Adds file features suitable for files inside archive.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';
import { validArchiveStates } from 'oneprovider-gui/models/archive';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  i18nPrefix: 'components.archiveFilesystemBrowser.fileFeaturesExtension',

  i18n: service(),

  /**
   * @virtual
   * @type {Utils.ArchiveFilesystemBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual
   * @type {Utils.FileInArchive}
   */
  item: undefined,

  /**
   * @virtual
   * @type {EmberObject}
   *   see `components/file-browser/item-features-container#displayedState`
   */
  displayedState: undefined,

  /**
   * @virtual
   * @type {(tag, isHovered) => void}
   */
  onChangeTagHover: undefined,

  inheritedIcon: 'inheritance',

  /**
   * @type {ComputedProperty<Models.Archive}
   */
  archive: reads('browserModel.archive'),

  creatingStateLabel: computed('archive.state', function creatingStateLabel() {
    const archiveState = this.get('archive.state');
    if (validArchiveStates.includes(archiveState)) {
      return this.t(`state.${archiveState}`);
    } else {
      return this.t('state.unknown');
    }
  }),

  actions: {
    changeTagHover(tag, hovered) {
      const onChangeTagHover = this.get('onChangeTagHover');
      if (onChangeTagHover) {
        onChangeTagHover(tag, hovered);
      }
    },
  },
});
