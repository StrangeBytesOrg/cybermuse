/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


/** OneOf type helpers */
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
type OneOf<T extends any[]> = T extends [infer Only] ? Only : T extends [infer A, infer B, ...infer Rest] ? OneOf<[XOR<A, B>, ...Rest]> : never;

export interface paths {
  "/character/{id}": {
    get: operations["GetCharacter"];
  };
  "/characters": {
    get: operations["GetAllCharacters"];
  };
  "/chat/{id}": {
    get: operations["GetChat"];
  };
  "/chats": {
    get: operations["GetAllChats"];
  };
  "/create-character": {
    post: operations["CreateCharacter"];
  };
  "/create-chat": {
    post: operations["CreateChat"];
  };
  "/create-message": {
    post: operations["CreateMessage"];
  };
  "/create-preset": {
    post: operations["CreatePreset"];
  };
  "/create-template": {
    post: operations["CreateTemplate"];
  };
  "/delete-character/{id}": {
    post: operations["DeleteCharacter"];
  };
  "/delete-chat/{id}": {
    post: operations["DeleteChat"];
  };
  "/delete-message/{id}": {
    post: operations["DeleteMessage"];
  };
  "/delete-preset/{id}": {
    post: operations["DeletePreset"];
  };
  "/delete-template/{id}": {
    post: operations["DeleteTemplate"];
  };
  "/download-model": {
    post: operations["DownloadModel"];
  };
  "/generate": {
    post: operations["Generate"];
  };
  "/generate-message": {
    post: operations["GenerateMessage"];
  };
  "/get-response-character/{chatId}": {
    post: operations["GetResponseCharacter"];
  };
  "/models": {
    get: operations["ListModels"];
  };
  "/new-swipe/{messageId}": {
    post: operations["NewSwipe"];
  };
  "/parse-template": {
    post: operations["ParseTemplate"];
  };
  "/preset/{id}": {
    get: operations["GetPreset"];
  };
  "/presets": {
    get: operations["GetAllPresets"];
  };
  "/set-active-preset/{id}": {
    post: operations["SetActivePreset"];
  };
  "/set-active-template/{id}": {
    post: operations["SetActive"];
  };
  "/set-autoload": {
    post: operations["SetAutoLoad"];
  };
  "/set-model-path": {
    post: operations["SetModelPath"];
  };
  "/set-use-gpu": {
    post: operations["SetGPU"];
  };
  "/start-server": {
    post: operations["StartServer"];
  };
  "/status": {
    get: operations["GetStatus"];
  };
  "/stop-server": {
    post: operations["StopServer"];
  };
  "/swipe-left/{messageId}": {
    post: operations["SwipeLeft"];
  };
  "/swipe-right/{messageId}": {
    post: operations["SwipeRight"];
  };
  "/template/{id}": {
    get: operations["GetTemplate"];
  };
  "/templates": {
    get: operations["GetAllTemplates"];
  };
  "/update-character/{id}": {
    post: operations["UpdateCharacter"];
  };
  "/update-message/{id}": {
    post: operations["UpdateMessage"];
  };
  "/update-preset/{id}": {
    post: operations["UpdatePreset"];
  };
  "/update-template/{id}": {
    post: operations["UpdateTemplate"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    Character: {
      description: string;
      firstMessage: string | null;
      /** Format: int32 */
      id: number;
      image: string | null;
      name: string;
      type: string;
    };
    Chat: {
      characters: components["schemas"]["Character"][];
      /** Format: date-time */
      createdAt: string;
      /** Format: int32 */
      id: number;
      messages: components["schemas"]["Message"][];
      /** Format: date-time */
      updatedAt: string;
    };
    CreateCharacterRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      description: string;
      firstMessage?: string;
      image?: string;
      name: string;
      type?: string;
    };
    CreateCharacterResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      character: components["schemas"]["Character"];
    };
    CreateChatRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      characters: number[];
    };
    CreateChatResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      chat_id: string;
    };
    CreateMessageRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** Format: int32 */
      characterId: number;
      /** Format: int32 */
      chatId: number;
      generated: boolean;
      text: string;
    };
    CreateMessageResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** Format: int32 */
      messageId: number;
    };
    CreatePresetRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** Format: int64 */
      context: number;
      /** Format: float */
      frequencyPenalty?: number;
      /** Format: int64 */
      maxTokens: number;
      /** Format: float */
      minP?: number;
      /** Format: int64 */
      mirostat?: number;
      /** Format: float */
      mirostatEta?: number;
      /** Format: float */
      mirostatTau?: number;
      name: string;
      penalizeNL?: boolean;
      /** Format: float */
      presencePenalty?: number;
      /** Format: float */
      repeatLastN?: number;
      /** Format: float */
      repeatPenalty?: number;
      /** Format: int32 */
      seed?: number;
      /** Format: float */
      temperature: number;
      /** Format: float */
      tfsz?: number;
      /** Format: float */
      topK?: number;
      /** Format: float */
      topP?: number;
      /** Format: float */
      typicalP?: number;
    };
    CreatePresetResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** Format: int32 */
      id: number;
    };
    CreateTemplateRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      content: string;
      name: string;
    };
    CreateTemplateResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** Format: int32 */
      id: number;
    };
    DownloadModelError: {
      error: string;
    };
    DownloadModelFinal: Record<string, never>;
    DownloadModelProgress: {
      /** Format: double */
      progress: number;
    };
    DownloadModelRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      path: string;
      repoId: string;
    };
    ErrorDetail: {
      /** @description Where the error occurred, e.g. 'body.items[3].tags' or 'path.thing-id' */
      location?: string;
      /** @description Error message text */
      message?: string;
      /** @description The value at the given location */
      value?: unknown;
    };
    ErrorModel: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** @description A human-readable explanation specific to this occurrence of the problem. */
      detail?: string;
      /** @description Optional list of individual error details */
      errors?: components["schemas"]["ErrorDetail"][];
      /**
       * Format: uri
       * @description A URI reference that identifies the specific occurrence of the problem.
       */
      instance?: string;
      /**
       * Format: int64
       * @description HTTP status code
       */
      status?: number;
      /** @description A short, human-readable summary of the problem type. This value should not change between occurrences of the error. */
      title?: string;
      /**
       * Format: uri
       * @description A URI reference to human-readable documentation for the error.
       * @default about:blank
       */
      type?: string;
    };
    ErrorResponse: {
      error: string;
    };
    GenerateMessageErrorResponse: {
      error: string;
    };
    GenerateMessageFinalResponse: {
      text: string;
    };
    GenerateMessageRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** Format: int32 */
      chatId: number;
      continue: boolean;
    };
    GenerateMessageResponse: {
      text: string;
    };
    GeneratePreset: {
      active: boolean;
      /** Format: int64 */
      context: number;
      /** Format: float */
      frequencyPenalty: number;
      /** Format: int32 */
      id?: number;
      /** Format: int64 */
      maxTokens: number;
      /** Format: float */
      minP: number;
      /** Format: int64 */
      mirostat: number;
      /** Format: float */
      mirostatEta: number;
      /** Format: float */
      mirostatTau: number;
      name: string;
      penalizeNL: boolean;
      /** Format: float */
      presencePenalty: number;
      /** Format: float */
      repeatLastN: number;
      /** Format: float */
      repeatPenalty: number;
      /** Format: int32 */
      seed: number;
      /** Format: float */
      temperature: number;
      /** Format: float */
      tfsz: number;
      /** Format: float */
      topK: number;
      /** Format: float */
      topP: number;
      /** Format: float */
      typicalP: number;
    };
    GenerateRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      prompt: string;
    };
    GenerateTextResponse: {
      text: string;
    };
    GetAllCharactersResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      characters: components["schemas"]["Character"][];
    };
    GetAllChatsResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      chats: components["schemas"]["Chat"][];
    };
    GetAllPresetsResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      presets: components["schemas"]["GeneratePreset"][];
    };
    GetAllTemplatesResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      templates: components["schemas"]["PromptTemplate"][];
    };
    GetCharacterResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      character: components["schemas"]["Character"];
    };
    GetChatResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      chat: components["schemas"]["Chat"];
    };
    GetPresetResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      preset: components["schemas"]["GeneratePreset"];
    };
    GetResponseCharacterResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** Format: int32 */
      characterId: number;
    };
    GetTemplateResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      template: components["schemas"]["PromptTemplate"];
    };
    ListModelsResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      modelPath: string;
      models: components["schemas"]["Model"][];
    };
    Message: {
      /** Format: int32 */
      activeIndex: number;
      /** Format: int32 */
      characterId: number;
      /** Format: int32 */
      chatId: number;
      content: components["schemas"]["MessageContent"][];
      generated: boolean;
      /** Format: int32 */
      id: number;
    };
    MessageContent: {
      /** Format: int32 */
      id: number;
      /** Format: int32 */
      messageId: number;
      text: string;
    };
    Model: {
      name: string;
      /** Format: int64 */
      size: number;
    };
    ParseTemplateRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      templateString: string;
    };
    ParseTemplateResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      parsed: string;
    };
    PromptTemplate: {
      active: boolean;
      content: string;
      /** Format: int32 */
      id: number;
      name: string;
    };
    ServerStatusResponseBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      autoLoad: boolean;
      /** Format: int64 */
      contextSize: number;
      currentModel: string;
      loaded: boolean;
      modelPath: string;
      useGPU: boolean;
    };
    SetAutoLoadRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      autoLoad: boolean;
    };
    SetGPURequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      useGPU: boolean;
    };
    SetModelPathRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      modelPath: string;
    };
    StartServerInputBody: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** Format: int64 */
      contextSize: number;
      modelFile: string;
    };
    UpdateCharacterRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      description: string;
      firstMessage?: string;
      image?: string;
      name: string;
      type?: string;
    };
    UpdateMessageRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      text: string;
    };
    UpdatePresetRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      /** Format: int64 */
      context: number;
      /** Format: float */
      frequencyPenalty?: number;
      /** Format: int64 */
      maxTokens: number;
      /** Format: float */
      minP?: number;
      /** Format: int64 */
      mirostat?: number;
      /** Format: float */
      mirostatEta?: number;
      /** Format: float */
      mirostatTau?: number;
      name: string;
      penalizeNL?: boolean;
      /** Format: float */
      presencePenalty?: number;
      /** Format: float */
      repeatLastN?: number;
      /** Format: float */
      repeatPenalty?: number;
      /** Format: int32 */
      seed?: number;
      /** Format: float */
      temperature: number;
      /** Format: float */
      tfsz?: number;
      /** Format: float */
      topK?: number;
      /** Format: float */
      topP?: number;
      /** Format: float */
      typicalP?: number;
    };
    UpdateTemplateRequest: {
      /**
       * Format: uri
       * @description A URL to the JSON Schema for this object.
       */
      $schema?: string;
      content: string;
      name: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export interface operations {

  GetCharacter: {
    parameters: {
      path: {
        id: string;
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["GetCharacterResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GetAllCharacters: {
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["GetAllCharactersResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GetChat: {
    parameters: {
      path: {
        id: string;
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["GetChatResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GetAllChats: {
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["GetAllChatsResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  CreateCharacter: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateCharacterRequest"];
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["CreateCharacterResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  CreateChat: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateChatRequest"];
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["CreateChatResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  CreateMessage: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateMessageRequest"];
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["CreateMessageResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  CreatePreset: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreatePresetRequest"];
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["CreatePresetResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  CreateTemplate: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateTemplateRequest"];
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["CreateTemplateResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  DeleteCharacter: {
    parameters: {
      path: {
        id: string;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  DeleteChat: {
    parameters: {
      path: {
        id: string;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  DeleteMessage: {
    parameters: {
      path: {
        id: number;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  DeletePreset: {
    parameters: {
      path: {
        id: string;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  DeleteTemplate: {
    parameters: {
      path: {
        /** @description Template Id */
        id: string;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  DownloadModel: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["DownloadModelRequest"];
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "text/event-stream": OneOf<[{
              data: components["schemas"]["DownloadModelError"];
              /**
               * @description The event name.
               * @constant
               */
              event: "error";
              /** @description The event ID. */
              id?: number;
              /** @description The retry time in milliseconds. */
              retry?: number;
            }, {
              data: components["schemas"]["DownloadModelProgress"];
              /**
               * @description The event name.
               * @constant
               */
              event: "progress";
              /** @description The event ID. */
              id?: number;
              /** @description The retry time in milliseconds. */
              retry?: number;
            }, {
              data: components["schemas"]["DownloadModelFinal"];
              /**
               * @description The event name.
               * @constant
               */
              event: "final";
              /** @description The event ID. */
              id?: number;
              /** @description The retry time in milliseconds. */
              retry?: number;
            }]>[];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  Generate: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["GenerateRequest"];
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "text/event-stream": OneOf<[{
              data: components["schemas"]["GenerateTextResponse"];
              /**
               * @description The event name.
               * @constant
               */
              event: "text";
              /** @description The event ID. */
              id?: number;
              /** @description The retry time in milliseconds. */
              retry?: number;
            }, {
              data: components["schemas"]["ErrorResponse"];
              /**
               * @description The event name.
               * @constant
               */
              event: "error";
              /** @description The event ID. */
              id?: number;
              /** @description The retry time in milliseconds. */
              retry?: number;
            }]>[];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GenerateMessage: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["GenerateMessageRequest"];
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "text/event-stream": OneOf<[{
              data: components["schemas"]["GenerateMessageFinalResponse"];
              /**
               * @description The event name.
               * @constant
               */
              event: "final";
              /** @description The event ID. */
              id?: number;
              /** @description The retry time in milliseconds. */
              retry?: number;
            }, {
              data: components["schemas"]["GenerateMessageErrorResponse"];
              /**
               * @description The event name.
               * @constant
               */
              event: "error";
              /** @description The event ID. */
              id?: number;
              /** @description The retry time in milliseconds. */
              retry?: number;
            }, {
              data: components["schemas"]["GenerateMessageResponse"];
              /**
               * @description The event name.
               * @constant
               */
              event: "text";
              /** @description The event ID. */
              id?: number;
              /** @description The retry time in milliseconds. */
              retry?: number;
            }]>[];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GetResponseCharacter: {
    parameters: {
      path: {
        chatId: number;
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["GetResponseCharacterResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  ListModels: {
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["ListModelsResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  NewSwipe: {
    parameters: {
      path: {
        messageId: number;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  ParseTemplate: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["ParseTemplateRequest"];
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["ParseTemplateResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GetPreset: {
    parameters: {
      path: {
        id: string;
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["GetPresetResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GetAllPresets: {
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["GetAllPresetsResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  SetActivePreset: {
    parameters: {
      path: {
        id: string;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  SetActive: {
    parameters: {
      path: {
        /** @description Template Id */
        id: string;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  SetAutoLoad: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["SetAutoLoadRequest"];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  SetModelPath: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["SetModelPathRequest"];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  SetGPU: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["SetGPURequest"];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  StartServer: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["StartServerInputBody"];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GetStatus: {
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["ServerStatusResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  StopServer: {
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  SwipeLeft: {
    parameters: {
      path: {
        messageId: number;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  SwipeRight: {
    parameters: {
      path: {
        messageId: number;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GetTemplate: {
    parameters: {
      path: {
        /** @description Template Id */
        id: string;
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["GetTemplateResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  GetAllTemplates: {
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": components["schemas"]["GetAllTemplatesResponseBody"];
        };
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  UpdateCharacter: {
    parameters: {
      path: {
        id: string;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UpdateCharacterRequest"];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  UpdateMessage: {
    parameters: {
      path: {
        id: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UpdateMessageRequest"];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  UpdatePreset: {
    parameters: {
      path: {
        id: string;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UpdatePresetRequest"];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
  UpdateTemplate: {
    parameters: {
      path: {
        /** @description Template Id */
        id: string;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UpdateTemplateRequest"];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        content: never;
      };
      /** @description Error */
      default: {
        content: {
          "application/problem+json": components["schemas"]["ErrorModel"];
        };
      };
    };
  };
}
