import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { registerService, lookupService } from '../../helpers/stub-service';
import sinon from 'sinon';
import wait from 'ember-test-helpers/wait';
import Service from '@ember/service';
import { set } from '@ember/object';
import { Promise, reject } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import {
  createArchiveRootDir,
  createFilesChain,
} from '../../helpers/files';
import OneTooltipHelper from '../../helpers/one-tooltip';
import { click } from 'ember-native-dom-helpers';

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

describe('Integration | Component | file path', function () {
  setupRenderingTest();

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

  it('renders HTML A element by default', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
    ]);
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
    });

    await renderComponent();

    const $anchorPath = this.$('a.path');

    expect($anchorPath).to.have.length(1);

    expect($anchorPath).to.have.attr('href');
    expect($anchorPath).to.have.attr('target');
  });

  it('renders HTML A element with onclick event listener', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
    ]);
    const file = filesChain[filesChain.length - 1];
    const onLinkClicked = sinon.stub().callsFake(event => {
      event.preventDefault();
    });
    this.setProperties({
      file,
      onLinkClicked,
    });

    await render(hbs `{{file-path
      file=file
      onLinkClicked=onLinkClicked
      onLinkKeydown=onLinkKeydown
    }}`);
    await wait();

    const $anchorPath = this.$('a.path');
    await click($anchorPath[0]);
    expect(onLinkClicked).to.have.been.calledOnce;
  });

  it('renders custom HTML tag element if provided', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
    ]);
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
      internalTagName: 'span',
    });

    // not using internalTagName in generic render, because it would override default
    // internalTagName
    await render(hbs `{{file-path
      file=file
      internalTagName=internalTagName
    }}`);
    await wait();

    expect(this.$('a.path')).to.not.exist;
    const $spanPath = this.$('span.path');
    expect($spanPath).to.have.length(1);
    expect($spanPath).to.not.have.attr('onkeydown');
    expect($spanPath).to.not.have.attr('onclick');
    expect($spanPath).to.not.have.attr('href');
    expect($spanPath).to.not.have.attr('target');
  });

  it('renders text of path to file in space', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file is here',
    ]);
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
    });

    await renderComponent();

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
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
    });

    await render(hbs `{{file-path file=file}}`);
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
    const file = filesChain[filesChain.length - 1];
    const datasetManager = lookupService(this, 'datasetManager');
    const archiveManager = lookupService(this, 'archiveManager');
    sinon.stub(datasetManager, 'getBrowsableDataset')
      .withArgs(datasetId).resolves(dataset);
    sinon.stub(archiveManager, 'getBrowsableArchive')
      .withArgs(archiveId).resolves(archive);
    this.setProperties({
      file,
    });

    await renderComponent();

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

  it('renders ellipsis in place of central items if container is too small', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file',
    ]);
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
    });

    await renderInSmallContainer(this);

    expect(this.$().text()).to.match(
      /space root\s*\/\s*one\s*\/\s*\.\.\.\s*\/\s*file\s*/
    );
  });

  it('shows tooltip with full path on hover if path is shortened', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file',
    ]);
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
    });

    await renderInSmallContainer(this);
    const tooltip = new OneTooltipHelper('.path');

    expect(await tooltip.getText()).to.contain('/space root/one/two/three/file');
  });

  it('does not show tooltip with full path on hover if path is not shortened', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file',
    ]);
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
    });

    await renderComponent();
    const tooltip = new OneTooltipHelper('.path');

    expect(await tooltip.hasTooltip()).to.be.false;
  });

  it('shows tooltip with custom text on hover if path is shortened', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file',
    ]);
    const file = filesChain[filesChain.length - 1];
    const customTip = 'custom tip';
    this.setProperties({
      file,
      customTip,
    });

    await renderInSmallContainer(this);
    const tooltip = new OneTooltipHelper('.path');

    expect(await tooltip.getText()).to.contain(customTip);
  });

  it('does now show tooltip with custom text on hover if path is not shortened', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file',
    ]);
    const file = filesChain[filesChain.length - 1];
    const customTip = 'custom tip';
    this.setProperties({
      file,
      customTip,
    });

    await renderComponent();
    const tooltip = new OneTooltipHelper('.path');

    expect(await tooltip.hasTooltip()).to.be.false;
  });

  it('shows loading text while file path is loading', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file',
    ]);
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
    });
    set(file, 'parent', promiseObject(new Promise(() => {})));

    await renderComponent();

    expect(this.$('.file-path .path-loading')).to.exist;
    expect(this.$('.file-path').text()).to.match(/Loading path.../);
  });

  it('shows error text when path resolving failed', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file',
    ]);
    const file = filesChain[filesChain.length - 1];
    filesChain[2].parent = promiseObject(reject());
    this.setProperties({
      file,
    });

    await renderComponent();

    expect(this.$('.file-path .path-error')).to.exist;
    expect(this.$('.file-path').text()).to.match(/Path loading failed!/);
  });

  it('changes text of path when injected file is replaced', async function () {
    const filesChain1 = createFilesChain([
      'space root',
      'hello',
      'world',
    ]);
    const filesChain2 = createFilesChain([
      'space root',
      'foo',
      'bar',
    ]);
    const file1 = filesChain1[filesChain1.length - 1];
    const file2 = filesChain2[filesChain2.length - 1];
    this.setProperties({
      file: file1,
    });

    await renderComponent();

    expect(this.$().text()).to.match(/space root\s*\/\s*hello\s*\/\s*world\s*/);
    this.set('file', file2);
    await wait();
    expect(this.$().text()).to.match(/space root\s*\/\s*foo\s*\/\s*bar\s*/);
  });

  it('adds "path-item-last" class to last path item', async function () {
    const filesChain = createFilesChain([
      'root',
      'one',
      'two',
      'three',
    ]);
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
    });

    await renderComponent();

    expect(this.$('.path-item-last.path-separator'), 'separator').to.have.lengthOf(1);
    expect(this.$('.path-item-last.path-label'), 'label').to.have.lengthOf(1);
    expect(this.$('.path-item.path-label.path-item-last').text().trim())
      .to.equal('three');
  });

  it('adds "path-item-first" class to first path item', async function () {
    const filesChain = createFilesChain([
      'root',
      'one',
      'two',
      'three',
    ]);
    const file = filesChain[filesChain.length - 1];
    this.setProperties({
      file,
    });

    await renderComponent();

    expect(this.$('.path-item-first.path-icon-container'), 'icon').to.have.lengthOf(1);
    expect(this.$('.path-item-first.path-label'), 'label').to.have.lengthOf(1);
    expect(this.$('.path-item.path-label.path-item-first').text().trim())
      .to.equal('root');
  });
});

async function renderComponent() {
  await render(hbs `{{file-path file=file customTip=customTip}}`);
}

async function renderInSmallContainer(testCase) {
  testCase.render(hbs `<div
    class="test-path-container"
    style="width: 200px;"
  >
    {{file-path file=file customTip=customTip}}
  </div>`);
  await wait();
}
