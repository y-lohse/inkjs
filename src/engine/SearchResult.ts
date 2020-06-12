import { InkObject } from "./Object";
import { Container } from "./Container";

export class SearchResult {
  public obj: InkObject | null = null;
  public approximate: boolean = false;

  get correctObj() {
    return this.approximate ? null : this.obj;
  }

  get container() {
    return this.obj instanceof Container ? this.obj : null;
  }

  public copy() {
    let searchResult = new SearchResult();
    searchResult.obj = this.obj;
    searchResult.approximate = this.approximate;

    return searchResult;
  }
}
