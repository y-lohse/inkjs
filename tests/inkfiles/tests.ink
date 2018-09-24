//inkjs test script
#global tag

-> glue.diverted_glue

Ouside content
#not a global tag

EXTERNAL fn_ext(a, b, c)
EXTERNAL gameInc(x)

=== function fn_ext(a, b, c)
~ return a

=== function gameInc(x)
~ return x + 1

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
More <>-> diverted_glue_target

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

= casts
{intvar + 0.5}
{intvar + "hello"}
{floatvar:float var is truthy|is falsy and broken}
{floatvar + "hello"}
{stringvar:string var is truthy|is falsy and broken}
-> DONE

= logic_divert_dest
-> DONE

= math
//ints
~ temp int = 5
{1 + 1}
{1 - 1}
{-int}
{1 * 2}
{10 / 2}
{11 % 2}

{1 == 1:int truthy equal|broken}
{1 == 2:broken|int falsy equal}

{2 > 1:int truthy greater|broken}
{1 > 2:broken|int falsy greater}

{1 < 2:int truthy lesser|broken}
{2 < 1:broken|int falsy lesser}

{2 >= 1:int truthy greater or equal|broken}
{1 >= 2:broken|int falsy greater or equal}

{1 <= 2:int truthy lesser or equal|broken}
{2 <= 1:broken|int falsy lesser or equal}

{2 != 1:int truthy not equal|broken}
{1 != 1:broken|int falsy not equal}

~ temp one = 1
~ temp zero = 0
{
-!zero:int truthy not
- else:broken
}
{
-!one:broken
-int falsy not
}

{1 && 1:int truthy and|broken}
{1 && 0:broken|int falsy and}

{1 || 0:int truthy or|broken}
{0 || 0:broken|int falsy or}

//floats
~ temp float = 5.2
{1.3 + 1.3}
{1.3 - 1.3}
{-float}
{1.5 * 2.4}
{10.5 / 2.5}
{11.5 % 2.5}

{1.3 == 1.3:float truthy equal|broken}
{1.3 == 2.3:broken|float falsy equal}

{2.3 > 1.3:float truthy greater|broken}
{1.3 > 2.3:broken|float falsy greater}

{1.3 < 2.3:float truthy lesser|broken}
{2.3 < 1.3:broken|float falsy lesser}

{2.3 >= 1.3:float truthy greater or equal|broken}
{1.3 >= 2.3:broken|float falsy greater or equal}

{1.3 <= 2.3:float truthy lesser or equal|broken}
{2.3 <= 1.3:broken|float falsy lesser or equal}

{2.3 != 1.3:float truthy not equal|broken}
{1.3 != 1.3:broken|float falsy not equal}

~ temp onepointtwo = 1.2
{
-!onepointtwo:broken
-float falsy not
}

{1.3 && 1.3:float truthy and|broken}
{1.3 && 0:broken|float falsy and}

{1.3 || 0:float truthy or|broken}
{0 || 0:broken|float falsy or}

//strings
{"hello" == "hello":truthy string equal|broken}
{"hello" == "world":broken|falsy string equal}
{"hello" != "world":truthy string not equal|broken}
{"hello" != "hello":broken|falsy string not equal}

//divert
{->ifelse == ->ifelse:truthy divert equal|broken}
{->ifelse == ->stitch_param:broken|falsy divert equal}
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

= random
~ SEED_RANDOM(25)
{RANDOM(0, 100)}
{RANDOM(-50, 50)}
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

=== function fn_echo(a) ===
{a}
~ return a



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

= visit_count
visited
-> DONE

= external
{ fn_ext(1, 2, 3) }
{ fn_ext(1.1, 2.2, 3.3) }
{ fn_ext("a", "b", "c") }
{ fn_ext("a", 1, 2.2) }
-> DONE

== function topExternal(x)
In top external
~ return gameInc(x)

== function inkInc(x)
~ return x + 1


=== game_queries
= choicecount
* count {CHOICE_COUNT()}
-
* 1 choice
* count {CHOICE_COUNT()}
-
* 1 choice
* 2 choices
* count {CHOICE_COUNT()}
-
* 1 choice
* count {CHOICE_COUNT()}
* 2 choices
* count {CHOICE_COUNT()}
- -> DONE

= turnssince_before
{TURNS_SINCE(-> turnssince)}
-> turnssince

= turnssince
{TURNS_SINCE(-> turnssince)}
* [advance] -> turnssince_1

= turnssince_1
{TURNS_SINCE(-> turnssince)}
* [advance] -> turnssince_2

= turnssince_2
{TURNS_SINCE(-> turnssince)}
-> DONE


=== saveload
a bit of content
the next bit
-> DONE
= choicepoint
* choice 1
* choice 2
- -> DONE



=== flow_control
= tunnel
tunnel end
->->

= tunnel_call
-> tunnel -> DONE

= thread
thread start
<- threaded_text
<- threaded_choice_1
<- threaded_choice_2
thread end
-> DONE

= threaded_text
threaded text
-> DONE

= threaded_choice_1
* first threaded choice
-> DONE

= threaded_choice_2
* second threaded choice
-> DONE



=== lists
= basic_list
LIST kettleState = (cold), boiling, evaporated
{kettleState}
~ kettleState = boiling
{kettleState}
-> DONE

