import Service, { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { tag } from 'ember-awesome-macros';
import pupa from 'npm:pupa';

export default Service.extend({
  onedataConnection: service(),
  guiContext: service(),

  apiOrigin: reads('guiContext.apiOrigin'),

  /**
   * - Keys: template names equal to name of corresponding REST method.
   * - Values: templates parseable with `pupa` library.
   * @type {ComputedProperty<Object>}
   */
  restTemplates: reads('onedataConnection.restTemplates'),

  /**
   * 
   * @type {ComputedProperty<String>}
   */
  apiPrefix: tag `https://${'guiContext.apiOrigin'}`,

  listChildren(cdmiObjectId) {
    const apiPrefix = this.get('apiPrefix');
    const listChildrenTemplate = this.get('restTemplates.listChildren');
    if (!listChildrenTemplate) {
      console.warn('util:rest-generator#listChildren: no template available');
      return '';
    }
    return apiPrefix + pupa(listChildrenTemplate, {
      id: cdmiObjectId,
    });
  },

  downloadFileContent(cdmiObjectId) {
    const apiPrefix = this.get('apiPrefix');
    const downloadFileContentTemplate = this.get('restTemplates.downloadFileContent');
    if (!downloadFileContentTemplate) {
      console.warn('util:rest-generator#downloadFileContent: no template available');
      return '';
    }
    return apiPrefix + pupa(downloadFileContentTemplate, {
      id: cdmiObjectId,
    });
  },
});
