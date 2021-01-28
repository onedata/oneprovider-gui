/**
 * Editor of Markdown source with preview.
 * 
 * @module components/markdown-editor
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { conditional, equal, raw, and, isEmpty } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import autosize from 'onedata-gui-common/utils/autosize';
import { scheduleOnce } from '@ember/runloop';
import { observer } from '@ember/object';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';

const defaultMode = 'markdown';

export default Component.extend(I18n, {
  classNames: ['share-show-markdown-editor', 'markdown-editor'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.markdownEditor',

  /**
   * Markdown source
   * @virtual
   * @type {String}
   */
  markdown: '',

  /**
   * @virtual
   * @type {Function}
   */
  onMarkdownChange: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  onModeChange: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  discard: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  save: notImplementedThrow,

  /**
   * One of: visual, markdown
   * @type {String}
   */
  mode: defaultMode,

  isContentChanged: false,

  /**
   * @type {ComputedProperty<String>}
   */
  modeSwitchIcon: conditional(
    equal('mode', raw('visual')),
    raw('markdown'),
    raw('view'),
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  modeSwitchText: conditional(
    equal('mode', raw('visual')),
    computedT('editMarkdown'),
    computedT('openPreview'),
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  modeCurrentIcon: conditional(
    equal('mode', raw('visual')),
    raw('view'),
    raw('markdown'),
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  modeCurrentText: conditional(
    equal('mode', raw('visual')),
    computedT('preview'),
    computedT('markdownEditor'),
  ),

  isToggleEditorDisabled: and(equal('mode', raw('markdown')), isEmpty('markdown')),

  autoApplyAutosize: observer('mode', function autoApplyAutosize() {
    if (this.get('mode') === 'markdown') {
      scheduleOnce('afterRender', () => {
        const textarea = this.get('element').querySelector('.textarea-source-editor');
        if (textarea) {
          autosize(textarea);
        }
      });
    }
  }),

  init() {
    this._super(...arguments);
    this.autoApplyAutosize();
  },

  changeHtmlContent(content) {
    if (!this.get('isContentChanged')) {
      this.set('isContentChanged', true);
    }
    return this.set('htmlContent', content);
  },

  actions: {
    discard() {
      this.get('discard')();
      this.set('isContentChanged', false);
    },
    save() {
      return this.get('save')().then(() => {
        safeExec(this, 'set', 'isContentChanged', false);
      });
    },
    onMarkdownChange(content) {
      if (!this.get('isContentChanged')) {
        this.set('isContentChanged', true);
      }
      this.get('onMarkdownChange')(content);
    },
    toggleEditorMode() {
      const mode = this.get('mode');
      const newMode = (mode === 'visual') ? 'markdown' : 'visual';
      this.get('onModeChange')(newMode);
    },
  },
});
