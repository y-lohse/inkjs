VAR knotCount = 0
VAR stitchCount = 0
-> gather_count_test ->
~ knotCount = 0
-> knot_count_test ->
~ knotCount = 0
-> knot_count_test ->
-> stitch_count_test ->
== gather_count_test ==
VAR gatherCount = 0
- (loop)
~ gatherCount++
{gatherCount} {loop}
{gatherCount<3:->loop}
->->
== knot_count_test ==
~ knotCount++
{knotCount} {knot_count_test}
{knotCount<3:->knot_count_test}
->->
== stitch_count_test ==
~ stitchCount = 0
-> stitch ->
~ stitchCount = 0
-> stitch ->
->->
= stitch
~ stitchCount++
{stitchCount} {stitch}
{stitchCount<3:->stitch}
->->
