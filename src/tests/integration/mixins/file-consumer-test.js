import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import Component from '@ember/component';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { lookupService } from '../../helpers/stub-service';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import _ from 'lodash';
import { all as allFulfilled } from 'rsvp';

const BaseDummyComponentClass = Component.extend(FileConsumerMixin, {
  layout: hbs `<span>dummy consumer</span>`,
});

describe('Integration | Mixin | file-consumer', function () {
  setupRenderingTest();

  beforeEach(function () {
    this.owner.register('component:base-dummy-component', BaseDummyComponentClass);
  });

  it('registers requirements on inserting and deregisters on destroying',
    async function () {
      const fileGri = 'some-gri';
      const requirement = FileRequirement.create({
        fileGri,
        properties: [
          'name',
          'type',
          'mtime',
          'size',
        ],
      });
      const fileRequirements = [requirement];
      const DummyComponentClass = BaseDummyComponentClass.extend({
        /** @override */
        fileRequirements,
      });
      this.set('isVisible', false);
      this.owner.register('component:dummy-component', DummyComponentClass);
      const fileRequirementRegistry = lookupService(this, 'fileRequirementRegistry');
      await render(hbs `
        {{#if isVisible}}
          {{dummy-component}}
        {{/if}}
      `);

      // before component inserting
      expect(fileRequirementRegistry.getRequirements())
        .to.not.contain(requirement);

      // after component inserting
      this.set('isVisible', true);
      await waitForRender();
      expect(fileRequirementRegistry.getRequirements())
        .to.contain(requirement);

      // after component removing
      this.set('isVisible', false);
      await waitForRender();
      expect(fileRequirementRegistry.getRequirements())
        .to.not.contain(requirement);
    }
  );

  it('replaces requirements for consumer in global registry on requirements change',
    async function () {
      const fileGri = 'some-gri';
      const requirement1 = FileRequirement.create({
        fileGri,
        properties: [
          'name',
        ],
      });
      const requirement2 = FileRequirement.create({
        fileGri,
        properties: [
          'mtime',
        ],
      });
      this.set('fileRequirements', [requirement1]);
      const fileRequirementRegistry = lookupService(this, 'fileRequirementRegistry');
      await render(hbs `
      {{base-dummy-component fileRequirements=fileRequirements}}
    `);

      // original requirement
      expect(fileRequirementRegistry.getRequirements())
        .to.contain(requirement1);
      expect(fileRequirementRegistry.getRequirements())
        .to.not.contain(requirement2);

      // changing requirements
      this.set('fileRequirements', [requirement2]);
      await waitForRender();
      expect(fileRequirementRegistry.getRequirements())
        .to.not.contain(requirement1);
      expect(fileRequirementRegistry.getRequirements())
        .to.contain(requirement2);
    }
  );

  it('registers file records on inserting and deregisters on destroying',
    async function () {
      const store = lookupService(this, 'store');
      const usedFiles = await allFulfilled(
        _.range(1).map(i => store.createRecord('file', { name: `file-${i}` }).save())
      );
      this.set('usedFiles', usedFiles);
      const DummyComponentClass = BaseDummyComponentClass.extend({
        /** @override */
        usedFiles,
      });
      this.set('isVisible', false);
      this.owner.register('component:dummy-component', DummyComponentClass);
      const fileRecordRegistry = lookupService(this, 'file-record-registry');
      await render(hbs `
        {{#if isVisible}}
          {{dummy-component}}
        {{/if}}
      `);

      // before component inserting
      expect(fileRecordRegistry.getRegisteredFiles())
        .to.not.contain(usedFiles[0]);

      // after component inserting
      this.set('isVisible', true);
      await waitForRender();
      expect(fileRecordRegistry.getRegisteredFiles())
        .to.contain(usedFiles[0]);

      // after component removing
      this.set('isVisible', false);
      await waitForRender();
      expect(fileRecordRegistry.getRegisteredFiles())
        .to.not.contain(usedFiles[0]);
    }
  );

  it('replaces file records for consumer in global registry on requirements change',
    async function () {
      const store = lookupService(this, 'store');
      const files = await allFulfilled(
        _.range(4).map(i => store.createRecord('file', { name: `file-${i}` }).save())
      );
      this.set('usedFiles', files.slice(0, 2));
      const fileRecordRegistry = lookupService(this, 'file-record-registry');
      await render(hbs `
        {{base-dummy-component usedFiles=usedFiles}}
      `);

      // original files
      expect(fileRecordRegistry.getRegisteredFiles().sort(), 'original')
        .to.deep.equal([files[0], files[1]].sort());

      // changing files
      this.set('usedFiles', files.slice(2, 4));
      await waitForRender();
      expect(fileRecordRegistry.getRegisteredFiles().sort(), 'changed')
        .to.deep.equal([files[2], files[3]].sort());
    }
  );
});
