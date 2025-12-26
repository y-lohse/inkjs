import 'ink_object.dart';
import 'container.dart';
import 'value.dart';
import 'glue.dart';
import 'control_command.dart';
import 'divert.dart';
import 'choice_point.dart';
import 'choice.dart';
import 'variable_reference.dart';
import 'variable_assignment.dart';
import 'native_function_call.dart';
import 'void.dart' as void_module;
import 'tag.dart';
import 'path.dart';
import 'ink_list.dart';
import 'list_definition.dart';
import 'list_definitions_origin.dart';
import 'simple_json.dart';

typedef Void = void_module.Void;

/// JSON serialization utilities for Ink runtime objects.
///
/// Handles conversion between Ink runtime objects and their
/// JSON representation for save/load operations.
class JsonSerialisation {
  /// Control command names for serialization.
  static final List<String?> _controlCommandNames = _buildControlCommandNames();

  static List<String?> _buildControlCommandNames() {
    final names = List<String?>.filled(CommandType.totalValues.index, null);

    names[CommandType.evalStart.index] = 'ev';
    names[CommandType.evalOutput.index] = 'out';
    names[CommandType.evalEnd.index] = '/ev';
    names[CommandType.duplicate.index] = 'du';
    names[CommandType.popEvaluatedValue.index] = 'pop';
    names[CommandType.popFunction.index] = '~ret';
    names[CommandType.popTunnel.index] = '->->';
    names[CommandType.beginString.index] = 'str';
    names[CommandType.endString.index] = '/str';
    names[CommandType.noOp.index] = 'nop';
    names[CommandType.choiceCount.index] = 'choiceCnt';
    names[CommandType.turns.index] = 'turn';
    names[CommandType.turnsSince.index] = 'turns';
    names[CommandType.readCount.index] = 'readc';
    names[CommandType.random.index] = 'rnd';
    names[CommandType.seedRandom.index] = 'srnd';
    names[CommandType.visitIndex.index] = 'visit';
    names[CommandType.sequenceShuffleIndex.index] = 'seq';
    names[CommandType.startThread.index] = 'thread';
    names[CommandType.done.index] = 'done';
    names[CommandType.end.index] = 'end';
    names[CommandType.listFromInt.index] = 'listInt';
    names[CommandType.listRange.index] = 'range';
    names[CommandType.listRandom.index] = 'lrnd';
    names[CommandType.beginTag.index] = '#';
    names[CommandType.endTag.index] = '/#';

    return names;
  }

  /// Convert JSON array to list of runtime objects.
  static List<InkObject> jArrayToRuntimeObjList(
    List<dynamic> jArray, [
    bool skipLast = false,
  ]) {
    int count = jArray.length;
    if (skipLast) count--;

    final list = <InkObject>[];

    for (int i = 0; i < count; i++) {
      final jTok = jArray[i];
      final runtimeObj = jTokenToRuntimeObject(jTok);
      if (runtimeObj != null) {
        list.add(runtimeObj);
      }
    }

    return list;
  }

  /// Write a dictionary of runtime objects.
  static void writeDictionaryRuntimeObjs(
    SimpleJsonWriter writer,
    Map<String, InkObject> dictionary,
  ) {
    writer.writeObjectStart();
    for (final entry in dictionary.entries) {
      writer.writePropertyStart(entry.key);
      writeRuntimeObject(writer, entry.value);
      writer.writePropertyEnd();
    }
    writer.writeObjectEnd();
  }

  /// Write a list of runtime objects.
  static void writeListRuntimeObjs(
    SimpleJsonWriter writer,
    List<InkObject> list,
  ) {
    writer.writeArrayStart();
    for (final value in list) {
      writeRuntimeObject(writer, value);
    }
    writer.writeArrayEnd();
  }

  /// Write integer dictionary.
  static void writeIntDictionary(
    SimpleJsonWriter writer,
    Map<String, int> dict,
  ) {
    writer.writeObjectStart();
    for (final entry in dict.entries) {
      writer.writeIntProperty(entry.key, entry.value);
    }
    writer.writeObjectEnd();
  }

