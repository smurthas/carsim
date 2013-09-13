var constants = require('./constants');
var logger = require('./lib/logger');


var summary = {};

module.exports = function(car, control) {
  logger.setCar(car);
  logger.setSim(this);

  this.s = 0; // distance, meters
  this.v = 0; // velocity, m/s
  this.launchRPM = 3000;

  this.t_step = 0.01; // seconds
  this.t_max = 90.0; // end time, seconds
  this.step = 0;
  this.t = 0;

  this.run = function(exitCond) {
    // time loop
    while(t < t_max) {

      // get engine torque
      if (car.transmission.gear === 1 && car.engine.rpm < launchRPM) {
        car.engine.rpm = launchRPM;
        logger.log('clutch_slip', true);
      } else {
        var alpha = v / (car.wheel_rad * 2 * constants.PI); // Hz
        car.engine.rpm = alpha * car.transmission.getRatio() * 60; // rpm
        logger.log('clutch_slip', false);
      }

      var T_eng = car.engine.getTorque();
      var T_wheel = car.transmission.getTorque(T_eng);
      var F_wheel_eng = T_wheel / car.wheel_rad;
      var F_wheel_max = car.mass * constants.G *
                        car.mass_front_pct * car.tires.mu;
      var tire_slip = F_wheel_max < F_wheel_eng;
      var F_wheel = tire_slip? F_wheel_max : F_wheel_eng;

      var F_drag = 0.5 * constants.RHO * v * v * car.C_d * car.A;

      var F_net = F_wheel - F_drag;

      var dv_dt = F_net / car.mass



      logger.log('T_eng', T_eng, 'Nm');
      logger.log('T_eng', T_eng, 'Nm');
      logger.log('T_wheel', T_wheel, 'Nm');
      logger.log('F_wheel_eng', F_wheel_eng, 'N');
      logger.log('F_wheel_max', F_wheel_max, 'N');
      logger.log('F_wheel', F_wheel, 'N');
      logger.log('tire_slip', tire_slip, '');
      logger.log('F_drag', F_drag, 'N');
      logger.log('F_net', F_net, 'N');
      logger.log('dv_dt', dv_dt, 'm/s/s');
      var point = logger.capturePoint();

      v += dv_dt * this.t_step;
      s += v * t_step + 0.5 * dv_dt * t_step * t_step;

      if (exitCond(this, point)) break;

      control.update(car, this);

      this.step++;
      this.t = this.step * this.t_step;

    } // end while loop

    logger.end();
  } // end run fn

  return this;
};

