export {};

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      toContainStringContaining(expected: string): CustomMatcherResult;
    }
  }
}

expect.extend({
  toContainStringContaining(
    received: Array<string>,
    expected: string
  ): jest.CustomMatcherResult {
    let match = received.find((element) => {
      if (element.includes(expected)) {
        return true;
      }
    });

    if (match !== undefined) {
      return {
        pass: true,
        message: () => `The array contains a string matching '${expected}'.`,
      };
    } else {
      return {
        pass: false,
        message: () =>
          `The array doesn't contain a string element matching '${expected}'. Values: ${JSON.stringify(
            received,
            null,
            "\t"
          )}`,
      };
    }
  },
});
