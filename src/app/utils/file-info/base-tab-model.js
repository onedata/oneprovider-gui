/**
 * Abstract class for creating model classes that provide logic for look and behavior
 * of single feature tab in file-info-modal.
 *
 * Subclasses define logic for tab look and behavior and provides paths of componnets
 * that will be rendered as file-info-modal parts (header/body/footer) when the tab
 * is activated. This model is also responsible for creating `viewModel` instance that
 * should be lazily created in this tab-model (just use computed property that returns
 * specific `viewModel` instance), which is injected as dependency into modal parts
 * components.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { writable, conditional, not, raw, eq } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';

const mixins = [
  OwnerInjector,
  I18n,
];

export default EmberObject.extend(...mixins, {
  i18n: service(),

  /**
   * @virtual
   * @type {Components.FileInfoModal}
   */
  fileInfoModal: undefined,

  /**
   * @virtual
   * @type {string}
   */
  tabId: undefined,

  /**
   * @virtual
   * @type {EmberObject|Object}
   */
  viewModel: undefined,

  /**
   * Icon that will be rendered on the right of text as tab status.
   * @virtual optional
   * @type {string}
   */
  statusIcon: undefined,

  /**
   * Tooltip text that appear when status icon is hovered.
   * @virtual optional
   * @type {string|SafeString}
   */
  statusIconTip: undefined,

  /**
   * Number that will be rendered on the right of text as tab status.
   * For specific cases, can be also a text (eg. for rendering "50+").
   * @virtual optional
   * @type {number|string}
   */
  statusNumber: undefined,

  /**
   * Text in tag that will be rendered on the right of text as tab status.
   * @virtual optional
   * @type {string}
   */
  statusTag: undefined,

  /**
   * @virtual optional
   * @type {string}
   */
  tabClass: '',

  /**
   * Name of component to render in modal header.
   * @virtual optional
   * @type {string}
   */
  headerComponent: undefined,

  /**
   * Name of component to render in modal body.
   * @virtual
   * @type {string}
   */
  bodyComponent: undefined,

  /**
   * Name of component to render in modal footer.
   * If not specified, the footer will not be rendered.
   * @virtual optional
   * @type {string}
   */
  footerComponent: undefined,

  /**
   * If set to true, components for the tab content supports multiple files and
   * is displayed when multiple files are selected.
   * @virtual optional
   * @type {boolean}
   */
  isSupportingMultiFiles: false,

  /**
   * @virtual optional
   * @type {SafeString|string}
   */
  title: computedT('title'),

  /**
   * @virtual optional
   * @type {string}
   */
  modalClass: '',

  /**
   * @virtual optional
   * @type {ComputedProperty<boolean>}
   */
  isVisible: writable(conditional(
    eq('injectedIsVisible', raw(null)),
    conditional(
      'isSupportingMultiFiles',
      raw(true),
      not('fileInfoModal.isMultiFile')
    ),
    'injectedIsVisible'
  ), {
    set(value) {
      return this.injectedIsVisible = value;
    },
  }),

  /**
   * @type {boolean | null}
   */
  injectedIsVisible: null,

  /**
   * @type {ComputedProperty<boolean>}
   */
  isActive: eq('fileInfoModal.activeTab', 'tabId'),

  /**
   * Invoked by file info modal when it wants to close the current tab.
   * Return true to allow tab close.
   * Return false to cancel closing the file info modal.
   * Returing null or undefined will be considered as true.
   * @virtual optional
   * @returns {boolean}
   */
  checkClose() {
    return true;
  },
});
