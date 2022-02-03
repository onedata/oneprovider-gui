import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import { click } from 'ember-native-dom-helpers';
import { createArchiveRecallData } from '../../../helpers/archive-recall';
import wait from 'ember-test-helpers/wait';
import { lookupService } from '../../../helpers/stub-service';

describe('Integration | Component | filesystem browser/file features', function () {
  setupComponentTest('filesystem-browser/file-features', {
    integration: true,
  });

  beforeEach(function () {
    this.createItem = (...args) => createFileItem(this, ...args);
  });

  ['none', 'direct'].forEach(membership => {
    it(`does not show collapsed inherited tag if features are "${membership}" in collapsed mode`, function () {
      this.createItem({
        effDatasetMembership: membership,
        effQosMembership: membership,
        recallingMembership: membership,
      });

      this.render(hbs `{{filesystem-browser/file-features
        item=item
        initiallyExpanded=false
      }}`);

      expect(this.$('.file-status-inherited-collapsed')).to.not.exist;
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
        function () {
          this.createItem({
            [feature]: membership,
          });

          this.render(hbs `{{filesystem-browser/file-features
            item=item
            initiallyExpanded=false
          }}`);

          expect(this.$('.file-status-inherited-collapsed')).to.exist;
        });
    });
  });

  it('shows tags with "direct" features in expanded mode', function () {
    this.createItem({
      effDatasetMembership: 'direct',
      effQosMembership: 'direct',
      recallingMembership: 'direct',
    });

    this.render(hbs `{{filesystem-browser/file-features
      item=item
      initiallyExpanded=true
    }}`);

    expect(this.$('.file-status-dataset'), 'dataset').to.exist;
    expect(this.$('.file-status-qos'), 'qos').to.exist;
    expect(this.$('.file-status-recalling'), 'recalling').to.exist;
  });

  ['direct', 'directAndAncestor'].forEach(membership => {
    it(`shows tags with "${membership}" features in collapsed mode`, function () {
      this.createItem({
        effDatasetMembership: membership,
        effQosMembership: membership,
        recallingMembership: membership,
      });

      this.render(hbs `{{filesystem-browser/file-features
        item=item
        initiallyExpanded=false
      }}`);

      expect(this.$('.file-status-dataset'), 'dataset').to.exist;
      expect(this.$('.file-status-qos'), 'qos').to.exist;
      expect(this.$('.file-status-recalling'), 'recalling').to.exist;
    });
  });

  // NOTE: not testing recalling tag, because it's not using "directAndAncestor"
  it('shows direct tags and collapsed inheritance icon when features are "directAndAncestor" in collapsed mode',
    function () {
      this.createItem({
        effDatasetMembership: 'directAndAncestor',
        effQosMembership: 'directAndAncestor',
      });

      this.render(hbs `{{filesystem-browser/file-features
        item=item
        initiallyExpanded=false
      }}`);

      const $datasetTag = this.$('.file-status-dataset');
      const $qosTag = this.$('.file-status-qos');
      expect($datasetTag, 'dataset').to.exist;
      expect($qosTag, 'qos').to.exist;
      expect($datasetTag.find('.inherited-icon'), 'dataset inherited').to.not.exist;
      expect($qosTag.find('.inherited-icon'), 'qos inherited').to.not.exist;
      expect(this.$('.file-status-inherited-collapsed'), 'inherited collapsed').to.exist;
    }
  );

  // NOTE: not testing recalling tag, because it's not using "directAndAncestor"
  it('shows pill-like direct-ancestor tags without collapsed inheritance icon when features are "directAndAncestor" in expanded mode',
    function () {
      this.createItem({
        effDatasetMembership: 'directAndAncestor',
        effQosMembership: 'directAndAncestor',
      });

      this.render(hbs `{{filesystem-browser/file-features
        item=item
        initiallyExpanded=true
      }}`);

      expect(this.$('.file-status-inherited-collapsed'), 'inherited collapsed')
        .to.not.exist;
      const $datasetTag = this.$('.dataset-file-status-tag-group');
      const $qosTag = this.$('.qos-file-status-tag-group');
      expect($datasetTag, 'dataset group').to.exist;
      expect($qosTag, 'qos group').to.exist;
      const addonIconSelector = '.file-status-inherited-addon > .inherited-icon';
      const $datasetAddonIcon = $datasetTag.find(addonIconSelector);
      const $qosAddonIcon = $qosTag.find(addonIconSelector);
      expect($datasetAddonIcon, 'dataset inherited addon').to.exist;
      expect($qosAddonIcon, 'qos inherited addon').to.exist;
    }
  );

  it('shows feature ancestor tags without collapsed inheritance icon when features are "ancestor" in expanded mode',
    function () {
      this.createItem({
        effDatasetMembership: 'ancestor',
        effQosMembership: 'ancestor',
        recallingMembership: 'ancestor',
      });

      this.render(hbs `{{filesystem-browser/file-features
        item=item
        initiallyExpanded=true
      }}`);

      expect(this.$('.file-status-inherited-collapsed'), 'inherited collapsed')
        .to.not.exist;
      const $datasetTag = this.$('.dataset-file-status-tag-group');
      const $qosTag = this.$('.qos-file-status-tag-group');
      const $recallingTag = this.$('.recalling-file-status-tag-group');
      expect($datasetTag, 'dataset group').to.exist;
      expect($qosTag, 'qos group').to.exist;
      expect($recallingTag, 'recalling group').to.exist;
      const iconSelector = ':not(.file-status-inherited-addon) > .inherited-icon';
      expect($datasetTag.find(iconSelector), 'dataset inherited').to.exist;
      expect($qosTag.find(iconSelector), 'qos inherited').to.exist;
      expect($recallingTag.find(iconSelector), 'recalling inherited').to.exist;
    }
  );

  [
    { tag: 'dataset', action: 'datasets' },
    { tag: 'qos', action: 'qos' },
  ].forEach(({ tag, action }) => {
    it(`invokes onInvokeItemAction item and actionName="${action}" when clicking on "${tag}" tag`,
      async function () {
        const item = this.createItem({
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

        this.render(hbs `{{filesystem-browser/file-features
          item=item
          initiallyExpanded=false
          spacePrivileges=spacePrivileges
          onInvokeItemAction=onInvokeItemAction
        }}`);
        const $tagGroup = this.$(`.${tag}-file-status-tag-group`);
        expect($tagGroup).to.have.length(1);
        // await sleep(3000);
        await click($tagGroup[0]);

        expect(onInvokeItemAction).to.have.been.calledOnce;
        expect(onInvokeItemAction).to.have.been.calledWith(item, action);
      });
  });

  [
    { tag: 'dataset', text: 'Dataset' },
    { tag: 'qos', text: 'QoS' },
    { tag: 'recalling', text: 'Recalling' },
  ].forEach(({ tag, text }) => {
    it(`displays "${text}" text on ${tag} tag`, function () {
      this.createItem({
        effDatasetMembership: 'direct',
        effQosMembership: 'direct',
        recallingMembership: 'direct',
      });
      const onInvokeItemAction = sinon.spy();
      this.setProperties({
        onInvokeItemAction,
      });

      this.render(hbs `{{filesystem-browser/file-features
          item=item
          initiallyExpanded=false
          onInvokeItemAction=onInvokeItemAction
        }}`);
      const $tag = this.$(`.file-status-${tag}`);

      expect($tag).to.exist;
      expect($tag.text().trim()).to.contain(text);
    });
  });

  // NOTE: "directAndAncestor" not used with recalling feature
  it('changes direct tags into direct-ancestor tags after inheritance tag click', async function () {
    this.createItem({
      effDatasetMembership: 'directAndAncestor',
      effQosMembership: 'directAndAncestor',
    });

    this.render(hbs `{{filesystem-browser/file-features
      item=item
      initiallyExpanded=false
    }}`);
    const $inheritanceTag = this.$('.file-status-inherited-collapsed');
    expect($inheritanceTag).to.have.length(1);
    await click($inheritanceTag[0]);

    expect(this.$('.file-status-inherited-collapsed'), 'inheritance tag after click')
      .to.not.exist;
    expect(this.$('.dataset-file-status-tag-group .inherited-icon'), 'dataset inherited a. click')
      .to.exist;
    expect(this.$('.qos-file-status-tag-group .inherited-icon'), 'qos inherited a. click')
      .to.exist;
  });

  //#region recalling tag

  it('displays percentage progress of archive recalling in recalling tag', async function () {
    createArchiveRecallData(this);
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

    this.render(hbs `{{filesystem-browser/file-features
      item=item
      initiallyExpanded=false
      onInvokeItemAction=onInvokeItemAction
    }}`);
    await wait();

    const $tag = this.$('.file-status-recalling');
    expect($tag).to.exist;
    const text = $tag.text().trim();
    expect(text).to.contain('50%');
  });

  it('has percentage width style applied to progress element in recalling tag', async function () {
    createArchiveRecallData(this);
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

    this.render(hbs `{{filesystem-browser/file-features
      item=item
      initiallyExpanded=false
      onInvokeItemAction=onInvokeItemAction
    }}`);
    await wait();

    const tagProgress = this.$('.file-status-recalling .tag-progress')[0];
    expect(tagProgress.style.width).to.equal('50%');
  });

  //#endregion
});

function createFileItem(testCase, data) {
  const store = lookupService(testCase, 'store');
  const file = store.createRecord('file', data);
  return testCase.set('item', file);
}
