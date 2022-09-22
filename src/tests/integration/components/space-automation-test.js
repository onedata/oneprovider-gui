import { expect } from 'chai';
import { describe, it, beforeEach, context } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll, click, fillIn, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { lookupService } from '../../helpers/stub-service';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { resolve, Promise } from 'rsvp';
import { set } from '@ember/object';
import { getSlide } from '../../helpers/one-carousel';
import sinon from 'sinon';
import { suppressRejections } from '../../helpers/suppress-rejections';
import { schedule } from '@ember/runloop';

describe('Integration | Component | space automation', function () {
  setupRenderingTest();

  beforeEach(function () {
    const space = {
      entityId: 'space1',
    };
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
                type: 'integer',
                valueConstraints: {},
              },
            },
            requiresInitialContent: true,
          }],
        },
      },
      isCompatible: true,
      isLoaded: true,
    }];
    const atmInventory = {
      atmWorkflowSchemaList: promiseObject(resolve({
        list: promiseArray(resolve(atmWorkflowSchemas)),
      })),
    };
    const atmWorkflowExecution = {
      entityId: 'execution1',
      space: promiseObject(resolve(space)),
      // let assume, for simplicity, that workflow schema is also its own snapshot
      atmWorkflowSchemaSnapshot: promiseObject(resolve(atmWorkflowSchemas[0])),
      reload: () => resolve(),
      lanes: [],
    };
    set(lookupService(this, 'current-user'), 'userProxy', promiseObject(resolve({
      effAtmInventoryList: promiseObject(resolve({
        list: promiseArray(resolve([atmInventory])),
      })),
    })));
    const workflowManager = lookupService(this, 'workflow-manager');
    sinon.stub(workflowManager, 'getAtmWorkflowSchemaById')
      .callsFake(atmWorkflowSchemaId =>
        resolve(atmWorkflowSchemas.findBy('entityId', atmWorkflowSchemaId))
      );
    sinon.stub(workflowManager, 'getAtmWorkflowExecutionSummariesForSpace')
      .resolves([]);
    const getAtmWorkflowExecutionByIdStub = sinon.stub(
      workflowManager,
      'getAtmWorkflowExecutionById'
    ).withArgs('execution1').resolves(atmWorkflowExecution);
    this.setProperties({
      space,
      tab: undefined,
      atmWorkflowExecutionId: undefined,
      atmWorkflowExecution,
      changeTab: tab => this.set('tab', tab),
      getAtmWorkflowExecutionByIdStub,
      openPreviewTab: atmWorkflowExecutionId => this.setProperties({
        tab: 'preview',
        atmWorkflowExecutionId,
      }),
      closePreviewTabStub: sinon.stub().callsFake(() => {
        schedule('afterRender', this, () => this.setProperties({
          tab: 'waiting',
          atmWorkflowExecutionId: undefined,
        }));
      }),
      atmWorkflowSchemaId: undefined,
      atmWorkflowSchemaRevisionNumber: undefined,
      chooseWorkflowSchemaToRun: (id, revNo) => {
        this.setProperties({
          atmWorkflowSchemaId: id,
          atmWorkflowSchemaRevisionNumber: revNo,
        });
      },
    });
  });

  it('has class "run-workflow-creator"', async function () {
    await renderComponent();

    expect(this.element.children).to.have.length(1);
    expect(this.element.children[0]).to.have.class('space-automation');
  });

  it('renders tabs: "waiting", "ongoing", "ended", "suspended" and "run workflow"',
    async function () {
      await renderComponent();

      const tabLinks = findAll('.nav-tabs .nav-link');
      expect(tabLinks).to.have.length(5);
      ['Waiting', 'Ongoing', 'Ended', 'Suspended', 'Run workflow']
      .forEach((label, idx) => {
        expect(tabLinks[idx]).to.have.trimmed.text(label);
      });
    });

  it('has active "waiting" tab on init', async function () {
    await renderComponent();

    expect(find('.nav-item-waiting')).to.have.class('active');
  });

  it('allows to run new workflow', async function () {
    const runWorkflowStub =
      sinon.stub(lookupService(this, 'workflow-manager'), 'runWorkflow').resolves({
        entityId: 'execution1',
      });
    await renderComponent();

    await click('.nav-link-create');

    expect(find('.nav-item-create')).to.have.class('active');
    const createTabPane = find('#create.tab-pane');
    expect(createTabPane).to.have.class('active');
    expect(createTabPane.querySelector('.run-workflow-creator')).to.exist;
    await click(getSlide('list').querySelector('.revisions-table-revision-entry'));
    await fillIn(getSlide('inputStores').querySelector('.form-control'), '10');
    await click(getSlide('inputStores').querySelector('.btn-submit'));
    expect(runWorkflowStub).to.be.calledOnce
      .and.to.be.calledWith('workflow1', 1, 'space1', sinon.match.any);
    expect(find('.nav-item-preview')).to.have.class('active');
  });

  context('when tab is "preview"', function () {
    beforeEach(function () {
      this.set('tab', 'preview');
    });

    it('has active "preview" tab with workflow name when "atmWorkflowExecutionId" param points to an existing execution',
      async function () {
        this.set('atmWorkflowExecutionId', 'execution1');

        await renderComponent();

        const previewNavItem = find('.nav-item-preview');
        expect(previewNavItem).to.have.class('active');
        expect(previewNavItem).to.have.trimmed.text('workflow 1 (rev. 1)');
      });

    it('has active "preview" tab with "Cannot load" label when "atmWorkflowExecutionId" param points to a non-existing execution',
      async function () {
        suppressRejections();
        let rejectPromise;
        this.get('getAtmWorkflowExecutionByIdStub')
          .returns(new Promise((resolve, reject) => rejectPromise = reject));
        this.set('atmWorkflowExecutionId', 'execution1');

        await renderComponent();
        rejectPromise();
        await settled();

        const previewNavItem = find('.nav-item-preview');
        expect(previewNavItem).to.have.class('active');
        expect(previewNavItem).to.have.trimmed.text('Cannot load');
      });

    it('has active "preview" tab with "Cannot load" label when "atmWorkflowExecutionId" param points to an execution from another space',
      async function (done) {
        this.set(
          'atmWorkflowExecution.space',
          promiseObject(resolve({ entityId: 'space2' }))
        );
        this.set('atmWorkflowExecutionId', 'execution1');

        await renderComponent();

        const previewNavItem = find('.nav-item-preview');
        expect(previewNavItem).to.have.class('active');
        expect(previewNavItem).to.have.trimmed.text('Cannot load');
        done();
      });

    it('has active "preview" tab with "Loading..." label when "atmWorkflowExecutionId" param points to a long loading execution',
      async function () {
        this.get('getAtmWorkflowExecutionByIdStub').returns(new Promise(() => {}));
        this.set('atmWorkflowExecutionId', 'execution1');

        await renderComponent();

        const previewNavItem = find('.nav-item-preview');
        expect(previewNavItem).to.have.class('active');
        expect(previewNavItem).to.have.trimmed.text('Loading...');
      });

    it('calls "closePreviewTab" on init, when "atmWorkflowExecutionId" param is empty',
      async function () {
        await renderComponent();

        expect(this.get('closePreviewTabStub')).to.be.calledOnce;
        expect(find('.nav-item-waiting')).to.have.class('active');
      });
  });
});

async function renderComponent() {
  await render(hbs `{{space-automation
    space=space
    tab=tab
    atmWorkflowExecutionId=atmWorkflowExecutionId
    atmWorkflowSchemaId=atmWorkflowSchemaId
    atmWorkflowSchemaRevisionNumber=atmWorkflowSchemaRevisionNumber
    changeTab=changeTab
    openPreviewTab=openPreviewTab
    closePreviewTab=closePreviewTabStub
    chooseWorkflowSchemaToRun=chooseWorkflowSchemaToRun
  }}`);
}
