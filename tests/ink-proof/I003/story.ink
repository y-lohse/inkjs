// For license see https://github.com/inkle/ink-library/blob/master/LICENSE
// This is a simple example of tunnel usage to either continue the story or redirect the flow to a death knot.

VAR hp = 2
LIST deaths = beaten, drown

-> main

=== function is_alive ===
// Condition can be more complex here
~ return hp > 0

=== get_hit(x) ===
~ hp = hp - x
{ is_alive():
    // Everything is alright, continue the story
    ->->
}
// Everything is horribly wrong, redirect the flow to the death knot
-> death(beaten)

=== death(reason) ===
{
- reason ? beaten:
You've been beaten to death.
- reason ? drown:
Sadly you've drown in the water.
- else:
Sorry, you're dead
}
-> END

=== main ===
Should you cross the river?
*   [Yes]
    You enter the river but the stream is stronger than you thought.
    -> death(drown)
*   [No]
    You follow the path along the river for some time and finally encounter a huge man with a wooden stick.
    As you start talking to him, he beats you with his weapon.
    -> get_hit(1) ->
    **  [Fight back]
        You can hit the man once before he throws you a punch.
        -> get_hit(RANDOM(0, 2)) ->
        You manage to block his fist and finally push him into the river.
        After this legendary fight, you continue your journey and never look back.
    **  [Flee]
        You desperately run for your life and never look back.
    - -> END
