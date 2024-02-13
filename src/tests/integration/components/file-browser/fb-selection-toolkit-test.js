import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { lookupService } from '../../../helpers/stub-service';
import {
  actionContext,
} from 'oneprovider-gui/components/file-browser';

describe('Integration | Component | file-browser/fb-selection-toolkit', function () {
  setupRenderingTest();

  it('renders one-pill-button if there is at last two items', async function () {
    const helper = new Helper(this);
    const file1 = helper.createFile({
      name: 'test1',
    });
    const file2 = helper.createFile({
      name: 'test2',
    });
    helper.items = [file1, file2];
    helper.selectionContext = actionContext.multiFile;

    await helper.render();

    expect(helper.onePillButton).to.exist;
  });

  it('does not render one-pill-button if there are no items', async function () {
    const helper = new Helper(this);
    helper.items = [];
    helper.selectionContext = actionContext.none;

    await helper.render();

    expect(helper.onePillButton).to.not.exist;
  });

  it('does not render one-pill-button if there only one item', async function () {
    const helper = new Helper(this);
    const file = helper.createFile({
      name: 'test-file',
    });
    helper.items = [file];
    helper.selectionContext = actionContext.singleFile;

    await helper.render();

    expect(helper.onePillButton).to.not.exist;
  });

  it('does not add additional properties in file-requirement-registry despite it invokes register',
    async function () {
      const helper = new Helper(this);
      const fileRequirementRegistry = lookupService(this, 'file-requirement-registry');
      const requirementsBefore = fileRequirementRegistry.getRequirements();
      const file1 = helper.createFile({
        name: 'test1',
      });
      const file2 = helper.createFile({
        name: 'test2',
      });
      helper.items = [file1, file2];
      helper.selectionContext = actionContext.multiFile;

      await helper.render();

      expect(helper.onePillButton).to.exist;

      const requirementsAfter = fileRequirementRegistry.getRequirements();
      expect(requirementsAfter).to.deep.equal(requirementsBefore);
    }
  );
});

class Helper {
  constructor(mochaContext) {
    this.mochaContext = mochaContext;
    this.items = [];
    this.selectionContext = actionContext.none;
    this.allButtonsArray = [];
  }
  get store() {
    return lookupService(this.mochaContext, 'store');
  }
  get element() {
    return find('.fb-selection-toolkit');
  }
  get onePillButton() {
    return this.element.querySelector('.one-pill-button');
  }
  createFile(data) {
    return this.store.createRecord('file', data);
  }
  async render() {
    this.mochaContext.setProperties({
      items: this.items,
      selectionContext: this.selectionContext,
      allButtonsArray: this.allButtonsArray,
    });
    await render(hbs`{{file-browser/fb-selection-toolkit
      items=items
      selectionContext=selectionContext
      allButtonsArray=allButtonsArray
    }}`);
  }
}
