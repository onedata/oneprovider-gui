import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { lookupService } from '../../../helpers/stub-service';
import {
  getModal,
  getModalHeader,
  getModalBody,
} from '../../../helpers/modal';
import sinon from 'sinon';
import { Promise } from 'rsvp';
import wait from 'ember-test-helpers/wait';
import { click } from 'ember-native-dom-helpers';
import $ from 'jquery';

describe('Integration | Component | modals/atm task execution pods activity modal', function () {
  setupRenderingTest();

  beforeEach(function () {
    const atmTaskName = 'task1';
    const atmTaskExecutionId = 'task1ExecutionId';
    const workflowManager = lookupService(this, 'workflow-manager');
    const getOpenfaasRegistryMock = sinon.stub().resolves({ registry: {} });
    sinon.stub(workflowManager, 'getAtmTaskExecutionOpenfaasActivityRegistry')
      .withArgs(atmTaskExecutionId, sinon.match.any)
      .callsFake(() => getOpenfaasRegistryMock());
    this.setProperties({
      modalManager: lookupService(this, 'modal-manager'),
      modalOptions: {
        atmTaskName,
        atmTaskExecutionId,
      },
      atmTaskName,
      atmTaskExecutionId,
      getOpenfaasRegistryMock,
    });
  });

  it('renders modal with class "atm-task-execution-pods-activity-modal"', async function () {
    await showModal(this);

    expect($(getModal())).to.have.class('atm-task-execution-pods-activity-modal');
  });

  it('has correct modal header', async function () {
    await showModal(this);

    expect($(getModalHeader()).text()).to.contain('Function pods activity');
  });

  it('shows spinner when pods table is being loaded', async function () {
    this.get('getOpenfaasRegistryMock').returns(new Promise(() => {}));
    await showModal(this);

    const $modalBody = $(getModalBody());
    expect($modalBody.find('.spin-spinner')).to.exist;
  });

  it('shows error when pods table cannot be loaded', async function () {
    let rejectRequest;
    this.get('getOpenfaasRegistryMock').returns(
      new Promise((resolve, reject) => rejectRequest = reject)
    );
    await showModal(this);
    rejectRequest();
    await wait();

    const $modalBody = $(getModalBody());
    expect($modalBody.find('.resource-load-error')).to.exist;
  });

  it('shows pods table', async function () {
    setupPods(this, ['Succeeded', 'Pending', 'Running']);

    await showModal(this);

    const $podsRows = $(getModalBody()).find('.pods-table-pod-row');
    expect($podsRows).to.have.length(2);
    expect($podsRows.eq(0).text()).to.contain('pod3');
    expect($podsRows.eq(1).text()).to.contain('pod2');
  });

  it('allows selecting pod', async function () {
    setupPods(this, ['Running', 'Running']);
    await showModal(this);

    await click('[data-pod-id="pod2"]');

    const $selectedPodRow = this.$('.pods-table-pod-row.is-selected');
    expect($selectedPodRow).to.have.length(1);
    expect($selectedPodRow.text()).to.contain('pod2');
  });

  it('shows empty events section when no pod is selected', async function () {
    setupPods(this, ['Running']);
    await showModal(this);

    expect($(getModalBody()).find('.events-table-section').text())
      .to.contain('Select pod to see events');
  });
});

async function showModal(testCase) {
  const {
    modalManager,
    modalOptions,
  } = testCase.getProperties('modalManager', 'modalOptions');

  await render(hbs `{{global-modal-mounter}}`);

  await modalManager
    .show('atm-task-execution-pods-activity-modal', modalOptions)
    .shownPromise;
}

function setupPods(testCase, statuses) {
  testCase.get('getOpenfaasRegistryMock').resolves({
    registry: statuses.reduce((acc, status, idx) => {
      acc[`pod${idx + 1}`] = {
        currentStatus: status,
      };
      return acc;
    }, {}),
  });
}
