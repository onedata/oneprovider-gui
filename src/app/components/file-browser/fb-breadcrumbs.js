/**
 * An auto-collapsible path to selected dir.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { next, later } from '@ember/runloop';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import FileBreadcrumbsItem from 'oneprovider-gui/utils/file-breadcrumbs-item';
import filterBreadcrumbsItems from 'oneprovider-gui/utils/filter-breadcrumbs-items';
import defaultResolveParent from 'oneprovider-gui/utils/default-resolve-parent';
import cutDirsPath from 'oneprovider-gui/utils/cut-dirs-path';
import I18n from 'onedata-gui-common/mixins/i18n';
import WindowResizeHandler from 'onedata-gui-common/mixins/components/window-resize-handler';
import { inject as service } from '@ember/service';
import resolveFilePath from 'oneprovider-gui/utils/resolve-file-path';
import { htmlSafe } from '@ember/string';
import { isEmpty, and, eq, raw } from 'ember-awesome-macros';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import dom from 'onedata-gui-common/utils/dom';
import { asyncObserver } from 'onedata-gui-common/utils/observer';

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
     * @type {Models.Space}
     */
    space: undefined,

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

    extraNameIcon: 'sign-info-rounded',

    extraNameTooltipClass: 'tooltip-lg tooltip-text-left',

    /**
     * Style assigned to current directory button - needed for truncating.
     * Set in `checkWidth` method.
     * @type {SafeString}
     */
    lastItemStyle: undefined,

    areItemsEmpty: isEmpty('filteredBreadcrumbsItemsProxy'),

    /**
     * @type {boolean}
     */
    isRootItemInfoOpened: false,

    /**
     * @type {Boolean}
     */
    isRootItemInfoHovered: false,

    recomputePath: asyncObserver('dir.parent.name', function recomputePath() {
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
    checkWidthObserver: asyncObserver(
      'isLoading',
      'breadcrumbsItems.content.[]',
      function checkWidthObserver() {
        this.set('elementsToShow', Infinity);
        next(() => this.checkWidth());
      }
    ),

    autoUpdateFilteredBreadcrumbsItems: asyncObserver(
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

    /**
     * @type {boolean}
     */
    isFlippableSpaceRootIcon: and(eq('rootIcon', raw('space')), 'space'),

    init() {
      this._super(...arguments);
      if (!this.lastItemStyle) {
        this.set('lastItemStyle', htmlSafe(''));
      }
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
      let dirPath = await resolveFilePath(this.dir, this.resolveFileParent.bind(this));
      dirPath = this.rootDir ? cutDirsPath(dirPath, this.rootDir) : dirPath;
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
      if (
        typeof getItemByIdFun === 'function' &&
        this.getItemByIdFun !== notImplementedReject
      ) {
        const parentId = this.parentsCache?.[get(item, 'entityId')];
        if (parentId) {
          return this.getItemByIdFun(parentId);
        }
      }

      return this.resolveFileParentFun(item);
    },

    checkWidth(noAnimation) {
      if (this.isDestroyed || !this.element) {
        return;
      }
      const itemsCount = this.filteredBreadcrumbsItems?.length;
      const fileBreadcrumbsInner = this.element.querySelector('.fb-breadcrumbs-inner');
      const innerBreadcrumbsWidth = fileBreadcrumbsInner ?
        dom.width(fileBreadcrumbsInner, dom.LayoutBox.ContentBox) : 0;
      const containerWidth = dom.width(this.element, dom.LayoutBox.ContentBox);
      if (innerBreadcrumbsWidth > containerWidth && this.elementsToShow !== 0) {
        if (this.elementsToShow > itemsCount) {
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
          this.element.querySelector('.fb-breadcrumbs-current-dir-button');
        const lastItemLeft = lastItem.offsetLeft;
        const containerWidth = this.element.offsetWidth;
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
      rootItemInfoHovered(isHover) {
        this.set('isRootItemInfoHovered', isHover);
      },
      closeSpaceInfoPopover() {
        this.set('isRootItemInfoOpened', false);
      },
    },
  }
);
