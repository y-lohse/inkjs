import { Path } from "./Path";
import { Container } from "./Container";
import { Debug } from "./Debug";
import { asOrNull, asINamedContentOrNull } from "./TypeAssertion";
import { throwNullException } from "./NullException";
import { SearchResult } from "./SearchResult";
import { DebugMetadata } from "./DebugMetadata";

export class InkObject {
  public parent: InkObject | null = null;

  get debugMetadata(): DebugMetadata | null {
    if (this._debugMetadata === null) {
      if (this.parent) {
        return this.parent.debugMetadata;
      }
    }

    return this._debugMetadata;
  }

  set debugMetadata(value) {
    this._debugMetadata = value;
  }

  get ownDebugMetadata() {
    return this._debugMetadata;
  }

  private _debugMetadata: DebugMetadata | null = null;

  public DebugLineNumberOfPath(path: Path) {
    if (path === null) return null;

    // Try to get a line number from debug metadata
    let root = this.rootContentContainer;
    if (root) {
      let targetContent = root.ContentAtPath(path).obj;
      if (targetContent) {
        let dm = targetContent.debugMetadata;
        if (dm !== null) {
          return dm.startLineNumber;
        }
      }
    }

    return null;
  }

  get path() {
    if (this._path == null) {
      if (this.parent == null) {
        this._path = new Path();
      } else {
        let comps: Path.Component[] = [];

        let child: InkObject = this;
        let container = asOrNull(child.parent, Container);

        while (container !== null) {
          let namedChild = asINamedContentOrNull(child);
          if (namedChild != null && namedChild.hasValidName) {
            if (namedChild.name === null)
              return throwNullException("namedChild.name");
            comps.unshift(new Path.Component(namedChild.name!));
          } else {
            comps.unshift(new Path.Component(container.content.indexOf(child)));
          }

          child = container;
          container = asOrNull(container.parent, Container);
        }

        this._path = new Path(comps);
      }
    }

    return this._path;
  }
  private _path: Path | null = null;

  public ResolvePath(path: Path | null): SearchResult {
    if (path === null) return throwNullException("path");
    if (path.isRelative) {
      let nearestContainer = asOrNull(this, Container);

      if (nearestContainer === null) {
        Debug.Assert(
          this.parent !== null,
          "Can't resolve relative path because we don't have a parent"
        );
        nearestContainer = asOrNull(this.parent, Container);
        Debug.Assert(
          nearestContainer !== null,
          "Expected parent to be a container"
        );
        Debug.Assert(path.GetComponent(0).isParent);
        path = path.tail;
      }

      if (nearestContainer === null) {
        return throwNullException("nearestContainer");
      }
      return nearestContainer.ContentAtPath(path);
    } else {
      let contentContainer = this.rootContentContainer;
      if (contentContainer === null) {
        return throwNullException("contentContainer");
      }
      return contentContainer.ContentAtPath(path);
    }
  }

  public ConvertPathToRelative(globalPath: Path) {
    let ownPath = this.path;

    let minPathLength = Math.min(globalPath.length, ownPath.length);
    let lastSharedPathCompIndex = -1;

    for (let i = 0; i < minPathLength; ++i) {
      let ownComp = ownPath.GetComponent(i);
      let otherComp = globalPath.GetComponent(i);

      if (ownComp.Equals(otherComp)) {
        lastSharedPathCompIndex = i;
      } else {
        break;
      }
    }

    // No shared path components, so just use global path
    if (lastSharedPathCompIndex == -1) return globalPath;

    let numUpwardsMoves = ownPath.componentCount - 1 - lastSharedPathCompIndex;

    let newPathComps: Path.Component[] = [];

    for (let up = 0; up < numUpwardsMoves; ++up)
      newPathComps.push(Path.Component.ToParent());

    for (
      let down = lastSharedPathCompIndex + 1;
      down < globalPath.componentCount;
      ++down
    )
      newPathComps.push(globalPath.GetComponent(down));

    let relativePath = new Path(newPathComps, true);
    return relativePath;
  }

  public CompactPathString(otherPath: Path) {
    let globalPathStr = null;
    let relativePathStr = null;

    if (otherPath.isRelative) {
      relativePathStr = otherPath.componentsString;
      globalPathStr = this.path.PathByAppendingPath(otherPath).componentsString;
    } else {
      let relativePath = this.ConvertPathToRelative(otherPath);
      relativePathStr = relativePath.componentsString;
      globalPathStr = otherPath.componentsString;
    }

    if (relativePathStr.length < globalPathStr.length) return relativePathStr;
    else return globalPathStr;
  }

  get rootContentContainer() {
    let ancestor: InkObject = this;
    while (ancestor.parent) {
      ancestor = ancestor.parent;
    }
    return asOrNull(ancestor, Container);
  }

  public Copy(): InkObject {
    throw Error("Not Implemented: Doesn't support copying");
  }
  // SetChild works slightly diferently in the js implementation.
  // Since we can't pass an objets property by reference, we instead pass
  // the object and the property string.
  // TODO: This method can probably be rewritten with type-safety in mind.
  public SetChild(obj: any, prop: any, value: any) {
    if (obj[prop]) obj[prop] = null;

    obj[prop] = value;

    if (obj[prop]) obj[prop].parent = this;
  }

  public Equals(obj: any) {
    return obj === this;
  }
}
