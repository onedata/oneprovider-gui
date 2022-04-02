import BaseModel from './-base-model';
import _ from 'lodash';

export default _.merge(_.cloneDeep(BaseModel), {
  archiveId: {
    label: 'Archive ID',
  },
  config: {
    label: 'Initial configuration',
    tip: 'Configuration that was provided during creation of this archive.',
  },
});
