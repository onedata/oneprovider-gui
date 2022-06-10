import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, click, find, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import { createArchiveRecallData, whenOnLocalProvider } from '../../../helpers/datasets-archives';
import wait from 'ember-test-helpers/wait';
import { lookupService } from '../../../helpers/stub-service';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import { run } from '@ember/runloop';
import { defaultFilesystemFeatures } from 'oneprovider-gui/components/filesystem-browser/file-features';
import { set } from '@ember/object';
import ArchiveFilesystemBrowserModel from 'oneprovider-gui/utils/archive-filesystem-browser-model';

describe('Integration | Component | filesystem browser/file features', function () {
  const { afterEach } = setupRenderingTest();

  beforeEach(function () {
    this.createItem = (...args) => createFileItem(this, ...args);
    this.createItemWithRecallData =
      (...args) => createFileItemWithRecallData(this, ...args);
    this.set('browserModel', {
      fileFeatures: defaultFilesystemFeatures,
      spacePrivileges: {
        view: true,
        viewQos: true,
      },
    });
  });

  afterEach(function () {
    const browserModel = this.get('browserModel');
    if (browserModel && browserModel.destroy) {
      browserModel.destroy();
    }
  });

  ['none', 'direct'].forEach(membership => {
    it(`does not show collapsed inherited tag if features are "${membership}" in collapsed mode`,
      async function () {
        await this.createItemWithRecallData({
          effDatasetMembership: membership,
          effQosMembership: membership,
          recallingMembershipProxy: promiseObject(resolve(membership)),
        });

        await render(hbs `{{filesystem-browser/file-features
          item=item
          initiallyExpanded=false
        }}`);

        expect(find('.file-status-inherited-collapsed')).to.not.exist;
      });
  });

  ['ancestor', 'directAndAncestor'].forEach(membership => {
    [
      'effDatasetMembership',
      'effQosMembership',
      'recallingMembership',
    ].forEach(feature => {
      if (feature === 'recallingMembership' && membership === 'directAndAncestor') {
        // an exception - not used in recalling
        return;
      }
      it(`shows collapsed inherited tag if "${feature}" feature is "${membership}" in collapsed mode`,
        async function () {
          await this.createItemWithRecallData({
            [feature]: membership,
          });

          await render(hbs `{{filesystem-browser/file-features
            item=item
            browserModel=browserModel
            initiallyExpanded=false
          }}`);
          await wait();

          expect(find('.file-status-inherited-collapsed')).to.exist;
        }
      );
    });
  });

  it('shows tags with "direct" features in expanded mode', async function () {
    await this.createItemWithRecallData({
      effDatasetMembership: 'direct',
      effQosMembership: 'direct',
      recallingMembership: 'direct',
    });

    await render(hbs `{{filesystem-browser/file-features
      item=item
      browserModel=browserModel
      initiallyExpanded=true
    }}`);

    expect(find('.file-status-dataset'), 'dataset').to.exist;
    expect(find('.file-status-qos'), 'qos').to.exist;
    expect(find('.file-status-recalling'), 'recalling').to.exist;
  });

  ['direct', 'directAndAncestor'].forEach(membership => {
    it(`shows tags with "${membership}" features in collapsed mode`, async function () {
      await this.createItemWithRecallData({
        effDatasetMembership: membership,
        effQosMembership: membership,
        recallingMembership: membership,
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=false
      }}`);

      expect(find('.file-status-dataset'), 'dataset').to.exist;
      expect(find('.file-status-qos'), 'qos').to.exist;
      expect(find('.file-status-recalling'), 'recalling').to.exist;
    });
  });

  // NOTE: not testing recalling tag, because it's not using "directAndAncestor"
  it('shows direct tags and collapsed inheritance icon when features are "directAndAncestor" in collapsed mode',
    async function () {
      await this.createItem({
        effDatasetMembership: 'directAndAncestor',
        effQosMembership: 'directAndAncestor',
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=false
      }}`);

      const datasetTag = find('.file-status-dataset');
      const qosTag = find('.file-status-qos');
      expect(datasetTag, 'dataset').to.exist;
      expect(qosTag, 'qos').to.exist;
      expect(datasetTag.querySelector('.inherited-icon'), 'dataset inherited')
        .to.not.exist;
      expect(qosTag.querySelector('.inherited-icon'), 'qos inherited').to.not.exist;
      expect(find('.file-status-inherited-collapsed'), 'inherited collapsed').to.exist;
    }
  );

  // NOTE: not testing recalling tag, because it's not using "directAndAncestor"
  it('shows pill-like direct-ancestor tags without collapsed inheritance icon when features are "directAndAncestor" in expanded mode',
    async function () {
      await this.createItem({
        effDatasetMembership: 'directAndAncestor',
        effQosMembership: 'directAndAncestor',
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=true
      }}`);

      expect(find('.file-status-inherited-collapsed'), 'inherited collapsed')
        .to.not.exist;
      const datasetTag = find('.dataset-file-status-tag-group');
      const qosTag = find('.qos-file-status-tag-group');
      expect(datasetTag, 'dataset group').to.exist;
      expect(qosTag, 'qos group').to.exist;
      const addonIconSelector = '.file-status-inherited-addon > .inherited-icon';
      const $datasetAddonIcon = datasetTag.querySelector(addonIconSelector);
      const $qosAddonIcon = qosTag.querySelector(addonIconSelector);
      expect($datasetAddonIcon, 'dataset inherited addon').to.exist;
      expect($qosAddonIcon, 'qos inherited addon').to.exist;
    }
  );

  it('shows feature ancestor tags without collapsed inheritance icon when features are "ancestor" in expanded mode',
    async function () {
      await this.createItemWithRecallData({
        effDatasetMembership: 'ancestor',
        effQosMembership: 'ancestor',
        recallingMembership: 'ancestor',
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=true
      }}`);

      expect(find('.file-status-inherited-collapsed'), 'inherited collapsed')
        .to.not.exist;
      const datasetTag = find('.dataset-file-status-tag-group');
      const qosTag = find('.qos-file-status-tag-group');
      const recallingTag = find('.recalling-file-status-tag-group');
      expect(datasetTag, 'dataset group').to.exist;
      expect(qosTag, 'qos group').to.exist;
      expect(recallingTag, 'recalling group').to.exist;
      const iconSelector = ':not(.file-status-inherited-addon) > .inherited-icon';
      expect(datasetTag.querySelector(iconSelector), 'dataset inherited').to.exist;
      expect(qosTag.querySelector(iconSelector), 'qos inherited').to.exist;
      expect(recallingTag.querySelector(iconSelector), 'recalling inherited').to.exist;
    }
  );

  [
    { tag: 'dataset', action: 'datasets' },
    { tag: 'qos', action: 'qos' },
  ].forEach(({ tag, action }) => {
    it(`invokes onInvokeItemAction item and actionName="${action}" when clicking on "${tag}" tag`,
      async function () {
        const item = await this.createItem({
          effDatasetMembership: 'direct',
          effQosMembership: 'direct',
        });
        const onInvokeItemAction = sinon.spy();
        const spacePrivileges = {
          view: true,
          viewQos: true,
        };
        this.setProperties({
          onInvokeItemAction,
          spacePrivileges,
        });

        await render(hbs `{{filesystem-browser/file-features
          item=item
          browserModel=browserModel
          initiallyExpanded=false
          onInvokeItemAction=onInvokeItemAction
        }}`);
        const tagGroups = findAll(`.${tag}-file-status-tag-group`);
        expect(tagGroups).to.have.lengthOf(1);
        await click(tagGroups[0]);

        expect(onInvokeItemAction).to.have.been.calledOnce;
        expect(onInvokeItemAction).to.have.been.calledWith(item, action);
      });
  });

  [
    { tag: 'dataset', text: 'Dataset', feature: 'effDatasetMembership' },
    { tag: 'qos', text: 'QoS', feature: 'effQosMembership' },
    { tag: 'recalling', text: 'Recalling', feature: 'recallingMembership' },
  ].forEach(({ tag, text, feature }) => {
    it(`displays "${text}" text on ${tag} tag`, async function () {
      if (tag === 'recalling') {
        await this.createItemWithRecallData({
          [feature]: 'direct',
        });
      } else {
        await this.createItem({
          [feature]: 'direct',
        });
      }

      const onInvokeItemAction = sinon.spy();
      this.setProperties({
        onInvokeItemAction,
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=false
        onInvokeItemAction=onInvokeItemAction
      }}`);
      const tagElement = find(`.file-status-${tag}`);

      expect(tagElement).to.exist;
      expect(tagElement.textContent.trim()).to.contain(text);
    });
  });

  // NOTE: "directAndAncestor" not used with recalling feature
  it('changes direct tags into direct-ancestor tags after inheritance tag click', async function () {
    await this.createItem({
      effDatasetMembership: 'directAndAncestor',
      effQosMembership: 'directAndAncestor',
    });

    await render(hbs `{{filesystem-browser/file-features
      item=item
      browserModel=browserModel
      initiallyExpanded=false
    }}`);
    const inheritanceTags = findAll('.file-status-inherited-collapsed');
    expect(inheritanceTags).to.have.length(1);
    await click(inheritanceTags[0]);

    expect(find('.file-status-inherited-collapsed'), 'inheritance tag after click')
      .to.not.exist;
    expect(find('.dataset-file-status-tag-group .inherited-icon'), 'dataset inherited a. click')
      .to.exist;
    expect(find('.qos-file-status-tag-group .inherited-icon'), 'qos inherited a. click')
      .to.exist;
  });

  it('shows collapsed inherited tag in "inherited" style if there is no feature with custom noticeLevel in collapsed mode',
    async function () {
      await this.createItem({
        effQosMembership: 'ancestor',
        effDatasetMembership: 'ancestor',
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=false
      }}`);
      await wait();

      const collapsedElementClasses = [
        ...find('.file-status-inherited-collapsed').classList,
      ];
      expect(collapsedElementClasses, collapsedElementClasses.join(', '))
        .to.contain('file-status-tag-inherited');
    }
  );

  //#region recalling tag

  it('displays percentage progress of archive recalling in recalling tag', async function () {
    await createArchiveRecallData(this);
    whenOnLocalProvider(this);
    const targetFile = this.get('targetFile');
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize') / 2
    );
    const onInvokeItemAction = sinon.spy();
    this.setProperties({
      item: targetFile,
      onInvokeItemAction,
    });

    await render(hbs `{{filesystem-browser/file-features
      item=item
      browserModel=browserModel
      initiallyExpanded=false
      onInvokeItemAction=onInvokeItemAction
    }}`);
    await wait();

    const tagElement = find('.file-status-recalling');
    expect(tagElement).to.exist;
    const text = tagElement.textContent.trim();
    expect(text).to.contain('50%');
  });

  it('has percentage width style applied to progress element in recalling tag', async function () {
    await createArchiveRecallData(this);
    whenOnLocalProvider(this);
    const targetFile = this.get('targetFile');
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize') / 2
    );
    const onInvokeItemAction = sinon.spy();
    this.setProperties({
      item: targetFile,
      onInvokeItemAction,
    });

    await render(hbs `{{filesystem-browser/file-features
      item=item
      browserModel=browserModel
      initiallyExpanded=false
      onInvokeItemAction=onInvokeItemAction
    }}`);
    await wait();

    const tagProgress = find('.file-status-recalling .tag-progress');
    expect(tagProgress.style.width).to.equal('50%');
  });

  //#endregion

  //#region file-in-archive

  [
    { state: 'pending', label: 'Pending' },
    { state: 'building', label: 'Building' },
    { state: 'verifying', label: 'Verifying' },
  ].forEach((spec) => {
    it(`shows creating archive tag with label for "${spec.state}" state when used with archive filesystem browser`,
      async function () {
        await this.createItem();
        await whenUsedInArchiveFilesystemBrowser(this, { archiveState: spec.state });

        await render(hbs `{{filesystem-browser/file-features
          item=item
          browserModel=browserModel
          initiallyExpanded=true
        }}`);

        /** @type {HTMLElement} */
        const tag = find('.file-status-archive-creating');
        expect(tag).to.exist;
        expect([...tag.classList]).to.contain('file-status-tag-warning');
        expect(tag.textContent.trim()).to.equal(spec.label);
      }
    );
  });

  it('does not show creating nor failed archive tag with label for "preserved" state when used with archive filesystem browser',
    async function () {
      await this.createItem();
      await whenUsedInArchiveFilesystemBrowser(this, { archiveState: 'preserved' });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=true
      }}`);

      expect(find('.file-status-archive-creating')).to.not.exist;
      expect(find('.file-status-archive-failed')).to.not.exist;
    }
  );

  [
    { state: 'failed' },
    { state: 'verification_failed' },
  ].forEach((spec) => {
    it(`shows failed archive tag for "${spec.state}" state when used with archive filesystem browser`,
      async function () {
        await this.createItem();
        await whenUsedInArchiveFilesystemBrowser(this, { archiveState: spec.state });

        await render(hbs `{{filesystem-browser/file-features
          item=item
          browserModel=browserModel
          initiallyExpanded=true
        }}`);

        const failedTag = find('.file-status-archive-failed');
        expect(failedTag).to.exist;
        expect([...failedTag.classList]).to.contain('file-status-tag-danger');
        expect(failedTag.textContent.trim()).to.equal('Failed');
      }
    );
  });

  it('shows archive creating ancestor tag with inheritance icon in expanded mode',
    async function () {
      await this.createItem();
      whenUsedInArchiveFilesystemBrowser(this, {
        archiveState: 'building',
        archiveRootDir: null,
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=true
      }}`);

      /** @type {HTMLElement} */
      const tag = find('.file-status-archive-creating');
      expect(tag).to.exist;
      expect(tag.querySelector('.inherited-icon.oneicon-inheritance')).to.exist;
    }
  );

  it('shows archive failed ancestor tag with inheritance icon in expanded mode',
    async function () {
      await this.createItem();
      whenUsedInArchiveFilesystemBrowser(this, {
        archiveState: 'failed',
        archiveRootDir: null,
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=true
      }}`);

      /** @type {HTMLElement} */
      const tag = find('.file-status-archive-failed');
      expect(tag).to.exist;
      expect(tag.querySelector('.inherited-icon.oneicon-inheritance')).to.exist;
    }
  );

  it('shows collapsed inherited tag in warning style if just one active feature has warning noticeLevel in collapsed mode',
    async function () {
      await this.createItem({
        effQosMembership: 'ancestor',
      });
      whenUsedInArchiveFilesystemBrowser(this, {
        archiveState: 'building',
        archiveRootDir: null,
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=false
      }}`);
      await wait();

      const collapsedElementClasses = [
        ...find('.file-status-inherited-collapsed').classList,
      ];
      expect(collapsedElementClasses, collapsedElementClasses.join(', '))
        .to.contain('file-status-tag-warning');
    }
  );

  it('shows collapsed inherited tag in danger style if just one active feature has danger noticeLevel in collapsed mode',
    async function () {
      await this.createItem({
        effQosMembership: 'ancestor',
      });
      whenUsedInArchiveFilesystemBrowser(this, {
        archiveState: 'failed',
        archiveRootDir: null,
      });

      await render(hbs `{{filesystem-browser/file-features
        item=item
        browserModel=browserModel
        initiallyExpanded=false
      }}`);
      await wait();

      const collapsedElementClasses = [
        ...find('.file-status-inherited-collapsed').classList,
      ];
      expect(collapsedElementClasses, collapsedElementClasses.join(', '))
        .to.contain('file-status-tag-danger');
    }
  );

  //#endregion
});

