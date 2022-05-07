// TODO: Unify with Compiler.

export type ErrorHandler = (message: string, type: ErrorType) => void;

export enum ErrorType {
  Author,
  Warning,
  Error,
}
