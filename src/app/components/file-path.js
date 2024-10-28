/**
 * Renders path to browsable file (eg. file) taking archive membership into account.
 * The path is shortened if its too long to fit into container - to achieve it,
 * this is a block element, so it is recommended to render it in a flex container.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, observer, get, getProperties, set } from '@ember/object';
import { reads, mapBy } from '@ember/object/computed';
import { FilesViewContextFactory } from 'oneprovider-gui/utils/files-view-context';
import pathShorten from 'oneprovider-gui/utils/path-shorten';
import WindowResizeHandler from 'onedata-gui-common/mixins/components/window-resize-handler';
import { debounce } from '@ember/runloop';
import { promise, lte, or, equal } from 'ember-awesome-macros';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import { getArchiveRelativeFilePath } from 'oneprovider-gui/utils/file-archive-info';
import { datasetSeparator, directorySeparator, ellipsisString } from 'oneprovider-gui/components/file-path-renderer';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import sleep from 'onedata-gui-common/utils/sleep';
import { race } from 'rsvp';
import globals from 'onedata-gui-common/utils/globals';

const mixins = [
  I18n,
  WindowResizeHandler,
];

export default Component.extend(...mixins, {
  classNames: ['file-path', 'file-path-base'],
  classNameBindings: [
    'hasSinglePathItem:has-single-path-item',
  ],

  i18n: service(),
  filesViewResolver: service(),
  datasetManager: service(),
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filePath',

  /**
   * @type {Models.File}
   * @virtual
   */
  file: undefined,

  /**
   * @type {Function}
   * @virtual optional
   */
  onLinkClicked: undefined,

  /**
   * @type {Function}
   * @virtual optional
   */
  onLinkKeydown: undefined,

  /**
   * Tag name of direct container for path elements
   * @virtual optional
   * @type {String}
   */
  internalTagName: 'a',

  /**
   * Custom shortened path tooltip text.
   * Can be useful if file-path has some additional template block.
   * @type {String}
   */
  customTip: '',

  /**
   * Anchor target attribute.
   * @type {String}
   */
  target: '_top',

  /**
   * Classname added to internal `<a>` element.
   * @type {String}
   */
  anchorClassName: 'navy underlined',

  displayedPathItemsCount: Number.MAX_SAFE_INTEGER,

  /**
   * State of number of renders that are invoked one-after-another.
   * See `batchRenderLimit` property for details.
   * @type {number}
   */
  batchRenderCount: 0,

  /**
   * Max number of renders that are invoked one-after-another.
   * Ember has limit of scheduled rerenders without "settling" (see:
   * https://github.com/emberjs/ember.js/blob/master/packages/@ember/-internals/environment/lib/env.ts#L146)
   * so we need to defer next the render after reaching the limit.
   *
   * In Ember 3.12.0 - 5.3.0, the limit is set to 1000:
   * - https://github.com/emberjs/ember.js/blob/v3.12.0/packages/@ember/-internals/environment/lib/env.ts#L140
   * - https://github.com/emberjs/ember.js/blob/v5.3.0/packages/@ember/-internals/environment/lib/env.ts#L156
   *
   * The limit is used in `didRender`.
   * Please examine the limit after Ember update (5.3+) to make it larger.
   * @type {number}
   */
  batchRenderLimit: 1000,

  /**
   * If set to true - do not invoke updateView after didRender, which is done to adjust
   * length of the path. This procedure needs to be locked because of Ember limitations.
   * @type {boolean}
   */
  ignoreRenderRepeat: false,

  /**
   * Indicates that path length needs adjustments on next render.
   * If this flag is set to true, `didRender` will invoke path length adjustment.
   * @type {Boolean}
   */
  adjustmentNeeded: false,

  //#region asynchronous data

  filePathProxy: promise.object(computed('file', async function filePathProxy() {
    return await resolveFilePath(this.file);
  })),

  filesViewContextProxy: promise.object(computed('file', function filesViewContext() {
    const file = this.get('file');
    return FilesViewContextFactory.create({ ownerSource: this }).createFromFile(file);
  })),

  fontProxy: promise.object(computed('element', async function fontProxy() {
    if (!this.element) {
      await waitForRender();
    }
    const styleDeclaration = globals.window.getComputedStyle(this.element);
    const font = styleDeclaration.font;
    const fontLoadPromise = globals.document.fonts.load(font);
    const timeoutPromise = sleep(3000);
    // Wait either for font load settled (no matter if it fulfilled or rejected)
    // or timeout occurred. Ignore font load error with catch.
    try {
      await race([fontLoadPromise, timeoutPromise]);
    } catch {
      // Font load error is completely ignored - error logs are available in console or
      // network inspector.
    }
  })),

  allPathItemsProxy: promise.array(computed(
    'filePathProxy',
    'filesViewContextProxy',
    async function allPathItemsProxy() {
      const {
        datasetManager,
        archiveManager,
        filesViewContextProxy,
        filePathProxy,
      } = this.getProperties(
        'datasetManager',
        'archiveManager',
        'filesViewContextProxy',
        'filePathProxy',
      );
      let remainFiles = Array.from(
        get(filePathProxy, 'content') || await filePathProxy
      );
      const result = [];
      const {
        spaceId,
        datasetId,
        archiveId,
      } = getProperties(await filesViewContextProxy, 'spaceId', 'datasetId', 'archiveId');
      if (datasetId && archiveId) {
        const browsableDataset = await datasetManager.getBrowsableDataset(datasetId);
        const browsableArchive = await archiveManager.getBrowsableArchive(archiveId);
        result.push({
          itemType: 'dataset',
          icon: get(browsableDataset, 'rootFileType') === 'file' ?
            'browser-dataset-file' : 'browser-dataset',
          record: browsableDataset,
        });
        result.push({
          itemType: 'archive',
          icon: 'browser-archive',
          record: browsableArchive,
          separator: datasetSeparator,
        });
        // remove special directories from path
        remainFiles = getArchiveRelativeFilePath(remainFiles);
      } else if (spaceId) {
        const spaceRootDir = remainFiles[0];
        remainFiles.splice(0, 1);
        result.push({
          itemType: 'space',
          icon: 'space',
          record: spaceRootDir,
        });
      }
      const regularItems = remainFiles.map(file => {
        return {
          itemType: 'file',
          separator: directorySeparator,
          record: file,
        };
      });
      result.push(...regularItems);
      return result;
    }
  )),

  //#endregion

  hasSinglePathItem: equal('displayedPathItemsCount', 1),

  requiredDataProxy: promise.object(promise.all(
    'allItemsProxy',
    'filesViewContextProxy',
    'fontProxy',
  )),

  isLoading: reads('requiredDataProxy.isPending'),

  isError: reads('requiredDataProxy.isRejected'),

  filesViewContext: reads('filesViewContextProxy.content'),

  allPathItems: reads('allPathItemsProxy.content'),

  /**
   * @type {ComputedProperty<Array<FilePathItem>>}
   */
  displayedPathItems: computed(
    'allPathItems.[]',
    'displayedPathItemsCount',
    function displayedPathItems() {
      const {
        allPathItems,
        displayedPathItemsCount,
      } = this.getProperties('allPathItems', 'displayedPathItemsCount');
      if (!allPathItems) {
        return [];
      }
      const shortenedPath = pathShorten(
        allPathItems, {
          itemType: 'ellipsis',
          separator: directorySeparator,
          record: { name: ellipsisString },
        },
        displayedPathItemsCount
      );
      if (shortenedPath.length) {
        set(shortenedPath[0], 'className', 'path-item-first');
        set(shortenedPath[shortenedPath.length - 1], 'className', 'path-item-last');
      }
      return shortenedPath;
    }
  ),

  stringifiedPath: computed('allPathItems', 'allNames.[]', function stringifiedPath() {
    const allPathItems = this.get('allPathItems');
    if (!allPathItems) {
      return;
    }
    const records = allPathItems.filterBy('record').mapBy('record');
    return stringifyFilePath(records);
  }),

  tooltipText: or('customTip', 'stringifiedPath'),

  href: computed('file', 'filesViewContext', function href() {
    const {
      file,
      filesViewContext,
      filesViewResolver,
    } = this.getProperties('file', 'filesViewContext', 'filesViewResolver');
    if (!file || !filesViewContext) {
      return null;
    }
    return filesViewResolver.generateUrl(filesViewContext, 'select');
  }),

  renderTooltip: lte('displayedPathItemsCount', 'allPathItems.length'),

  allRecords: mapBy('allPathItems', 'record'),

  allNames: mapBy('allRecords', 'name'),

  allPathItemsObserver: observer('allPathItems.length', function allPathItemsObserver() {
    this.resetDisplayedPathItemsCount();
  }),

  // TODO: VFS-8581 if path is made longer, the shortening is not done properly
  displayedPathItemsObserver: observer(
    'displayedPathItems.[]',
    'allNames.[]',
    function displayedPathItemsObserver() {
      let countDiff;
      if (!this.get('adjustmentNeeded')) {
        countDiff = this.resetDisplayedPathItemsCount();
      }
      this.set('adjustmentNeeded', true);
      if (countDiff && countDiff < 0) {
        this.scheduleUpdateView();
      }
    }
  ),

  /**
   * @override
   * @param {TransitionEvent|UIEvent} event
   */
  onWindowResize( /** event */ ) {
    if (!this.updatePathWidthInfo().changed) {
      return;
    }
    const countDiff = this.resetDisplayedPathItemsCount();
    this.set('adjustmentNeeded', true);
    if (countDiff < 0) {
      this.scheduleUpdateView();
    }
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    const windowResizeHandler = this.get('windowResizeHandler');
    globals.document.querySelector('body').addEventListener(
      'transitionend',
      windowResizeHandler
    );

    (async () => {
      await this.requiredDataProxy;
      await waitForRender();
      this.displayedPathItemsObserver();
    })();
  },

  /**
   * @override
   */
  willDestroyElement() {
    this._super(...arguments);
    const windowResizeHandler = this.get('windowResizeHandler');
    globals.document.querySelector('body').removeEventListener(
      'transitionend',
      windowResizeHandler
    );
  },

  /**
   * @override
   */
  didRender() {
    this._super(...arguments);
    if (this.ignoreRenderRepeat) {
      return;
    }
    if (this.batchRenderCount > this.batchRenderLimit - 1) {
      this.set('ignoreRenderRepeat', true);
      (async () => {
        await waitForRender();
        if (this.isDestroyed || this.isDestroying) {
          return;
        }
        this.setProperties({
          batchRenderCount: 0,
          ignoreRenderRepeat: false,
        });
        this.updateView();
      })();
    } else {
      this.updateView();
      this.incrementProperty('batchRenderCount');
    }
  },

  /**
   * Should be invoked every time the view of component or its container view changes
   * somehow, eg.
   * - on `didRender` hook, because content of component changed
   * - on window resize
   * - on container size change
   */
  updateView() {
    const {
      element,
      adjustmentNeeded,
    } = this.getProperties('element', 'adjustmentNeeded');
    if (element && adjustmentNeeded) {
      this.adjustItemsCount();
    }
  },

  /**
   * Debounces invocation of `updateView` to allow view settle down before computations
   * or handle multiple events fired at the same time or in very short period.
   */
  scheduleUpdateView() {
    debounce(this, 'updateView', 20);
  },

  resetDisplayedPathItemsCount() {
    if (!this.get('allPathItems')) {
      return;
    }
    const prevValue = this.get('allPathItems.length');
    const newValue = this.set('displayedPathItemsCount', prevValue + 1);
    return prevValue - newValue;
  },

  adjustItemsCount() {
    if (this.isPathOverflow()) {
      const displayedPathItemsCount = this.get('displayedPathItemsCount');
      if (displayedPathItemsCount && displayedPathItemsCount > 1) {
        this.decrementProperty('displayedPathItemsCount');
      } else {
        this.set('adjustmentNeeded', false);
      }
    } else {
      this.set('adjustmentNeeded', false);
    }
  },

  isPathOverflow() {
    const {
      pathWidth,
      pathContainerWidth,
    } = this.updatePathWidthInfo();
    return pathWidth && pathWidth > pathContainerWidth || false;
  },

  updatePathWidthInfo() {
    const element = this.get('element');
    if (!element) {
      return {
        pathWidth: 0,
        pathContainerWidth: 0,
        changed: false,
      };
    }
    const pathContainer = element.querySelector('.path-container');
    const path = pathContainer.querySelector('.path');
    const pathWidth = path && path.clientWidth || 0;
    const pathContainerWidth = pathContainer.clientWidth;
    const changed = this.get('lastPathWidth') !== pathWidth ||
      this.get('lastPathContainerWidth') !== pathContainerWidth;
    if (changed) {
      this.setProperties({
        lastPathWidth: pathWidth,
        lastPathContainerWidth: pathContainerWidth,
      });
    }
    return {
      pathWidth,
      pathContainerWidth,
      changed,
    };
  },
});
