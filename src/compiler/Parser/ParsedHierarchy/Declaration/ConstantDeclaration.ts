import { Expression } from "../Expression/Expression";
import { ParsedObject } from "../Object";
import { InkObject as RuntimeObject } from "../../../../engine/Object";
import { Story } from "../Story";
import { SymbolType } from "../SymbolType";
import { Identifier } from "../Identifier";

export class ConstantDeclaration extends ParsedObject {
  get constantName(): string | undefined {
    return this.constantIdentifier?.name;
  }
  public constantIdentifier: Identifier;

  private _expression: Expression | null = null;

  get expression(): Expression {
    if (!this._expression) {
      throw new Error();
    }

    return this._expression;
  }

  constructor(name: Identifier, assignedExpression: Expression) {
    super();

    this.constantIdentifier = name;

    // Defensive programming in case parsing of assignedExpression failed
    if (assignedExpression) {
      this._expression = this.AddContent(assignedExpression) as Expression;
    }
  }

  get typeName(): string {
    return "CONST";
  }

  public readonly GenerateRuntimeObject = (): RuntimeObject | null => {
    // Global declarations don't generate actual procedural
    // runtime objects, but instead add a global variable to the story itself.
    // The story then initialises them all in one go at the start of the game.
    return null;
  };

  public ResolveReferences(context: Story) {
    super.ResolveReferences(context);
    context.CheckForNamingCollisions(
      this,
      this.constantIdentifier,
      SymbolType.Var
    );
  }
}
