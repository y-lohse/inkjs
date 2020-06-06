import {
  asOrNull,
  asOrThrows,
  asNumberOrThrows,
  asINamedContentOrNull,
  nullIfUndefined,
  isEquatable,
} from "../../../../engine/TypeAssertion";

describe("TypeAsssertion", () => {
  class MainClass {
    public Equals() {
      return false;
    }
  }
  class SubClass extends MainClass {}
  class OtherClass {}

  describe("asOrNull", () => {
    it("returns the object when argument is of the right type", () => {
      let object = new MainClass();

      expect(asOrNull(object, MainClass)).toBe(object);
    });

    it("returns the object when argument is a subtype", () => {
      let object = new SubClass();

      expect(asOrNull(object, MainClass)).toBe(object);
    });

    it("returns null when argument is of the wrong type", () => {
      let object = new MainClass();

      expect(asOrNull(object, OtherClass)).toBeNull();
    });
  });

  describe("asOrThrows", () => {
    it("returns the object when argument is of the right type", () => {
      let object = new MainClass();

      expect(asOrThrows(object, MainClass)).toBe(object);
    });

    it("returns the object when argument is a subtype", () => {
      let object = new SubClass();

      expect(asOrThrows(object, MainClass)).toBe(object);
    });

    it("throw argument is of the wrong type", () => {
      let object = new MainClass();

      expect(() => {
        asOrThrows(object, OtherClass);
      }).toThrow();
    });
  });

  describe("asNumberOrThrows", () => {
    it("returns the value if it is a number", () => {
      let number = 1;

      expect(asNumberOrThrows(number)).toBe(number);
    });

    it("throws if the value is not a number", () => {
      let string = "Hello World";

      expect(() => {
        asNumberOrThrows(string);
      }).toThrow();
    });
  });

  describe("asINamedContentOrNull", () => {
    it("returns the object if it matches INamedContent", () => {
      let content = {
        hasValidName: "valid.name",
        name: "name",
      };

      expect(asINamedContentOrNull(content)).toBe(content);
    });

    it("returns null if the object does not match INamedContent", () => {
      let content1 = {
        hasValidName: "valid.name",
        key: "name",
      };

      let content2 = {
        key: "valid.name",
        name: "name",
      };

      let content3 = {
        name: "name",
      };

      let content4 = {};

      expect(asINamedContentOrNull(content1)).toBeNull();
      expect(asINamedContentOrNull(content2)).toBeNull();
      expect(asINamedContentOrNull(content3)).toBeNull();
      expect(asINamedContentOrNull(content4)).toBeNull();
    });
  });

  describe("asINamedContentOrNull", () => {
    it("returns null if the value is undefined", () => {
      let foo;
      expect(nullIfUndefined(foo)).toBeNull();
    });

    it("returns the value if it is defined", () => {
      let string = "";
      let number = 10;
      let object = {};
      let array = [1, 2];
      let boolean = true;
      let mainClass = new MainClass();

      expect(nullIfUndefined(string)).toBe(string);
      expect(nullIfUndefined(number)).toBe(number);
      expect(nullIfUndefined(object)).toBe(object);
      expect(nullIfUndefined(array)).toBe(array);
      expect(nullIfUndefined(boolean)).toBe(boolean);
      expect(nullIfUndefined(mainClass)).toBe(mainClass);
    });
  });

  describe("isEquatable", () => {
    it("returns true if the type has a function named `Equals`", () => {
      expect(isEquatable(new MainClass())).toBe(true);
      expect(isEquatable(new SubClass())).toBe(true);
    });

    it("returns false if the type doesn't have a function named `Equals`", () => {
      expect(isEquatable(new OtherClass())).toBe(false);
      expect(isEquatable(2)).toBe(false);
      expect(isEquatable("")).toBe(false);
      expect(isEquatable(true)).toBe(false);
      expect(isEquatable({})).toBe(false);
      expect(isEquatable([])).toBe(false);
    });
  });
});
