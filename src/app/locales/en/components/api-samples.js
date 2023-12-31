import ApiSamples from '../onedata-gui-common/components/api-samples';
import _ from 'lodash';

export default _.merge({}, ApiSamples, {
  apiCommandTipIntro: {
    rest: {
      filePublic: 'The Onezone\'s public REST API can be used to access information and contents of all shared files and directories, without any authentication. It redirects to the corresponding REST API in one of the supporting Oneproviders. The Oneprovider is chosen dynamically and may change in time, so the redirection URL should not be cached.',
      filePrivate: 'The Oneprovider\'s REST API can be used to perform all data access and management related operations on files and directories.',
    },
    xrootd: {
      filePublic: 'This environment offers an XRootD server that exposes all Open Data collections (shared files and directories that had been registered under a handle) for public, read-only access. Below are some basic XRootD commands that can be used to browse and download the data, assuming that the XRootD CLI tools are already installed.',
    },
  },
});
