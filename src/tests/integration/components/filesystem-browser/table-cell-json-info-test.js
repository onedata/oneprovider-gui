import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import moment from 'moment';
import Service from '@ember/service';
import { registerService } from '../../../helpers/stub-service';
import { RuntimeProperties as FileRuntimeProperties } from 'oneprovider-gui/models/file';
import EmberObject, { set } from '@ember/object';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

const currentUser = Service.extend({
  userId,
});

const FileMock = EmberObject.extend(FileRuntimeProperties);

describe('Integration | Component | filesystem-browser/table-cell-json-info', function () {
  const { afterEach } = setupRenderingTest();

  beforeEach(function () {
    registerService(this, 'currentUser', currentUser);
    this.set('browserModel', FilesystemBrowserModel.create({
      dirProxy: promiseObject((async () => null)()),
      ownerSource: this.owner,
      firstColumnWidth: 20,
      loadColumnsConfigFromLocalStorage() {
        this.set('columns.modification.isEnabled', true);
        this.set('columns.replication.isEnabled', true);
        this.set('columns.jsonColumn.isEnabled', true);
      },
    }));
    this.set('browserModel.columnsConfiguration.columns.jsonColumn', EmberObject.create({
      isVisible: false,
      isEnabled: false,
      width: 210,
      hasSubname: true,
      hasTooltip: true,
      type: 'json',
      queryType: 'all',
      jsonKey: '',
      displayedName: 'json',
      fileProperty: 'jsonMetadata',
    }));
    this.set('spacePrivileges', { view: true });
  });

  afterEach(function () {
    this.get('browserModel')?.destroy?.();
  });

  const jsonForKeyTest = {
    key1: 'value',
    key2: null,
    key3: false,
    key4: {
      key1_1: 'value2',
      key1_2: 'value3',
    },
    key5: {
      key1_1: 'value2',
      key1_2: 'value3',
      key1_3: 'value4',
    },
  };

  it('renders an empty JSON object', async function () {
    const json = {};
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'key', 'key1');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(find('.fb-table-col-json').textContent.trim()).to.equal('—');
  });

  it('renders only the value of the "key1" key', async function () {
    this.set('file', createFile({ jsonMetadata: jsonForKeyTest }));
    enableJsonColumn(this, 'key', 'key1');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(find('.fb-table-col-json').textContent.trim()).to.equal('"value"');
    expect(find('.token.string')).to.exist;
    expect(find('.token.string').textContent.trim()).to.equal('"value"');
  });

  it('renders a null value for "key1” key', async function () {
    this.set('file', createFile({ jsonMetadata: jsonForKeyTest }));
    enableJsonColumn(this, 'key', 'key2');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(find('.fb-table-col-json').textContent.trim()).to.equal('null');
    expect(find('.token.null')).to.exist;
  });

  it('renders a boolean value for "key1” key', async function () {
    this.set('file', createFile({ jsonMetadata: jsonForKeyTest }));
    enableJsonColumn(this, 'key', 'key3');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(find('.fb-table-col-json').textContent.trim()).to.equal('false');
    expect(find('.token.boolean')).to.exist;
  });

  it('renders only an object for “key4” key', async function () {
    this.set('file', createFile({ jsonMetadata: jsonForKeyTest }));
    enableJsonColumn(this, 'key', 'key4');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(findAll('.file-json-text div')[0].textContent.trim()).to.equal(
      '{"key1_1":"value2","key1'
    );
    expect(findAll('.file-json-text div')[1].textContent.trim()).to.equal(
      '_2":"value3"}'
    );
    expect(findAll('.token.property')[0].textContent.trim()).to.equal('"key1_1"');
    expect(findAll('.token.string')[0].textContent.trim()).to.equal('"value2"');
    expect(findAll('.token.property')[1].textContent.trim()).to.equal('"key1');
    expect(findAll('.token.property')[2].textContent.trim()).to.equal('_2"');
    expect(findAll('.token.string')[1].textContent.trim()).to.equal('"value3"');
  });

  it('renders a truncated object for “key5” key', async function () {
    this.set('file', createFile({ jsonMetadata: jsonForKeyTest }));
    enableJsonColumn(this, 'key', 'key5');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(findAll('.file-json-text div')[0].textContent.trim()).to.equal(
      '{"key1_1":"value2","key1'
    );
    expect(findAll('.file-json-text div')[1].textContent.trim()).to.equal(
      '_2":"value3","key1_3":"…'
    );
    expect(findAll('.token.property')[0].textContent.trim()).to.equal('"key1_1"');
    expect(findAll('.token.string')[0].textContent.trim()).to.equal('"value2"');
    expect(findAll('.token.property')[1].textContent.trim()).to.equal('"key1');
    expect(findAll('.token.property')[2].textContent.trim()).to.equal('_2"');
    expect(findAll('.token.string')[1].textContent.trim()).to.equal('"value3"');
    expect(findAll('.token.property')[3].textContent.trim()).to.equal('"key1_3"');
    expect(findAll('.token.string')[2].textContent.trim()).to.equal('"');
  });

  it('renders the entire JSON object with a boolean value inside', async function () {
    const json = { key1: false };
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'all');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(find('.fb-table-col-json').textContent.trim()).to.equal('{"key1":false}');
    expect(findAll('.token.property')[0].textContent.trim()).to.equal('"key1"');
    expect(findAll('.token.boolean')[0].textContent.trim()).to.equal('false');
  });

  it('renders a JSON object containing an array', async function () {
    const json = { k1: [1, 2, 3] };
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'all');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(find('.fb-table-col-json').textContent.trim()).to.equal('{"k1":[1,2,3]}');
    expect(findAll('.token.property')[0].textContent.trim()).to.equal('"k1"');
    expect(findAll('.token.punctuation')[1].textContent.trim()).to.equal('[');
    expect(findAll('.token.number')[0].textContent.trim()).to.equal('1');
    expect(findAll('.token.number')[1].textContent.trim()).to.equal('2');
    expect(findAll('.token.number')[2].textContent.trim()).to.equal('3');
    expect(findAll('.token.punctuation')[4].textContent.trim()).to.equal(']');
  });

  it('renders a long two-line JSON object with a numeric value inside', async function () {
    const json = { key1: 'value', key2: 524657376, key3: 455123 };
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'all');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(findAll('.file-json-text div')[0].textContent.trim()).to.equal(
      '{"key1":"value","key2":5'
    );
    expect(findAll('.file-json-text div')[1].textContent.trim()).to.equal(
      '24657376,"key3":455123}'
    );
    expect(findAll('.token.property')[0].textContent.trim()).to.equal('"key1"');
    expect(findAll('.token.string')[0].textContent.trim()).to.equal('"value"');
    expect(findAll('.token.property')[1].textContent.trim()).to.equal('"key2"');
    expect(findAll('.token.number')[0].textContent.trim()).to.equal('5');
    expect(findAll('.token.number')[1].textContent.trim()).to.equal('24657376');
    expect(findAll('.token.property')[2].textContent.trim()).to.equal('"key3"');
    expect(findAll('.token.number')[2].textContent.trim()).to.equal('455123');
  });

  it('renders a long JSON object truncated after two lines, containing a null value', async function () {
    const json = { key1: 'val1', key2: null, key3: 32, key4: null };
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'all');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(findAll('.file-json-text div')[0].textContent.trim()).to.equal(
      '{"key1":"val1","key2":nu'
    );
    expect(findAll('.file-json-text div')[1].textContent.trim()).to.equal(
      'll,"key3":32,"key4":nul…'
    );
  });

  it('renders a JSON object containing an empty array', async function () {
    const json = { key1: 'val1', key2: [], key3: 32 };
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'all');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(findAll('.file-json-text div')[0].textContent.trim()).to.equal(
      '{"key1":"val1","key2":[]'
    );
    expect(findAll('.file-json-text div')[1].textContent.trim()).to.equal(
      ',"key3":32}'
    );
  });

  it('renders a JSON object containing an empty object', async function () {
    const json = { key1: 'val1', key2: {}, key3: 32 };
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'all');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(findAll('.file-json-text div')[0].textContent.trim()).to.equal(
      '{"key1":"val1","key2":{}'
    );
    expect(findAll('.file-json-text div')[1].textContent.trim()).to.equal(
      ',"key3":32}'
    );
  });

  it('renders a JSON object containing an array of objects', async function () {
    const json = { key1: 'val1', key2: ['val2', 123, 'val3'], key3: 32 };
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'all');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(findAll('.file-json-text div')[0].textContent.trim()).to.equal(
      '{"key1":"val1","key2":["'
    );
    expect(findAll('.file-json-text div')[1].textContent.trim()).to.equal(
      'val2",123,"val3"],"key3…'
    );
  });

  it('renders a JSON object with a truncated long string value', async function () {
    const json = { key1: 'qwertyui opasdfgh jklzxcvbnm qwertyuiopasdfgh', key3: 32 };
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'all');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(findAll('.file-json-text div')[0].textContent.trim()).to.equal(
      '{"key1":"qwertyui opasdf'
    );
    expect(findAll('.file-json-text div')[1].textContent.trim()).to.equal(
      'gh jklzxcvbnm qwertyuio…'
    );
  });

  it('renders a JSON object with a truncated long string key', async function () {
    const
      json = { 'key1qwertyui opasdfgh jklzxcvbnm qwertyuiopasdfgh': 'val1', key3: 32 };
    this.set('file', createFile({ jsonMetadata: json }));
    enableJsonColumn(this, 'all');

    await renderComponent(this);
    expect(find('.fb-table-col-json')).to.exist;
    expect(findAll('.file-json-text div')[0].textContent.trim()).to.equal(
      '{"key1qwertyui opasdfgh'
    );
    expect(findAll('.file-json-text div')[1].textContent.trim()).to.equal(
      'jklzxcvbnm qwertyuiopas…'
    );
  });
});

