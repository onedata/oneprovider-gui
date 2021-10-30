import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { registerService, lookupService } from '../../helpers/stub-service';
import sinon from 'sinon';
import wait from 'ember-test-helpers/wait';
import Service from '@ember/service';
import {
  createArchiveRootDir,
  createFilesChain,
} from '../../helpers/files';

const DatasetManager = Service.extend({
  async getBrowsableDataset() {
    throw new Error('getBrowsableDataset not stubbed');
  },
});

const ArchiveManager = Service.extend({
  async getBrowsableArchive() {
    throw new Error('getBrowsableArchive not stubbed');
  },
});

describe('Integration | Component | item path', function () {
  setupComponentTest('item-path', {
    integration: true,
  });

  // FIXME: it shortens the rendered path by removing central entry if it overflows its container
  // FIXME: it renders tooltip file path in text form if hovered
  // FIXME: it does not render tooltip if file path does not overflow its container
  // FIXME: it renders first entry with ellipsis if more entries overflows its container
  // FIXME: shows loading before path resolves; shows error when failed

  beforeEach(function () {
    const getDataUrl = ({ selected: [firstSelected] }) => `link-${firstSelected}`;
    lookupService(this, 'app-proxy').callParent =
      function callParent(methodName, ...args) {
        if (methodName === 'getDataUrl') {
          return getDataUrl(...args);
        }
      };
    registerService(this, 'dataset-manager', DatasetManager);
    registerService(this, 'archive-manager', ArchiveManager);
  });

  it('renders text of path to file in space', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file is here',
    ]);
    const item = filesChain[filesChain.length - 1];
    this.setProperties({
      item,
    });

    this.render(hbs `{{item-path item=item}}`);
    await wait();

    expect(this.$().text()).to.match(
      /space root\s*\/\s*one\s*\/\s*two\s*\/\s*three\s*\/\s*file is here\s*/
    );
  });

  it('renders space icon with space name if the file is regular space file', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
    ]);
    const item = filesChain[filesChain.length - 1];
    this.setProperties({
      item,
    });

    this.render(hbs `{{item-path item=item}}`);
    await wait();

    expect(this.$('.path-icon-container .oneicon-space')).to.have.length(1);
    expect(this.$('.path-icon-container + .path-item.path-label').text())
      .to.match(/^\s*space root\s*$/);
  });

  it('renders dataset and archive icons and names if file belongs to archive', async function () {
    const datasetId = 'dsid';
    const archiveId = 'aid';
    const archiveRootDir = createArchiveRootDir(datasetId, archiveId);
    const filesChain = createFilesChain([
      archiveRootDir,
      'one',
      'two',
    ]);
    const browsableArchiveName = '1 Jun 2021 13:30';
    const archive = {
      name: browsableArchiveName,
    };
    const browsableDatasetName = 'the dataset';
    const dataset = {
      name: browsableDatasetName,
    };
    const item = filesChain[filesChain.length - 1];
    const datasetManager = lookupService(this, 'datasetManager');
    const archiveManager = lookupService(this, 'archiveManager');
    sinon.stub(datasetManager, 'getBrowsableDataset')
      .withArgs(datasetId).resolves(dataset);
    sinon.stub(archiveManager, 'getBrowsableArchive')
      .withArgs(archiveId).resolves(archive);
    this.setProperties({
      item,
    });

    this.render(hbs `{{item-path item=item}}`);
    await wait();

    const $datasetIcon =
      this.$('.path-item.path-icon-container .oneicon-browser-dataset');
    expect($datasetIcon).to.have.length(1);
    const $datasetIconContainer = $datasetIcon.closest('.path-icon-container.path-item');
    const $datasetIconLabel = $datasetIconContainer.next('.path-item.path-label');
    expect($datasetIconLabel.text()).to.contain(browsableDatasetName);
    const $archiveIcon =
      this.$('.path-item.path-icon-container .oneicon-browser-archive');
    expect($archiveIcon).to.have.length(1);
    const $archiveIconContainer = $archiveIcon.closest('.path-icon-container.path-item');
    const $archiveIconLabel = $archiveIconContainer.next('.path-item.path-label');
    expect($archiveIconLabel.text()).to.contain(browsableArchiveName);
  });
});
