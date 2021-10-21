import Service, { inject as service } from '@ember/service';
import { FilesViewContextFactory } from 'oneprovider-gui/utils/files-view-context';
import { get } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Service.extend({
  fileManager: service(),
  appProxy: service(),

  async resolveViewOptions({
    dirId,
    currentFilesViewContext,
    selectedIds = [],
    scope = 'private',
    fallbackDir = null,
  }) {
    if (!dirId) {
      return this.generateFallbackResponse(fallbackDir);
    }
    const fileManager = this.get('fileManager');
    const dir = await fileManager.getFileById(dirId, scope);
    if (dir) {
      return this.resolveForDir(dir, currentFilesViewContext);
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
          return this.resolveForDir(parent, currentFilesViewContext);
        } catch (firstSelectedGetError) {
          return this.generateFallbackResponse(fallbackDir);
        }
      }
    }
  },

  async resolveForDir(dir, currentFilesViewContext) {
    const {
      appProxy,
      filesViewContextFactory,
    } = this.getProperties('appProxy', 'filesViewContextFactory');
    const filesViewContext = await filesViewContextFactory.createFromFile(dir);
    if (filesViewContext.isEqual(currentFilesViewContext)) {
      return { result: 'resolve', dir };
    } else {
      const dirId = get(dir, 'entityId');
      let url;
      if (get(filesViewContext, 'browserType') === 'archive') {
        url = appProxy.callParent('getDatasetsUrl', {
          datasetId: get(filesViewContext, 'datasetId'),
          archive: get(filesViewContext, 'archiveId'),
          dir: dirId,
        });
      } else {
        url = appProxy.callParent('getDataUrl', {
          fileId: dirId,
        });
      }
      return { result: 'redirect', url };
    }
  },

  generateFallbackResponse(fallbackDir) {
    return { result: 'resolve', dir: fallbackDir };
  },

  /**
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
});
