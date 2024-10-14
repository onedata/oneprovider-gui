import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { click, find, settled } from '@ember/test-helpers';
import Helper from '../../helpers/file-permissions';
import { registerService, lookupService } from '../../helpers/stub-service';
import { treeToNumber } from 'oneprovider-gui/utils/acl-permissions-converter';
import { AceFlagsMasks } from 'oneprovider-gui/utils/acl-permissions-specification';
import { all as allFulfilled } from 'rsvp';
import CurrentUserService from 'onedata-gui-websocket-client/services/current-user';

describe('Integration | Component | file-permissions', function () {
  const { beforeEach, afterEach } = setupRenderingTest();

  beforeEach(async function () {
    const userId = 'mock_user';
    const store = lookupService(this, 'store');
    const userGri = store.userGri(userId);
    const user = store.createRecord('user', {
      id: userGri,
      username: 'mock_user',
      fullName: 'Mock User',
    });
    await user.save();
    const MockCurrentUserService = CurrentUserService.extend({
      userId,
    });
    registerService(this, 'currentUser', MockCurrentUserService);
    const currentUser = lookupService(this, 'currentUser');
    await currentUser.userProxy;

    this.set('currentUserRecord', user);
  });

  afterEach(function () {
    this.helper?.destroy();
  });

  it('un-disables discard and save buttons after POSIX is modified', async function () {
    this.helper = new Helper(this);
    await this.helper.givenSingleFilePosix();

    await this.helper.renderAll();
    await click('.user-read-checkbox');

    expect(this.helper.getDiscardButton()).to.exist;
    expect(this.helper.getDiscardButton()).to.not.have.attr('disabled');
    expect(this.helper.getSaveButton()).to.exist;
    expect(this.helper.getSaveButton()).to.not.have.attr('disabled');
  });

  //#region no-ACL-view permissions warning

  createSingleFileAclViewWarningTest('single ACE without ACL-rw permissions',
    true,
    async (mochaContext) => {
      const user = mochaContext.get('currentUserRecord');
      return [{
        aceType: 'DENY',
        aceFlags: AceFlagsMasks.NO_FLAGS,
        identifier: user.get('entityId'),
        aceMask: treeToNumber({ data: { read_object: true } }, 'file'),
        subject: user,
        subjectType: 'user',
      }];
    },
  );

  createSingleFileAclViewWarningTest('single ACE with ACL-rw permissions',
    false,
    async (mochaContext) => {
      const user = mochaContext.get('currentUserRecord');
      return [{
        aceType: 'ALLOW',
        aceFlags: AceFlagsMasks.NO_FLAGS,
        identifier: user.get('entityId'),
        aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
        subject: user,
        subjectType: 'user',
      }];
    },
  );

  createSingleFileAclViewWarningTest('combination of ACL read and write permissions',
    false,
    async (mochaContext) => {
      const user = mochaContext.get('currentUserRecord');
      return [{
          aceType: 'ALLOW',
          aceFlags: AceFlagsMasks.NO_FLAGS,
          identifier: user.get('entityId'),
          aceMask: treeToNumber({ acl: { read_acl: true, change_acl: false } }, 'file'),
          subject: user,
          subjectType: 'user',
        },
        {
          aceType: 'ALLOW',
          aceFlags: AceFlagsMasks.NO_FLAGS,
          identifier: user.get('entityId'),
          aceMask: treeToNumber({ acl: { read_acl: false, change_acl: true } }, 'file'),
          subject: user,
          subjectType: 'user',
        },
      ];
    },
  );

  createSingleFileAclViewWarningTest('single ACE with only read permission',
    true,
    async (mochaContext) => {
      const user = mochaContext.get('currentUserRecord');
      return [{
        aceType: 'ALLOW',
        aceFlags: AceFlagsMasks.NO_FLAGS,
        identifier: user.get('entityId'),
        aceMask: treeToNumber({ acl: { read_acl: true, change_acl: false } }, 'file'),
        subject: user,
        subjectType: 'user',
      }];
    },
  );

  createSingleFileAclViewWarningTest('single ACE with only write permission',
    true,
    async (mochaContext) => {
      const user = mochaContext.get('currentUserRecord');
      return [{
        aceType: 'ALLOW',
        aceFlags: AceFlagsMasks.NO_FLAGS,
        identifier: user.get('entityId'),
        aceMask: treeToNumber({ acl: { read_acl: false, change_acl: true } }, 'file'),
        subject: user,
        subjectType: 'user',
      }];
    },
  );

  createSingleFileAclViewWarningTest('single DENY ACE for ACL',
    true,
    async (mochaContext) => {
      const user = mochaContext.get('currentUserRecord');
      return [{
        aceType: 'DENY',
        aceFlags: AceFlagsMasks.NO_FLAGS,
        identifier: user.get('entityId'),
        aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
        subject: user,
        subjectType: 'user',
      }];
    },
  );

  createSingleFileAclViewWarningTest('OWNER@ ACE and current user is file owner',
    false,
    async (mochaContext) => {
        const user = mochaContext.get('currentUserRecord');
        return [{
          aceType: 'ALLOW',
          aceFlags: AceFlagsMasks.NO_FLAGS,
          identifier: 'OWNER@',
          aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
          subject: user,
          subjectType: 'user',
        }];
      },
      async (mochaContext) => {
        const user = mochaContext.get('currentUserRecord');
        const file = mochaContext.helper.files[0];
        file.set('owner', user);
        await file.save();
      },
  );

  createSingleFileAclViewWarningTest('OWNER@ ACE and current user is not file owner',
    true,
    async (mochaContext) => {
      const user = mochaContext.get('currentUserRecord');
      return [{
        aceType: 'ALLOW',
        aceFlags: AceFlagsMasks.NO_FLAGS,
        identifier: 'OWNER@',
        aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
        subject: user,
        subjectType: 'user',
      }];
    },
  );

  createSingleFileAclViewWarningTest('group ACE and current user belongs to group',
    false,
    async (mochaContext) => {
      const store = lookupService(mochaContext, 'store');
      const group = store.createRecord('group', { name: 'group1' });
      await group.save();
      const groupId = group.get('entityId');
      const currentUser = mochaContext.get('currentUserRecord');
      const groupList = store.createRecord('groupList', { list: [group] });
      await groupList.save();
      currentUser.set('effGroupList', groupList);
      return [{
        aceType: 'ALLOW',
        aceFlags: AceFlagsMasks.IDENTIFIER_GROUP,
        identifier: groupId,
        aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
        subject: group,
        subjectType: 'group',
      }];
    },
  );

  createSingleFileAclViewWarningTest('group ACE and current user does not belong to group',
    true,
    async (mochaContext) => {
      const store = lookupService(mochaContext, 'store');
      const group = store.createRecord('group', { name: 'group1' });
      await group.save();
      const groupId = group.get('entityId');
      const currentUser = mochaContext.get('currentUserRecord');
      const groupList = store.createRecord('groupList', { list: [] });
      await groupList.save();
      currentUser.set('effGroupList', groupList);
      return [{
        aceType: 'ALLOW',
        aceFlags: AceFlagsMasks.IDENTIFIER_GROUP,
        identifier: groupId,
        aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
        subject: group,
        subjectType: 'group',
      }];
    },
  );

  createSingleFileAclViewWarningTest('EVERYONE@ ACE',
    false,
    async () => {
      return [{
        aceType: 'ALLOW',
        aceFlags: AceFlagsMasks.IDENTIFIER_GROUP,
        identifier: 'EVERYONE@',
        aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
        subject: null,
        subjectType: 'group',
      }];
    },
  );

  createSingleFileAclViewWarningTest('ANONYMOUS@ ACE',
    true,
    async () => {
      return [{
        aceType: 'ALLOW',
        aceFlags: AceFlagsMasks.IDENTIFIER_GROUP,
        identifier: 'ANONYMOUS@',
        aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
        subject: null,
        subjectType: 'group',
      }];
    },
  );

  createSingleFileAclViewWarningTest('GROUP@ ACE',
    false,
    async () => {
      return [{
        aceType: 'ALLOW',
        aceFlags: AceFlagsMasks.IDENTIFIER_GROUP,
        identifier: 'GROUP@',
        aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
        subject: null,
        subjectType: 'group',
      }];
    },
  );

  createSingleFileAclViewWarningTest('GROUP@ DENY and GROUP@ ALLOW ACE',
    true,
    async () => {
      return [{
          aceType: 'DENY',
          aceFlags: AceFlagsMasks.IDENTIFIER_GROUP,
          identifier: 'GROUP@',
          aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
          subject: null,
          subjectType: 'group',
        },
        {
          aceType: 'ALLOW',
          aceFlags: AceFlagsMasks.IDENTIFIER_GROUP,
          identifier: 'GROUP@',
          aceMask: treeToNumber({ acl: { read_acl: true, change_acl: true } }, 'file'),
          subject: null,
          subjectType: 'group',
        },
      ];
    },
  );

  //#endregion
});

function createSingleFileAclViewWarningTest(
  conditionsText,
  isWarning,
  createAcl,
  beforeRender,
) {
  const warningRenderText = isWarning ? 'renders' : 'does not render';
  const text = `${warningRenderText} no-ACL-permissions warning for ${conditionsText}`;
  it(text,
    async function () {
      this.helper = new Helper(this);
      const acl = await this.helper.createAcl(await createAcl(this));
      this.helper.files = await allFulfilled([
        this.helper.createFile({
          activePermissionsType: 'acl',
          acl,
        }),
      ]);
      await beforeRender?.(this);

      await this.helper.renderAll();
      await settled();

      const warningElement = find('.pre-submit-info-review');
      if (isWarning) {
        expect(warningElement).to.exist;
      } else {
        expect(warningElement).to.not.exist;
      }
    }
  );
}
