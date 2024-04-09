/**
 * Specific EDM object model class for `edm:WebResource`,
 * see: https://europeana.atlassian.net/wiki/spaces/EF/pages/2106392591/edm+WebResource
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EdmObject from '../object';
import EdmObjectType from '../object-type';

export default class WebResource extends EdmObject {
  constructor(options = {}) {
    super({
      ...options,
      edmObjectType: EdmObjectType.WebResource,
      namespace: 'edm',
    });
  }
}
