import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: 'tr',
  classNames: ['fb-table-row', 'menu-toggle-hover-parent'],
  classNameBindings: ['typeClass', 'isSelected:file-selected'],

  fileActions: service(),

  file: undefined,

  mouseOver: false,

  actionsOpened: false,

  /**
   * @virtual
   * @type {boolean}
   */
  isSelected: undefined,

  displayName: reads('file.name'),

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

  didInsertElement() {
    this._super(...arguments);
    this.element.addEventListener('contextmenu', this.get('contextMenuHandler'));
  },

  willDestroyElement() {
    this._super(...arguments);
    this.element.removeEventListener('contextmenu', this.get('contextMenuHandler'));
  },

  /**
   * @override event hook
   */
  mouseEnter() {
    this.set('mouseOver', true);
  },

  /**
   * @override event hook
   */
  mouseLeave() {
    this.set('mouseOver', false);
  },

  actions: {
    toggleActions(open) {
      const actionsOpen = (open === undefined) ? !this.get('actionsOpened') : open;
      this.set('actionsOpened', actionsOpen);
    },
  },
});
