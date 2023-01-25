import { expect } from 'chai';
import { describe, it, beforeEach, context } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll, fillIn } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import OneTooltipHelper from '../../../helpers/one-tooltip';
import sinon from 'sinon';
import guidToCdmiObjectId from 'oneprovider-gui/utils/guid-to-cdmi-object-id';
import { lookupService } from '../../../helpers/stub-service';

const dataSpecConfigs = {
  integer: {
    dataSpec: {
      type: 'integer',
      valueConstraints: {},
    },
    correctValues: ['5', '0', '-100'],
    incorrectValues: ['0.5', 'null', '{}', '[]', '"1"'],
  },
  string: {
    dataSpec: {
      type: 'string',
      valueConstraints: {},
    },
    correctValues: ['""', '"123"'],
    incorrectValues: ['10', 'null', '{}', '[]'],
  },
  object: {
    dataSpec: {
      type: 'object',
      valueConstraints: {},
    },
    correctValues: ['{}', '{"a": 123, "b": {}}'],
    incorrectValues: ['10', 'null', '[]', '"1"'],
  },
  // TODO: VFS-7816 uncomment or remove future code
  // histogram: {
  //   dataSpec: {
  //     type: 'histogram',
  //     valueConstraints: {},
  //   },
  //   correctValues: ['{"a": 123}'],
  //   incorrectValues: ['10', 'null', '"1"'],
  // },
  anyFile: {
    dataSpec: {
      type: 'file',
      valueConstraints: {
        fileType: 'ANY',
      },
    },
    correctValues: ['{"file_id": "123"}'],
    incorrectValues: ['10', 'null', '[]', '{}', '"1"'],
  },
  regularFile: {
    dataSpec: {
      type: 'file',
      valueConstraints: {
        fileType: 'REG',
      },
    },
    correctValues: ['{"file_id": "123"}'],
    incorrectValues: ['10', 'null', '[]', '{}', '"1"'],
  },
  directory: {
    dataSpec: {
      type: 'file',
      valueConstraints: {
        fileType: 'DIR',
      },
    },
    correctValues: ['{"file_id": "123"}'],
    incorrectValues: ['10', 'null', '[]', '{}', '"1"'],
  },
  symlink: {
    dataSpec: {
      type: 'file',
      valueConstraints: {
        fileType: 'SYMLNK',
      },
    },
    correctValues: ['{"file_id": "123"}'],
    incorrectValues: ['10', 'null', '[]', '{}', '"1"'],
  },
  dataset: {
    dataSpec: {
      type: 'dataset',
      valueConstraints: {},
    },
    correctValues: ['{"datasetId": "123"}'],
    incorrectValues: ['10', 'null', '[]', '{}', '"1"'],
  },
  // TODO: VFS-7816 uncomment or remove future code
  // archive: {
  //   dataSpec: {
  //     type: 'archive',
  //     valueConstraints: {},
  //   },
  //   correctValues: ['{"archiveId": "123"}'],
  //   incorrectValues: ['10', 'null', '[]', '{}', '"1"'],
  // },
};

const dataSpecConfigsArray = [];
Object.keys(dataSpecConfigs).forEach(dataSpecConfigName => {
  const dataSpecConfig = dataSpecConfigs[dataSpecConfigName];
  dataSpecConfig.name = dataSpecConfigName;
  dataSpecConfigsArray.push(dataSpecConfig);
});
const allEditors = ['filesValue', 'rawValue'];

const dataSpecSpecificEditors = {
  anyFile: 'filesValue',
  regularFile: 'filesValue',
  directory: 'filesValue',
  symlink: 'filesValue',
  dataset: 'filesValue',
  // TODO: VFS-7816 uncomment or remove future code
  // archive: 'filesValue',
  default: 'rawValue',
};

const arrayLikeValuesGenerator = elements =>
  elements.map(elements => `[${elements}]`)
  .concat(elements.length > 1 ? [`[${elements.join(',')}]`] : []);
