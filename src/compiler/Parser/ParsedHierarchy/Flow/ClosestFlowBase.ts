// import { FlowBase } from './FlowBase';

export function ClosestFlowBase(obj: any): any | null {
  let ancestor = obj.parent;
  while (ancestor) {
    if (ancestor.hasOwnProperty("iamFlowbase") && ancestor.iamFlowbase()) {
      return ancestor as any;
    }

    ancestor = ancestor.parent;
  }

  return null;
}
