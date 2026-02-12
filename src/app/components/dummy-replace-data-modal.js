/**
 * Container for development tests of replace-data-modal (rendered from
 * GlobalModalMounter).
 *
 * @author Jakub Liput
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import moment from 'moment';
import { LegacyFileType } from 'onedata-gui-common/utils/file';

export default class DummyReplaceDataModalComponent extends Component {
  @service modalManager;
  @service store;

  constructor() {
    super(...arguments);
    (async () => {
      await this.initFile();
      this.showModal();
    })();
  }

  willDestroy() {
    this.destroyFile();
  }

  async initFile() {
    const modificationMoment = moment();
    this.file = await this.store.createRecord('file', {
      type: LegacyFileType.Regular,
      // name: 'Test-File-Test-File-Test-File-Test-File-Test-File-Test-File-Test-File-Test-File-Test-File-Test-File-Test-File-Test-File.txt',
      name: 'Test-File.txt',
      size: 2048,
      mtime: modificationMoment.unix(),
    }).save();
  }

  async destroyFile() {
    this.file?.destroyRecord();
  }

  showModal() {
    this.modalManager.show('replace-data-modal', {
      file: this.file,
      browserModel: null,
    });
  }

}
