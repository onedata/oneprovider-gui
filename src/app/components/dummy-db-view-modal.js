/**
 * FIXME: description
 * 
 * @module components/dummy-db-view-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  space: computed(() => ({
    entityType: 'op_space',
    entityId: 'space_id',
    name: 'Some space',
  })),

  dbViewName: 'some_db_view',

  open: true,
});