  /// Write a runtime object to JSON.
  static void writeRuntimeObject(SimpleJsonWriter writer, InkObject obj) {
    if (obj is Container) {
      writeRuntimeContainer(writer, obj);
      return;
    }

    if (obj is Divert) {
      String divTypeKey = '->';
      if (obj.isExternal) {
        divTypeKey = 'x()';
      } else if (obj.pushesToStack) {
        if (obj.stackPushType == PushPopType.function) {
          divTypeKey = 'f()';
        } else if (obj.stackPushType == PushPopType.tunnel) {
          divTypeKey = '->t->';
        }
      }

      String? targetStr;
      if (obj.hasVariableTarget) {
        targetStr = obj.variableDivertName;
      } else {
        targetStr = obj.targetPathString;
      }

      writer.writeObjectStart();
      writer.writeProperty(divTypeKey, targetStr);

      if (obj.hasVariableTarget) {
        writer.writeProperty('var', true);
      }
      if (obj.isConditional) {
        writer.writeProperty('c', true);
      }
      if (obj.externalArgs > 0) {
        writer.writeIntProperty('exArgs', obj.externalArgs);
      }

      writer.writeObjectEnd();
      return;
    }

    if (obj is ChoicePoint) {
      writer.writeObjectStart();
      writer.writeProperty('*', obj.pathStringOnChoice);
      writer.writeIntProperty('flg', obj.flags);
      writer.writeObjectEnd();
      return;
    }

    if (obj is BoolValue) {
      writer.writeBool(obj.value);
      return;
    }

    if (obj is IntValue) {
      writer.writeInt(obj.value);
      return;
    }

    if (obj is FloatValue) {
      writer.writeFloat(obj.value);
      return;
    }

    if (obj is StringValue) {
      if (obj.isNewline) {
        writer.write('\n', false);
      } else {
        writer.writeStringStart();
        writer.writeStringInner('^');
        writer.writeStringInner(obj.value);
        writer.writeStringEnd();
      }
      return;
    }

    if (obj is ListValue) {
      writeInkList(writer, obj);
      return;
    }

    if (obj is DivertTargetValue) {
      writer.writeObjectStart();
      writer.writeProperty('^->', obj.value?.componentsString);
      writer.writeObjectEnd();
      return;
    }

    if (obj is VariablePointerValue) {
      writer.writeObjectStart();
      writer.writeProperty('^var', obj.value);
      writer.writeIntProperty('ci', obj.contextIndex);
      writer.writeObjectEnd();
      return;
    }

    if (obj is Glue) {
      writer.write('<>');
      return;
    }

    if (obj is ControlCommand) {
      writer.write(_controlCommandNames[obj.commandType.index]);
      return;
    }

    if (obj is NativeFunctionCall) {
      var name = obj.name;
      if (name == '^') name = 'L^';
      writer.write(name);
      return;
    }

    if (obj is VariableReference) {
      writer.writeObjectStart();
      final readCountPath = obj.pathStringForCount;
      if (readCountPath != null) {
        writer.writeProperty('CNT?', readCountPath);
      } else {
        writer.writeProperty('VAR?', obj.name);
      }
      writer.writeObjectEnd();
      return;
    }

    if (obj is VariableAssignment) {
      writer.writeObjectStart();
      final key = obj.isGlobal ? 'VAR=' : 'temp=';
      writer.writeProperty(key, obj.variableName);
      if (!obj.isNewDeclaration) {
        writer.writeProperty('re', true);
      }
      writer.writeObjectEnd();
      return;
    }

    if (obj is Void) {
      writer.write('void');
      return;
    }

    if (obj is Tag) {
      writer.writeObjectStart();
      writer.writeProperty('#', obj.text);
      writer.writeObjectEnd();
      return;
    }

    if (obj is Choice) {
      writeChoice(writer, obj);
      return;
    }

    throw StateError('Failed to convert runtime object to Json token: $obj');
  }

