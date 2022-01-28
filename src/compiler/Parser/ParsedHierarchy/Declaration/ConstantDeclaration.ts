import { Expression } from '../Expression/Expression';
import { ParsedObject } from '../Object';
import { InkObject as RuntimeObject } from '../../../../engine/Object';
import { Story } from '../Story';
import { SymbolType } from '../SymbolType';

export class ConstantDeclaration extends ParsedObject {
  private _expression: Expression | null = null;
  get expression(): Expression {
    if (!this._expression) {
      throw new Error();
    }

    return this._expression;
  }

  constructor(
    public readonly constantName: string,
    assignedExpression: Expression,
  ) {
    super();

    // Defensive programming in case parsing of assignedExpression failed
    if (assignedExpression) {
      this._expression = this.AddContent(assignedExpression) as Expression;
    }
  }

  public readonly GenerateRuntimeObject = (): RuntimeObject | null => {
    // Global declarations don't generate actual procedural
    // runtime objects, but instead add a global variable to the story itself.
    // The story then initialises them all in one go at the start of the game.
    return null;
  };

  public ResolveReferences = (context: Story) => {
    this.ResolveReferences(context);
    context.CheckForNamingCollisions(
      this,
      this.constantName,
      SymbolType.Var
    );
  };

  get typeName() {
    return 'Constant';
  }
}

