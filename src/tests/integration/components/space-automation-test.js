import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { click, fillIn } from 'ember-native-dom-helpers';
import { lookupService } from '../../helpers/stub-service';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { resolve } from 'rsvp';
import { set } from '@ember/object';
import { getSlide } from '../../helpers/one-carousel';
import sinon from 'sinon';

describe('Integration | Component | space automation', function () {
  setupComponentTest('space-automation', {
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
    sinon.stub(
      lookupService(this, 'workflow-manager'),
      'getAtmWorkflowExecutionsForSpace'
    ).resolves([]);
    this.setProperties({
      space: {
        entityId: 'space1',
      },
    });
  });

  it('has class "run-workflow-creator"', async function () {
    await render(this);

    expect(this.$().children()).to.have.class('space-automation')
      .and.to.have.length(1);
  });

  it('renders tabs: "waiting", "ongoing", "ended" and "run workflow"',
    async function () {
      await render(this);

      const $tabLinks = this.$('.nav-tabs .nav-link');
      expect($tabLinks).to.have.length(4);
      ['Waiting', 'Ongoing', 'Ended', 'Run workflow'].forEach((label, idx) => {
        expect($tabLinks.eq(idx).text().trim()).to.equal(label);
      });
    });

  it('has active "waiting" tab on init', async function () {
    await render(this);

    expect(this.$('.nav-item-waiting')).to.have.class('active');
  });

  it('allows to run new workflow', async function () {
    const runWorkflowStub =
      sinon.stub(lookupService(this, 'workflow-manager'), 'runWorkflow').resolves({});
    await render(this);

    await click('.nav-link-create');

    expect(this.$('.nav-item-create')).to.have.class('active');
    const $createTabPane = this.$('#create.tab-pane');
    expect($createTabPane).to.have.class('active');
    expect($createTabPane.find('.run-workflow-creator')).to.exist;
    await click(getSlide('list').querySelector('.list-entry'));
    await fillIn(getSlide('inputStores').querySelector('.form-control'), '10');
    await click(getSlide('inputStores').querySelector('.btn-submit'));

    expect(runWorkflowStub).to.be.calledOnce
      .and.to.be.calledWith('workflow1', 'space1', sinon.match.any);
    expect(this.$('.nav-item-waiting')).to.have.class('active');
  });
});

async function render(testCase) {
  testCase.render(hbs `{{space-automation space=space}}`);
  await wait();
}
