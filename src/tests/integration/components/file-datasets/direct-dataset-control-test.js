import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import { lookupService } from '../../../helpers/stub-service';
import { findByText } from '../../../helpers/find';
import { run } from '@ember/runloop';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import { click, find } from 'ember-native-dom-helpers';
import sinon from 'sinon';

describe('Integration | Component | file datasets/direct dataset control', function () {
  setupComponentTest('file-datasets/direct-dataset-control', {
    integration: true,
  });

  beforeEach(async function () {
    this.helper = new DirectDatsetControlHelper(this);
    await this.helper.givenFile();
  });

  it('renders icon and text proper for "not established" direct dataset for file', async function () {
    await this.helper.givenDirectDataset(null);
    await this.helper.renderComponent();

    const directDatasetControl = find('.direct-dataset-control');
    expect(directDatasetControl).to.exist;
    expect(directDatasetControl.textContent)
      .to.contain('No dataset has been established on this file.');
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
      `This file is a dataset (established at ${moment(time * 1000).format('D MMM YYYY H:mm')}).`
    );
    const icon = directDatasetControl.querySelector('.oneicon-checkbox-filled');
    expect(icon).to.exist;
  });

  it('renders icon and text proper for "detached" direct dataset for file', async function () {
    const time = moment('2020-01-01T08:50:00+00:00').unix();
    await this.helper.givenDirectDataset({
      state: 'detached',
      creationTime: time,
    });

    await this.helper.renderComponent();

    const directDatasetControl = find('.direct-dataset-control');
    expect(directDatasetControl).to.exist;
    expect(directDatasetControl.textContent).to.contain(
      `This file has been detached from its dataset (established at ${moment(time * 1000).format('D MMM YYYY H:mm')}).`
    );
    const icon = directDatasetControl.querySelector('.oneicon-plug-out');
    expect(icon).to.exist;
  });

  it('renders "establish" button with proper action if direct dataset is not established', async function () {
    await this.helper.givenDirectDataset(null);
    const onEstablishDirectDataset = sinon.stub();
    onEstablishDirectDataset.resolves();
    this.set('onEstablishDirectDataset', onEstablishDirectDataset);

    await this.helper.renderComponent();

    const establishButton = find('.establish-btn');
    expect(establishButton).to.exist;
    expect(establishButton.textContent).to.contain('Establish dataset');
    await click(establishButton);
    expect(onEstablishDirectDataset).to.have.been.calledOnce;
  });

  const menuActions = {
    attached: ['Copy ID', 'Create archive', 'Detach', 'Remove'],
    detached: ['Copy ID', 'Create archive', 'Reattach', 'Remove'],
  };

  ['attached', 'detached'].forEach(state => {
    it(
      `renders dataset actions trigger button that shows menu on click if direct dataset is established and ${state}`,
      async function () {
        await this.helper.givenDirectDataset({
          state,
        });

        await this.helper.renderComponent();

        expect(find('.actions-popover-content')).to.not.exist;
        const menuTrigger = this.helper.getActionsTrigger();
        expect(menuTrigger).to.exist;
        expect(menuTrigger.textContent).to.contain('Actions');
        await click(menuTrigger);
        expect(find('.actions-popover-content')).to.exist;
      }
    );
    const menuActionsForState = menuActions[state];
    it(
      `shows proper actions in menu if direct dataset is established and ${state}`,
      async function () {
        await this.helper.givenDirectDataset({
          state,
        });

        await this.helper.renderComponent();
        await this.helper.openActions();

        menuActionsForState.forEach(actionText => {
          expect(
            findByText(actionText, '.actions-popover-content .one-label'),
            actionText
          ).to.exist;
        });
      }
    );
  });
});

class DirectDatsetControlHelper {
  constructor(testCase) {
    this.testCase = testCase;
    this.store = lookupService(this.testCase, 'store');
    this.spacePrivileges = {
      manageDatasets: true,
      createArchives: true,
    };
    this.testCase.set('spacePrivileges', this.spacePrivileges);
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
  async givenDirectDataset(data = null) {
    const dataset = data && run(() =>
      this.store.createRecord('dataset', Object.assign({}, data))
    );
    if (dataset) {
      await run(async () => dataset.save());
    }
    this.testCase.set('directDataset', dataset);
    this.testCase.set('directDatasetProxy', promiseObject(resolve(dataset)));
    return dataset;
  }
  async renderComponent() {
    await this.testCase.get('directDatasetProxy');
    this.testCase.render(hbs `
      {{file-datasets/direct-dataset-control
        file=file
        directDatasetProxy=directDatasetProxy
        spacePrivileges=spacePrivileges
        onEstablishDirectDataset=onEstablishDirectDataset
      }}
    `);
  }
  getActionsTrigger() {
    return find('.direct-dataset-actions-trigger');
  }
  async openActions() {
    return await click(this.getActionsTrigger());
  }
}
