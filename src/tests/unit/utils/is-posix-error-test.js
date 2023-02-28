import { expect } from 'chai';
import { describe, it } from 'mocha';
import isPosixError from 'oneprovider-gui/utils/is-posix-error';

describe('Unit | Utility | is-posix-error', function () {
  it('returns false if error is not POSIX at all', function () {
    const error = {
      id: 'notFound',
      details: {
        errno: 'xd',
      },
    };

    const result = isPosixError(error);

    expect(result).to.be.false;
  });

  it('returns false if error is not POSIX at all and type is provided', function () {
    const error = {
      id: 'notFound',
      details: {
        errno: 'enoent',
      },
    };

    const result = isPosixError(error, 'enoent');

    expect(result).to.be.false;
  });

  it('returns false if error is POSIX but provided type does not match', function () {
    const error = {
      id: 'posix',
      details: {
        errno: 'enoent',
      },
    };

    const result = isPosixError(error, 'eagain');

    expect(result).to.be.false;
  });

  it('returns true if error is POSIX and no type is provided', function () {
    const error = {
      id: 'posix',
      details: {
        errno: 'enoent',
      },
    };

    const result = isPosixError(error);

    expect(result).to.be.true;
  });

  it('returns true if error is POSIX and type matches', function () {
    const error = {
      id: 'posix',
      details: {
        errno: 'enoent',
      },
    };

    const result = isPosixError(error, 'enoent');

    expect(result).to.be.true;
  });
});
