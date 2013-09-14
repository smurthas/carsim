var constants = require('../../../constants');

module.exports = {
  // via http://www.golfmk5.com/forums/showthread.php?t=108200
  mass : 1336, // mass, kg
  mass_front_pct: 0.61,

  // via http://hyperphysics.phy-astr.gsu.edu/hbase/icyl.html, with
  // a = 0.2 m, b = 0.3m, M = 20 kg --> I_wheel = 0.5, I_sum = 2
  I_R_2_wheels: 50, // kg*m^2/m^2 --> kg, can be summed with mass in energy eq

  // via http://www.golfmk6.com/forums/showthread.php?t=4088 +
  // http://www.8thcivic.com/forums/wheel-tire-upgrades/160112-tire-weight-225-45-17-toyo-proxes-4-a.html
  // assuming wheels = 24 lbs, tires = 23 lbs
  mass_wheel_and_tires: 21, // kg
  mass_flywheel: 9, // kg
  rad_fw: 0.114, // meters

  // via http://en.wikipedia.org/wiki/Automobile_drag_coefficient
  C_d : 0.32, // coefficient of drag
  // via http://www.golfmkv.com/forums/showthread.php?t=163575
  A : 2.230, // m^2

  //via http://www.tirerack.com/tires/SelectTireSize.jsp?autoMake=Volkswagen&autoModel=GTI&autoYear=2007&autoModClar=4-Door
  //   rim dia " --> cm --> radius +  225/45s     --> meters
  wheel_rad : ((17 * 2.54 / 2) + (22.5 * 0.45)) / 100, // m

  tires: {
    // estimate based on 60-0 braking of 119 ft
    mu: 1.02
  },

  transmission: {
    parasitic_loss : 0.15,
    // http://paultan.org/2006/06/26/vw-phases-out-automatics-makes-way-for-dsg/
    shift_time: 0.008,
    gear: 1,
    shiftUp: function() {
      if (this.gear < this.ratios.length - 1) this.gear++;
      return this.gear;
    },

    // via http://www.golfmk6.com/forums/showthread.php?t=9860
    ratios: [
      13.2384,
      8.2346,
      5.7918,
      4.334,
      3.4299,
     2.8737
    ],

    getRatio: function(forGear) {
      if (!forGear) forGear = this.gear;
      var ratio = this.ratios[forGear - 1];
      return ratio;
    },
    getTorque: function(torqueIn) {
      return this.getRatio() * torqueIn * (1 - this.parasitic_loss);
    }
  },


  engine: {
    // via
    // http://image.automobilemag.com/f/features/8046712+w799+h499+cr1+ar0/0712_09_z%2B2007_volkswagen_gti%2Btorque_curves.jpg
    torqueCurve : [
      {
        rpm: 1400,
        lbft: 30
      },
      {
        rpm: 1600,
        lbft: 100,
      },
      {
        rpm: 2500,
        lbft: 210
      },
      {
        rpm: 3200,
        lbft: 209
      },
      {
        rpm: 4000,
        lbft: 200
      },
      {
        rpm: 5000,
        lbft: 190
      },
      {
        rpm: 5500,
        lbft: 180
      },
      {
        rpm: 6000,
        lbft: 163
      },
      {
        rpm: 6250,
        lbft: 150
      },
      {
        rpm: 6400,
        lbft: 145
      },
      {
        rpm: 6500,
        lbft: 65
      }
    ],
    rpm: 0,
    getPower: function(_rpm) {
      return this.getTorque(_rpm) * this.rpm /60 * 2 * constants.PI;
    },
    getTorque : function(_rpm) {
      if (!_rpm) _rpm = this.rpm;
      var iAbove = -1;
      for (var i in this.torqueCurve) {
        if (this.torqueCurve[i].rpm > _rpm) {
          iAbove = parseInt(i) - 1;
          break;
        }
      }

      var lbft;
      if (iAbove === 0) {
        lbft = this.torqueCurve[0].lbft;
      } else if (iAbove === - 1) {
        lbft = 0;
      } else {
        // linear interp
        var u = this.torqueCurve[iAbove+1];
        var l = this.torqueCurve[iAbove];
        var dT_dN = (u.lbft - l.lbft) / (u.rpm  - l.rpm);

        lbft = l.lbft + (dT_dN * (_rpm - l.rpm));
      }

      return constants.NM_PER_LBFT * lbft;
    }
  }
};
