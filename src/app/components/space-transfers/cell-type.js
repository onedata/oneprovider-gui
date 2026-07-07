/**
 * A cell component with type of transfer used by `space-transfers` component.
 *
 * @author Jakub Liput
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import CellIconBase from './cell-icon-base';

export default CellIconBase.extend({
  tagName: 'span',
  classNames: ['cell-icon', 'cell-type'],
});
