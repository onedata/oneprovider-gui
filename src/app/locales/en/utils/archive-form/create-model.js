import BaseModel from './-base-model';
import _ from 'lodash';

export default _.merge(_.cloneDeep(BaseModel), {
  noValidToIncrement: 'There are no suitable archives to base an incremental archive on',
});
