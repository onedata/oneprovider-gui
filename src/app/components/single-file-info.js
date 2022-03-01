/**
 * A large file/directory icon with basic file information for use mainly in modals
 *
 * @module components/single-file-info
 * @author Jakub Liput
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { conditional, equal, raw, promise } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { computed, getProperties } from '@ember/object';
import FileArchiveInfo from 'oneprovider-gui/utils/file-archive-info';
import { hash as hashFulfilled } from 'rsvp';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['row', 'row-single-file-info', 'single-file-info'],

  appProxy: service('appProxy'),
  parentAppNavigation: service('parentAppNavigation'),

  /**
   * @override
   */
  i18nPrefix: 'components.singleFileInfo',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual optional
   * @type {boolean}
   */
  showArchiveInfo: false,

  /**
   * What to show in primary description line:
   * - name: just a name of the file
   * - link: render anchor with path to file
   * @virtual
   * @type {'name'|'link'}
   */
  nameDisplayMode: 'name',

  /**
   * @virtual optional
   * @type {(MouseEvent) => void}
   */
  onLinkClicked: notImplementedIgnore,

  /**
   * Frame name, where Onezone link should be opened
   * @type {String}
   */
  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  fileName: reads('file.name'),

  fileSize: reads('file.size'),

  fileIcon: conditional(
    equal('file.type', raw('dir')),
    raw('browser-directory'),
    raw('browser-file')
  ),

  archiveInfoProxy: promise.object(computed(
    'showArchiveInfo',
    'file',
    async function archiveInfoProxy() {
      const {
        showArchiveInfo,
        file,
      } = this.getProperties('showArchiveInfo', 'file');
      if (!showArchiveInfo) {
        return;
      }
      const fileArchiveInfo = FileArchiveInfo.create({ ownerSource: this, file });
      const {
        isInArchiveProxy: isInArchive,
        browsableDatasetProxy: dataset,
        browsableArchiveProxy: archive,
        datasetUrlProxy: datasetUrl,
        archiveUrlProxy: archiveUrl,
      } = await hashFulfilled(getProperties(
        fileArchiveInfo,
        'isInArchiveProxy',
        'browsableDatasetProxy',
        'browsableArchiveProxy',
        'datasetUrlProxy',
        'archiveUrlProxy',
      ));
      if (!isInArchive) {
        return;
      }
      return {
        dataset,
        archive,
        datasetUrl,
        archiveUrl,
      };
    }
  )),

  archiveInfo: reads('archiveInfoProxy.content'),

  actions: {
    linkClicked(event) {
      const onLinkClicked = this.get('onLinkClicked');
      onLinkClicked(event);
    },
  },
});
