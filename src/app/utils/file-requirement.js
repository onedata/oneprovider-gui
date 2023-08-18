/**
 * FIXME: doc
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FileQuery from 'oneprovider-gui/utils/file-query';
import _ from 'lodash';
import { possibleFileRawAttributes } from 'oneprovider-gui/utils/file-model';

// FIXME: przenieść do serializera/file?

/**
 * @typedef {typeof possibleFileProperties[number]} File.Property
 */

export default FileQuery.extend({
  /**
   * @virtual
   * @type {File.Property}
   */
  properties: undefined,

  // FIXME: nie jest to używane - zamiast tego logika jest w service:file-requirement-registry
  /**
   * @type {Array<File.RawAttribute>}
   */
  getAttrs() {
    // FIXME: na razie zwraca stare atrybuty
    // FIXME: powinno zwracać zawsze zestaw podstawowywch atrybutów
    return _.without(
      possibleFileRawAttributes,
      'localReplicationRate',
      'qosStatus'
    );
  },
});