async function createFileItem(testCase, data) {
  const store = lookupService(testCase, 'store');
  const file = store.createRecord('file', data);
  await file.save();
  return testCase.set('item', file);
}

async function createFileItemWithRecallData(testCase, data = {}) {
  await createArchiveRecallData(testCase);
  const targetFile = testCase.get('targetFile');
  run(() => {
    targetFile.setProperties(data);
  });
  run(() => {
    targetFile.save();
  });
  testCase.set('item', targetFile);
}

function whenUsedInArchiveFilesystemBrowser(
  testCase, { archiveState = 'preserved', archiveRootDir = testCase.get('item') } = {}
) {
  let archive;
  run(() => {
    archive = createArchiveForBrowser(testCase, archiveRootDir);
  });
  const browserModel = ArchiveFilesystemBrowserModel.create({
    ownerSource: testCase.owner,
    archive,
  });
  testCase.set('browserModel', browserModel);
  run(() => {
    set(archive, 'state', archiveState);
  });
}

function createArchiveForBrowser(testCase, rootDir = null) {
  const store = lookupService(testCase, 'store');
  const archive = store.createRecord('archive', {
    config: {
      incremental: {
        enabled: false,
      },
      layout: 'plain',
      includeDip: false,
    },
    dataset: null,
    // properties not normally used when create
    creationTime: Math.floor(Date.now() / 1000),
    state: 'preserved',
    stats: {
      bytesArchived: 2048,
      filesArchived: 20,
      filesFailed: 0,
    },
    relatedAip: null,
    relatedDip: null,
    rootDir: rootDir,
    baseArchive: null,
  });
  testCase.set('archive', archive);
  return archive;
}
