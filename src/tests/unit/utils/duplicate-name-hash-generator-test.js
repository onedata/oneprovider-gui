import { expect } from 'chai';
import { describe, it } from 'mocha';
import DuplicateNameHashGenerator from 'oneprovider-gui/utils/duplicate-name-hash-generator';
import EmberObject, { computed } from '@ember/object';

describe('Unit | Utility | duplicate name hash generator', function () {
  it('exposes a hash for values if name is duplicated', function () {
    const subject = DuplicateNameHashGenerator.create();

    subject.addName('one', '/root1/one');
    subject.addName('one', '/root2/one');

    expect(subject.hashMapping['/root1/one'], 'root1').to.be.not.undefined;
    expect(subject.hashMapping['/root2/one'], 'root2').to.be.not.undefined;
  });

  it('does not expose a hash for name if name has single occurence', function () {
    const subject = DuplicateNameHashGenerator.create();

    subject.addName('one', '/root/one');

    expect(subject.hashMapping['/root1/one']).to.be.undefined;
  });

  it('does not expose a hash for name if the same name-value pair has been added mutliple times', function () {
    const subject = DuplicateNameHashGenerator.create();

    subject.addName('one', '/root/one');
    subject.addName('one', '/root/one');

    expect(subject.hashMapping['/root1/one']).to.be.undefined;
  });

  it('has observable hash mapping notifying when mapping is updated by adding', function () {
    const subject = DuplicateNameHashGenerator.create();
    const observingObject = EmberObject.extend({
      duplicateNameHashGenerator: undefined,

      root1: computed('duplicateNameHashGenerator.hashMapping', function root1() {
        return this.duplicateNameHashGenerator.hashMapping['/root1/one'];
      }),

      root2: computed('duplicateNameHashGenerator.hashMapping', function root2() {
        return this.duplicateNameHashGenerator.hashMapping['/root2/one'];
      }),
    }).create({
      duplicateNameHashGenerator: subject,
    });

    subject.addName('one', '/root1/one');
    expect(observingObject.root1).to.be.undefined;
    expect(observingObject.root2).to.be.undefined;

    subject.addName('one', '/root2/one');
    expect(observingObject.root1).to.be.not.undefined;
    expect(observingObject.root2).to.be.not.undefined;
  });
});
