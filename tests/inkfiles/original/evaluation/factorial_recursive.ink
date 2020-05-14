{ factorial(5) }
== function factorial(n) ==
 { n == 1:
    ~ return 1
 - else:
    ~ return (n * factorial(n-1))
 }
