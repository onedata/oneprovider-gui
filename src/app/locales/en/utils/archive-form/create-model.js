import BaseModel from './-base-model';
import _ from 'lodash';

export default _.merge(_.cloneDeep(BaseModel), {
  noValidToIncrement: 'There are no valid completed archives to increment from',
});