const storeTypes = {
  list: {
    allowedDataSpecConfigs: dataSpecConfigsArray,
    dataSpecConfigKey: 'itemDataSpec',
    editors: dataSpecSpecificEditors,
    complexContentsGenerator: arrayLikeValuesGenerator,
  },
  // TODO: VFS-7816 uncomment or remove future code
  // map: {
  //   allowedDataSpecConfigs: dataSpecConfigsArray,
  //   editors: {
  //     default: 'rawValue',
  //   },
  //   complexContentsGenerator: simpleValues =>
  //     simpleValues.map(simpleValue => `{"k0":${simpleValue}}`)
  //     .concat(simpleValues.length > 1 ? [
  //       `{${simpleValues.map((simpleValue, i) => `"k${i}":${simpleValue}`).join(',')}}`,
  //     ] : []),
  // },
  treeForest: {
    allowedDataSpecConfigs: [
      dataSpecConfigs.anyFile,
      dataSpecConfigs.regularFile,
      dataSpecConfigs.directory,
      dataSpecConfigs.symlink,
      dataSpecConfigs.dataset,
    ],
    dataSpecConfigKey: 'itemDataSpec',
    editors: {
      default: 'filesValue',
    },
    complexContentsGenerator: () => [],
  },
  singleValue: {
    allowedDataSpecConfigs: dataSpecConfigsArray,
    dataSpecConfigKey: 'itemDataSpec',
    editors: dataSpecSpecificEditors,
    complexContentsGenerator: simpleValues => simpleValues,
    filesLimit: 1,
  },
  // TODO: VFS-7816 uncomment or remove future code
  // histogram: {
  //   allowedDataSpecConfigs: [
  //     dataSpecConfigs.histogram,
  //   ],
  //   editors: {
  //     default: 'rawValue',
  //   },
  //   complexContentsGenerator: arrayLikeValuesGenerator,
  // },
  // auditLog: {
  //   allowedDataSpecConfigs: dataSpecConfigsArray,
  //   editors: dataSpecSpecificEditors,
  //   complexContentsGenerator: arrayLikeValuesGenerator,
  // },
};

const storeTypesArray = [];
Object.keys(storeTypes).forEach(storeTypeName => {
  const storeType = storeTypes[storeTypeName];
  storeType.name = storeTypeName;
  storeTypesArray.push(storeType);
});

