(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.inkjs = {})));
}(this, (function (exports) { 'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  var possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  var slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  var Path = function () {
      function Path() {
          classCallCheck(this, Path);

          this._components = [];
          this._componentsString = null;
          this._isRelative = false;
          if (typeof arguments[0] == 'string') {
              var componentsString = arguments[0];
              this.componentsString = componentsString;
          } else if (arguments[0] instanceof Path.Component && arguments[1] instanceof Path) {
              var head = arguments[0];
              var tail = arguments[1];
              this._components.push(head);
              this._components = this._components.concat(tail._components);
          } else if (arguments[0] instanceof Array) {
              var _head = arguments[0];
              var relative = !!arguments[1];
              this._components = this._components.concat(_head);
              this._isRelative = relative;
          }
      }

      createClass(Path, [{
          key: 'GetComponent',
          value: function GetComponent(index) {
              return this._components[index];
          }
      }, {
          key: 'PathByAppendingPath',
          value: function PathByAppendingPath(pathToAppend) {
              var p = new Path();
              var upwardMoves = 0;
              for (var i = 0; i < pathToAppend._components.length; ++i) {
                  if (pathToAppend._components[i].isParent) {
                      upwardMoves++;
                  } else {
                      break;
                  }
              }
              for (var _i = 0; _i < this._components.length - upwardMoves; ++_i) {
                  p._components.push(this._components[_i]);
              }
              for (var _i2 = upwardMoves; _i2 < pathToAppend._components.length; ++_i2) {
                  p._components.push(pathToAppend._components[_i2]);
              }
              return p;
          }
      }, {
          key: 'toString',
          value: function toString() {
              return this.componentsString;
          }
      }, {
          key: 'Equals',
          value: function Equals(otherPath) {
              if (otherPath == null) return false;
              if (otherPath._components.length != this._components.length) return false;
              if (otherPath.isRelative != this.isRelative) return false;
              // the original code uses SequenceEqual here, so we need to iterate over the components manually.
              for (var i = 0, l = otherPath._components.length; i < l; i++) {
                  // it's not quite clear whether this test should use Equals or a simple == operator,
                  // see https://github.com/y-lohse/inkjs/issues/22
                  if (!otherPath._components[i].Equals(this._components[i])) return false;
              }
              return true;
          }
      }, {
          key: 'PathByAppendingComponent',
          value: function PathByAppendingComponent(c) {
              var p = new Path();
              p._components.push.apply(p._components, this._components);
              p._components.push(c);
              return p;
          }
      }, {
          key: 'isRelative',
          get: function get$$1() {
              return this._isRelative;
          }
      }, {
          key: 'componentCount',
          get: function get$$1() {
              return this._components.length;
          }
      }, {
          key: 'head',
          get: function get$$1() {
              if (this._components.length > 0) {
                  return this._components[0];
              } else {
                  return null;
              }
          }
      }, {
          key: 'tail',
          get: function get$$1() {
              if (this._components.length >= 2) {
                  // careful, the original code uses length-1 here. This is because the second argument of
                  // List.GetRange is a number of elements to extract, wherease Array.slice uses an index
                  var tailComps = this._components.slice(1, this._components.length);
                  return new Path(tailComps);
              } else {
                  return Path.self;
              }
          }
      }, {
          key: 'length',
          get: function get$$1() {
              return this._components.length;
          }
      }, {
          key: 'lastComponent',
          get: function get$$1() {
              var lastComponentIdx = this._components.length - 1;
              if (lastComponentIdx >= 0) {
                  return this._components[lastComponentIdx];
              } else {
                  return null;
              }
          }
      }, {
          key: 'containsNamedComponent',
          get: function get$$1() {
              for (var i = 0, l = this._components.length; i < l; i++) {
                  if (!this._components[i].isIndex) {
                      return true;
                  }
              }
              return false;
          }
      }, {
          key: 'componentsString',
          get: function get$$1() {
              if (this._componentsString == null) {
                  this._componentsString = this._components.join('.');
                  if (this.isRelative) this._componentsString = '.' + this._componentsString;
              }
              return this._componentsString;
          },
          set: function set$$1(value) {
              this._components.length = 0;
              this._componentsString = value;
              if (this._componentsString == null || this._componentsString == '') return;
              if (this._componentsString[0] == '.') {
                  this._isRelative = true;
                  this._componentsString = this._componentsString.substring(1);
              }
              var componentStrings = this._componentsString.split('.');
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = componentStrings[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var str = _step.value;

                      // we need to distinguish between named components that start with a number, eg "42somewhere", and indexed components
                      // the normal parseInt won't do for the detection because it's too relaxed.
                      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt
                      if (/^(\-|\+)?([0-9]+|Infinity)$/.test(str)) {
                          this._components.push(new Path.Component(parseInt(str)));
                      } else {
                          this._components.push(new Path.Component(str));
                      }
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }
          }
      }], [{
          key: 'self',
          get: function get$$1() {
              var path = new Path();
              path._isRelative = true;
              return path;
          }
      }]);
      return Path;
  }();
  Path.parentId = '^';
  (function (Path) {
      var Component = function () {
          function Component(indexOrName) {
              classCallCheck(this, Component);

              this.index = -1;
              this.name = null;
              if (typeof indexOrName == 'string') {
                  this.name = indexOrName;
              } else {
                  this.index = indexOrName;
              }
          }

          createClass(Component, [{
              key: 'toString',
              value: function toString() {
                  if (this.isIndex) {
                      return this.index.toString();
                  } else {
                      return this.name;
                  }
              }
          }, {
              key: 'Equals',
              value: function Equals(otherComp) {
                  if (otherComp != null && otherComp.isIndex == this.isIndex) {
                      if (this.isIndex) {
                          return this.index == otherComp.index;
                      } else {
                          return this.name == otherComp.name;
                      }
                  }
                  return false;
              }
          }, {
              key: 'isIndex',
              get: function get$$1() {
                  return this.index >= 0;
              }
          }, {
              key: 'isParent',
              get: function get$$1() {
                  return this.name == Path.parentId;
              }
          }], [{
              key: 'ToParent',
              value: function ToParent() {
                  return new Component(Path.parentId);
              }
          }]);
          return Component;
      }();

      Path.Component = Component;
  })(Path || (Path = {}));

  var Debug;
  (function (Debug) {
      // tslint:disable no-string-throw
      function AssertType(variable, type, message) {
          Assert(variable instanceof type, message);
      }
      Debug.AssertType = AssertType;
      function Assert(condition, message) {
          if (!condition) {
              // tslint:disable:no-console
              if (typeof message !== 'undefined') {
                  console.warn(message);
              }
              if (console.trace) {
                  console.trace();
              }
              throw '';
          }
      }
      Debug.Assert = Assert;
  })(Debug || (Debug = {}));

  // tslint:disable ban-types
  function asOrNull(obj, type) {
      if (obj instanceof type) {
          return unsafeTypeAssertion(obj, type);
      } else {
          return null;
      }
  }
  function asOrThrows(obj, type) {
      if (obj instanceof type) {
          return unsafeTypeAssertion(obj, type);
      } else {
          throw new Error(obj + ' is not of type ' + type);
      }
  }
  function asNumberOrThrows(obj) {
      if (typeof obj === 'number') {
          return obj;
      } else {
          throw new Error(obj + ' is not a number');
      }
  }
  // So here, in the reference implementation, contentObj is casted to an INamedContent
  // but here we use js-style duck typing: if it implements the same props as the interface,
  // we treat it as valid.
  function asINamedContentOrNull(obj) {
      if (obj.hasValidName && obj.name) {
          return obj;
      }
      return null;
  }
  function nullIfUndefined(obj) {
      if (typeof obj === 'undefined') {
          return null;
      }
      return obj;
  }
  function unsafeTypeAssertion(obj, type) {
      return obj;
  }

  /**
   * In the original C# code, a SystemException would be thrown when passing
   * null to methods expected a valid instance. Javascript has no such
   * concept, but TypeScript will not allow `null` to be passed to methods
   * explicitely requiring a valid type.
   *
   * Whenever TypeScript complain about the possibility of a `null` value,
   * check the offending value and it it's null, throw this exception using
   * `throwNullException(name: string)`.
   */
  var NullException = function (_Error) {
    inherits(NullException, _Error);

    function NullException() {
      classCallCheck(this, NullException);
      return possibleConstructorReturn(this, (NullException.__proto__ || Object.getPrototypeOf(NullException)).apply(this, arguments));
    }

    return NullException;
  }(Error);
  /**
   * Throw a NullException.
   * @param name a short description of the offending value (often its name within the code).
   */
  function throwNullException(name) {
    throw new NullException(name + " is null or undefined");
  }

  var InkObject = function () {
      function InkObject() {
          classCallCheck(this, InkObject);

          this.parent = null;
          this._debugMetadata = null;
          this._path = null;
      }

      createClass(InkObject, [{
          key: 'DebugLineNumberOfPath',
          value: function DebugLineNumberOfPath(path) {
              if (path === null) return null;
              // Try to get a line number from debug metadata
              var root = this.rootContentContainer;
              if (root) {
                  var targetContent = root.ContentAtPath(path).obj;
                  if (targetContent) {
                      var dm = targetContent.debugMetadata;
                      if (dm !== null) {
                          return dm.startLineNumber;
                      }
                  }
              }
              return null;
          }
      }, {
          key: 'ResolvePath',
          value: function ResolvePath(path) {
              if (path === null) return throwNullException('path');
              if (path.isRelative) {
                  var nearestContainer = asOrNull(this, Container);
                  if (nearestContainer === null) {
                      Debug.Assert(this.parent !== null, "Can't resolve relative path because we don't have a parent");
                      nearestContainer = asOrNull(this.parent, Container);
                      Debug.Assert(nearestContainer !== null, 'Expected parent to be a container');
                      Debug.Assert(path.GetComponent(0).isParent);
                      path = path.tail;
                  }
                  if (nearestContainer === null) {
                      return throwNullException('nearestContainer');
                  }
                  return nearestContainer.ContentAtPath(path);
              } else {
                  var contentContainer = this.rootContentContainer;
                  if (contentContainer === null) {
                      return throwNullException('contentContainer');
                  }
                  return contentContainer.ContentAtPath(path);
              }
          }
      }, {
          key: 'ConvertPathToRelative',
          value: function ConvertPathToRelative(globalPath) {
              var ownPath = this.path;
              var minPathLength = Math.min(globalPath.length, ownPath.length);
              var lastSharedPathCompIndex = -1;
              for (var i = 0; i < minPathLength; ++i) {
                  var ownComp = ownPath.GetComponent(i);
                  var otherComp = globalPath.GetComponent(i);
                  if (ownComp.Equals(otherComp)) {
                      lastSharedPathCompIndex = i;
                  } else {
                      break;
                  }
              }
              // No shared path components, so just use global path
              if (lastSharedPathCompIndex == -1) return globalPath;
              var numUpwardsMoves = ownPath.componentCount - 1 - lastSharedPathCompIndex;
              var newPathComps = [];
              for (var up = 0; up < numUpwardsMoves; ++up) {
                  newPathComps.push(Path.Component.ToParent());
              }for (var down = lastSharedPathCompIndex + 1; down < globalPath.componentCount; ++down) {
                  newPathComps.push(globalPath.GetComponent(down));
              }var relativePath = new Path(newPathComps, true);
              return relativePath;
          }
      }, {
          key: 'CompactPathString',
          value: function CompactPathString(otherPath) {
              var globalPathStr = null;
              var relativePathStr = null;
              if (otherPath.isRelative) {
                  relativePathStr = otherPath.componentsString;
                  globalPathStr = this.path.PathByAppendingPath(otherPath).componentsString;
              } else {
                  var relativePath = this.ConvertPathToRelative(otherPath);
                  relativePathStr = relativePath.componentsString;
                  globalPathStr = otherPath.componentsString;
              }
              if (relativePathStr.length < globalPathStr.length) return relativePathStr;else return globalPathStr;
          }
      }, {
          key: 'Copy',
          value: function Copy() {
              throw Error("Not Implemented: Doesn't support copying");
          }
          // SetChild works slightly diferently in the js implementation.
          // Since we can't pass an objets property by reference, we instead pass
          // the object and the property string.
          // TODO: This method can probably be rewritten with type-safety in mind.

      }, {
          key: 'SetChild',
          value: function SetChild(obj, prop, value) {
              if (obj[prop]) obj[prop] = null;
              obj[prop] = value;
              if (obj[prop]) obj[prop].parent = this;
          }
      }, {
          key: 'debugMetadata',
          get: function get$$1() {
              if (this._debugMetadata === null) {
                  if (this.parent) {
                      return this.parent.debugMetadata;
                  }
              }
              return this._debugMetadata;
          },
          set: function set$$1(value) {
              this._debugMetadata = value;
          }
      }, {
          key: 'ownDebugMetadata',
          get: function get$$1() {
              return this._debugMetadata;
          }
      }, {
          key: 'path',
          get: function get$$1() {
              if (this._path == null) {
                  if (this.parent == null) {
                      this._path = new Path();
                  } else {
                      var comps = [];
                      var child = this;
                      var container = asOrNull(child.parent, Container);
                      while (container !== null) {
                          var namedChild = asINamedContentOrNull(child);
                          if (namedChild != null && namedChild.hasValidName) {
                              comps.unshift(new Path.Component(namedChild.name));
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
      }, {
          key: 'rootContentContainer',
          get: function get$$1() {
              var ancestor = this;
              while (ancestor.parent) {
                  ancestor = ancestor.parent;
              }
              return asOrNull(ancestor, Container);
          }
      }]);
      return InkObject;
  }();

  var StringBuilder = function () {
      function StringBuilder(str) {
          classCallCheck(this, StringBuilder);

          str = typeof str !== 'undefined' ? str.toString() : '';
          this.string = str;
      }

      createClass(StringBuilder, [{
          key: 'Append',
          value: function Append(str) {
              if (str !== null) {
                  this.string += str;
              }
          }
      }, {
          key: 'AppendLine',
          value: function AppendLine(str) {
              if (typeof str !== 'undefined') this.Append(str);
              this.string += '\n';
          }
      }, {
          key: 'AppendFormat',
          value: function AppendFormat(format) {
              for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                  args[_key - 1] = arguments[_key];
              }

              // taken from http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
              this.string += format.replace(/{(\d+)}/g, function (match, num) {
                  return typeof args[num] != 'undefined' ? args[num] : match;
              });
          }
      }, {
          key: 'toString',
          value: function toString() {
              return this.string;
          }
      }, {
          key: 'Length',
          get: function get$$1() {
              return this.string.length;
          }
      }]);
      return StringBuilder;
  }();

  var InkListItem = function () {
      function InkListItem() {
          classCallCheck(this, InkListItem);

          this.originName = null;
          this.itemName = null;
          if (typeof arguments[1] !== 'undefined') {
              var originName = arguments[0];
              var itemName = arguments[1];
              this.originName = originName;
              this.itemName = itemName;
          } else if (arguments[0]) {
              var fullName = arguments[0];
              var nameParts = fullName.toString().split('.');
              this.originName = nameParts[0];
              this.itemName = nameParts[1];
          }
      }

      createClass(InkListItem, [{
          key: 'toString',
          value: function toString() {
              return this.fullName;
          }
      }, {
          key: 'Equals',
          value: function Equals(obj) {
              if (obj instanceof InkListItem) {
                  var otherItem = obj;
                  return otherItem.itemName == this.itemName && otherItem.originName == this.originName;
              }
              return false;
          }
          // These methods did not exist in the original C# code. Their purpose is to
          // make `InkListItem` mimics the value-type semantics of the original
          // struct. Please refer to the end of this file, for a more in-depth
          // explanation.
          /**
           * Returns a shallow clone of the current instance.
           */

      }, {
          key: 'copy',
          value: function copy() {
              return new InkListItem(this.originName, this.itemName);
          }
          /**
           * Returns a `SerializedInkListItem` representing the current
           * instance. The result is intended to be used as a key inside a Map.
           */

      }, {
          key: 'serialized',
          value: function serialized() {
              // We are simply using a JSON representation as a value-typed key.
              return JSON.stringify({ originName: this.originName, itemName: this.itemName });
          }
          /**
           * Reconstructs a `InkListItem` from the given SerializedInkListItem.
           */

      }, {
          key: 'isNull',
          get: function get$$1() {
              return this.originName == null && this.itemName == null;
          }
      }, {
          key: 'fullName',
          get: function get$$1() {
              return (this.originName !== null ? this.originName : '?') + '.' + this.itemName;
          }
      }], [{
          key: 'fromSerializedKey',
          value: function fromSerializedKey(key) {
              var obj = JSON.parse(key);
              if (!InkListItem.isLikeInkListItem(obj)) return InkListItem.Null;
              var inkListItem = obj;
              return new InkListItem(inkListItem.originName, inkListItem.itemName);
          }
          /**
           * Determines whether the given item is sufficiently `InkListItem`-like
           * to be used as a template when reconstructing the InkListItem.
           */

      }, {
          key: 'isLikeInkListItem',
          value: function isLikeInkListItem(item) {
              if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) !== 'object') return false;
              if (!item.hasOwnProperty('originName') || !item.hasOwnProperty('itemName')) return false;
              if (typeof item.originName !== 'string' && typeof item.originName !== null) return false;
              if (typeof item.itemName !== 'string' && typeof item.itemName !== null) return false;
              return true;
          }
      }, {
          key: 'Null',
          get: function get$$1() {
              return new InkListItem(null, null);
          }
      }]);
      return InkListItem;
  }();
  var InkList = function (_Map) {
      inherits(InkList, _Map);

      function InkList() {
          var _arguments = arguments;
          classCallCheck(this, InkList);

          var _this = possibleConstructorReturn(this, (InkList.__proto__ || Object.getPrototypeOf(InkList)).call(this, function () {
              if (_arguments[0] instanceof InkList) {
                  return _arguments[0];
              } else {
                  return undefined;
              }
          }()));
          // Trying to be smart here, this emulates the constructor inheritance found
          // in the original code, but only if otherList is an InkList. IIFE FTW.


          _this.origins = null;
          _this._originNames = [];
          if (arguments[0] instanceof InkList) {
              var otherList = arguments[0];
              if (otherList._originNames) {
                  _this._originNames = otherList._originNames.slice();
              }
          } else if (typeof arguments[0] === 'string') {
              var singleOriginListName = arguments[0];
              var originStory = arguments[1] /* as Story */;
              _this.SetInitialOriginName(singleOriginListName);
              var def = originStory.listDefinitions.TryListGetDefinition(singleOriginListName, null);
              if (def.exists) {
                  _this.origins = [def.result];
              } else {
                  throw new Error('InkList origin could not be found in story when constructing new list: ' + singleOriginListName);
              }
          } else if (_typeof(arguments[0]) === 'object' && arguments[0].hasOwnProperty('Key') && arguments[0].hasOwnProperty('Value')) {
              var singleElement = arguments[0];
              _this.Add(singleElement.Key, singleElement.Value);
          }
          return _this;
      }

      createClass(InkList, [{
          key: 'AddItem',
          value: function AddItem(itemOrItemName) {
              if (itemOrItemName instanceof InkListItem) {
                  var item = itemOrItemName;
                  if (item.originName == null) {
                      this.AddItem(item.itemName);
                      return;
                  }
                  if (this.origins === null) return throwNullException('this.origins');
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                      for (var _iterator = this.origins[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                          var origin = _step.value;

                          if (origin.name == item.originName) {
                              var intVal = origin.TryGetValueForItem(item, 0);
                              if (intVal.exists) {
                                  this.Add(item, intVal.result);
                                  return;
                              } else {
                                  throw new Error('Could not add the item ' + item + " to this list because it doesn't exist in the original list definition in ink.");
                              }
                          }
                      }
                  } catch (err) {
                      _didIteratorError = true;
                      _iteratorError = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion && _iterator.return) {
                              _iterator.return();
                          }
                      } finally {
                          if (_didIteratorError) {
                              throw _iteratorError;
                          }
                      }
                  }

                  throw new Error("Failed to add item to list because the item was from a new list definition that wasn't previously known to this list. Only items from previously known lists can be used, so that the int value can be found.");
              } else {
                  var itemName = itemOrItemName;
                  var foundListDef = null;
                  if (this.origins === null) return throwNullException('this.origins');
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {
                      for (var _iterator2 = this.origins[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                          var _origin = _step2.value;

                          if (itemName === null) return throwNullException('itemName');
                          if (_origin.ContainsItemWithName(itemName)) {
                              if (foundListDef != null) {
                                  throw new Error('Could not add the item ' + itemName + ' to this list because it could come from either ' + _origin.name + ' or ' + foundListDef.name);
                              } else {
                                  foundListDef = _origin;
                              }
                          }
                      }
                  } catch (err) {
                      _didIteratorError2 = true;
                      _iteratorError2 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion2 && _iterator2.return) {
                              _iterator2.return();
                          }
                      } finally {
                          if (_didIteratorError2) {
                              throw _iteratorError2;
                          }
                      }
                  }

                  if (foundListDef == null) throw new Error('Could not add the item ' + itemName + " to this list because it isn't known to any list definitions previously associated with this list.");
                  var _item = new InkListItem(foundListDef.name, itemName);
                  var itemVal = foundListDef.ValueForItem(_item);
                  this.Add(_item, itemVal);
              }
          }
      }, {
          key: 'ContainsItemNamed',
          value: function ContainsItemNamed(itemName) {
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                  for (var _iterator3 = this[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var _ref = _step3.value;

                      var _ref2 = slicedToArray(_ref, 2);

                      var key = _ref2[0];
                      var value = _ref2[1];

                      var item = InkListItem.fromSerializedKey(key);
                      if (item.itemName == itemName) return true;
                  }
              } catch (err) {
                  _didIteratorError3 = true;
                  _iteratorError3 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return) {
                          _iterator3.return();
                      }
                  } finally {
                      if (_didIteratorError3) {
                          throw _iteratorError3;
                      }
                  }
              }

              return false;
          }
      }, {
          key: 'ContainsKey',
          value: function ContainsKey(key) {
              return this.has(key.serialized());
          }
      }, {
          key: 'Add',
          value: function Add(key, value) {
              var serializedKey = key.serialized();
              if (this.has(serializedKey)) {
                  // Throw an exception to match the C# behavior.
                  throw new Error('The Map already contains an entry for ' + key);
              }
              this.set(serializedKey, value);
          }
      }, {
          key: 'Remove',
          value: function Remove(key) {
              return this.delete(key.serialized());
          }
      }, {
          key: 'SetInitialOriginName',
          value: function SetInitialOriginName(initialOriginName) {
              this._originNames = [initialOriginName];
          }
      }, {
          key: 'SetInitialOriginNames',
          value: function SetInitialOriginNames(initialOriginNames) {
              if (initialOriginNames == null) this._originNames = null;else this._originNames = initialOriginNames.slice(); // store a copy
          }
      }, {
          key: 'Union',
          value: function Union(otherList) {
              var union = new InkList(this);
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                  for (var _iterator4 = otherList[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                      var _ref3 = _step4.value;

                      var _ref4 = slicedToArray(_ref3, 2);

                      var key = _ref4[0];
                      var value = _ref4[1];

                      union.set(key, value);
                  }
              } catch (err) {
                  _didIteratorError4 = true;
                  _iteratorError4 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion4 && _iterator4.return) {
                          _iterator4.return();
                      }
                  } finally {
                      if (_didIteratorError4) {
                          throw _iteratorError4;
                      }
                  }
              }

              return union;
          }
      }, {
          key: 'Intersect',
          value: function Intersect(otherList) {
              var intersection = new InkList();
              var _iteratorNormalCompletion5 = true;
              var _didIteratorError5 = false;
              var _iteratorError5 = undefined;

              try {
                  for (var _iterator5 = this[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                      var _ref5 = _step5.value;

                      var _ref6 = slicedToArray(_ref5, 2);

                      var key = _ref6[0];
                      var value = _ref6[1];

                      if (otherList.has(key)) intersection.set(key, value);
                  }
              } catch (err) {
                  _didIteratorError5 = true;
                  _iteratorError5 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion5 && _iterator5.return) {
                          _iterator5.return();
                      }
                  } finally {
                      if (_didIteratorError5) {
                          throw _iteratorError5;
                      }
                  }
              }

              return intersection;
          }
      }, {
          key: 'Without',
          value: function Without(listToRemove) {
              var result = new InkList(this);
              var _iteratorNormalCompletion6 = true;
              var _didIteratorError6 = false;
              var _iteratorError6 = undefined;

              try {
                  for (var _iterator6 = listToRemove[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                      var _ref7 = _step6.value;

                      var _ref8 = slicedToArray(_ref7, 2);

                      var key = _ref8[0];
                      var value = _ref8[1];

                      result.delete(key);
                  }
              } catch (err) {
                  _didIteratorError6 = true;
                  _iteratorError6 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion6 && _iterator6.return) {
                          _iterator6.return();
                      }
                  } finally {
                      if (_didIteratorError6) {
                          throw _iteratorError6;
                      }
                  }
              }

              return result;
          }
      }, {
          key: 'Contains',
          value: function Contains(otherList) {
              var _iteratorNormalCompletion7 = true;
              var _didIteratorError7 = false;
              var _iteratorError7 = undefined;

              try {
                  for (var _iterator7 = otherList[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                      var _ref9 = _step7.value;

                      var _ref10 = slicedToArray(_ref9, 2);

                      var key = _ref10[0];
                      var value = _ref10[1];

                      if (!this.has(key)) return false;
                  }
              } catch (err) {
                  _didIteratorError7 = true;
                  _iteratorError7 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion7 && _iterator7.return) {
                          _iterator7.return();
                      }
                  } finally {
                      if (_didIteratorError7) {
                          throw _iteratorError7;
                      }
                  }
              }

              return true;
          }
      }, {
          key: 'GreaterThan',
          value: function GreaterThan(otherList) {
              if (this.Count == 0) return false;
              if (otherList.Count == 0) return true;
              return this.minItem.Value > otherList.maxItem.Value;
          }
      }, {
          key: 'GreaterThanOrEquals',
          value: function GreaterThanOrEquals(otherList) {
              if (this.Count == 0) return false;
              if (otherList.Count == 0) return true;
              return this.minItem.Value >= otherList.minItem.Value && this.maxItem.Value >= otherList.maxItem.Value;
          }
      }, {
          key: 'LessThan',
          value: function LessThan(otherList) {
              if (otherList.Count == 0) return false;
              if (this.Count == 0) return true;
              return this.maxItem.Value < otherList.minItem.Value;
          }
      }, {
          key: 'LessThanOrEquals',
          value: function LessThanOrEquals(otherList) {
              if (otherList.Count == 0) return false;
              if (this.Count == 0) return true;
              return this.maxItem.Value <= otherList.maxItem.Value && this.minItem.Value <= otherList.minItem.Value;
          }
      }, {
          key: 'MaxAsList',
          value: function MaxAsList() {
              if (this.Count > 0) return new InkList(this.maxItem);else return new InkList();
          }
      }, {
          key: 'MinAsList',
          value: function MinAsList() {
              if (this.Count > 0) return new InkList(this.minItem);else return new InkList();
          }
      }, {
          key: 'ListWithSubRange',
          value: function ListWithSubRange(minBound, maxBound) {
              if (this.Count == 0) return new InkList();
              var ordered = this.orderedItems;
              var minValue = 0;
              var maxValue = Number.MAX_SAFE_INTEGER;
              if (Number.isInteger(minBound)) {
                  minValue = minBound;
              } else {
                  if (minBound instanceof InkList && minBound.Count > 0) minValue = minBound.minItem.Value;
              }
              if (Number.isInteger(maxBound)) {
                  maxValue = maxBound;
              } else {
                  if (minBound instanceof InkList && minBound.Count > 0) maxValue = maxBound.maxItem.Value;
              }
              var subList = new InkList();
              subList.SetInitialOriginNames(this.originNames);
              var _iteratorNormalCompletion8 = true;
              var _didIteratorError8 = false;
              var _iteratorError8 = undefined;

              try {
                  for (var _iterator8 = ordered[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                      var item = _step8.value;

                      if (item.Value >= minValue && item.Value <= maxValue) {
                          subList.Add(item.Key, item.Value);
                      }
                  }
              } catch (err) {
                  _didIteratorError8 = true;
                  _iteratorError8 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion8 && _iterator8.return) {
                          _iterator8.return();
                      }
                  } finally {
                      if (_didIteratorError8) {
                          throw _iteratorError8;
                      }
                  }
              }

              return subList;
          }
      }, {
          key: 'Equals',
          value: function Equals(otherInkList) {
              if (otherInkList instanceof InkList === false) return false;
              if (otherInkList.Count != this.Count) return false;
              var _iteratorNormalCompletion9 = true;
              var _didIteratorError9 = false;
              var _iteratorError9 = undefined;

              try {
                  for (var _iterator9 = this[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                      var _ref11 = _step9.value;

                      var _ref12 = slicedToArray(_ref11, 2);

                      var key = _ref12[0];
                      var value = _ref12[1];

                      if (!otherInkList.has(key)) return false;
                  }
              } catch (err) {
                  _didIteratorError9 = true;
                  _iteratorError9 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion9 && _iterator9.return) {
                          _iterator9.return();
                      }
                  } finally {
                      if (_didIteratorError9) {
                          throw _iteratorError9;
                      }
                  }
              }

              return true;
          }
          // GetHashCode not implemented

      }, {
          key: 'toString',
          value: function toString() {
              var ordered = this.orderedItems;
              var sb = new StringBuilder();
              for (var i = 0; i < ordered.length; i++) {
                  if (i > 0) sb.Append(', ');
                  var item = ordered[i].Key;
                  if (item.itemName === null) return throwNullException('item.itemName');
                  sb.Append(item.itemName);
              }
              return sb.toString();
          }
          // casting a InkList to a Number, for somereason, actually gives a number.
          // This messes up the type detection when creating a Value from a InkList.
          // Returning NaN here prevents that.

      }, {
          key: 'valueOf',
          value: function valueOf() {
              return NaN;
          }
      }, {
          key: 'Count',
          get: function get$$1() {
              return this.size;
          }
      }, {
          key: 'originOfMaxItem',
          get: function get$$1() {
              if (this.origins == null) return null;
              var maxOriginName = this.maxItem.Key.originName;
              var result = null;
              this.origins.every(function (origin) {
                  if (origin.name == maxOriginName) {
                      result = origin;
                      return false;
                  } else return true;
              });
              return result;
          }
      }, {
          key: 'originNames',
          get: function get$$1() {
              if (this.Count > 0) {
                  if (this._originNames == null && this.Count > 0) this._originNames = [];else {
                      if (!this._originNames) this._originNames = [];
                      this._originNames.length = 0;
                  }
                  var _iteratorNormalCompletion10 = true;
                  var _didIteratorError10 = false;
                  var _iteratorError10 = undefined;

                  try {
                      for (var _iterator10 = this[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                          var _ref13 = _step10.value;

                          var _ref14 = slicedToArray(_ref13, 2);

                          var key = _ref14[0];
                          var value = _ref14[1];

                          var item = InkListItem.fromSerializedKey(key);
                          if (item.originName === null) return throwNullException('item.originName');
                          this._originNames.push(item.originName);
                      }
                  } catch (err) {
                      _didIteratorError10 = true;
                      _iteratorError10 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion10 && _iterator10.return) {
                              _iterator10.return();
                          }
                      } finally {
                          if (_didIteratorError10) {
                              throw _iteratorError10;
                          }
                      }
                  }
              }
              return this._originNames;
          }
      }, {
          key: 'maxItem',
          get: function get$$1() {
              var max = {
                  Key: InkListItem.Null,
                  Value: 0
              };
              var _iteratorNormalCompletion11 = true;
              var _didIteratorError11 = false;
              var _iteratorError11 = undefined;

              try {
                  for (var _iterator11 = this[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                      var _ref15 = _step11.value;

                      var _ref16 = slicedToArray(_ref15, 2);

                      var key = _ref16[0];
                      var value = _ref16[1];

                      var item = InkListItem.fromSerializedKey(key);
                      if (max.Key.isNull || value > max.Value) max = { Key: item, Value: value };
                  }
              } catch (err) {
                  _didIteratorError11 = true;
                  _iteratorError11 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion11 && _iterator11.return) {
                          _iterator11.return();
                      }
                  } finally {
                      if (_didIteratorError11) {
                          throw _iteratorError11;
                      }
                  }
              }

              return max;
          }
      }, {
          key: 'minItem',
          get: function get$$1() {
              var min = {
                  Key: InkListItem.Null,
                  Value: 0
              };
              var _iteratorNormalCompletion12 = true;
              var _didIteratorError12 = false;
              var _iteratorError12 = undefined;

              try {
                  for (var _iterator12 = this[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                      var _ref17 = _step12.value;

                      var _ref18 = slicedToArray(_ref17, 2);

                      var key = _ref18[0];
                      var value = _ref18[1];

                      var item = InkListItem.fromSerializedKey(key);
                      if (min.Key.isNull || value < min.Value) {
                          min = { Key: item, Value: value };
                      }
                  }
              } catch (err) {
                  _didIteratorError12 = true;
                  _iteratorError12 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion12 && _iterator12.return) {
                          _iterator12.return();
                      }
                  } finally {
                      if (_didIteratorError12) {
                          throw _iteratorError12;
                      }
                  }
              }

              return min;
          }
      }, {
          key: 'inverse',
          get: function get$$1() {
              var list = new InkList();
              if (this.origins != null) {
                  var _iteratorNormalCompletion13 = true;
                  var _didIteratorError13 = false;
                  var _iteratorError13 = undefined;

                  try {
                      for (var _iterator13 = this.origins[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                          var origin = _step13.value;
                          var _iteratorNormalCompletion14 = true;
                          var _didIteratorError14 = false;
                          var _iteratorError14 = undefined;

                          try {
                              for (var _iterator14 = origin.items[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                                  var _ref19 = _step14.value;

                                  var _ref20 = slicedToArray(_ref19, 2);

                                  var key = _ref20[0];
                                  var value = _ref20[1];

                                  var item = InkListItem.fromSerializedKey(key);
                                  if (!this.ContainsKey(item)) list.Add(item, value);
                              }
                          } catch (err) {
                              _didIteratorError14 = true;
                              _iteratorError14 = err;
                          } finally {
                              try {
                                  if (!_iteratorNormalCompletion14 && _iterator14.return) {
                                      _iterator14.return();
                                  }
                              } finally {
                                  if (_didIteratorError14) {
                                      throw _iteratorError14;
                                  }
                              }
                          }
                      }
                  } catch (err) {
                      _didIteratorError13 = true;
                      _iteratorError13 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion13 && _iterator13.return) {
                              _iterator13.return();
                          }
                      } finally {
                          if (_didIteratorError13) {
                              throw _iteratorError13;
                          }
                      }
                  }
              }
              return list;
          }
      }, {
          key: 'all',
          get: function get$$1() {
              var list = new InkList();
              if (this.origins != null) {
                  var _iteratorNormalCompletion15 = true;
                  var _didIteratorError15 = false;
                  var _iteratorError15 = undefined;

                  try {
                      for (var _iterator15 = this.origins[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                          var origin = _step15.value;
                          var _iteratorNormalCompletion16 = true;
                          var _didIteratorError16 = false;
                          var _iteratorError16 = undefined;

                          try {
                              for (var _iterator16 = origin.items[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
                                  var _ref21 = _step16.value;

                                  var _ref22 = slicedToArray(_ref21, 2);

                                  var key = _ref22[0];
                                  var value = _ref22[1];

                                  var item = InkListItem.fromSerializedKey(key);
                                  list.set(item.serialized(), value);
                              }
                          } catch (err) {
                              _didIteratorError16 = true;
                              _iteratorError16 = err;
                          } finally {
                              try {
                                  if (!_iteratorNormalCompletion16 && _iterator16.return) {
                                      _iterator16.return();
                                  }
                              } finally {
                                  if (_didIteratorError16) {
                                      throw _iteratorError16;
                                  }
                              }
                          }
                      }
                  } catch (err) {
                      _didIteratorError15 = true;
                      _iteratorError15 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion15 && _iterator15.return) {
                              _iterator15.return();
                          }
                      } finally {
                          if (_didIteratorError15) {
                              throw _iteratorError15;
                          }
                      }
                  }
              }
              return list;
          }
      }, {
          key: 'orderedItems',
          get: function get$$1() {
              // List<KeyValuePair<InkListItem, int>>
              var ordered = new Array();
              var _iteratorNormalCompletion17 = true;
              var _didIteratorError17 = false;
              var _iteratorError17 = undefined;

              try {
                  for (var _iterator17 = this[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
                      var _ref23 = _step17.value;

                      var _ref24 = slicedToArray(_ref23, 2);

                      var key = _ref24[0];
                      var value = _ref24[1];

                      var item = InkListItem.fromSerializedKey(key);
                      ordered.push({ Key: item, Value: value });
                  }
              } catch (err) {
                  _didIteratorError17 = true;
                  _iteratorError17 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion17 && _iterator17.return) {
                          _iterator17.return();
                      }
                  } finally {
                      if (_didIteratorError17) {
                          throw _iteratorError17;
                      }
                  }
              }

              ordered.sort(function (x, y) {
                  if (x.Key.originName === null) {
                      return throwNullException('x.Key.originName');
                  }
                  if (y.Key.originName === null) {
                      return throwNullException('y.Key.originName');
                  }
                  if (x.Value == y.Value) {
                      return x.Key.originName.localeCompare(y.Key.originName);
                  } else {
                      // TODO: refactor this bit into a numberCompareTo method?
                      if (x.Value < y.Value) return -1;
                      return x.Value > y.Value ? 1 : 0;
                  }
              });
              return ordered;
          }
      }]);
      return InkList;
  }(Map);

  var StoryException = function (_Error) {
      inherits(StoryException, _Error);

      function StoryException(message) {
          classCallCheck(this, StoryException);

          var _this = possibleConstructorReturn(this, (StoryException.__proto__ || Object.getPrototypeOf(StoryException)).call(this, message));

          _this.useEndLineNumber = false;
          _this.message = message;
          _this.name = 'StoryException';
          return _this;
      }

      return StoryException;
  }(Error);

  function tryGetValueFromMap(map, key, /* out */value) {
      if (map === null) {
          return { result: value, exists: false };
      }
      var val = map.get(key);
      if (val) {
          return { result: val, exists: true };
      } else {
          return { result: value, exists: false };
      }
  }
  function tryParseInt(value) {
      var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      var val = parseInt(value);
      if (!Number.isNaN(val)) {
          return { result: val, exists: true };
      } else {
          return { result: defaultValue, exists: false };
      }
  }
  function tryParseFloat(value) {
      var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      var val = parseFloat(value);
      if (!Number.isNaN(val)) {
          return { result: val, exists: true };
      } else {
          return { result: defaultValue, exists: false };
      }
  }

  var AbstractValue = function (_InkObject) {
      inherits(AbstractValue, _InkObject);

      function AbstractValue() {
          classCallCheck(this, AbstractValue);
          return possibleConstructorReturn(this, (AbstractValue.__proto__ || Object.getPrototypeOf(AbstractValue)).apply(this, arguments));
      }

      createClass(AbstractValue, [{
          key: 'Copy',
          value: function Copy() {
              return asOrThrows(AbstractValue.Create(this), InkObject);
          }
      }, {
          key: 'BadCastException',
          value: function BadCastException(targetType) {
              return new StoryException("Can't cast " + this.valueObject + ' from ' + this.valueType + ' to ' + targetType);
          }
      }], [{
          key: 'Create',
          value: function Create(val) {
              // Implicitly convert bools into ints
              if (typeof val === 'boolean') {
                  var b = !!val;
                  val = b ? 1 : 0;
              }
              if (Number.isInteger(Number(val))) {
                  return new IntValue(Number(val));
              } else if (!isNaN(val)) {
                  return new FloatValue(Number(val));
              } else if (typeof val === 'string') {
                  return new StringValue(String(val));
              } else if (val instanceof Path) {
                  return new DivertTargetValue(asOrThrows(val, Path));
              } else if (val instanceof InkList) {
                  return new ListValue(asOrThrows(val, InkList));
              }
              return null;
          }
      }]);
      return AbstractValue;
  }(InkObject);
  var Value = function (_AbstractValue) {
      inherits(Value, _AbstractValue);

      function Value(val) {
          classCallCheck(this, Value);

          var _this2 = possibleConstructorReturn(this, (Value.__proto__ || Object.getPrototypeOf(Value)).call(this));

          _this2.value = val;
          return _this2;
      }

      createClass(Value, [{
          key: 'toString',
          value: function toString() {
              if (this.value === null) return throwNullException('Value.value');
              return this.value.toString();
          }
      }, {
          key: 'valueObject',
          get: function get$$1() {
              return this.value;
          }
      }]);
      return Value;
  }(AbstractValue);
  var IntValue = function (_Value) {
      inherits(IntValue, _Value);

      function IntValue(val) {
          classCallCheck(this, IntValue);
          return possibleConstructorReturn(this, (IntValue.__proto__ || Object.getPrototypeOf(IntValue)).call(this, val || 0));
      }

      createClass(IntValue, [{
          key: 'Cast',
          value: function Cast(newType) {
              if (this.value === null) return throwNullException('Value.value');
              if (newType == this.valueType) {
                  return this;
              }
              if (newType == ValueType.Float) {
                  return new FloatValue(this.value);
              }
              if (newType == ValueType.String) {
                  return new StringValue('' + this.value);
              }
              throw this.BadCastException(newType);
          }
      }, {
          key: 'isTruthy',
          get: function get$$1() {
              return this.value != 0;
          }
      }, {
          key: 'valueType',
          get: function get$$1() {
              return ValueType.Int;
          }
      }]);
      return IntValue;
  }(Value);
  var FloatValue = function (_Value2) {
      inherits(FloatValue, _Value2);

      function FloatValue(val) {
          classCallCheck(this, FloatValue);
          return possibleConstructorReturn(this, (FloatValue.__proto__ || Object.getPrototypeOf(FloatValue)).call(this, val || 0.0));
      }

      createClass(FloatValue, [{
          key: 'Cast',
          value: function Cast(newType) {
              if (this.value === null) return throwNullException('Value.value');
              if (newType == this.valueType) {
                  return this;
              }
              if (newType == ValueType.Int) {
                  return new IntValue(this.value);
              }
              if (newType == ValueType.String) {
                  return new StringValue('' + this.value);
              }
              throw this.BadCastException(newType);
          }
      }, {
          key: 'isTruthy',
          get: function get$$1() {
              return this.value != 0.0;
          }
      }, {
          key: 'valueType',
          get: function get$$1() {
              return ValueType.Float;
          }
      }]);
      return FloatValue;
  }(Value);
  var StringValue = function (_Value3) {
      inherits(StringValue, _Value3);

      function StringValue(val) {
          var _ret;

          classCallCheck(this, StringValue);

          var _this5 = possibleConstructorReturn(this, (StringValue.__proto__ || Object.getPrototypeOf(StringValue)).call(this, val || ''));

          _this5._isNewline = _this5.value == '\n';
          _this5._isInlineWhitespace = true;
          if (_this5.value === null) return _ret = throwNullException('Value.value'), possibleConstructorReturn(_this5, _ret);
          if (_this5.value.length > 0) {
              _this5.value.split('').every(function (c) {
                  if (c != ' ' && c != '\t') {
                      _this5._isInlineWhitespace = false;
                      return false;
                  }
                  return true;
              });
          }
          return _this5;
      }

      createClass(StringValue, [{
          key: 'Cast',
          value: function Cast(newType) {
              if (newType == this.valueType) {
                  return this;
              }
              if (newType == ValueType.Int) {
                  var parsedInt = tryParseInt(this.value);
                  if (parsedInt.exists) {
                      return new IntValue(parsedInt.result);
                  } else {
                      throw this.BadCastException(newType);
                  }
              }
              if (newType == ValueType.Float) {
                  var parsedFloat = tryParseFloat(this.value);
                  if (parsedFloat.exists) {
                      return new FloatValue(parsedFloat.result);
                  } else {
                      throw this.BadCastException(newType);
                  }
              }
              throw this.BadCastException(newType);
          }
      }, {
          key: 'valueType',
          get: function get$$1() {
              return ValueType.String;
          }
      }, {
          key: 'isTruthy',
          get: function get$$1() {
              if (this.value === null) return throwNullException('Value.value');
              return this.value.length > 0;
          }
      }, {
          key: 'isNewline',
          get: function get$$1() {
              return this._isNewline;
          }
      }, {
          key: 'isInlineWhitespace',
          get: function get$$1() {
              return this._isInlineWhitespace;
          }
      }, {
          key: 'isNonWhitespace',
          get: function get$$1() {
              return !this.isNewline && !this.isInlineWhitespace;
          }
      }]);
      return StringValue;
  }(Value);
  var DivertTargetValue = function (_Value4) {
      inherits(DivertTargetValue, _Value4);

      function DivertTargetValue(targetPath) {
          classCallCheck(this, DivertTargetValue);
          return possibleConstructorReturn(this, (DivertTargetValue.__proto__ || Object.getPrototypeOf(DivertTargetValue)).call(this, targetPath));
      }

      createClass(DivertTargetValue, [{
          key: 'Cast',
          value: function Cast(newType) {
              if (newType == this.valueType) return this;
              throw this.BadCastException(newType);
          }
      }, {
          key: 'toString',
          value: function toString() {
              return 'DivertTargetValue(' + this.targetPath + ')';
          }
      }, {
          key: 'valueType',
          get: function get$$1() {
              return ValueType.DivertTarget;
          }
      }, {
          key: 'targetPath',
          get: function get$$1() {
              if (this.value === null) return throwNullException('Value.value');
              return this.value;
          },
          set: function set$$1(value) {
              this.value = value;
          }
      }, {
          key: 'isTruthy',
          get: function get$$1() {
              throw new Error('Shouldn\'t be checking the truthiness of a divert target');
          }
      }]);
      return DivertTargetValue;
  }(Value);
  var VariablePointerValue = function (_Value5) {
      inherits(VariablePointerValue, _Value5);

      function VariablePointerValue(variableName) {
          var contextIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
          classCallCheck(this, VariablePointerValue);

          var _this7 = possibleConstructorReturn(this, (VariablePointerValue.__proto__ || Object.getPrototypeOf(VariablePointerValue)).call(this, variableName));

          _this7._contextIndex = contextIndex;
          return _this7;
      }

      createClass(VariablePointerValue, [{
          key: 'Cast',
          value: function Cast(newType) {
              if (newType == this.valueType) return this;
              throw this.BadCastException(newType);
          }
      }, {
          key: 'toString',
          value: function toString() {
              return 'VariablePointerValue(' + this.variableName + ')';
          }
      }, {
          key: 'Copy',
          value: function Copy() {
              return new VariablePointerValue(this.variableName, this.contextIndex);
          }
      }, {
          key: 'contextIndex',
          get: function get$$1() {
              return this._contextIndex;
          },
          set: function set$$1(value) {
              this._contextIndex = value;
          }
      }, {
          key: 'variableName',
          get: function get$$1() {
              if (this.value === null) return throwNullException('Value.value');
              return this.value;
          },
          set: function set$$1(value) {
              this.value = value;
          }
      }, {
          key: 'valueType',
          get: function get$$1() {
              return ValueType.VariablePointer;
          }
      }, {
          key: 'isTruthy',
          get: function get$$1() {
              throw new Error("Shouldn't be checking the truthiness of a variable pointer");
          }
      }]);
      return VariablePointerValue;
  }(Value);
  var ListValue = function (_Value6) {
      inherits(ListValue, _Value6);
      createClass(ListValue, [{
          key: 'Cast',
          value: function Cast(newType) {
              if (this.value === null) return throwNullException('Value.value');
              if (newType == ValueType.Int) {
                  var max = this.value.maxItem;
                  if (max.Key.isNull) return new IntValue(0);else return new IntValue(max.Value);
              } else if (newType == ValueType.Float) {
                  var _max = this.value.maxItem;
                  if (_max.Key.isNull) return new FloatValue(0.0);else return new FloatValue(_max.Value);
              } else if (newType == ValueType.String) {
                  var _max2 = this.value.maxItem;
                  if (_max2.Key.isNull) return new StringValue('');else {
                      return new StringValue(_max2.Key.toString());
                  }
              }
              if (newType == this.valueType) return this;
              throw this.BadCastException(newType);
          }
      }, {
          key: 'isTruthy',
          get: function get$$1() {
              if (this.value === null) {
                  return throwNullException('this.value');
              }
              return this.value.Count > 0;
          }
      }, {
          key: 'valueType',
          get: function get$$1() {
              return ValueType.List;
          }
      }]);

      function ListValue(listOrSingleItem, singleValue) {
          classCallCheck(this, ListValue);

          var _this8 = possibleConstructorReturn(this, (ListValue.__proto__ || Object.getPrototypeOf(ListValue)).call(this, null));

          if (!listOrSingleItem && !singleValue) {
              _this8.value = new InkList();
          } else if (listOrSingleItem instanceof InkList) {
              _this8.value = new InkList(listOrSingleItem);
          } else if (listOrSingleItem instanceof InkListItem && typeof singleValue === 'number') {
              _this8.value = new InkList({
                  Key: listOrSingleItem,
                  Value: singleValue
              });
          }
          return _this8;
      }

      createClass(ListValue, null, [{
          key: 'RetainListOriginsForAssignment',
          value: function RetainListOriginsForAssignment(oldValue, newValue) {
              var oldList = asOrNull(oldValue, ListValue);
              var newList = asOrNull(newValue, ListValue);
              if (newList && newList.value === null) return throwNullException('newList.value');
              if (oldList && oldList.value === null) return throwNullException('oldList.value');
              // When assigning the empty list, try to retain any initial origin names
              if (oldList && newList && newList.value.Count == 0) newList.value.SetInitialOriginNames(oldList.value.originNames);
          }
      }]);
      return ListValue;
  }(Value);
  var ValueType;
  (function (ValueType) {
      ValueType[ValueType["Int"] = 0] = "Int";
      ValueType[ValueType["Float"] = 1] = "Float";
      ValueType[ValueType["List"] = 2] = "List";
      ValueType[ValueType["String"] = 3] = "String";
      ValueType[ValueType["DivertTarget"] = 4] = "DivertTarget";
      ValueType[ValueType["VariablePointer"] = 5] = "VariablePointer";
  })(ValueType || (ValueType = {}));

  var SearchResult = function () {
      function SearchResult() {
          classCallCheck(this, SearchResult);

          this.obj = null;
          this.approximate = false;
      }

      createClass(SearchResult, [{
          key: 'copy',
          value: function copy() {
              var searchResult = new SearchResult();
              searchResult.obj = this.obj;
              searchResult.approximate = this.approximate;
              return searchResult;
          }
      }, {
          key: 'correctObj',
          get: function get$$1() {
              return this.approximate ? null : this.obj;
          }
      }, {
          key: 'container',
          get: function get$$1() {
              return this.obj instanceof Container ? this.obj : null;
          }
      }]);
      return SearchResult;
  }();

  var Container = function (_InkObject) {
      inherits(Container, _InkObject);

      function Container() {
          classCallCheck(this, Container);

          var _this = possibleConstructorReturn(this, (Container.__proto__ || Object.getPrototypeOf(Container)).apply(this, arguments));

          _this.name = '';
          _this._content = [];
          _this.namedContent = new Map();
          _this.visitsShouldBeCounted = false;
          _this.turnIndexShouldBeCounted = false;
          _this.countingAtStartOnly = false;
          _this._pathToFirstLeafContent = null;
          return _this;
      }

      createClass(Container, [{
          key: 'AddContent',
          value: function AddContent(contentObjOrList) {
              if (contentObjOrList instanceof Array) {
                  var contentList = contentObjOrList;
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                      for (var _iterator = contentList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                          var c = _step.value;

                          this.AddContent(c);
                      }
                  } catch (err) {
                      _didIteratorError = true;
                      _iteratorError = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion && _iterator.return) {
                              _iterator.return();
                          }
                      } finally {
                          if (_didIteratorError) {
                              throw _iteratorError;
                          }
                      }
                  }
              } else {
                  var contentObj = contentObjOrList;
                  this._content.push(contentObj);
                  if (contentObj.parent) {
                      throw new Error('content is already in ' + contentObj.parent);
                  }
                  contentObj.parent = this;
                  this.TryAddNamedContent(contentObj);
              }
          }
      }, {
          key: 'TryAddNamedContent',
          value: function TryAddNamedContent(contentObj) {
              var namedContentObj = asINamedContentOrNull(contentObj);
              if (namedContentObj != null && namedContentObj.hasValidName) {
                  this.AddToNamedContentOnly(namedContentObj);
              }
          }
      }, {
          key: 'AddToNamedContentOnly',
          value: function AddToNamedContentOnly(namedContentObj) {
              Debug.AssertType(namedContentObj, InkObject, 'Can only add Runtime.Objects to a Runtime.Container');
              var runtimeObj = asOrThrows(namedContentObj, InkObject);
              runtimeObj.parent = this;
              this.namedContent.set(namedContentObj.name, namedContentObj);
          }
      }, {
          key: 'ContentAtPath',
          value: function ContentAtPath(path) {
              var partialPathStart = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
              var partialPathLength = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

              if (partialPathLength == -1) partialPathLength = path.length;
              var result = new SearchResult();
              result.approximate = false;
              var currentContainer = this;
              var currentObj = this;
              for (var i = partialPathStart; i < partialPathLength; ++i) {
                  var comp = path.GetComponent(i);
                  if (currentContainer == null) {
                      result.approximate = true;
                      break;
                  }
                  var foundObj = currentContainer.ContentWithPathComponent(comp);
                  if (foundObj == null) {
                      result.approximate = true;
                      break;
                  }
                  currentObj = foundObj;
                  currentContainer = asOrNull(foundObj, Container);
              }
              result.obj = currentObj;
              return result;
          }
      }, {
          key: 'InsertContent',
          value: function InsertContent(contentObj, index) {
              this.content[index] = contentObj;
              if (contentObj.parent) {
                  throw new Error('content is already in ' + contentObj.parent);
              }
              contentObj.parent = this;
              this.TryAddNamedContent(contentObj);
          }
      }, {
          key: 'AddContentsOfContainer',
          value: function AddContentsOfContainer(otherContainer) {
              this.content = this.content.concat(otherContainer.content);
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                  for (var _iterator2 = otherContainer.content[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var obj = _step2.value;

                      obj.parent = this;
                      this.TryAddNamedContent(obj);
                  }
              } catch (err) {
                  _didIteratorError2 = true;
                  _iteratorError2 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                          _iterator2.return();
                      }
                  } finally {
                      if (_didIteratorError2) {
                          throw _iteratorError2;
                      }
                  }
              }
          }
      }, {
          key: 'ContentWithPathComponent',
          value: function ContentWithPathComponent(component) {
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
                      return throwNullException('component.name');
                  }
                  var foundContent = tryGetValueFromMap(this.namedContent, component.name, null);
                  if (foundContent.exists) {
                      return asOrThrows(foundContent.result, InkObject);
                  } else {
                      return null;
                  }
              }
          }
      }, {
          key: 'BuildStringOfHierarchy',
          value: function BuildStringOfHierarchy() {
              var sb = void 0;
              if (arguments.length == 0) {
                  sb = new StringBuilder();
                  this.BuildStringOfHierarchy(sb, 0, null);
                  return sb.toString();
              }
              sb = arguments[0];
              var indentation = arguments[1];
              var pointedObj = arguments[2];
              function appendIndentation() {
                  var spacesPerIndent = 4; // Truly const in the original code
                  for (var i = 0; i < spacesPerIndent * indentation; ++i) {
                      sb.Append(' ');
                  }
              }
              appendIndentation();
              sb.Append('[');
              if (this.hasValidName) {
                  sb.AppendFormat(' ({0})', this.name);
              }
              if (this == pointedObj) {
                  sb.Append('  <---');
              }
              sb.AppendLine();
              indentation++;
              for (var i = 0; i < this.content.length; ++i) {
                  var obj = this.content[i];
                  if (obj instanceof Container) {
                      var container = obj;
                      container.BuildStringOfHierarchy(sb, indentation, pointedObj);
                  } else {
                      appendIndentation();
                      if (obj instanceof StringValue) {
                          sb.Append('\"');
                          sb.Append(obj.toString().replace('\n', '\\n'));
                          sb.Append('\"');
                      } else {
                          sb.Append(obj.toString());
                      }
                  }
                  if (i != this.content.length - 1) {
                      sb.Append(',');
                  }
                  if (!(obj instanceof Container) && obj == pointedObj) {
                      sb.Append('  <---');
                  }
                  sb.AppendLine();
              }
              var onlyNamed = new Map();
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                  for (var _iterator3 = this.namedContent[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var _ref = _step3.value;

                      var _ref2 = slicedToArray(_ref, 2);

                      var key = _ref2[0];
                      var value = _ref2[1];

                      if (this.content.indexOf(asOrThrows(value, InkObject)) >= 0) {
                          continue;
                      } else {
                          onlyNamed.set(key, value);
                      }
                  }
              } catch (err) {
                  _didIteratorError3 = true;
                  _iteratorError3 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return) {
                          _iterator3.return();
                      }
                  } finally {
                      if (_didIteratorError3) {
                          throw _iteratorError3;
                      }
                  }
              }

              if (onlyNamed.size > 0) {
                  appendIndentation();
                  sb.AppendLine('-- named: --');
                  var _iteratorNormalCompletion4 = true;
                  var _didIteratorError4 = false;
                  var _iteratorError4 = undefined;

                  try {
                      for (var _iterator4 = onlyNamed[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                          var _ref3 = _step4.value;

                          var _ref4 = slicedToArray(_ref3, 2);

                          var _key = _ref4[0];
                          var _value = _ref4[1];

                          Debug.AssertType(_value, Container, 'Can only print out named Containers');
                          var _container = _value;
                          _container.BuildStringOfHierarchy(sb, indentation, pointedObj);
                          sb.AppendLine();
                      }
                  } catch (err) {
                      _didIteratorError4 = true;
                      _iteratorError4 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion4 && _iterator4.return) {
                              _iterator4.return();
                          }
                      } finally {
                          if (_didIteratorError4) {
                              throw _iteratorError4;
                          }
                      }
                  }
              }
              indentation--;
              appendIndentation();
              sb.Append(']');
          }
      }, {
          key: 'hasValidName',
          get: function get$$1() {
              return this.name != null && this.name.length > 0;
          }
      }, {
          key: 'content',
          get: function get$$1() {
              return this._content;
          },
          set: function set$$1(value) {
              this.AddContent(value);
          }
      }, {
          key: 'namedOnlyContent',
          get: function get$$1() {
              var namedOnlyContentDict = new Map();
              var _iteratorNormalCompletion5 = true;
              var _didIteratorError5 = false;
              var _iteratorError5 = undefined;

              try {
                  for (var _iterator5 = this.namedContent[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                      var _ref5 = _step5.value;

                      var _ref6 = slicedToArray(_ref5, 2);

                      var key = _ref6[0];
                      var value = _ref6[1];

                      var inkObject = asOrThrows(value, InkObject);
                      namedOnlyContentDict.set(key, inkObject);
                  }
              } catch (err) {
                  _didIteratorError5 = true;
                  _iteratorError5 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion5 && _iterator5.return) {
                          _iterator5.return();
                      }
                  } finally {
                      if (_didIteratorError5) {
                          throw _iteratorError5;
                      }
                  }
              }

              var _iteratorNormalCompletion6 = true;
              var _didIteratorError6 = false;
              var _iteratorError6 = undefined;

              try {
                  for (var _iterator6 = this.content[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                      var c = _step6.value;

                      var named = asINamedContentOrNull(c);
                      if (named != null && named.hasValidName) {
                          namedOnlyContentDict.delete(named.name);
                      }
                  }
              } catch (err) {
                  _didIteratorError6 = true;
                  _iteratorError6 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion6 && _iterator6.return) {
                          _iterator6.return();
                      }
                  } finally {
                      if (_didIteratorError6) {
                          throw _iteratorError6;
                      }
                  }
              }

              if (namedOnlyContentDict.size == 0) namedOnlyContentDict = null;
              return namedOnlyContentDict;
          },
          set: function set$$1(value) {
              var existingNamedOnly = this.namedOnlyContent;
              if (existingNamedOnly != null) {
                  var _iteratorNormalCompletion7 = true;
                  var _didIteratorError7 = false;
                  var _iteratorError7 = undefined;

                  try {
                      for (var _iterator7 = existingNamedOnly[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                          var _ref7 = _step7.value;

                          var _ref8 = slicedToArray(_ref7, 2);

                          var key = _ref8[0];
                          var val = _ref8[1];

                          this.namedContent.delete(key);
                      }
                  } catch (err) {
                      _didIteratorError7 = true;
                      _iteratorError7 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion7 && _iterator7.return) {
                              _iterator7.return();
                          }
                      } finally {
                          if (_didIteratorError7) {
                              throw _iteratorError7;
                          }
                      }
                  }
              }
              if (value == null) return;
              var _iteratorNormalCompletion8 = true;
              var _didIteratorError8 = false;
              var _iteratorError8 = undefined;

              try {
                  for (var _iterator8 = value[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                      var _ref9 = _step8.value;

                      var _ref10 = slicedToArray(_ref9, 2);

                      var _key2 = _ref10[0];
                      var _val = _ref10[1];

                      var named = asINamedContentOrNull(_val);
                      if (named != null) this.AddToNamedContentOnly(named);
                  }
              } catch (err) {
                  _didIteratorError8 = true;
                  _iteratorError8 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion8 && _iterator8.return) {
                          _iterator8.return();
                      }
                  } finally {
                      if (_didIteratorError8) {
                          throw _iteratorError8;
                      }
                  }
              }
          }
      }, {
          key: 'countFlags',
          get: function get$$1() {
              var flags = 0;
              if (this.visitsShouldBeCounted) flags |= Container.CountFlags.Visits;
              if (this.turnIndexShouldBeCounted) flags |= Container.CountFlags.Turns;
              if (this.countingAtStartOnly) flags |= Container.CountFlags.CountStartOnly;
              if (flags == Container.CountFlags.CountStartOnly) {
                  flags = 0;
              }
              return flags;
          },
          set: function set$$1(value) {
              var flag = value;
              if ((flag & Container.CountFlags.Visits) > 0) this.visitsShouldBeCounted = true;
              if ((flag & Container.CountFlags.Turns) > 0) this.turnIndexShouldBeCounted = true;
              if ((flag & Container.CountFlags.CountStartOnly) > 0) this.countingAtStartOnly = true;
          }
      }, {
          key: 'pathToFirstLeafContent',
          get: function get$$1() {
              if (this._pathToFirstLeafContent == null) this._pathToFirstLeafContent = this.path.PathByAppendingPath(this.internalPathToFirstLeafContent);
              return this._pathToFirstLeafContent;
          }
      }, {
          key: 'internalPathToFirstLeafContent',
          get: function get$$1() {
              var components = [];
              var container = this;
              while (container instanceof Container) {
                  if (container.content.length > 0) {
                      components.push(new Path.Component(0));
                      container = container.content[0];
                  }
              }
              return new Path(components);
          }
      }]);
      return Container;
  }(InkObject);
  (function (Container) {
      var CountFlags = void 0;
      (function (CountFlags) {
          CountFlags[CountFlags["Visits"] = 1] = "Visits";
          CountFlags[CountFlags["Turns"] = 2] = "Turns";
          CountFlags[CountFlags["CountStartOnly"] = 4] = "CountStartOnly";
      })(CountFlags = Container.CountFlags || (Container.CountFlags = {}));
  })(Container || (Container = {}));

  var Glue = function (_InkObject) {
      inherits(Glue, _InkObject);

      function Glue() {
          classCallCheck(this, Glue);
          return possibleConstructorReturn(this, (Glue.__proto__ || Object.getPrototypeOf(Glue)).apply(this, arguments));
      }

      createClass(Glue, [{
          key: 'toString',
          value: function toString() {
              return 'Glue';
          }
      }]);
      return Glue;
  }(InkObject);

  var ControlCommand = function (_InkObject) {
      inherits(ControlCommand, _InkObject);
      createClass(ControlCommand, [{
          key: "commandType",
          get: function get$$1() {
              return this._commandType;
          }
      }]);

      function ControlCommand() {
          var commandType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ControlCommand.CommandType.NotSet;
          classCallCheck(this, ControlCommand);

          var _this = possibleConstructorReturn(this, (ControlCommand.__proto__ || Object.getPrototypeOf(ControlCommand)).call(this));

          _this._commandType = commandType;
          return _this;
      }

      createClass(ControlCommand, [{
          key: "Copy",
          value: function Copy() {
              return new ControlCommand(this.commandType);
          }
      }, {
          key: "toString",
          value: function toString() {
              return this.commandType.toString();
          }
      }], [{
          key: "EvalStart",
          value: function EvalStart() {
              return new ControlCommand(ControlCommand.CommandType.EvalStart);
          }
      }, {
          key: "EvalOutput",
          value: function EvalOutput() {
              return new ControlCommand(ControlCommand.CommandType.EvalOutput);
          }
      }, {
          key: "EvalEnd",
          value: function EvalEnd() {
              return new ControlCommand(ControlCommand.CommandType.EvalEnd);
          }
      }, {
          key: "Duplicate",
          value: function Duplicate() {
              return new ControlCommand(ControlCommand.CommandType.Duplicate);
          }
      }, {
          key: "PopEvaluatedValue",
          value: function PopEvaluatedValue() {
              return new ControlCommand(ControlCommand.CommandType.PopEvaluatedValue);
          }
      }, {
          key: "PopFunction",
          value: function PopFunction() {
              return new ControlCommand(ControlCommand.CommandType.PopFunction);
          }
      }, {
          key: "PopTunnel",
          value: function PopTunnel() {
              return new ControlCommand(ControlCommand.CommandType.PopTunnel);
          }
      }, {
          key: "BeginString",
          value: function BeginString() {
              return new ControlCommand(ControlCommand.CommandType.BeginString);
          }
      }, {
          key: "EndString",
          value: function EndString() {
              return new ControlCommand(ControlCommand.CommandType.EndString);
          }
      }, {
          key: "NoOp",
          value: function NoOp() {
              return new ControlCommand(ControlCommand.CommandType.NoOp);
          }
      }, {
          key: "ChoiceCount",
          value: function ChoiceCount() {
              return new ControlCommand(ControlCommand.CommandType.ChoiceCount);
          }
      }, {
          key: "Turns",
          value: function Turns() {
              return new ControlCommand(ControlCommand.CommandType.Turns);
          }
      }, {
          key: "TurnsSince",
          value: function TurnsSince() {
              return new ControlCommand(ControlCommand.CommandType.TurnsSince);
          }
      }, {
          key: "ReadCount",
          value: function ReadCount() {
              return new ControlCommand(ControlCommand.CommandType.ReadCount);
          }
      }, {
          key: "Random",
          value: function Random() {
              return new ControlCommand(ControlCommand.CommandType.Random);
          }
      }, {
          key: "SeedRandom",
          value: function SeedRandom() {
              return new ControlCommand(ControlCommand.CommandType.SeedRandom);
          }
      }, {
          key: "VisitIndex",
          value: function VisitIndex() {
              return new ControlCommand(ControlCommand.CommandType.VisitIndex);
          }
      }, {
          key: "SequenceShuffleIndex",
          value: function SequenceShuffleIndex() {
              return new ControlCommand(ControlCommand.CommandType.SequenceShuffleIndex);
          }
      }, {
          key: "StartThread",
          value: function StartThread() {
              return new ControlCommand(ControlCommand.CommandType.StartThread);
          }
      }, {
          key: "Done",
          value: function Done() {
              return new ControlCommand(ControlCommand.CommandType.Done);
          }
      }, {
          key: "End",
          value: function End() {
              return new ControlCommand(ControlCommand.CommandType.End);
          }
      }, {
          key: "ListFromInt",
          value: function ListFromInt() {
              return new ControlCommand(ControlCommand.CommandType.ListFromInt);
          }
      }, {
          key: "ListRange",
          value: function ListRange() {
              return new ControlCommand(ControlCommand.CommandType.ListRange);
          }
      }, {
          key: "ListRandom",
          value: function ListRandom() {
              return new ControlCommand(ControlCommand.CommandType.ListRandom);
          }
      }]);
      return ControlCommand;
  }(InkObject);
  (function (ControlCommand) {
      var CommandType = void 0;
      (function (CommandType) {
          CommandType[CommandType["NotSet"] = -1] = "NotSet";
          CommandType[CommandType["EvalStart"] = 0] = "EvalStart";
          CommandType[CommandType["EvalOutput"] = 1] = "EvalOutput";
          CommandType[CommandType["EvalEnd"] = 2] = "EvalEnd";
          CommandType[CommandType["Duplicate"] = 3] = "Duplicate";
          CommandType[CommandType["PopEvaluatedValue"] = 4] = "PopEvaluatedValue";
          CommandType[CommandType["PopFunction"] = 5] = "PopFunction";
          CommandType[CommandType["PopTunnel"] = 6] = "PopTunnel";
          CommandType[CommandType["BeginString"] = 7] = "BeginString";
          CommandType[CommandType["EndString"] = 8] = "EndString";
          CommandType[CommandType["NoOp"] = 9] = "NoOp";
          CommandType[CommandType["ChoiceCount"] = 10] = "ChoiceCount";
          CommandType[CommandType["Turns"] = 11] = "Turns";
          CommandType[CommandType["TurnsSince"] = 12] = "TurnsSince";
          CommandType[CommandType["Random"] = 13] = "Random";
          CommandType[CommandType["SeedRandom"] = 14] = "SeedRandom";
          CommandType[CommandType["VisitIndex"] = 15] = "VisitIndex";
          CommandType[CommandType["SequenceShuffleIndex"] = 16] = "SequenceShuffleIndex";
          CommandType[CommandType["StartThread"] = 17] = "StartThread";
          CommandType[CommandType["Done"] = 18] = "Done";
          CommandType[CommandType["End"] = 19] = "End";
          CommandType[CommandType["ListFromInt"] = 20] = "ListFromInt";
          CommandType[CommandType["ListRange"] = 21] = "ListRange";
          CommandType[CommandType["ListRandom"] = 22] = "ListRandom";
          CommandType[CommandType["ReadCount"] = 23] = "ReadCount";
          CommandType[CommandType["TOTAL_VALUES"] = 24] = "TOTAL_VALUES";
      })(CommandType = ControlCommand.CommandType || (ControlCommand.CommandType = {}));
  })(ControlCommand || (ControlCommand = {}));

  var PushPopType;
  (function (PushPopType) {
      PushPopType[PushPopType["Tunnel"] = 0] = "Tunnel";
      PushPopType[PushPopType["Function"] = 1] = "Function";
      PushPopType[PushPopType["FunctionEvaluationFromGame"] = 2] = "FunctionEvaluationFromGame";
  })(PushPopType || (PushPopType = {}));

  var Pointer = function () {
      function Pointer() {
          classCallCheck(this, Pointer);

          this.container = null;
          this.index = -1;
          if (arguments.length === 2) {
              this.container = arguments[0];
              this.index = arguments[1];
          }
      }

      createClass(Pointer, [{
          key: 'Resolve',
          value: function Resolve() {
              if (this.index < 0) return this.container;
              if (this.container == null) return null;
              if (this.container.content.length == 0) return this.container;
              if (this.index >= this.container.content.length) return null;
              return this.container.content[this.index];
          }
      }, {
          key: 'toString',
          value: function toString() {
              if (!this.container) return 'Ink Pointer (null)';
              return 'Ink Pointer -> ' + this.container.path.toString() + ' -- index ' + this.index;
          }
          // This method does not exist in the original C# code, but is here to maintain the
          // value semantics of Pointer.

      }, {
          key: 'copy',
          value: function copy() {
              return new Pointer(this.container, this.index);
          }
      }, {
          key: 'isNull',
          get: function get$$1() {
              return this.container == null;
          }
      }, {
          key: 'path',
          get: function get$$1() {
              if (this.isNull) return null;
              if (this.index >= 0) return this.container.path.PathByAppendingComponent(new Path.Component(this.index));else return this.container.path;
          }
      }], [{
          key: 'StartOf',
          value: function StartOf(container) {
              return new Pointer(container, 0);
          }
      }, {
          key: 'Null',
          get: function get$$1() {
              return new Pointer(null, -1);
          }
      }]);
      return Pointer;
  }();

  var Divert = function (_InkObject) {
      inherits(Divert, _InkObject);

      function Divert(stackPushType) {
          classCallCheck(this, Divert);

          var _this = possibleConstructorReturn(this, (Divert.__proto__ || Object.getPrototypeOf(Divert)).call(this));

          _this._targetPath = null;
          _this._targetPointer = Pointer.Null;
          _this.variableDivertName = null;
          _this.pushesToStack = false;
          _this.stackPushType = 0;
          _this.isExternal = false;
          _this.externalArgs = 0;
          _this.isConditional = false;
          _this.pushesToStack = false;
          if (typeof stackPushType !== 'undefined') {
              _this.pushesToStack = true;
              _this.stackPushType = stackPushType;
          }
          return _this;
      }

      createClass(Divert, [{
          key: 'Equals',
          value: function Equals(obj) {
              var otherDivert = obj;
              if (otherDivert instanceof Divert) {
                  if (this.hasVariableTarget == otherDivert.hasVariableTarget) {
                      if (this.hasVariableTarget) {
                          return this.variableDivertName == otherDivert.variableDivertName;
                      } else {
                          if (this.targetPath === null) return throwNullException('this.targetPath');
                          return this.targetPath.Equals(otherDivert.targetPath);
                      }
                  }
              }
              return false;
          }
      }, {
          key: 'toString',
          value: function toString() {
              if (this.hasVariableTarget) {
                  return 'Divert(variable: ' + this.variableDivertName + ')';
              } else if (this.targetPath == null) {
                  return 'Divert(null)';
              } else {
                  var sb = new StringBuilder();
                  var targetStr = this.targetPath.toString();
                  sb.Append('Divert');
                  if (this.isConditional) sb.Append('?');
                  if (this.pushesToStack) {
                      if (this.stackPushType == PushPopType.Function) {
                          sb.Append(' function');
                      } else {
                          sb.Append(' tunnel');
                      }
                  }
                  sb.Append(' -> ');
                  sb.Append(this.targetPathString);
                  sb.Append(' (');
                  sb.Append(targetStr);
                  sb.Append(')');
                  return sb.toString();
              }
          }
      }, {
          key: 'targetPath',
          get: function get$$1() {
              if (this._targetPath != null && this._targetPath.isRelative) {
                  var targetObj = this.targetPointer.Resolve();
                  if (targetObj) {
                      this._targetPath = targetObj.path;
                  }
              }
              return this._targetPath;
          },
          set: function set$$1(value) {
              this._targetPath = value;
              this._targetPointer = Pointer.Null;
          }
      }, {
          key: 'targetPointer',
          get: function get$$1() {
              if (this._targetPointer.isNull) {
                  var targetObj = this.ResolvePath(this._targetPath).obj;
                  if (this._targetPath === null) return throwNullException('this._targetPath');
                  if (this._targetPath.lastComponent === null) return throwNullException('this._targetPath.lastComponent');
                  if (this._targetPath.lastComponent.isIndex) {
                      if (targetObj === null) return throwNullException('targetObj');
                      this._targetPointer.container = targetObj.parent instanceof Container ? targetObj.parent : null;
                      this._targetPointer.index = this._targetPath.lastComponent.index;
                  } else {
                      this._targetPointer = Pointer.StartOf(targetObj instanceof Container ? targetObj : null);
                  }
              }
              return this._targetPointer.copy();
          }
      }, {
          key: 'targetPathString',
          get: function get$$1() {
              if (this.targetPath == null) return null;
              return this.CompactPathString(this.targetPath);
          },
          set: function set$$1(value) {
              if (value == null) {
                  this.targetPath = null;
              } else {
                  this.targetPath = new Path(value);
              }
          }
      }, {
          key: 'hasVariableTarget',
          get: function get$$1() {
              return this.variableDivertName != null;
          }
      }]);
      return Divert;
  }(InkObject);

  var ChoicePoint = function (_InkObject) {
      inherits(ChoicePoint, _InkObject);

      function ChoicePoint() {
          var onceOnly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
          classCallCheck(this, ChoicePoint);

          var _this = possibleConstructorReturn(this, (ChoicePoint.__proto__ || Object.getPrototypeOf(ChoicePoint)).call(this));

          _this._pathOnChoice = null;
          _this.hasCondition = false;
          _this.hasStartContent = false;
          _this.hasChoiceOnlyContent = false;
          _this.isInvisibleDefault = false;
          _this.onceOnly = true;
          _this.onceOnly = onceOnly;
          return _this;
      }

      createClass(ChoicePoint, [{
          key: 'toString',
          value: function toString() {
              if (this.pathOnChoice === null) return throwNullException('ChoicePoint.pathOnChoice');
              var targetString = this.pathOnChoice.toString();
              return 'Choice: -> ' + targetString;
          }
      }, {
          key: 'pathOnChoice',
          get: function get$$1() {
              if (this._pathOnChoice != null && this._pathOnChoice.isRelative) {
                  var choiceTargetObj = this.choiceTarget;
                  if (choiceTargetObj) {
                      this._pathOnChoice = choiceTargetObj.path;
                  }
              }
              return this._pathOnChoice;
          },
          set: function set$$1(value) {
              this._pathOnChoice = value;
          }
      }, {
          key: 'choiceTarget',
          get: function get$$1() {
              if (this._pathOnChoice === null) return throwNullException('ChoicePoint._pathOnChoice');
              return this.ResolvePath(this._pathOnChoice).container;
          }
      }, {
          key: 'pathStringOnChoice',
          get: function get$$1() {
              if (this.pathOnChoice === null) return throwNullException('ChoicePoint.pathOnChoice');
              return this.CompactPathString(this.pathOnChoice);
          },
          set: function set$$1(value) {
              this.pathOnChoice = new Path(value);
          }
      }, {
          key: 'flags',
          get: function get$$1() {
              var flags = 0;
              if (this.hasCondition) flags |= 1;
              if (this.hasStartContent) flags |= 2;
              if (this.hasChoiceOnlyContent) flags |= 4;
              if (this.isInvisibleDefault) flags |= 8;
              if (this.onceOnly) flags |= 16;
              return flags;
          },
          set: function set$$1(value) {
              this.hasCondition = (value & 1) > 0;
              this.hasStartContent = (value & 2) > 0;
              this.hasChoiceOnlyContent = (value & 4) > 0;
              this.isInvisibleDefault = (value & 8) > 0;
              this.onceOnly = (value & 16) > 0;
          }
      }]);
      return ChoicePoint;
  }(InkObject);

  var VariableReference = function (_InkObject) {
      inherits(VariableReference, _InkObject);

      function VariableReference() {
          var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
          classCallCheck(this, VariableReference);

          var _this = possibleConstructorReturn(this, (VariableReference.__proto__ || Object.getPrototypeOf(VariableReference)).call(this));

          _this.pathForCount = null;
          _this.name = name;
          return _this;
      }

      createClass(VariableReference, [{
          key: 'toString',
          value: function toString() {
              if (this.name != null) {
                  return 'var(' + this.name + ')';
              } else {
                  var pathStr = this.pathStringForCount;
                  return 'read_count(' + pathStr + ')';
              }
          }
      }, {
          key: 'containerForCount',
          get: function get$$1() {
              if (this.pathForCount === null) return null;
              return this.ResolvePath(this.pathForCount).container;
          }
      }, {
          key: 'pathStringForCount',
          get: function get$$1() {
              if (this.pathForCount === null) return null;
              return this.CompactPathString(this.pathForCount);
          },
          set: function set$$1(value) {
              if (value === null) this.pathForCount = null;else this.pathForCount = new Path(value);
          }
      }]);
      return VariableReference;
  }(InkObject);

  var VariableAssignment = function (_InkObject) {
      inherits(VariableAssignment, _InkObject);

      function VariableAssignment(variableName, isNewDeclaration) {
          classCallCheck(this, VariableAssignment);

          var _this = possibleConstructorReturn(this, (VariableAssignment.__proto__ || Object.getPrototypeOf(VariableAssignment)).call(this));

          _this.variableName = variableName || null;
          _this.isNewDeclaration = !!isNewDeclaration;
          _this.isGlobal = false;
          return _this;
      }

      createClass(VariableAssignment, [{
          key: 'toString',
          value: function toString() {
              return 'VarAssign to ' + this.variableName;
          }
      }]);
      return VariableAssignment;
  }(InkObject);

  var Void = function (_InkObject) {
    inherits(Void, _InkObject);

    function Void() {
      classCallCheck(this, Void);
      return possibleConstructorReturn(this, (Void.__proto__ || Object.getPrototypeOf(Void)).apply(this, arguments));
    }

    return Void;
  }(InkObject);

  var NativeFunctionCall = function (_InkObject) {
      inherits(NativeFunctionCall, _InkObject);

      function NativeFunctionCall() {
          classCallCheck(this, NativeFunctionCall);

          var _this = possibleConstructorReturn(this, (NativeFunctionCall.__proto__ || Object.getPrototypeOf(NativeFunctionCall)).call(this));

          _this._name = null;
          _this._numberOfParameters = 0;
          _this._prototype = null;
          _this._isPrototype = false;
          _this._operationFuncs = null;
          if (arguments.length === 0) {
              NativeFunctionCall.GenerateNativeFunctionsIfNecessary();
          } else if (arguments.length === 1) {
              var name = arguments[0];
              NativeFunctionCall.GenerateNativeFunctionsIfNecessary();
              _this.name = name;
          } else if (arguments.length === 2) {
              var _name = arguments[0];
              var numberOfParameters = arguments[1];
              _this._isPrototype = true;
              _this.name = _name;
              _this.numberOfParameters = numberOfParameters;
          }
          return _this;
      }
      // tslint:enable:variable-name


      createClass(NativeFunctionCall, [{
          key: 'Call',
          value: function Call(parameters) {
              if (this._prototype) {
                  return this._prototype.Call(parameters);
              }
              if (this.numberOfParameters != parameters.length) {
                  throw new Error('Unexpected number of parameters');
              }
              var hasList = false;
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = parameters[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var p = _step.value;

                      if (p instanceof Void) throw new StoryException('Attempting to perform operation on a void value. Did you forget to "return" a value from a function you called here?');
                      if (p instanceof ListValue) hasList = true;
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }

              if (parameters.length == 2 && hasList) {
                  return this.CallBinaryListOperation(parameters);
              }
              var coercedParams = this.CoerceValuesToSingleType(parameters);
              var coercedType = coercedParams[0].valueType;
              if (coercedType == ValueType.Int) {
                  return this.CallType(coercedParams);
              } else if (coercedType == ValueType.Float) {
                  return this.CallType(coercedParams);
              } else if (coercedType == ValueType.String) {
                  return this.CallType(coercedParams);
              } else if (coercedType == ValueType.DivertTarget) {
                  return this.CallType(coercedParams);
              } else if (coercedType == ValueType.List) {
                  return this.CallType(coercedParams);
              }
              return null;
          }
      }, {
          key: 'CallType',
          value: function CallType(parametersOfSingleType) {
              var param1 = asOrThrows(parametersOfSingleType[0], Value);
              var valType = param1.valueType;
              var val1 = param1;
              var paramCount = parametersOfSingleType.length;
              if (paramCount == 2 || paramCount == 1) {
                  if (this._operationFuncs === null) return throwNullException('NativeFunctionCall._operationFuncs');
                  var opForTypeObj = this._operationFuncs.get(valType);
                  if (!opForTypeObj) {
                      throw new StoryException('Cannot perform operation ' + this.name + ' on ' + valType);
                  }
                  if (paramCount == 2) {
                      var param2 = asOrThrows(parametersOfSingleType[1], Value);
                      var val2 = param2;
                      var opForType = opForTypeObj;
                      if (val1.value === null || val2.value === null) return throwNullException('NativeFunctionCall.Call BinaryOp values');
                      var resultVal = opForType(val1.value, val2.value);
                      return Value.Create(resultVal);
                  } else {
                      var _opForType = opForTypeObj;
                      if (val1.value === null) return throwNullException('NativeFunctionCall.Call UnaryOp value');
                      var _resultVal = _opForType(val1.value);
                      return Value.Create(_resultVal);
                  }
              } else {
                  throw new Error('Unexpected number of parameters to NativeFunctionCall: ' + parametersOfSingleType.length);
              }
          }
      }, {
          key: 'CallBinaryListOperation',
          value: function CallBinaryListOperation(parameters) {
              if ((this.name == '+' || this.name == '-') && parameters[0] instanceof ListValue && parameters[1] instanceof IntValue) return this.CallListIncrementOperation(parameters);
              var v1 = asOrThrows(parameters[0], Value);
              var v2 = asOrThrows(parameters[1], Value);
              if ((this.name == '&&' || this.name == '||') && (v1.valueType != ValueType.List || v2.valueType != ValueType.List)) {
                  if (this._operationFuncs === null) return throwNullException('NativeFunctionCall._operationFuncs');
                  var op = this._operationFuncs.get(ValueType.Int);
                  if (op === null) return throwNullException('NativeFunctionCall.CallBinaryListOperation op');
                  var result = op(v1.isTruthy ? 1 : 0, v2.isTruthy ? 1 : 0);
                  return new IntValue(result);
              }
              if (v1.valueType == ValueType.List && v2.valueType == ValueType.List) return this.CallType([v1, v2]);
              throw new StoryException('Can not call use ' + this.name + ' operation on ' + v1.valueType + ' and ' + v2.valueType);
          }
      }, {
          key: 'CallListIncrementOperation',
          value: function CallListIncrementOperation(listIntParams) {
              var listVal = asOrThrows(listIntParams[0], ListValue);
              var intVal = asOrThrows(listIntParams[1], IntValue);
              var resultInkList = new InkList();
              if (listVal.value === null) return throwNullException('NativeFunctionCall.CallListIncrementOperation listVal.value');
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                  for (var _iterator2 = listVal.value[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var _ref = _step2.value;

                      var _ref2 = slicedToArray(_ref, 2);

                      var listItemKey = _ref2[0];
                      var listItemValue = _ref2[1];

                      var listItem = InkListItem.fromSerializedKey(listItemKey);
                      if (this._operationFuncs === null) return throwNullException('NativeFunctionCall._operationFuncs');
                      var intOp = this._operationFuncs.get(ValueType.Int);
                      if (intVal.value === null) return throwNullException('NativeFunctionCall.CallListIncrementOperation intVal.value');
                      var targetInt = intOp(listItemValue, intVal.value);
                      var itemOrigin = null;
                      if (listVal.value.origins === null) return throwNullException('NativeFunctionCall.CallListIncrementOperation listVal.value.origins');
                      var _iteratorNormalCompletion3 = true;
                      var _didIteratorError3 = false;
                      var _iteratorError3 = undefined;

                      try {
                          for (var _iterator3 = listVal.value.origins[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                              var origin = _step3.value;

                              if (origin.name == listItem.originName) {
                                  itemOrigin = origin;
                                  break;
                              }
                          }
                      } catch (err) {
                          _didIteratorError3 = true;
                          _iteratorError3 = err;
                      } finally {
                          try {
                              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                  _iterator3.return();
                              }
                          } finally {
                              if (_didIteratorError3) {
                                  throw _iteratorError3;
                              }
                          }
                      }

                      if (itemOrigin != null) {
                          var incrementedItem = itemOrigin.TryGetItemWithValue(targetInt, InkListItem.Null);
                          if (incrementedItem.exists) resultInkList.Add(incrementedItem.result, targetInt);
                      }
                  }
              } catch (err) {
                  _didIteratorError2 = true;
                  _iteratorError2 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                          _iterator2.return();
                      }
                  } finally {
                      if (_didIteratorError2) {
                          throw _iteratorError2;
                      }
                  }
              }

              return new ListValue(resultInkList);
          }
      }, {
          key: 'CoerceValuesToSingleType',
          value: function CoerceValuesToSingleType(parametersIn) {
              var valType = ValueType.Int;
              var specialCaseList = null;
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                  for (var _iterator4 = parametersIn[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                      var obj = _step4.value;

                      var val = asOrThrows(obj, Value);
                      if (val.valueType > valType) {
                          valType = val.valueType;
                      }
                      if (val.valueType == ValueType.List) {
                          specialCaseList = asOrNull(val, ListValue);
                      }
                  }
              } catch (err) {
                  _didIteratorError4 = true;
                  _iteratorError4 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion4 && _iterator4.return) {
                          _iterator4.return();
                      }
                  } finally {
                      if (_didIteratorError4) {
                          throw _iteratorError4;
                      }
                  }
              }

              var parametersOut = [];
              if (ValueType[valType] == ValueType[ValueType.List]) {
                  var _iteratorNormalCompletion5 = true;
                  var _didIteratorError5 = false;
                  var _iteratorError5 = undefined;

                  try {
                      for (var _iterator5 = parametersIn[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                          var inkObjectVal = _step5.value;

                          var val = asOrThrows(inkObjectVal, Value);
                          if (val.valueType == ValueType.List) {
                              parametersOut.push(val);
                          } else if (val.valueType == ValueType.Int) {
                              var intVal = parseInt(val.valueObject);
                              specialCaseList = asOrThrows(specialCaseList, ListValue);
                              if (specialCaseList.value === null) return throwNullException('NativeFunctionCall.CoerceValuesToSingleType specialCaseList.value');
                              var list = specialCaseList.value.originOfMaxItem;
                              if (list === null) return throwNullException('NativeFunctionCall.CoerceValuesToSingleType list');
                              var item = list.TryGetItemWithValue(intVal, InkListItem.Null);
                              if (item.exists) {
                                  var castedValue = new ListValue(item.result, intVal);
                                  parametersOut.push(castedValue);
                              } else throw new StoryException('Could not find List item with the value ' + intVal + ' in ' + list.name);
                          } else throw new StoryException('Cannot mix Lists and ' + val.valueType + ' values in this operation');
                      }
                  } catch (err) {
                      _didIteratorError5 = true;
                      _iteratorError5 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion5 && _iterator5.return) {
                              _iterator5.return();
                          }
                      } finally {
                          if (_didIteratorError5) {
                              throw _iteratorError5;
                          }
                      }
                  }
              } else {
                  var _iteratorNormalCompletion6 = true;
                  var _didIteratorError6 = false;
                  var _iteratorError6 = undefined;

                  try {
                      for (var _iterator6 = parametersIn[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                          var _inkObjectVal = _step6.value;

                          var _val = asOrThrows(_inkObjectVal, Value);
                          var _castedValue = _val.Cast(valType);
                          parametersOut.push(_castedValue);
                      }
                  } catch (err) {
                      _didIteratorError6 = true;
                      _iteratorError6 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion6 && _iterator6.return) {
                              _iterator6.return();
                          }
                      } finally {
                          if (_didIteratorError6) {
                              throw _iteratorError6;
                          }
                      }
                  }
              }
              return parametersOut;
          }
      }, {
          key: 'AddOpFuncForType',
          value: function AddOpFuncForType(valType, op) {
              if (this._operationFuncs == null) {
                  this._operationFuncs = new Map();
              }
              this._operationFuncs.set(valType, op);
          }
      }, {
          key: 'toString',
          value: function toString() {
              return 'Native "' + this.name + '"';
          }
      }, {
          key: 'name',
          get: function get$$1() {
              if (this._name === null) return throwNullException('NativeFunctionCall._name');
              return this._name;
          },
          set: function set$$1(value) {
              this._name = value;
              if (!this._isPrototype) {
                  if (NativeFunctionCall._nativeFunctions === null) throwNullException('NativeFunctionCall._nativeFunctions');else this._prototype = NativeFunctionCall._nativeFunctions.get(this._name) || null;
              }
          }
      }, {
          key: 'numberOfParameters',
          get: function get$$1() {
              if (this._prototype) {
                  return this._prototype.numberOfParameters;
              } else {
                  return this._numberOfParameters;
              }
          },
          set: function set$$1(value) {
              this._numberOfParameters = value;
          }
      }], [{
          key: 'CallWithName',
          value: function CallWithName(functionName) {
              return new NativeFunctionCall(functionName);
          }
      }, {
          key: 'CallExistsWithName',
          value: function CallExistsWithName(functionName) {
              this.GenerateNativeFunctionsIfNecessary();
              return this._nativeFunctions.get(functionName);
          }
      }, {
          key: 'Identity',
          value: function Identity(t) {
              return t;
          }
      }, {
          key: 'GenerateNativeFunctionsIfNecessary',
          value: function GenerateNativeFunctionsIfNecessary() {
              if (this._nativeFunctions == null) {
                  this._nativeFunctions = new Map();
                  // Int operations
                  this.AddIntBinaryOp(this.Add, function (x, y) {
                      return x + y;
                  });
                  this.AddIntBinaryOp(this.Subtract, function (x, y) {
                      return x - y;
                  });
                  this.AddIntBinaryOp(this.Multiply, function (x, y) {
                      return x * y;
                  });
                  this.AddIntBinaryOp(this.Divide, function (x, y) {
                      return Math.round(x / y);
                  });
                  this.AddIntBinaryOp(this.Mod, function (x, y) {
                      return x % y;
                  });
                  this.AddIntUnaryOp(this.Negate, function (x) {
                      return -x;
                  });
                  this.AddIntBinaryOp(this.Equal, function (x, y) {
                      return x == y ? 1 : 0;
                  });
                  this.AddIntBinaryOp(this.Greater, function (x, y) {
                      return x > y ? 1 : 0;
                  });
                  this.AddIntBinaryOp(this.Less, function (x, y) {
                      return x < y ? 1 : 0;
                  });
                  this.AddIntBinaryOp(this.GreaterThanOrEquals, function (x, y) {
                      return x >= y ? 1 : 0;
                  });
                  this.AddIntBinaryOp(this.LessThanOrEquals, function (x, y) {
                      return x <= y ? 1 : 0;
                  });
                  this.AddIntBinaryOp(this.NotEquals, function (x, y) {
                      return x != y ? 1 : 0;
                  });
                  this.AddIntUnaryOp(this.Not, function (x) {
                      return x == 0 ? 1 : 0;
                  });
                  this.AddIntBinaryOp(this.And, function (x, y) {
                      return x != 0 && y != 0 ? 1 : 0;
                  });
                  this.AddIntBinaryOp(this.Or, function (x, y) {
                      return x != 0 || y != 0 ? 1 : 0;
                  });
                  this.AddIntBinaryOp(this.Max, function (x, y) {
                      return Math.max(x, y);
                  });
                  this.AddIntBinaryOp(this.Min, function (x, y) {
                      return Math.min(x, y);
                  });
                  this.AddIntBinaryOp(this.Pow, function (x, y) {
                      return Math.pow(x, y);
                  });
                  this.AddIntUnaryOp(this.Floor, NativeFunctionCall.Identity);
                  this.AddIntUnaryOp(this.Ceiling, NativeFunctionCall.Identity);
                  this.AddIntUnaryOp(this.Int, NativeFunctionCall.Identity);
                  this.AddIntUnaryOp(this.Float, function (x) {
                      return x;
                  });
                  // Float operations
                  this.AddFloatBinaryOp(this.Add, function (x, y) {
                      return x + y;
                  });
                  this.AddFloatBinaryOp(this.Subtract, function (x, y) {
                      return x - y;
                  });
                  this.AddFloatBinaryOp(this.Multiply, function (x, y) {
                      return x * y;
                  });
                  this.AddFloatBinaryOp(this.Divide, function (x, y) {
                      return x / y;
                  });
                  this.AddFloatBinaryOp(this.Mod, function (x, y) {
                      return x % y;
                  });
                  this.AddFloatUnaryOp(this.Negate, function (x) {
                      return -x;
                  });
                  this.AddFloatBinaryOp(this.Equal, function (x, y) {
                      return x == y ? 1 : 0;
                  });
                  this.AddFloatBinaryOp(this.Greater, function (x, y) {
                      return x > y ? 1 : 0;
                  });
                  this.AddFloatBinaryOp(this.Less, function (x, y) {
                      return x < y ? 1 : 0;
                  });
                  this.AddFloatBinaryOp(this.GreaterThanOrEquals, function (x, y) {
                      return x >= y ? 1 : 0;
                  });
                  this.AddFloatBinaryOp(this.LessThanOrEquals, function (x, y) {
                      return x <= y ? 1 : 0;
                  });
                  this.AddFloatBinaryOp(this.NotEquals, function (x, y) {
                      return x != y ? 1 : 0;
                  });
                  this.AddFloatUnaryOp(this.Not, function (x) {
                      return x == 0.0 ? 1 : 0;
                  });
                  this.AddFloatBinaryOp(this.And, function (x, y) {
                      return x != 0.0 && y != 0.0 ? 1 : 0;
                  });
                  this.AddFloatBinaryOp(this.Or, function (x, y) {
                      return x != 0.0 || y != 0.0 ? 1 : 0;
                  });
                  this.AddFloatBinaryOp(this.Max, function (x, y) {
                      return Math.max(x, y);
                  });
                  this.AddFloatBinaryOp(this.Min, function (x, y) {
                      return Math.min(x, y);
                  });
                  this.AddFloatBinaryOp(this.Pow, function (x, y) {
                      return Math.pow(x, y);
                  });
                  this.AddFloatUnaryOp(this.Floor, function (x) {
                      return Math.floor(x);
                  });
                  this.AddFloatUnaryOp(this.Ceiling, function (x) {
                      return Math.ceil(x);
                  });
                  this.AddFloatUnaryOp(this.Int, function (x) {
                      return Math.floor(x);
                  });
                  this.AddFloatUnaryOp(this.Float, NativeFunctionCall.Identity);
                  // String operations
                  this.AddStringBinaryOp(this.Add, function (x, y) {
                      return x + y;
                  }); // concat
                  this.AddStringBinaryOp(this.Equal, function (x, y) {
                      return x === y ? 1 : 0;
                  });
                  this.AddStringBinaryOp(this.NotEquals, function (x, y) {
                      return !(x === y) ? 1 : 0;
                  });
                  this.AddStringBinaryOp(this.Has, function (x, y) {
                      return x.includes(y) ? 1 : 0;
                  });
                  this.AddStringBinaryOp(this.Hasnt, function (x, y) {
                      return x.includes(y) ? 0 : 1;
                  });
                  this.AddListBinaryOp(this.Add, function (x, y) {
                      return x.Union(y);
                  });
                  this.AddListBinaryOp(this.Subtract, function (x, y) {
                      return x.Without(y);
                  });
                  this.AddListBinaryOp(this.Has, function (x, y) {
                      return x.Contains(y) ? 1 : 0;
                  });
                  this.AddListBinaryOp(this.Hasnt, function (x, y) {
                      return x.Contains(y) ? 0 : 1;
                  });
                  this.AddListBinaryOp(this.Intersect, function (x, y) {
                      return x.Intersect(y);
                  });
                  this.AddListBinaryOp(this.Equal, function (x, y) {
                      return x.Equals(y) ? 1 : 0;
                  });
                  this.AddListBinaryOp(this.Greater, function (x, y) {
                      return x.GreaterThan(y) ? 1 : 0;
                  });
                  this.AddListBinaryOp(this.Less, function (x, y) {
                      return x.LessThan(y) ? 1 : 0;
                  });
                  this.AddListBinaryOp(this.GreaterThanOrEquals, function (x, y) {
                      return x.GreaterThanOrEquals(y) ? 1 : 0;
                  });
                  this.AddListBinaryOp(this.LessThanOrEquals, function (x, y) {
                      return x.LessThanOrEquals(y) ? 1 : 0;
                  });
                  this.AddListBinaryOp(this.NotEquals, function (x, y) {
                      return !x.Equals(y) ? 1 : 0;
                  });
                  this.AddListBinaryOp(this.And, function (x, y) {
                      return x.Count > 0 && y.Count > 0 ? 1 : 0;
                  });
                  this.AddListBinaryOp(this.Or, function (x, y) {
                      return x.Count > 0 || y.Count > 0 ? 1 : 0;
                  });
                  this.AddListUnaryOp(this.Not, function (x) {
                      return x.Count == 0 ? 1 : 0;
                  });
                  this.AddListUnaryOp(this.Invert, function (x) {
                      return x.inverse;
                  });
                  this.AddListUnaryOp(this.All, function (x) {
                      return x.all;
                  });
                  this.AddListUnaryOp(this.ListMin, function (x) {
                      return x.MinAsList();
                  });
                  this.AddListUnaryOp(this.ListMax, function (x) {
                      return x.MaxAsList();
                  });
                  this.AddListUnaryOp(this.Count, function (x) {
                      return x.Count;
                  });
                  this.AddListUnaryOp(this.ValueOfList, function (x) {
                      return x.maxItem.Value;
                  });
                  var divertTargetsEqual = function divertTargetsEqual(d1, d2) {
                      return d1.Equals(d2) ? 1 : 0;
                  };
                  var divertTargetsNotEqual = function divertTargetsNotEqual(d1, d2) {
                      return d1.Equals(d2) ? 0 : 1;
                  };
                  this.AddOpToNativeFunc(this.Equal, 2, ValueType.DivertTarget, divertTargetsEqual);
                  this.AddOpToNativeFunc(this.NotEquals, 2, ValueType.DivertTarget, divertTargetsNotEqual);
              }
          }
      }, {
          key: 'AddOpToNativeFunc',
          value: function AddOpToNativeFunc(name, args, valType, op) {
              if (this._nativeFunctions === null) return throwNullException('NativeFunctionCall._nativeFunctions');
              var nativeFunc = this._nativeFunctions.get(name);
              if (!nativeFunc) {
                  nativeFunc = new NativeFunctionCall(name, args);
                  this._nativeFunctions.set(name, nativeFunc);
              }
              nativeFunc.AddOpFuncForType(valType, op);
          }
      }, {
          key: 'AddIntBinaryOp',
          value: function AddIntBinaryOp(name, op) {
              this.AddOpToNativeFunc(name, 2, ValueType.Int, op);
          }
      }, {
          key: 'AddIntUnaryOp',
          value: function AddIntUnaryOp(name, op) {
              this.AddOpToNativeFunc(name, 1, ValueType.Int, op);
          }
      }, {
          key: 'AddFloatBinaryOp',
          value: function AddFloatBinaryOp(name, op) {
              this.AddOpToNativeFunc(name, 2, ValueType.Float, op);
          }
      }, {
          key: 'AddFloatUnaryOp',
          value: function AddFloatUnaryOp(name, op) {
              this.AddOpToNativeFunc(name, 1, ValueType.Float, op);
          }
      }, {
          key: 'AddStringBinaryOp',
          value: function AddStringBinaryOp(name, op) {
              this.AddOpToNativeFunc(name, 2, ValueType.String, op);
          }
      }, {
          key: 'AddListBinaryOp',
          value: function AddListBinaryOp(name, op) {
              this.AddOpToNativeFunc(name, 2, ValueType.List, op);
          }
      }, {
          key: 'AddListUnaryOp',
          value: function AddListUnaryOp(name, op) {
              this.AddOpToNativeFunc(name, 1, ValueType.List, op);
          }
      }]);
      return NativeFunctionCall;
  }(InkObject);
  // tslint:disable:variable-name
  NativeFunctionCall.Add = '+';
  NativeFunctionCall.Subtract = '-';
  NativeFunctionCall.Divide = '/';
  NativeFunctionCall.Multiply = '*';
  NativeFunctionCall.Mod = '%';
  NativeFunctionCall.Negate = '_';
  NativeFunctionCall.Equal = '==';
  NativeFunctionCall.Greater = '>';
  NativeFunctionCall.Less = '<';
  NativeFunctionCall.GreaterThanOrEquals = '>=';
  NativeFunctionCall.LessThanOrEquals = '<=';
  NativeFunctionCall.NotEquals = '!=';
  NativeFunctionCall.Not = '!';
  NativeFunctionCall.And = '&&';
  NativeFunctionCall.Or = '||';
  NativeFunctionCall.Min = 'MIN';
  NativeFunctionCall.Max = 'MAX';
  NativeFunctionCall.Pow = 'POW';
  NativeFunctionCall.Floor = 'FLOOR';
  NativeFunctionCall.Ceiling = 'CEILING';
  NativeFunctionCall.Int = 'INT';
  NativeFunctionCall.Float = 'FLOAT';
  NativeFunctionCall.Has = '?';
  NativeFunctionCall.Hasnt = '!?';
  NativeFunctionCall.Intersect = '^';
  NativeFunctionCall.ListMin = 'LIST_MIN';
  NativeFunctionCall.ListMax = 'LIST_MAX';
  NativeFunctionCall.All = 'LIST_ALL';
  NativeFunctionCall.Count = 'LIST_COUNT';
  NativeFunctionCall.ValueOfList = 'LIST_VALUE';
  NativeFunctionCall.Invert = 'LIST_INVERT';
  NativeFunctionCall._nativeFunctions = null;

  var Tag = function (_InkObject) {
      inherits(Tag, _InkObject);

      function Tag(tagText) {
          classCallCheck(this, Tag);

          var _this = possibleConstructorReturn(this, (Tag.__proto__ || Object.getPrototypeOf(Tag)).call(this));

          _this.text = tagText.toString() || '';
          return _this;
      }

      createClass(Tag, [{
          key: 'toString',
          value: function toString() {
              return '# ' + this.text;
          }
      }]);
      return Tag;
  }(InkObject);

  var Choice = function (_InkObject) {
      inherits(Choice, _InkObject);

      function Choice() {
          classCallCheck(this, Choice);

          var _this = possibleConstructorReturn(this, (Choice.__proto__ || Object.getPrototypeOf(Choice)).apply(this, arguments));

          _this.text = '';
          _this.index = 0;
          _this.threadAtGeneration = null;
          _this.sourcePath = '';
          _this.targetPath = null;
          _this.isInvisibleDefault = false;
          _this.originalThreadIndex = 0;
          return _this;
      }

      createClass(Choice, [{
          key: 'pathStringOnChoice',
          get: function get$$1() {
              if (this.targetPath === null) return throwNullException('Choice.targetPath');
              return this.targetPath.toString();
          },
          set: function set$$1(value) {
              this.targetPath = new Path(value);
          }
      }]);
      return Choice;
  }(InkObject);

  var ListDefinition = function () {
      function ListDefinition(name, items) {
          classCallCheck(this, ListDefinition);

          this._name = name || '';
          this._items = null;
          this._itemNameToValues = items || new Map();
      }

      createClass(ListDefinition, [{
          key: 'ValueForItem',
          value: function ValueForItem(item) {
              if (!item.itemName) return 0;
              var intVal = this._itemNameToValues.get(item.itemName);
              if (typeof intVal !== 'undefined') return intVal;else return 0;
          }
      }, {
          key: 'ContainsItem',
          value: function ContainsItem(item) {
              if (!item.itemName) return false;
              if (item.originName != this.name) return false;
              return this._itemNameToValues.has(item.itemName);
          }
      }, {
          key: 'ContainsItemWithName',
          value: function ContainsItemWithName(itemName) {
              return this._itemNameToValues.has(itemName);
          }
      }, {
          key: 'TryGetItemWithValue',
          value: function TryGetItemWithValue(val, /* out */item) {
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = this._itemNameToValues[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var _ref = _step.value;

                      var _ref2 = slicedToArray(_ref, 2);

                      var key = _ref2[0];
                      var value = _ref2[1];

                      if (value == val) {
                          item = new InkListItem(this.name, key);
                          return { result: item, exists: true };
                      }
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }

              item = InkListItem.Null;
              return { result: item, exists: false };
          }
      }, {
          key: 'TryGetValueForItem',
          value: function TryGetValueForItem(item, /* out */intVal) {
              if (!item.itemName) return { result: 0, exists: false };
              var value = this._itemNameToValues.get(item.itemName);
              if (!value) return { result: 0, exists: false };
              return { result: value, exists: true };
          }
      }, {
          key: 'name',
          get: function get$$1() {
              return this._name;
          }
      }, {
          key: 'items',
          get: function get$$1() {
              if (this._items == null) {
                  this._items = new Map();
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {
                      for (var _iterator2 = this._itemNameToValues[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                          var _ref3 = _step2.value;

                          var _ref4 = slicedToArray(_ref3, 2);

                          var key = _ref4[0];
                          var value = _ref4[1];

                          var item = new InkListItem(this.name, key);
                          this._items.set(item.serialized(), value);
                      }
                  } catch (err) {
                      _didIteratorError2 = true;
                      _iteratorError2 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion2 && _iterator2.return) {
                              _iterator2.return();
                          }
                      } finally {
                          if (_didIteratorError2) {
                              throw _iteratorError2;
                          }
                      }
                  }
              }
              return this._items;
          }
      }]);
      return ListDefinition;
  }();

  var ListDefinitionsOrigin = function () {
      function ListDefinitionsOrigin(lists) {
          classCallCheck(this, ListDefinitionsOrigin);

          this._lists = new Map();
          this._allUnambiguousListValueCache = new Map();
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
              for (var _iterator = lists[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var list = _step.value;

                  this._lists.set(list.name, list);
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {
                      for (var _iterator2 = list.items[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                          var _ref = _step2.value;

                          var _ref2 = slicedToArray(_ref, 2);

                          var key = _ref2[0];
                          var val = _ref2[1];

                          var item = InkListItem.fromSerializedKey(key);
                          var listValue = new ListValue(item, val);
                          if (!item.itemName) {
                              throw new Error('item.itemName is null or undefined.');
                          }
                          this._allUnambiguousListValueCache.set(item.itemName, listValue);
                          this._allUnambiguousListValueCache.set(item.fullName, listValue);
                      }
                  } catch (err) {
                      _didIteratorError2 = true;
                      _iteratorError2 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion2 && _iterator2.return) {
                              _iterator2.return();
                          }
                      } finally {
                          if (_didIteratorError2) {
                              throw _iteratorError2;
                          }
                      }
                  }
              }
          } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
          } finally {
              try {
                  if (!_iteratorNormalCompletion && _iterator.return) {
                      _iterator.return();
                  }
              } finally {
                  if (_didIteratorError) {
                      throw _iteratorError;
                  }
              }
          }
      }

      createClass(ListDefinitionsOrigin, [{
          key: 'TryListGetDefinition',
          value: function TryListGetDefinition(name, /* out */def) {
              if (name === null) {
                  return { result: def, exists: false };
              }
              // initially, this function returns a boolean and the second parameter is an out.
              var definition = this._lists.get(name);
              if (!definition) return { result: def, exists: false };
              return { result: definition, exists: true };
          }
      }, {
          key: 'FindSingleItemListWithName',
          value: function FindSingleItemListWithName(name) {
              if (name === null) {
                  return throwNullException('name');
              }
              var val = this._allUnambiguousListValueCache.get(name);
              if (typeof val !== 'undefined') {
                  return val;
              }
              return null;
          }
      }, {
          key: 'lists',
          get: function get$$1() {
              var listOfLists = [];
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                  for (var _iterator3 = this._lists[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var _ref3 = _step3.value;

                      var _ref4 = slicedToArray(_ref3, 2);

                      var key = _ref4[0];
                      var value = _ref4[1];

                      listOfLists.push(value);
                  }
              } catch (err) {
                  _didIteratorError3 = true;
                  _iteratorError3 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return) {
                          _iterator3.return();
                      }
                  } finally {
                      if (_didIteratorError3) {
                          throw _iteratorError3;
                      }
                  }
              }

              return listOfLists;
          }
      }]);
      return ListDefinitionsOrigin;
  }();

  // tslint:disable no-conditional-assignment
  var JsonSerialisation = function () {
      function JsonSerialisation() {
          classCallCheck(this, JsonSerialisation);
      }

      createClass(JsonSerialisation, null, [{
          key: 'ListToJArray',
          value: function ListToJArray(serialisables) {
              var jArray = [];
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = serialisables[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var s = _step.value;

                      jArray.push(this.RuntimeObjectToJToken(s));
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }

              return jArray;
          }
      }, {
          key: 'JArrayToRuntimeObjList',
          value: function JArrayToRuntimeObjList(jArray) {
              var skipLast = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

              var count = jArray.length;
              if (skipLast) count--;
              var list = [];
              for (var i = 0; i < count; i++) {
                  var jTok = jArray[i];
                  var runtimeObj = this.JTokenToRuntimeObject(jTok);
                  if (runtimeObj === null) {
                      return throwNullException('runtimeObj');
                  }
                  list.push(runtimeObj);
              }
              return list;
          }
      }, {
          key: 'DictionaryRuntimeObjsToJObject',
          value: function DictionaryRuntimeObjsToJObject(dictionary) {
              var jsonObj = {};
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                  for (var _iterator2 = dictionary[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var _ref = _step2.value;

                      var _ref2 = slicedToArray(_ref, 2);

                      var key = _ref2[0];
                      var value = _ref2[1];

                      var runtimeObj = asOrNull(value, InkObject);
                      if (runtimeObj != null) jsonObj[key] = this.RuntimeObjectToJToken(runtimeObj);
                  }
              } catch (err) {
                  _didIteratorError2 = true;
                  _iteratorError2 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                          _iterator2.return();
                      }
                  } finally {
                      if (_didIteratorError2) {
                          throw _iteratorError2;
                      }
                  }
              }

              return jsonObj;
          }
      }, {
          key: 'JObjectToDictionaryRuntimeObjs',
          value: function JObjectToDictionaryRuntimeObjs(jObject) {
              var dict = new Map();
              for (var key in jObject) {
                  if (jObject.hasOwnProperty(key)) {
                      var inkObject = this.JTokenToRuntimeObject(jObject[key]);
                      if (inkObject === null) {
                          return throwNullException('inkObject');
                      }
                      dict.set(key, inkObject);
                  }
              }
              return dict;
          }
      }, {
          key: 'JObjectToIntDictionary',
          value: function JObjectToIntDictionary(jObject) {
              var dict = new Map();
              for (var key in jObject) {
                  if (jObject.hasOwnProperty(key)) {
                      dict.set(key, parseInt(jObject[key]));
                  }
              }
              return dict;
          }
      }, {
          key: 'IntDictionaryToJObject',
          value: function IntDictionaryToJObject(dict) {
              var jObj = {};
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                  for (var _iterator3 = dict[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var _ref3 = _step3.value;

                      var _ref4 = slicedToArray(_ref3, 2);

                      var key = _ref4[0];
                      var value = _ref4[1];

                      jObj[key] = asNumberOrThrows(value);
                  }
              } catch (err) {
                  _didIteratorError3 = true;
                  _iteratorError3 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return) {
                          _iterator3.return();
                      }
                  } finally {
                      if (_didIteratorError3) {
                          throw _iteratorError3;
                      }
                  }
              }

              return jObj;
          }
      }, {
          key: 'JTokenToRuntimeObject',
          value: function JTokenToRuntimeObject(token) {
              if (typeof token === 'number' && !isNaN(token)) {
                  return Value.Create(token);
              }
              if (typeof token === 'string') {
                  var str = token.toString();
                  // String value
                  var firstChar = str[0];
                  if (firstChar == '^') return new StringValue(str.substring(1));else if (firstChar == '\n' && str.length == 1) return new StringValue('\n');
                  // Glue
                  if (str == '<>') return new Glue();
                  // Control commands (would looking up in a hash set be faster?)
                  for (var i = 0; i < JsonSerialisation._controlCommandNames.length; ++i) {
                      var cmdName = JsonSerialisation._controlCommandNames[i];
                      if (str == cmdName) {
                          return new ControlCommand(i);
                      }
                  }
                  // Native functions
                  if (str == 'L^') str = '^';
                  if (NativeFunctionCall.CallExistsWithName(str)) return NativeFunctionCall.CallWithName(str);
                  // Pop
                  if (str == '->->') return ControlCommand.PopTunnel();else if (str == '~ret') return ControlCommand.PopFunction();
                  // Void
                  if (str == 'void') return new Void();
              }
              if ((typeof token === 'undefined' ? 'undefined' : _typeof(token)) === 'object' && token instanceof Array === false) {
                  var obj = token;
                  var propValue = void 0;
                  // Divert target value to path
                  if (obj['^->']) {
                      propValue = obj['^->'];
                      return new DivertTargetValue(new Path(propValue.toString()));
                  }
                  // VariablePointerValue
                  if (obj['^var']) {
                      propValue = obj['^var'];
                      var varPtr = new VariablePointerValue(propValue.toString());
                      if ('ci' in obj) {
                          propValue = obj['ci'];
                          varPtr.contextIndex = parseInt(propValue);
                      }
                      return varPtr;
                  }
                  // Divert
                  var isDivert = false;
                  var pushesToStack = false;
                  var divPushType = PushPopType.Function;
                  var external = false;
                  if (propValue = obj['->']) {
                      isDivert = true;
                  } else if (propValue = obj['f()']) {
                      isDivert = true;
                      pushesToStack = true;
                      divPushType = PushPopType.Function;
                  } else if (propValue = obj['->t->']) {
                      isDivert = true;
                      pushesToStack = true;
                      divPushType = PushPopType.Tunnel;
                  } else if (propValue = obj['x()']) {
                      isDivert = true;
                      external = true;
                      pushesToStack = false;
                      divPushType = PushPopType.Function;
                  }
                  if (isDivert) {
                      var divert = new Divert();
                      divert.pushesToStack = pushesToStack;
                      divert.stackPushType = divPushType;
                      divert.isExternal = external;
                      var target = propValue.toString();
                      if (propValue = obj['var']) divert.variableDivertName = target;else divert.targetPathString = target;
                      divert.isConditional = !!obj['c'];
                      if (external) {
                          if (propValue = obj['exArgs']) divert.externalArgs = parseInt(propValue);
                      }
                      return divert;
                  }
                  // Choice
                  if (propValue = obj['*']) {
                      var choice = new ChoicePoint();
                      choice.pathStringOnChoice = propValue.toString();
                      if (propValue = obj['flg']) choice.flags = parseInt(propValue);
                      return choice;
                  }
                  // Variable reference
                  if (propValue = obj['VAR?']) {
                      return new VariableReference(propValue.toString());
                  } else if (propValue = obj['CNT?']) {
                      var readCountVarRef = new VariableReference();
                      readCountVarRef.pathStringForCount = propValue.toString();
                      return readCountVarRef;
                  }
                  // Variable assignment
                  var isVarAss = false;
                  var isGlobalVar = false;
                  if (propValue = obj['VAR=']) {
                      isVarAss = true;
                      isGlobalVar = true;
                  } else if (propValue = obj['temp=']) {
                      isVarAss = true;
                      isGlobalVar = false;
                  }
                  if (isVarAss) {
                      var varName = propValue.toString();
                      var isNewDecl = !obj['re'];
                      var varAss = new VariableAssignment(varName, isNewDecl);
                      varAss.isGlobal = isGlobalVar;
                      return varAss;
                  }
                  if (obj['#'] !== undefined) {
                      propValue = obj['#'];
                      return new Tag(propValue.toString());
                  }
                  // List value
                  if (propValue = obj['list']) {
                      // var listContent = (Dictionary<string, object>)propValue;
                      var listContent = propValue;
                      var rawList = new InkList();
                      if (propValue = obj['origins']) {
                          // var namesAsObjs = (List<object>)propValue;
                          var namesAsObjs = propValue;
                          // rawList.SetInitialOriginNames(namesAsObjs.Cast<string>().ToList());
                          rawList.SetInitialOriginNames(namesAsObjs);
                      }
                      for (var key in listContent) {
                          if (listContent.hasOwnProperty(key)) {
                              var nameToVal = listContent[key];
                              var item = new InkListItem(key);
                              var val = parseInt(nameToVal);
                              rawList.Add(item, val);
                          }
                      }
                      return new ListValue(rawList);
                  }
                  if (obj['originalChoicePath'] != null) return this.JObjectToChoice(obj);
              }
              // Array is always a Runtime.Container
              if (token instanceof Array) {
                  return this.JArrayToContainer(token);
              }
              if (token === null || token === undefined) return null;
              throw new Error('Failed to convert token to runtime object: ' + JSON.stringify(token));
          }
      }, {
          key: 'RuntimeObjectToJToken',
          value: function RuntimeObjectToJToken(obj) {
              // var container = obj as Container;
              var container = asOrNull(obj, Container);
              if (container) {
                  return this.ContainerToJArray(container);
              }
              // var divert = obj as Divert;
              var divert = asOrNull(obj, Divert);
              if (divert) {
                  var divTypeKey = '->';
                  if (divert.isExternal) divTypeKey = 'x()';else if (divert.pushesToStack) {
                      if (divert.stackPushType == PushPopType.Function) divTypeKey = 'f()';else if (divert.stackPushType == PushPopType.Tunnel) divTypeKey = '->t->';
                  }
                  var targetStr = void 0;
                  if (divert.hasVariableTarget) targetStr = divert.variableDivertName;else targetStr = divert.targetPathString;
                  var jObj = {};
                  jObj[divTypeKey] = targetStr;
                  if (divert.hasVariableTarget) jObj['var'] = true;
                  if (divert.isConditional) jObj['c'] = true;
                  if (divert.externalArgs > 0) jObj['exArgs'] = divert.externalArgs;
                  return jObj;
              }
              // var choicePoint = obj as ChoicePoint;
              var choicePoint = asOrNull(obj, ChoicePoint);
              if (choicePoint) {
                  var _jObj = {};
                  _jObj['*'] = choicePoint.pathStringOnChoice;
                  _jObj['flg'] = choicePoint.flags;
                  return _jObj;
              }
              // var intVal = obj as IntValue;
              var intVal = asOrNull(obj, IntValue);
              if (intVal) return intVal.value;
              // var floatVal = obj as FloatValue;
              var floatVal = asOrNull(obj, FloatValue);
              if (floatVal) return floatVal.value;
              // var strVal = obj as StringValue;
              var strVal = asOrNull(obj, StringValue);
              if (strVal) {
                  if (strVal.isNewline) return '\n';else return '^' + strVal.value;
              }
              // var listVal = obj as ListValue;
              var listVal = asOrNull(obj, ListValue);
              if (listVal) {
                  return this.InkListToJObject(listVal);
              }
              // var divTargetVal = obj as DivertTargetValue;
              var divTargetVal = asOrNull(obj, DivertTargetValue);
              if (divTargetVal) {
                  var divTargetJsonObj = {};
                  if (divTargetVal.value === null) {
                      return throwNullException('divTargetVal.value');
                  }
                  divTargetJsonObj['^->'] = divTargetVal.value.componentsString;
                  return divTargetJsonObj;
              }
              // var varPtrVal = obj as VariablePointerValue;
              var varPtrVal = asOrNull(obj, VariablePointerValue);
              if (varPtrVal) {
                  var varPtrJsonObj = {};
                  varPtrJsonObj['^var'] = varPtrVal.value;
                  varPtrJsonObj['ci'] = varPtrVal.contextIndex;
                  return varPtrJsonObj;
              }
              // var glue = obj as Runtime.Glue;
              var glue = asOrNull(obj, Glue);
              if (glue) return '<>';
              // var controlCmd = obj as ControlCommand;
              var controlCmd = asOrNull(obj, ControlCommand);
              if (controlCmd) {
                  return JsonSerialisation._controlCommandNames[controlCmd.commandType];
              }
              // var nativeFunc = obj as Runtime.NativeFunctionCall;
              var nativeFunc = asOrNull(obj, NativeFunctionCall);
              if (nativeFunc) {
                  var name = nativeFunc.name;
                  if (name == '^') name = 'L^';
                  return name;
              }
              // Variable reference
              // var varRef = obj as VariableReference;
              var varRef = asOrNull(obj, VariableReference);
              if (varRef) {
                  var _jObj2 = {};
                  var readCountPath = varRef.pathStringForCount;
                  if (readCountPath != null) {
                      _jObj2['CNT?'] = readCountPath;
                  } else {
                      _jObj2['VAR?'] = varRef.name;
                  }
                  return _jObj2;
              }
              // Variable assignment
              // var varAss = obj as VariableAssignment;
              var varAss = asOrNull(obj, VariableAssignment);
              if (varAss) {
                  var key = varAss.isGlobal ? 'VAR=' : 'temp=';
                  var _jObj3 = {};
                  _jObj3[key] = varAss.variableName;
                  // Reassignment?
                  if (!varAss.isNewDeclaration) _jObj3['re'] = true;
                  return _jObj3;
              }
              // var voidObj = obj as Void;
              var voidObj = asOrNull(obj, Void);
              if (voidObj) return 'void';
              // var tag = obj as Tag;
              var tag = asOrNull(obj, Tag);
              if (tag) {
                  var _jObj4 = {};
                  _jObj4['#'] = tag.text;
                  return _jObj4;
              }
              // Used when serialising save state only
              // var choice = obj as Choice;
              var choice = asOrNull(obj, Choice);
              if (choice) return this.ChoiceToJObject(choice);
              throw new Error('Failed to convert runtime object to Json token: ' + obj);
          }
      }, {
          key: 'ContainerToJArray',
          value: function ContainerToJArray(container) {
              var jArray = this.ListToJArray(container.content);
              var namedOnlyContent = container.namedOnlyContent;
              var countFlags = container.countFlags;
              if (namedOnlyContent != null && namedOnlyContent.size > 0 || countFlags > 0 || container.name != null) {
                  var terminatingObj = void 0;
                  if (namedOnlyContent != null) {
                      terminatingObj = this.DictionaryRuntimeObjsToJObject(namedOnlyContent);
                      for (var key in terminatingObj) {
                          if (terminatingObj.hasOwnProperty(key)) {
                              // var subContainerJArray = namedContentObj.Value as JArray;
                              var subContainerJArray = terminatingObj[key];
                              if (subContainerJArray != null) {
                                  // var attrJObj = subContainerJArray [subContainerJArray.Count - 1] as JObject;
                                  var attrJObj = subContainerJArray[subContainerJArray.length - 1];
                                  if (attrJObj != null) {
                                      delete attrJObj['#n'];
                                      if (Object.keys(attrJObj).length == 0) subContainerJArray[subContainerJArray.length - 1] = null;
                                  }
                              }
                          }
                      }
                  } else terminatingObj = {};
                  if (countFlags > 0) terminatingObj['#f'] = countFlags;
                  if (container.name != null) terminatingObj['#n'] = container.name;
                  jArray.push(terminatingObj);
              }
              // Add null terminator to indicate that there's no dictionary
              else {
                      jArray.push(null);
                  }
              return jArray;
          }
      }, {
          key: 'JArrayToContainer',
          value: function JArrayToContainer(jArray) {
              var container = new Container();
              container.content = this.JArrayToRuntimeObjList(jArray, true);
              var terminatingObj = jArray[jArray.length - 1];
              if (terminatingObj != null) {
                  var namedOnlyContent = new Map();
                  for (var key in terminatingObj) {
                      if (key == '#f') {
                          container.countFlags = parseInt(terminatingObj[key]);
                      } else if (key == '#n') {
                          container.name = terminatingObj[key].toString();
                      } else {
                          var namedContentItem = this.JTokenToRuntimeObject(terminatingObj[key]);
                          // var namedSubContainer = namedContentItem as Container;
                          var namedSubContainer = asOrNull(namedContentItem, Container);
                          if (namedSubContainer) namedSubContainer.name = key;
                          namedOnlyContent.set(key, namedContentItem);
                      }
                  }
                  container.namedOnlyContent = namedOnlyContent;
              }
              return container;
          }
      }, {
          key: 'JObjectToChoice',
          value: function JObjectToChoice(jObj) {
              var choice = new Choice();
              choice.text = jObj['text'].toString();
              choice.index = parseInt(jObj['index']);
              choice.sourcePath = jObj['originalChoicePath'].toString();
              choice.originalThreadIndex = parseInt(jObj['originalThreadIndex']);
              choice.pathStringOnChoice = jObj['targetPath'].toString();
              return choice;
          }
      }, {
          key: 'ChoiceToJObject',
          value: function ChoiceToJObject(choice) {
              var jObj = {};
              jObj['text'] = choice.text;
              jObj['index'] = choice.index;
              jObj['originalChoicePath'] = choice.sourcePath;
              jObj['originalThreadIndex'] = choice.originalThreadIndex;
              jObj['targetPath'] = choice.pathStringOnChoice;
              return jObj;
          }
      }, {
          key: 'InkListToJObject',
          value: function InkListToJObject(listVal) {
              var rawList = listVal.value;
              if (rawList === null) {
                  return throwNullException('rawList');
              }
              var dict = {};
              var content = {};
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                  for (var _iterator4 = rawList[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                      var _ref5 = _step4.value;

                      var _ref6 = slicedToArray(_ref5, 2);

                      var key = _ref6[0];
                      var val = _ref6[1];

                      var item = InkListItem.fromSerializedKey(key);
                      content[item.toString()] = val;
                  }
              } catch (err) {
                  _didIteratorError4 = true;
                  _iteratorError4 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion4 && _iterator4.return) {
                          _iterator4.return();
                      }
                  } finally {
                      if (_didIteratorError4) {
                          throw _iteratorError4;
                      }
                  }
              }

              dict['list'] = content;
              if (rawList.Count == 0 && rawList.originNames != null && rawList.originNames.length > 0) {
                  // dict["origins"] = rawList.originNames.Cast<object> ().ToList ();
                  dict['origins'] = rawList.originNames;
              }
              return dict;
          }
      }, {
          key: 'ListDefinitionsToJToken',
          value: function ListDefinitionsToJToken(origin) {
              var result = {};
              var _iteratorNormalCompletion5 = true;
              var _didIteratorError5 = false;
              var _iteratorError5 = undefined;

              try {
                  for (var _iterator5 = origin.lists[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                      var def = _step5.value;

                      var listDefJson = {};
                      var _iteratorNormalCompletion6 = true;
                      var _didIteratorError6 = false;
                      var _iteratorError6 = undefined;

                      try {
                          for (var _iterator6 = def.items[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                              var _ref7 = _step6.value;

                              var _ref8 = slicedToArray(_ref7, 2);

                              var key = _ref8[0];
                              var val = _ref8[1];

                              var item = InkListItem.fromSerializedKey(key);
                              if (item.itemName === null) {
                                  return throwNullException('item.itemName');
                              }
                              listDefJson[item.itemName] = val;
                          }
                      } catch (err) {
                          _didIteratorError6 = true;
                          _iteratorError6 = err;
                      } finally {
                          try {
                              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                  _iterator6.return();
                              }
                          } finally {
                              if (_didIteratorError6) {
                                  throw _iteratorError6;
                              }
                          }
                      }

                      result[def.name] = listDefJson;
                  }
              } catch (err) {
                  _didIteratorError5 = true;
                  _iteratorError5 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion5 && _iterator5.return) {
                          _iterator5.return();
                      }
                  } finally {
                      if (_didIteratorError5) {
                          throw _iteratorError5;
                      }
                  }
              }

              return result;
          }
      }, {
          key: 'JTokenToListDefinitions',
          value: function JTokenToListDefinitions(obj) {
              // var defsObj = (Dictionary<string, object>)obj;
              var defsObj = obj;
              var allDefs = [];
              for (var key in defsObj) {
                  if (defsObj.hasOwnProperty(key)) {
                      var name = key.toString();
                      // var listDefJson = (Dictionary<string, object>)kv.Value;
                      var listDefJson = defsObj[key];
                      // Cast (string, object) to (string, int) for items
                      var items = new Map();
                      for (var nameValueKey in listDefJson) {
                          if (defsObj.hasOwnProperty(key)) {
                              var nameValue = listDefJson[nameValueKey];
                              items.set(nameValueKey, parseInt(nameValue));
                          }
                      }
                      var def = new ListDefinition(name, items);
                      allDefs.push(def);
                  }
              }
              return new ListDefinitionsOrigin(allDefs);
          }
      }]);
      return JsonSerialisation;
  }();
  JsonSerialisation._controlCommandNames = function () {
      var _controlCommandNames = [];
      _controlCommandNames[ControlCommand.CommandType.EvalStart] = 'ev';
      _controlCommandNames[ControlCommand.CommandType.EvalOutput] = 'out';
      _controlCommandNames[ControlCommand.CommandType.EvalEnd] = '/ev';
      _controlCommandNames[ControlCommand.CommandType.Duplicate] = 'du';
      _controlCommandNames[ControlCommand.CommandType.PopEvaluatedValue] = 'pop';
      _controlCommandNames[ControlCommand.CommandType.PopFunction] = '~ret';
      _controlCommandNames[ControlCommand.CommandType.PopTunnel] = '->->';
      _controlCommandNames[ControlCommand.CommandType.BeginString] = 'str';
      _controlCommandNames[ControlCommand.CommandType.EndString] = '/str';
      _controlCommandNames[ControlCommand.CommandType.NoOp] = 'nop';
      _controlCommandNames[ControlCommand.CommandType.ChoiceCount] = 'choiceCnt';
      _controlCommandNames[ControlCommand.CommandType.Turns] = 'turn';
      _controlCommandNames[ControlCommand.CommandType.TurnsSince] = 'turns';
      _controlCommandNames[ControlCommand.CommandType.ReadCount] = 'readc';
      _controlCommandNames[ControlCommand.CommandType.Random] = 'rnd';
      _controlCommandNames[ControlCommand.CommandType.SeedRandom] = 'srnd';
      _controlCommandNames[ControlCommand.CommandType.VisitIndex] = 'visit';
      _controlCommandNames[ControlCommand.CommandType.SequenceShuffleIndex] = 'seq';
      _controlCommandNames[ControlCommand.CommandType.StartThread] = 'thread';
      _controlCommandNames[ControlCommand.CommandType.Done] = 'done';
      _controlCommandNames[ControlCommand.CommandType.End] = 'end';
      _controlCommandNames[ControlCommand.CommandType.ListFromInt] = 'listInt';
      _controlCommandNames[ControlCommand.CommandType.ListRange] = 'range';
      _controlCommandNames[ControlCommand.CommandType.ListRandom] = 'lrnd';
      for (var i = 0; i < ControlCommand.CommandType.TOTAL_VALUES; ++i) {
          if (_controlCommandNames[i] == null) throw new Error('Control command not accounted for in serialisation');
      }
      return _controlCommandNames;
  }();

  var CallStack = function () {
      function CallStack() {
          classCallCheck(this, CallStack);

          this._threadCounter = 0;
          if (arguments[0] instanceof Container || arguments[0] === null) {
              var rootContentContainer = arguments[0];
              this._threads = [];
              this._threads.push(new CallStack.Thread());
              this._threads[0].callstack.push(new CallStack.Element(PushPopType.Tunnel, Pointer.StartOf(rootContentContainer)));
          } else {
              var toCopy = arguments[0];
              this._threads = [];
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = toCopy._threads[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var otherThread = _step.value;

                      this._threads.push(otherThread.Copy());
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }
          }
      }

      createClass(CallStack, [{
          key: 'SetJsonToken',
          value: function SetJsonToken(jObject, storyContext) {
              this._threads.length = 0;
              // TODO: (List<object>) jObject ["threads"];
              var jThreads = jObject['threads'];
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                  for (var _iterator2 = jThreads[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var jThreadTok = _step2.value;

                      // TODO: var jThreadObj = (Dictionary<string, object>)jThreadTok;
                      var jThreadObj = jThreadTok;
                      var thread = new CallStack.Thread(jThreadObj, storyContext);
                      this._threads.push(thread);
                  }
                  // TODO: (int)jObject ["threadCounter"];
              } catch (err) {
                  _didIteratorError2 = true;
                  _iteratorError2 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                          _iterator2.return();
                      }
                  } finally {
                      if (_didIteratorError2) {
                          throw _iteratorError2;
                      }
                  }
              }

              this._threadCounter = parseInt(jObject['threadCounter']);
          }
      }, {
          key: 'GetJsonToken',
          value: function GetJsonToken() {
              var jObject = {};
              var jThreads = [];
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                  for (var _iterator3 = this._threads[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var thread = _step3.value;

                      jThreads.push(thread.jsonToken);
                  }
              } catch (err) {
                  _didIteratorError3 = true;
                  _iteratorError3 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return) {
                          _iterator3.return();
                      }
                  } finally {
                      if (_didIteratorError3) {
                          throw _iteratorError3;
                      }
                  }
              }

              jObject['threads'] = jThreads;
              jObject['threadCounter'] = this._threadCounter;
              return jObject;
          }
      }, {
          key: 'PushThread',
          value: function PushThread() {
              var newThread = this.currentThread.Copy();
              this._threadCounter++;
              newThread.threadIndex = this._threadCounter;
              this._threads.push(newThread);
          }
      }, {
          key: 'PopThread',
          value: function PopThread() {
              if (this.canPopThread) {
                  this._threads.splice(this._threads.indexOf(this.currentThread), 1); // should be equivalent to a pop()
              } else {
                  throw new Error("Can't pop thread");
              }
          }
      }, {
          key: 'Push',
          value: function Push(type) {
              var externalEvaluationStackHeight = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
              var outputStreamLengthWithPushed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

              var element = new CallStack.Element(type, this.currentElement.currentPointer, false);
              element.evaluationStackHeightWhenPushed = externalEvaluationStackHeight;
              element.functionStartInOutputStream = outputStreamLengthWithPushed;
              this.callStack.push(element);
          }
      }, {
          key: 'CanPop',
          value: function CanPop() {
              var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

              if (!this.canPop) return false;
              if (type == null) return true;
              return this.currentElement.type == type;
          }
      }, {
          key: 'Pop',
          value: function Pop() {
              var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

              if (this.CanPop(type)) {
                  this.callStack.pop();
                  return;
              } else {
                  throw new Error('Mismatched push/pop in Callstack');
              }
          }
      }, {
          key: 'GetTemporaryVariableWithName',
          value: function GetTemporaryVariableWithName(name) {
              var contextIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

              if (contextIndex == -1) contextIndex = this.currentElementIndex + 1;
              var contextElement = this.callStack[contextIndex - 1];
              var varValue = tryGetValueFromMap(contextElement.temporaryVariables, name, null);
              if (varValue.exists) {
                  return varValue.result;
              } else {
                  return null;
              }
          }
      }, {
          key: 'SetTemporaryVariable',
          value: function SetTemporaryVariable(name, value, declareNew) {
              var contextIndex = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : -1;

              if (contextIndex == -1) contextIndex = this.currentElementIndex + 1;
              var contextElement = this.callStack[contextIndex - 1];
              if (!declareNew && !contextElement.temporaryVariables.get(name)) {
                  throw new StoryException('Could not find temporary variable to set: ' + name);
              }
              var oldValue = tryGetValueFromMap(contextElement.temporaryVariables, name, null);
              if (oldValue.exists) ListValue.RetainListOriginsForAssignment(oldValue.result, value);
              contextElement.temporaryVariables.set(name, value);
          }
      }, {
          key: 'ContextForVariableNamed',
          value: function ContextForVariableNamed(name) {
              if (this.currentElement.temporaryVariables.get(name)) {
                  return this.currentElementIndex + 1;
              } else {
                  return 0;
              }
          }
      }, {
          key: 'ThreadWithIndex',
          value: function ThreadWithIndex(index) {
              var filtered = this._threads.filter(function (t) {
                  if (t.threadIndex == index) return t;
              });
              return filtered[0];
          }
      }, {
          key: 'elements',
          get: function get$$1() {
              return this.callStack;
          }
      }, {
          key: 'depth',
          get: function get$$1() {
              return this.elements.length;
          }
      }, {
          key: 'currentElement',
          get: function get$$1() {
              var thread = this._threads[this._threads.length - 1];
              var cs = thread.callstack;
              return cs[cs.length - 1];
          }
      }, {
          key: 'currentElementIndex',
          get: function get$$1() {
              return this.callStack.length - 1;
          }
      }, {
          key: 'currentThread',
          get: function get$$1() {
              return this._threads[this._threads.length - 1];
          },
          set: function set$$1(value) {
              Debug.Assert(this._threads.length == 1, "Shouldn't be directly setting the current thread when we have a stack of them");
              this._threads.length = 0;
              this._threads.push(value);
          }
      }, {
          key: 'canPop',
          get: function get$$1() {
              return this.callStack.length > 1;
          }
      }, {
          key: 'canPopThread',
          get: function get$$1() {
              return this._threads.length > 1 && !this.elementIsEvaluateFromGame;
          }
      }, {
          key: 'elementIsEvaluateFromGame',
          get: function get$$1() {
              return this.currentElement.type == PushPopType.FunctionEvaluationFromGame;
          }
      }, {
          key: 'callStack',
          get: function get$$1() {
              return this.currentThread.callstack;
          }
      }, {
          key: 'callStackTrace',
          get: function get$$1() {
              var sb = new StringBuilder();
              for (var t = 0; t < this._threads.length; t++) {
                  var thread = this._threads[t];
                  var isCurrent = t == this._threads.length - 1;
                  sb.AppendFormat('=== THREAD {0}/{1} {2}===\n', t + 1, this._threads.length, isCurrent ? '(current) ' : '');
                  for (var i = 0; i < thread.callstack.length; i++) {
                      if (thread.callstack[i].type == PushPopType.Function) sb.Append('  [FUNCTION] ');else sb.Append('  [TUNNEL] ');
                      var pointer = thread.callstack[i].currentPointer;
                      if (!pointer.isNull) {
                          sb.Append('<SOMEWHERE IN ');
                          if (pointer.container === null) {
                              return throwNullException('pointer.container');
                          }
                          sb.Append(pointer.container.path.toString());
                          sb.AppendLine('>');
                      }
                  }
              }
              return sb.toString();
          }
      }]);
      return CallStack;
  }();
  (function (CallStack) {
      var Element = function () {
          function Element(type, pointer) {
              var inExpressionEvaluation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
              classCallCheck(this, Element);

              this.evaluationStackHeightWhenPushed = 0;
              this.functionStartInOutputStream = 0;
              this.currentPointer = pointer.copy();
              this.inExpressionEvaluation = inExpressionEvaluation;
              this.temporaryVariables = new Map();
              this.type = type;
          }

          createClass(Element, [{
              key: 'Copy',
              value: function Copy() {
                  var copy = new Element(this.type, this.currentPointer, this.inExpressionEvaluation);
                  copy.temporaryVariables = new Map(this.temporaryVariables);
                  copy.evaluationStackHeightWhenPushed = this.evaluationStackHeightWhenPushed;
                  copy.functionStartInOutputStream = this.functionStartInOutputStream;
                  return copy;
              }
          }]);
          return Element;
      }();

      CallStack.Element = Element;

      var Thread = function () {
          function Thread() {
              classCallCheck(this, Thread);

              this.threadIndex = 0;
              this.previousPointer = Pointer.Null;
              this.callstack = [];
              if (arguments[0] && arguments[1]) {
                  var jThreadObj = arguments[0];
                  var storyContext = arguments[1];
                  // TODO: (int) jThreadObj['threadIndex'] can raise;
                  this.threadIndex = parseInt(jThreadObj['threadIndex']);
                  var jThreadCallstack = jThreadObj['callstack'];
                  var _iteratorNormalCompletion4 = true;
                  var _didIteratorError4 = false;
                  var _iteratorError4 = undefined;

                  try {
                      for (var _iterator4 = jThreadCallstack[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                          var jElTok = _step4.value;

                          var jElementObj = jElTok;
                          // TODO: (int) jElementObj['type'] can raise;
                          var pushPopType = parseInt(jElementObj['type']);
                          var pointer = Pointer.Null;
                          var currentContainerPathStr = void 0;
                          // TODO: jElementObj.TryGetValue ("cPath", out currentContainerPathStrToken);
                          var currentContainerPathStrToken = jElementObj['cPath'];
                          if (typeof currentContainerPathStrToken !== 'undefined') {
                              currentContainerPathStr = currentContainerPathStrToken.toString();
                              var threadPointerResult = storyContext.ContentAtPath(new Path(currentContainerPathStr));
                              pointer.container = threadPointerResult.container;
                              pointer.index = parseInt(jElementObj['idx']);
                              if (threadPointerResult.obj == null) throw new Error('When loading state, internal story location couldn\'t be found: ' + currentContainerPathStr + '. Has the story changed since this save data was created?');else if (threadPointerResult.approximate) {
                                  if (pointer.container === null) {
                                      return throwNullException('pointer.container');
                                  }
                                  storyContext.Warning("When loading state, exact internal story location couldn't be found: '" + currentContainerPathStr + "', so it was approximated to '" + pointer.container.path.toString() + "' to recover. Has the story changed since this save data was created?");
                              }
                          }
                          var inExpressionEvaluation = !!jElementObj['exp'];
                          var el = new Element(pushPopType, pointer, inExpressionEvaluation);
                          var jObjTemps = jElementObj['temp'];
                          el.temporaryVariables = JsonSerialisation.JObjectToDictionaryRuntimeObjs(jObjTemps);
                          this.callstack.push(el);
                      }
                  } catch (err) {
                      _didIteratorError4 = true;
                      _iteratorError4 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion4 && _iterator4.return) {
                              _iterator4.return();
                          }
                      } finally {
                          if (_didIteratorError4) {
                              throw _iteratorError4;
                          }
                      }
                  }

                  var prevContentObjPath = jThreadObj['previousContentObject'];
                  if (typeof prevContentObjPath !== 'undefined') {
                      var prevPath = new Path(prevContentObjPath.toString());
                      this.previousPointer = storyContext.PointerAtPath(prevPath);
                  }
              }
          }

          createClass(Thread, [{
              key: 'Copy',
              value: function Copy() {
                  var copy = new Thread();
                  copy.threadIndex = this.threadIndex;
                  var _iteratorNormalCompletion5 = true;
                  var _didIteratorError5 = false;
                  var _iteratorError5 = undefined;

                  try {
                      for (var _iterator5 = this.callstack[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                          var e = _step5.value;

                          copy.callstack.push(e.Copy());
                      }
                  } catch (err) {
                      _didIteratorError5 = true;
                      _iteratorError5 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion5 && _iterator5.return) {
                              _iterator5.return();
                          }
                      } finally {
                          if (_didIteratorError5) {
                              throw _iteratorError5;
                          }
                      }
                  }

                  copy.previousPointer = this.previousPointer.copy();
                  return copy;
              }
          }, {
              key: 'jsonToken',
              get: function get$$1() {
                  var threadJObj = {};
                  var jThreadCallstack = [];
                  var _iteratorNormalCompletion6 = true;
                  var _didIteratorError6 = false;
                  var _iteratorError6 = undefined;

                  try {
                      for (var _iterator6 = this.callstack[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                          var el = _step6.value;

                          var jObj = {};
                          if (!el.currentPointer.isNull) {
                              if (el.currentPointer.container === null) {
                                  return throwNullException('el.currentPointer.container');
                              }
                              jObj['cPath'] = el.currentPointer.container.path.componentsString;
                              jObj['idx'] = el.currentPointer.index;
                          }
                          jObj['exp'] = el.inExpressionEvaluation;
                          jObj['type'] = el.type;
                          jObj['temp'] = JsonSerialisation.DictionaryRuntimeObjsToJObject(el.temporaryVariables);
                          jThreadCallstack.push(jObj);
                      }
                  } catch (err) {
                      _didIteratorError6 = true;
                      _iteratorError6 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion6 && _iterator6.return) {
                              _iterator6.return();
                          }
                      } finally {
                          if (_didIteratorError6) {
                              throw _iteratorError6;
                          }
                      }
                  }

                  threadJObj['callstack'] = jThreadCallstack;
                  threadJObj['threadIndex'] = this.threadIndex;
                  if (!this.previousPointer.isNull) {
                      var resolvedPointer = this.previousPointer.Resolve();
                      if (resolvedPointer === null) {
                          return throwNullException('this.previousPointer.Resolve()');
                      }
                      threadJObj['previousContentObject'] = resolvedPointer.path.toString();
                  }
                  return threadJObj;
              }
          }]);
          return Thread;
      }();

      CallStack.Thread = Thread;
  })(CallStack || (CallStack = {}));

  var VariablesState = function () {
      function VariablesState(callStack, listDefsOrigin) {
          classCallCheck(this, VariablesState);

          // The way variableChangedEvent is a bit different than the reference implementation.
          // Originally it uses the C# += operator to add delegates, but in js we need to maintain
          // an actual collection of delegates (ie. callbacks) to register a new one, there is a
          // special ObserveVariableChange method below.
          this.variableChangedEventCallbacks = [];
          this._batchObservingVariableChanges = false;
          this._defaultGlobalVariables = new Map();
          this._changedVariables = new Set();
          this._globalVariables = new Map();
          this._callStack = callStack;
          this._listDefsOrigin = listDefsOrigin;
          // if es6 proxies are available, use them.
          try {
              // the proxy is used to allow direct manipulation of global variables.
              // It first tries to access the objects own property, and if none is
              // found it delegates the call to the $ method, defined below
              var p = new Proxy(this, {
                  get: function get$$1(target, name) {
                      return name in target ? target[name] : target.$(name);
                  },
                  set: function set$$1(target, name, value) {
                      if (name in target) target[name] = value;else target.$(name, value);
                      return true; // returning a falsy value make the trap fail
                  }
              });
              return p;
          } catch (e) {
              // thr proxy object is not available in this context. we should warn the
              // dev but writting to the console feels a bit intrusive.
              // console.log("ES6 Proxy not available - direct manipulation of global variables can't work, use $() instead.");
          }
      }

      createClass(VariablesState, [{
          key: 'variableChangedEvent',
          value: function variableChangedEvent(variableName, newValue) {
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = this.variableChangedEventCallbacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var callback = _step.value;

                      callback(variableName, newValue);
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }
          }
      }, {
          key: '$',

          // the original code uses a magic getter and setter for global variables,
          // allowing things like variableState['varname]. This is not quite possible
          // in js without a Proxy, so it is replaced with this $ function.
          value: function $(variableName, value) {
              if (typeof value === 'undefined') {
                  var varContents = this._globalVariables.get(variableName);
                  if (typeof varContents === 'undefined') {
                      varContents = this._defaultGlobalVariables.get(variableName);
                  }
                  if (typeof varContents !== 'undefined') return varContents.valueObject;else return null;
              } else {
                  if (typeof this._defaultGlobalVariables.get(variableName) === 'undefined') throw new StoryException('Cannot assign to a variable (' + variableName + ") that hasn't been declared in the story");
                  var val = Value.Create(value);
                  if (val == null) {
                      if (value == null) {
                          throw new StoryException('Cannot pass null to VariableState');
                      } else {
                          throw new StoryException('Invalid value passed to VariableState: ' + value.toString());
                      }
                  }
                  this.SetGlobal(variableName, val);
              }
          }
      }, {
          key: 'CopyFrom',
          value: function CopyFrom(toCopy) {
              this._globalVariables = new Map(toCopy._globalVariables);
              this._defaultGlobalVariables = new Map(toCopy._defaultGlobalVariables);
              this.variableChangedEvent = toCopy.variableChangedEvent;
              if (toCopy.batchObservingVariableChanges != this.batchObservingVariableChanges) {
                  if (toCopy.batchObservingVariableChanges) {
                      this._batchObservingVariableChanges = true;
                      if (toCopy._changedVariables === null) {
                          return throwNullException('toCopy._changedVariables');
                      }
                      this._changedVariables = new Set(toCopy._changedVariables);
                  } else {
                      this._batchObservingVariableChanges = false;
                      this._changedVariables = null;
                  }
              }
          }
      }, {
          key: 'TryGetDefaultVariableValue',
          value: function TryGetDefaultVariableValue(name) {
              var val = tryGetValueFromMap(this._defaultGlobalVariables, name, null);
              return val.exists ? val.result : null;
          }
      }, {
          key: 'GlobalVariableExistsWithName',
          value: function GlobalVariableExistsWithName(name) {
              return this._globalVariables.has(name);
          }
      }, {
          key: 'GetVariableWithName',
          value: function GetVariableWithName(name) {
              var contextIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

              var varValue = this.GetRawVariableWithName(name, contextIndex);
              // var varPointer = varValue as VariablePointerValue;
              var varPointer = asOrNull(varValue, VariablePointerValue);
              if (varPointer !== null) {
                  varValue = this.ValueAtVariablePointer(varPointer);
              }
              return varValue;
          }
      }, {
          key: 'GetRawVariableWithName',
          value: function GetRawVariableWithName(name, contextIndex) {
              var varValue = null;
              if (contextIndex == 0 || contextIndex == -1) {
                  // this is a conditional assignment
                  var variableValue = tryGetValueFromMap(this._globalVariables, name, null);
                  if (variableValue.exists) return variableValue.result;
                  if (this._listDefsOrigin === null) return throwNullException('VariablesState._listDefsOrigin');
                  var listItemValue = this._listDefsOrigin.FindSingleItemListWithName(name);
                  if (listItemValue) return listItemValue;
              }
              varValue = this._callStack.GetTemporaryVariableWithName(name, contextIndex);
              return varValue;
          }
      }, {
          key: 'ValueAtVariablePointer',
          value: function ValueAtVariablePointer(pointer) {
              return this.GetVariableWithName(pointer.variableName, pointer.contextIndex);
          }
      }, {
          key: 'Assign',
          value: function Assign(varAss, value) {
              var name = varAss.variableName;
              if (name === null) {
                  return throwNullException('name');
              }
              var contextIndex = -1;
              var setGlobal = false;
              if (varAss.isNewDeclaration) {
                  setGlobal = varAss.isGlobal;
              } else {
                  setGlobal = this._globalVariables.has(name);
              }
              if (varAss.isNewDeclaration) {
                  // var varPointer = value as VariablePointerValue;
                  var varPointer = asOrNull(value, VariablePointerValue);
                  if (varPointer !== null) {
                      var fullyResolvedVariablePointer = this.ResolveVariablePointer(varPointer);
                      value = fullyResolvedVariablePointer;
                  }
              } else {
                  var existingPointer = null;
                  do {
                      // existingPointer = GetRawVariableWithName (name, contextIndex) as VariablePointerValue;
                      existingPointer = asOrNull(this.GetRawVariableWithName(name, contextIndex), VariablePointerValue);
                      if (existingPointer != null) {
                          name = existingPointer.variableName;
                          contextIndex = existingPointer.contextIndex;
                          setGlobal = contextIndex == 0;
                      }
                  } while (existingPointer != null);
              }
              if (setGlobal) {
                  this.SetGlobal(name, value);
              } else {
                  this._callStack.SetTemporaryVariable(name, value, varAss.isNewDeclaration, contextIndex);
              }
          }
      }, {
          key: 'SnapshotDefaultGlobals',
          value: function SnapshotDefaultGlobals() {
              this._defaultGlobalVariables = new Map(this._globalVariables);
          }
      }, {
          key: 'RetainListOriginsForAssignment',
          value: function RetainListOriginsForAssignment(oldValue, newValue) {
              var oldList = asOrThrows(oldValue, ListValue);
              var newList = asOrThrows(newValue, ListValue);
              if (oldList.value && newList.value && newList.value.Count == 0) {
                  newList.value.SetInitialOriginNames(oldList.value.originNames);
              }
          }
      }, {
          key: 'SetGlobal',
          value: function SetGlobal(variableName, value) {
              var oldValue = tryGetValueFromMap(this._globalVariables, variableName, null);
              if (oldValue.exists) {
                  ListValue.RetainListOriginsForAssignment(oldValue.result, value);
              }
              if (variableName === null) {
                  return throwNullException('variableName');
              }
              this._globalVariables.set(variableName, value);
              // TODO: Not sure !== is equivalent to !value.Equals(oldValue)
              if (this.variableChangedEvent != null && value !== oldValue.result) {
                  if (this.batchObservingVariableChanges) {
                      if (this._changedVariables === null) {
                          return throwNullException('this._changedVariables');
                      }
                      this._changedVariables.add(variableName);
                  } else {
                      this.variableChangedEvent(variableName, value);
                  }
              }
          }
      }, {
          key: 'ResolveVariablePointer',
          value: function ResolveVariablePointer(varPointer) {
              var contextIndex = varPointer.contextIndex;
              if (contextIndex == -1) contextIndex = this.GetContextIndexOfVariableNamed(varPointer.variableName);
              var valueOfVariablePointedTo = this.GetRawVariableWithName(varPointer.variableName, contextIndex);
              // var doubleRedirectionPointer = valueOfVariablePointedTo as VariablePointerValue;
              var doubleRedirectionPointer = asOrNull(valueOfVariablePointedTo, VariablePointerValue);
              if (doubleRedirectionPointer != null) {
                  return doubleRedirectionPointer;
              } else {
                  return new VariablePointerValue(varPointer.variableName, contextIndex);
              }
          }
      }, {
          key: 'GetContextIndexOfVariableNamed',
          value: function GetContextIndexOfVariableNamed(varName) {
              if (this._globalVariables.get(varName)) return 0;
              return this._callStack.currentElementIndex;
          }
          /**
           * This function is specific to the js version of ink. It allows to register a
           * callback that will be called when a variable changes. The original code uses
           * `state.variableChangedEvent += callback` instead.
           * @param {function} callback
           */

      }, {
          key: 'ObserveVariableChange',
          value: function ObserveVariableChange(callback) {
              this.variableChangedEventCallbacks.push(callback);
          }
      }, {
          key: 'batchObservingVariableChanges',
          get: function get$$1() {
              return this._batchObservingVariableChanges;
          },
          set: function set$$1(value) {
              this._batchObservingVariableChanges = value;
              if (value) {
                  this._changedVariables = new Set();
              } else {
                  if (this._changedVariables != null) {
                      var _iteratorNormalCompletion2 = true;
                      var _didIteratorError2 = false;
                      var _iteratorError2 = undefined;

                      try {
                          for (var _iterator2 = this._changedVariables[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                              var variableName = _step2.value;

                              var currentValue = this._globalVariables.get(variableName);
                              if (!currentValue) {
                                  throwNullException('currentValue');
                              } else {
                                  this.variableChangedEvent(variableName, currentValue);
                              }
                          }
                      } catch (err) {
                          _didIteratorError2 = true;
                          _iteratorError2 = err;
                      } finally {
                          try {
                              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                  _iterator2.return();
                              }
                          } finally {
                              if (_didIteratorError2) {
                                  throw _iteratorError2;
                              }
                          }
                      }
                  }
              }
          }
      }, {
          key: 'callStack',
          get: function get$$1() {
              return this._callStack;
          },
          set: function set$$1(callStack) {
              this._callStack = callStack;
          }
      }, {
          key: 'jsonToken',
          get: function get$$1() {
              return JsonSerialisation.DictionaryRuntimeObjsToJObject(this._globalVariables);
          },
          set: function set$$1(value) {
              this._globalVariables = JsonSerialisation.JObjectToDictionaryRuntimeObjs(value);
          }
      }]);
      return VariablesState;
  }();

  // Taken from https://gist.github.com/blixt/f17b47c62508be59987b
  // Ink uses a seedable PRNG of which there is none in native javascript.
  var PRNG = function () {
      function PRNG(seed) {
          classCallCheck(this, PRNG);

          this.seed = seed % 2147483647;
          if (this.seed <= 0) this.seed += 2147483646;
      }

      createClass(PRNG, [{
          key: "next",
          value: function next() {
              return this.seed = this.seed * 16807 % 2147483647;
          }
      }, {
          key: "nextFloat",
          value: function nextFloat() {
              return (this.next() - 1) / 2147483646;
          }
      }]);
      return PRNG;
  }();

  var StoryState = function () {
      function StoryState(story) {
          classCallCheck(this, StoryState);

          this.kInkSaveStateVersion = 8;
          this.kMinCompatibleLoadVersion = 8;
          this._currentErrors = null;
          this._currentWarnings = null;
          this.divertedPointer = Pointer.Null;
          this._currentTurnIndex = 0;
          this.storySeed = 0;
          this.previousRandom = 0;
          this.didSafeExit = false;
          this._currentText = null;
          this._currentTags = null;
          this._outputStreamTextDirty = true;
          this._outputStreamTagsDirty = true;
          this.story = story;
          this._outputStream = [];
          this.OutputStreamDirty();
          this._evaluationStack = [];
          this.callStack = new CallStack(story.rootContentContainer);
          this._variablesState = new VariablesState(this.callStack, story.listDefinitions);
          this._visitCounts = new Map();
          this._turnIndices = new Map();
          this._currentTurnIndex = -1;
          var timeSeed = new Date().getTime();
          this.storySeed = new PRNG(timeSeed).next() % 100;
          this.previousRandom = 0;
          this._currentChoices = [];
          this.GoToStart();
      }

      createClass(StoryState, [{
          key: 'ToJson',
          value: function ToJson() {
              var indented = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

              return JSON.stringify(this.jsonToken, null, indented ? 2 : 0);
          }
      }, {
          key: 'toJson',
          value: function toJson() {
              var indented = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

              return this.ToJson(indented);
          }
      }, {
          key: 'LoadJson',
          value: function LoadJson(json) {
              this.jsonToken = JSON.parse(json);
          }
      }, {
          key: 'VisitCountAtPathString',
          value: function VisitCountAtPathString(pathString) {
              var visitCountOut = tryGetValueFromMap(this.visitCounts, pathString, null);
              if (visitCountOut.exists) return visitCountOut.result;
              return 0;
          }
      }, {
          key: 'CleanOutputWhitespace',
          value: function CleanOutputWhitespace(str) {
              var sb = new StringBuilder();
              var currentWhitespaceStart = -1;
              var startOfLine = 0;
              for (var i = 0; i < str.length; i++) {
                  var c = str.charAt(i);
                  var isInlineWhitespace = c == ' ' || c == '\t';
                  if (isInlineWhitespace && currentWhitespaceStart == -1) currentWhitespaceStart = i;
                  if (!isInlineWhitespace) {
                      if (c != '\n' && currentWhitespaceStart > 0 && currentWhitespaceStart != startOfLine) {
                          sb.Append(' ');
                      }
                      currentWhitespaceStart = -1;
                  }
                  if (c == '\n') startOfLine = i + 1;
                  if (!isInlineWhitespace) sb.Append(c);
              }
              return sb.toString();
          }
      }, {
          key: 'GoToStart',
          value: function GoToStart() {
              this.callStack.currentElement.currentPointer = Pointer.StartOf(this.story.mainContentContainer);
          }
      }, {
          key: 'Copy',
          value: function Copy() {
              var copy = new StoryState(this.story);
              copy.outputStream.push.apply(copy.outputStream, this._outputStream);
              this.OutputStreamDirty();
              copy._currentChoices.push.apply(copy._currentChoices, this._currentChoices);
              if (this.hasError) {
                  copy._currentErrors = [];
                  copy._currentErrors.push.apply(copy._currentErrors, this.currentErrors);
              }
              if (this.hasWarning) {
                  copy._currentWarnings = [];
                  copy._currentWarnings.push.apply(copy._currentWarnings, this.currentWarnings);
              }
              copy.callStack = new CallStack(this.callStack);
              copy._variablesState = new VariablesState(copy.callStack, this.story.listDefinitions);
              copy.variablesState.CopyFrom(this.variablesState);
              copy.evaluationStack.push.apply(copy.evaluationStack, this.evaluationStack);
              if (!this.divertedPointer.isNull) copy.divertedPointer = this.divertedPointer.copy();
              copy.previousPointer = this.previousPointer.copy();
              copy._visitCounts = new Map(this.visitCounts);
              copy._turnIndices = new Map(this.turnIndices);
              copy._currentTurnIndex = this.currentTurnIndex;
              copy.storySeed = this.storySeed;
              copy.previousRandom = this.previousRandom;
              copy.didSafeExit = this.didSafeExit;
              return copy;
          }
      }, {
          key: 'ResetErrors',
          value: function ResetErrors() {
              this._currentErrors = null;
              this._currentWarnings = null;
          }
      }, {
          key: 'ResetOutput',
          value: function ResetOutput() {
              var objs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

              this._outputStream.length = 0;
              if (objs !== null) this._outputStream.push.apply(this._outputStream, objs);
              this.OutputStreamDirty();
          }
      }, {
          key: 'PushToOutputStream',
          value: function PushToOutputStream(obj) {
              // var text = obj as StringValue;
              var text = asOrNull(obj, StringValue);
              if (text !== null) {
                  var listText = this.TrySplittingHeadTailWhitespace(text);
                  if (listText !== null) {
                      var _iteratorNormalCompletion = true;
                      var _didIteratorError = false;
                      var _iteratorError = undefined;

                      try {
                          for (var _iterator = listText[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                              var textObj = _step.value;

                              this.PushToOutputStreamIndividual(textObj);
                          }
                      } catch (err) {
                          _didIteratorError = true;
                          _iteratorError = err;
                      } finally {
                          try {
                              if (!_iteratorNormalCompletion && _iterator.return) {
                                  _iterator.return();
                              }
                          } finally {
                              if (_didIteratorError) {
                                  throw _iteratorError;
                              }
                          }
                      }

                      this.OutputStreamDirty();
                      return;
                  }
              }
              this.PushToOutputStreamIndividual(obj);
              this.OutputStreamDirty();
          }
      }, {
          key: 'PopFromOutputStream',
          value: function PopFromOutputStream(count) {
              this.outputStream.splice(this.outputStream.length - count, count);
              this.OutputStreamDirty();
          }
      }, {
          key: 'TrySplittingHeadTailWhitespace',
          value: function TrySplittingHeadTailWhitespace(single) {
              var str = single.value;
              if (str === null) {
                  return throwNullException('single.value');
              }
              var headFirstNewlineIdx = -1;
              var headLastNewlineIdx = -1;
              for (var i = 0; i < str.length; ++i) {
                  var c = str[i];
                  if (c == '\n') {
                      if (headFirstNewlineIdx == -1) headFirstNewlineIdx = i;
                      headLastNewlineIdx = i;
                  } else if (c == ' ' || c == '\t') continue;else break;
              }
              var tailLastNewlineIdx = -1;
              var tailFirstNewlineIdx = -1;
              for (var _i = 0; _i < str.length; ++_i) {
                  var _c = str[_i];
                  if (_c == '\n') {
                      if (tailLastNewlineIdx == -1) tailLastNewlineIdx = _i;
                      tailFirstNewlineIdx = _i;
                  } else if (_c == ' ' || _c == '\t') continue;else break;
              }
              // No splitting to be done?
              if (headFirstNewlineIdx == -1 && tailLastNewlineIdx == -1) return null;
              var listTexts = [];
              var innerStrStart = 0;
              var innerStrEnd = str.length;
              if (headFirstNewlineIdx != -1) {
                  if (headFirstNewlineIdx > 0) {
                      var leadingSpaces = new StringValue(str.substring(0, headFirstNewlineIdx));
                      listTexts.push(leadingSpaces);
                  }
                  listTexts.push(new StringValue('\n'));
                  innerStrStart = headLastNewlineIdx + 1;
              }
              if (tailLastNewlineIdx != -1) {
                  innerStrEnd = tailFirstNewlineIdx;
              }
              if (innerStrEnd > innerStrStart) {
                  var innerStrText = str.substring(innerStrStart, innerStrEnd - innerStrStart);
                  listTexts.push(new StringValue(innerStrText));
              }
              if (tailLastNewlineIdx != -1 && tailFirstNewlineIdx > headLastNewlineIdx) {
                  listTexts.push(new StringValue('\n'));
                  if (tailLastNewlineIdx < str.length - 1) {
                      var numSpaces = str.length - tailLastNewlineIdx - 1;
                      var trailingSpaces = new StringValue(str.substring(tailLastNewlineIdx + 1, numSpaces));
                      listTexts.push(trailingSpaces);
                  }
              }
              return listTexts;
          }
      }, {
          key: 'PushToOutputStreamIndividual',
          value: function PushToOutputStreamIndividual(obj) {
              var glue = asOrNull(obj, Glue);
              var text = asOrNull(obj, StringValue);
              var includeInOutput = true;
              if (glue) {
                  this.TrimNewlinesFromOutputStream();
                  includeInOutput = true;
              } else if (text) {
                  var functionTrimIndex = -1;
                  var currEl = this.callStack.currentElement;
                  if (currEl.type == PushPopType.Function) {
                      functionTrimIndex = currEl.functionStartInOutputStream;
                  }
                  var glueTrimIndex = -1;
                  for (var i = this._outputStream.length - 1; i >= 0; i--) {
                      var o = this._outputStream[i];
                      var c = o instanceof ControlCommand ? o : null;
                      var g = o instanceof Glue ? o : null;
                      if (g != null) {
                          glueTrimIndex = i;
                          break;
                      } else if (c != null && c.commandType == ControlCommand.CommandType.BeginString) {
                          if (i >= functionTrimIndex) {
                              functionTrimIndex = -1;
                          }
                          break;
                      }
                  }
                  var trimIndex = -1;
                  if (glueTrimIndex != -1 && functionTrimIndex != -1) trimIndex = Math.min(functionTrimIndex, glueTrimIndex);else if (glueTrimIndex != -1) trimIndex = glueTrimIndex;else trimIndex = functionTrimIndex;
                  if (trimIndex != -1) {
                      if (text.isNewline) {
                          includeInOutput = false;
                      } else if (text.isNonWhitespace) {
                          if (glueTrimIndex > -1) this.RemoveExistingGlue();
                          if (functionTrimIndex > -1) {
                              var callStackElements = this.callStack.elements;
                              for (var _i2 = callStackElements.length - 1; _i2 >= 0; _i2--) {
                                  var el = callStackElements[_i2];
                                  if (el.type == PushPopType.Function) {
                                      el.functionStartInOutputStream = -1;
                                  } else {
                                      break;
                                  }
                              }
                          }
                      }
                  } else if (text.isNewline) {
                      if (this.outputStreamEndsInNewline || !this.outputStreamContainsContent) includeInOutput = false;
                  }
              }
              if (includeInOutput) {
                  if (obj === null) {
                      return throwNullException('obj');
                  }
                  this._outputStream.push(obj);
                  this.OutputStreamDirty();
              }
          }
      }, {
          key: 'TrimNewlinesFromOutputStream',
          value: function TrimNewlinesFromOutputStream() {
              var removeWhitespaceFrom = -1;
              var i = this._outputStream.length - 1;
              while (i >= 0) {
                  var obj = this._outputStream[i];
                  var cmd = asOrNull(obj, ControlCommand);
                  var txt = asOrNull(obj, StringValue);
                  if (cmd != null || txt != null && txt.isNonWhitespace) {
                      break;
                  } else if (txt != null && txt.isNewline) {
                      removeWhitespaceFrom = i;
                  }
                  i--;
              }
              // Remove the whitespace
              if (removeWhitespaceFrom >= 0) {
                  i = removeWhitespaceFrom;
                  while (i < this._outputStream.length) {
                      var text = asOrNull(this._outputStream[i], StringValue);
                      if (text) {
                          this._outputStream.splice(i, 1);
                      } else {
                          i++;
                      }
                  }
              }
              this.OutputStreamDirty();
          }
      }, {
          key: 'RemoveExistingGlue',
          value: function RemoveExistingGlue() {
              for (var i = this._outputStream.length - 1; i >= 0; i--) {
                  var c = this._outputStream[i];
                  if (c instanceof Glue) {
                      this._outputStream.splice(i, 1);
                  } else if (c instanceof ControlCommand) {
                      break;
                  }
              }
              this.OutputStreamDirty();
          }
      }, {
          key: 'PushEvaluationStack',
          value: function PushEvaluationStack(obj) {
              // var listValue = obj as ListValue;
              var listValue = asOrNull(obj, ListValue);
              if (listValue) {
                  // Update origin when list is has something to indicate the list origin
                  var rawList = listValue.value;
                  if (rawList === null) {
                      return throwNullException('rawList');
                  }
                  if (rawList.originNames != null) {
                      if (!rawList.origins) rawList.origins = [];
                      rawList.origins.length = 0;
                      var _iteratorNormalCompletion2 = true;
                      var _didIteratorError2 = false;
                      var _iteratorError2 = undefined;

                      try {
                          for (var _iterator2 = rawList.originNames[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                              var n = _step2.value;

                              if (this.story.listDefinitions === null) return throwNullException('StoryState.story.listDefinitions');
                              var def = this.story.listDefinitions.TryListGetDefinition(n, null);
                              if (def.result === null) return throwNullException('StoryState def.result');
                              if (rawList.origins.indexOf(def.result) < 0) rawList.origins.push(def.result);
                          }
                      } catch (err) {
                          _didIteratorError2 = true;
                          _iteratorError2 = err;
                      } finally {
                          try {
                              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                  _iterator2.return();
                              }
                          } finally {
                              if (_didIteratorError2) {
                                  throw _iteratorError2;
                              }
                          }
                      }
                  }
              }
              if (obj === null) {
                  return throwNullException('obj');
              }
              this.evaluationStack.push(obj);
          }
      }, {
          key: 'PopEvaluationStack',
          value: function PopEvaluationStack(numberOfObjects) {
              if (typeof numberOfObjects === 'undefined') {
                  var obj = this.evaluationStack.pop();
                  return nullIfUndefined(obj);
              } else {
                  if (numberOfObjects > this.evaluationStack.length) {
                      throw new Error('trying to pop too many objects');
                  }
                  var popped = this.evaluationStack.splice(this.evaluationStack.length - numberOfObjects, numberOfObjects);
                  return nullIfUndefined(popped);
              }
          }
      }, {
          key: 'PeekEvaluationStack',
          value: function PeekEvaluationStack() {
              return this.evaluationStack[this.evaluationStack.length - 1];
          }
      }, {
          key: 'ForceEnd',
          value: function ForceEnd() {
              while (this.callStack.canPopThread) {
                  this.callStack.PopThread();
              }while (this.callStack.canPop) {
                  this.PopCallStack();
              }this._currentChoices.length = 0;
              this.currentPointer = Pointer.Null;
              this.previousPointer = Pointer.Null;
              this.didSafeExit = true;
          }
      }, {
          key: 'TrimWhitespaceFromFunctionEnd',
          value: function TrimWhitespaceFromFunctionEnd() {
              Debug.Assert(this.callStack.currentElement.type == PushPopType.Function);
              var functionStartPoint = this.callStack.currentElement.functionStartInOutputStream;
              if (functionStartPoint == -1) {
                  functionStartPoint = 0;
              }
              for (var i = this._outputStream.length - 1; i >= functionStartPoint; i--) {
                  var obj = this._outputStream[i];
                  var txt = asOrNull(obj, StringValue);
                  var cmd = asOrNull(obj, ControlCommand);
                  if (txt == null) continue;
                  if (cmd) break;
                  if (txt.isNewline || txt.isInlineWhitespace) {
                      this._outputStream.splice(i, 1);
                      this.OutputStreamDirty();
                  } else {
                      break;
                  }
              }
          }
      }, {
          key: 'PopCallStack',
          value: function PopCallStack() {
              var popType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

              if (this.callStack.currentElement.type == PushPopType.Function) this.TrimWhitespaceFromFunctionEnd();
              this.callStack.Pop(popType);
          }
      }, {
          key: 'SetChosenPath',
          value: function SetChosenPath(path, incrementingTurnIndex) {
              // Changing direction, assume we need to clear current set of choices
              this._currentChoices.length = 0;
              var newPointer = this.story.PointerAtPath(path);
              if (!newPointer.isNull && newPointer.index == -1) newPointer.index = 0;
              this.currentPointer = newPointer;
              if (incrementingTurnIndex) this._currentTurnIndex++;
          }
      }, {
          key: 'StartFunctionEvaluationFromGame',
          value: function StartFunctionEvaluationFromGame(funcContainer, args) {
              this.callStack.Push(PushPopType.FunctionEvaluationFromGame, this.evaluationStack.length);
              this.callStack.currentElement.currentPointer = Pointer.StartOf(funcContainer);
              this.PassArgumentsToEvaluationStack(args);
          }
      }, {
          key: 'PassArgumentsToEvaluationStack',
          value: function PassArgumentsToEvaluationStack(args) {
              // Pass arguments onto the evaluation stack
              if (args != null) {
                  for (var i = 0; i < args.length; i++) {
                      if (!(typeof args[i] === 'number' || typeof args[i] === 'string')) {
                          throw new Error('ink arguments when calling EvaluateFunction / ChoosePathStringWithParameters  must be int, float or string');
                      }
                      this.PushEvaluationStack(Value.Create(args[i]));
                  }
              }
          }
      }, {
          key: 'TryExitFunctionEvaluationFromGame',
          value: function TryExitFunctionEvaluationFromGame() {
              if (this.callStack.currentElement.type == PushPopType.FunctionEvaluationFromGame) {
                  this.currentPointer = Pointer.Null;
                  this.didSafeExit = true;
                  return true;
              }
              return false;
          }
      }, {
          key: 'CompleteFunctionEvaluationFromGame',
          value: function CompleteFunctionEvaluationFromGame() {
              if (this.callStack.currentElement.type != PushPopType.FunctionEvaluationFromGame) {
                  throw new StoryException('Expected external function evaluation to be complete. Stack trace: ' + this.callStack.callStackTrace);
              }
              var originalEvaluationStackHeight = this.callStack.currentElement.evaluationStackHeightWhenPushed;
              var returnedObj = null;
              while (this.evaluationStack.length > originalEvaluationStackHeight) {
                  var poppedObj = this.PopEvaluationStack();
                  if (returnedObj === null) returnedObj = poppedObj;
              }
              this.PopCallStack(PushPopType.FunctionEvaluationFromGame);
              if (returnedObj) {
                  if (returnedObj instanceof Void) return null;
                  // Some kind of value, if not void
                  // var returnVal = returnedObj as Runtime.Value;
                  var returnVal = asOrThrows(returnedObj, Value);
                  // DivertTargets get returned as the string of components
                  // (rather than a Path, which isn't public)
                  if (returnVal.valueType == ValueType.DivertTarget) {
                      return returnVal.valueObject.toString();
                  }
                  // Other types can just have their exact object type:
                  // int, float, string. VariablePointers get returned as strings.
                  return returnVal.valueObject;
              }
              return null;
          }
      }, {
          key: 'AddError',
          value: function AddError(message, isWarning) {
              if (!isWarning) {
                  if (this._currentErrors == null) this._currentErrors = [];
                  this._currentErrors.push(message);
              } else {
                  if (this._currentWarnings == null) this._currentWarnings = [];
                  this._currentWarnings.push(message);
              }
          }
      }, {
          key: 'OutputStreamDirty',
          value: function OutputStreamDirty() {
              this._outputStreamTextDirty = true;
              this._outputStreamTagsDirty = true;
          }
      }, {
          key: 'callstackDepth',
          get: function get$$1() {
              return this.callStack.depth;
          }
      }, {
          key: 'outputStream',
          get: function get$$1() {
              return this._outputStream;
          }
      }, {
          key: 'currentChoices',
          get: function get$$1() {
              // If we can continue generating text content rather than choices,
              // then we reflect the choice list as being empty, since choices
              // should always come at the end.
              if (this.canContinue) return [];
              return this._currentChoices;
          }
      }, {
          key: 'generatedChoices',
          get: function get$$1() {
              return this._currentChoices;
          }
      }, {
          key: 'currentErrors',
          get: function get$$1() {
              return this._currentErrors;
          }
      }, {
          key: 'currentWarnings',
          get: function get$$1() {
              return this._currentWarnings;
          }
      }, {
          key: 'variablesState',
          get: function get$$1() {
              return this._variablesState;
          }
      }, {
          key: 'evaluationStack',
          get: function get$$1() {
              return this._evaluationStack;
          }
      }, {
          key: 'visitCounts',
          get: function get$$1() {
              return this._visitCounts;
          }
      }, {
          key: 'turnIndices',
          get: function get$$1() {
              return this._turnIndices;
          }
      }, {
          key: 'currentTurnIndex',
          get: function get$$1() {
              return this._currentTurnIndex;
          }
      }, {
          key: 'currentPathString',
          get: function get$$1() {
              var pointer = this.currentPointer;
              if (pointer.isNull) {
                  return null;
              } else {
                  if (pointer.path === null) {
                      return throwNullException('pointer.path');
                  }
                  return pointer.path.toString();
              }
          }
      }, {
          key: 'currentPointer',
          get: function get$$1() {
              return this.callStack.currentElement.currentPointer.copy();
          },
          set: function set$$1(value) {
              this.callStack.currentElement.currentPointer = value.copy();
          }
      }, {
          key: 'previousPointer',
          get: function get$$1() {
              return this.callStack.currentThread.previousPointer.copy();
          },
          set: function set$$1(value) {
              this.callStack.currentThread.previousPointer = value.copy();
          }
      }, {
          key: 'canContinue',
          get: function get$$1() {
              return !this.currentPointer.isNull && !this.hasError;
          }
      }, {
          key: 'hasError',
          get: function get$$1() {
              return this.currentErrors != null && this.currentErrors.length > 0;
          }
      }, {
          key: 'hasWarning',
          get: function get$$1() {
              return this.currentWarnings != null && this.currentWarnings.length > 0;
          }
      }, {
          key: 'currentText',
          get: function get$$1() {
              if (this._outputStreamTextDirty) {
                  var sb = new StringBuilder();
                  var _iteratorNormalCompletion3 = true;
                  var _didIteratorError3 = false;
                  var _iteratorError3 = undefined;

                  try {
                      for (var _iterator3 = this._outputStream[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                          var outputObj = _step3.value;

                          // var textContent = outputObj as StringValue;
                          var textContent = asOrNull(outputObj, StringValue);
                          if (textContent !== null) {
                              sb.Append(textContent.value);
                          }
                      }
                  } catch (err) {
                      _didIteratorError3 = true;
                      _iteratorError3 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion3 && _iterator3.return) {
                              _iterator3.return();
                          }
                      } finally {
                          if (_didIteratorError3) {
                              throw _iteratorError3;
                          }
                      }
                  }

                  this._currentText = this.CleanOutputWhitespace(sb.toString());
                  this._outputStreamTextDirty = false;
              }
              return this._currentText;
          }
      }, {
          key: 'currentTags',
          get: function get$$1() {
              if (this._outputStreamTagsDirty) {
                  this._currentTags = [];
                  var _iteratorNormalCompletion4 = true;
                  var _didIteratorError4 = false;
                  var _iteratorError4 = undefined;

                  try {
                      for (var _iterator4 = this._outputStream[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                          var outputObj = _step4.value;

                          // var tag = outputObj as Tag;
                          var tag = asOrNull(outputObj, Tag);
                          if (tag !== null) {
                              this._currentTags.push(tag.text);
                          }
                      }
                  } catch (err) {
                      _didIteratorError4 = true;
                      _iteratorError4 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion4 && _iterator4.return) {
                              _iterator4.return();
                          }
                      } finally {
                          if (_didIteratorError4) {
                              throw _iteratorError4;
                          }
                      }
                  }

                  this._outputStreamTagsDirty = false;
              }
              return this._currentTags;
          }
      }, {
          key: 'inExpressionEvaluation',
          get: function get$$1() {
              return this.callStack.currentElement.inExpressionEvaluation;
          },
          set: function set$$1(value) {
              this.callStack.currentElement.inExpressionEvaluation = value;
          }
      }, {
          key: 'jsonToken',
          get: function get$$1() {
              var obj = {};
              var choiceThreads = void 0;
              var _iteratorNormalCompletion5 = true;
              var _didIteratorError5 = false;
              var _iteratorError5 = undefined;

              try {
                  for (var _iterator5 = this._currentChoices[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                      var c = _step5.value;

                      if (c.threadAtGeneration === null) {
                          return throwNullException('c.threadAtGeneration');
                      }
                      c.originalThreadIndex = c.threadAtGeneration.threadIndex;
                      if (this.callStack.ThreadWithIndex(c.originalThreadIndex) == null) {
                          if (choiceThreads == null) choiceThreads = new Map();
                          choiceThreads[c.originalThreadIndex.toString()] = c.threadAtGeneration.jsonToken;
                      }
                  }
              } catch (err) {
                  _didIteratorError5 = true;
                  _iteratorError5 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion5 && _iterator5.return) {
                          _iterator5.return();
                      }
                  } finally {
                      if (_didIteratorError5) {
                          throw _iteratorError5;
                      }
                  }
              }

              if (choiceThreads != null) obj['choiceThreads'] = choiceThreads;
              obj['callstackThreads'] = this.callStack.GetJsonToken();
              obj['variablesState'] = this.variablesState.jsonToken;
              obj['evalStack'] = JsonSerialisation.ListToJArray(this.evaluationStack);
              obj['outputStream'] = JsonSerialisation.ListToJArray(this._outputStream);
              obj['currentChoices'] = JsonSerialisation.ListToJArray(this._currentChoices);
              if (!this.divertedPointer.isNull) {
                  if (this.divertedPointer.path === null) {
                      return throwNullException('this.divertedPointer.path');
                  }
                  obj['currentDivertTarget'] = this.divertedPointer.path.componentsString;
              }
              obj['visitCounts'] = JsonSerialisation.IntDictionaryToJObject(this.visitCounts);
              obj['turnIndices'] = JsonSerialisation.IntDictionaryToJObject(this.turnIndices);
              obj['turnIdx'] = this.currentTurnIndex;
              obj['storySeed'] = this.storySeed;
              obj['inkSaveVersion'] = this.kInkSaveStateVersion;
              // Not using this right now, but could do in future.
              obj['inkFormatVersion'] = this.story.inkVersionCurrent;
              return obj;
          },
          set: function set$$1(value) {
              var jObject = value;
              var jSaveVersion = jObject['inkSaveVersion'];
              if (jSaveVersion == null) {
                  throw new StoryException("ink save format incorrect, can't load.");
              } else if (parseInt(jSaveVersion) < this.kMinCompatibleLoadVersion) {
                  throw new StoryException("Ink save format isn't compatible with the current version (saw '" + jSaveVersion + "', but minimum is " + this.kMinCompatibleLoadVersion + "), so can't load.");
              }
              this.callStack.SetJsonToken(jObject['callstackThreads'], this.story);
              this.variablesState.jsonToken = jObject['variablesState'];
              this._evaluationStack = JsonSerialisation.JArrayToRuntimeObjList(jObject['evalStack']);
              this._outputStream = JsonSerialisation.JArrayToRuntimeObjList(jObject['outputStream']);
              this.OutputStreamDirty();
              // currentChoices = Json.JArrayToRuntimeObjList<Choice>((JArray)jObject ["currentChoices"]);
              this._currentChoices = JsonSerialisation.JArrayToRuntimeObjList(jObject['currentChoices']);
              var currentDivertTargetPath = jObject['currentDivertTarget'];
              if (currentDivertTargetPath != null) {
                  var divertPath = new Path(currentDivertTargetPath.toString());
                  this.divertedPointer = this.story.PointerAtPath(divertPath);
              }
              this._visitCounts = JsonSerialisation.JObjectToIntDictionary(jObject['visitCounts']);
              this._turnIndices = JsonSerialisation.JObjectToIntDictionary(jObject['turnIndices']);
              this._currentTurnIndex = parseInt(jObject['turnIdx']);
              this.storySeed = parseInt(jObject['storySeed']);
              // var jChoiceThreads = jObject["choiceThreads"] as JObject;
              var jChoiceThreads = jObject['choiceThreads'];
              var _iteratorNormalCompletion6 = true;
              var _didIteratorError6 = false;
              var _iteratorError6 = undefined;

              try {
                  for (var _iterator6 = this._currentChoices[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                      var c = _step6.value;

                      var foundActiveThread = this.callStack.ThreadWithIndex(c.originalThreadIndex);
                      if (foundActiveThread != null) {
                          c.threadAtGeneration = foundActiveThread.Copy();
                      } else {
                          var jSavedChoiceThread = jChoiceThreads[c.originalThreadIndex.toString()];
                          c.threadAtGeneration = new CallStack.Thread(jSavedChoiceThread, this.story);
                      }
                  }
              } catch (err) {
                  _didIteratorError6 = true;
                  _iteratorError6 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion6 && _iterator6.return) {
                          _iterator6.return();
                      }
                  } finally {
                      if (_didIteratorError6) {
                          throw _iteratorError6;
                      }
                  }
              }
          }
      }, {
          key: 'outputStreamEndsInNewline',
          get: function get$$1() {
              if (this._outputStream.length > 0) {
                  for (var i = this._outputStream.length - 1; i >= 0; i--) {
                      var obj = this._outputStream[i];
                      if (obj instanceof ControlCommand) break;
                      var text = this._outputStream[i];
                      if (text instanceof StringValue) {
                          if (text.isNewline) return true;else if (text.isNonWhitespace) break;
                      }
                  }
              }
              return false;
          }
      }, {
          key: 'outputStreamContainsContent',
          get: function get$$1() {
              for (var i = 0; i < this._outputStream.length; i++) {
                  if (this._outputStream[i] instanceof StringValue) return true;
              }
              return false;
          }
      }, {
          key: 'inStringEvaluation',
          get: function get$$1() {
              for (var i = this._outputStream.length - 1; i >= 0; i--) {
                  // var cmd = this._outputStream[i] as ControlCommand;
                  var cmd = asOrNull(this._outputStream[i], ControlCommand);
                  if (cmd instanceof ControlCommand && cmd.commandType == ControlCommand.CommandType.BeginString) {
                      return true;
                  }
              }
              return false;
          }
      }]);
      return StoryState;
  }();

  // This is simple replacement of the Stopwatch class from the .NET Framework.
  // The original class can count time with much more accuracy than the Javascript version.
  // It might be worth considering using `window.performance` in the browser
  // or `process.hrtime()` in node.
  var Stopwatch = function () {
      function Stopwatch() {
          classCallCheck(this, Stopwatch);

          this.startTime = undefined;
      }

      createClass(Stopwatch, [{
          key: 'Start',
          value: function Start() {
              this.startTime = new Date().getTime();
          }
      }, {
          key: 'Stop',
          value: function Stop() {
              this.startTime = undefined;
          }
      }, {
          key: 'ElapsedMilliseconds',
          get: function get$$1() {
              if (typeof this.startTime === 'undefined') {
                  return 0;
              }
              return new Date().getTime() - this.startTime;
          }
      }]);
      return Stopwatch;
  }();

  // tslint:disable no-conditional-assignment
  if (!Number.isInteger) {
      Number.isInteger = function isInteger(nVal) {
          return typeof nVal === 'number' && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
      };
  }
  exports.Story = function (_InkObject) {
      inherits(Story, _InkObject);

      function Story() {
          classCallCheck(this, Story);

          var _this = possibleConstructorReturn(this, (Story.__proto__ || Object.getPrototypeOf(Story)).call(this));

          _this.inkVersionCurrent = 19;
          _this.inkVersionMinimumCompatible = 18;
          _this._prevContainers = [];
          _this.allowExternalFunctionFallbacks = false;
          _this._listDefinitions = null;
          _this._variableObservers = null;
          _this._hasValidatedExternals = false;
          _this._temporaryEvaluationContainer = null;
          _this._asyncContinueActive = false;
          _this._stateAtLastNewline = null;
          _this._recursiveContinueCount = 0;
          _this._profiler = null; // TODO: Profiler
          // Discrimination between constructors
          var contentContainer = void 0;
          var lists = null;
          var json = null;
          if (arguments[0] instanceof Container) {
              contentContainer = arguments[0];
              if (typeof arguments[1] !== 'undefined') {
                  lists = arguments[1];
              }
              // ------ Story (Container contentContainer, List<Runtime.ListDefinition> lists = null)
              _this._mainContentContainer = contentContainer;
              // ------
          } else {
              if (typeof arguments[0] === 'string') {
                  var jsonString = arguments[0];
                  json = JSON.parse(jsonString);
              } else {
                  json = arguments[0];
              }
          }
          // ------ Story (Container contentContainer, List<Runtime.ListDefinition> lists = null)
          if (lists != null) _this._listDefinitions = new ListDefinitionsOrigin(lists);
          _this._externals = new Map();
          // ------
          // ------ Story(string jsonString) : this((Container)null)
          if (json !== null) {
              var rootObject = json;
              var versionObj = rootObject['inkVersion'];
              if (versionObj == null) throw new Error("ink version number not found. Are you sure it's a valid .ink.json file?");
              var formatFromFile = parseInt(versionObj);
              if (formatFromFile > _this.inkVersionCurrent) {
                  throw new Error('Version of ink used to build story was newer than the current version of the engine');
              } else if (formatFromFile < _this.inkVersionMinimumCompatible) {
                  throw new Error('Version of ink used to build story is too old to be loaded by this version of the engine');
              } else if (formatFromFile != _this.inkVersionCurrent) {
                  console.warn("WARNING: Version of ink used to build story doesn't match current version of engine. Non-critical, but recommend synchronising.");
              }
              var rootToken = rootObject['root'];
              if (rootToken == null) throw new Error("Root node for ink not found. Are you sure it's a valid .ink.json file?");
              var listDefsObj = void 0;
              if (listDefsObj = rootObject['listDefs']) {
                  _this._listDefinitions = JsonSerialisation.JTokenToListDefinitions(listDefsObj);
              }
              _this._mainContentContainer = asOrThrows(JsonSerialisation.JTokenToRuntimeObject(rootToken), Container);
              _this.ResetState();
          }
          // ------
          return _this;
      }

      createClass(Story, [{
          key: 'StartProfiling',

          // TODO: Implement Profiler
          value: function StartProfiling() {}
      }, {
          key: 'EndProfiling',
          value: function EndProfiling() {}
      }, {
          key: 'ToJsonString',
          value: function ToJsonString() {
              var rootContainerJsonList = JsonSerialisation.RuntimeObjectToJToken(this._mainContentContainer);
              var rootObject = {};
              rootObject['inkVersion'] = this.inkVersionCurrent;
              rootObject['root'] = rootContainerJsonList;
              if (this._listDefinitions != null) rootObject['listDefs'] = JsonSerialisation.ListDefinitionsToJToken(this._listDefinitions);
              return JSON.stringify(rootObject);
          }
      }, {
          key: 'ResetState',
          value: function ResetState() {
              this.IfAsyncWeCant('ResetState');
              this._state = new StoryState(this);
              this._state.variablesState.ObserveVariableChange(this.VariableStateDidChangeEvent.bind(this));
              this.ResetGlobals();
          }
      }, {
          key: 'ResetErrors',
          value: function ResetErrors() {
              if (this._state === null) {
                  return throwNullException('this._state');
              }
              this._state.ResetErrors();
          }
      }, {
          key: 'ResetCallstack',
          value: function ResetCallstack() {
              this.IfAsyncWeCant('ResetCallstack');
              if (this._state === null) {
                  return throwNullException('this._state');
              }
              this._state.ForceEnd();
          }
      }, {
          key: 'ResetGlobals',
          value: function ResetGlobals() {
              if (this._mainContentContainer.namedContent.get('global decl')) {
                  var originalPointer = this.state.currentPointer.copy();
                  this.ChoosePath(new Path('global decl'), false);
                  this.ContinueInternal();
                  this.state.currentPointer = originalPointer;
              }
              this.state.variablesState.SnapshotDefaultGlobals();
          }
      }, {
          key: 'Continue',
          value: function Continue() {
              this.ContinueAsync(0);
              return this.currentText;
          }
      }, {
          key: 'ContinueAsync',
          value: function ContinueAsync(millisecsLimitAsync) {
              if (!this._hasValidatedExternals) this.ValidateExternalBindings();
              this.ContinueInternal(millisecsLimitAsync);
          }
      }, {
          key: 'ContinueInternal',
          value: function ContinueInternal() {
              var millisecsLimitAsync = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

              if (this._profiler != null) this._profiler.PreContinue();
              var isAsyncTimeLimited = millisecsLimitAsync > 0;
              this._recursiveContinueCount++;
              if (!this._asyncContinueActive) {
                  this._asyncContinueActive = isAsyncTimeLimited;
                  if (!this.canContinue) {
                      throw new StoryException("Can't continue - should check canContinue before calling Continue");
                  }
                  this._state.didSafeExit = false;
                  this._state.ResetOutput();
                  if (this._recursiveContinueCount == 1) this._state.variablesState.batchObservingVariableChanges = true;
              }
              var durationStopwatch = new Stopwatch();
              durationStopwatch.Start();
              var outputStreamEndsInNewline = false;
              do {
                  try {
                      outputStreamEndsInNewline = this.ContinueSingleStep();
                  } catch (e) {
                      if (!(e instanceof StoryException)) throw e;
                      this.AddError(e.message, undefined, e.useEndLineNumber);
                      break;
                  }
                  if (outputStreamEndsInNewline) break;
                  if (this._asyncContinueActive && durationStopwatch.ElapsedMilliseconds > millisecsLimitAsync) {
                      break;
                  }
              } while (this.canContinue);
              durationStopwatch.Stop();
              if (outputStreamEndsInNewline || !this.canContinue) {
                  if (this._stateAtLastNewline != null) {
                      this.RestoreStateSnapshot(this._stateAtLastNewline);
                      this._stateAtLastNewline = null;
                  }
                  if (!this.canContinue) {
                      if (this.state.callStack.canPopThread) this.AddError('Thread available to pop, threads should always be flat by the end of evaluation?');
                      if (this.state.generatedChoices.length == 0 && !this.state.didSafeExit && this._temporaryEvaluationContainer == null) {
                          if (this.state.callStack.CanPop(PushPopType.Tunnel)) this.AddError("unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?");else if (this.state.callStack.CanPop(PushPopType.Function)) this.AddError("unexpectedly reached end of content. Do you need a '~ return'?");else if (!this.state.callStack.canPop) this.AddError("ran out of content. Do you need a '-> DONE' or '-> END'?");else this.AddError('unexpectedly reached end of content for unknown reason. Please debug compiler!');
                      }
                  }
                  this.state.didSafeExit = false;
                  if (this._recursiveContinueCount == 1) this._state.variablesState.batchObservingVariableChanges = false;
                  this._asyncContinueActive = false;
              }
              this._recursiveContinueCount--;
              if (this._profiler != null) this._profiler.PostContinue();
          }
      }, {
          key: 'ContinueSingleStep',
          value: function ContinueSingleStep() {
              if (this._profiler != null) this._profiler.PreStep();
              this.Step();
              if (this._profiler != null) this._profiler.PostStep();
              if (!this.canContinue && !this.state.callStack.elementIsEvaluateFromGame) {
                  this.TryFollowDefaultInvisibleChoice();
              }
              if (this._profiler != null) this._profiler.PreSnapshot();
              if (!this.state.inStringEvaluation) {
                  if (this._stateAtLastNewline != null) {
                      if (this._stateAtLastNewline.currentTags === null) {
                          return throwNullException('this._stateAtLastNewline.currentTags');
                      }
                      if (this.state.currentTags === null) {
                          return throwNullException('this.state.currentTags');
                      }
                      var change = this.CalculateNewlineOutputStateChange(this._stateAtLastNewline.currentText, this.state.currentText, this._stateAtLastNewline.currentTags.length, this.state.currentTags.length);
                      if (change == Story.OutputStateChange.ExtendedBeyondNewline) {
                          this.RestoreStateSnapshot(this._stateAtLastNewline);
                          return true;
                      } else if (change == Story.OutputStateChange.NewlineRemoved) {
                          this._stateAtLastNewline = null;
                      }
                  }
                  if (this.state.outputStreamEndsInNewline) {
                      if (this.canContinue) {
                          if (this._stateAtLastNewline == null) this._stateAtLastNewline = this.StateSnapshot();
                      } else {
                          this._stateAtLastNewline = null;
                      }
                  }
              }
              if (this._profiler != null) this._profiler.PostSnapshot();
              return false;
          }
      }, {
          key: 'CalculateNewlineOutputStateChange',
          value: function CalculateNewlineOutputStateChange(prevText, currText, prevTagCount, currTagCount) {
              if (prevText === null) {
                  return throwNullException('prevText');
              }
              if (currText === null) {
                  return throwNullException('currText');
              }
              var newlineStillExists = currText.length >= prevText.length && currText.charAt(prevText.length - 1) == '\n';
              if (prevTagCount == currTagCount && prevText.length == currText.length && newlineStillExists) return Story.OutputStateChange.NoChange;
              if (!newlineStillExists) {
                  return Story.OutputStateChange.NewlineRemoved;
              }
              if (currTagCount > prevTagCount) return Story.OutputStateChange.ExtendedBeyondNewline;
              for (var i = prevText.length; i < currText.length; i++) {
                  var c = currText.charAt(i);
                  if (c != ' ' && c != '\t') {
                      return Story.OutputStateChange.ExtendedBeyondNewline;
                  }
              }
              return Story.OutputStateChange.NoChange;
          }
      }, {
          key: 'ContinueMaximally',
          value: function ContinueMaximally() {
              this.IfAsyncWeCant('ContinueMaximally');
              var sb = new StringBuilder();
              while (this.canContinue) {
                  sb.Append(this.Continue());
              }
              return sb.toString();
          }
      }, {
          key: 'ContentAtPath',
          value: function ContentAtPath(path) {
              return this.mainContentContainer.ContentAtPath(path);
          }
      }, {
          key: 'KnotContainerWithName',
          value: function KnotContainerWithName(name) {
              var namedContainer = this.mainContentContainer.namedContent.get(name);
              if (namedContainer instanceof Container) return namedContainer;else return null;
          }
      }, {
          key: 'PointerAtPath',
          value: function PointerAtPath(path) {
              if (path.length == 0) return Pointer.Null;
              var p = new Pointer();
              var pathLengthToUse = path.length;
              var result = null;
              if (path.lastComponent === null) {
                  return throwNullException('path.lastComponent');
              }
              if (path.lastComponent.isIndex) {
                  pathLengthToUse = path.length - 1;
                  result = this.mainContentContainer.ContentAtPath(path, undefined, pathLengthToUse);
                  p.container = result.container;
                  p.index = path.lastComponent.index;
              } else {
                  result = this.mainContentContainer.ContentAtPath(path);
                  p.container = result.container;
                  p.index = -1;
              }
              if (result.obj == null || result.obj == this.mainContentContainer && pathLengthToUse > 0) {
                  this.Error("Failed to find content at path '" + path + "', and no approximation of it was possible.");
              } else if (result.approximate) this.Warning("Failed to find content at path '" + path + "', so it was approximated to: '" + result.obj.path + "'.");
              return p;
          }
      }, {
          key: 'StateSnapshot',
          value: function StateSnapshot() {
              return this.state.Copy();
          }
      }, {
          key: 'RestoreStateSnapshot',
          value: function RestoreStateSnapshot(state) {
              this._state = state;
          }
      }, {
          key: 'Step',
          value: function Step() {
              var shouldAddToStream = true;
              var pointer = this.state.currentPointer.copy();
              if (pointer.isNull) {
                  return;
              }
              // Container containerToEnter = pointer.Resolve () as Container;
              var containerToEnter = asOrNull(pointer.Resolve(), Container);
              while (containerToEnter) {
                  this.VisitContainer(containerToEnter, true);
                  // No content? the most we can do is step past it
                  if (containerToEnter.content.length == 0) {
                      break;
                  }
                  pointer = Pointer.StartOf(containerToEnter);
                  // containerToEnter = pointer.Resolve() as Container;
                  containerToEnter = asOrNull(pointer.Resolve(), Container);
              }
              this.state.currentPointer = pointer.copy();
              if (this._profiler != null) this._profiler.Step(this.state.callStack);
              // Is the current content object:
              //  - Normal content
              //  - Or a logic/flow statement - if so, do it
              // Stop flow if we hit a stack pop when we're unable to pop (e.g. return/done statement in knot
              // that was diverted to rather than called as a function)
              var currentContentObj = pointer.Resolve();
              var isLogicOrFlowControl = this.PerformLogicAndFlowControl(currentContentObj);
              // Has flow been forced to end by flow control above?
              if (this.state.currentPointer.isNull) {
                  return;
              }
              if (isLogicOrFlowControl) {
                  shouldAddToStream = false;
              }
              // Choice with condition?
              // var choicePoint = currentContentObj as ChoicePoint;
              var choicePoint = asOrNull(currentContentObj, ChoicePoint);
              if (choicePoint) {
                  var choice = this.ProcessChoice(choicePoint);
                  if (choice) {
                      this.state.generatedChoices.push(choice);
                  }
                  currentContentObj = null;
                  shouldAddToStream = false;
              }
              // If the container has no content, then it will be
              // the "content" itself, but we skip over it.
              if (currentContentObj instanceof Container) {
                  shouldAddToStream = false;
              }
              // Content to add to evaluation stack or the output stream
              if (shouldAddToStream) {
                  // If we're pushing a variable pointer onto the evaluation stack, ensure that it's specific
                  // to our current (possibly temporary) context index. And make a copy of the pointer
                  // so that we're not editing the original runtime object.
                  // var varPointer = currentContentObj as VariablePointerValue;
                  var varPointer = asOrNull(currentContentObj, VariablePointerValue);
                  if (varPointer && varPointer.contextIndex == -1) {
                      // Create new object so we're not overwriting the story's own data
                      var contextIdx = this.state.callStack.ContextForVariableNamed(varPointer.variableName);
                      currentContentObj = new VariablePointerValue(varPointer.variableName, contextIdx);
                  }
                  // Expression evaluation content
                  if (this.state.inExpressionEvaluation) {
                      this.state.PushEvaluationStack(currentContentObj);
                  }
                  // Output stream content (i.e. not expression evaluation)
                  else {
                          this.state.PushToOutputStream(currentContentObj);
                      }
              }
              // Increment the content pointer, following diverts if necessary
              this.NextContent();
              // Starting a thread should be done after the increment to the content pointer,
              // so that when returning from the thread, it returns to the content after this instruction.
              // var controlCmd = currentContentObj as ;
              var controlCmd = asOrNull(currentContentObj, ControlCommand);
              if (controlCmd && controlCmd.commandType == ControlCommand.CommandType.StartThread) {
                  this.state.callStack.PushThread();
              }
          }
      }, {
          key: 'VisitContainer',
          value: function VisitContainer(container, atStart) {
              if (!container.countingAtStartOnly || atStart) {
                  if (container.visitsShouldBeCounted) this.IncrementVisitCountForContainer(container);
                  if (container.turnIndexShouldBeCounted) this.RecordTurnIndexVisitToContainer(container);
              }
          }
      }, {
          key: 'VisitChangedContainersDueToDivert',
          value: function VisitChangedContainersDueToDivert() {
              var previousPointer = this.state.previousPointer.copy();
              var pointer = this.state.currentPointer.copy();
              if (pointer.isNull || pointer.index == -1) return;
              this._prevContainers.length = 0;
              if (!previousPointer.isNull) {
                  // Container prevAncestor = previousPointer.Resolve() as Container ?? previousPointer.container as Container;
                  var resolvedPreviousAncestor = previousPointer.Resolve();
                  var prevAncestor = asOrNull(resolvedPreviousAncestor, Container) || asOrNull(previousPointer.container, Container);
                  while (prevAncestor) {
                      this._prevContainers.push(prevAncestor);
                      // prevAncestor = prevAncestor.parent as Container;
                      prevAncestor = asOrNull(prevAncestor.parent, Container);
                  }
              }
              var currentChildOfContainer = pointer.Resolve();
              if (currentChildOfContainer == null) return;
              // Container currentContainerAncestor = currentChildOfContainer.parent as Container;
              var currentContainerAncestor = asOrNull(currentChildOfContainer.parent, Container);
              while (currentContainerAncestor && (this._prevContainers.indexOf(currentContainerAncestor) < 0 || currentContainerAncestor.countingAtStartOnly)) {
                  // Check whether this ancestor container is being entered at the start,
                  // by checking whether the child object is the first.
                  var enteringAtStart = currentContainerAncestor.content.length > 0 && currentChildOfContainer == currentContainerAncestor.content[0];
                  // Mark a visit to this container
                  this.VisitContainer(currentContainerAncestor, enteringAtStart);
                  currentChildOfContainer = currentContainerAncestor;
                  // currentContainerAncestor = currentContainerAncestor.parent as Container;
                  currentContainerAncestor = asOrNull(currentContainerAncestor.parent, Container);
              }
          }
      }, {
          key: 'ProcessChoice',
          value: function ProcessChoice(choicePoint) {
              var showChoice = true;
              // Don't create choice if choice point doesn't pass conditional
              if (choicePoint.hasCondition) {
                  var conditionValue = this.state.PopEvaluationStack();
                  if (!this.IsTruthy(conditionValue)) {
                      showChoice = false;
                  }
              }
              var startText = '';
              var choiceOnlyText = '';
              if (choicePoint.hasChoiceOnlyContent) {
                  // var choiceOnlyStrVal = state.PopEvaluationStack () as StringValue;
                  var choiceOnlyStrVal = asOrThrows(this.state.PopEvaluationStack(), StringValue);
                  choiceOnlyText = choiceOnlyStrVal.value || '';
              }
              if (choicePoint.hasStartContent) {
                  // var startStrVal = state.PopEvaluationStack () as StringValue;
                  var startStrVal = asOrThrows(this.state.PopEvaluationStack(), StringValue);
                  startText = startStrVal.value || '';
              }
              // Don't create choice if player has already read this content
              if (choicePoint.onceOnly) {
                  var visitCount = this.VisitCountForContainer(choicePoint.choiceTarget);
                  if (visitCount > 0) {
                      showChoice = false;
                  }
              }
              // We go through the full process of creating the choice above so
              // that we consume the content for it, since otherwise it'll
              // be shown on the output stream.
              if (!showChoice) {
                  return null;
              }
              var choice = new Choice();
              choice.targetPath = choicePoint.pathOnChoice;
              choice.sourcePath = choicePoint.path.toString();
              choice.isInvisibleDefault = choicePoint.isInvisibleDefault;
              choice.threadAtGeneration = this.state.callStack.currentThread.Copy();
              choice.text = (startText + choiceOnlyText).replace(/^[ \t]+|[ \t]+$/g, '');
              return choice;
          }
      }, {
          key: 'IsTruthy',
          value: function IsTruthy(obj) {
              var truthy = false;
              if (obj instanceof Value) {
                  var val = obj;
                  if (val instanceof DivertTargetValue) {
                      var divTarget = val;
                      this.Error("Shouldn't use a divert target (to " + divTarget.targetPath + ") as a conditional value. Did you intend a function call 'likeThis()' or a read count check 'likeThis'? (no arrows)");
                      return false;
                  }
                  return val.isTruthy;
              }
              return truthy;
          }
      }, {
          key: 'PerformLogicAndFlowControl',
          value: function PerformLogicAndFlowControl(contentObj) {
              if (contentObj == null) {
                  return false;
              }
              // Divert
              if (contentObj instanceof Divert) {
                  var currentDivert = contentObj;
                  if (currentDivert.isConditional) {
                      var conditionValue = this.state.PopEvaluationStack();
                      // False conditional? Cancel divert
                      if (!this.IsTruthy(conditionValue)) return true;
                  }
                  if (currentDivert.hasVariableTarget) {
                      var varName = currentDivert.variableDivertName;
                      var varContents = this.state.variablesState.GetVariableWithName(varName);
                      if (varContents == null) {
                          this.Error('Tried to divert using a target from a variable that could not be found (' + varName + ')');
                      } else if (!(varContents instanceof DivertTargetValue)) {
                          // var intContent = varContents as IntValue;
                          var intContent = asOrNull(varContents, IntValue);
                          var errorMessage = 'Tried to divert to a target from a variable, but the variable (' + varName + ") didn't contain a divert target, it ";
                          if (intContent instanceof IntValue && intContent.value == 0) {
                              errorMessage += 'was empty/null (the value 0).';
                          } else {
                              errorMessage += "contained '" + varContents + "'.";
                          }
                          this.Error(errorMessage);
                      }
                      var target = asOrThrows(varContents, DivertTargetValue);
                      this.state.divertedPointer = this.PointerAtPath(target.targetPath);
                  } else if (currentDivert.isExternal) {
                      this.CallExternalFunction(currentDivert.targetPathString, currentDivert.externalArgs);
                      return true;
                  } else {
                      this.state.divertedPointer = currentDivert.targetPointer.copy();
                  }
                  if (currentDivert.pushesToStack) {
                      this.state.callStack.Push(currentDivert.stackPushType, undefined, this.state.outputStream.length);
                  }
                  if (this.state.divertedPointer.isNull && !currentDivert.isExternal) {
                      if (currentDivert && currentDivert.debugMetadata && currentDivert.debugMetadata.sourceName != null) {
                          this.Error("Divert target doesn't exist: " + currentDivert.debugMetadata.sourceName);
                      } else {
                          this.Error('Divert resolution failed: ' + currentDivert);
                      }
                  }
                  return true;
              }
              // Start/end an expression evaluation? Or print out the result?
              else if (contentObj instanceof ControlCommand) {
                      var evalCommand = contentObj;
                      switch (evalCommand.commandType) {
                          case ControlCommand.CommandType.EvalStart:
                              this.Assert(this.state.inExpressionEvaluation === false, 'Already in expression evaluation?');
                              this.state.inExpressionEvaluation = true;
                              break;
                          case ControlCommand.CommandType.EvalEnd:
                              this.Assert(this.state.inExpressionEvaluation === true, 'Not in expression evaluation mode');
                              this.state.inExpressionEvaluation = false;
                              break;
                          case ControlCommand.CommandType.EvalOutput:
                              // If the expression turned out to be empty, there may not be anything on the stack
                              if (this.state.evaluationStack.length > 0) {
                                  var output = this.state.PopEvaluationStack();
                                  // Functions may evaluate to Void, in which case we skip output
                                  if (!(output instanceof Void)) {
                                      // TODO: Should we really always blanket convert to string?
                                      // It would be okay to have numbers in the output stream the
                                      // only problem is when exporting text for viewing, it skips over numbers etc.
                                      var text = new StringValue(output.toString());
                                      this.state.PushToOutputStream(text);
                                  }
                              }
                              break;
                          case ControlCommand.CommandType.NoOp:
                              break;
                          case ControlCommand.CommandType.Duplicate:
                              this.state.PushEvaluationStack(this.state.PeekEvaluationStack());
                              break;
                          case ControlCommand.CommandType.PopEvaluatedValue:
                              this.state.PopEvaluationStack();
                              break;
                          case ControlCommand.CommandType.PopFunction:
                          case ControlCommand.CommandType.PopTunnel:
                              var popType = evalCommand.commandType == ControlCommand.CommandType.PopFunction ? PushPopType.Function : PushPopType.Tunnel;
                              var overrideTunnelReturnTarget = null;
                              if (popType == PushPopType.Tunnel) {
                                  var popped = this.state.PopEvaluationStack();
                                  // overrideTunnelReturnTarget = popped as DivertTargetValue;
                                  overrideTunnelReturnTarget = asOrNull(popped, DivertTargetValue);
                                  if (overrideTunnelReturnTarget === null) {
                                      this.Assert(popped instanceof Void, "Expected void if ->-> doesn't override target");
                                  }
                              }
                              if (this.state.TryExitFunctionEvaluationFromGame()) {
                                  break;
                              } else if (this.state.callStack.currentElement.type != popType || !this.state.callStack.canPop) {
                                  var names = new Map();
                                  names.set(PushPopType.Function, 'function return statement (~ return)');
                                  names.set(PushPopType.Tunnel, 'tunnel onwards statement (->->)');
                                  var expected = names.get(this.state.callStack.currentElement.type);
                                  if (!this.state.callStack.canPop) {
                                      expected = 'end of flow (-> END or choice)';
                                  }
                                  var errorMsg = 'Found ' + names.get(popType) + ', when expected ' + expected;
                                  this.Error(errorMsg);
                              } else {
                                  this.state.PopCallStack();
                                  if (overrideTunnelReturnTarget) this.state.divertedPointer = this.PointerAtPath(overrideTunnelReturnTarget.targetPath);
                              }
                              break;
                          case ControlCommand.CommandType.BeginString:
                              this.state.PushToOutputStream(evalCommand);
                              this.Assert(this.state.inExpressionEvaluation === true, 'Expected to be in an expression when evaluating a string');
                              this.state.inExpressionEvaluation = false;
                              break;
                          case ControlCommand.CommandType.EndString:
                              var contentStackForString = [];
                              var outputCountConsumed = 0;
                              for (var i = this.state.outputStream.length - 1; i >= 0; --i) {
                                  var obj = this.state.outputStream[i];
                                  outputCountConsumed++;
                                  // var command = obj as ControlCommand;
                                  var command = asOrNull(obj, ControlCommand);
                                  if (command && command.commandType == ControlCommand.CommandType.BeginString) {
                                      break;
                                  }
                                  if (obj instanceof StringValue) {
                                      contentStackForString.push(obj);
                                  }
                              }
                              // Consume the content that was produced for this string
                              this.state.PopFromOutputStream(outputCountConsumed);
                              // The C# version uses a Stack for contentStackForString, but we're
                              // using a simple array, so we need to reverse it before using it
                              contentStackForString = contentStackForString.reverse();
                              // Build string out of the content we collected
                              var sb = new StringBuilder();
                              var _iteratorNormalCompletion = true;
                              var _didIteratorError = false;
                              var _iteratorError = undefined;

                              try {
                                  for (var _iterator = contentStackForString[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                      var c = _step.value;

                                      sb.Append(c.toString());
                                  }
                                  // Return to expression evaluation (from content mode)
                              } catch (err) {
                                  _didIteratorError = true;
                                  _iteratorError = err;
                              } finally {
                                  try {
                                      if (!_iteratorNormalCompletion && _iterator.return) {
                                          _iterator.return();
                                      }
                                  } finally {
                                      if (_didIteratorError) {
                                          throw _iteratorError;
                                      }
                                  }
                              }

                              this.state.inExpressionEvaluation = true;
                              this.state.PushEvaluationStack(new StringValue(sb.toString()));
                              break;
                          case ControlCommand.CommandType.ChoiceCount:
                              var choiceCount = this.state.generatedChoices.length;
                              this.state.PushEvaluationStack(new IntValue(choiceCount));
                              break;
                          case ControlCommand.CommandType.Turns:
                              this.state.PushEvaluationStack(new IntValue(this.state.currentTurnIndex + 1));
                              break;
                          case ControlCommand.CommandType.TurnsSince:
                          case ControlCommand.CommandType.ReadCount:
                              var _target = this.state.PopEvaluationStack();
                              if (!(_target instanceof DivertTargetValue)) {
                                  var extraNote = '';
                                  if (_target instanceof IntValue) extraNote = ". Did you accidentally pass a read count ('knot_name') instead of a target ('-> knot_name')?";
                                  this.Error('TURNS_SINCE / READ_COUNT expected a divert target (knot, stitch, label name), but saw ' + _target + extraNote);
                                  break;
                              }
                              // var divertTarget = target as DivertTargetValue;
                              var divertTarget = asOrThrows(_target, DivertTargetValue);
                              // var container = ContentAtPath (divertTarget.targetPath).correctObj as Container;
                              var container = asOrNull(this.ContentAtPath(divertTarget.targetPath).correctObj, Container);
                              var eitherCount = void 0;
                              if (container != null) {
                                  if (evalCommand.commandType == ControlCommand.CommandType.TurnsSince) eitherCount = this.TurnsSinceForContainer(container);else eitherCount = this.VisitCountForContainer(container);
                              } else {
                                  if (evalCommand.commandType == ControlCommand.CommandType.TurnsSince) eitherCount = -1;else eitherCount = 0;
                                  this.Warning('Failed to find container for ' + evalCommand.toString() + ' lookup at ' + divertTarget.targetPath.toString());
                              }
                              this.state.PushEvaluationStack(new IntValue(eitherCount));
                              break;
                          case ControlCommand.CommandType.Random:
                              {
                                  var maxInt = asOrNull(this.state.PopEvaluationStack(), IntValue);
                                  var minInt = asOrNull(this.state.PopEvaluationStack(), IntValue);
                                  if (minInt == null || minInt instanceof IntValue === false) return this.Error('Invalid value for minimum parameter of RANDOM(min, max)');
                                  if (maxInt == null || minInt instanceof IntValue === false) return this.Error('Invalid value for maximum parameter of RANDOM(min, max)');
                                  // Originally a primitive type, but here, can be null.
                                  // TODO: Replace by default value?
                                  if (maxInt.value === null) {
                                      return throwNullException('maxInt.value');
                                  }
                                  if (minInt.value === null) {
                                      return throwNullException('minInt.value');
                                  }
                                  var randomRange = maxInt.value - minInt.value + 1;
                                  if (randomRange <= 0) this.Error('RANDOM was called with minimum as ' + minInt.value + ' and maximum as ' + maxInt.value + '. The maximum must be larger');
                                  var resultSeed = this.state.storySeed + this.state.previousRandom;
                                  var random = new PRNG(resultSeed);
                                  var nextRandom = random.next();
                                  var chosenValue = nextRandom % randomRange + minInt.value;
                                  this.state.PushEvaluationStack(new IntValue(chosenValue));
                                  // Next random number (rather than keeping the Random object around)
                                  this.state.previousRandom = nextRandom;
                                  break;
                              }
                          case ControlCommand.CommandType.SeedRandom:
                              var seed = asOrNull(this.state.PopEvaluationStack(), IntValue);
                              if (seed == null || seed instanceof IntValue === false) return this.Error('Invalid value passed to SEED_RANDOM');
                              // Originally a primitive type, but here, can be null.
                              // TODO: Replace by default value?
                              if (seed.value === null) {
                                  return throwNullException('minInt.value');
                              }
                              this.state.storySeed = seed.value;
                              this.state.previousRandom = 0;
                              this.state.PushEvaluationStack(new Void());
                              break;
                          case ControlCommand.CommandType.VisitIndex:
                              var count = this.VisitCountForContainer(this.state.currentPointer.container) - 1; // index not count
                              this.state.PushEvaluationStack(new IntValue(count));
                              break;
                          case ControlCommand.CommandType.SequenceShuffleIndex:
                              var shuffleIndex = this.NextSequenceShuffleIndex();
                              this.state.PushEvaluationStack(new IntValue(shuffleIndex));
                              break;
                          case ControlCommand.CommandType.StartThread:
                              // Handled in main step function
                              break;
                          case ControlCommand.CommandType.Done:
                              // We may exist in the context of the initial
                              // act of creating the thread, or in the context of
                              // evaluating the content.
                              if (this.state.callStack.canPopThread) {
                                  this.state.callStack.PopThread();
                              }
                              // In normal flow - allow safe exit without warning
                              else {
                                      this.state.didSafeExit = true;
                                      // Stop flow in current thread
                                      this.state.currentPointer = Pointer.Null;
                                  }
                              break;
                          // Force flow to end completely
                          case ControlCommand.CommandType.End:
                              this.state.ForceEnd();
                              break;
                          case ControlCommand.CommandType.ListFromInt:
                              // var intVal = state.PopEvaluationStack () as IntValue;
                              var intVal = asOrNull(this.state.PopEvaluationStack(), IntValue);
                              // var listNameVal = state.PopEvaluationStack () as StringValue;
                              var listNameVal = asOrThrows(this.state.PopEvaluationStack(), StringValue);
                              if (intVal === null) {
                                  throw new StoryException('Passed non-integer when creating a list element from a numerical value.');
                              }
                              var generatedListValue = null;
                              if (this.listDefinitions === null) {
                                  return throwNullException('this.listDefinitions');
                              }
                              var foundListDef = this.listDefinitions.TryListGetDefinition(listNameVal.value, null);
                              if (foundListDef.exists) {
                                  // Originally a primitive type, but here, can be null.
                                  // TODO: Replace by default value?
                                  if (intVal.value === null) {
                                      return throwNullException('minInt.value');
                                  }
                                  var foundItem = foundListDef.result.TryGetItemWithValue(intVal.value, InkListItem.Null);
                                  if (foundItem.exists) {
                                      generatedListValue = new ListValue(foundItem.result, intVal.value);
                                  }
                              } else {
                                  throw new StoryException('Failed to find LIST called ' + listNameVal.value);
                              }
                              if (generatedListValue == null) generatedListValue = new ListValue();
                              this.state.PushEvaluationStack(generatedListValue);
                              break;
                          case ControlCommand.CommandType.ListRange:
                              var max = asOrNull(this.state.PopEvaluationStack(), Value);
                              var min = asOrNull(this.state.PopEvaluationStack(), Value);
                              // var targetList = state.PopEvaluationStack () as ListValue;
                              var targetList = asOrNull(this.state.PopEvaluationStack(), ListValue);
                              if (targetList === null || min === null || max === null) throw new StoryException('Expected list, minimum and maximum for LIST_RANGE');
                              if (targetList.value === null) {
                                  return throwNullException('targetList.value');
                              }
                              var result = targetList.value.ListWithSubRange(min.valueObject, max.valueObject);
                              this.state.PushEvaluationStack(new ListValue(result));
                              break;
                          case ControlCommand.CommandType.ListRandom:
                              {
                                  var listVal = this.state.PopEvaluationStack();
                                  if (listVal === null) throw new StoryException('Expected list for LIST_RANDOM');
                                  var list = listVal.value;
                                  var newList = null;
                                  if (list === null) {
                                      throw throwNullException('list');
                                  }
                                  if (list.Count == 0) {
                                      newList = new InkList();
                                  } else {
                                      // Generate a random index for the element to take
                                      var _resultSeed = this.state.storySeed + this.state.previousRandom;
                                      var _random = new PRNG(_resultSeed);
                                      var _nextRandom = _random.next();
                                      var listItemIndex = _nextRandom % list.Count;
                                      // This bit is a little different from the original
                                      // C# code, since iterators do not work in the same way.
                                      // First, we iterate listItemIndex - 1 times, calling next().
                                      // The listItemIndex-th time is made outside of the loop,
                                      // in order to retrieve the value.
                                      var listEnumerator = list.entries();
                                      for (var _i = 0; _i <= listItemIndex - 1; _i++) {
                                          listEnumerator.next();
                                      }
                                      var value = listEnumerator.next().value;
                                      var randomItem = {
                                          Key: InkListItem.fromSerializedKey(value[0]),
                                          Value: value[1]
                                      };
                                      // Origin list is simply the origin of the one element
                                      if (randomItem.Key.originName === null) {
                                          return throwNullException('randomItem.Key.originName');
                                      }
                                      newList = new InkList(randomItem.Key.originName, this);
                                      newList.Add(randomItem.Key, randomItem.Value);
                                      this.state.previousRandom = _nextRandom;
                                  }
                                  this.state.PushEvaluationStack(new ListValue(newList));
                                  break;
                              }
                          default:
                              this.Error('unhandled ControlCommand: ' + evalCommand);
                              break;
                      }
                      return true;
                  }
                  // Variable assignment
                  else if (contentObj instanceof VariableAssignment) {
                          var varAss = contentObj;
                          var assignedVal = this.state.PopEvaluationStack();
                          this.state.variablesState.Assign(varAss, assignedVal);
                          return true;
                      }
                      // Variable reference
                      else if (contentObj instanceof VariableReference) {
                              var varRef = contentObj;
                              var foundValue = null;
                              // Explicit read count value
                              if (varRef.pathForCount != null) {
                                  var _container = varRef.containerForCount;
                                  var _count = this.VisitCountForContainer(_container);
                                  foundValue = new IntValue(_count);
                              }
                              // Normal variable reference
                              else {
                                      foundValue = this.state.variablesState.GetVariableWithName(varRef.name);
                                      if (foundValue == null) {
                                          var defaultVal = this.state.variablesState.TryGetDefaultVariableValue(varRef.name);
                                          if (defaultVal != null) {
                                              this.Warning("Variable not found in save state: '" + varRef.name + "', but seems to have been newly created. Assigning value from latest ink's declaration: " + defaultVal);
                                              foundValue = defaultVal;
                                              // Save for future usage, preventing future errors
                                              // Only do this for variables that are known to be globals, not those that may be missing temps.
                                              this.state.variablesState.SetGlobal(varRef.name, foundValue);
                                          } else {
                                              this.Warning("Variable not found: '" + varRef.name + "'. Using default value of 0 (false). This can happen with temporary variables if the declaration hasn't yet been hit.");
                                              foundValue = new IntValue(0);
                                          }
                                      }
                                  }
                              this.state.PushEvaluationStack(foundValue);
                              return true;
                          }
                          // Native function call
                          else if (contentObj instanceof NativeFunctionCall) {
                                  var func = contentObj;
                                  var funcParams = this.state.PopEvaluationStack(func.numberOfParameters);
                                  var _result = func.Call(funcParams);
                                  this.state.PushEvaluationStack(_result);
                                  return true;
                              }
              // No control content, must be ordinary content
              return false;
          }
      }, {
          key: 'ChoosePathString',
          value: function ChoosePathString(path) {
              var resetCallstack = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
              var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

              this.IfAsyncWeCant('call ChoosePathString right now');
              if (resetCallstack) {
                  this.ResetCallstack();
              } else {
                  if (this.state.callStack.currentElement.type == PushPopType.Function) {
                      var funcDetail = '';
                      var container = this.state.callStack.currentElement.currentPointer.container;
                      if (container != null) {
                          funcDetail = '(' + container.path.toString() + ') ';
                      }
                      throw new Error('Story was running a function ' + funcDetail + 'when you called ChoosePathString(' + path + ') - this is almost certainly not not what you want! Full stack trace: \n' + this.state.callStack.callStackTrace);
                  }
              }
              this.state.PassArgumentsToEvaluationStack(args);
              this.ChoosePath(new Path(path));
          }
      }, {
          key: 'IfAsyncWeCant',
          value: function IfAsyncWeCant(activityStr) {
              if (this._asyncContinueActive) throw new Error("Can't " + activityStr + '. Story is in the middle of a ContinueAsync(). Make more ContinueAsync() calls or a single Continue() call beforehand.');
          }
      }, {
          key: 'ChoosePath',
          value: function ChoosePath(p) {
              var incrementingTurnIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

              this.state.SetChosenPath(p, incrementingTurnIndex);
              // Take a note of newly visited containers for read counts etc
              this.VisitChangedContainersDueToDivert();
          }
      }, {
          key: 'ChooseChoiceIndex',
          value: function ChooseChoiceIndex(choiceIdx) {
              choiceIdx = choiceIdx;
              var choices = this.currentChoices;
              this.Assert(choiceIdx >= 0 && choiceIdx < choices.length, 'choice out of range');
              var choiceToChoose = choices[choiceIdx];
              if (choiceToChoose.threadAtGeneration === null) {
                  return throwNullException('choiceToChoose.threadAtGeneration');
              }
              if (choiceToChoose.targetPath === null) {
                  return throwNullException('choiceToChoose.targetPath');
              }
              this.state.callStack.currentThread = choiceToChoose.threadAtGeneration;
              this.ChoosePath(choiceToChoose.targetPath);
          }
      }, {
          key: 'HasFunction',
          value: function HasFunction(functionName) {
              try {
                  return this.KnotContainerWithName(functionName) != null;
              } catch (e) {
                  return false;
              }
          }
      }, {
          key: 'EvaluateFunction',
          value: function EvaluateFunction(functionName) {
              var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
              var returnTextOutput = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

              // EvaluateFunction behaves slightly differently than the C# version.
              // In C#, you can pass a (second) parameter `out textOutput` to get the
              // text outputted by the function. This is not possible in js. Instead,
              // we maintain the regular signature (functionName, args), plus an
              // optional third parameter returnTextOutput. If set to true, we will
              // return both the textOutput and the returned value, as an object.
              this.IfAsyncWeCant('evaluate a function');
              if (functionName == null) {
                  throw new Error('Function is null');
              } else if (functionName == '' || functionName.trim() == '') {
                  throw new Error('Function is empty or white space.');
              }
              var funcContainer = this.KnotContainerWithName(functionName);
              if (funcContainer == null) {
                  throw new Error("Function doesn't exist: '" + functionName + "'");
              }
              var outputStreamBefore = [];
              outputStreamBefore.push.apply(outputStreamBefore, this.state.outputStream);
              this._state.ResetOutput();
              this.state.StartFunctionEvaluationFromGame(funcContainer, args);
              // Evaluate the function, and collect the string output
              var stringOutput = new StringBuilder();
              while (this.canContinue) {
                  stringOutput.Append(this.Continue());
              }
              var textOutput = stringOutput.toString();
              this._state.ResetOutput(outputStreamBefore);
              var result = this.state.CompleteFunctionEvaluationFromGame();
              return returnTextOutput ? { returned: result, output: textOutput } : result;
          }
      }, {
          key: 'EvaluateExpression',
          value: function EvaluateExpression(exprContainer) {
              var startCallStackHeight = this.state.callStack.elements.length;
              this.state.callStack.Push(PushPopType.Tunnel);
              this._temporaryEvaluationContainer = exprContainer;
              this.state.GoToStart();
              var evalStackHeight = this.state.evaluationStack.length;
              this.Continue();
              this._temporaryEvaluationContainer = null;
              // Should have fallen off the end of the Container, which should
              // have auto-popped, but just in case we didn't for some reason,
              // manually pop to restore the state (including currentPath).
              if (this.state.callStack.elements.length > startCallStackHeight) {
                  this.state.PopCallStack();
              }
              var endStackHeight = this.state.evaluationStack.length;
              if (endStackHeight > evalStackHeight) {
                  return this.state.PopEvaluationStack();
              } else {
                  return null;
              }
          }
      }, {
          key: 'CallExternalFunction',
          value: function CallExternalFunction(funcName, numberOfArguments) {
              if (funcName === null) {
                  return throwNullException('funcName');
              }
              var func = this._externals.get(funcName);
              var fallbackFunctionContainer = null;
              var foundExternal = typeof func !== 'undefined';
              // Try to use fallback function?
              if (!foundExternal) {
                  if (this.allowExternalFunctionFallbacks) {
                      fallbackFunctionContainer = this.KnotContainerWithName(funcName);
                      this.Assert(fallbackFunctionContainer !== null, "Trying to call EXTERNAL function '" + funcName + "' which has not been bound, and fallback ink function could not be found.");
                      // Divert direct into fallback function and we're done
                      this.state.callStack.Push(PushPopType.Function, undefined, this.state.outputStream.length);
                      this.state.divertedPointer = Pointer.StartOf(fallbackFunctionContainer);
                      return;
                  } else {
                      this.Assert(false, "Trying to call EXTERNAL function '" + funcName + "' which has not been bound (and ink fallbacks disabled).");
                  }
              }
              // Pop arguments
              var args = [];
              for (var i = 0; i < numberOfArguments; ++i) {
                  // var poppedObj = state.PopEvaluationStack () as Value;
                  var poppedObj = asOrThrows(this.state.PopEvaluationStack(), Value);
                  var valueObj = poppedObj.valueObject;
                  args.push(valueObj);
              }
              // Reverse arguments from the order they were popped,
              // so they're the right way round again.
              args.reverse();
              // Run the function!
              var funcResult = func(args);
              // Convert return value (if any) to the a type that the ink engine can use
              var returnObj = null;
              if (funcResult != null) {
                  returnObj = Value.Create(funcResult);
                  this.Assert(returnObj !== null, 'Could not create ink value from returned object of type ' + (typeof funcResult === 'undefined' ? 'undefined' : _typeof(funcResult)));
              } else {
                  returnObj = new Void();
              }
              this.state.PushEvaluationStack(returnObj);
          }
      }, {
          key: 'BindExternalFunctionGeneral',
          value: function BindExternalFunctionGeneral(funcName, func) {
              this.IfAsyncWeCant('bind an external function');
              this.Assert(!this._externals.has(funcName), "Function '" + funcName + "' has already been bound.");
              this._externals.set(funcName, func);
          }
      }, {
          key: 'TryCoerce',
          value: function TryCoerce(value) {
              // We're skipping type coercition in this implementation. First of, js
              // is loosely typed, so it's not that important. Secondly, there is no
              // clean way (AFAIK) for the user to describe what type of parameters
              // they expect.
              return value;
          }
      }, {
          key: 'BindExternalFunction',
          value: function BindExternalFunction(funcName, func) {
              var _this2 = this;

              this.Assert(func != null, "Can't bind a null function");
              this.BindExternalFunctionGeneral(funcName, function (args) {
                  _this2.Assert(args.length >= func.length, 'External function expected ' + func.length + ' arguments');
                  var coercedArgs = [];
                  for (var i = 0, l = args.length; i < l; i++) {
                      coercedArgs[i] = _this2.TryCoerce(args[i]);
                  }
                  return func.apply(null, coercedArgs);
              });
          }
      }, {
          key: 'UnbindExternalFunction',
          value: function UnbindExternalFunction(funcName) {
              this.IfAsyncWeCant('unbind an external a function');
              this.Assert(this._externals.has(funcName), "Function '" + funcName + "' has not been bound.");
              this._externals.delete(funcName);
          }
      }, {
          key: 'ValidateExternalBindings',
          value: function ValidateExternalBindings() {
              var c = null;
              var o = null;
              var missingExternals = arguments[1] || new Set();
              if (arguments[0] instanceof Container) {
                  c = arguments[0];
              }
              if (arguments[0] instanceof InkObject) {
                  o = arguments[0];
              }
              if (c === null && o === null) {
                  this.ValidateExternalBindings(this._mainContentContainer, missingExternals);
                  this._hasValidatedExternals = true;
                  // No problem! Validation complete
                  if (missingExternals.size == 0) {
                      this._hasValidatedExternals = true;
                  } else {
                      var message = 'Error: Missing function binding for external';
                      message += missingExternals.size > 1 ? 's' : '';
                      message += ": '";
                      message += Array.from(missingExternals).join("', '");
                      message += "' ";
                      message += this.allowExternalFunctionFallbacks ? ', and no fallback ink function found.' : ' (ink fallbacks disabled)';
                      this.Error(message);
                  }
              } else if (c != null) {
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {
                      for (var _iterator2 = c.content[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                          var innerContent = _step2.value;

                          var container = innerContent;
                          if (container == null || !container.hasValidName) this.ValidateExternalBindings(innerContent, missingExternals);
                      }
                  } catch (err) {
                      _didIteratorError2 = true;
                      _iteratorError2 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion2 && _iterator2.return) {
                              _iterator2.return();
                          }
                      } finally {
                          if (_didIteratorError2) {
                              throw _iteratorError2;
                          }
                      }
                  }

                  var _iteratorNormalCompletion3 = true;
                  var _didIteratorError3 = false;
                  var _iteratorError3 = undefined;

                  try {
                      for (var _iterator3 = c.namedContent[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                          var _ref = _step3.value;

                          var _ref2 = slicedToArray(_ref, 2);

                          var key = _ref2[0];
                          var value = _ref2[1];

                          this.ValidateExternalBindings(asOrNull(value, InkObject), missingExternals);
                      }
                  } catch (err) {
                      _didIteratorError3 = true;
                      _iteratorError3 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion3 && _iterator3.return) {
                              _iterator3.return();
                          }
                      } finally {
                          if (_didIteratorError3) {
                              throw _iteratorError3;
                          }
                      }
                  }
              } else if (o != null) {
                  var divert = asOrNull(o, Divert);
                  if (divert && divert.isExternal) {
                      var name = divert.targetPathString;
                      if (name === null) {
                          return throwNullException('name');
                      }
                      if (!this._externals.has(name)) {
                          if (this.allowExternalFunctionFallbacks) {
                              var fallbackFound = this.mainContentContainer.namedContent.has(name);
                              if (!fallbackFound) {
                                  missingExternals.add(name);
                              }
                          } else {
                              missingExternals.add(name);
                          }
                      }
                  }
              }
          }
      }, {
          key: 'ObserveVariable',
          value: function ObserveVariable(variableName, observer) {
              this.IfAsyncWeCant('observe a new variable');
              if (this._variableObservers === null) this._variableObservers = new Map();
              if (!this.state.variablesState.GlobalVariableExistsWithName(variableName)) throw new StoryException("Cannot observe variable '" + variableName + "' because it wasn't declared in the ink story.");
              if (this._variableObservers.has(variableName)) {
                  this._variableObservers.get(variableName).push(observer);
              } else {
                  this._variableObservers.set(variableName, [observer]);
              }
          }
      }, {
          key: 'ObserveVariables',
          value: function ObserveVariables(variableNames, observers) {
              for (var i = 0, l = variableNames.length; i < l; i++) {
                  this.ObserveVariable(variableNames[i], observers[i]);
              }
          }
      }, {
          key: 'RemoveVariableObserver',
          value: function RemoveVariableObserver(observer, specificVariableName) {
              this.IfAsyncWeCant('remove a variable observer');
              if (this._variableObservers === null) return;
              if (typeof specificVariableName !== 'undefined') {
                  if (this._variableObservers.has(specificVariableName)) {
                      var observers = this._variableObservers.get(specificVariableName);
                      observers.splice(observers.indexOf(observer), 1);
                  }
              } else {
                  var keys = this._variableObservers.keys();
                  var _iteratorNormalCompletion4 = true;
                  var _didIteratorError4 = false;
                  var _iteratorError4 = undefined;

                  try {
                      for (var _iterator4 = keys[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                          var varName = _step4.value;

                          var _observers = this._variableObservers.get(varName);
                          _observers.splice(_observers.indexOf(observer), 1);
                      }
                  } catch (err) {
                      _didIteratorError4 = true;
                      _iteratorError4 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion4 && _iterator4.return) {
                              _iterator4.return();
                          }
                      } finally {
                          if (_didIteratorError4) {
                              throw _iteratorError4;
                          }
                      }
                  }
              }
          }
      }, {
          key: 'VariableStateDidChangeEvent',
          value: function VariableStateDidChangeEvent(variableName, newValueObj) {
              if (this._variableObservers === null) return;
              var observers = this._variableObservers.get(variableName);
              if (typeof observers !== 'undefined') {
                  if (!(newValueObj instanceof Value)) {
                      throw new Error("Tried to get the value of a variable that isn't a standard type");
                  }
                  // var val = newValueObj as Value;
                  var val = asOrThrows(newValueObj, Value);
                  var _iteratorNormalCompletion5 = true;
                  var _didIteratorError5 = false;
                  var _iteratorError5 = undefined;

                  try {
                      for (var _iterator5 = observers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                          var observer = _step5.value;

                          observer(variableName, val.valueObject);
                      }
                  } catch (err) {
                      _didIteratorError5 = true;
                      _iteratorError5 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion5 && _iterator5.return) {
                              _iterator5.return();
                          }
                      } finally {
                          if (_didIteratorError5) {
                              throw _iteratorError5;
                          }
                      }
                  }
              }
          }
      }, {
          key: 'TagsForContentAtPath',
          value: function TagsForContentAtPath(path) {
              return this.TagsAtStartOfFlowContainerWithPathString(path);
          }
      }, {
          key: 'TagsAtStartOfFlowContainerWithPathString',
          value: function TagsAtStartOfFlowContainerWithPathString(pathString) {
              var path = new Path(pathString);
              var flowContainer = this.ContentAtPath(path).container;
              if (flowContainer === null) {
                  return throwNullException('flowContainer');
              }
              while (true) {
                  var firstContent = flowContainer.content[0];
                  if (firstContent instanceof Container) flowContainer = firstContent;else break;
              }
              var tags = null;
              var _iteratorNormalCompletion6 = true;
              var _didIteratorError6 = false;
              var _iteratorError6 = undefined;

              try {
                  for (var _iterator6 = flowContainer.content[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                      var c = _step6.value;

                      // var tag = c as Runtime.Tag;
                      var tag = asOrNull(c, Tag);
                      if (tag) {
                          if (tags == null) tags = [];
                          tags.push(tag.text);
                      } else break;
                  }
              } catch (err) {
                  _didIteratorError6 = true;
                  _iteratorError6 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion6 && _iterator6.return) {
                          _iterator6.return();
                      }
                  } finally {
                      if (_didIteratorError6) {
                          throw _iteratorError6;
                      }
                  }
              }

              return tags;
          }
      }, {
          key: 'BuildStringOfHierarchy',
          value: function BuildStringOfHierarchy() {
              var sb = new StringBuilder();
              this.mainContentContainer.BuildStringOfHierarchy(sb, 0, this.state.currentPointer.Resolve());
              return sb.toString();
          }
      }, {
          key: 'BuildStringOfContainer',
          value: function BuildStringOfContainer(container) {
              var sb = new StringBuilder();
              container.BuildStringOfHierarchy(sb, 0, this.state.currentPointer.Resolve());
              return sb.toString();
          }
      }, {
          key: 'NextContent',
          value: function NextContent() {
              this.state.previousPointer = this.state.currentPointer.copy();
              if (!this.state.divertedPointer.isNull) {
                  this.state.currentPointer = this.state.divertedPointer.copy();
                  this.state.divertedPointer = Pointer.Null;
                  this.VisitChangedContainersDueToDivert();
                  if (!this.state.currentPointer.isNull) {
                      return;
                  }
              }
              var successfulPointerIncrement = this.IncrementContentPointer();
              if (!successfulPointerIncrement) {
                  var didPop = false;
                  if (this.state.callStack.CanPop(PushPopType.Function)) {
                      this.state.PopCallStack(PushPopType.Function);
                      if (this.state.inExpressionEvaluation) {
                          this.state.PushEvaluationStack(new Void());
                      }
                      didPop = true;
                  } else if (this.state.callStack.canPopThread) {
                      this.state.callStack.PopThread();
                      didPop = true;
                  } else {
                      this.state.TryExitFunctionEvaluationFromGame();
                  }
                  if (didPop && !this.state.currentPointer.isNull) {
                      this.NextContent();
                  }
              }
          }
      }, {
          key: 'IncrementContentPointer',
          value: function IncrementContentPointer() {
              var successfulIncrement = true;
              var pointer = this.state.callStack.currentElement.currentPointer.copy();
              pointer.index++;
              if (pointer.container === null) {
                  return throwNullException('pointer.container');
              }
              while (pointer.index >= pointer.container.content.length) {
                  successfulIncrement = false;
                  // Container nextAncestor = pointer.container.parent as Container;
                  var nextAncestor = asOrNull(pointer.container.parent, Container);
                  if (nextAncestor instanceof Container === false) {
                      break;
                  }
                  var indexInAncestor = nextAncestor.content.indexOf(pointer.container);
                  if (indexInAncestor == -1) {
                      break;
                  }
                  pointer = new Pointer(nextAncestor, indexInAncestor);
                  pointer.index++;
                  successfulIncrement = true;
                  if (pointer.container === null) {
                      return throwNullException('pointer.container');
                  }
              }
              if (!successfulIncrement) pointer = Pointer.Null;
              this.state.callStack.currentElement.currentPointer = pointer.copy();
              return successfulIncrement;
          }
      }, {
          key: 'TryFollowDefaultInvisibleChoice',
          value: function TryFollowDefaultInvisibleChoice() {
              var allChoices = this._state.currentChoices;
              var invisibleChoices = allChoices.filter(function (c) {
                  return c.isInvisibleDefault;
              });
              if (invisibleChoices.length == 0 || allChoices.length > invisibleChoices.length) return false;
              var choice = invisibleChoices[0];
              if (choice.targetPath === null) {
                  return throwNullException('choice.targetPath');
              }
              this.ChoosePath(choice.targetPath, false);
              return true;
          }
      }, {
          key: 'VisitCountForContainer',
          value: function VisitCountForContainer(container) {
              if (container === null) {
                  return throwNullException('container');
              }
              if (!container.visitsShouldBeCounted) {
                  console.warn('Read count for target (' + container.name + ' - on ' + container.debugMetadata + ') unknown. The story may need to be compiled with countAllVisits flag (-c).');
                  return 0;
              }
              var count = 0;
              var containerPathStr = container.path.toString();
              count = this.state.visitCounts.get(containerPathStr) || count;
              return count;
          }
      }, {
          key: 'IncrementVisitCountForContainer',
          value: function IncrementVisitCountForContainer(container) {
              var count = 0;
              var containerPathStr = container.path.toString();
              if (this.state.visitCounts.has(containerPathStr)) count = this.state.visitCounts.get(containerPathStr);
              count++;
              this.state.visitCounts.set(containerPathStr, count);
          }
      }, {
          key: 'RecordTurnIndexVisitToContainer',
          value: function RecordTurnIndexVisitToContainer(container) {
              var containerPathStr = container.path.toString();
              this.state.turnIndices.set(containerPathStr, this.state.currentTurnIndex);
          }
      }, {
          key: 'TurnsSinceForContainer',
          value: function TurnsSinceForContainer(container) {
              if (!container.turnIndexShouldBeCounted) {
                  this.Error('TURNS_SINCE() for target (' + container.name + ' - on ' + container.debugMetadata + ') unknown. The story may need to be compiled with countAllVisits flag (-c).');
              }
              var containerPathStr = container.path.toString();
              var index = this.state.turnIndices.get(containerPathStr);
              if (typeof index !== 'undefined') {
                  return this.state.currentTurnIndex - index;
              } else {
                  return -1;
              }
          }
      }, {
          key: 'NextSequenceShuffleIndex',
          value: function NextSequenceShuffleIndex() {
              // var numElementsIntVal = state.PopEvaluationStack () as IntValue;
              var numElementsIntVal = asOrNull(this.state.PopEvaluationStack(), IntValue);
              if (!(numElementsIntVal instanceof IntValue)) {
                  this.Error('expected number of elements in sequence for shuffle index');
                  return 0;
              }
              var seqContainer = this.state.currentPointer.container;
              if (seqContainer === null) {
                  return throwNullException('seqContainer');
              }
              // Originally a primitive type, but here, can be null.
              // TODO: Replace by default value?
              if (numElementsIntVal.value === null) {
                  return throwNullException('numElementsIntVal.value');
              }
              var numElements = numElementsIntVal.value;
              // var seqCountVal = state.PopEvaluationStack () as IntValue;
              var seqCountVal = asOrThrows(this.state.PopEvaluationStack(), IntValue);
              var seqCount = seqCountVal.value;
              // Originally a primitive type, but here, can be null.
              // TODO: Replace by default value?
              if (seqCount === null) {
                  return throwNullException('seqCount');
              }
              var loopIndex = seqCount / numElements;
              var iterationIndex = seqCount % numElements;
              var seqPathStr = seqContainer.path.toString();
              var sequenceHash = 0;
              for (var i = 0, l = seqPathStr.length; i < l; i++) {
                  sequenceHash += seqPathStr.charCodeAt(i) || 0;
              }
              var randomSeed = sequenceHash + loopIndex + this.state.storySeed;
              var random = new PRNG(Math.floor(randomSeed));
              var unpickedIndices = [];
              for (var _i2 = 0; _i2 < numElements; ++_i2) {
                  unpickedIndices.push(_i2);
              }
              for (var _i3 = 0; _i3 <= iterationIndex; ++_i3) {
                  var chosen = random.next() % unpickedIndices.length;
                  var chosenIndex = unpickedIndices[chosen];
                  unpickedIndices.splice(chosen, 1);
                  if (_i3 == iterationIndex) {
                      return chosenIndex;
                  }
              }
              throw new Error('Should never reach here');
          }
      }, {
          key: 'Error',
          value: function Error(message) {
              var useEndLineNumber = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

              var e = new StoryException(message);
              e.useEndLineNumber = useEndLineNumber;
              throw e;
          }
      }, {
          key: 'Warning',
          value: function Warning(message) {
              this.AddError(message, true);
          }
      }, {
          key: 'AddError',
          value: function AddError(message) {
              var isWarning = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
              var useEndLineNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

              var dm = this.currentDebugMetadata;
              var errorTypeStr = isWarning ? 'WARNING' : 'ERROR';
              if (dm != null) {
                  var lineNum = useEndLineNumber ? dm.endLineNumber : dm.startLineNumber;
                  message = 'RUNTIME ' + errorTypeStr + ": '" + dm.fileName + "' line " + lineNum + ': ' + message;
              } else if (!this.state.currentPointer.isNull) {
                  message = 'RUNTIME ' + errorTypeStr + ': (' + this.state.currentPointer + '): ' + message;
              } else {
                  message = 'RUNTIME ' + errorTypeStr + ': ' + message;
              }
              this.state.AddError(message, isWarning);
              // In a broken state don't need to know about any other errors.
              if (!isWarning) this.state.ForceEnd();
          }
      }, {
          key: 'Assert',
          value: function Assert(condition) {
              var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

              if (condition == false) {
                  if (message == null) {
                      message = 'Story assert';
                  }
                  throw new Error(message + ' ' + this.currentDebugMetadata);
              }
          }
      }, {
          key: 'currentChoices',
          get: function get$$1() {
              var choices = [];
              if (this._state === null) {
                  return throwNullException('this._state');
              }
              var _iteratorNormalCompletion7 = true;
              var _didIteratorError7 = false;
              var _iteratorError7 = undefined;

              try {
                  for (var _iterator7 = this._state.currentChoices[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                      var c = _step7.value;

                      if (!c.isInvisibleDefault) {
                          c.index = choices.length;
                          choices.push(c);
                      }
                  }
              } catch (err) {
                  _didIteratorError7 = true;
                  _iteratorError7 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion7 && _iterator7.return) {
                          _iterator7.return();
                      }
                  } finally {
                      if (_didIteratorError7) {
                          throw _iteratorError7;
                      }
                  }
              }

              return choices;
          }
      }, {
          key: 'currentText',
          get: function get$$1() {
              this.IfAsyncWeCant("call currentText since it's a work in progress");
              return this.state.currentText;
          }
      }, {
          key: 'currentTags',
          get: function get$$1() {
              this.IfAsyncWeCant("call currentTags since it's a work in progress");
              return this.state.currentTags;
          }
      }, {
          key: 'currentErrors',
          get: function get$$1() {
              return this.state.currentErrors;
          }
      }, {
          key: 'currentWarnings',
          get: function get$$1() {
              return this.state.currentWarnings;
          }
      }, {
          key: 'hasError',
          get: function get$$1() {
              return this.state.hasError;
          }
      }, {
          key: 'hasWarning',
          get: function get$$1() {
              return this.state.hasWarning;
          }
      }, {
          key: 'variablesState',
          get: function get$$1() {
              return this.state.variablesState;
          }
      }, {
          key: 'listDefinitions',
          get: function get$$1() {
              return this._listDefinitions;
          }
      }, {
          key: 'state',
          get: function get$$1() {
              return this._state;
          }
      }, {
          key: 'canContinue',
          get: function get$$1() {
              return this.state.canContinue;
          }
      }, {
          key: 'asyncContinueComplete',
          get: function get$$1() {
              return !this._asyncContinueActive;
          }
      }, {
          key: 'globalTags',
          get: function get$$1() {
              return this.TagsAtStartOfFlowContainerWithPathString('');
          }
      }, {
          key: 'currentDebugMetadata',
          get: function get$$1() {
              var dm = void 0;
              var pointer = this.state.currentPointer;
              if (!pointer.isNull && pointer.Resolve() !== null) {
                  dm = pointer.Resolve().debugMetadata;
                  if (dm !== null) {
                      return dm;
                  }
              }
              for (var i = this.state.callStack.elements.length - 1; i >= 0; --i) {
                  pointer = this.state.callStack.elements[i].currentPointer;
                  if (!pointer.isNull && pointer.Resolve() !== null) {
                      dm = pointer.Resolve().debugMetadata;
                      if (dm !== null) {
                          return dm;
                      }
                  }
              }
              for (var _i4 = this.state.outputStream.length - 1; _i4 >= 0; --_i4) {
                  var outputObj = this.state.outputStream[_i4];
                  dm = outputObj.debugMetadata;
                  if (dm !== null) {
                      return dm;
                  }
              }
              return null;
          }
      }, {
          key: 'mainContentContainer',
          get: function get$$1() {
              if (this._temporaryEvaluationContainer) {
                  return this._temporaryEvaluationContainer;
              } else {
                  return this._mainContentContainer;
              }
          }
      }]);
      return Story;
  }(InkObject);
  (function (Story) {
      var OutputStateChange = void 0;
      (function (OutputStateChange) {
          OutputStateChange[OutputStateChange["NoChange"] = 0] = "NoChange";
          OutputStateChange[OutputStateChange["ExtendedBeyondNewline"] = 1] = "ExtendedBeyondNewline";
          OutputStateChange[OutputStateChange["NewlineRemoved"] = 2] = "NewlineRemoved";
      })(OutputStateChange = Story.OutputStateChange || (Story.OutputStateChange = {}));
  })(exports.Story || (exports.Story = {}));

  exports.InkList = InkList;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
