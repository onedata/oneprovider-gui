/**
 * Shows warnings about share in OpenData metadata context.
 *
 * Currently shows only "different name" warning.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { action, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import _ from 'lodash';
import globals from 'onedata-gui-common/utils/globals';
import { tracked } from '@glimmer/tracking';

const mixins = [
  I18n,
];

export default class ShareValidation extends Component.extend(...mixins) {
  @service shareManager;
  @service globalNotify;
  @service currentUser;

  classNames = ['share-validation'];

  /**
   * @override
   */
  i18nPrefix = 'components.shareShow.edm.shareValidation';

  /**
   * @virtual
   * @type {Utils.VisualEdmViewModel}
   */
  visualEdmViewModel = undefined;

  @tracked
  isDismissed = undefined;

  /**
   * @type {Models.Share}
   */
  @reads('visualEdmViewModel.share') share;

  /**
   * @type {boolean}
   */
  @reads('visualEdmViewModel.isPublicView') isPublicView;

  /**
   * @type {string}
   */
  @reads('share.entityId') shareId;

  /**
   * @type {string}
   */
  @reads('currentUser.userId') userId;

  @computed('share.name', 'visualEdmTitles.length', 'isPublicView', 'isDismissed')
  get isShareNameWarningShown() {
    if (
      this.isPublicView ||
      this.isDismissed ||
      !this.share ||
      !this.visualEdmTitles?.length
    ) {
      return false;
    }
    const shareName = this.share.name;
    return !this.visualEdmTitles.some(title => title === shareName);
  }

  /**
   * @type {Array<string>}
   */
  @computed('visualEdmViewModel.model')
  get visualEdmTitles() {
    if (!this.visualEdmViewModel) {
      return [];
    }
    const allChoProperties = _.flatten(
      this.visualEdmViewModel
      .edmObjects
      .filter(edmObject => edmObject.edmObjectType === EdmObjectType.ProvidedCHO)
      .map(cho => cho.edmProperties)
    );
    return allChoProperties
      .filter(property => property.xmlTagName === 'dc:title')
      .map(property => property.value);
  }

  /**
   * @type {string}
   */
  @computed('visualEdmTitles')
  get firstMetadataTitle() {
    return this.visualEdmTitles[0];
  }

  @computed('shareId', 'userId')
  get nameWarningDismissKey() {
    return `shareValidation.user:${this.userId}.share:${this.shareId}.nameWarningDismissed`;
  }

  init() {
    super.init(...arguments);
    this.loadNameWarningDismissState();
  }

  /**
   * @returns {boolean} True if user dismissed the name warning in this browser.
   */
  loadNameWarningDismissState() {
    const isDismissed =
      Boolean(globals.localStorage.getItem(this.nameWarningDismissKey) === 'true');
    this.set('isDismissed', isDismissed);
    return isDismissed;
  }

  saveNameWarningDismissState(isDismissed) {
    globals.localStorage.setItem(this.nameWarningDismissKey, String(isDismissed));
    this.set('isDismissed', isDismissed);
  }

  /**
   * @returns {Promise}
   */
  @action
  async applyName() {
    if (!this.firstMetadataTitle || !this.share) {
      return;
    }
    try {
      await this.shareManager.renameShare(this.share, this.firstMetadataTitle);
    } catch (error) {
      this.globalNotify.backendError(this.t('settingShareName'), error);
    }
  }

  /**
   * @returns {void}
   */
  @action
  dismissName() {
    this.saveNameWarningDismissState(true);
  }
}
