import { ERROR_MESSAGES } from "@/app/lib/constants";
import {
  AppBaseError,
  HttpError,
  HttpResponseError,
  InvalidDateError,
  InvalidParameterError,
  ProviderRequiredError,
  ResourceFetchError,
  ValidationError,
} from "@/app/lib/errors";

// 検証に使用しない共通のモックデータ
const mockEndpoint = "/test-endpoint";

describe("HttpResponseError", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // 検証に使用しない共通のモックデータ
  const mockMethod = "GET";
  const mockStatus = 404;

  // エラーメッセージの設定
  describe("error message setting", () => {
    // 空や空白のみのメッセージを指定した場合、デフォルトのエラーメッセージが設定される
    it.each([
      // 空文字列
      ["empty string", ""],
      // 空白文字
      ["whitespace", "   "],
      // 全角空白
      ["full-width whitespace", "　"],
      // 改行のみ
      ["newline only", "\n"],
      // タブのみ
      ["tab only", "\t"],
    ])("when %s is provided then default message is set", (_, message) => {
      // Arrange
      const error = new HttpResponseError(
        message,
        mockEndpoint,
        mockMethod,
        mockStatus
      );

      // Assert
      // デフォルトのメッセージが設定される
      expect(error.message).toBe(ERROR_MESSAGES.API_RESPONSE_ERROR);
    });

    // メッセージを指定してHttpResponseErrorを作成すると、指定したメッセージが設定される
    it("when HttpResponseError is created with message then specified message is set", () => {
      // Arrange
      const message = "カスタムエラーメッセージ";

      // Act
      const error = new HttpResponseError(
        message,
        mockEndpoint,
        mockMethod,
        mockStatus
      );

      // Assert
      // 指定したメッセージが設定される
      expect(error.message).toBe(message);
    });
  });

  // プロパティの設定
  describe("property setting", () => {
    // 指定したパラメータがHttpResponseErrorの対応するプロパティに設定される
    it("when HttpResponseError is created then parameters are set to corresponding properties", () => {
      // Arrange
      const message = "カスタムエラーメッセージ";

      // Act
      const error = new HttpResponseError(
        message,
        mockEndpoint,
        mockMethod,
        mockStatus
      );

      // Assert
      // エラーオブジェクトが期待される継承階層を持つ
      expect(error).toBeInstanceOf(HttpResponseError);
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(AppBaseError);

      // 各プロパティに指定した値が設定される
      expect(error.message).toBe(message);
      expect(error.endpoint).toBe(mockEndpoint);
      expect(error.method).toBe(mockMethod);
      expect(error.status).toBe(mockStatus);
    });
  });
});

describe("ResourceFetchError", () => {
  // エラーメッセージの設定
  describe("error message setting", () => {
    // 空や空白のみのメッセージを指定した場合、デフォルトのエラーメッセージが設定される
    it.each([
      // 空文字列
      ["empty string", ""],
      // 空白文字
      ["whitespace", "   "],
      // 全角空白
      ["full-width whitespace", "　"],
      // 改行のみ
      ["newline only", "\n"],
      // タブのみ
      ["tab only", "\t"],
    ])("when %s is provided then default message is set", (_, message) => {
      // Arrange
      const error = new ResourceFetchError(message, mockEndpoint);

      // Assert
      // デフォルトのメッセージが設定される
      expect(error.message).toBe(ERROR_MESSAGES.DATA_FETCH);
    });

    // メッセージを指定してResourceFetchErrorを作成すると、指定したメッセージが設定される
    it("when ResourceFetchError is created with message then specified message is set", () => {
      // Arrange
      const message = "カスタムエラーメッセージ";

      // Act
      const error = new ResourceFetchError(message, mockEndpoint);

      // Assert
      // 指定したメッセージが設定される
      expect(error.message).toBe(message);
    });
  });

  // プロパティの設定
  describe("property setting", () => {
    // 指定したパラメータがResourceFetchErrorの対応するプロパティに設定される
    it("when ResourceFetchError is created then parameters are set to corresponding properties", () => {
      // Arrange
      const message = "カスタムエラーメッセージ";

      // Act
      const error = new ResourceFetchError(message, mockEndpoint);

      // Assert
      // エラーオブジェクトが期待される継承階層を持つ
      expect(error).toBeInstanceOf(ResourceFetchError);
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(AppBaseError);

      // 各プロパティに指定した値が設定される
      expect(error.message).toBe(message);
      expect(error.endpoint).toBe(mockEndpoint);
      expect(error.method).toBe("GET");
    });
  });
});

describe("InvalidParameterError", () => {
  // 指定したパラメータに基づいて生成されたエラーメッセージがInvalidParameterErrorに設定される
  it("when InvalidParameterError is created then error message is generated based on parameters", () => {
    // Arrange
    const paramName = "testParam";
    const value = "invalidValue";
    const expectedMessage =
      "パラメータ「testParam」の値「invalidValue」は無効です。";

    // Act
    const error = new InvalidParameterError(paramName, value);

    // Assert
    // エラーオブジェクトが期待される継承階層を持つ
    expect(error).toBeInstanceOf(InvalidParameterError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(AppBaseError);

    // フォーマットされたエラーメッセージが設定される
    expect(error.message).toBe(expectedMessage);
  });
});

describe("InvalidDateError", () => {
  // 指定したパラメータに基づいて生成されたエラーメッセージがInvalidDateErrorに設定される
  it("when InvalidDateError is created then error message is generated based on parameters", () => {
    // Arrange
    const dateString = "2021-13-45";
    const expectedMessage = "無効な日付文字列です: 2021-13-45。";

    // Act
    const error = new InvalidDateError(dateString);

    // Assert
    // エラーオブジェクトが期待される継承階層を持つ
    expect(error).toBeInstanceOf(InvalidDateError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(AppBaseError);

    // フォーマットされたエラーメッセージが設定される
    expect(error.message).toBe(expectedMessage);
  });
});

describe("ProviderRequiredError", () => {
  // 指定したパラメータに基づいて生成されたエラーメッセージがProviderRequiredErrorに設定される
  it("when ProviderRequiredError is created then error message is generated based on parameters", () => {
    // Arrange
    const hookName = "useTestHook";
    const providerName = "TestProvider";
    const expectedMessage =
      "useTestHookはTestProvider内で使用する必要があります。";

    // Act
    const error = new ProviderRequiredError(hookName, providerName);

    // Assert
    // エラーオブジェクトが期待される継承階層を持つ
    expect(error).toBeInstanceOf(ProviderRequiredError);
    expect(error).toBeInstanceOf(AppBaseError);

    // フォーマットされたエラーメッセージが設定される
    expect(error.message).toBe(expectedMessage);
  });
});
