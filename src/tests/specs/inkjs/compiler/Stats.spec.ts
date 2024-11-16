import { Stats } from "../../../../compiler/Stats";
import { Compiler } from "../../../../ink";

function getStats(inkSource: string): Stats {
  const compiler = new Compiler(inkSource);
  compiler.Compile();
  const stats = compiler.GenerateStats();
  expect(stats).not.toBeNull();
  return stats!;
}

describe("Stat Generation", () => {
  it("basic word count", () => {
    const stats = getStats("this is an ink story.");
    expect(stats.words).toBe(5);
  });
  it("word count doesn't include divert or variable names", () => {
    const stats = getStats(
      "VAR MyVariable = 3\n->start\n=== start\nthis is an ink story.\n->END"
    );
    expect(stats.words).toBe(5);
  });
  it("count functions, knots, and stitches", () => {
    const stats = getStats(
      "->start\n=== function myFunc()\n~ return 0\n=== start\n= stitch\nHello world!"
    );
    expect(stats.functions).toBe(1);
    expect(stats.knots).toBe(2);
    expect(stats.stitches).toBe(1);
  });
  it("count diverts", () => {
    const stats = getStats("->go\n- (go)\n->next\n-(next)");
    expect(stats.diverts).toBe(2);
  });
  it("end counts as a divert", () => {
    const stats = getStats("->go\n- (go)\n->next\n-(next)\n->END");
    expect(stats.diverts).toBe(3);
  });
  it("count gathers", () => {
    const stats = getStats("->go\n- (go)\n->next\n-(next)");
    expect(stats.gathers).toBe(2);
  });
});
