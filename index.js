var car = require('./cars/vw/2007/GTI');
var logger = require('./lib/logger');


var control = {
  update: function(car, simulator) {
    var nextRatio = car.transmission.getRatio(car.transmission.gear + 1);
    var torqueRatio = car.transmission.getRatio() / nextRatio;
    var nextSpeed = car.engine.rpm / torqueRatio;
    var nextTorque = car.engine.getTorque(nextSpeed) * nextRatio;
    var currentTorque = car.engine.getTorque() * car.transmission.getRatio();
    if (nextTorque > currentTorque) car.transmission.shiftUp();
    //if(car.engine.rpm > 6300) car.transmission.shiftUp();
  }
}

require('./simulator')(car, control).run(function(sim, point) {
  //return sim.t > 3;
  return point.s.value > 400 && point.v.value > 50;
});
