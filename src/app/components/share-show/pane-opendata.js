import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import {
  promise,
} from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import moment from 'moment';
import autosize from 'onedata-gui-common/utils/autosize';
import { scheduleOnce, later } from '@ember/runloop';
import { conditional, equal, raw } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';

export default Component.extend(I18n, {
  classNames: ['share-show-pane-opendata', 'pane-opendata', 'row'],

  fileManager: service(),
  currentUser: service(),
  handleManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.paneOpendata',

  /**
   * @virtual
   */
  share: undefined,

  xml: undefined,

  editorMode: 'visual',

  modeSwitchIcon: conditional(
    equal('editorMode', raw('visual')),
    raw('xml-file'),
    raw('visual-editor'),
  ),

  modeSwitchText: conditional(
    equal('editorMode', raw('visual')),
    computedT('editXml'),
    computedT('openVisualEditor'),
  ),

  // FIXME: hack - better merge xml editor with visual editor into one component
  editorModeChanged: observer('editorMode', function editorModeChanged() {
    this.set('triggerUpdateXml', new Date().toString());
  }),

  autoApplyAutosize: observer(
    'editorMode',
    function autoApplyAutosize() {
      if (this.get('editorMode') === 'xml') {
        scheduleOnce('afterRender', () => {
          const textarea = this.get('element').querySelector('.textarea-source-editor');
          if (textarea) {
            autosize(textarea);
            // FIXME: hack
            later(() => autosize(textarea), 500);
          }
        });
      }
    }
  ),

  // No dependent keys, because it is computed once
  initialData: computed(function initialData() {
    return {
      title: this.get('share.name'),
      creator: this.get('currentUser.userProxy.content.name'),
      description: '',
      date: moment().format('YYYY-MM-DD'),
    };
  }),

  handleProxy: promise.object(computed('share.handle', function handleProxy() {
    return this.get('share').getRelation('handle', { allowNull: true, reload: true });
  })),

  handleServicesProxy: promise.object(computed('share.handle', function handleProxy() {
    return this.get('handleManager').getHandleServices();
  })),

  handle: reads('handleProxy.content'),

  handleServices: reads('handleServicesProxy.content'),

  loadXml() {
    this.get('handleProxy').then(handle => {
      if (handle) {
        const metadataString = get(handle, 'metadataString');
        if (metadataString) {
          this.set('xml', metadataString);
        } else {
          this.set('noMetadata', true);
        }
      }
    });
  },

  init() {
    this._super(...arguments);
    this.autoApplyAutosize();
    this.loadXml();
  },

  actions: {
    submit(xml, handleServiceId) {
      const {
        share,
        handleManager,
      } = this.getProperties('share', 'handleManager');
      return handleManager.createHandle(share, handleServiceId, xml)
        .then(() => {
          this.loadXml();
        });
    },
    xmlChanged(xml) {
      this.set('xml', xml);
    },
    toggleEditorMode() {
      const editorMode = this.get('editorMode');
      const newMode = (editorMode === 'visual') ? 'xml' : 'visual';
      this.set('editorMode', newMode);
    },
    discard() {
      this.set('publishOpenDataStarted', false);
      this.set('xml', '');
    },
    updateXml(xml) {
      // FIXME: quick double render fix
      scheduleOnce('afterRender', () => {
        this.set('xml', xml);
      });
    },
  },
});
