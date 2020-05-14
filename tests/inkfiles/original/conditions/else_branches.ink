VAR x = 3
{
    - x == 1: one
    - x == 2: two
    - else: other
}
{
    - x == 1: one
    - x == 2: two
    - other
}
{ x == 4:
  - The main clause
  - else: other
}
{ x == 4:
  The main clause
- else:
  other
}
