const comparators = {
  provider: {
    is: 'is',
  },
  storage: {
    is: 'is',
  },
};

export default {
  valueEditors: {
    dropdownEditor: {
      providedBy: '@',
    },
  },
  blockSelector: {
    conditionSelector: {
      comparators,
    },
  },
  conditionBlock: {
    comparators,
  },
};
