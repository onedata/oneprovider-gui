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
          return this.resolveForDir(parent, currentFilesViewContext, fallbackDir);
        } catch (firstSelectedGetError) {
          return this.generateFallbackResponse(fallbackDir);
        }
      }
    }
  },

  async resolveForDir(dir, currentFilesViewContext, fallbackDir) {
    const filesViewContextFactory = this.get('filesViewContextFactory');
    const filesViewContext = await filesViewContextFactory.createFromFile(dir);
    if (filesViewContext.isEqual(currentFilesViewContext)) {
      return { result: 'resolve', dir, filesViewContext };
    } else {
      const url = this.generateUrl(filesViewContext, 'open');
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
   * @param {String} [type] one of:
   *   - select - file from context is selected in view, the parent is opened *
   *   - open - file from context must be a dir, and it is opened as current dir
   * @returns {String|null}
   */
  generateUrl(filesViewContext, type = 'select') {
    const appProxy = this.get('appProxy');
    const fileId = get(filesViewContext, 'file.entityId');
    let url = null;
    switch (get(filesViewContext, 'browserType')) {
      case 'archive':
        url = appProxy.callParent('getDatasetsUrl', {
          datasetId: get(filesViewContext, 'datasetId'),
          archive: get(filesViewContext, 'archiveId'),
          dir: type === 'open' ? fileId : null,
          selected: type === 'select' ? [fileId] : null,
          viewMode: 'files',
        });
        break;
      case 'space':
        url = appProxy.callParent('getDataUrl', {
          fileId: type === 'open' ? fileId : null,
          selected: type === 'select' ? [fileId] : null,
        });
        break;
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
