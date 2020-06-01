VAR currentActor = "Bobby"

LIST listOfActors = P, A, S, C
VAR s = -> set_actor
-> start

===function set_actor(x)
{ x:
- P: ~ currentActor = "Philippe"
- A: ~ currentActor = "Andre"
- else: ~ currentActor = "Bobby"
}

=== start ===
{s(P)} Hey, my name is {currentActor}. What about yours?
{s(A)} I am {currentActor} and I need my rheumatism pills!
{s(P)} Would you like me, {currentActor}, to get some more for you?
-> END
