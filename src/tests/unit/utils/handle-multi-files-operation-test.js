import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import handleMultiFilesOperation from 'oneprovider-gui/utils/handle-multi-files-operation';
import _ from 'lodash';
import sinon from 'sinon';
import { resolve, reject } from 'rsvp';

const filesCount = 10;

const files = _.range(0, filesCount).map((i) => Object.freeze({
  entityId: `file-${i}`,
  name: `File ${i}`,
}));

describe('Unit | Utility | handle multi files operation', function () {
  beforeEach(function () {
    this.globalNotify = {
      backendError() {},
    };
    this.errorExtractor = {
      getMessage() {},
    };
    this.i18n = {
      t() {},
    };
  });

  it('invokes operation with operationOptions',
    function () {
      const operation = sinon.stub().resolves();
      const operationOptions = { hello: 'world' };

      return handleMultiFilesOperation({
          files,
          globalNotify: this.globalNotify,
          operationOptions,
        },
        operation,
      ).then(() => {
        for (let i = 0; i < filesCount; ++i) {
          expect(operation).to.have.been.calledWith(files[i], operationOptions);
        }
      });
    }
  );

  it('resolves without invoking backendError if there are no failed promises',
    function () {
      const backendError = sinon.spy(this.globalNotify, 'backendError');
      const operation = () => resolve();

      return handleMultiFilesOperation({
          files,
          globalNotify: this.globalNotify,
        },
        operation
      ).then(() => {
        expect(backendError).to.have.been.not.called;
      });
    }
  );

  it('rejects invoking backendError first if there are failed promises',
    function () {
      const backendError = sinon.spy(this.globalNotify, 'backendError');
      const t = sinon.spy(this.i18n, 't');
      const getMessage = sinon.stub(this.errorExtractor, 'getMessage')
        .resolves({ message: 'none' });
      const reason = { error: 'something' };
      const operation = (file) => file.name.endsWith('4') ?
        reject(reason) : resolve();
      const operationErrorKey = 'errorKey';

      return handleMultiFilesOperation({
            files,
            globalNotify: this.globalNotify,
            errorExtractor: this.errorExtractor,
            i18n: this.i18n,
            operationErrorKey,
          },
          operation
        )
        .then(() => {
          expect(backendError).to.have.been.calledOnce;
          expect(t).to.have.been.calledWith(operationErrorKey);
          expect(getMessage).to.have.been.calledWith(reason);
        });
    }
  );
});