  /// Convert JSON token to runtime object.
  static InkObject? jTokenToRuntimeObject(dynamic token) {
    if (token is num) {
      // Only treat as int if it's explicitly an int type
      // This preserves float literals like 3.0 from the JSON
      if (token is int) {
        return IntValue(token);
      }
      return FloatValue(token.toDouble());
    }

    if (token is bool) {
      return BoolValue(token);
    }

    if (token is String) {
      final str = token;

      // Explicit float of form "123.00f"
      final floatMatch = RegExp(r'^([0-9]+\.[0-9]+f)$').firstMatch(str);
      if (floatMatch != null) {
        return FloatValue(double.parse(floatMatch.group(0)!.replaceAll('f', '')));
      }

      // String value
      if (str.isNotEmpty) {
        final firstChar = str[0];
        if (firstChar == '^') return StringValue(str.substring(1));
        if (firstChar == '\n' && str.length == 1) return StringValue('\n');
      }

      // Glue
      if (str == '<>') return Glue();

      // Control commands
      for (int i = 0; i < _controlCommandNames.length; i++) {
        if (str == _controlCommandNames[i]) {
          return ControlCommand(CommandType.values[i]);
        }
      }

      // Native functions
      var funcName = str;
      if (funcName == 'L^') funcName = '^';
      if (NativeFunctionCall.isNativeFunction(funcName)) {
        return NativeFunctionCall.callWithName(funcName);
      }

      // Pop
      if (str == '->->') return ControlCommand.popTunnel;
      if (str == '~ret') return ControlCommand.popFunction;

      // Void
      if (str == 'void') return Void();
    }

    if (token is Map) {
      final obj = token as Map<String, dynamic>;

      // Divert target value
      if (obj.containsKey('^->')) {
        return DivertTargetValue(Path.fromString(obj['^->'].toString()));
      }

      // Variable pointer value
      if (obj.containsKey('^var')) {
        final varPtr = VariablePointerValue(obj['^var'].toString());
        if (obj.containsKey('ci')) {
          varPtr.contextIndex = obj['ci'] as int;
        }
        return varPtr;
      }

      // Divert
      bool isDivert = false;
      bool pushesToStack = false;
      PushPopType divPushType = PushPopType.function;
      bool external = false;
      dynamic propValue;

      if (obj.containsKey('->')) {
        propValue = obj['->'];
        isDivert = true;
      } else if (obj.containsKey('f()')) {
        propValue = obj['f()'];
        isDivert = true;
        pushesToStack = true;
        divPushType = PushPopType.function;
      } else if (obj.containsKey('->t->')) {
        propValue = obj['->t->'];
        isDivert = true;
        pushesToStack = true;
        divPushType = PushPopType.tunnel;
      } else if (obj.containsKey('x()')) {
        propValue = obj['x()'];
        isDivert = true;
        external = true;
        pushesToStack = false;
        divPushType = PushPopType.function;
      }

      if (isDivert) {
        final divert = Divert();
        divert.pushesToStack = pushesToStack;
        divert.stackPushType = divPushType;
        divert.isExternal = external;

        final target = propValue.toString();

        if (obj.containsKey('var')) {
          divert.variableDivertName = target;
        } else {
          divert.targetPathString = target;
        }

        divert.isConditional = obj['c'] == true;

        if (external && obj.containsKey('exArgs')) {
          divert.externalArgs = obj['exArgs'] as int;
        }

        return divert;
      }

      // Choice
      if (obj.containsKey('*')) {
        final choice = ChoicePoint();
        choice.pathStringOnChoice = obj['*'].toString();
        if (obj.containsKey('flg')) {
          choice.flags = obj['flg'] as int;
        }
        return choice;
      }

      // Variable reference
      if (obj.containsKey('VAR?')) {
        return VariableReference(obj['VAR?'].toString());
      }
      if (obj.containsKey('CNT?')) {
        final readCountVarRef = VariableReference();
        readCountVarRef.pathStringForCount = obj['CNT?'].toString();
        return readCountVarRef;
      }

      // Variable assignment
      bool isVarAss = false;
      bool isGlobalVar = false;
      if (obj.containsKey('VAR=')) {
        propValue = obj['VAR='];
        isVarAss = true;
        isGlobalVar = true;
      } else if (obj.containsKey('temp=')) {
        propValue = obj['temp='];
        isVarAss = true;
        isGlobalVar = false;
      }
      if (isVarAss) {
        final varName = propValue.toString();
        final isNewDecl = obj['re'] != true;
        final varAss = VariableAssignment(varName, isNewDecl);
        varAss.isGlobal = isGlobalVar;
        return varAss;
      }

      // Tag
      if (obj.containsKey('#')) {
        return Tag(obj['#'].toString());
      }

      // List value
      if (obj.containsKey('list')) {
        final listContent = obj['list'] as Map<String, dynamic>;
        final rawList = InkList();

        if (obj.containsKey('origins')) {
          final namesAsObjs = (obj['origins'] as List).cast<String>();
          rawList.setInitialOriginNames(namesAsObjs);
        }

        for (final entry in listContent.entries) {
          final item = InkListItem.fromFullName(entry.key);
          final val = entry.value as int;
          rawList.add(item, val);
        }

        return ListValue.fromList(rawList);
      }

      // Choice (runtime)
      if (obj.containsKey('originalChoicePath')) {
        return jObjectToChoice(obj);
      }
    }

    // Array is always a Container
    if (token is List) {
      return jArrayToContainer(token);
    }

    if (token == null) return null;

    throw StateError('Failed to convert token to runtime object: $token');
  }

