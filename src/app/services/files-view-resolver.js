import Service, { inject as service } from '@ember/service';
import { FilesViewContextFactory } from 'oneprovider-gui/utils/files-view-context';
import { get } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Service.extend({
  fileManager: service(),
  appProxy: service(),

  /**
   * Initialized on init if undefined.
   * @type {Utils.FilesViewContextFactory}
   */
  filesViewContextFactory: undefined,

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
      return this.resolveForDir(dir, currentFilesViewContext, fallbackDir);
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
          return this.resolveForDir(
            parent,
            currentFilesViewContext,
            fallbackDir,
            selectedIds
          );
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
   * @param {Array<String>} selectedIds array of file IDs that should be selected in
   *   generated URL
   * @returns {Promise<Object>} see format of object returned by `resolveViewOptions`
   */
  async resolveForDir(dir, currentFilesViewContext, fallbackDir, selectedIds) {
    const filesViewContextFactory = this.get('filesViewContextFactory');
    const filesViewContext = await filesViewContextFactory.createFromFile(dir);
    if (filesViewContext.isEqual(currentFilesViewContext)) {
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

  async generateFallbackResponse(fallbackDir) {
    const filesViewContextFactory = this.get('filesViewContextFactory');
    const filesViewContext = await filesViewContextFactory.createFromFile(fallbackDir);
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
        const options = Object.assign({
          datasetId: get(filesViewContext, 'datasetId'),
          archive: get(filesViewContext, 'archiveId'),
          dir: type === 'open' ? fileId : null,
          selected: type === 'select' ? [fileId] : null,
          viewMode: 'files',
        }, urlOptions);
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

  init() {
    this._super(...arguments);
    if (!this.get('filesViewContextFactory')) {
      this.set(
        'filesViewContextFactory',
        FilesViewContextFactory.create({ ownerSource: this })
      );
    }
  },
});
