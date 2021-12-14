/**
 * Plugin for Chartist which adds tooltip. For bar and line charts tooltip
 * creates description based on chartist legend and values. For pie chart data for tooltip is
 * taken from data.series.tooltipElements. For example:
 * ```
 * tooltipElements: [{
 *     name: 'prop1',
 *     value: '100',
 *   },
 *   {
 *     name: 'desc2',
 *     value: '23%',
 * }]
 * ```
 *
 * Options:
 * - chartType - type of the chart (bar, line, pie)
 * - rangeInTitle - takes two x axis labels instead of one to tooltip title
 * - renderAboveBarDescription - [bar chart only] if true, places tooltip
 * above a text instead of bar
 * - topOffset - top offset of a tooltip
 * - valueSuffix - [bar/line chart only] suffix for tooltip entries (e.g. for units)
 * - roundValues - if true, values in tooltip will be rounded
 *
 * Module imported from onedata-gui-common.
 *
 * @module utils/chartist/tooltip
 * @author Michal Borzecki
 * @copyright (C) 2017 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/* global Chartist */

// TODO: VFS-8724 remove and use chartist plugins from onedata-gui-common

import _ from 'lodash';
import dynamicRound from 'oneprovider-gui/utils/dynamic-round';
import $ from 'jquery';

const TOOLTIP_HTML = `
  <div class="chart-tooltip">
    <div class="chart-tooltip-title"></div>
    <ul class="ct-legend">
    </ul>
    <div class="chart-tooltip-arrow"></div>
  </div>
`;

let chartsIndex = [];

