import {metric_manager} from './metric_manager';

const test_metric: metric_manager = new metric_manager();
test_metric.parallel_metric_and_net_score_calc()
    .then(metric_array => {
        console.log(
            `Bus Factor Score: ${metric_array[0]}\n` +
            `Bus Factor Latency: ${test_metric.bus_factor_latency}\n` +
            `Correctness Score: ${metric_array[1]}\n` +
            `Correctness Latency: ${test_metric.correctness_latency}\n` +
            `Ramp Up Score: ${metric_array[2]}\n` +
            `Ramp Up Latency: ${test_metric.ramp_up_latency}\n` +
            `Maintainer Score: ${metric_array[3]}\n` +
            `Maintainer Latency: ${test_metric.maintainer_latency}\n` +
            `License Score: ${metric_array[4]}\n` +
            `License Latency: ${test_metric.license_latency}\n` +
            `Net Score: ${metric_array.reduce((a,b) => a + b, 0)}\n` +
            `Net Score Latency: ${test_metric.net_score_latency}\n`
        );
    })
    .catch(error => {
        console.error('Error computing metrics for given package:', error);
    });