  /// Write a container to JSON.
  static void writeRuntimeContainer(
    SimpleJsonWriter writer,
    Container? container, [
    bool withoutName = false,
  ]) {
    writer.writeArrayStart();

    if (container == null) {
      writer.writeArrayEnd();
      return;
    }

    for (final c in container.content) {
      writeRuntimeObject(writer, c);
    }

    final namedOnlyContent = container.namedOnlyContent;
    final countFlags = container.countFlags;
    final hasNameProperty = container.name != null && !withoutName;

    final hasTerminator =
        namedOnlyContent != null || countFlags > 0 || hasNameProperty;

    if (hasTerminator) {
      writer.writeObjectStart();
    }

    if (namedOnlyContent != null) {
      for (final entry in namedOnlyContent.entries) {
        final namedContainer = entry.value as Container?;
        writer.writePropertyStart(entry.key);
        writeRuntimeContainer(writer, namedContainer, true);
        writer.writePropertyEnd();
      }
    }

    if (countFlags > 0) {
      writer.writeIntProperty('#f', countFlags);
    }

    if (hasNameProperty) {
      writer.writeProperty('#n', container.name);
    }

    if (hasTerminator) {
      writer.writeObjectEnd();
    } else {
      writer.writeNull();
    }

    writer.writeArrayEnd();
  }

  /// Convert JSON array to container.
  static Container jArrayToContainer(List<dynamic> jArray) {
    final container = Container();
    container.content = jArrayToRuntimeObjList(jArray, true);

    final terminatingObj = jArray.isNotEmpty ? jArray.last : null;
    if (terminatingObj is Map<String, dynamic>) {
      final namedOnlyContent = <String, InkObject>{};

      for (final entry in terminatingObj.entries) {
        if (entry.key == '#f') {
          container.countFlags = entry.value as int;
        } else if (entry.key == '#n') {
          container.name = entry.value.toString();
        } else {
          final namedContentItem = jTokenToRuntimeObject(entry.value);
          if (namedContentItem is Container) {
            namedContentItem.name = entry.key;
          }
          if (namedContentItem != null) {
            namedOnlyContent[entry.key] = namedContentItem;
          }
        }
      }

      container.namedOnlyContent = namedOnlyContent;
    }

    return container;
  }

  /// Convert JSON object to Choice.
  static Choice jObjectToChoice(Map<String, dynamic> jObj) {
    final choice = Choice();
    choice.text = jObj['text'].toString();
    choice.index = jObj['index'] as int;
    choice.sourcePath = jObj['originalChoicePath'].toString();
    choice.originalThreadIndex = jObj['originalThreadIndex'] as int;
    choice.pathStringOnChoice = jObj['targetPath'].toString();
    choice.tags = jArrayToTags(jObj);
    choice.isInvisibleDefault = jObj['isInvisibleDefault'] == true;
    return choice;
  }

