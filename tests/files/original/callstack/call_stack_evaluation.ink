    { six() + two() }
    -> END
=== function six
    ~ return four() + two()
=== function four
    ~ return two() + two()
=== function two
    ~ return 2

// RESULT: "8\n"
// Continue