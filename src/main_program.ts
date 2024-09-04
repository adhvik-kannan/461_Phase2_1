import {metric_manager} from './metric_manager';

const test_metric: metric_manager = new metric_manager();
test_metric.parallel_metric_and_net_score_calc()
    .then(metric_array => {
        console.log(
            `Bus Factor Score: ${metric_array[0]}\n` +
            `Correctness Score: ${metric_array[1]}\n` +
            `Ramp Up Score: ${metric_array[2]}\n` +
            `Maintainer Score: ${metric_array[3]}\n` +
            `License Score: ${metric_array[4]}\n` +
            `Net Score : ${metric_array.reduce((a,b) => a + b, 0)}`
        );
    })
    .catch(error => {
        console.error('Error computing metrics for given package:', error);
    });