LIST Food = Pizza, Pasta, Curry, Paella
LIST Currency = Pound, Euro, Dollar
LIST Numbers = One, Two, Three, Four, Five, Six, Seven
VAR all = ()
~ all = LIST_ALL(Food) + LIST_ALL(Currency)
{all}
{LIST_RANGE(all, 2, 3)}
{LIST_RANGE(LIST_ALL(Numbers), Two, Six)}
{LIST_RANGE((Pizza, Pasta), -1, 100)} // allow out of range
