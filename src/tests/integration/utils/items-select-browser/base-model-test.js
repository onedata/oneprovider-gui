import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import ItemsSelectBrowserBaseModel from 'oneprovider-gui/utils/items-select-browser/base-model';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { lookupService } from '../../../helpers/stub-service';
import { setupRenderingTest } from 'ember-mocha';
import { get } from '@ember/object';

describe('Integration | Utility | items-select-browser/base-model', function () {
  setupRenderingTest();

  beforeEach(function () {
    const space = { name: 'Dummy space' };
    const itemsSelectBrowser = {
      submitSingleItem() {
        return notImplementedThrow();
      },
    };
    const i18n = lookupService(this, 'i18n');
    this.setProperties({
      space,
      itemsSelectBrowser,
      i18n,
      defaultCreateData: {
        ownerSource: this.owner,
        space,
        constraintSpec: undefined,
        dirProxy: promiseObject(resolve(null)),
        fetchChildren: notImplementedThrow,
        resolveItemParent: notImplementedThrow,
        itemsSelectBrowser,
      },
    });
  });

  it('has submitCurrentLabel as submitLabel when no items are selected', function () {
    const {
      defaultCreateData,
    } = this.getProperties('defaultCreateData');
    const label = 'Custom submit label';
    const dir = { name: 'current dir' };

    const model = ItemsSelectBrowserBaseModel.extend({
      submitCurrentLabel: label,
      dir,
    }).create(defaultCreateData, {
      // state
      browserSelectedItems: [],
    });

    expect(String(get(model, 'submitLabel'))).to.equal(label);
  });

  it('has "Confirm selection" submitLabel when no submitCurrentLabel is provided and no items are selected',
    function () {
      const {
        defaultCreateData,
      } = this.getProperties('defaultCreateData');
      const dir = { name: 'current dir' };

      const model = ItemsSelectBrowserBaseModel.extend({
        dir,
      }).create(defaultCreateData, {
        // state
        browserSelectedItems: [],
      });

      expect(String(get(model, 'submitLabel'))).to.equal('Confirm selection');
    }
  );

  it('disables submit when no submitCurrentLabel is provided and no items are selected',
    function () {
      const {
        defaultCreateData,
      } = this.getProperties('defaultCreateData');
      const dir = { name: 'current dir' };

      const model = ItemsSelectBrowserBaseModel.extend({
        dir,
      }).create(defaultCreateData, {
        // state
        browserSelectedItems: [],
      });

      expect(get(model, 'submitDisabled')).to.be.true;
    }
  );

  it('enables submit when no submitCurrentLabel is provided and some items are selected',
    function () {
      const {
        defaultCreateData,
      } = this.getProperties('defaultCreateData');
      const dir = { name: 'current dir' };

      const model = ItemsSelectBrowserBaseModel.extend({
        dir,
      }).create(defaultCreateData, {
        // state
        browserSelectedItems: [{ name: 'test-file-1' }],
      });

      expect(get(model, 'submitDisabled')).to.be.false;
    }
  );
});
