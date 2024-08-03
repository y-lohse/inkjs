import { StringValue } from "./Value";
import { throwNullException } from "./NullException";
import { StringBuilder } from "./StringBuilder";
import { INamedContent } from "./INamedContent";
import { InkObject } from "./Object";
import { SearchResult } from "./SearchResult";
import { Path } from "./Path";
import { Debug } from "./Debug";
import { tryGetValueFromMap } from "./TryGetResult";
import { asINamedContentOrNull, asOrNull, asOrThrows } from "./TypeAssertion";

export class Container extends InkObject implements INamedContent {
  public name: string | null = null;

  public _content: InkObject[] = [];
  public namedContent: Map<string, INamedContent> = new Map();

  public visitsShouldBeCounted: boolean = false;
  public turnIndexShouldBeCounted: boolean = false;
  public countingAtStartOnly: boolean = false;

  public _pathToFirstLeafContent: Path | null = null;

  get hasValidName() {
    return this.name != null && this.name.length > 0;
  }
  get content() {
    return this._content;
  }
  set content(value: InkObject[]) {
    this.AddContent(value);
  }
  get namedOnlyContent() {
    let namedOnlyContentDict: Map<string, InkObject> | null = new Map();

    for (let [key, value] of this.namedContent) {
      let inkObject = asOrThrows(value, InkObject);
      namedOnlyContentDict.set(key, inkObject);
    }

    for (let c of this.content) {
      let named = asINamedContentOrNull(c);
      if (named != null && named.hasValidName) {
        namedOnlyContentDict.delete(named.name!);
      }
    }

    if (namedOnlyContentDict.size == 0) namedOnlyContentDict = null;

    return namedOnlyContentDict;
  }
  set namedOnlyContent(value: Map<string, InkObject> | null) {
    let existingNamedOnly = this.namedOnlyContent;
    if (existingNamedOnly != null) {
      for (let [key] of existingNamedOnly) {
        this.namedContent.delete(key);
      }
    }

    if (value == null) return;

    for (let [, val] of value) {
      let named = asINamedContentOrNull(val);
      if (named != null) this.AddToNamedContentOnly(named);
    }
  }
  get countFlags(): number {
    let flags: Container.CountFlags = 0;
    if (this.visitsShouldBeCounted) flags |= Container.CountFlags.Visits;
    if (this.turnIndexShouldBeCounted) flags |= Container.CountFlags.Turns;
    if (this.countingAtStartOnly) flags |= Container.CountFlags.CountStartOnly;

    if (flags == Container.CountFlags.CountStartOnly) {
      flags = 0;
    }

    return flags;
  }
  set countFlags(value: number) {
    let flag: Container.CountFlags = value;
    if ((flag & Container.CountFlags.Visits) > 0)
      this.visitsShouldBeCounted = true;
    if ((flag & Container.CountFlags.Turns) > 0)
      this.turnIndexShouldBeCounted = true;
    if ((flag & Container.CountFlags.CountStartOnly) > 0)
      this.countingAtStartOnly = true;
  }
  get pathToFirstLeafContent() {
    if (this._pathToFirstLeafContent == null)
      this._pathToFirstLeafContent = this.path.PathByAppendingPath(
        this.internalPathToFirstLeafContent
      );

    return this._pathToFirstLeafContent;
  }
  get internalPathToFirstLeafContent() {
    let components: Path.Component[] = [];
    let container: Container = this;
    while (container instanceof Container) {
      if (container.content.length > 0) {
        components.push(new Path.Component(0));
        container = container.content[0] as Container;
      }
    }
    return new Path(components);
  }

