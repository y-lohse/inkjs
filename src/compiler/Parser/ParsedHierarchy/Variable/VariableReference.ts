import { Container as RuntimeContainer } from "../../../../engine/Container";
import { ContentList } from "../ContentList";
import { Expression } from "../Expression/Expression";
import { FlowBase } from "../Flow/FlowBase";
import { ParsedObject } from "../Object";
import { Path } from "../Path";
import { Story } from "../Story";
import { VariableReference as RuntimeVariableReference } from "../../../../engine/VariableReference";
import { Weave } from "../Weave";
import { Identifier } from "../Identifier";
import { asOrNull, filterUndef } from "../../../../engine/TypeAssertion";

export class VariableReference extends Expression {
  private _runtimeVarRef: RuntimeVariableReference | null = null;

  // - Normal variables have a single item in their "path"
  // - Knot/stitch names for read counts are actual dot-separated paths
  //   (though this isn't actually used at time of writing)
  // - List names are dot separated: listName.itemName (or just itemName)
  get name() {
    return this.path.join(".");
  }

  get path(): string[] {
    return this.pathIdentifiers.map((id) => id.name!).filter(filterUndef);
  }

  get identifier(): Identifier | null {
    if (!this.pathIdentifiers || this.pathIdentifiers.length == 0) {
      return null;
    }
    const name = this.path.join(".");
    const id = new Identifier(name);

    return id;
  }

  // Only known after GenerateIntoContainer has run
  public isConstantReference: boolean = false;
  public isListItemReference: boolean = false;

  get runtimeVarRef() {
    return this._runtimeVarRef;
  }

  constructor(public readonly pathIdentifiers: Identifier[]) {
    super();
  }

  get typeName(): string {
    return "ref";
  }

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer
  ): void => {
    let constantValue: Expression | null | undefined = this.story.constants.get(
      this.name
    );

    // If it's a constant reference, just generate the literal expression value
    // It's okay to access the constants at code generation time, since the
    // first thing the ExportRuntime function does it search for all the constants
    // in the story hierarchy, so they're all available.
    if (constantValue) {
      constantValue.GenerateConstantIntoContainer(container);
      this.isConstantReference = true;

      return;
    }

    this._runtimeVarRef = new RuntimeVariableReference(this.name);

    // List item reference?
    // Path might be to a list (listName.listItemName or just listItemName)
    if (this.path.length === 1 || this.path.length === 2) {
      let listItemName: string = "";
      let listName: string = "";

      if (this.path.length === 1) {
        listItemName = this.path[0];
      } else {
        listName = this.path[0];
        listItemName = this.path[1];
      }

      const listItem = this.story.ResolveListItem(listName, listItemName, this);

      if (listItem) {
        this.isListItemReference = true;
      }
    }

    container.AddContent(this._runtimeVarRef);
  };

  public ResolveReferences(context: Story): void {
    super.ResolveReferences(context);

    // Work is already done if it's a constant or list item reference
    if (this.isConstantReference || this.isListItemReference) {
      return;
    }

    // Is it a read count?
    const parsedPath = new Path(this.pathIdentifiers);
    const targetForCount: ParsedObject | null =
      parsedPath.ResolveFromContext(this);
    if (targetForCount) {
      if (!targetForCount.containerForCounting) {
        throw new Error();
      }

      targetForCount.containerForCounting.visitsShouldBeCounted = true;

      // If this is an argument to a function that wants a variable to be
      // passed by reference, then the Parsed.Divert will have generated a
      // Runtime.VariablePointerValue instead of allowing this object
      // to generate its RuntimeVariableReference. This only happens under
      // error condition since we shouldn't be passing a read count by
      // reference, but we don't want it to crash!
      if (this._runtimeVarRef === null) {
        return;
      }

      this._runtimeVarRef.pathForCount = targetForCount.runtimePath;
      this._runtimeVarRef.name = null;

      // Check for very specific writer error: getting read count and
      // printing it as content rather than as a piece of logic
      // e.g. Writing {myFunc} instead of {myFunc()}
      let targetFlow = asOrNull(targetForCount, FlowBase);
      if (targetFlow && targetFlow.isFunction) {
        // Is parent context content rather than logic?
        if (
          this.parent instanceof Weave ||
          this.parent instanceof ContentList ||
          this.parent instanceof FlowBase
        ) {
          this.Warning(
            `'${targetFlow.identifier}' being used as read count rather than being called as function. Perhaps you intended to write ${targetFlow.identifier}()`
          );
        }
      }

      return;
    }

    // Couldn't find this multi-part path at all, whether as a divert
    // target or as a list item reference.
    if (this.path.length > 1) {
      let errorMsg = `Could not find target for read count: ${parsedPath}`;
      if (this.path.length <= 2) {
        errorMsg += `, or couldn't find list item with the name ${this.path.join(
          ","
        )}`;
      }

      this.Error(errorMsg);

      return;
    }

    if (!context.ResolveVariableWithName(this.name, this).found) {
      this.Error(`Unresolved variable: ${this.name}`, this);
    }
  }

  public readonly toString = (): string => `{${this.path.join(".")}}`;
}