// TODO: VFS-9850 Use real file model in tests
function createFile(override = {}, ownerGri = userGri) {
  const data = Object.assign({
    mtime: moment('2020-01-01T08:50:00+00:00').unix(),
    posixPermissions: '777',
    type: 'file',
    belongsTo(name) {
      if (name === 'owner') {
        return {
          id: () => ownerGri,
        };
      }
    },
    hasMany() {
      return {
        ids: () => [],
      };
    },
  }, override);

  const file = FileMock.create(data);
  if (!data.type !== 'symlink') {
    set(file, 'effFile', data);
  }
  return file;
}

async function renderComponent(testCase) {
  testCase.set('browserModel.previewMode', testCase.get('previewMode'));
  testCase.set('browserModel.space', {
    entityId: testCase.get('spaceId') ?? 'space_id',
    currentUserIsOwner: testCase.get('isSpaceOwned') ?? false,
    privileges: testCase.get('spacePrivileges') ?? {},
  });
  await render(hbs `<FilesystemBrowser::TableCellJsonInfo
    @file={{file}}
    @columnInfo={{browserModel.columnsConfiguration.columns.jsonColumn}}
  />`);
}

function enableJsonColumn(mochaContext, queryType, jsonKey = '') {
  mochaContext.set(
    'browserModel.columnsConfiguration.columns.jsonColumn.isEnabled',
    true
  );
  mochaContext.set(
    'browserModel.columnsConfiguration.columns.jsonColumn.isVisible',
    true
  );
  mochaContext.set(
    'browserModel.columnsConfiguration.columns.jsonColumn.type',
    'json'
  );
  mochaContext.set(
    'browserModel.columnsConfiguration.columns.jsonColumn.queryType',
    queryType
  );
  mochaContext.set(
    'browserModel.columnsConfiguration.columns.jsonColumn.jsonKey',
    jsonKey
  );
}
