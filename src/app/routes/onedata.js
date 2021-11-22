/**
 * Extends appModel to inject current user record,
 * thus the onedata route will be in loading state until we got current user
 * record
 * @module onezone-gui/routes/onedata
 * @author Jakub Liput
 * @copyright (C) 2017-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import OnedataRoute from 'onedata-gui-common/routes/onedata';
import { resolve } from 'rsvp';
import { set } from '@ember/object';
import AuthenticationErrorHandlerMixin from 'onedata-gui-common/mixins/authentication-error-handler';

export default OnedataRoute.extend(AuthenticationErrorHandlerMixin, {
  currentUser: service(),
  globalNotify: service(),
  appStorage: service(),
  navigationState: service(),
  workflowManager: service(),

  async beforeModel() {
    const superResult = await this._super(...arguments);
    try {
      await this.get('workflowManager.bagitUploaderWorkflowSchemaProxy');
    } catch (error) {
      // When bagit uploader workflow cannot be fetched, then it is not a
      // big deal. GUI can still work without it.
      console.error(error);
    }
    return superResult;
  },

  model() {
    const currentUser = this.get('currentUser');
    return resolve(this._super(...arguments))
      .then(appModel => {
        return currentUser.getCurrentUserRecord()
          .then(userRecord => {
            set(appModel, 'userRecord', userRecord);
            return appModel;
          });
      });
  },

  setupController(controller) {
    this._super(...arguments);
    const errors = this.consumeAuthenticationError();
    controller.setProperties(errors);
    if (errors.authenticationErrorReason) {
      controller.set('authenticationErrorOpened', true);
    }
  },
});
