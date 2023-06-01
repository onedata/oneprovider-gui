import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll, fillIn } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import OneTooltipHelper from '../../../helpers/one-tooltip';
import sinon from 'sinon';
import guidToCdmiObjectId from 'oneprovider-gui/utils/guid-to-cdmi-object-id';
import { lookupService } from '../../../helpers/stub-service';
import { AtmDataSpecType } from 'onedata-gui-common/utils/atm-workflow/data-spec/types';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import { entityType as datasetEntityType } from 'oneprovider-gui/models/dataset';

describe('Integration | Component | space-automation/input-stores-form', function () {
  setupRenderingTest();

  beforeEach(function () {
    this.setProperties({
      atmWorkflowSchema: {
        revisionRegistry: {
          1: {
            stores: [{
              id: 'store1',
              name: 'singleValueNumberStore',
              description: 'single value number store',
              type: 'singleValue',
              config: {
                itemDataSpec: {
                  type: 'number',
                },
              },
              defaultInitialContent: 10,
              requiresInitialContent: true,
            }, {
              id: 'store2',
              name: 'listStringStore',
              description: 'list string store',
              type: 'list',
              config: {
                itemDataSpec: {
                  type: 'string',
                },
              },
              requiresInitialContent: true,
            }, {
              id: 'store3',
              name: 'singleValueStringStore',
              description: 'single value string store',
              type: 'singleValue',
              config: {
                itemDataSpec: {
                  type: 'string',
                },
              },
              requiresInitialContent: false,
            }],
          },
        },
      },
      atmWorkflowSchemaRevisionNumber: 1,
      isDisabled: false,
      changeSpy: sinon.spy(),
    });
  });

  it('has class "input-stores-form"', async function () {
    await renderComponent();

    expect(this.element.children).to.have.length(1);
    expect(this.element.children[0]).to.have.class('input-stores-form');
  });

  it('shows stores, that require initial value', async function () {
    await renderComponent();

    const inputStores = findAll('.inputStore-field');
    expect(inputStores).to.have.length(2);
    expect(inputStores[0]).to.contain.text('singleValueNumberStore');
    expect(inputStores[1]).to.contain.text('listStringStore');
  });

  it('shows store description as field tooltip', async function () {
    await renderComponent();

    const inputStores = findAll('.inputStore-field');
    const tooltip1Trigger = inputStores[0].querySelector('.one-label-tip .one-icon');
    const tooltip2Trigger = inputStores[1].querySelector('.one-label-tip .one-icon');
    expect(await new OneTooltipHelper(tooltip1Trigger).getText())
      .to.equal('single value number store');
    expect(await new OneTooltipHelper(tooltip2Trigger).getText())
      .to.equal('list string store');
  });

  it('does not show field tooltip when store does not have a description',
    async function () {
      getStores(this).forEach(store => delete store.description);

      await renderComponent();

      expect(find('.one-label-tip')).to.not.exist;
    });

  it('fills initial store value based on "store.defaultInitialContent"', async function () {
    await renderComponent();

    expect(find('.number-editor .form-control')).to.have.value('10');
  });

  it('notifies about current state (valid values scenario)', async function () {
    await renderComponent();

    await fillIn('.number-editor .form-control', '123');

    expect(this.changeSpy).to.be.calledWith({
      data: {
        store1: 123,
        store2: [],
      },
      isValid: true,
    });
  });

  it('notifies about current state (invalid values scenario)', async function () {
    await renderComponent();

    await fillIn('.number-editor .form-control', '');

    expect(this.changeSpy).to.be.calledWith({
      data: {
        store1: NaN,
        store2: [],
      },
      isValid: false,
    });
  });

  it('shows selected file name', async function () {
    setStores(this, [{
      id: 'store1',
      name: 'store1',
      type: 'singleValue',
      config: {
        itemDataSpec: {
          type: AtmDataSpecType.File,
        },
      },
      defaultInitialContent: { file_id: guidToCdmiObjectId('id0') },
      requiresInitialContent: true,
    }]);
    const dataStore = lookupService(this, 'store');
    sinon.stub(lookupService(this, 'file-manager'), 'getFileById')
      .withArgs('id0').resolves(dataStore.createRecord('file', {
        id: gri({
          entityType: fileEntityType,
          entityId: 'id0',
          aspect: 'instance',
          scope: 'auto',
        }),
        name: 'file1',
      }).save());
    await renderComponent();

    expect(find('.file-editor')).to.contain.text('file1');
  });

  it('shows selected dataset name', async function () {
    setStores(this, [{
      id: 'store1',
      name: 'store1',
      type: 'singleValue',
      config: {
        itemDataSpec: {
          type: AtmDataSpecType.Dataset,
        },
      },
      defaultInitialContent: { datasetId: 'id0' },
      requiresInitialContent: true,
    }]);
    const dataStore = lookupService(this, 'store');
    sinon.stub(lookupService(this, 'dataset-manager'), 'getDataset')
      .withArgs('id0').resolves(dataStore.createRecord('dataset', {
        id: gri({
          entityType: datasetEntityType,
          entityId: 'id0',
          aspect: 'instance',
          scope: 'auto',
        }),
        rootFilePath: 'a/b/file1',
      }).save());
    await renderComponent();

    expect(find('.dataset-editor')).to.contain.text('file1');
  });

  it('has all fields enabled by default', async function () {
    await renderComponent();

    expect(find('.input-stores-form')).to.have.class('form-enabled')
      .and.to.not.have.class('form-disabled');
    expect(find('.field-disabled')).to.not.exist;
  });

  it('allows to disable all fields', async function () {
    this.set('isDisabled', true);

    await renderComponent();

    expect(find('.input-stores-form')).to.have.class('form-disabled')
      .and.to.not.have.class('form-enabled');
    expect(find('.field-enabled')).to.not.exist;
  });
});

async function renderComponent() {
  await render(hbs `
    {{space-automation/input-stores-form
      atmWorkflowSchema=atmWorkflowSchema
      atmWorkflowSchemaRevisionNumber=atmWorkflowSchemaRevisionNumber
      isDisabled=isDisabled
      onChange=changeSpy
    }}
  `);
}

function getStores(testCase) {
  return testCase.get('atmWorkflowSchema.revisionRegistry.1.stores');
}

function setStores(testCase, stores) {
  return testCase.set('atmWorkflowSchema.revisionRegistry.1.stores', stores);
}
