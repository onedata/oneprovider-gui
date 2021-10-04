import { fileType, protectionType } from './-common';

export default {
  fileType,
  protectionType,
  protectionHeader: 'Write protection',
  hint: {
    title: 'Dataset write protection',
    intro: 'This view presents a summary of write protection settings concerning this dataset and its ancestors. Please note that all ancestor datasets (ones that contain this dataset) are also considered when determining the effective write protection – presented in the top-right corner. This is depicted in the below table, which allows manipulating the settings for each dataset in the hierarchy.',
    close: 'OK',
  },
};
