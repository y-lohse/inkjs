-> start
=== start ===
    {beats(-> start)}
    {beats(-> start)}
    *   [Choice]  -> next
= next
    {beats(-> start)}
    -> END
=== function beats(x) ===
    ~ return TURNS_SINCE(x)
