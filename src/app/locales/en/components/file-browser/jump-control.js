const noItemIntro = 'No item with specified prefix found';

export default {
  jumpToPrefix: 'Jump to prefix...',
  tip: 'Enter a file name prefix to instantly scroll to the corresponding position in the current directory. Note that the list order is alphabetical, but case-sensitive – all big letters come first.',
  notFoundTip: {
    next: `${noItemIntro}, skipped to the next one in alphabetical order.`,
    end: `${noItemIntro}, skipped to the end of the list.`,
  },
};
