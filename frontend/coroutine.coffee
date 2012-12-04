# A simple coroutine monad, and some functions

# values are either { result: a } or { output: o, cont: (i) -> value }

ret = (x) -> () -> result: x

yld = (x) -> () ->
     output: x
     cont: (i) -> () -> result: i

bind = (m,g) -> () ->
    res = m()

    if res.result?
        g(res.result)()
    else
        output: res.output
        cont: (i) -> bind(res.cont(i), g)

forM = (xs,f) ->
    if _.isEmpty xs
        ret []
    else
        bind (f(_.head(xs))), (a) ->
          bind forM(_.tail(xs),f), (as) ->
             ret([].concat([a],as))

forM_ = (xs,f) ->
    if _.isEmpty xs
        ret {}
    else
        bind (f(_.head(xs))), (a) ->
          bind forM(_.tail(xs),f), (as) ->
             ret {}


# tests:

if false
    tests =
        [
            fun: (-> fun = forM [3..6], (x) -> ret (x * x))
            res: [9, 15, 25, 36]
        ,
            fun: (-> fun = forM [3..6], (x) -> yld (x * x))
            res: [9, 15, 25, 36]
        ,
            fun: (-> bind ret(1), (x) ->
                      bind ret(2*x), (y) ->
                       bind ret(3*y), (z) -> ret z)
            res: 6
        ,
            fun: (-> bind yld(1), (x) ->
                      bind yld(2*x), (y) ->
                       bind yld(3*y), (z) -> ret z)
            res: 6
        ,
            fun: (-> bind yld(2), ret)
            prop: ((x) -> x * x)
            res: 4
        ]

    l = console.log

    for t in tests
        t.prop = t.prop or (x) -> x
        m = t.fun()()
        for x in [0..10]
            l "M:", m
            if m.result?
                l "RESULT:", m.result, " EXPECTED: ", t.res
                break
            else if m.cont?
                l "OUTPUT:", m.output
                m = m.cont(t.prop(m.output))()
            else
                l "???:", m
                break
                m = m({suspended: true})

if window?
    window.co =
        ret: ret
        yld: yld
        bind: bind
        forM: forM
        forM_: forM_



