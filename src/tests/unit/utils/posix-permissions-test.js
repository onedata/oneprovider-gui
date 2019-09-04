import { expect } from 'chai';
import { describe, it } from 'mocha';
import PosixPermissions from 'oneprovider-gui/utils/posix-permissions';
import { set, get, getProperties } from '@ember/object';
import _ from 'lodash';

const permissionsOctalNumbers = {
  read: 4,
  write: 2,
  execute: 1,
};

const permissionsLetters = {
  read: 'r',
  write: 'w',
  execute: 'x',
};

function dumpBooleanValues(posixPermissions) {
  const entityBooleans = [
    'user',
    'group',
    'other',
  ].map(entity => {
    return [
      get(posixPermissions, `${entity}.read`),
      get(posixPermissions, `${entity}.write`),
      get(posixPermissions, `${entity}.execute`),
    ];
  });
  return _.flatten(entityBooleans);
}

describe('Unit | Utility | posix permissions', function () {
  [
    'user',
    'group',
    'other',
  ].forEach((entity, entityIndex) => {
    Object.keys(permissionsOctalNumbers).forEach((permission, permIndex) => {
      it(
        `allows to set directly ${entity} ${permission} permission`,
        function () {
          const posixPermissions = PosixPermissions.create();
          set(posixPermissions, `${entity}.${permission}`, true);

          const {
            stringRepresentation,
            octalRepresentation,
          } = getProperties(
            posixPermissions,
            'stringRepresentation',
            'octalRepresentation'
          );
          expect(stringRepresentation[entityIndex * 3 + entityIndex + permIndex])
            .to.equal(permissionsLetters[permission]);
          expect(stringRepresentation.split('').filter(c => c !== ' ' && c !== '-'))
            .to.have.length(1);
          const correctOctal = _.repeat('0', entityIndex) +
            String(permissionsOctalNumbers[permission]) +
            _.repeat('0', 2 - entityIndex);
          expect(octalRepresentation).to.equal(correctOctal);
        }
      );
    });
  });

  [
    {
      octal: '421',
      booleans: [true, false, false, false, true, false, false, false, true],
      str: 'r-- -w- --x',
    },
    {
      octal: '142',
      booleans: [false, false, true, true, false, false, false, true, false],
      str: '--x r-- -w-',
    },
    {
      octal: '214',
      booleans: [false, true, false, false, false, true, true, false, false],
      str: '-w- --x r--',
    },
    {
      octal: '664',
      booleans: [true, true, false, true, true, false, true, false, false],
      str: 'rw- rw- r--',
    },
    {
      octal: '000',
      booleans: [false, false, false, false, false, false, false, false, false],
      str: '--- --- ---',
    },
    {
      octal: '777',
      booleans: [true, true, true, true, true, true, true, true, true],
      str: 'rwx rwx rwx',
    },
  ].forEach(({ octal, booleans, str }) => {
    it(
      `correctly parses octal ${octal} value`,
      function () {
        const posixPermissions = PosixPermissions.create();
        posixPermissions.fromOctalRepresentation(octal);

        const {
          stringRepresentation,
          octalRepresentation,
        } = getProperties(
          posixPermissions,
          'stringRepresentation',
          'octalRepresentation'
        );
        expect(stringRepresentation).to.equal(str);
        expect(octalRepresentation).to.equal(octal);
        expect(dumpBooleanValues(posixPermissions)).to.deep.equal(booleans);
      }
    );
  });
});
