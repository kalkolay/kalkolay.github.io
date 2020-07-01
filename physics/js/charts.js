function ChartController() {
    this.charts = {};
    this.colors = ['#437cff', '#ff7164'];
}
ChartController.prototype.show = function ($chart, functions, labels) {
    var id = $chart.attr('id');

    var datasets = [];
    var x_values = [];
    for(var i = 0; i < 20; i++) x_values[i] = i;
    functions.forEach(function(func, i){
        var dataset = {
            label: labels[i],
            backgroundColor: this.colors[i],
            borderColor: this.colors[i],
            data: [],
            fill: false
        };
        x_values.forEach(function(x_val){
            dataset.data.push(func(x_val));
        });
        datasets.push(dataset);
    }.bind(this));

    if(id in this.charts){
        this.charts[id].data.labels = x_values;
        this.charts[id].data.datasets = datasets;
        this.charts[id].update();

    }else{
        this.charts[id] = new Chart($chart, {
            type: 'line',
            data: {
                labels: x_values,
                datasets: datasets
            },
            options: {
                // responsive: false
            }
        });
    }
};