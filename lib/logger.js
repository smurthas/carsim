var constants = require('../constants');
var car, sim;

var sampleFreq = 10; //Hz

var autoLog = [
  {

  }
]
exports.setCar = function(_car) {
  car = _car;
};

exports.setSim = function(_sim) {
  sim = _sim;
};

function log(name, value, units) {
  return {
    name: name,
    value: value,
    units: units
  };
}

var point = {};
exports.log = function(name, value, units) {
  point[name] = log(name, value, units);
};

function print(point) {
  for (var i in point) {
    var measurement = point[i];
    var name = measurement.name || i;
    while(name.length < 12) name += ' ';
    var value = typeof measurement.value === 'number' ?
                Math.round(measurement.value * 100) / 100 :
                measurement.value;
    value = value.toString();
    while(value.length < 12) value += ' ';
    console.log(name, value, measurement.units || '');
  }
}

var summary = {};


var ZERO_TO_CAPTURE = [30, 40, 50, 60, 70, 80, 90, 100];
function checkZeroTo() {
  for(var i in ZERO_TO_CAPTURE) {
    var mph = ZERO_TO_CAPTURE[i];
    if(!summary['0-' +mph] && sim.v > (mph / constants.MS_PER_MPH)) {
      summary['0-' + mph] = log('0-' + mph + ' mph', sim.t, 'seconds');
    }
  }
}

exports.capturePoint = function() {
  exports.log('v', sim.v, 'm/s');
  exports.log('s', sim.s, 'm');
  exports.log('t', sim.t, 'seconds');
  exports.log('gear', car.transmission.gear);
  exports.log('engine_rpm', car.engine.rpm, 'rpm');

  var steps_per_sample = 1.0/sim.t_step/sampleFreq;
  var sample = sim.step % steps_per_sample === 0;

  if (sample) {
    console.log('\n\n');
    print(point);
  }

  checkZeroTo();
  if (!summary.quarter_mile && sim.s > 400) {
    summary.quarter_mile = log('1/4 mi', sim.t, 'seconds');
    summary.quarter_mile_speed =
      log('1/4 mi spd', sim.v * constants.MS_PER_MPH, 'mph');
  }

  return point;
}

exports.end = function() {
  console.log('\n\nSummary');
  print(summary);
}

