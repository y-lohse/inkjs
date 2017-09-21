//inkjs test script

Ouside content




=== knot
Knot content
-> DONE

= stitch
Stitch content
-> DONE




=== content
= simple
Simple content inside a knot
-> DONE

= multiline
First line
Second line
-> DONE

= variable_text
~ temp VARIABLETEXT = "variable text"
{VARIABLETEXT}
-> DONE

= if_text_truthy
~ temp met_blofeld = true
I… {met_blofeld: I saw him. Only for a moment.}
-> DONE

= if_text_falsy
~ temp met_blofeld = false
I… {met_blofeld: I saw him. Only for a moment.}
-> DONE

= if_else_text
~ temp met_blofeld = true
{met_blofeld: I saw him. Only for a moment.|I missed him. Was he particularly evil?}
~ met_blofeld = false
{met_blofeld: I saw him. Only for a moment.|I missed him. Was he particularly evil?}
-> DONE




=== glue
= simple
Simple <>
glue
-> DONE

= diverted_glue
More <> -> diverted_glue_target

= diverted_glue_target
glue
-> DONE



=== divert
= divert_knot
-> divert_knot_target

= divert_stitch
-> divert_knot_target.divert_stitch_target

= internal_stitch
-> internal_stitch_target

= internal_stitch_target
Diverted to internal stitch
-> DONE

=== divert_knot_target
Diverted to a knot
-> DONE

= divert_stitch_target
Diverted to a stitch
-> DONE




