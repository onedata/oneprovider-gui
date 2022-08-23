import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { find } from '@ember/test-helpers';
import FilePermissionsViewModel from 'oneprovider-gui/utils/file-permissions-view-model';
import { lookupService } from '../../../helpers/stub-service';
import { all as allSettled } from 'rsvp';
import { findByText } from '../../../helpers/find';
import { click } from '@ember/test-helpers';
import Helper from '../../../helpers/file-permissions';

describe('Integration | Component | file-permissions/body', function () {
  setupRenderingTest();

  it('renders visible POSIX permissions editor when all files permissions are the same POSIX', async function () {
    const helper = new Helper(this);
    helper.files = await allSettled([
      helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
      }),
      helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
      }),
    ]);

    await helper.renderBody();

    const element = helper.getBody();
    const posixEditor = helper.getPosixPermissionsEditor();
    expect(element).to.exist;
    expect(posixEditor).to.not.have.class('hidden');
    expect(find('.alert')).to.not.exist;
  });

  it('renders incompatible POSIX permissions alert when files permissions different POSIX', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentPosix();

    await helper.renderBody();

    helper.thenExpectHiddenPosixEditor();
    const alertElement = find('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.contain.text(
      'Selected files have different POSIX permissions.'
    );
  });

  it('renders visible ACL permissions editor when all files permissions are the same ACL', async function () {
    const helper = new Helper(this);
    const acls = await allSettled([
      helper.createAcl([helper.createExampleAce(0)]),
      helper.createAcl([helper.createExampleAce(0)]),
    ]);
    helper.files = await allSettled([
      helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[0],
      }),
      helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await helper.renderBody();

    const element = helper.getBody();
    const aclEditor = helper.getAclPermissionsEditor();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.not.exist;
    expect(element).to.exist;
    expect(aclEditor).to.not.have.class('hidden');
  });

  it('renders "different ACL" alert when both files have ACL but with different rules', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentAcl();

    await helper.renderBody();

    const element = helper.getBody();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.contain.text('Selected files have different ACL rules.');
  });

  it('renders "different ACL" alert when one file have POSIX and other ACL', async function () {
    const helper = new Helper(this);
    const acls = await allSettled([
      helper.createAcl([]),
      helper.createAcl([helper.createExampleAce()]),
    ]);
    helper.files = await allSettled([
      helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
        acl: acls[0],
      }),
      helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await helper.renderBody();

    const element = helper.getBody();
    const aclEditor = helper.getAclPermissionsEditor();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.contain.text('Selected files have different ACL rules.');
    expect(element).to.exist;
    expect(aclEditor).to.have.class('hidden');
  });

  it('unhides POSIX editor when clicking on "Edit anyway" from "different alert"', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentPosix();
    await helper.renderBody();

    await helper.whenEditAnywayIsClicked();

    helper.thenExpectVisiblePosixEditor();
  });

  it('unhides ACL editor when clicking on "Edit anyway" from "different alert"', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentAcl();
    await helper.renderBody();

    await helper.whenEditAnywayIsClicked();

    helper.thenExpectVisibleAclEditor();
  });
});
