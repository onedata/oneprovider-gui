/**
 * A dropdown with options of available Oneproviders.
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import DropdownEditor from 'onedata-gui-common/components/query-builder/value-editors/dropdown-editor';
import layout from '../../../templates/components/query-builder/value-editors/provider-editor';
import { get } from '@ember/object';

export default DropdownEditor.extend({
  layout,

  actions: {
    search(model, term = '') {
      const lowerTerm = term.toLocaleLowerCase();
      return get(model, 'name').toLocaleLowerCase().includes(lowerTerm) ||
        get(model, 'entityId').toLowerCase().includes(lowerTerm) ?
        1 : -1;
    },
  },
});
