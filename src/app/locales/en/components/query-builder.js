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
      providedBy: 'provided by',
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
