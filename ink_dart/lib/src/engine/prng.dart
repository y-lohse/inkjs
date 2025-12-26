/// Pseudo-random number generator with deterministic seeding.
///
/// Used for RANDOM() function in Ink to ensure reproducible
/// story progression with the same seed.
class PRNG {
  int _seed;

  PRNG(this._seed);

  /// Generate next random number.
  int next() {
    // Simple LCG implementation matching inkjs
    _seed = ((_seed * 1103515245) + 12345) & 0x7fffffff;
    return _seed;
  }
}
