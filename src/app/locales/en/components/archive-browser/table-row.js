import state from './-archive-state';
import _ from 'lodash';
import FbTableRow from '../file-browser/fb-table-row';

export default _.merge({}, FbTableRow, {
  state,
});
