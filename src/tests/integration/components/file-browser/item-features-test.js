import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import { click } from 'ember-native-dom-helpers';

describe('Integration | Component | file browser/item features', function () {
  setupComponentTest('file-browser/item-features', {
    integration: true,
  });

  // FIXME: test disabled and tooltip when disabled datasetsViewForbidden

  ['none', 'direct'].forEach(membership => {
    it(`does not show collapsed inherited tag if features are "${membership}" in collapsed mode`, function () {
      const item = {
        effDatasetMembership: membership,
        effQosMembership: membership,
      };
      this.set('item', item);

      this.render(hbs `{{file-browser/item-features item=item expanded=false}}`);

      expect(this.$('.file-status-inherited')).to.not.exist;
    });
  });

  ['ancestor', 'directAndAncestor'].forEach(membership => {
    it(`shows collapsed inherited tag if features are "${membership}" in collapsed mode`, function () {
      const item = {
        effDatasetMembership: membership,
        effQosMembership: membership,
      };
      this.set('item', item);

      this.render(hbs `{{file-browser/item-features item=item expanded=false}}`);

      expect(this.$('.file-status-inherited')).to.exist;
    });
  });

  it('shows tags with "direct" features in expanded mode', function () {
    const item = {
      effDatasetMembership: 'direct',
      effQosMembership: 'direct',
    };
    this.set('item', item);

    this.render(hbs `{{file-browser/item-features item=item expanded=true}}`);

    expect(this.$('.file-status-dataset'), 'dataset').to.exist;
    expect(this.$('.file-status-qos'), 'qos').to.exist;
  });

  ['direct', 'directAndAncestor'].forEach(membership => {
    it(`shows tags with "${membership}" features in collapsed mode`, function () {
      const item = {
        effDatasetMembership: 'direct',
        effQosMembership: 'direct',
      };
      this.set('item', item);

      this.render(hbs `{{file-browser/item-features item=item expanded=false}}`);

      expect(this.$('.file-status-dataset'), 'dataset').to.exist;
      expect(this.$('.file-status-qos'), 'qos').to.exist;
    });
  });

  it('shows direct tags and collapsed inheritance icon when features are "directAndAncestor" in collapsed mode',
    function () {
      const item = {
        effDatasetMembership: 'directAndAncestor',
        effQosMembership: 'directAndAncestor',
      };
      this.set('item', item);

      this.render(hbs `{{file-browser/item-features item=item expanded=false}}`);

      const $datasetTag = this.$('.file-status-dataset');
      const $qosTag = this.$('.file-status-qos');
      expect($datasetTag, 'dataset').to.exist;
      expect($qosTag, 'qos').to.exist;
      expect($datasetTag.find('.inherited-icon'), 'dataset inherited').to.not.exist;
      expect($qosTag.find('.inherited-icon'), 'qos inherited').to.not.exist;
      expect(this.$('.file-status-inherited'), 'inherited collapsed').to.exist;
    }
  );

  it('shows pill-like direct-ancestor tags without collapsed inheritance icon when features are "directAndAncestor" in expanded mode',
    function () {
      const item = {
        effDatasetMembership: 'directAndAncestor',
        effQosMembership: 'directAndAncestor',
      };
      this.set('item', item);

      this.render(hbs `{{file-browser/item-features item=item expanded=true}}`);

      expect(this.$('.file-status-inherited'), 'inherited collapsed').to.not.exist;
      const $datasetTag = this.$('.dataset-file-status-tag-group');
      const $qosTag = this.$('.qos-file-status-tag-group');
      expect($datasetTag, 'dataset group').to.exist;
      expect($qosTag, 'qos group').to.exist;
      const addonIconSelector = '.file-status-inherited-addon .inherited-icon';
      const $datasetAddonIcon = $datasetTag.find(addonIconSelector);
      const $qosAddonIcon = $qosTag.find(addonIconSelector);
      expect($datasetAddonIcon, 'dataset inherited addon').to.exist;
      expect($qosAddonIcon, 'qos inherited addon').to.exist;
    }
  );

  it('shows feature ancestor tags without collapsed inheritance icon when features are "ancestor" in expanded mode',
    function () {
      const item = {
        effDatasetMembership: 'ancestor',
        effQosMembership: 'ancestor',
      };
      this.set('item', item);

      this.render(hbs `{{file-browser/item-features item=item expanded=true}}`);

      expect(this.$('.file-status-inherited'), 'inherited collapsed').to.not.exist;
      const $datasetTag = this.$('.dataset-file-status-tag-group');
      const $qosTag = this.$('.qos-file-status-tag-group');
      expect($datasetTag, 'dataset group').to.exist;
      expect($qosTag, 'qos group').to.exist;
      const iconSelector = ':not(.file-status-inherited-addon) .inherited-icon';
      expect($datasetTag.find(iconSelector), 'dataset inherited').to.exist;
      expect($qosTag.find(iconSelector), 'qos inherited').to.exist;
    }
  );

  [
    { tag: 'dataset', action: 'datasets' },
    { tag: 'qos', action: 'qos' },
  ].forEach(({ tag, action }) => {
    it(`invokes onInvokeItemAction item and actionName="${action}" when clicking on "${tag}" tag`,
      async function () {
        const item = {
          effDatasetMembership: 'direct',
          effQosMembership: 'direct',
        };
        const onInvokeItemAction = sinon.spy();
        const spacePrivileges = {
          view: true,
        };
        this.setProperties({
          item,
          onInvokeItemAction,
          spacePrivileges,
        });

        this.render(hbs `{{file-browser/item-features
          item=item
          expanded=false
          spacePrivileges=spacePrivileges
          onInvokeItemAction=onInvokeItemAction
        }}`);
        const $tag = this.$(`.file-status-${tag}`);
        expect($tag).to.have.length(1);
        await click($tag[0]);

        expect(onInvokeItemAction).to.have.been.calledOnce;
        expect(onInvokeItemAction).to.have.been.calledWith(item, action);
      });
  });

  [
    { tag: 'dataset', text: 'Dataset' },
    { tag: 'qos', text: 'QoS' },
  ].forEach(({ tag, text }) => {
    it(`displays "${text}" text on ${tag} tag`, function () {
      const item = {
        effDatasetMembership: 'direct',
        effQosMembership: 'direct',
      };
      const onInvokeItemAction = sinon.spy();
      this.setProperties({
        item,
        onInvokeItemAction,
      });

      this.render(hbs `{{file-browser/item-features
          item=item
          expanded=false
          onInvokeItemAction=onInvokeItemAction
        }}`);
      const $tag = this.$(`.file-status-${tag}`);

      expect($tag).to.exist;
      expect($tag.text().trim()).to.equal(text);
    });
  });

  it('changes direct tags into direct-ancestor tags after inheritance tag click', async function () {
    const item = {
      effDatasetMembership: 'directAndAncestor',
      effQosMembership: 'directAndAncestor',
    };
    this.set('item', item);

    this.render(hbs `{{file-browser/item-features item=item expanded=false}}`);
    const $inheritanceTag = this.$('.file-status-inherited');
    expect($inheritanceTag).to.have.length(1);
    expect(this.$('.file-status-dataset'), 'dataset').to.exist;
    expect(this.$('.file-status-qos'), 'qos').to.exist;
    expect(this.$('.dataset-file-status-tag-group .inherited-icon'), 'dataset inherited')
      .to.not.exist;
    expect(this.$('.qos-file-status-tag-group .inherited-icon'), 'qos inherited')
      .to.not.exist;
    await click($inheritanceTag[0]);

    expect(this.$('.file-status-inherited'), 'inheritance tag after click').to.not.exist;
    expect(this.$('.dataset-file-status-tag-group .inherited-icon'), 'dataset inherited a. click')
      .to.exist;
    expect(this.$('.qos-file-status-tag-group .inherited-icon'), 'qos inherited a. click')
      .to.exist;
  });
});
