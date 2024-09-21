import { metric_manager } from "./metric_manager.js";


// export function output_formatter(url: string, metric_array: any[], test_metric: metric_manager): void {
//     const fixed_url: string = url.trim();
//     const formatted_string: string = '{"URL": ' + '"' + fixed_url + '"' + ', ' +
//         '"NetScore": ' + `${metric_array.reduce((a, b) => a+b, 0)}, ` + '"NetScore_Latency": ' + `${test_metric.net_score_latency}, ` +
//         '"RampUp": ' + `${metric_array[0]}, ` + '"RampUp_Latency": ' + `${test_metric.ramp_up_latency}, ` +
//         '"Correctness": ' + `${metric_array[1]}, ` + '"Correctness_Latency": ' + `${test_metric.correctness_latency}, ` +
//         '"BusFactor": ' + `${metric_array[2]}, ` + '"BusFactor_Latency": ' + `${test_metric.bus_factor_latency}, ` +
//         '"ResponsiveMaintainer": ' + `${metric_array[3]}, ` + '"ResponsiveMaintainer_Latency": ' + `${test_metric.maintainer_latency}, ` +
//         '"License": ' + `${metric_array[4]}, ` + '"License_Latency": ' + `${test_metric.license_latency}}\n`;
//     console.log(formatted_string);
// }

export function output_formatter(url: string, metric_array: any[], test_metric: metric_manager): void {
    const fixed_url: string = url.trim();
    const formatted_string: string = '{"URL": ' + '"' + fixed_url + '"' + ', ' +
        '"NetScore": ' + `${(metric_array.reduce((a, b) => a + b, 0)).toFixed(3)}, ` +
        '"NetScore_Latency": ' + `${test_metric.net_score_latency.toFixed(3)}, ` +
        '"RampUp": ' + `${metric_array[2].toFixed(3)}, ` +
        '"RampUp_Latency": ' + `${test_metric.ramp_up_latency.toFixed(3)}, ` +
        '"Correctness": ' + `${metric_array[1].toFixed(3)}, ` +
        '"Correctness_Latency": ' + `${test_metric.correctness_latency.toFixed(3)}, ` +
        '"BusFactor": ' + `${metric_array[0].toFixed(3)}, ` +
        '"BusFactor_Latency": ' + `${test_metric.bus_factor_latency.toFixed(3)}, ` +
        '"ResponsiveMaintainer": ' + `${metric_array[3].toFixed(3)}, ` +
        '"ResponsiveMaintainer_Latency": ' + `${test_metric.maintainer_latency.toFixed(3)}, ` +
        '"License": ' + `${metric_array[4].toFixed(3)}, ` +
        '"License_Latency": ' + `${test_metric.license_latency.toFixed(3)}}\n`;

    console.log(formatted_string);
}
