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

describe('Integration | Component | space automation/run workflow creator', function () {
  setupComponentTest('space-automation/run-workflow-creator', {
    integration: true,
  });

  beforeEach(function () {
    const atmWorkflowSchema = {
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
    };
    const atmInventory = {
      atmWorkflowSchemaList: promiseObject(resolve({
        list: promiseArray(resolve([atmWorkflowSchema])),
      })),
    };
    set(lookupService(this, 'current-user'), 'userProxy', promiseObject(resolve({
      atmInventoryList: promiseObject(resolve({
        list: promiseArray(resolve([atmInventory])),
      })),
    })));
    this.setProperties({
      space: { entityId: 'space1' },
      workflowStartedSpy: sinon.spy(),
      runWorkflowStub: sinon.stub(lookupService(this, 'workflow-manager'), 'runWorkflow'),
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
      const workflowsListComponent =
        listSlide.querySelector('.atm-workflow-schemas-list');
      expect(workflowsListComponent).to.exist;
      expect(workflowsListComponent.textContent).to.contain('workflow 1');
    });

  it('shows "inputStores" slide after workflow schema selection', async function () {
    await render(this);

    await click(getSlide('list').querySelector('.list-entry'));

    expect(isSlideActive('inputStores')).to.be.true;
    const inputStoresForm = getSlide('inputStores').querySelector('.input-stores-form');
    expect(inputStoresForm).to.exist;
    expect(inputStoresForm.textContent).to.contain('store 1');
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
});

async function render(testCase) {
  testCase.render(hbs `{{space-automation/run-workflow-creator
    space=space
    onWorkflowStarted=workflowStartedSpy
  }}`);
  await wait();
}
