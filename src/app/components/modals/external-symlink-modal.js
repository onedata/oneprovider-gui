/**
 * Show information about symlink of file or directory that targets outside browsed
 * context, especially from archive to regular space.
 *
 * @module components/modals/external-symlink-modal
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { or, raw } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import isNewTabRequestEvent from 'onedata-gui-common/utils/is-new-tab-request-event';

/**
 * @typedef {Object} ExternalSymlinkModalOptions
 * @property {Models.File} symlinkfile
 * @property {Utils.FilesViewContext} targetFileContext
 * @property {(file: Models.File) => Promise} onDownloadFile
 * @property {() => void} onClose
 * @property {() => void} onDirectoryChanged
 * @property {string} [currentContextType='archive']
 */

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.externalSymlinkModal',

  filesViewResolver: service(),
  parentAppNavigation: service(),

  /**
   * @virtual
   * @type {String}
   */
  modalId: undefined,

  /**
   * For particular properties description see descripion of this class properties
   * matching `modalOptions` properties.
   * @virtual
   * @type {ExternalSymlinkModalOptions}
   */
  modalOptions: undefined,

  /**
   * @type {ComputedProperty<Models.File>}
   */
  symlinkFile: reads('modalOptions.symlinkFile'),

  /**
   * @type {ComputedProperty<Utils.FilesViewContext>}
   */
  targetFileContext: reads('modalOptions.targetFileContext'),

  /**
   * When presenting information about external target of symlink we want to inform user
   * that it leads outside some context. Eg. it is browsed archive (symlinks can point
   * outside archive to other archive or outside datasets).
   * Currently only "archive" context type is supported, but the context type is
   * introduced to be flexible when a need for leaving other context using symlink occurs.
   * @type {ComputedProperty<'archive'>}
   */
  currentContextType: or('modalOptions.currentContextType', raw('archive')),

  /**
   * See `ExternalSymlinkModalOptions.onDownloadFile`
   */
  onDownloadFile: or('modalOptions.onDownloadFile', notImplementedReject),

  /**
   * See `ExternalSymlinkModalOptions.onClose`
   */
  onClose: or('modalOptions.onClose', notImplementedIgnore),

  /**
   * See `ExternalSymlinkModalOptions.onDirectoryChanged`
   */
  onDirectoryChanged: or('modalOptions.onDirectoryChanged', notImplementedIgnore),

  /**
   * @type {ComputedProperty<Models.File>}
   */
  effFile: reads('symlinkFile.effFile'),

  /**
   * @type {ComputedProperty<string>}
   */
  effFileType: reads('effFile.type'),

  openDirectory() {
    const {
      globalNotify,
      targetFileContext,
      filesViewResolver,
      parentAppNavigation,
      onClose,
      onDirectoryChanged,
    } = this.getProperties(
      'globalNotify',
      'targetFileContext',
      'filesViewResolver',
      'parentAppNavigation',
      'onClose',
      'onDirectoryChanged',
    );
    try {
      const url = filesViewResolver.generateUrl(targetFileContext, 'open');
      parentAppNavigation.openUrl(url);
      onClose();
      onDirectoryChanged();
    } catch (error) {
      globalNotify.backendError(this.t('changingDirectory'), error);
    }
  },

  async downloadFile() {
    const {
      globalNotify,
      onDownloadFile,
      onClose,
      effFile,
    } = this.getProperties(
      'globalNotify',
      'onDownloadFile',
      'onClose',
      'effFile',
    );
    try {
      await onDownloadFile(effFile);
    } catch (error) {
      globalNotify.backendError(this.t('preparingDownload'), error);
      throw error;
    }
    onClose();
  },

  actions: {
    async open() {
      const effFileType = this.get('effFileType');
      if (effFileType === 'dir') {
        await this.openDirectory();
      } else if (effFileType === 'file') {
        await this.downloadFile();
      }
    },
    fileLinkClicked(event) {
      event.stopPropagation();
      const isNewTabRequest = isNewTabRequestEvent(event);
      if (!isNewTabRequest) {
        const {
          onClose,
          onDirectoryChanged,
        } = this.getProperties('onClose', 'onDirectoryChanged');
        onClose();
        onDirectoryChanged();
      }
    },
  },
});
