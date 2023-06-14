import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, click, fillIn, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { lookupService } from '../../../helpers/stub-service';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { resolve, Promise } from 'rsvp';
import sinon from 'sinon';
import { isSlideActive, getSlide } from '../../../helpers/one-carousel';

describe('Integration | Component | space-automation/run-workflow-creator', function () {
  setupRenderingTest();

  beforeEach(function () {
    const atmWorkflowSchemas = [{
      entityId: 'workflow1',
      name: 'workflow 1',
      revisionRegistry: {
        1: {
          stores: [{
            id: 'store1',
            name: 'store 1',
            type: 'singleValue',
            config: {
              itemDataSpec: {
                type: 'number',
              },
            },
            requiresInitialContent: true,
          }],
        },
      },
      isCompatible: true,
      isLoaded: true,
    }, {
      entityId: 'workflow2',
      name: 'workflow 2',
      revisionRegistry: {
        1: {
          stores: [{
            id: 'store2',
            name: 'store 2',
            type: 'list',
            config: {
              itemDataSpec: {
                type: 'string',
              },
            },
            requiresInitialContent: true,
          }],
        },
      },
      isCompatible: true,
      isLoaded: true,
    }];
    const workflowManager = lookupService(this, 'workflow-manager');
    sinon.stub(workflowManager, 'getAtmWorkflowSchemaById')
      .callsFake(atmWorkflowSchemaId =>
        resolve(atmWorkflowSchemas.findBy('entityId', atmWorkflowSchemaId))
      );
    sinon.stub(workflowManager, 'getAllKnownAtmWorkflowSchemas')
      .returns(promiseArray(resolve(atmWorkflowSchemas)));
    this.setProperties({
      atmWorkflowSchemas,
      space: { entityId: 'space1' },
      workflowStartedSpy: sinon.spy(),
      runWorkflowStub: sinon.stub(lookupService(this, 'workflow-manager'), 'runWorkflow'),
      atmWorkflowSchemaId: undefined,
      atmWorkflowSchemaRevisionNumber: undefined,
      chooseWorkflowSchemaToRun: (id, revNo) => this.setProperties({
        atmWorkflowSchemaId: id,
        atmWorkflowSchemaRevisionNumber: revNo,
      }),
    });
  });

  it('has class "run-workflow-creator"', async function () {
    await renderComponent();

    expect(this.element.children).to.have.length(1);
    expect(this.element.children[0]).to.have.class('run-workflow-creator');
  });

  it('has slides "list" and "setup"', async function () {
    await renderComponent();

    expect(getSlide('list')).to.exist;
    expect(getSlide('setup')).to.exist;
  });

  it('has active slide "list" on init, which shows list of user workflow schemas',
    async function () {
      await renderComponent();

      expect(isSlideActive('list')).to.be.true;
      const listSlide = getSlide('list');
      expect(listSlide.querySelector('.slide-header').textContent.trim())
        .to.equal('Choose workflow you would like to run');
      const workflowsListComponent =
        listSlide.querySelector('.atm-workflow-schemas-list');
      expect(workflowsListComponent).to.exist;
      expect(workflowsListComponent.textContent).to.contain('workflow 1');
    });

  it('shows "setup" slide after workflow schema selection', async function () {
    await renderComponent();

    await click(getSlide('list').querySelector('.revisions-table-revision-entry'));

    expect(isSlideActive('setup')).to.be.true;
    const setupSlide = getSlide('setup');
    expect(setupSlide.querySelector('.slide-header').textContent.trim())
      .to.equal('Run new "workflow 1" workflow execution');
    const inputStoresForm = setupSlide.querySelector('.input-stores-form');
    expect(inputStoresForm).to.exist;
    expect(inputStoresForm.textContent).to.contain('store 1');
    const backBtn = setupSlide.querySelector('.btn-back');
    const submitBtn = setupSlide.querySelector('.btn-submit');
    expect(backBtn).to.have.class('btn-default');
    expect(backBtn).to.have.trimmed.text('Back');
    expect(backBtn).to.not.have.attr('disabled');
    expect(submitBtn).to.have.class('btn-primary');
    expect(submitBtn).to.have.trimmed.text('Run workflow');
    expect(submitBtn).to.not.have.attr('disabled');
  });

  it('disables submit button when input store value is invalid', async function () {
    await renderComponent();
    await click(getSlide('list').querySelector('.revisions-table-revision-entry'));

    await fillIn(getSlide('setup').querySelector('.form-control'), 'abc');

    expect(getSlide('setup').querySelector('.btn-submit')).to.have.attr('disabled');
  });

  it('enables submit button when input store value is valid', async function () {
    await renderComponent();
    await click(getSlide('list').querySelector('.revisions-table-revision-entry'));

    await fillIn(getSlide('setup').querySelector('.form-control'), '10');

    expect(getSlide('setup').querySelector('.btn-submit'))
      .to.not.have.attr('disabled');
  });

  it('enabled submit button and shows proper message when workflow does not need any initial values',
    async function () {
      this.get('atmWorkflowSchemas.0.revisionRegistry.1.stores')
        .setEach('requiresInitialContent', false);
      await renderComponent();

      await click(getSlide('list').querySelector('.revisions-table-revision-entry'));

      const setupSlide = getSlide('setup');
      expect(setupSlide.querySelector('.btn-submit')).to.not.have.attr('disabled');
      expect(setupSlide.querySelector('.input-stores-form')).to.not.exist;
      expect(
        setupSlide.querySelector('.nothing-to-provide-message')
      ).to.have.trimmed.text('This workflow does not need any initial values.');
    });

  it('calls "onWorkflowStarted" and changes slide to "list" on successfull workflow start',
    async function () {
      const {
        workflowStartedSpy,
        runWorkflowStub,
      } = this.getProperties('workflowStartedSpy', 'runWorkflowStub');
      const atmWorkflowExecution = {};
      runWorkflowStub.resolves(atmWorkflowExecution);
      await renderComponent();

      expect(runWorkflowStub).to.be.not.called;
      expect(workflowStartedSpy).to.be.not.called;
      const listSlide = getSlide('list');
      const setupSlide = getSlide('setup');
      await click(listSlide.querySelector('.revisions-table-revision-entry'));
      await fillIn(setupSlide.querySelector('.form-control'), '10');
      await click(setupSlide.querySelector('.btn-submit'));

      expect(runWorkflowStub).to.be.calledOnce
        .and.to.be.calledWith('workflow1', 1, 'space1', {
          store1: 10,
        });
      expect(workflowStartedSpy).to.be.calledOnce
        .and.to.be.calledWith(sinon.match.same(atmWorkflowExecution));
      expect(isSlideActive('list')).to.be.true;
    });

  it('does not call "onWorkflowStarted" and stays on "setup" slide on failed workflow start',
    async function () {
      const {
        workflowStartedSpy,
        runWorkflowStub,
      } = this.getProperties('workflowStartedSpy', 'runWorkflowStub');
      let rejectPromise;
      runWorkflowStub.returns(new Promise((resolve, reject) => rejectPromise = reject));
      await renderComponent();

      const listSlide = getSlide('list');
      const setupSlide = getSlide('setup');
      await click(listSlide.querySelector('.revisions-table-revision-entry'));
      await fillIn(setupSlide.querySelector('.form-control'), '10');
      await click(setupSlide.querySelector('.btn-submit'));
      rejectPromise();
      await settled();

      expect(workflowStartedSpy).to.not.be.called;
      expect(isSlideActive('setup')).to.be.true;
    });

  it('blocks all controls during workflow start process', async function () {
    this.get('runWorkflowStub').returns(new Promise(() => {}));
    await renderComponent();
    await click(getSlide('list').querySelector('.revisions-table-revision-entry'));
    const setupSlide = getSlide('setup');
    await fillIn(setupSlide.querySelector('.form-control'), '10');

    await click(setupSlide.querySelector('.btn-submit'));

    expect(setupSlide.querySelector('.btn-back')).to.have.attr('disabled');
    expect(setupSlide.querySelector('.btn-submit')).to.have.attr('disabled');
    expect(setupSlide.querySelector('.input-stores-form'))
      .to.have.class('form-disabled');
  });

  it('allows to go back to "list" slide on "Back" click on "setup" slide and select another workflow schema',
    async function () {
      await renderComponent();

      await click(getSlide('list').querySelector('.revisions-table-revision-entry'));
      await click(getSlide('setup').querySelector('.btn-back'));

      expect(isSlideActive('list')).to.be.true;
      await click(getSlide('list').querySelectorAll('.revisions-table-revision-entry')[1]);

      expect(isSlideActive('setup')).to.be.true;
      expect(getSlide('setup').textContent).to.contain('store 2');
    });
});

async function renderComponent() {
  await render(hbs `{{space-automation/run-workflow-creator
    space=space
    onWorkflowStarted=workflowStartedSpy
    chooseWorkflowSchemaToRun=chooseWorkflowSchemaToRun
    atmWorkflowSchemaId=atmWorkflowSchemaId
    atmWorkflowSchemaRevisionNumber=atmWorkflowSchemaRevisionNumber
  }}`);
}