  public AddContent(contentObjOrList: InkObject | InkObject[]) {
    if (contentObjOrList instanceof Array) {
      let contentList = contentObjOrList as InkObject[];

      for (let c of contentList) {
        this.AddContent(c);
      }
    } else {
      let contentObj = contentObjOrList as InkObject;

      this._content.push(contentObj);

      if (contentObj.parent) {
        throw new Error("content is already in " + contentObj.parent);
      }

      contentObj.parent = this;

      this.TryAddNamedContent(contentObj);
    }
  }
  public TryAddNamedContent(contentObj: InkObject) {
    let namedContentObj = asINamedContentOrNull(contentObj);
    if (namedContentObj != null && namedContentObj.hasValidName) {
      this.AddToNamedContentOnly(namedContentObj);
    }
  }
  public AddToNamedContentOnly(namedContentObj: INamedContent) {
    Debug.AssertType(
      namedContentObj,
      InkObject,
      "Can only add Runtime.Objects to a Runtime.Container"
    );
    let runtimeObj = asOrThrows(namedContentObj, InkObject);
    runtimeObj.parent = this;

    if (namedContentObj.name === null)
      return throwNullException("namedContentObj.name");
    this.namedContent.set(namedContentObj.name!, namedContentObj);
  }
  public ContentAtPath(
    path: Path,
    partialPathStart: number = 0,
    partialPathLength: number = -1
  ) {
    if (partialPathLength == -1) partialPathLength = path.length;

    let result = new SearchResult();
    result.approximate = false;

    let currentContainer: Container | null = this;
    let currentObj: InkObject = this;

    for (let i = partialPathStart; i < partialPathLength; ++i) {
      let comp = path.GetComponent(i);
      if (currentContainer == null) {
        result.approximate = true;
        break;
      }

      let foundObj: InkObject | null =
        currentContainer.ContentWithPathComponent(comp);

      // Couldn't resolve entire path?
      if (foundObj == null) {
        result.approximate = true;
        break;
      }

      // Are we about to loop into another container?
      // Is the object a container as expected? It might
      // no longer be if the content has shuffled around, so what
      // was originally a container no longer is.
      const nextContainer: Container | null = asOrNull(foundObj, Container);
      if (i < partialPathLength - 1 && nextContainer == null) {
        result.approximate = true;
        break;
      }

      currentObj = foundObj;
      currentContainer = nextContainer;
    }

    result.obj = currentObj;

    return result;
  }
  public InsertContent(contentObj: InkObject, index: number) {
    this.content.splice(index, 0, contentObj);

    if (contentObj.parent) {
      throw new Error("content is already in " + contentObj.parent);
    }

    contentObj.parent = this;

    this.TryAddNamedContent(contentObj);
  }
  public AddContentsOfContainer(otherContainer: Container) {
    this.content.push(...otherContainer.content);

    for (let obj of otherContainer.content) {
      obj.parent = this;
      this.TryAddNamedContent(obj);
    }
  }
  public ContentWithPathComponent(component: Path.Component): InkObject | null {
    if (component.isIndex) {
      if (component.index >= 0 && component.index < this.content.length) {
        return this.content[component.index];
      } else {
        return null;
      }
    } else if (component.isParent) {
      return this.parent;
    } else {
      if (component.name === null) {
        return throwNullException("component.name");
      }
      let foundContent = tryGetValueFromMap(
        this.namedContent,
        component.name,
        null
      );
      if (foundContent.exists) {
        return asOrThrows(foundContent.result, InkObject);
      } else {
        return null;
      }
    }
  }
  public BuildStringOfHierarchy(): string;
  public BuildStringOfHierarchy(
    sb: StringBuilder,
    indentation: number,
    pointedObj: InkObject | null
  ): string;
  public BuildStringOfHierarchy() {
    let sb: StringBuilder;
    if (arguments.length == 0) {
      sb = new StringBuilder();
      this.BuildStringOfHierarchy(sb, 0, null);
      return sb.toString();
    }

    sb = arguments[0] as StringBuilder;
    let indentation = arguments[1] as number;
    let pointedObj = arguments[2] as InkObject | null;

    function appendIndentation() {
      const spacesPerIndent = 4; // Truly const in the original code
      for (let i = 0; i < spacesPerIndent * indentation; ++i) {
        sb.Append(" ");
      }
    }

    appendIndentation();
    sb.Append("[");

    if (this.hasValidName) {
      sb.AppendFormat(" ({0})", this.name);
    }

    if (this == pointedObj) {
      sb.Append("  <---");
    }

    sb.AppendLine();

    indentation++;

    for (let i = 0; i < this.content.length; ++i) {
      let obj = this.content[i];

      if (obj instanceof Container) {
        let container = obj as Container;

        container.BuildStringOfHierarchy(sb, indentation, pointedObj);
      } else {
        appendIndentation();
        if (obj instanceof StringValue) {
          sb.Append('"');
          sb.Append(obj.toString().replace("\n", "\\n"));
          sb.Append('"');
        } else {
          sb.Append(obj.toString());
        }
      }

      if (i != this.content.length - 1) {
        sb.Append(",");
      }

      if (!(obj instanceof Container) && obj == pointedObj) {
        sb.Append("  <---");
      }

      sb.AppendLine();
    }

    let onlyNamed: Map<string, INamedContent> = new Map();

    for (let [key, value] of this.namedContent) {
      if (this.content.indexOf(asOrThrows(value, InkObject)) >= 0) {
        continue;
      } else {
        onlyNamed.set(key, value);
      }
    }

    if (onlyNamed.size > 0) {
      appendIndentation();
      sb.AppendLine("-- named: --");

      for (let [, value] of onlyNamed) {
        Debug.AssertType(
          value,
          Container,
          "Can only print out named Containers"
        );
        let container = value as Container;
        container.BuildStringOfHierarchy(sb, indentation, pointedObj);
        sb.AppendLine();
      }
    }

    indentation--;

    appendIndentation();
    sb.Append("]");
  }
}

export namespace Container {
  export enum CountFlags {
    Start = 0,
    Visits = 1,
    Turns = 2,
    CountStartOnly = 4,
  }
}
