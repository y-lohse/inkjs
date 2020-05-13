VAR globalVal = 5
{globalVal}
~ squaresquare(globalVal)
{globalVal}
== function squaresquare(ref x) ==
 {square(x)} {square(x)}
 ~ return
== function square(ref x) ==
 ~ x = x * x
 ~ return
