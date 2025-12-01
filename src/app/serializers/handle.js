/**
 * Supports extra metadata prefixes by providing fallback values.
 *
 * @author Jakub Liput
 * @copyright (C) 2025 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Serializer from 'onedata-gui-websocket-client/serializers/application';
import { MetadataType } from 'oneprovider-gui/models/handle';

export default class HandleSerializer extends Serializer {
  /** @override */
  normalize(typeClass, hash) {
    // Backend can contain "datacite" (not: oai_datacite) records.
    // They cannot be created via GUI, but can be viewed as oai_datacite record.
    if (hash.metadataPrefix === 'datacite') {
      hash.metadataPrefix = MetadataType.DataCite;
    }
    return super.normalize(typeClass, hash);
  }

  /** @override*/
  serialize(snapshot) {
    const hash = super.serialize(...arguments);
    if (snapshot.id && snapshot.changedAttributes().metadataPrefix) {
      throw new Error('Existing handle metadata type cannot be changed');
    }
    return hash;
  }

}
