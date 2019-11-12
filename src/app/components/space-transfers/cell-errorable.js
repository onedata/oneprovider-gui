/**
 * Cell that checks if the table transfer record has error flag
 *
 * @module components/space-transfers/cell-errorable
 * @author Jakub Liput, Michal Borzecki
 * @copyright (C) 2017-2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  tagName: 'span',
  classNames: ['cell-errorable'],
});
