/**
 * When we reach this route and authRedirect flag is set, clear it, because
 * we reached login route which was intended.
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

// import Login from 'onedata-gui-common/routes/login';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';
import AuthenticationErrorHandlerMixin from 'onedata-gui-common/mixins/authentication-error-handler';

// TODO: until production Oneprovider: implement authRedirect support, maybe something like in onepanel-gui

export default Route.extend(
  UnauthenticatedRouteMixin,
  I18n,
  AuthenticationErrorHandlerMixin, {
    i18n: service(),

    // TODO: this route should have some other title or no title at all

    /**
     * @override
     */
    i18nPrefix: 'routes.login',
  }
);
