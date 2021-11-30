/**
 * An auto-collapsible path to selected dir.
 *
 * @module components/file-browser/fb-breadcrumbs
 * @author Jakub Liput
 * @copyright (C) 2019-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { observer, computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { next, later } from '@ember/runloop';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import FileBreadcrumbsItem from 'oneprovider-gui/utils/file-breadcrumbs-item';
import filterBreadcrumbsItems from 'oneprovider-gui/utils/filter-breadcrumbs-items';
import defaultResolveParent from 'oneprovider-gui/utils/default-resolve-parent';
import cutDirsPath from 'oneprovider-gui/utils/cut-dirs-path';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import WindowResizeHandler from 'onedata-gui-common/mixins/components/window-resize-handler';
import { inject as service } from '@ember/service';
import resolveFilePath from 'oneprovider-gui/utils/resolve-file-path';
import { htmlSafe } from '@ember/string';
import { isEmpty } from 'ember-awesome-macros';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import BrowsableArchiveRootDir from 'oneprovider-gui/utils/browsable-archive-root-dir';

/**
 * @type {number}
 * In milliseconds
 */
const recomputePathAnimationDuration = 200;

export default Component.extend(
  I18n,
  WindowResizeHandler,
  createDataProxyMixin('dirPath', { type: 'array' }),
  createDataProxyMixin('breadcrumbsItems', { type: 'array' }),
  createDataProxyMixin('filteredBreadcrumbsItems', { type: 'array' }), {
    classNames: ['fb-breadcrumbs'],

    fileManager: service(),
    archiveManager: service(),
    i18n: service(),

    /**
     * @override
     */
    i18nPrefix: 'components.fileBrowser.fbBreadcrumbs',

    /**
     * @virtual
     * @type {models/File} file model of dir type
     */
    dir: undefined,

    /**
     * @virtual
     * @type {models/File}
     */
    rootDir: undefined,

    /**
     * @virtual
     * @type {Function}
     */
    resolveFileParentFun: defaultResolveParent,

    /**
     * @virtual
     * @type {Function}
     */
    getItemByIdFun: notImplementedReject,

    /**
     * @virtual
     * @type {Function}
     * @param {models/File} dir a File record with directory to change
     */
    changeDir: notImplementedReject,

    /**
     * @virtual
     * @type {Function}
     */
    selectCurrentDir: notImplementedIgnore,

    /**
     * @virtual
     * @type {Array<Object>}
     */
    menuButtons: undefined,

    /**
     * @virtual optional
     * @type {String}
     */
    rootIcon: 'space',

    /**
     * @virtual optional
     * @type {Boolean}
     */
    alwaysShowRootName: false,

    /**
     * If true, add breadcrumbs-recomputing CSS class to breadcrumbs-inner
     * to hide breadcrumbs smoothly for the time of testing its width.
     * @type {boolean}
     */
    breadcrumbsRecomputing: false,

    /**
     * How many breadcrumbs items should be rendered.
     * A special element: (...) is always additionally rendered,
     * so there will be N+1 elements visible.
     * @type {Number}
     */
    elementsToShow: Infinity,

    /**
     * @type {boolean}
     */
    dirActionsOpen: undefined,

    _window: window,

    areItemsEmpty: isEmpty('filteredBreadcrumbsItemsProxy'),

    /**
     * Style assigned to current directory button - needed for truncating.
     * Set in `checkWidth` method.
     * @type {SafeString}
     */
    lastItemStyle: computed(() => htmlSafe('')),

    recomputePath: observer('dir', function recomputePath() {
      this.updateDirPathProxy()
        .then(() => this.updateBreadcrumbsItemsProxy())
        .then(() => this.updateFilteredBreadcrumbsItemsProxy());
    }),

    /**
     * Watch changes on properties that can cause change the width of fb-breadcrumbs.
     * As fb-breadcrumbs-inner can overflow its parent, thus it can have width greater than
     * fb-breadcrumbs, decrement `elementsToShow` count to try to fit fb-breadcrumbs-inner
     * into its container.
     */
    checkWidthObserver: observer(
      'isLoading',
      'breadcrumbsItems.content.[]',
      function checkWidthObserver() {
        this.set('elementsToShow', Infinity);
        next(() => this.checkWidth());
      }
    ),

    autoUpdateFilteredBreadcrumbsItems: observer(
      'breadcrumbsItemsProxy.content.[]',
      function autoUpdateFilteredBreadcrumbsItems() {
        this.updateFilteredBreadcrumbsItemsProxy();
      }
    ),

    isLoading: computed('dirPath.content.@each.name', function isLoading() {
      const dirsPath = this.get('dirPath.content');
      return !dirsPath || !dirsPath.isAny('name');
    }),

    currentItem: reads('breadcrumbsItems.lastObject'),

    init() {
      this._super(...arguments);
      this.updateDirPathProxy();
    },

    didInsertElement() {
      this._super(...arguments);
      this.get('filteredBreadcrumbsItemsProxy').then(() => {
        next(() => this.checkWidth());
      });
    },

    /**
     * @override
     */
    onWindowResize() {
      return this.checkWidthOnResize();
    },

    /**
     * @override
     */
    async fetchDirPath() {
      const {
        dir,
        rootDir,
        archiveManager,
      } = this.getProperties('dir', 'rootDir', 'archiveManager');
      let dirPath = await resolveFilePath(dir, this.resolveFileParent.bind(this));
      dirPath = rootDir ? cutDirsPath(dirPath, rootDir) : dirPath;
      for (let i = 0; i < get(dirPath, 'length'); ++i) {
        const currentDir = dirPath[i];
        if (currentDir && get(currentDir, 'isArchiveRootDir')) {
          const browsableArchive =
            await archiveManager.getBrowsableArchive(currentDir.relationEntityId('archive'));
          dirPath[i] = BrowsableArchiveRootDir.create({
            content: currentDir,
            browsableArchive,
          });
          break;
        }
      }
      return dirPath;
    },

    /**
     * @override
     */
    fetchBreadcrumbsItems() {
      return this.get('dirPathProxy').then(dirPath => {
        const rootId = this.get('rootDir.id') || get(dirPath, 'firstObject.id');
        return dirPath.map(dir =>
          FileBreadcrumbsItem.create({
            file: dir,
            isRoot: get(dir, 'id') === rootId,
          })
        );
      });
    },

    /**
     * @override
     * BreadcrumbsItems filtered with `filterBreadcrumbsItems` function.
     * It should contain max. `elementsToShow` + ellipsis elements.
     * @type {ObjectPromiseProxy<Ember.Array<FileBreadcrumbsItem>>}
     * @returns {Promise}
     */
    fetchFilteredBreadcrumbsItems() {
      const {
        breadcrumbsItemsProxy,
        elementsToShow,
      } = this.getProperties('breadcrumbsItemsProxy', 'elementsToShow');

      return breadcrumbsItemsProxy.then(breadcrumbsItems =>
        filterBreadcrumbsItems(
          breadcrumbsItems,
          elementsToShow,
          this.resolveFileParent.bind(this)
        )
      );
    },

    async resolveFileParent(item) {
      const {
        parentsCache,
        resolveFileParentFun,
        getItemByIdFun,
      } = this.getProperties('parentsCache', 'resolveFileParentFun', 'getItemByIdFun');
      if (
        typeof getItemByIdFun === 'function' &&
        getItemByIdFun !== notImplementedReject
      ) {
        const parentId = parentsCache && parentsCache[get(item, 'entityId')];
        if (parentId) {
          return getItemByIdFun(parentId);
        }
      }

      return resolveFileParentFun(item);
    },

    checkWidth(noAnimation) {
      const $fileBreadcrumbs = this.$();
      if (this.get('isDestroyed') || !$fileBreadcrumbs.length) {
        return;
      }
      const itemsCount = this.get('filteredBreadcrumbsItems.length');
      const $fileBreadcrumbsInner = this.$('.fb-breadcrumbs-inner');
      const elementsToShow = this.get('elementsToShow');
      const innerBreadcrumbsWidth = $fileBreadcrumbsInner.width();
      const containerWidth = $fileBreadcrumbs.width();
      if (innerBreadcrumbsWidth > containerWidth && elementsToShow !== 0) {
        if (elementsToShow > itemsCount) {
          this.set('elementsToShow', itemsCount);
        } else {
          this.decrementProperty('elementsToShow');
        }
        if (!noAnimation) {
          this.set('breadcrumbsRecomputing', true);
        }
        later(() => {
          this.updateFilteredBreadcrumbsItemsProxy()
            .then(() => next(() => this.checkWidth(true)));
        }, noAnimation ? 0 : recomputePathAnimationDuration);
      } else {
        const lastItem =
          this.$('.fb-breadcrumbs-current-dir-button')[0];
        const lastItemLeft = lastItem.offsetLeft;
        const containerWidth = this.get('element').offsetWidth;
        const lastItemMaxWidth = containerWidth - lastItemLeft;
        this.setProperties({
          lastItemStyle: htmlSafe(`max-width: ${lastItemMaxWidth}px;`),
          breadcrumbsRecomputing: false,
        });
      }
    },

    checkWidthOnResize() {
      this.setProperties({
        elementsToShow: Infinity,
        breadcrumbsRecomputing: true,
      });
      later(() => {
        safeExec(this, () => {
          this.updateFilteredBreadcrumbsItemsProxy()
            .then(() => next(() => this.checkWidth(true)));
        }, recomputePathAnimationDuration);
      });
    },

    actions: {
      changeDir(dir) {
        this.get('changeDir')(dir);
      },
      actionClicked() {
        this.send('toggleDirActions', false);
      },
      toggleDirActions(open) {
        const _open =
          (typeof open === 'boolean') ? open : !this.get('dirActionsOpen');
        if (_open) {
          this.get('selectCurrentDir')();
        }
        this.set('dirActionsOpen', _open);
      },
    },
  }
);
