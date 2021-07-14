import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { lookupService } from '../../../helpers/stub-service';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { resolve, Promise } from 'rsvp';
import { set } from '@ember/object';
import wait from 'ember-test-helpers/wait';
import sinon from 'sinon';
import { isSlideActive, getSlide } from '../../../helpers/one-carousel';
import { click, fillIn } from 'ember-native-dom-helpers';
import $ from 'jquery';

describe('Integration | Component | space automation/run workflow creator', function () {
  setupComponentTest('space-automation/run-workflow-creator', {
    integration: true,
  });

  beforeEach(function () {
    const atmWorkflowSchemas = [{
      entityId: 'workflow1',
      name: 'workflow 1',
      stores: [{
        id: 'store1',
        name: 'store 1',
        type: 'singleValue',
        dataSpec: {
          type: 'integer',
          valueConstraints: {},
        },
        requiresInitialValue: true,
      }],
    }, {
      entityId: 'workflow2',
      name: 'workflow 2',
      stores: [{
        id: 'store2',
        name: 'store 2',
        type: 'list',
        dataSpec: {
          type: 'string',
          valueConstraints: {},
        },
        requiresInitialValue: true,
      }],
    }];
    const atmInventory = {
      atmWorkflowSchemaList: promiseObject(resolve({
        list: promiseArray(resolve(atmWorkflowSchemas)),
      })),
    };
    set(lookupService(this, 'current-user'), 'userProxy', promiseObject(resolve({
      effAtmInventoryList: promiseObject(resolve({
        list: promiseArray(resolve([atmInventory])),
      })),
    })));
    sinon.stub(lookupService(this, 'workflow-manager'), 'getAtmWorkflowSchemaById')
      .callsFake(workflowSchemaId =>
        resolve(atmWorkflowSchemas.findBy('entityId', workflowSchemaId))
      );
    this.setProperties({
      atmWorkflowSchemas,
      space: { entityId: 'space1' },
      workflowStartedSpy: sinon.spy(),
      runWorkflowStub: sinon.stub(lookupService(this, 'workflow-manager'), 'runWorkflow'),
      workflowSchemaId: undefined,
      chooseWorkflowSchemaToRun: id => this.set('workflowSchemaId', id),
    });
  });

  it('has class "run-workflow-creator"', async function () {
    await render(this);

    expect(this.$().children()).to.have.class('run-workflow-creator')
      .and.to.have.length(1);
  });

  it('has slides "list" and "inputStores"', async function () {
    await render(this);

    expect(getSlide('list')).to.exist;
    expect(getSlide('inputStores')).to.exist;
  });

  it('has active slide "list" on init, which shows list of user workflow schemas',
    async function () {
      await render(this);

      expect(isSlideActive('list')).to.be.true;
      const listSlide = getSlide('list');
      expect(listSlide.querySelector('.slide-header').textContent.trim())
        .to.equal('Choose workflow you would like to run');
      const workflowsListComponent =
        listSlide.querySelector('.atm-workflow-schemas-list');
      expect(workflowsListComponent).to.exist;
      expect(workflowsListComponent.textContent).to.contain('workflow 1');
    });

  it('shows "inputStores" slide after workflow schema selection', async function () {
    await render(this);

    await click(getSlide('list').querySelector('.list-entry'));

    expect(isSlideActive('inputStores')).to.be.true;
    const inputStoresSlide = getSlide('inputStores');
    expect(inputStoresSlide.querySelector('.slide-header').textContent.trim())
      .to.equal('Provide initial values for "workflow 1" workflow');
    const inputStoresForm = inputStoresSlide.querySelector('.input-stores-form');
    expect(inputStoresForm).to.exist;
    expect(inputStoresForm.textContent).to.contain('store 1');
    const $backBtn = $(inputStoresSlide.querySelector('.btn-back'));
    const $submitBtn = $(inputStoresSlide.querySelector('.btn-submit'));
    expect($backBtn).to.have.class('btn-default');
    expect($backBtn.text().trim()).to.equal('Back');
    expect($backBtn).to.be.not.disabled;
    expect($submitBtn).to.have.class('btn-primary');
    expect($submitBtn.text().trim()).to.equal('Run workflow');
    expect($submitBtn).to.be.disabled;
  });

  it('disables submit button when input store value is invalid', async function () {
    await render(this);
    await click(getSlide('list').querySelector('.list-entry'));

    await fillIn(getSlide('inputStores').querySelector('.form-control'), 'abc');

    expect($(getSlide('inputStores').querySelector('.btn-submit'))).to.be.disabled;
  });

  it('enables submit button when input store value is valid', async function () {
    await render(this);
    await click(getSlide('list').querySelector('.list-entry'));

    await fillIn(getSlide('inputStores').querySelector('.form-control'), '10');

    expect($(getSlide('inputStores').querySelector('.btn-submit'))).to.be.enabled;
  });

  it('enabled submit button and shows proper message when workflow does not need any initial values',
    async function () {
      this.get('atmWorkflowSchemas.0.stores').setEach('requiresInitialValue', false);
      await render(this);

      await click(getSlide('list').querySelector('.list-entry'));

      const inputStoresSlide = getSlide('inputStores');
      expect($(inputStoresSlide.querySelector('.btn-submit'))).to.be.enabled;
      expect(inputStoresSlide.querySelector('.input-stores-form')).to.not.exist;
      expect(
        inputStoresSlide.querySelector('.nothing-to-provide-message').textContent.trim()
      ).to.equal('This workflow does not need any initial values.');
    });

  it('calls "onWorkflowStarted" and changes slide to "list" on successfull workflow start',
    async function () {
      const {
        workflowStartedSpy,
        runWorkflowStub,
      } = this.getProperties('workflowStartedSpy', 'runWorkflowStub');
      const atmWorkflowExecution = {};
      runWorkflowStub.resolves(atmWorkflowExecution);
      await render(this);

      expect(runWorkflowStub).to.be.not.called;
      expect(workflowStartedSpy).to.be.not.called;
      const listSlide = getSlide('list');
      const inputStoresSlide = getSlide('inputStores');
      await click(listSlide.querySelector('.list-entry'));
      await fillIn(inputStoresSlide.querySelector('.form-control'), '10');
      await click(inputStoresSlide.querySelector('.btn-submit'));

      expect(runWorkflowStub).to.be.calledOnce
        .and.to.be.calledWith('workflow1', 'space1', {
          store1: 10,
        });
      expect(workflowStartedSpy).to.be.calledOnce
        .and.to.be.calledWith(sinon.match.same(atmWorkflowExecution));
      expect(isSlideActive('list')).to.be.true;
    });

  it('does not call "onWorkflowStarted" and stays on "inputStores" slide on failed workflow start',
    async function () {
      const {
        workflowStartedSpy,
        runWorkflowStub,
      } = this.getProperties('workflowStartedSpy', 'runWorkflowStub');
      let rejectPromise;
      runWorkflowStub.returns(new Promise((resolve, reject) => rejectPromise = reject));
      await render(this);

      const listSlide = getSlide('list');
      const inputStoresSlide = getSlide('inputStores');
      await click(listSlide.querySelector('.list-entry'));
      await fillIn(inputStoresSlide.querySelector('.form-control'), '10');
      await click(inputStoresSlide.querySelector('.btn-submit'));
      rejectPromise();
      await wait();

      expect(workflowStartedSpy).to.not.be.called;
      expect(isSlideActive('inputStores')).to.be.true;
    });

  it('blocks all controls during workflow start process', async function () {
    this.get('runWorkflowStub').returns(new Promise(() => {}));
    await render(this);
    await click(getSlide('list').querySelector('.list-entry'));
    const inputStoresSlide = getSlide('inputStores');
    await fillIn(inputStoresSlide.querySelector('.form-control'), '10');

    await click(inputStoresSlide.querySelector('.btn-submit'));

    expect($(inputStoresSlide.querySelector('.btn-back'))).to.be.disabled;
    expect($(inputStoresSlide.querySelector('.btn-submit'))).to.be.disabled;
    expect($(inputStoresSlide.querySelector('.input-stores-form')))
      .to.have.class('form-disabled');
  });

  it('allows to go back to "list" slide on "Back" click on "inputStores" slide and select another workflow schema',
    async function () {
      await render(this);

      await click(getSlide('list').querySelector('.list-entry'));
      await click(getSlide('inputStores').querySelector('.btn-back'));

      expect(isSlideActive('list')).to.be.true;
      await click(getSlide('list').querySelectorAll('.list-entry')[1]);

      expect(isSlideActive('inputStores')).to.be.true;
      expect(getSlide('inputStores').textContent).to.contain('store 2');
    });
});

async function render(testCase) {
  testCase.render(hbs `{{space-automation/run-workflow-creator
    space=space
    onWorkflowStarted=workflowStartedSpy
    chooseWorkflowSchemaToRun=chooseWorkflowSchemaToRun
    workflowSchemaId=workflowSchemaId
  }}`);
  await wait();
}
