/**
 * Cell that checks if the table transfer record has error flag
 * Cell component for `models-table` in `live-stats-table`.
 *
 * @module components/live-stats-table/cell-errorable
 * @author Jakub Liput, Michal Borzecki
 * @copyright (C) 2017-2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  tagName: 'span',
  classNames: ['cell-errorable'],
});
