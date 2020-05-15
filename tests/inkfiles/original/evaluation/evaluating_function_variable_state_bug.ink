Start
-> tunnel ->
End
-> END
== tunnel ==
In tunnel.
->->
=== function function_to_evaluate() ===
    { zero_equals_(1):
        ~ return "WRONG"
    - else:
        ~ return "RIGHT"
    }
=== function zero_equals_(k) ===
    ~ do_nothing(0)
    ~ return  (0 == k)
=== function do_nothing(k)
    ~ return 0
