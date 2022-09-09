export default {
  warning: {
    future: {
      file: 'This file will not be accessible via any public share because it has no <em>read</em> POSIX permission for <em>other</em>.',
      dir: 'This directory will not be accessible via any public share because it does not have both <em>read</em> and <em>execute</em> POSIX permissions for <em>other</em>.',
    },
    present: {
      file: 'This file is not accessible via any public share because it has no <em>read</em> POSIX permission for <em>other</em>.',
      dir: 'This directory is not accessible via any public share because it does not have both <em>read</em> and <em>execute</em> POSIX permissions for <em>other</em>.',
    },
  },
};
