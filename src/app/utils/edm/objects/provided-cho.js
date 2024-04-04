/**
 * Specific EDM object model class for `edm:ProvidedCHO`,
 * see: https://europeana.atlassian.net/wiki/spaces/EF/pages/2106294284/edm+ProvidedCHO
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EdmObject from '../object';
import EdmObjectType from '../object-type';

export default class ProvidedCHO extends EdmObject {
  constructor(options = {}) {
    super({
      edmObjectType: EdmObjectType.ProvidedCHO,
      namespace: 'edm',
      // use one of:
      // - xmlDocument (when creating new element)
      // - xmlElement (when parsing from XML)
      xmlDocument: options.xmlDocument,
      xmlElement: options.xmlElement,
    });
  }
}