export default function tooltip(options) {
  const defaultOptions = {
    chartType: 'bar',
    rangeInTitle: false,
    renderAboveBarDescription: false,
    topOffset: -10,
    valueSuffix: '',
    roundValues: true,
  };
  const normalizedOptions = Chartist.extend({}, defaultOptions, options);

  return (chart) => {
    let tooltipNode;
    const container = $(chart.container);

    const chartEntry = getChartRenderEntry(chart);

    const prepareTooltip = function (tooltipData, data) {
      // title
      const title = tooltipNode.find('.chart-tooltip-title');
      title.empty();
      title.append(chart.data.labels[data.index]);
      if (normalizedOptions.rangeInTitle) {
        if (chart.data.labels[data.index - 1] &&
          chart.data.labels[data.index - 1] !== chart.data.labels[data.index]) {
          title.prepend(chart.data.labels[data.index - 1] + ' - ');
        }
      }

      // data series and values
      const ul = tooltipNode.find('.ct-legend');
      ul.empty();
      const suffix = normalizedOptions.valueSuffix ? ' ' + normalizedOptions.valueSuffix : '';
      tooltipData.forEach(d => {
        let value = d.value;
        if (normalizedOptions.roundValues && typeof value === 'number') {
          value = dynamicRound(value);
        }
        const styleAttr = d.cssString ? `style="${d.cssString}"` : '';
        ul.append(
          `<li class="${d.className}" ${styleAttr}>${d.name}: ${value + suffix}</li>`
        );
      });
    };

    chart.on('created', () => {
      if (!isPluginEnabled(chart)) {
        chartEntry.x = chartEntry.y = null;
        return;
      }
      tooltipNode = container.find('.chart-tooltip');
      if (tooltipNode.length === 0) {
        tooltipNode = $($.parseHTML(TOOLTIP_HTML));
        container.append(tooltipNode);
        tooltipNode.css(
          'transform',
          `translateY(-100%) translateY(${normalizedOptions.topOffset}px) translateX(-50%)`
        );
      } else {
        if (chartEntry.x !== null) {
          const element = document.elementFromPoint(chartEntry.x, chartEntry.y);
          const elementIndex = chartEntry.showCallbacksTargets.indexOf(element);
          if (elementIndex > -1) {
            chartEntry.showCallbacks[elementIndex](chartEntry.x, chartEntry.y);
          } else {
            chartEntry.x = chartEntry.y = null;
            tooltipNode.removeClass('active');
          }
        } else {
          tooltipNode.removeClass('active');
        }
      }
      $(chart.svg.getNode()).mousemove((event) => {
        if (!$(event.target).parents('.ct-series').length) {
          tooltipNode.removeClass('active');
          chartEntry.x = chartEntry.y = null;
        }
      });
    });

    chart.on('draw', function (data) {
      if (!isPluginEnabled(chart)) {
        return;
      }
      let tooltipData = chart.data.series.map(s => ({
        className: s.className,
        name: s.name,
        value: s.data[data.index],
      }));

      if (data.type === 'bar' && normalizedOptions.chartType === 'bar') {
        const groupNode = $(data.group._node);
        const barNode = $(data.element._node);

        barNode.mouseover(() => {
          const lastGroupNode = groupNode.parent().children().last();
          const lastGroupBar = $(lastGroupNode.children('line')[data.index]);

          // top position
          if (normalizedOptions.renderAboveBarDescription) {
            const sumLabel = $(lastGroupNode.children('text')[data.index]);
            tooltipNode.css(
              'top',
              (sumLabel.offset().top - container.offset().top) + 'px'
            );
          } else {
            tooltipNode.css(
              'top',
              (lastGroupBar.offset().top - container.offset().top) + 'px'
            );
          }
          // left position
          const rect = lastGroupBar[0].getBoundingClientRect();
          tooltipNode.css('left', (rect.left + rect.width / 2 - container.offset()
            .left) + 'px');

          prepareTooltip(tooltipData, data);

          tooltipNode.addClass('active');
        }).mouseout(() => {
          tooltipNode.removeClass('active');
        });
      }
      if (data.type === 'point' && normalizedOptions.chartType === 'line') {
        const groupNode = $(data.group._node);
        const pointNode = $(data.element._node);
        tooltipData = data.series.tooltipElements && data.series.tooltipElements[data
            .index] ?
          data.series.tooltipElements[data.index] : tooltipData;
        pointNode.mouseover(() => {
          // top position
          const rect = pointNode[0].getBoundingClientRect();
          if (normalizedOptions.renderAboveBarDescription) {
            const sumLabel = $(groupNode.children('text')[data.index]);
            tooltipNode.css(
              'top',
              (sumLabel.offset().top - container.offset().top) + 'px'
            );
          } else {
            tooltipNode.css(
              'top',
              (rect.top - container.offset().top) + 'px'
            );
          }
          // left position
          tooltipNode.css(
            'left',
            (rect.left + rect.width / 2 - container.offset().left) + 'px'
          );

          prepareTooltip(tooltipData, data);

          tooltipNode.addClass('active');
        }).mouseout(() => {
          tooltipNode.removeClass('active');
        });
      }
      if (data.type === 'slice' && normalizedOptions.chartType === 'pie') {
        data.series.tooltipElements.forEach((element) =>
          element.className = 'no-padding'
        );
        const tooltipData = data.series.tooltipElements;
        const sliceNode = $(data.element._node);
        const showTooltip = (x, y) => {
          tooltipNode.css(
            'top',
            (y - container.offset().top - 10) + 'px'
          );
          tooltipNode.css(
            'left',
            (x - container.offset().left) + 'px'
          );

          prepareTooltip(tooltipData, data);

          tooltipNode.addClass('active');
          chartEntry.x = x;
          chartEntry.y = y;
        };
        sliceNode.mousemove((event) => showTooltip(event.pageX, event.pageY))
          .mouseout(() => {
            tooltipNode.removeClass('active');
            chartEntry.x = chartEntry.y = null;
          });
        chartEntry.showCallbacksTargets.push(data.element.getNode());
        chartEntry.showCallbacks.push(showTooltip);
      }
    });
  };
}

function isPluginEnabled(chart) {
  return !chart.options.disabledPlugins ||
    chart.options.disabledPlugins.indexOf('tooltip') === -1;
}

function getChartRenderEntry(chart) {
  const node = chart.container;
  let chartRender = _.find(chartsIndex, { node });
  if (!chartRender) {
    chartRender = {
      node,
      x: null,
      y: null,
      showCallbacksTargets: [],
      showCallbacks: [],
    };
    // remove not existing charts renders
    chartsIndex = chartsIndex.filter((existingChartRender) => {
      return $.contains(document.documentElement, existingChartRender.node);
    });
    chartsIndex.push(chartRender);
  }
  return chartRender;
}
