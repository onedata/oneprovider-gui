import { expect } from 'chai';
import { describe, it } from 'mocha';
import EmberObject from '@ember/object';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import Service from '@ember/service';
import sinon from 'sinon';
import { get } from '@ember/object';

const Store = Service.extend({
  findRecord() {},
});

describe('Unit | Mixin | content space base', function () {
  it('resolves spaceProxy using spaceEntityId', function () {
    const ContentSpaceBaseObject = EmberObject.extend(ContentSpaceBaseMixin);
    const store = Store.create();
    const subject = ContentSpaceBaseObject.create({
      store,
    });
    const findRecord = sinon.stub(store, 'findRecord');
    const spaceEntityId = 'a';
    const spaceRecord = {};
    findRecord
      .withArgs('space', sinon.match(new RegExp(spaceEntityId)))
      .resolves(spaceRecord);

    return get(subject, 'spaceProxy').then((space) => {
      expect(space).to.be.equal(spaceRecord);
    });
  });
});
