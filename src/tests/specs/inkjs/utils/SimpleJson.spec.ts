import { SimpleJson } from "../../../../engine/SimpleJson";

describe("SimpleJson.Writer", () => {
  let writer: SimpleJson.Writer;

  beforeEach(() => {
    writer = new SimpleJson.Writer();
  });

  it("writes a proper inner hierarchy", () => {
    writer.WriteObjectStart();
    writer.WriteProperty("callstackThreads", () => {
      writer.WriteObjectStart();
      {
        writer.WritePropertyStart("callstack");
        {
          writer.WriteArrayStart();
          {
            writer.WriteObjectStart();
            {
              writer.WriteProperty("cPath", "path.to.component");
              writer.WriteIntProperty("idx", 2);
              writer.WriteProperty("exp", "expression");
              writer.WriteIntProperty("type", 3);
            }
            writer.WriteObjectEnd();
            writer.WriteNull();
          }
          writer.WriteArrayEnd();
        }
        writer.WritePropertyEnd();

        writer.WriteIntProperty("threadIndex", 0);
        writer.WriteProperty("previousContentObject", "path.to.object");
      }
      writer.WriteObjectEnd();
    });

    writer.WriteIntProperty("inkSaveVersion", 8);
    writer.WriteObjectEnd();

    expect(writer.toString()).toEqual(
      '{"callstackThreads":{"callstack":[{"cPath":"path.to.component","idx":2,"exp":"expression","type":3},null],"threadIndex":0,"previousContentObject":"path.to.object"},"inkSaveVersion":8}'
    );
  });

  it("writes a proper inner string", () => {
    writer.WriteObjectStart();
    {
      writer.WritePropertyNameStart();
      writer.WritePropertyNameInner("prop");
      writer.WritePropertyNameInner("erty");
      writer.WritePropertyNameEnd();

      writer.WriteStringStart();
      writer.WriteStringInner("^");
      writer.WriteStringInner("Hello World.");
      writer.WriteStringEnd();
      writer.WritePropertyEnd();

      writer.WritePropertyStart("key");
      writer.WriteArrayStart();
      {
        writer.WriteStringStart();
        writer.WriteStringInner("^");
        writer.WriteStringInner("Hello World.");
        writer.WriteStringEnd();
      }
      writer.WriteArrayEnd();
      writer.WritePropertyEnd();
    }
    writer.WriteObjectEnd();

    expect(writer.toString()).toEqual(
      '{"property":"^Hello World.","key":["^Hello World."]}'
    );
  });

  it("handles nested arrays", () => {
    writer.WriteArrayStart();
    {
      writer.WriteArrayStart();
      {
        writer.WriteArrayStart();
        {
          writer.WriteArrayStart();
          writer.WriteNull();
          writer.WriteArrayEnd();
        }
        writer.WriteArrayEnd();
      }
      writer.WriteArrayEnd();
    }
    writer.WriteArrayEnd();

    expect(writer.toString()).toEqual("[[[[null]]]]");
  });

  it("throws with unbalanced calls", () => {
    expect(() => {
      writer.WriteObjectStart();
      writer.WritePropertyEnd();
    }).toThrow();

    expect(() => {
      writer.WriteStringStart();
      writer.WriteArrayStart();
      writer.WriteStringEnd();
    }).toThrow();
  });

  describe("when writing integers", () => {
    it("creates the proper object hierarchy", () => {
      writer.WriteObjectStart();
      writer.WriteIntProperty("property", 3);
      writer.WriteObjectEnd();

      expect(writer.toString()).toEqual('{"property":3}');
    });

    it("creates the proper object hierarchy", () => {
      writer.WriteArrayStart();
      writer.WriteInt(3);
      writer.WriteArrayEnd();

      expect(writer.toString()).toEqual("[3]");
    });

    it("converts floats into integer", () => {
      writer.WriteArrayStart();
      {
        writer.WriteObjectStart();
        writer.WriteIntProperty("property", 3.9);
        writer.WriteObjectEnd();

        writer.WriteArrayStart();
        writer.WriteInt(3.1);
        writer.WriteInt(4.0);
        writer.WriteArrayEnd();
      }
      writer.WriteArrayEnd();

      expect(writer.toString()).toEqual('[{"property":3},[3,4]]');
    });
  });

  describe("when writing floats", () => {
    it("creates the proper object hierarchy", () => {
      writer.WriteObjectStart();
      writer.WriteFloatProperty("property", 3.4);
      writer.WriteObjectEnd();

      expect(writer.toString()).toEqual('{"property":3.4}');
    });

    it("creates the proper object hierarchy", () => {
      writer.WriteArrayStart();
      writer.WriteFloat(36.1456);
      writer.WriteArrayEnd();

      expect(writer.toString()).toEqual("[36.1456]");
    });

    it("doesn't converts integer into floats", () => {
      writer.WriteArrayStart();
      writer.WriteFloat(3);
      writer.WriteFloat(4);
      writer.WriteArrayEnd();

      expect(writer.toString()).toEqual("[3,4]");
    });

    it("converts infinity and NaN", () => {
      writer.WriteArrayStart();
      writer.WriteFloat(Infinity);
      writer.WriteFloat(-Infinity);
      writer.WriteFloat(NaN);
      writer.WriteArrayEnd();

      expect(writer.toString()).toEqual("[3.4e+38,-3.4e+38,0]");
    });
  });
});

describe("SimpleJson.Reader", () => {
  it("parses a JSON object string", () => {
    let jsonString = '{"key":"value", "array": [1, 2, null, 3.0, false]}';
    let object = {
      array: [1, 2, null, "3.0f", false],
      key: "value",
    };

    let reader = new SimpleJson.Reader(jsonString);

    expect(reader.ToDictionary()).toEqual(object);
    expect(SimpleJson.TextToDictionary(jsonString)).toEqual(object);
  });

  it("parses a JSON array string", () => {
    let jsonString = "[1, 2, null, 3.0, false]";
    let object = [1, 2, null, "3.0f", false];

    let reader = new SimpleJson.Reader(jsonString);

    expect(reader.ToArray()).toEqual(object);
    expect(SimpleJson.TextToArray(jsonString)).toEqual(object);
  });

  it("throws if the json is malformed", () => {
    let jsonString = '{key: "value"]';

    expect(() => {
      let reader = new SimpleJson.Reader(jsonString);
      reader.ToDictionary();
    }).toThrow();

    expect(() => {
      SimpleJson.TextToDictionary(jsonString);
    }).toThrow();
  });
});
