VAR to_one = -> one
VAR to_two = -> two
{to_one == to_two:same knot|different knot}
{to_one == to_one:same knot|different knot}
{to_two == to_two:same knot|different knot}
{ -> one == -> two:same knot|different knot}
{ -> one == to_one:same knot|different knot}
{ to_one == -> one:same knot|different knot}
== one
    One
    -> DONE
=== two
    Two
    -> DONE
