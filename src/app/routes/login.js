import { reject } from 'rsvp';
import LoginRoute from 'onedata-gui-common/routes/login';

export default LoginRoute.extend({
  model() {
    return reject({ message: 'TODO: redirect to Onezone' });
  },
});