describe('Integration | Component | space automation/input stores form', function () {
  setupRenderingTest();

  beforeEach(function () {
    this.setProperties({
      atmWorkflowSchema: {
        revisionRegistry: {
          1: {
            stores: [{
              id: 'store1',
              name: 'singleValueIntegerStore',
              description: 'single value integer store',
              type: 'singleValue',
              config: {
                itemDataSpec: {
                  type: 'integer',
                  valueConstraints: {},
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
                  valueConstraints: {},
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
                  valueConstraints: {},
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
    expect(inputStores[0]).to.contain.text('singleValueIntegerStore');
    expect(inputStores[1]).to.contain.text('listStringStore');
  });

  it('shows store description as field tooltip', async function () {
    await renderComponent();

    const inputStores = findAll('.inputStore-field');
    const tooltip1Trigger = inputStores[0].querySelector('.one-label-tip .one-icon');
    const tooltip2Trigger = inputStores[1].querySelector('.one-label-tip .one-icon');
    expect(await new OneTooltipHelper(tooltip1Trigger).getText())
      .to.equal('single value integer store');
    expect(await new OneTooltipHelper(tooltip2Trigger).getText())
      .to.equal('list string store');
  });

  it('does not show field tooltip when store does not have a description',
    async function () {
      getStores(this).forEach(store => delete store.description);

      await renderComponent();

      expect(find('.one-label-tip')).to.not.exist;
    });

  storeTypesArray.forEach(({
    name: storeTypeName,
    allowedDataSpecConfigs,
    dataSpecConfigKey,
    editors,
    complexContentsGenerator,
  }) => {
    allowedDataSpecConfigs.forEach(({
      name: dataSpecName,
      dataSpec,
      correctValues,
      incorrectValues,
    }) => {
      context(`when store is of type ${storeTypeName} with ${dataSpecName} elements`, function () {
        beforeEach(function () {
          setStores(this, [{
            id: 's1',
            name: 'store1',
            type: storeTypeName,
            config: {
              [dataSpecConfigKey]: dataSpec,
            },
            requiresInitialContent: true,
          }]);
        });

        const editor = editors[dataSpecName] || editors.default;
        const incorrectEditors = allEditors.without(editor);
        it(`shows ${editor} value editor`, async function () {
          await renderComponent();

          expect(find(`.${editor}-field`)).to.exist;
          incorrectEditors.forEach(incorrectEditor =>
            expect(find(`.${incorrectEditor}-field`)).to.not.exist
          );
        });

        if (editor === 'rawValue') {
          const correctInitialContents = complexContentsGenerator(correctValues);
          const incorrectInitialContents = complexContentsGenerator(incorrectValues);

          correctInitialContents.forEach(initialContent => {
            it(`recognizes ${initialContent} value as valid`, async function () {
              const changeSpy = this.get('changeSpy');
              await renderComponent();

              await fillIn(`.${editor}-field .form-control`, initialContent);

              expect(find(`.${editor}-field`)).to.not.have.class('.has-error');
              expect(changeSpy).to.be.calledWith({
                data: {
                  s1: JSON.parse(initialContent),
                },
                isValid: true,
              });
            });
          });

          incorrectInitialContents.forEach(initialContent => {
            it(`recognizes ${initialContent} value as invalid`, async function () {
              const changeSpy = this.get('changeSpy');
              await renderComponent();

              await fillIn(`.${editor}-field .form-control`, initialContent);

              expect(find(`.${editor}-field`)).to.have.class('has-error');
              expect(changeSpy).to.be.calledWith({
                data: {
                  s1: JSON.parse(initialContent),
                },
                isValid: false,
              });
            });
          });

          it('fills initial value with JSON', async function () {
            const rawValue = JSON.parse(correctInitialContents[0]);
            getStores(this)[0].defaultInitialContent = rawValue;

            await renderComponent();

            expect(find(`.${editor}-field .form-control`))
              .to.have.value(JSON.stringify(rawValue, null, 2));
          });
        }

        if (editor === 'filesValue') {
          it('fills initial value with an element with known name', async function () {
            getStores(this)[0].defaultInitialContent = [{
              [getFileIdFieldName(dataSpec)]: getStoreFileId(dataSpec, 0),
            }];
            const isArchive = dataSpec.type === 'archive';
            const fileData = isArchive ? { creationTime: 1623318692 } : { name: 'someName' };
            mockFileRecord(this, dataSpec, 0, fileData);

            await renderComponent();

            expect(find(`.${editor}-field .form-control`))
              .to.contain.text(isArchive ? '2021' : 'someName');
          });

          it('fills initial value with an element, that cannot be loaded',
            async function () {
              getStores(this)[0].defaultInitialContent = [{
                [getFileIdFieldName(dataSpec)]: getStoreFileId(dataSpec, 0),
              }];
              mockFileRecord(this, dataSpec, 0, null);

              await renderComponent();

              expect(find(`.${editor}-field .form-control`))
                .to.contain.text('Unknown');
            });
        }
      });
    });
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

function getFileIdFieldName(dataSpec) {
  return dataSpec.type === 'file' ? 'file_id' : `${dataSpec.type}Id`;
}

function getFileId(idx) {
  return `id${idx}`;
}

function getStoreFileId(dataSpec, idx) {
  const id = getFileId(idx);
  if (dataSpec.type === 'file') {
    return guidToCdmiObjectId(id);
  }
  return id;
}

function mockFileRecord(testCase, dataSpec, idx, data) {
  const entityId = getFileId(idx);
  const fileData = data ? Object.assign({
    entityId,
    constructor: { modelName: dataSpec.type },
  }, data) : null;
  let stub;
  switch (dataSpec.type) {
    case 'file':
      stub = sinon.stub(lookupService(testCase, 'file-manager'), 'getFileById')
        .withArgs(entityId).resolves(fileData);
      break;
    case 'dataset':
      stub = sinon.stub(lookupService(testCase, 'dataset-manager'), 'getDataset')
        .withArgs(entityId).resolves(fileData);
      break;
    case 'archive':
      stub = sinon.stub(lookupService(testCase, 'archive-manager'), 'getArchive')
        .withArgs(entityId).resolves(fileData);
      break;
  }
  if (fileData) {
    stub.resolves(fileData);
  } else {
    stub.rejects();
  }
}
