/**
 * Subheader for file-operation modals with file name
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { gt, conditional, raw, or, and, eq } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ItemsTooltipContent from 'oneprovider-gui/utils/items-tooltip-content';

export default Component.extend(I18n, {
  tagName: 'h2',
  classNames: ['modal-file-subheader', 'filename', 'normal-case'],

  /**
   * @override
   */
  i18nPrefix: 'components.modalFileSubheader',

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * @virtual optional
   * @type {String}
   */
  multiTextPrefix: undefined,

  fileIcon: 'browser-file',

  dirIcon: 'browser-directory',

  multiIcon: 'items-grid',

  filesCount: reads('files.length'),

  firstFile: reads('files.firstObject'),

  multi: gt('filesCount', 1),

  /**
   * @type {'symlink'|'file'|'dir'|'multi'}
   */
  type: conditional(
    'multi',
    raw('multi'),
    conditional(
      eq('firstFile.type', raw('symlink')),
      or('firstFile.effFile.type', raw('file')),
      'firstFile.type'
    )
  ),

  icon: or(
    and(eq('type', raw('file')), 'fileIcon'),
    and(eq('type', raw('dir')), 'dirIcon'),
    and(eq('type', raw('multi')), 'multiIcon'),
    null
  ),

  truncatedTextTip: conditional(
    'multi',
    'itemsTooltipContent.tooltipContent',
    raw(undefined),
  ),

  truncatedTextTooltipClass: conditional(
    'multi',
    'itemsTooltipContent.tooltipClass',
    raw(undefined),
  ),

  init() {
    this._super(...arguments);
    const itemsTooltipContent = ItemsTooltipContent.extend({
      items: reads('modalFileSubheader.files'),
    }).create({
      modalFileSubheader: this,
    });
    this.set('itemsTooltipContent', itemsTooltipContent);
  },
});
