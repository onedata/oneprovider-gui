/**
 * Specific EDM object model class for `ore:Aggregation`,
 * see: https://europeana.atlassian.net/wiki/spaces/EF/pages/2106032160/ore+Aggregation
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EdmObject from '../object';
import EdmObjectType from '../object-type';

export default class Aggregation extends EdmObject {
  constructor(options = {}) {
    super({
      edmObjectType: EdmObjectType.Aggregation,
      namespace: 'ore',
      xmlDocument: options.xmlDocument,
      xmlElement: options.xmlElement,
    });
  }
}
