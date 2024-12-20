/**
 * Provides common error definitions and displayed texts for error getting root file of
 * share.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import isNotFoundError from 'oneprovider-gui/utils/is-not-found-error';
import isPosixError from 'oneprovider-gui/utils/is-posix-error';
import I18n from 'onedata-gui-common/mixins/i18n';
import _ from 'lodash';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { htmlSafe } from '@ember/string';
import { convertFromLegacyFileTypeIfNeeded } from 'onedata-gui-common/utils/file';

export const ShareFileErrorType = {
  NotFound: 'notFound',
  NoAccess: 'noAccess',
  OtherError: 'otherError',
};

const mixins = [
  OwnerInjector,
  I18n,
];

export default class ShareRootErrorInfo extends EmberObject.extend(...mixins) {
  @service errorExtractor;
  @service i18n;

  /** @override */
  i18nPrefix = 'utils.shareRootErrorInfo';

  constructor() {
    super(...arguments);

    /**
     * @virtual
     * @type {PromiseObject<Models.File>}
     */
    this.rootFilePrivateProxy;

    /**
     * @virtual
     * @type {PromiseObject<Models.File>}
     */
    this.rootFilePublicProxy;

    /**
     * @virtual
     * @type {ComputedProperty<FileType>}
     */
    this.rootFileType;
  }

  @computed('rootFilePublicProxy.reason')
  get publicFileError() {
    return this.rootFilePublicProxy.reason;
  }

  @computed('rootFilePrivateProxy.reason')
  get privateFileError() {
    return this.rootFilePrivateProxy.reason;
  }

  /**
   * @type {ShareFileErrorType}
   */
  @computed('publicFileError', 'privateFileError')
  get rootFileErrorType() {
    if (!this.privateFileError && !this.publicFileError) {
      return undefined;
    }
    if (isNotFoundError(this.publicFileError)) {
      return ShareFileErrorType.NotFound;
    } else if (isPosixError(this.privateFileError, 'eacces')) {
      return ShareFileErrorType.NoAccess;
    } else {
      return ShareFileErrorType.OtherError;
    }
  }

  /**
   * @type {SafeString}
   */
  @computed('rootFileErrorType', 'rootFileType')
  get errorText() {
    if (!this.rootFileErrorType) {
      return '';
    }
    const rootFileType = convertFromLegacyFileTypeIfNeeded(this.rootFileType) ?? 'item';
    return this.t(
      `rootFileTip.${this.rootFileErrorType}`, {
        fileType: this.t(`fileType.${rootFileType}`),
      }, {
        defaultValue: undefined,
      }
    );
  }

  /**
   * @type {SafeString}
   */
  @computed('rootFileErrorType', 'errorText', 'errorDetails')
  get tip() {
    if (this.rootFileErrorType === ShareFileErrorType.OtherError && this.errorDetails) {
      const errorDetailsText = _.lowerFirst(this.errorDetails);
      return htmlSafe(String(this.errorText) + _.escape(`: ${errorDetailsText}`));
    } else {
      return this.errorText;
    }
  }

  /**
   * @type {string}
   */
  @computed('publicFileError', 'privateFileError')
  get errorDetails() {
    const error = this.privateFileError || this.publicFileError;
    if (error) {
      return this.errorExtractor.getMessage(error)?.message;
    }
    return '';
  }
}
