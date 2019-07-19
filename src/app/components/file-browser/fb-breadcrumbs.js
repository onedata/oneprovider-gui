/**
 * An auto-collapsible path to selected dir.
 * 
 * @module components/file-browser/fb-breadcrumbs
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { observer, computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { next, debounce, later } from '@ember/runloop';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { resolve } from 'rsvp';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import FileBreadcrumbsItem from 'oneprovider-gui/utils/file-breadcrumbs-item';
import filterBreadcrumbsItems from 'oneprovider-gui/utils/filter-breadcrumbs-items';
import cutDirsPath from 'oneprovider-gui/utils/cut-dirs-path';
import { difference, array } from 'ember-awesome-macros';

export default Component.extend(
  createDataProxyMixin('dirPath', { type: 'array' }),
  createDataProxyMixin('breadcrumbsItems', { type: 'array' }),
  createDataProxyMixin('filteredBreadcrumbsItems', { type: 'array' }), {
    classNames: ['fb-breadcrumbs'],

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
     * @param {models/File} dir a File record with directory to change
     */
    changeDir: notImplementedReject,

    /**
     * How many breadcrumbs items should be rendered.
     * A special element: (...) is always additionally rendered,
     * so there will be N+1 elements visible.
     * @type {Number}
     */
    elementsToShow: Infinity,

    _window: window,

    checkWidthOnResize() {
      this.set('elementsToShow', Infinity);
      this.$('.fb-breadcrumbs-inner').addClass('breadcrumbs-recomputing');
      later(() => {
        this.updateFilteredBreadcrumbsItemsProxy()
          .then(() => next(() => this.checkWidth(true)));
      }, 200);
    },

    init() {
      this._super(...arguments);
      this.updateDirPathProxy();
    },

    didInsertElement() {
      this._super(...arguments);
      this.get('filteredBreadcrumbsItemsProxy').then(() => {
        next(() => this.checkWidth());
      });
      this.set('__checkWidthFun', () => {
        debounce(this, 'checkWidthOnResize', 100);
      });
      this.get('_window').addEventListener('resize', this.get('__checkWidthFun'));
    },

    willDestroyElement() {
      this.get('_window').removeEventListener('resize', this.get('__checkWidthFun'));
    },

    /**
     * Watch changes on properites that can cause change the width of fb-breadcrumbs.
     * As fb-breadcrumbs-inner can overflow its parent, thus it can have width greater than
     * fb-breadcrumbs, decrement `elementsToShow` count to try to fit fb-breadcrumbs-inner
     * into its container.
     */
    checkWidth: observer(
      'isLoading',
      'breadcrumbsItems.content.[]',
      function checkWidth(noAnimation) {
        const itemsCount = this.get('filteredBreadcrumbsItems.length');
        if (!itemsCount) {
          console.log('no items count ' + itemsCount);
          return;
        }
        const $fileBreadcrumbs = this.$();
        const $fileBreadcrumbsInner = this.$('.fb-breadcrumbs-inner');
        const elementsToShow = this.get('elementsToShow');
        const innerBreadcrumbsWidth = $fileBreadcrumbsInner.width();
        const containerWidth = $fileBreadcrumbs.width();
        if (innerBreadcrumbsWidth > containerWidth) {
          if (elementsToShow > itemsCount) {
            this.set('elementsToShow', itemsCount);
          } else {
            this.decrementProperty('elementsToShow');
          }
          if (!noAnimation) {
            $fileBreadcrumbsInner.addClass('breadcrumbs-recomputing');
          }
          later(() => {
            this.updateFilteredBreadcrumbsItemsProxy()
              .then(() => next(() => this.checkWidth(true)));
          }, noAnimation ? 0 : 200);
        } else {
          $fileBreadcrumbsInner.removeClass('breadcrumbs-recomputing');
        }
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

    parentItems: array.slice(
      'filteredBreadcrumbsItemsProxy.content',
      0,
      difference('filteredBreadcrumbsItemsProxy.length', 1)
    ),

    currentItem: reads('filteredBreadcrumbsItems.lastObject'),

    /**
     * @override
     */
    fetchDirPath() {
      const {
        dir,
        rootDir,
      } = this.getProperties('dir', 'rootDir');
      const array = [dir];
      return resolveParent(dir, array).then(dirPath =>
        rootDir ? cutDirsPath(dirPath, rootDir) : dirPath
      );
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
     * FIXME: comment
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
          elementsToShow
        )
      );
    },

    actions: {
      changeDir(dir) {
        this.get('changeDir')(dir);
      },
    },
  }
);

function resolveParent(dir, array) {
  if (get(dir, 'hasParent')) {
    return get(dir, 'parent').then(parent => {
      array.unshift(parent);
      return resolveParent(parent, array);
    });
  } else {
    return resolve(array);
  }
}
