var constants = require('./constants');
var logger = require('./lib/logger');


var summary = {};

module.exports = function(car, control) {
  logger.setCar(car);
  logger.setSim(this);
  logger.setCSVFile('test.csv');

  this.s = 0; // distance, meters
  this.v = 0; // velocity, m/s
  this.launchRPM = 3000;

  this.t_step = 0.001; // seconds
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

      var dE_power_eng = car.engine.getPower() *
        (1 - car.transmission.parasitic_loss) * t_step;

      // TODO: subtract out energy going to rotations
      // http://hyperphysics.phy-astr.gsu.edu/hbase/icyl.html

      // we lower the available power here because some will go to rotational
      // energy in the wheels

      var adj_mass = car.mass
              + car.I_R_2_wheels // wheels
              // flywheel
              + (car.mass_flywheel * car.rad_fw*car.rad_fw *
                car.transmission.getRatio() * car.transmission.getRatio() /
                (2.0 * car.wheel_rad * car.wheel_rad));
      var F_wheel_power = (dE_power_eng * car.mass / adj_mass)/ t_step / v;
      var tire_slip = F_wheel_max < F_wheel_power;
      if (tire_slip && v > 0) {
        dE_power_eng = dE_power_eng * F_wheel_max / F_wheel_power;
      }

      var dE_drag = F_drag * v * t_step;
      var dE_power = dE_power_eng - dE_drag;
      var dv_power = Math.sqrt(v * v + 2.0 / adj_mass * dE_power) - v;


      logger.log('T_eng', T_eng, 'Nm');
      logger.log('T_eng', T_eng, 'Nm');
      logger.log('T_wheel', T_wheel, 'Nm');
      logger.log('F_wheel_eng', F_wheel_eng, 'N');
      logger.log('F_wheel_pw', F_wheel_power, 'N');
      logger.log('F_wheel_max', F_wheel_max, 'N');
      logger.log('F_wheel', F_wheel, 'N');
      logger.log('tire_slip', tire_slip, '');
      logger.log('F_drag', F_drag, 'N');
      logger.log('F_net', F_net, 'N');
      logger.log('dv_power', dv_power * 100000, 'm/s e-05');
      logger.log('dv_F', F_net / car.mass * t_step * 100000, 'm/s e-05');
      logger.log('E', 0.5 * car.mass*v*v, 'Nm');
      var point = logger.capturePoint();

      // s = v * t + 1/2 * a * t^2
      s += v * t_step + 0.5 * dv_power * t_step;
      v += dv_power;

      if (exitCond(this, point)) break;

      control.update(car, this);

      this.step++;
      this.t = this.step * this.t_step;

    } // end while loop

    logger.end();
  } // end run fn

  return this;
};