= increment
~ kettleState = cold
{kettleState}
~ kettleState++
{kettleState}
~ kettleState++
{kettleState}
~ kettleState--
{kettleState}
~ kettleState--
{kettleState}
-> DONE

= list_value
~ kettleState = cold
{LIST_VALUE(kettleState)}
~ kettleState++
{LIST_VALUE(kettleState)}
~ kettleState++
{LIST_VALUE(kettleState)}
-> DONE

= value_from_number
VAR kettleStateVar = cold
~ kettleStateVar = kettleState(1)
{kettleStateVar}
~ kettleStateVar = kettleState(2)
{kettleStateVar}
~ kettleStateVar = kettleState(3)
{kettleStateVar}
-> DONE

= defined_value
LIST primeNumbers = (two = 2), three, five = 5
{LIST_VALUE(primeNumbers)}
~ primeNumbers++
{LIST_VALUE(primeNumbers)}
~ primeNumbers++
{LIST_VALUE(primeNumbers)}
-> DONE

= multivalue
LIST DoctorsInSurgery = Adams, Bernard, Cartwright, Denver, Eamonn
{DoctorsInSurgery}
~ DoctorsInSurgery += (Eamonn, Denver)
{DoctorsInSurgery}
~ DoctorsInSurgery -= Eamonn
{DoctorsInSurgery}
~ DoctorsInSurgery = ()
{DoctorsInSurgery}
~ DoctorsInSurgery -= Eamonn
~ DoctorsInSurgery -= Eamonn
{DoctorsInSurgery}
~ DoctorsInSurgery += Eamonn
~ DoctorsInSurgery += Eamonn
{DoctorsInSurgery}
-> DONE

= listqueries
~ DoctorsInSurgery = ()
{DoctorsInSurgery:list is not empty |list is empty}
~ DoctorsInSurgery += (Eamonn, Denver)
{LIST_COUNT(DoctorsInSurgery)}
{LIST_MIN(DoctorsInSurgery)}
{LIST_MAX(DoctorsInSurgery)}
{DoctorsInSurgery:list is not empty|list is empty}
{ DoctorsInSurgery == (Eamonn, Denver):exact equality}
{ DoctorsInSurgery == (Eamonn):exact equality broken|falsy exact equality}
{ DoctorsInSurgery != (Eamonn):exact inequality}
{ DoctorsInSurgery != (Eamonn, Denver):exact inequality broken|exact inequality works}
{ DoctorsInSurgery has Eamonn:has Eamonn}
{ DoctorsInSurgery has Cartwright:has is broke |has falsy works}
{ DoctorsInSurgery !? (Eamonn, Cartwright):has not}
{ DoctorsInSurgery !? (Eamonn, Denver):has not broken|falsy has not}
{LIST_ALL(DoctorsInSurgery)}
~ DoctorsInSurgery = ()
{LIST_MAX(DoctorsInSurgery)}
{LIST_MIN(DoctorsInSurgery)}
~ DoctorsInSurgery = (Cartwright)

{DoctorsInSurgery > (Adams):truthy greater than}
{DoctorsInSurgery > (Eamonn):broken greater than|falsy greater than}
{DoctorsInSurgery > ():greater than empty}
{() > DoctorsInSurgery:broken empty greater than|empty greater than}

{DoctorsInSurgery < (Eamonn):truthy smaller than}
{DoctorsInSurgery < (Adams):broken smaller than|falsy smaller than}
{DoctorsInSurgery < ():broken smaller than empty|smaller than empty}
{() < DoctorsInSurgery:empty smaller than|broken empty smaller than}

{DoctorsInSurgery >= (Adams):truthy greater than or equal}
{DoctorsInSurgery >= (Cartwright):truthy greater than or equal}
{DoctorsInSurgery >= (Eamonn):broken greater than or equal|falsy greater than or equal}
{DoctorsInSurgery >= ():greater than or equals empty}
{() >= DoctorsInSurgery:broken empty greater than or equals|empty greater than or equals}

{DoctorsInSurgery <= (Eamonn):truthy smaller than or equal}
{DoctorsInSurgery <= (Cartwright):truthy smaller than or equal}
{DoctorsInSurgery <= (Adams):broken smaller than or equal|falsy smaller than or equal}
{DoctorsInSurgery <= ():broken smaller than  or equals empty|smaller than or equals empty}
{() <= DoctorsInSurgery:empty smaller than or equals|broken empty smaller than or equals}

{(Eamonn, Cartwright) && (Eamonn, Cartwright):truthy list AND|broken}
{(Eamonn, Cartwright) && ():broken|falsy list AND}
{(Eamonn, Cartwright) || (Eamonn, Cartwright):truthy list OR|broken}
{() || ():broken|falsy list OR}
{not ():truthy list not|broken}
{not (Eamonn):broken|falsy list not}

{LIST_RANGE(LIST_ALL(DoctorsInSurgery), Bernard, Denver)}

LIST GuardsOnDuty = (Smith), (Jones), Carter, Braithwaite
{GuardsOnDuty}
~ GuardsOnDuty = LIST_INVERT(GuardsOnDuty)
{GuardsOnDuty}

LIST CoreValues = strength, courage, compassion, greed, nepotism, self_belief, delusions_of_godhood
VAR desiredValues = (strength, courage, compassion, self_belief )
VAR actualValues =  ( greed, nepotism, self_belief, delusions_of_godhood )
{desiredValues ^ actualValues}
-> DONE
