import { entityType as userEntityType } from 'oneprovider-gui/models/user';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { lookupService } from './stub-service';

export default class DefaultUser {
  /**
   * @param {Mocha.Context} context
   */
  constructor(context) {
    this.context = context;
    this.store = lookupService(context, 'store');
    /** @type {Promise<Models.User>} */
    this.defaultUserPromise = false;
  }
  async createUser(userId = 'dummy_user_id', data = {}) {
    const id = gri({
      entityType: userEntityType,
      entityId: userId,
      aspect: 'instance',
      scope: 'shared',
    });
    return await this.store.createRecord('user', {
      id,
      fullName: 'Dummy user',
      username: 'dummy_user',
      ...data,
    }).save();
  }
  async getDefaultUser() {
    if (!this.defaultUserPromise) {
      this.defaultUserPromise = this.createUser();
    }
    return await this.defaultUserPromise;
  }
}
