var constants = require('../../../constants');

module.exports = {
  // via http://www.golfmk5.com/forums/showthread.php?t=108200
  mass : 1336, // mass, kg
  mass_front_pct: 0.61,

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
    // via http://www.automobilemag.com/features/0712_2007_volkswagen_mkv_gti_2008_r32_comparison/photo_10.html
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
        rpm: 5000,
        lbft: 190
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
