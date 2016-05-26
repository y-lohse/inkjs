### Changes from reference implementation

- INamedInterface is not actually used. Whenever an object should implement it, it does so manually. Checking is done duck-typing-style.