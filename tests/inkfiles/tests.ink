//inkjs test script
#global tag

Ouside content
#not a global tag




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

= divert_var
~ temp destination = -> divert_knot_target.divert_var_target
-> destination

= internal_stitch_target
Diverted to internal stitch
-> DONE

=== divert_knot_target
Diverted to a knot
-> DONE

= divert_stitch_target
Diverted to a stitch
-> DONE

= divert_var_target
Diverted with a variable
-> DONE



=== tags
#knot tag
-> DONE

= line_by_Line
A line of content #a tag
Another line of content #tag1 #tag2

#tag above
Content after a tag # tag after
#tag below
-> DONE

= choice
* a choice # a tag
-> DONE

= weird
// tags should be trimmed
# space around 
#//void
# //a space
#    //multiple spaces
#0
-> DONE





=== simple_lists
= sequence
{one|two|three|final}
-> DONE

= cycle
{&one|two|three}
-> DONE

= once
{!one|two|three}
-> DONE

= shuffle
{~heads|tails}
-> DONE

= blanks
{|||end}
-> DONE



=== choices
= basic_choice
* a choice
-> DONE
    
= multiple_choices
* choice 1
* choice 2
* choice 3
- -> DONE
    
= choice_text
* always [choice only]output only
-> DONE

= suppression
* choice 1
* choice 2
- -> DONE

= fallback
* choice 1
  -> DONE
* -> DONE

= sticky
* disapears
-> DONE
+ stays
-> DONE

= conditional
~ temp truthy = true
~ temp truthy2 = true
~ temp falsy = false
* no condition
* { truthy } available
* { falsy } not available
* { truthy } { truthy2 } multi condition available
* { truthy } { falsy } multi condition not available
- -> DONE





=== logic
= vardef
VAR stringvar = "Emilia"
VAR intvar = 521
VAR floatvar = 52.1
VAR divertvar = -> logic_divert_dest
variables defined: {stringconst} {intconst} {floatconst}
-> DONE

= logic_divert_dest
-> DONE

= math
~ temp a = 1 + 1
{a}
~ temp b = 1 - 1
{b}
~ temp c = 1 * 2
{c}
~ temp d = 10 / 2
{d}
~ temp e = 11 % 2
{e}
~ temp f = 1.2 + 3.4
{f}
-> DONE

= ifelse
{
    - intvar == 521:
        if text
    - else:
        else text
}
{
    - intvar < 521:
        if text
    - else:
        else text
}
{
    - intvar < 521:
        if text
    - intvar > 1:
        elseif text
    - else:
        else text
}
-> DONE

= stitch_param
-> stitch_with_param("param")
-> DONE

= stitch_with_param(what)
Called with {what}
-> DONE

= constants
CONST stringconst = "Emilia"
CONST intconst = 521
CONST floatconst = 52.1
constants defined: {stringconst} {intconst} {floatconst}
-> DONE

= simple_functions
{fn_with_return()}
{fn_print()}
{fn_calls_other()}
Function called inline and {fn_with_return()} something
-> DONE

= param_functions
VAR fnParamA = "a"
VAR fnParamB = "b"
{fn_params(fnParamA, fnParamB)}
{fn_params_ref(fnParamA, fnParamB)}
-> DONE

= void_function
{fn_without_return()}
-> DONE

=== function fn_with_return ===
~ return "returned"

=== function fn_without_return ===
~ temp a = 1

=== function fn_print ===
function called

=== function fn_params(a, b) ===
~ a = "was a"
~ b = "was b"
~return a

=== function fn_params_ref(ref a, ref b) ===
~ a = "was a"
~ b = "was b"
~return a

=== function fn_calls_other ===
~ return fn_called()

=== function fn_called ===
~ return "nested function called"



=== integration
= variable_observer
VAR observedVar1 = 1
VAR observedVar2 = 2
declared
~ observedVar1 = 3
mutated 1
~ observedVar1 = 4
~ observedVar2 = 5
mutated 2
-> DONE