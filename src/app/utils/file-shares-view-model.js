/**
 * Tab model for showing file-permissions in file-info-modal
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { set, computed } from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import {
  array,
  conditional,
  raw,
  equal,
  or,
  bool,
} from 'ember-awesome-macros';
import { get, getProperties } from '@ember/object';
import { Promise, all as allFulfilled, allSettled, resolve, reject } from 'rsvp';
import _ from 'lodash';
import { AceFlagsMasks } from 'oneprovider-gui/utils/acl-permissions-specification';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import isEveryTheSame from 'onedata-gui-common/macros/is-every-the-same';

const mixins = [
  OwnerInjector,
  I18n,
  createDataProxyMixin('spaceUsers', { type: 'array' }),
  createDataProxyMixin('spaceGroups', { type: 'array' }),
  createDataProxyMixin('acls', { type: 'array' }),
];

/**
 * @typedef {'posix'|'acl'} FilePermissionsType
 */

export default EmberObject.extend(...mixins, {
  i18n: service(),
  modalManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileSharesViewModel',

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,
});
