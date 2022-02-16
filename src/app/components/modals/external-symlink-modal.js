/**
 * FIXME: jsdoc
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
   * @type {Object}
   * @property {Models.File} symlinkfile
   * @property {Utils.FilesViewContext} targetFileContext
   * @property {string} [currentContextType='archive']
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
   * @type {ComputedProperty<Models.File>}
   */
  effFile: reads('symlinkFile.effFile'),

  /**
   * @type {ComputedProperty<string>}
   */
  effFileType: reads('effFile.type'),

  // FIXME: onClose when we are in datasets panel, hide a panel

  openDirectory() {
    const {
      targetFileContext,
      filesViewResolver,
      parentAppNavigation,
    } = this.getProperties(
      'targetFileContext',
      'filesViewResolver',
      'parentAppNavigation',
    );
    const url = filesViewResolver.generateUrl(targetFileContext, 'open');
    parentAppNavigation.openUrl(url);
  },

  downloadFile() {
    // FIXME: implement
  },

  actions: {
    open() {
      const effFileType = this.get('effFileType');
      if (effFileType === 'dir') {
        this.openDirectory();
      } else if (effFileType === 'file') {
        this.downloadFile();
      }
    },
  },
});
