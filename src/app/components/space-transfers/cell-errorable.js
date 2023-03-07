/**
 * Cell that checks if the table transfer record has error flag
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2017-2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  tagName: 'span',
  classNames: ['cell-errorable'],
});
