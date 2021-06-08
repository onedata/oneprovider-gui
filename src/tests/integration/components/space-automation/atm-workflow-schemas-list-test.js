import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { resolve } from 'rsvp';
import sinon from 'sinon';
import { click } from 'ember-native-dom-helpers';

describe('Integration | Component | space automation/atm workflow schemas list', function () {
  setupComponentTest('space-automation/atm-workflow-schemas-list', {
    integration: true,
  });

  beforeEach(function () {
    const atmWorkflowSchemas1 = [{
      name: 'workflow3',
      description: 'w3 description',
    }, {
      name: 'workflow1',
      description: 'w1 description',
    }];
    const atmWorkflowSchemas2 = [{
      name: 'workflow2',
      description: 'w2 description',
    }, {
      name: 'workflow4',
      description: 'w4 description',
    }];
    const atmInventories = [{
      atmWorkflowSchemaList: promiseObject(resolve({
        list: promiseArray(resolve(atmWorkflowSchemas1)),
      })),
    }, {
      atmWorkflowSchemaList: promiseObject(resolve({
        list: promiseArray(resolve(atmWorkflowSchemas2)),
      })),
    }];
    this.setProperties({
      user: {
        atmInventoryList: promiseObject(resolve({
          list: promiseArray(resolve(atmInventories)),
        })),
      },
      atmWorkflowSchemaSelectSpy: sinon.spy(),
    });
  });

  it('has class "atm-workflow-schemas-list"', async function () {
    await render(this);

    expect(this.$().children()).to.have.class('atm-workflow-schemas-list')
      .and.to.have.length(1);
  });

  it('lists available workflow schemas from all inventories', async function () {
    await render(this);

    const $entries = this.$('.list-entry');
    expect($entries).to.have.length(4);
    [1, 2, 3, 4].forEach(entryNo => {
      expect($entries.eq(entryNo - 1).find('.workflow-schema-name').text().trim())
        .to.equal(`workflow${entryNo}`);
      expect($entries.eq(entryNo - 1).find('.workflow-schema-description').text().trim())
        .to.equal(`w${entryNo} description`);
    });
  });

  it('notifies about workflow schema selection', async function () {
    const atmWorkflowSchemaSelectSpy = this.get('atmWorkflowSchemaSelectSpy');
    await render(this);

    expect(atmWorkflowSchemaSelectSpy).to.be.not.called;
    await click(this.$('.list-entry')[1]);

    expect(atmWorkflowSchemaSelectSpy).to.be.calledOnce.and.to.be.calledWith(
      sinon.match({ name: 'workflow2' })
    );
  });
});

async function render(testCase) {
  testCase.render(hbs `
    {{space-automation/atm-workflow-schemas-list
      user=user
      onAtmWorkflowSchemaSelect=atmWorkflowSchemaSelectSpy
    }}
  `);
  await wait();
}
