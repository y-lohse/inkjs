VAR val = 5
-> knot ->
-> END
== knot ==
~ inc(val)
{val}
->->
== function inc(ref x) ==
    ~ x = x + 1
