/**
 * Renders column configuration item with drag and drop icon, checkbox,
 * column name and additional icons.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import { reads } from '@ember/object/computed';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: ['column-item'],

  i18n: service(),
  providerManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.columnsConfigurationPopover.columnItem',

  /**
   * @virtual
   * @type {boolean}
   */
  isMoveUpIconDisabled: false,

  /**
   * @virtual
   * @type {boolean}
   */
  isMoveDownIconDisabled: false,

  /**
   * @virtual
   * @type {string}
   */
  columnName: undefined,

  /**
   * @virtual
   * @type {ColumnProperties}
   */
  columnValue: undefined,

  /**
   * @virtual
   * @type {string}
   */
  translationKey: undefined,

  /**
   * @virtual
   * @type {number}
   */
  columnIndex: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  previewMode: undefined,

  /**
   * @virtual
   * @type {(columName: string, newValue: boolean) => void}
   */
  checkboxChanged: notImplementedWarn,

  /**
   * @virtual
   * @type {(columnName: string) => void}
   */
  moveColumnDown: notImplementedWarn,

  /**
   * @virtual
   * @type {(columnName: string) => void}
   */
  moveColumnUp: notImplementedWarn,

  /**
   * @virtual
   * @type {(columnName: string) => void}
   */
  openColumnEditor: notImplementedWarn,

  /**
   * @virtual
   * @type {(columnName: string) => void}
   */
  removeMetadataColumn: notImplementedWarn,

  /**
   * @virtual
   * @type {() => void}
   */
  dragStartAction: notImplementedIgnore,

  /**
   * @virtual
   * @type {() => void}
   */
  dragEndAction: notImplementedIgnore,

  /**
   * @virtual
   * @type {(event: DragEvent) => void }
   */
  onHeadingDrag: notImplementedIgnore,

  /**
   * @virtual
   * @type {() => void}
   */
  onHeadingDragEnd: notImplementedIgnore,

  /**
   * @virtual
   * @type {(index: number, event: DragEvent) => void }
   */
  onHeadingDrop: notImplementedIgnore,

  /**
   * @virtual
   * @type {(isOverBeforeArea: boolean, event: DragEvent) => void }
   */
  onHeadingDragOver: notImplementedIgnore,

  /**
   * @virtual
   * @type {(event: DragEvent) => void }
   */
  onHeadingDragLeave: notImplementedIgnore,

  /**
   * @virtual
   * @type {boolean}
   */
  isColumnListVisible: false,

  /**
   * @virtual
   * @type {boolean}
   */
  isDropBorderShown: false,

  /**
   * @type {boolean}
   */
  isArrowTooltipVisible: true,

  /**
   * @type {ComputedProperty<boolean>}
   */
  isMetadataColumn: computed('columnValue.type', function isMetadataColumn() {
    return this.columnValue.type === 'xattr' || this.columnValue.type === 'json';
  }),

  /**
   * @virtual
   * @type {ComputedProperty<string>}
   */
  checkboxInputId: computed('columnName', function checkboxInputId() {
    return `${this.elementId}-${this.columnName}Checkbox`;
  }),

  /**
   * @type {PromiseObject<Models.Provider>}
   */
  currentProviderProxy: computed(function currentProviderProxy() {
    return promiseObject(this.providerManager.getCurrentProvider());
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  currentProviderName: reads('currentProviderProxy.content.name'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  subnameText: computed(
    'columnValue.type',
    'translationKey',
    'columnName',
    function subnameText() {
      if (this.columnValue.type === 'xattr') {
        return this.t(`${this.translationKey}.subname.xattr`);
      } else if (this.columnValue.type === 'json') {
        if (this.columnValue.displayedName.length > 9) {
          return this.t(`${this.translationKey}.subname.jsonShort`);
        } else {
          return this.t(`${this.translationKey}.subname.json`);
        }
      } else {
        return this.t(`${this.translationKey}.subname.${this.columnName}`);
      }
    }
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  tooltipText: computed(
    'columnValue.{type,options}',
    'translationKey',
    'columnName',
    'currentProviderName',
    'previewMode',
    function tooltipText() {
      if (this.columnValue.type === 'xattr') {
        return this.t(`${this.translationKey}.tip.xattr`, {
          key: this.columnValue.options.xattrKey,
        });
      } else if (this.columnValue.type === 'json') {
        if (this.columnValue.options.queryType === 'all') {
          return this.t(`${this.translationKey}.tip.json.all`);
        } else if (this.columnValue.options.queryType === 'key') {
          return this.t(`${this.translationKey}.tip.json.key`, {
            key: this.columnValue.options.jsonKey,
          });
        } else {
          return this.t(`${this.translationKey}.tip.json.query`, {
            query: this.columnValue.options.jsonQuery,
          });
        }
      } else if (this.columnName === 'fileId') {
        const mode = this.previewMode ? 'public' : 'priv';
        return this.t(`${this.translationKey}.tip.fileId.${mode}`);
      } else {
        return this.t(`${this.translationKey}.tip.${this.columnName}`, {
          oneprovider: this.currentProviderName,
        });
      }
    }
  ),

  actions: {
    checkboxChanged(columnName, newValue) {
      return this.checkboxChanged(columnName, newValue);
    },
    moveColumnDown(columnName) {
      return this.moveColumnDown(columnName);
    },
    moveColumnUp(columnName) {
      return this.moveColumnUp(columnName);
    },
    openColumnEditor(columnName) {
      this.openColumnEditor(columnName);
    },
    removeMetadataColumn(columnName) {
      this.removeMetadataColumn(columnName);
    },
    headingDrag(event) {
      if (this.dragStartAction) {
        this.dragStartAction();
      }
      this.onHeadingDrag(event);
    },
    headingDragEnd() {
      if (this.dragEndAction) {
        this.dragEndAction();
      }
      this.onHeadingDragEnd();
    },
    headingDrop(index, event) {
      this.onHeadingDrop(index, event);
    },
    headingDragOver(isOverBeforeArea, event) {
      this.onHeadingDragOver(isOverBeforeArea, event);
    },
    headingDragLeave(event) {
      this.onHeadingDragLeave(event);
    },
  },
});
