import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupModelTest } from 'ember-mocha';
import { get } from '@ember/object';
import { registerService } from '../../helpers/stub-service';
import Service from '@ember/service';

describe('Unit | Model | space', function () {
  setupModelTest('space', {
    needs: [],
  });

  beforeEach(function () {
    registerService(this, 'transferManager', Service);
  });

  it('computes current user privileges without owner flag', function () {
    const model = this.subject({
      currentUserEffPrivileges: ['space_view_qos'],
      currentUserIsOwner: false,
    });

    const privileges = get(model, 'privileges');

    expect(privileges).to.have.property('viewQos', true);
    expect(privileges).to.have.property('viewTransfers', false);
  });

  it('computes current user privileges with owner flag', function () {
    const model = this.subject({
      currentUserEffPrivileges: [],
      currentUserIsOwner: true,
    });

    const privileges = get(model, 'privileges');

    expect(privileges).to.have.property('viewQos', true);
    expect(privileges).to.have.property('viewTransfers', true);
  });
});
