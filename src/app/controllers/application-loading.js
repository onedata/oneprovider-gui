/**
 * Allows to notify about scroll events
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default class OneproviderApplicationLoadingController extends Controller {
  @service appProxy;

  @reads('appProxy.injectedData.oneproviderName') oneproviderName;
}
