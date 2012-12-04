# A simple coroutine monad, and some functions

# values are either { result: a } or { output: o, cont: (i) -> value }
#
l = console.log

ret = (x) -> () -> result: x
#    res = result: x
#    l "Returning", res
#    res

yld = (x) -> () ->
            output: x
            cont: (i) -> () -> result: i

bind = (m,g) -> () ->
    #    l "Bind of m = ", m
    #    l "Bind of g = ", g
    res = m()
    # l "m() = ", res

    if res.result?
        # l "Is a result!"
        rt = do (res) -> g(res.result)()
        # l "Bind: had result, returning", rt
        rt
    else
        # l "Is a continuation!"
        rt =
            output: res.output
            cont: (i) -> bind(res.cont(i), g)
            # l "Bind: was contiunation, returning", rt
        rt


empty = (xs) -> xs.length == 0

head = (xs) -> xs[0]
tail = (xs) -> xs[1..]

forM = (xs,f) ->
    if empty xs
        ret []
    else
        bind (f(head(xs))), (a) ->
          bind forM(tail(xs),f), (as) ->
             ret([].concat([a],as))

# tests:
tests =
    [
        fun: (-> fun = forM [3..6], (x) -> ret (x * x))
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

for t in tests
    t.prop = t.prop or (x) -> x
    m = t.fun()()
    for x in [0..2]
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



