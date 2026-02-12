/**
 * A large file/directory icon with basic file information for use mainly in modals
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2023 ACK CYFRONET AGH
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { conditional, equal, raw, promise, eq, or, and } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { computed, getProperties } from '@ember/object';
import FileArchiveInfo from 'oneprovider-gui/utils/file-archive-info';
import { hash as hashFulfilled } from 'rsvp';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import FileConsumerMixin, { computedSingleUsedFileGri } from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import FileModel from 'oneprovider-gui/models/file';

const mixins = [
  I18n,
  FileConsumerMixin,
];

export default Component.extend(...mixins, {
  classNames: ['single-file-info', 'details-with-icon'],

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
   *
   * The mode is ignored if the `nameComponent` is used, because we render a custom
   * component in place of the name.
   *
   * @virtual optional
   * @type {'name'|'link'}
   */
  nameDisplayMode: 'name',

  /**
   * A component path that will be rendered in place where the name will be displayed.
   * The component will be rendered with the following arguments:
   * - `file` - this.file
   * - `context` - this.nameComponentContext
   * @virtual optional
   * @type {string}
   */
  nameComponent: null,

  /**
   * Data passed to the `nameComponent` (if provided) using the `context` argument.
   * @virtual optional
   * @type {Object}
   */
  nameComponentContext: null,

  /**
   * @virtual optional
   * @type {(MouseEvent) => void}
   */
  onLinkClicked: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {boolean}
   */
  emptySizeShown: false,

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('file', function fileRequirements() {
    if (!(this.file instanceof FileModel)) {
      return [];
    }
    return [
      // TODO: VFS-11449 optional file size fetch
      new FileRequirement({
        fileGri: this.get('file.id'),
        properties: ['mtime'],
      }),
    ];
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computedSingleUsedFileGri('file'),

  /**
   * Frame name, where Onezone link should be opened
   * @type {String}
   */
  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  fileName: reads('file.name'),

  effFile: reads('file.effFile'),

  effFileType: reads('effFile.type'),

  effFileSize: reads('effFile.size'),

  mtime: reads('file.mtime'),

  isSizeShown: or(
    eq('effFileType', raw(LegacyFileType.Regular)),
    and(
      eq('effFileType', raw(LegacyFileType.Directory)),
      computed('effFileSize', function isSizeNumeric() {
        return typeof this.effFileSize === 'number';
      })
    ),
  ),

  fileIcon: conditional(
    equal('effFileType', raw('dir')),
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
