import { expect } from 'chai';
import { describe, it } from 'mocha';
import transferIndex from 'oneprovider-gui/utils/transfer-index';

describe('Unit | Utility | transfer index', function () {
  it('computes proper index for ended transfer', function () {
    const transfer = {
      entityId: '98a0e211bd67f171c6c6f1a63d199e87ch7323',
      scheduleTime: 1593700230,
      finishTime: 0,
    };
    const result = transferIndex(transfer, 'ended');
    expect(result).to.equal('999999999998a0e2');
  });
});