  /// Extract tags from JSON object.
  static List<String>? jArrayToTags(Map<String, dynamic> jObj) {
    if (jObj.containsKey('tags')) {
      return (jObj['tags'] as List).cast<String>();
    }
    return null;
  }

  /// Write a Choice to JSON.
  static void writeChoice(SimpleJsonWriter writer, Choice choice) {
    writer.writeObjectStart();
    writer.writeProperty('text', choice.text);
    writer.writeIntProperty('index', choice.index);
    writer.writeProperty('originalChoicePath', choice.sourcePath);
    writer.writeIntProperty('originalThreadIndex', choice.originalThreadIndex);
    writer.writeProperty('targetPath', choice.pathStringOnChoice);
    writer.writeProperty('isInvisibleDefault', choice.isInvisibleDefault);
    writeChoiceTags(writer, choice);
    writer.writeObjectEnd();
  }

  /// Write choice tags.
  static void writeChoiceTags(SimpleJsonWriter writer, Choice choice) {
    if (choice.tags != null && choice.tags!.isNotEmpty) {
      writer.writePropertyStart('tags');
      writer.writeArrayStart();
      for (final tag in choice.tags!) {
        writer.write(tag);
      }
      writer.writeArrayEnd();
      writer.writePropertyEnd();
    }
  }

  /// Write an InkList to JSON.
  static void writeInkList(SimpleJsonWriter writer, ListValue listVal) {
    final rawList = listVal.value;
    if (rawList == null) return;

    writer.writeObjectStart();
    writer.writePropertyStart('list');
    writer.writeObjectStart();

    for (final entry in rawList.entries) {
      final item = InkListItem.fromSerializedKey(entry.key);
      writer.writePropertyNameStart();
      writer.writePropertyNameInner(item.originName ?? '?');
      writer.writePropertyNameInner('.');
      writer.writePropertyNameInner(item.itemName ?? '');
      writer.writePropertyNameEnd();
      writer.write(entry.value);
      writer.writePropertyEnd();
    }

    writer.writeObjectEnd();
    writer.writePropertyEnd();

    if (rawList.isEmpty && rawList.originNames != null && rawList.originNames!.isNotEmpty) {
      writer.writePropertyStart('origins');
      writer.writeArrayStart();
      for (final name in rawList.originNames!) {
        writer.write(name);
      }
      writer.writeArrayEnd();
      writer.writePropertyEnd();
    }

    writer.writeObjectEnd();
  }

  /// Convert ListDefinitionsOrigin to JSON.
  static Map<String, dynamic> listDefinitionsToJToken(ListDefinitionsOrigin origin) {
    final result = <String, dynamic>{};

    for (final def in origin.lists) {
      final listDefJson = <String, dynamic>{};

      for (final entry in def.items.entries) {
        final item = InkListItem.fromSerializedKey(entry.key);
        if (item.itemName != null) {
          listDefJson[item.itemName!] = entry.value;
        }
      }

      result[def.name] = listDefJson;
    }

    return result;
  }

  /// Convert JSON to ListDefinitionsOrigin.
  static ListDefinitionsOrigin jTokenToListDefinitions(Map<String, dynamic> obj) {
    final allDefs = <ListDefinition>[];

    for (final entry in obj.entries) {
      final name = entry.key;
      final listDefJson = entry.value as Map<String, dynamic>;

      final items = <String, int>{};
      for (final itemEntry in listDefJson.entries) {
        items[itemEntry.key] = itemEntry.value as int;
      }

      final def = ListDefinition(name, items);
      allDefs.add(def);
    }

    return ListDefinitionsOrigin(allDefs);
  }

  /// Convert JSON object to int dictionary.
  static Map<String, int> jObjectToIntDictionary(Map<String, dynamic> jObject) {
    final dict = <String, int>{};
    for (final entry in jObject.entries) {
      dict[entry.key] = entry.value as int;
    }
    return dict;
  }
}
