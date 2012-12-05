// Generated by CoffeeScript 1.4.0
(function() {
  var bind, forM, l, m, ret, t, tests, x, yld, _i, _j, _len;

  ret = function(x) {
    return function() {
      return {
        result: x
      };
    };
  };

  yld = function(x) {
    return function() {
      return {
        output: x,
        cont: function(i) {
          return function() {
            return {
              result: i
            };
          };
        }
      };
    };
  };

  bind = function(m, g) {
    return function() {
      var res;
      res = m();
      if (res.result != null) {
        return g(res.result)();
      } else {
        return {
          output: res.output,
          cont: function(i) {
            return bind(res.cont(i), g);
          }
        };
      }
    };
  };

  forM = function(xs, f) {
    if (_.isEmpty(xs)) {
      return ret([]);
    } else {
      return bind(f(_.head(xs)), function(a) {
        return bind(forM(_.tail(xs), f), function(as) {
          return ret([].concat([a], as));
        });
      });
    }
  };

  if (false) {
    tests = [
      {
        fun: (function() {
          var fun;
          return fun = forM([3, 4, 5, 6], function(x) {
            return ret(x * x);
          });
        }),
        res: [9, 15, 25, 36]
      }, {
        fun: (function() {
          var fun;
          return fun = forM([3, 4, 5, 6], function(x) {
            return yld(x * x);
          });
        }),
        res: [9, 15, 25, 36]
      }, {
        fun: (function() {
          return bind(ret(1), function(x) {
            return bind(ret(2 * x), function(y) {
              return bind(ret(3 * y), function(z) {
                return ret(z);
              });
            });
          });
        }),
        res: 6
      }, {
        fun: (function() {
          return bind(yld(1), function(x) {
            return bind(yld(2 * x), function(y) {
              return bind(yld(3 * y), function(z) {
                return ret(z);
              });
            });
          });
        }),
        res: 6
      }, {
        fun: (function() {
          return bind(yld(2), ret);
        }),
        prop: (function(x) {
          return x * x;
        }),
        res: 4
      }
    ];
    l = console.log;
    for (_i = 0, _len = tests.length; _i < _len; _i++) {
      t = tests[_i];
      t.prop = t.prop || function(x) {
        return x;
      };
      m = t.fun()();
      for (x = _j = 0; _j <= 10; x = ++_j) {
        l("M:", m);
        if (m.result != null) {
          l("RESULT:", m.result, " EXPECTED: ", t.res);
          break;
        } else if (m.cont != null) {
          l("OUTPUT:", m.output);
          m = m.cont(t.prop(m.output))();
        } else {
          l("???:", m);
          break;
          m = m({
            suspended: true
          });
        }
      }
    }
  }

  if (typeof window !== "undefined" && window !== null) {
    window.co = {
      ret: ret,
      yld: yld,
      bind: bind,
      forM: forM
    };
  }

}).call(this);