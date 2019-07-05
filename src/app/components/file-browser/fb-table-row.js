import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['fb-table-row', 'menu-toggle-hover-parent'],
  classNameBindings: ['typeClass', 'isSelected:file-selected'],
  attributeBindings: ['fileEntityId:data-row-id'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbTableRow',

  fileActions: service(),

  /**
   * @virtual
   */
  file: undefined,

  /**
   * @virtual
   */
  openContextMenu: notImplementedThrow,

  /**
   * @virtual
   */
  fileActionsOpen: false,

  /**
   * @virtual
   * @type {boolean}
   */
  isSelected: undefined,

  displayName: reads('file.name'),

  fileEntityId: reads('file.entityId'),

  typeClass: computed('type', function typeClass() {
    return `fb-table-row-${this.get('type')}`;
  }),

  type: computed('file.type', function icon() {
    const fileType = this.get('file.type');
    if (fileType === 'dir' || fileType === 'file') {
      return fileType;
    }
  }),

  icon: computed('type', function icon() {
    const type = this.get('type');
    switch (type) {
      case 'dir':
        return 'browser-directory';
      case 'file':
        return 'browser-file';
      default:
        break;
    }
  }),

  contextMenuHandler: computed(function contextMenuHandler() {
    const component = this;
    const openContextMenu = component.get('openContextMenu');
    return function oncontextmenu(contextmenuEvent) {
      openContextMenu(contextmenuEvent);
      contextmenuEvent.preventDefault();
    };
  }),

  hideMenuTrigger: computed(
    'selectionContext',
    'isSelected',
    function hideMenuTrigger() {
      const isSelected = this.get('isSelected');
      const selectionContext = this.get('selectionContext');
      return isSelected && selectionContext.startsWith('multi');
    }
  ),

  isShared: reads('file.isShared'),

  hasMetadata: reads('file.hasMetadata'),

  didInsertElement() {
    this._super(...arguments);
    this.element.addEventListener('contextmenu', this.get('contextMenuHandler'));
  },

  willDestroyElement() {
    this._super(...arguments);
    this.element.removeEventListener('contextmenu', this.get('contextMenuHandler'));
  },

  actions: {
    openContextMenu() {
      this.openContextMenu(...arguments);
    },
  },
});
