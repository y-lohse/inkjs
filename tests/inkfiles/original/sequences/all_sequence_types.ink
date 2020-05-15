~ SEED_RANDOM(1)

Once: {f_once()} {f_once()} {f_once()} {f_once()}
Stopping: {f_stopping()} {f_stopping()} {f_stopping()} {f_stopping()}
Default: {f_default()} {f_default()} {f_default()} {f_default()}
Cycle: {f_cycle()} {f_cycle()} {f_cycle()} {f_cycle()}
Shuffle: {f_shuffle()} {f_shuffle()} {f_shuffle()} {f_shuffle()}
Shuffle stopping: {f_shuffle_stopping()} {f_shuffle_stopping()} {f_shuffle_stopping()} {f_shuffle_stopping()}
Shuffle once: {f_shuffle_once()} {f_shuffle_once()} {f_shuffle_once()} {f_shuffle_once()}

== function f_once ==
{once:
    - one
    - two
}

== function f_stopping ==
{stopping:
    - one
    - two
}

== function f_default ==
{one|two}

== function f_cycle ==
{cycle:
    - one
    - two
}

== function f_shuffle ==
{shuffle:
    - one
    - two
}

== function f_shuffle_stopping ==
{stopping shuffle:
    - one
    - two
    - final
}

== function f_shuffle_once ==
{shuffle once:
    - one
    - two
}
