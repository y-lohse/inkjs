import { asOrNull, filterUndef } from "../../../engine/TypeAssertion";
import { FlowBase } from "./Flow/FlowBase";
import { FlowLevel } from "./Flow/FlowLevel";
import { Identifier } from "./Identifier";
import { ParsedObject } from "./Object";
import { Weave } from "./Weave";

export class Path {
  private _baseTargetLevel: FlowLevel | null;
  private components: Identifier[] | null;

  get baseTargetLevel() {
    if (this.baseLevelIsAmbiguous) {
      return FlowLevel.Story;
    }

    return this._baseTargetLevel;
  }

  get baseLevelIsAmbiguous(): boolean {
    return !this._baseTargetLevel;
  }

  get firstComponent(): string | null {
    if (this.components == null || !this.components.length) {
      return null;
    }

    return this.components[0].name;
  }

  get numberOfComponents(): number {
    return this.components ? this.components.length : 0;
  }

  private _dotSeparatedComponents: string | null = null;

  get dotSeparatedComponents(): string {
    if (this._dotSeparatedComponents == null) {
      this._dotSeparatedComponents = (this.components ? this.components : [])
        .map((c) => c.name)
        .filter(filterUndef)
        .join(".");
    }
    return this._dotSeparatedComponents;
  }

  constructor(
    argOne: FlowLevel | Identifier[] | Identifier,
    argTwo?: Identifier[]
  ) {
    if (Object.values(FlowLevel).includes(argOne as FlowLevel)) {
      this._baseTargetLevel = argOne as FlowLevel;
      this.components = argTwo || [];
    } else if (Array.isArray(argOne)) {
      this._baseTargetLevel = null;
      this.components = argOne || [];
    } else {
      this._baseTargetLevel = null;
      this.components = [argOne as Identifier];
    }
  }

  get typeName(): string {
    return "Path";
  }

  public readonly toString = (): string => {
    if (this.components === null || this.components.length === 0) {
      if (this.baseTargetLevel === FlowLevel.WeavePoint) {
        return "-> <next gather point>";
      }

      return "<invalid Path>";
    }

    return `-> ${this.dotSeparatedComponents}`;
  };

  public readonly ResolveFromContext = (
    context: ParsedObject
  ): ParsedObject | null => {
    if (this.components == null || this.components.length == 0) {
      return null;
    }

    // Find base target of path from current context. e.g.
    //   ==> BASE.sub.sub
    let baseTargetObject = this.ResolveBaseTarget(context);
    if (baseTargetObject === null) {
      return null;
    }

    // Given base of path, resolve final target by working deeper into hierarchy
    //  e.g. ==> base.mid.FINAL
    if (this.components.length > 1) {
      return this.ResolveTailComponents(baseTargetObject);
    }

    return baseTargetObject;
  };

  // Find the root object from the base, i.e. root from:
  //    root.sub1.sub2
  public readonly ResolveBaseTarget = (
    originalContext: ParsedObject
  ): ParsedObject | null => {
    const firstComp = this.firstComponent;

    // Work up the ancestry to find the node that has the named object
    let ancestorContext: ParsedObject | null = originalContext;
    while (ancestorContext) {
      // Only allow deep search when searching deeper from original context.
      // Don't allow search upward *then* downward, since that's searching *everywhere*!
      // Allowed examples:
      //  - From an inner gather of a stitch, you should search up to find a knot called 'x'
      //    at the root of a story, but not a stitch called 'x' in that knot.
      //  - However, from within a knot, you should be able to find a gather/choice
      //    anywhere called 'x'
      // (that latter example is quite loose, but we allow it)
      const deepSearch: boolean = ancestorContext === originalContext;

      const foundBase = this.GetChildFromContext(
        ancestorContext,
        firstComp,
        null,
        deepSearch
      );

      if (foundBase) {
        return foundBase;
      }

      ancestorContext = ancestorContext.parent;
    }

    return null;
  };

  // Find the final child from path given root, i.e.:
  //   root.sub.finalChild
  public readonly ResolveTailComponents = (
    rootTarget: ParsedObject
  ): ParsedObject | null => {
    let foundComponent: ParsedObject | null = rootTarget;

    if (!this.components) return null;

    for (let ii = 1; ii < this.components.length; ++ii) {
      const compName = this.components[ii].name;

      let minimumExpectedLevel: FlowLevel;
      let foundFlow = asOrNull(foundComponent, FlowBase);
      if (foundFlow !== null) {
        minimumExpectedLevel = (foundFlow.flowLevel + 1) as FlowLevel;
      } else {
        minimumExpectedLevel = FlowLevel.WeavePoint;
      }

      foundComponent = this.GetChildFromContext(
        foundComponent,
        compName,
        minimumExpectedLevel
      );

      if (foundComponent === null) {
        break;
      }
    }

    return foundComponent;
  };

  // See whether "context" contains a child with a given name at a given flow level
  // Can either be a named knot/stitch (a FlowBase) or a weave point within a Weave (Choice or Gather)
  // This function also ignores any other object types that are neither FlowBase nor Weave.
  // Called from both ResolveBase (force deep) and ResolveTail for the individual components.
  public readonly GetChildFromContext = (
    context: ParsedObject,
    childName: string | null,
    minimumLevel: FlowLevel | null,
    forceDeepSearch: boolean = false
  ): ParsedObject | null => {
    // null childLevel means that we don't know where to find it
    const ambiguousChildLevel: boolean = minimumLevel === null;

    // Search for WeavePoint within Weave
    const weaveContext = asOrNull(context, Weave);
    if (
      childName &&
      weaveContext !== null &&
      (ambiguousChildLevel || minimumLevel === FlowLevel.WeavePoint)
    ) {
      return weaveContext.WeavePointNamed(childName) as ParsedObject;
    }

    // Search for content within Flow (either a sub-Flow or a WeavePoint)
    let flowContext = asOrNull(context, FlowBase);
    if (childName && flowContext !== null) {
      // When searching within a Knot, allow a deep searches so that
      // named weave points (choices and gathers) can be found within any stitch
      // Otherwise, we just search within the immediate object.
      const shouldDeepSearch =
        forceDeepSearch || flowContext.flowLevel === FlowLevel.Knot;

      return flowContext.ContentWithNameAtLevel(
        childName,
        minimumLevel,
        shouldDeepSearch
      );
    }

    return null;
  };
}
