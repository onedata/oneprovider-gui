import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, findAll, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { resolve } from 'rsvp';
import sinon from 'sinon';
import { lookupService } from '../../../helpers/stub-service';

describe('Integration | Component | space automation/atm workflow schemas list', function () {
  setupRenderingTest();

  beforeEach(function () {
    const atmWorkflowSchemas1 = [{
      name: 'workflow3',
      summary: 'w3 summary',
      revisionRegistry: {
        1: {},
      },
      isCompatible: true,
      isLoaded: true,
    }, {
      name: 'workflow1',
      summary: 'w1 summary',
      revisionRegistry: {
        1: {},
      },
      isCompatible: true,
      isLoaded: true,
    }];
    const atmWorkflowSchemas2 = [{
      name: 'workflow2',
      summary: 'w2 summary',
      revisionRegistry: {
        1: {},
      },
      isCompatible: true,
      isLoaded: true,
    }, {
      name: 'workflow4',
      summary: 'w4 summary',
      revisionRegistry: {
        1: {},
      },
      isCompatible: true,
      isLoaded: true,
    }];
    sinon.stub(lookupService(this, 'workflow-manager'), 'getAllKnownAtmWorkflowSchemas')
      .returns(promiseArray(resolve([...atmWorkflowSchemas1, ...atmWorkflowSchemas2])));
    this.set('onAtmWorkflowSchemaRevisionSelect', sinon.spy());
  });

  it('has class "atm-workflow-schemas-list"', async function () {
    await renderComponent();

    expect(this.element.children).to.have.length(1);
    expect(this.element.children[0]).to.have.class('atm-workflow-schemas-list');
  });

  it('lists available workflow schemas from all inventories', async function () {
    await renderComponent();

    const entries = findAll('.list-entry');
    expect(entries).to.have.length(4);
    [1, 2, 3, 4].forEach(entryNo => {
      expect(entries[entryNo - 1].querySelector('.workflow-schema-name'))
        .to.have.trimmed.text(`workflow${entryNo}`);
      expect(entries[entryNo - 1].querySelector('.workflow-schema-summary'))
        .to.have.trimmed.text(`w${entryNo} summary`);
    });
  });

  it('notifies about workflow schema selection', async function () {
    const onAtmWorkflowSchemaRevisionSelect = this.get('onAtmWorkflowSchemaRevisionSelect');
    await renderComponent();

    expect(onAtmWorkflowSchemaRevisionSelect).to.be.not.called;
    await click(findAll('.list-entry')[1].querySelector('.revisions-table-revision-entry'));

    expect(onAtmWorkflowSchemaRevisionSelect).to.be.calledOnce.and.to.be.calledWith(
      sinon.match({ name: 'workflow2' }), 1
    );
  });
});

async function renderComponent() {
  await render(hbs `
    {{space-automation/atm-workflow-schemas-list
      onAtmWorkflowSchemaRevisionSelect=onAtmWorkflowSchemaRevisionSelect
    }}
  `);
}
