VAR a_divert_variable = -> a_divert

{ (a_divert_variable == -> a_divert) + 0 }
{ (a_divert_variable != -> a_divert) + 0 }

{ (a_divert_variable == -> another_divert) + 0 }
{ (a_divert_variable != -> another_divert) + 0 }

=== a_divert ===
    with some content
    -> DONE

=== another_divert ===
    with some other content
    -> DONE
