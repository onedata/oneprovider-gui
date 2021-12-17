/**
 * A global point to resolve options or URL for displaying a file browser for given
 * directory or selected files.
 *
 * Directory view can be requested from already opened file browser view (eg. by changing
 * URL), so resolve may lead to redirect to another file browser view (eg. trying to open
 * directory placed in some archive should lead to redirect to proper archive browser).
 *
 * @module services/files-view-resolver
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { FilesViewContextFactory } from 'oneprovider-gui/utils/files-view-context';
import { get } from '@ember/object';
import { isEmpty } from '@ember/utils';

/**
 * Information what directory should be loaded in current file browser or where to
 * redirect to reach desired directory view.
 * @typedef Object ViewOptions
 * @property {String} result what action should be taken in file browser view, one of:
 *  - `resolve` - a directory record from `dir` property should be opened as current dir
 *  - `redirect` - other browser should be opened using `url` property
 * @property {Utils.FilesViewContext} filesViewContext a files view context computed
 *   for desired browsr view
 * @property {Models.File} [dir] a dir-type file to open as current dir in current browser
 *   view, only if result` equals `'resolve'`
 * @property {String} [url] a URL to load to display desired browser view; only if
 *  `result` equals `'redirect'`
 */

export default Service.extend({
  fileManager: service(),
  appProxy: service(),

  /**
   * Initialized on init if undefined.
   * @type {Utils.FilesViewContextFactory}
   */
  filesViewContextFactory: undefined,

  init() {
    this._super(...arguments);
    if (!this.get('filesViewContextFactory')) {
      this.set(
        'filesViewContextFactory',
        FilesViewContextFactory.create({ ownerSource: this })
      );
    }
  },

  /**
   * Invoked in already opened browser view, resolves directory to open or redirect URL
   * to another browser view based on desired directory and/or selected files IDs.
   * @param {Object} options
   * @param {String} options.dirId desired directory ID to open
   * @param {Utils.FilesViewContext} options.currentFilesViewContext context computed for
   *   currently opened directory in file browser
   * @param {Array<String>} [options.selectedIds] desired files IDs to select in view
   * @param {String} [options.scope='private'] GS scope for fetching files
   * @param {Utils.File} options.fallbackDir a dir-type file that will be resolved if dir
   *   for context cannot be resolved or is invalid
   * @returns {ViewOptions}
   */
  async resolveViewOptions({
    dirId,
    currentFilesViewContext,
    selectedIds = [],
    scope = 'private',
    fallbackDir = null,
  }) {
    const fileManager = this.get('fileManager');
    const file = dirId && await fileManager.getFileById(dirId, scope);
    if (file) {
      let dir;
      const fileType = get(file, 'type');
      if (fileType !== 'dir') {
        if (fileType === 'symlink' && get(file, 'effFile.type') === 'dir') {
          // a directory symlink is shown as a dir (not its effective dir!)
          dir = file;
        } else {
          try {
            dir = await get(file, 'parent');
          } catch (error) {
            return this.generateFallbackResponse(fallbackDir);
          }
          if (!dir) {
            return this.generateFallbackResponse(fallbackDir);
          }
        }
      } else {
        dir = file;
      }
      // the currentFilesViewContext can be ommited to force resolving dir
      if (currentFilesViewContext) {
        return this.resolveForDir(dir, currentFilesViewContext, fallbackDir, selectedIds);
      } else {
        return { result: 'resolve', dir };
      }
    } else {
      if (isEmpty(selectedIds)) {
        return this.generateFallbackResponse(fallbackDir);
      } else {
        try {
          const firstSelectedFile = await fileManager.getFileById(selectedIds[0], scope);
          const parent = await get(firstSelectedFile, 'parent');
          if (!parent) {
            return this.generateFallbackResponse(fallbackDir);
          }
          // the currentFilesViewContext can be ommited to force resolving dir
          if (currentFilesViewContext) {
            return this.resolveForDir(
              parent,
              currentFilesViewContext,
              fallbackDir,
              selectedIds
            );
          } else {
            return { result: 'resolve', dir: parent };
          }
        } catch (firstSelectedGetError) {
          return this.generateFallbackResponse(fallbackDir);
        }
      }
    }
  },

  /**
   *
   * @param {Models.File} dir
   * @param {FilesViewContextFactory} currentFilesViewContext currently opened context
   * @param {Models.File} fallbackDir
   * @param {Array<String>} [selectedIds] array of file IDs that should be selected in
   *   generated URL
   * @returns {Promise<Object>} see format of object returned by `resolveViewOptions`
   */
  async resolveForDir(dir, currentFilesViewContext, fallbackDir, selectedIds) {
    const filesViewContextFactory = this.get('filesViewContextFactory');
    const filesViewContext = await filesViewContextFactory.createFromFile(dir);
    if (
      get(filesViewContext, 'isSpecialHiddenDir') &&
      get(filesViewContext, 'archiveId') === null
    ) {
      // special case - directory that should not be opened
      return this.generateFallbackResponse(fallbackDir);
    } else if (filesViewContext.isEqual(currentFilesViewContext)) {
      return { result: 'resolve', dir, filesViewContext };
    } else {
      const url = this.generateUrl(
        filesViewContext,
        'open', {
          selected: isEmpty(selectedIds) ? null : selectedIds,
        });
      if (url) {
        return { result: 'redirect', url, filesViewContext };
      } else {
        // currently requesting shared dir from other view is not supported, fallback
        // also use fallback when `filesViewContext` is of unknown type
        return this.generateFallbackResponse(fallbackDir);
      }
    }
  },

  async resolveDir() {

  },

  async generateFallbackResponse(fallbackDir) {
    const filesViewContextFactory = this.get('filesViewContextFactory');
    const filesViewContext = fallbackDir &&
      await filesViewContextFactory.createFromFile(fallbackDir);
    return { result: 'resolve', dir: fallbackDir, filesViewContext };
  },

  /**
   * @param {FilesViewContext} filesViewContext
   * @param {String} [type='select'] one of:
   *   - select - file from context is selected in view, the parent is opened
   *   - open - file from context must be a dir, and it is opened as current dir
   * @param {Object} [urlOptions={}] override options passed to function generating URL
   * @returns {String|null}
   */
  generateUrl(filesViewContext, type = 'select', urlOptions = {}) {
    const appProxy = this.get('appProxy');
    const fileId = get(filesViewContext, 'file.entityId');
    let url = null;
    switch (get(filesViewContext, 'browserType')) {
      case 'archive': {
        const archiveUrlOptions = Object.assign({}, urlOptions);
        if (!isEmpty(archiveUrlOptions.selected)) {
          archiveUrlOptions.selectedFiles = archiveUrlOptions.selected;
        }
        delete archiveUrlOptions.selected;
        archiveUrlOptions.selectedDatasets = [get(filesViewContext, 'datasetId')];
        const options = Object.assign({
            archive: get(filesViewContext, 'archiveId'),
            dir: type === 'open' ? fileId : null,
            selectedFiles: type === 'select' ? [fileId] : null,
          },
          archiveUrlOptions
        );
        url = appProxy.callParent('getDatasetsUrl', options);
        break;
      }
      case 'space': {
        const options = Object.assign({
          fileId: type === 'open' ? fileId : null,
          selected: type === 'select' ? [fileId] : null,
        }, urlOptions);
        url = appProxy.callParent('getDataUrl', options);
        break;
      }
      default:
        break;
    }
    return url;
  },

  async generateUrlById(fileId, type) {
    const factory = FilesViewContextFactory.create({ ownerSource: this });
    const filesViewContext = await factory.createFromFileId(fileId);
    return this.generateUrl(filesViewContext, type);
  },
});
