import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, findAll, click } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { resolve } from 'rsvp';
import sinon from 'sinon';
import { lookupService } from '../../../helpers/stub-service';

describe('Integration | Component | space automation/atm workflow schemas list', function () {
  setupRenderingTest();

  beforeEach(function () {
    const atmWorkflowSchemas = [{
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
    }, {
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
      .returns(promiseArray(resolve([...atmWorkflowSchemas])));
    this.setProperties({
      onAtmWorkflowSchemaRevisionSelect: sinon.spy(),
      atmWorkflowSchemas,
    });
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

  it('disabled incompatible workflow schemas', async function () {
    this.get('atmWorkflowSchemas').findBy('name', 'workflow2').isCompatible = false;

    await renderComponent();

    const workflowEntry = findAll('.list-entry')[1];

    expect(workflowEntry).to.have.class('disabled-workflow-schema');
    expect(workflowEntry).to.not.contain('.revisions-table');
    expect(workflowEntry).to.contain.text(
      'This workflow is not compatible with the current Oneprovider version.'
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
