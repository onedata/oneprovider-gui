import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { resolve } from 'rsvp';
import sinon from 'sinon';
import { click } from 'ember-native-dom-helpers';
import { lookupService } from '../../../helpers/stub-service';

describe('Integration | Component | space automation/atm workflow schemas list', function () {
  setupComponentTest('space-automation/atm-workflow-schemas-list', {
    integration: true,
  });

  beforeEach(function () {
    const atmWorkflowSchemas1 = [{
      name: 'workflow3',
      summary: 'w3 summary',
      revisionRegistry: {
        1: {},
      },
      isLoaded: true,
    }, {
      name: 'workflow1',
      summary: 'w1 summary',
      revisionRegistry: {
        1: {},
      },
      isLoaded: true,
    }];
    const atmWorkflowSchemas2 = [{
      name: 'workflow2',
      summary: 'w2 summary',
      revisionRegistry: {
        1: {},
      },
      isLoaded: true,
    }, {
      name: 'workflow4',
      summary: 'w4 summary',
      revisionRegistry: {
        1: {},
      },
      isLoaded: true,
    }];
    sinon.stub(lookupService(this, 'workflow-manager'), 'getAllKnownAtmWorkflowSchemas')
      .returns(promiseArray(resolve([...atmWorkflowSchemas1, ...atmWorkflowSchemas2])));
    this.set('onAtmWorkflowSchemaRevisionSelect', sinon.spy());
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
      expect($entries.eq(entryNo - 1).find('.workflow-schema-summary').text().trim())
        .to.equal(`w${entryNo} summary`);
    });
  });

  it('notifies about workflow schema selection', async function () {
    const onAtmWorkflowSchemaRevisionSelect = this.get('onAtmWorkflowSchemaRevisionSelect');
    await render(this);

    expect(onAtmWorkflowSchemaRevisionSelect).to.be.not.called;
    await click(this.$('.list-entry').eq(1).find('.revisions-table-revision-entry')[0]);

    expect(onAtmWorkflowSchemaRevisionSelect).to.be.calledOnce.and.to.be.calledWith(
      sinon.match({ name: 'workflow2' }), 1
    );
  });
});

async function render(testCase) {
  testCase.render(hbs `
    {{space-automation/atm-workflow-schemas-list
      onAtmWorkflowSchemaRevisionSelect=onAtmWorkflowSchemaRevisionSelect
    }}
  `);
  await wait();
}
