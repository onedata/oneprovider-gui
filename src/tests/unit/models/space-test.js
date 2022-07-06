import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import { get } from '@ember/object';
import { registerService } from '../../helpers/stub-service';
import Service from '@ember/service';

describe('Unit | Model | space', function () {
  setupTest();

  beforeEach(function () {
    registerService(this, 'transferManager', Service);
  });

  it('computes current user privileges without owner flag', function () {
    const model = this.owner.lookup('service:store').createRecord('space', {
      currentUserEffPrivileges: ['space_view_qos'],
      currentUserIsOwner: false,
    });

    const privileges = get(model, 'privileges');

    expect(privileges).to.have.property('viewQos', true);
    expect(privileges).to.have.property('viewTransfers', false);
  });

  it('computes current user privileges with owner flag', function () {
    const model = this.owner.lookup('service:store').createRecord('space', {
      currentUserEffPrivileges: [],
      currentUserIsOwner: true,
    });

    const privileges = get(model, 'privileges');

    expect(privileges).to.have.property('viewQos', true);
    expect(privileges).to.have.property('viewTransfers', true);
  });
});
