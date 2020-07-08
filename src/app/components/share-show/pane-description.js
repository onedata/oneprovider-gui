import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { set } from '@ember/object';

export default Component.extend(I18n, {
  classNames: ['share-show-pane-description', 'pane-description', 'row'],

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.paneDescription',

  /**
   * @virtual
   * @optional
   */
  publicMode: false,

  /**
   * @virtual
   */
  share: undefined,

  /**
   * @virtual
   * @type {String} one of: visual, markdown
   */
  editorMode: 'visual',

  currentMarkdown: undefined,

  init() {
    this._super(...arguments);
    this.loadMarkdown();
    if (!this.get('share.description')) {
      this.set('noDescriptionWelcome', true);
    }
  },

  loadMarkdown() {
    return this.set('currentMarkdown', this.get('share.description'));
  },

  actions: {
    discard() {
      this.loadMarkdown();
    },
    save() {
      const {
        share,
        currentMarkdown,
      } = this.getProperties('share', 'currentMarkdown');
      set(share, 'description', currentMarkdown);
      return share.save();
    },
    startEdit() {
      this.set('noDescriptionWelcome', false);
      this.set('editorMode', 'markdown');
    },
  },
});
