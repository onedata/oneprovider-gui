/**
 * Shows status and operations on direct dataset for file.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import { lookupService } from '../../../helpers/stub-service';
import { run } from '@ember/runloop';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import { find } from 'ember-native-dom-helpers';

describe('Integration | Component | file datasets/direct dataset control', function () {
  setupComponentTest('file-datasets/direct-dataset-control', {
    integration: true,
  });

  beforeEach(async function () {
    this.helper = new DirectDatsetControlHelper(this);
    await this.helper.givenFile();
  });

  it('renders icon and text proper for "not established" direct dataset for file', async function () {
    await this.helper.renderComponent();

    const directDatasetControl = find('.direct-dataset-control');
    expect(directDatasetControl).to.exist;
    expect(directDatasetControl.textContent)
      .to.contain('This file has no direct dataset established.');
    const icon = directDatasetControl.querySelector('.oneicon-browser-info');
    expect(icon).to.exist;
  });

  it('renders icon and text proper for "attached" direct dataset for file', async function () {
    const time = moment('2020-01-01T08:50:00+00:00').unix();
    await this.helper.givenDirectDataset({
      state: 'attached',
      creationTime: time,
    });

    await this.helper.renderComponent();

    const directDatasetControl = find('.direct-dataset-control');
    expect(directDatasetControl).to.exist;
    expect(directDatasetControl.textContent).to.contain(
      `Dataset has been established on this file at ${moment(time * 1000).format('D MMM YYYY H:mm')}.`
    );
    const icon = directDatasetControl.querySelector('.oneicon-checkbox-filled');
    expect(icon).to.exist;
    expect(...icon.classList).to.contain('text-success');
  });

  it('renders icon and text proper for "detached" direct dataset for file', async function () {
    const time = moment('2020-01-01T08:50:00+00:00').unix();
    await this.helper.givenDirectDataset({
      state: 'detached',
      creationTime: moment('2020-01-01T08:50:00+00:00').unix(),
    });

    await this.helper.renderComponent();

    const directDatasetControl = find('.direct-dataset-control');
    expect(directDatasetControl).to.exist;
    expect(directDatasetControl.textContent).to.contain(
      `Dataset has been established on this file at ${moment(time * 1000).format('D MMM YYYY H:mm')}, but currently is detached.`
    );
    const icon = directDatasetControl.querySelector('.oneicon-plug-out');
    expect(icon).to.exist;
    expect(...icon.classList).to.contain('text-warning');
  });
});

class DirectDatsetControlHelper {
  constructor(testCase) {
    this.testCase = testCase;
    this.store = lookupService(this.testCase, 'store');
  }
  async givenFile(data = {}) {
    const file = run(() => this.store.createRecord('file', Object.assign({
      name: 'test-file.txt',
      type: 'file',
      modificationTime: moment('2020-01-01T06:30:00+00:00').unix(),
      posixPermissions: '777',
    }, data)));
    await run(async () => file.save());
    return this.testCase.set('file', file);
  }
  async givenDirectDataset(data = {}) {
    const dataset = run(() =>
      this.store.createRecord('dataset', Object.assign({}, data))
    );
    await run(async () => dataset.save());
    this.testCase.set('directDataset', dataset);
    this.testCase.set('directDatasetProxy', promiseObject(resolve(dataset)));
    return dataset;
  }
  async renderComponent() {
    this.testCase.render(hbs `
      {{file-datasets/direct-dataset-control
        file=file
        directDatasetProxy=directDatasetProxy
        readonly=readonly
      }}
    `);
  }
}
