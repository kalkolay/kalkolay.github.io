const TYPE_ELASTIC = 0;
const TYPE_NONELASTIC = 1;

function elastic_hit(m1, m2, v1, v2) {
    var v1_new = ((2 * m2 * v2) + (v1 * (m1 - m2))) / (m1 + m2);
    var v2_new = ((2 * m1 * v1) + (v2 * (m2 - m1))) / (m1 + m2);

    return {'v1': v1_new, 'v2': v2_new};
}
function nonelastic_hit(m1, m2, v1, v2) {
    var v = ((m1 * v1) + (m2 * v2)) / (m1 + m2);
    var w = (v1 - v2) * (v1 - v2) * ((m1 * m2) / ((m1 + m2) * 2));
    return {'v1': v, 'v2': v, 'w': w};
}

function showResult(values, type) {
    $result = $('#Result .result-value');
    $result.eq(0).find('.value').text(values['v1'].toFixed(2)+' m/s');
    $result.eq(1).find('.value').text(values['v2'].toFixed(2)+' m/s');
    if(type == TYPE_ELASTIC){
        $result.eq(2).find('.title').text('Скорость тележки #1 (после):');
        $result.eq(2).find('.value').text(values['new_v1'].toFixed(2)+' m/s');

        $result.eq(3).find('.title').text('Скорость тележки #2 (после):');
        $result.eq(3).find('.value').text(values['new_v2'].toFixed(2)+' m/s');
    }else if(type == TYPE_NONELASTIC){
        $result.eq(2).find('.title').text('Скорость тележек (после):');
        $result.eq(2).find('.value').text(values['new_v'].toFixed(2)+' m/s');

        $result.eq(3).find('.title').text('Потеря механической энергии:');
        $result.eq(3).find('.value').text(values['w'].toFixed(2)+' Дж');
    }


}

function Truck($truck, pixels_in_meter, setting_length, start_position) {
    this.$truck = $truck;
    this.width = this.$truck.width();
    this.pixels_in_meter = pixels_in_meter;
    this.length = this.width / pixels_in_meter;
    this.FPS = 200;
    this.setting_length = setting_length;
    this.start_position = start_position;
    this.move(this.start_position);
}
Truck.prototype.move = function (position) {
    if(position <= 0) position = 0;
    if(position >= this.setting_length - this.length) position = this.setting_length - this.length;
    var pixels = position * this.pixels_in_meter;
    this.$truck.css('transform', 'translate('+pixels +'px)');
};
Truck.prototype.moveWithSpeed = function (speed, start = 0, predicate = null, callback = null) {
    this.showSpeed(speed);
    var time = 0;
    var interval = 1 / this.FPS;
    this.animation = setInterval(function () {
        time += interval;
        var position = start + speed * time;
        this.move(position);
        if((predicate != null && predicate(time, position) || this.isBorder(position))){
            this.stop();
            if(callback != null){
                callback();
            }
        }
    }.bind(this), 1000 * interval);

};
Truck.prototype.getPosition = function () {
    var pixels = parseFloat(this.$truck.css("transform").split(",")[4].trim());
    return pixels / this.pixels_in_meter;
};

Truck.prototype.isBorder = function (position) {
    return position <= 0 || position + this.length + 0.001 >= this.setting_length;
};
Truck.prototype.stop = function () {
    clearInterval(this.animation);
    this.animation = null;
    this.showSpeed(0);
};
Truck.prototype.isMoving = function () {
    return this.animation;
};
Truck.prototype.showSpeed = function (speed = 0) {
    this.$truck.find('.speed').text(speed.toFixed(2)+' m/s');
};
Truck.prototype.reset = function (position = null) {
    this.stop();
    if(position){
        this.move(position);
    }else{
        this.move(this.start_position);
    }
};


function Setting(truck_length){
    this.$setting = $('#Setting');
    this.width = this.$setting.width();
    var truck_width = $('#Truck1').width();
    this.truck_length = 1;
    this.length = this.width / truck_width * this.truck_length;

    this.pixels_in_meter = truck_width * this.truck_length;

    this.trucks = [];
    this.trucks.push(new Truck($('#Truck1'), this.pixels_in_meter, this.length, 0));
    this.trucks.push(new Truck($('#Truck2'), this.pixels_in_meter, this.length, (this.length - this.truck_length) / 2));

}
Setting.prototype.start = function(m1, m2, v1, v2, type, callback){
    this.trucks[0].reset();
    this.trucks[1].reset((v2 == 0) ? null : (this.length - this.truck_length));

    var result = null;
    var result_values = {'v1': v1, 'v2': v2};
    if(type == TYPE_ELASTIC){
        result = elastic_hit(m1, m2, v1, v2);
        result_values['new_v1'] = result.v1;
        result_values['new_v2'] = result.v2;
    }else if(type == TYPE_NONELASTIC){
        result = nonelastic_hit(m1, m2, v1, v2);
        result_values['new_v'] = result.v1;
        result_values['w'] = result.w;
    }
    showResult(result_values, type);
    this.trucks[0].moveWithSpeed(v1, 0, function (time, position) {
        return position + this.truck_length >= this.trucks[1].getPosition();
    }.bind(this), function () {
        this.trucks[1].stop();
        this.trucks[1].moveWithSpeed(result['v2'], this.trucks[1].getPosition(), function (time, position) {
            return !this.trucks[0].isMoving() && position <= this.trucks[0].getPosition() + this.truck_length;
        }.bind(this));
        this.trucks[0].stop();
        this.trucks[0].moveWithSpeed(result['v1'], this.trucks[0].getPosition(), function (time, position) {
            return !this.trucks[1].isMoving() && position + this.truck_length >= this.trucks[1].getPosition();
        }.bind(this));
    }.bind(this));

    this.trucks[1].moveWithSpeed(v2, this.trucks[1].getPosition(), function (time, position) {
        return position <= this.trucks[0].getPosition() + this.truck_length;
    }.bind(this));
};



function getValues(){
    var values = {};
    var is_empty = false;
    $('._val').each(function () {
        values[$(this).attr('name')] = parseFloat($(this).val());
    });
    return values;
}

$(document).ready(function () {
    // //установка
    var setting = new Setting();
    $('#start').click(function () {
        var values = getValues();
        if(!isNaN(values['m1']) && !isNaN(values['m2']) && !isNaN(values['v1']) && !isNaN(values['v2'])) {
            if(values['m1'] > 0 && values['m2'] > 0 && values['v1'] > 0 && values['v2'] >= 0) {
                var type = $('#HitType').val();
                setting.start(values['m1'], values['m2'], values['v1'], -1 * values['v2'], type);
            }
        }
    });

    //график
    var chart = new ChartController();
    $('._val:not(.speed_val)').keyup(function () {
        var values = getValues();
        if(!isNaN(values['m1']) && !isNaN(values['m2'])) {
            if(values['m1'] > 0 && values['m2'] > 0) {
                chart.show($('#chart_elastic'), [function (x) {
                    return elastic_hit(values['m1'], values['m2'], x, 0)['v2'];
                }, function (x) {
                    return elastic_hit(values['m1'], values['m2'], x, 0)['v1'];
                }], ['Зависимость v2 от v01', 'Зависимость v1 от v01']);

                chart.show($('#chart_nonelastic'), [function (x) {
                    return nonelastic_hit(values['m1'], values['m2'], x, 0)['v1'];
                }, function (x) {
                    return nonelastic_hit(values['m1'], values['m2'], x, 0)['w'];
                }], ['Зависимость v от v01', 'Зависимость потери энергии от v01']);
            }
        }
    });
});