"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/types.js
var require_types = __commonJS({
  "node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ByteSequence = void 0;
    var ByteSequence5 = class {
      constructor(base64Value) {
        this.base64Value = base64Value;
      }
      toBase64() {
        return this.base64Value;
      }
    };
    exports2.ByteSequence = ByteSequence5;
  }
});

// node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/util.js
var require_util = __commonJS({
  "node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/util.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isByteSequence = exports2.isInnerList = exports2.isValidKeyStr = exports2.isValidTokenStr = exports2.isAscii = void 0;
    var asciiRe = /^[\x20-\x7E]*$/;
    var tokenRe = /^[a-zA-Z*][:/!#$%&'*+\-.^_`|~A-Za-z0-9]*$/;
    var keyRe = /^[a-z*][*\-_.a-z0-9]*$/;
    function isAscii(str) {
      return asciiRe.test(str);
    }
    exports2.isAscii = isAscii;
    function isValidTokenStr(str) {
      return tokenRe.test(str);
    }
    exports2.isValidTokenStr = isValidTokenStr;
    function isValidKeyStr(str) {
      return keyRe.test(str);
    }
    exports2.isValidKeyStr = isValidKeyStr;
    function isInnerList(input) {
      return Array.isArray(input[0]);
    }
    exports2.isInnerList = isInnerList;
    function isByteSequence(input) {
      return typeof input === "object" && "base64Value" in input;
    }
    exports2.isByteSequence = isByteSequence;
  }
});

// node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/token.js
var require_token = __commonJS({
  "node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/token.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Token = void 0;
    var util_1 = require_util();
    var Token = class {
      constructor(value) {
        if (!(0, util_1.isValidTokenStr)(value)) {
          throw new TypeError("Invalid character in Token string. Tokens must start with *, A-Z and the rest of the string may only contain a-z, A-Z, 0-9, :/!#$%&'*+-.^_`|~");
        }
        this.value = value;
      }
      toString() {
        return this.value;
      }
    };
    exports2.Token = Token;
  }
});

// node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/serializer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.serializeKey = exports2.serializeParameters = exports2.serializeToken = exports2.serializeByteSequence = exports2.serializeBoolean = exports2.serializeString = exports2.serializeDecimal = exports2.serializeInteger = exports2.serializeBareItem = exports2.serializeInnerList = exports2.serializeItem = exports2.serializeDictionary = exports2.serializeList = exports2.SerializeError = void 0;
    var types_1 = require_types();
    var token_1 = require_token();
    var util_1 = require_util();
    var SerializeError = class extends Error {
    };
    exports2.SerializeError = SerializeError;
    function serializeList2(input) {
      return input.map((value) => {
        if ((0, util_1.isInnerList)(value)) {
          return serializeInnerList3(value);
        } else {
          return serializeItem2(value);
        }
      }).join(", ");
    }
    exports2.serializeList = serializeList2;
    function serializeDictionary3(input) {
      return Array.from(input.entries()).map(([key, value]) => {
        let out = serializeKey(key);
        if (value[0] === true) {
          out += serializeParameters(value[1]);
        } else {
          out += "=";
          if ((0, util_1.isInnerList)(value)) {
            out += serializeInnerList3(value);
          } else {
            out += serializeItem2(value);
          }
        }
        return out;
      }).join(", ");
    }
    exports2.serializeDictionary = serializeDictionary3;
    function serializeItem2(input) {
      return serializeBareItem2(input[0]) + serializeParameters(input[1]);
    }
    exports2.serializeItem = serializeItem2;
    function serializeInnerList3(input) {
      return `(${input[0].map((value) => serializeItem2(value)).join(" ")})${serializeParameters(input[1])}`;
    }
    exports2.serializeInnerList = serializeInnerList3;
    function serializeBareItem2(input) {
      if (typeof input === "number") {
        if (Number.isInteger(input)) {
          return serializeInteger(input);
        }
        return serializeDecimal(input);
      }
      if (typeof input === "string") {
        return serializeString(input);
      }
      if (input instanceof token_1.Token) {
        return serializeToken(input);
      }
      if (input instanceof types_1.ByteSequence) {
        return serializeByteSequence(input);
      }
      if (typeof input === "boolean") {
        return serializeBoolean(input);
      }
      throw new SerializeError(`Cannot serialize values of type ${typeof input}`);
    }
    exports2.serializeBareItem = serializeBareItem2;
    function serializeInteger(input) {
      if (input < -999999999999999 || input > 999999999999999) {
        throw new SerializeError("Structured headers can only encode integers in the range range of -999,999,999,999,999 to 999,999,999,999,999 inclusive");
      }
      return input.toString();
    }
    exports2.serializeInteger = serializeInteger;
    function serializeDecimal(input) {
      const out = input.toFixed(3).replace(/0+$/, "");
      const signifantDigits = out.split(".")[0].replace("-", "").length;
      if (signifantDigits > 12) {
        throw new SerializeError("Fractional numbers are not allowed to have more than 12 significant digits before the decimal point");
      }
      return out;
    }
    exports2.serializeDecimal = serializeDecimal;
    function serializeString(input) {
      if (!(0, util_1.isAscii)(input)) {
        throw new SerializeError("Only ASCII strings may be serialized");
      }
      return `"${input.replace(/("|\\)/g, (v) => "\\" + v)}"`;
    }
    exports2.serializeString = serializeString;
    function serializeBoolean(input) {
      return input ? "?1" : "?0";
    }
    exports2.serializeBoolean = serializeBoolean;
    function serializeByteSequence(input) {
      return `:${input.toBase64()}:`;
    }
    exports2.serializeByteSequence = serializeByteSequence;
    function serializeToken(input) {
      return input.toString();
    }
    exports2.serializeToken = serializeToken;
    function serializeParameters(input) {
      return Array.from(input).map(([key, value]) => {
        let out = ";" + serializeKey(key);
        if (value !== true) {
          out += "=" + serializeBareItem2(value);
        }
        return out;
      }).join("");
    }
    exports2.serializeParameters = serializeParameters;
    function serializeKey(input) {
      if (!(0, util_1.isValidKeyStr)(input)) {
        throw new SerializeError("Keys in dictionaries must only contain lowercase letter, numbers, _-*. and must start with a letter or *");
      }
      return input;
    }
    exports2.serializeKey = serializeKey;
  }
});

// node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/parser.js
var require_parser = __commonJS({
  "node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/parser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ParseError = exports2.parseItem = exports2.parseList = exports2.parseDictionary = void 0;
    var types_1 = require_types();
    var token_1 = require_token();
    var util_1 = require_util();
    function parseDictionary4(input) {
      const parser = new Parser(input);
      return parser.parseDictionary();
    }
    exports2.parseDictionary = parseDictionary4;
    function parseList2(input) {
      const parser = new Parser(input);
      return parser.parseList();
    }
    exports2.parseList = parseList2;
    function parseItem2(input) {
      const parser = new Parser(input);
      return parser.parseItem();
    }
    exports2.parseItem = parseItem2;
    var ParseError = class extends Error {
      constructor(position, message) {
        super(`Parse error: ${message} at offset ${position}`);
      }
    };
    exports2.ParseError = ParseError;
    var Parser = class {
      constructor(input) {
        this.input = input;
        this.pos = 0;
      }
      parseDictionary() {
        this.skipWS();
        const dictionary = /* @__PURE__ */ new Map();
        while (!this.eof()) {
          const thisKey = this.parseKey();
          let member;
          if (this.lookChar() === "=") {
            this.pos++;
            member = this.parseItemOrInnerList();
          } else {
            member = [true, this.parseParameters()];
          }
          dictionary.set(thisKey, member);
          this.skipOWS();
          if (this.eof()) {
            return dictionary;
          }
          this.expectChar(",");
          this.pos++;
          this.skipOWS();
          if (this.eof()) {
            throw new ParseError(this.pos, "Dictionary contained a trailing comma");
          }
        }
        return dictionary;
      }
      parseList() {
        this.skipWS();
        const members = [];
        while (!this.eof()) {
          members.push(this.parseItemOrInnerList());
          this.skipOWS();
          if (this.eof()) {
            return members;
          }
          this.expectChar(",");
          this.pos++;
          this.skipOWS();
          if (this.eof()) {
            throw new ParseError(this.pos, "A list may not end with a trailing comma");
          }
        }
        return members;
      }
      parseItem(standaloneItem = true) {
        if (standaloneItem)
          this.skipWS();
        const result = [
          this.parseBareItem(),
          this.parseParameters()
        ];
        if (standaloneItem)
          this.checkTrail();
        return result;
      }
      parseItemOrInnerList() {
        if (this.lookChar() === "(") {
          return this.parseInnerList();
        } else {
          return this.parseItem(false);
        }
      }
      parseInnerList() {
        this.expectChar("(");
        this.pos++;
        const innerList = [];
        while (!this.eof()) {
          this.skipWS();
          if (this.lookChar() === ")") {
            this.pos++;
            return [
              innerList,
              this.parseParameters()
            ];
          }
          innerList.push(this.parseItem(false));
          const nextChar = this.lookChar();
          if (nextChar !== " " && nextChar !== ")") {
            throw new ParseError(this.pos, "Expected a whitespace or ) after every item in an inner list");
          }
        }
        throw new ParseError(this.pos, "Could not find end of inner list");
      }
      parseBareItem() {
        const char = this.lookChar();
        if (char === void 0) {
          throw new ParseError(this.pos, "Unexpected end of string");
        }
        if (char.match(/^[-0-9]/)) {
          return this.parseIntegerOrDecimal();
        }
        if (char === '"') {
          return this.parseString();
        }
        if (char.match(/^[A-Za-z*]/)) {
          return this.parseToken();
        }
        if (char === ":") {
          return this.parseByteSequence();
        }
        if (char === "?") {
          return this.parseBoolean();
        }
        throw new ParseError(this.pos, "Unexpected input");
      }
      parseParameters() {
        const parameters = /* @__PURE__ */ new Map();
        while (!this.eof()) {
          const char = this.lookChar();
          if (char !== ";") {
            break;
          }
          this.pos++;
          this.skipWS();
          const key = this.parseKey();
          let value = true;
          if (this.lookChar() === "=") {
            this.pos++;
            value = this.parseBareItem();
          }
          parameters.set(key, value);
        }
        return parameters;
      }
      parseIntegerOrDecimal() {
        let type = "integer";
        let sign = 1;
        let inputNumber = "";
        if (this.lookChar() === "-") {
          sign = -1;
          this.pos++;
        }
        if (!isDigit(this.lookChar())) {
          throw new ParseError(this.pos, "Expected a digit (0-9)");
        }
        while (!this.eof()) {
          const char = this.getChar();
          if (isDigit(char)) {
            inputNumber += char;
          } else if (type === "integer" && char === ".") {
            if (inputNumber.length > 12) {
              throw new ParseError(this.pos, "Exceeded maximum decimal length");
            }
            inputNumber += ".";
            type = "decimal";
          } else {
            this.pos--;
            break;
          }
          if (type === "integer" && inputNumber.length > 15) {
            throw new ParseError(this.pos, "Exceeded maximum integer length");
          }
          if (type === "decimal" && inputNumber.length > 16) {
            throw new ParseError(this.pos, "Exceeded maximum decimal length");
          }
        }
        if (type === "integer") {
          return parseInt(inputNumber, 10) * sign;
        } else {
          if (inputNumber.endsWith(".")) {
            throw new ParseError(this.pos, "Decimal cannot end on a period");
          }
          if (inputNumber.split(".")[1].length > 3) {
            throw new ParseError(this.pos, "Number of digits after the decimal point cannot exceed 3");
          }
          return parseFloat(inputNumber) * sign;
        }
      }
      parseString() {
        let outputString = "";
        this.expectChar('"');
        this.pos++;
        while (!this.eof()) {
          const char = this.getChar();
          if (char === "\\") {
            if (this.eof()) {
              throw new ParseError(this.pos, "Unexpected end of input");
            }
            const nextChar = this.getChar();
            if (nextChar !== "\\" && nextChar !== '"') {
              throw new ParseError(this.pos, "A backslash must be followed by another backslash or double quote");
            }
            outputString += nextChar;
          } else if (char === '"') {
            return outputString;
          } else if (!(0, util_1.isAscii)(char)) {
            throw new ParseError(this.pos, "Strings must be in the ASCII range");
          } else {
            outputString += char;
          }
        }
        throw new ParseError(this.pos, "Unexpected end of input");
      }
      parseToken() {
        let outputString = "";
        while (!this.eof()) {
          const char = this.lookChar();
          if (char === void 0 || !/^[:/!#$%&'*+\-.^_`|~A-Za-z0-9]$/.test(char)) {
            return new token_1.Token(outputString);
          }
          outputString += this.getChar();
        }
        return new token_1.Token(outputString);
      }
      parseByteSequence() {
        this.expectChar(":");
        this.pos++;
        const endPos = this.input.indexOf(":", this.pos);
        if (endPos === -1) {
          throw new ParseError(this.pos, 'Could not find a closing ":" character to mark end of Byte Sequence');
        }
        const b64Content = this.input.substring(this.pos, endPos);
        this.pos += b64Content.length + 1;
        if (!/^[A-Za-z0-9+/=]*$/.test(b64Content)) {
          throw new ParseError(this.pos, "ByteSequence does not contain a valid base64 string");
        }
        return new types_1.ByteSequence(b64Content);
      }
      parseBoolean() {
        this.expectChar("?");
        this.pos++;
        const char = this.getChar();
        if (char === "1") {
          return true;
        }
        if (char === "0") {
          return false;
        }
        throw new ParseError(this.pos, 'Unexpected character. Expected a "1" or a "0"');
      }
      parseKey() {
        var _a;
        if (!((_a = this.lookChar()) === null || _a === void 0 ? void 0 : _a.match(/^[a-z*]/))) {
          throw new ParseError(this.pos, "A key must begin with an asterisk or letter (a-z)");
        }
        let outputString = "";
        while (!this.eof()) {
          const char = this.lookChar();
          if (char === void 0 || !/^[a-z0-9_\-.*]$/.test(char)) {
            return outputString;
          }
          outputString += this.getChar();
        }
        return outputString;
      }
      /**
       * Looks at the next character without advancing the cursor.
       *
       * Returns undefined if we were at the end of the string.
       */
      lookChar() {
        return this.input[this.pos];
      }
      /**
       * Checks if the next character is 'char', and fail otherwise.
       */
      expectChar(char) {
        if (this.lookChar() !== char) {
          throw new ParseError(this.pos, `Expected ${char}`);
        }
      }
      getChar() {
        return this.input[this.pos++];
      }
      eof() {
        return this.pos >= this.input.length;
      }
      // Advances the pointer to skip all whitespace.
      skipOWS() {
        while (true) {
          const c = this.input.substr(this.pos, 1);
          if (c === " " || c === "	") {
            this.pos++;
          } else {
            break;
          }
        }
      }
      // Advances the pointer to skip all spaces
      skipWS() {
        while (this.lookChar() === " ") {
          this.pos++;
        }
      }
      // At the end of parsing, we need to make sure there are no bytes after the
      // header except whitespace.
      checkTrail() {
        this.skipWS();
        if (!this.eof()) {
          throw new ParseError(this.pos, "Unexpected characters at end of input");
        }
      }
    };
    exports2.default = Parser;
    var isDigitRegex = /^[0-9]$/;
    function isDigit(char) {
      if (char === void 0)
        return false;
      return isDigitRegex.test(char);
    }
  }
});

// node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/structured-headers@1.0.1/node_modules/structured-headers/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Token = void 0;
    __exportStar(require_serializer(), exports2);
    __exportStar(require_parser(), exports2);
    __exportStar(require_types(), exports2);
    __exportStar(require_util(), exports2);
    var token_1 = require_token();
    Object.defineProperty(exports2, "Token", { enumerable: true, get: function() {
      return token_1.Token;
    } });
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ClockSkewInvalidError: () => ClockSkewInvalidError,
  DraftSignatureHeaderKeys: () => DraftSignatureHeaderKeys,
  HTTPMessageSignaturesParseError: () => HTTPMessageSignaturesParseError,
  InvalidRequestError: () => InvalidRequestError,
  KeyHashValidationError: () => KeyHashValidationError,
  KeyValidationError: () => KeyValidationError,
  Pkcs1ParseError: () => Pkcs1ParseError,
  Pkcs8ParseError: () => Pkcs8ParseError,
  RFC9421SignatureBaseFactory: () => RFC9421SignatureBaseFactory,
  RFC9421SignatureParams: () => RFC9421SignatureParams,
  RFC9530GenerateDigestHeaderError: () => RFC9530GenerateDigestHeaderError,
  RFC9530HashAlgorithmRegistry: () => RFC9530HashAlgorithmRegistry,
  RequestHasMultipleDateHeadersError: () => RequestHasMultipleDateHeadersError,
  RequestHasMultipleSignatureHeadersError: () => RequestHasMultipleSignatureHeadersError,
  SignatureHeaderNotFoundError: () => SignatureHeaderNotFoundError,
  SignatureInputLackedError: () => SignatureInputLackedError,
  SignatureParamsClockInvalidError: () => SignatureParamsClockInvalidError,
  SignatureParamsContentLackedError: () => SignatureParamsContentLackedError,
  SpkiParseError: () => SpkiParseError,
  UnknownSignatureHeaderFormatError: () => UnknownSignatureHeaderFormatError,
  asn1ToArrayBuffer: () => asn1ToArrayBuffer,
  canonicalizeHeaderValue: () => canonicalizeHeaderValue,
  checkClockSkew: () => checkClockSkew,
  chooseRFC9530HashAlgorithmByPreference: () => chooseRFC9530HashAlgorithmByPreference,
  collectHeaders: () => collectHeaders,
  compareUint8Array: () => compareUint8Array,
  convertHashAlgorithmFromWebCryptoToRFC9530: () => convertHashAlgorithmFromWebCryptoToRFC9530,
  convertSignatureParamsDictionary: () => convertSignatureParamsDictionary,
  correctHeadersFromFlatArray: () => correctHeadersFromFlatArray,
  decodePem: () => decodePem,
  decodePublicMultikey: () => decodePublicMultikey,
  defaultSignInfoDefaults: () => defaultSignInfoDefaults,
  digestHeaderRegEx: () => digestHeaderRegEx,
  encodeArrayBufferToBase64: () => encodeArrayBufferToBase64,
  exportPrivateKeyPem: () => exportPrivateKeyPem,
  exportPublicKeyPem: () => exportPublicKeyPem,
  genASN1Length: () => genASN1Length,
  genAlgorithmForSignAndVerify: () => genAlgorithmForSignAndVerify,
  genDigestHeaderBothRFC3230AndRFC9530: () => genDigestHeaderBothRFC3230AndRFC9530,
  genDraftSignature: () => genDraftSignature,
  genDraftSignatureHeader: () => genDraftSignatureHeader,
  genDraftSigningString: () => genDraftSigningString,
  genEcKeyPair: () => genEcKeyPair,
  genEd25519KeyPair: () => genEd25519KeyPair,
  genEd448KeyPair: () => genEd448KeyPair,
  genPkcs8FromPkcs1: () => genPkcs8FromPkcs1,
  genRFC3230DigestHeader: () => genRFC3230DigestHeader,
  genRFC9530DigestHeader: () => genRFC9530DigestHeader,
  genRsaKeyPair: () => genRsaKeyPair,
  genSignInfo: () => genSignInfo,
  genSignInfoDraft: () => genSignInfoDraft,
  genSignature: () => genSignature,
  genSingleRFC9530DigestHeader: () => genSingleRFC9530DigestHeader,
  genSpkiFromPkcs1: () => genSpkiFromPkcs1,
  getDraftAlgoString: () => getDraftAlgoString,
  getHeaderValue: () => getHeaderValue,
  getMap: () => getMap,
  getMapWithoutUndefined: () => getMapWithoutUndefined,
  getNistCurveFromOid: () => getNistCurveFromOid,
  getPublicKeyAlgorithmNameFromOid: () => getPublicKeyAlgorithmNameFromOid,
  getRFC9421AlgoString: () => getRFC9421AlgoString,
  getValueByLc: () => getValueByLc,
  getWebcrypto: () => getWebcrypto,
  importPrivateJwk: () => importPrivateJwk,
  importPrivateKey: () => importPrivateKey,
  importPublicJwk: () => importPublicJwk,
  importPublicKey: () => importPublicKey,
  isBrowserHeader: () => isBrowserHeader,
  isBrowserRequest: () => isBrowserRequest,
  isBrowserResponse: () => isBrowserResponse,
  keyHashAlgosForDraftDecoding: () => keyHashAlgosForDraftDecoding,
  keyHashAlgosForDraftEncofing: () => keyHashAlgosForDraftEncofing,
  knownSfvHeaderTypeDictionary: () => knownSfvHeaderTypeDictionary,
  lcObjectKey: () => lcObjectKey,
  numberToUint8Array: () => numberToUint8Array,
  obsoleteLineFoldingRegEx: () => obsoleteLineFoldingRegEx,
  parseAlgorithmIdentifier: () => parseAlgorithmIdentifier,
  parseAndImportPublicKey: () => parseAndImportPublicKey,
  parseDraftRequest: () => parseDraftRequest,
  parseDraftRequestSignatureHeader: () => parseDraftRequestSignatureHeader,
  parsePkcs1: () => parsePkcs1,
  parsePkcs1PrivateKey: () => parsePkcs1PrivateKey,
  parsePkcs8: () => parsePkcs8,
  parsePublicKey: () => parsePublicKey,
  parseRFC9421RequestOrResponse: () => parseRFC9421RequestOrResponse,
  parseRequestSignature: () => parseRequestSignature,
  parseSignInfo: () => parseSignInfo,
  parseSingleRFC9421Signature: () => parseSingleRFC9421Signature,
  parseSpki: () => parseSpki,
  processSingleRFC9421SignSource: () => processSingleRFC9421SignSource,
  removeObsoleteLineFolding: () => removeObsoleteLineFolding,
  requestTargetDerivedComponents: () => requestTargetDerivedComponents,
  responseTargetDerivedComponents: () => responseTargetDerivedComponents,
  rsaASN1AlgorithmIdentifier: () => rsaASN1AlgorithmIdentifier,
  setHeaderToRequestOrResponse: () => setHeaderToRequestOrResponse,
  signAsDraftToRequest: () => signAsDraftToRequest,
  signAsRFC9421ToRequestOrResponse: () => signAsRFC9421ToRequestOrResponse,
  signatureHeaderIsDraft: () => signatureHeaderIsDraft,
  splitPer64Chars: () => splitPer64Chars,
  supportedHashAlgorithmsWithRFC9530AndWebCrypto: () => supportedHashAlgorithmsWithRFC9530AndWebCrypto,
  toStringOrToLc: () => toStringOrToLc,
  validateAndProcessParsedDraftSignatureHeader: () => validateAndProcessParsedDraftSignatureHeader,
  validateRFC9421SignatureInputParameters: () => validateRFC9421SignatureInputParameters,
  validateRequestAndGetSignatureHeader: () => validateRequestAndGetSignatureHeader,
  verifyDigestHeader: () => verifyDigestHeader,
  verifyDraftSignature: () => verifyDraftSignature,
  verifyParsedSignature: () => verifyParsedSignature,
  verifyRFC3230DigestHeader: () => verifyRFC3230DigestHeader,
  verifyRFC9421Signature: () => verifyRFC9421Signature,
  verifyRFC9530DigestHeader: () => verifyRFC9530DigestHeader,
  webCryptoSigner: () => webCryptoSigner,
  webCryptoVerifier: () => webCryptoVerifier
});
module.exports = __toCommonJS(src_exports);

// src/pem/der.ts
function readDer(data, offset = 0) {
  const start = offset;
  if (offset + 2 > data.length)
    throw new Error("Truncated DER");
  const tag = data[offset++];
  if ((tag & 31) === 31)
    throw new Error("Unsupported DER tag");
  let length = data[offset++];
  if (length & 128) {
    const count = length & 127;
    if (!count || count > 4 || offset + count > data.length || data[offset] === 0)
      throw new Error("Invalid DER length");
    length = 0;
    for (let i = 0; i < count; i++)
      length = length * 256 + data[offset++];
    if (length < 128)
      throw new Error("Nonminimal DER length");
  }
  const end = offset + length;
  if (end > data.length)
    throw new Error("Truncated DER content");
  return { tag, content: data.subarray(offset, end), encoded: data.subarray(start, end), end };
}
function derChildren(data) {
  const children = [];
  for (let offset = 0; offset < data.length; ) {
    const child = readDer(data, offset);
    children.push(child);
    offset = child.end;
  }
  return children;
}
function derSequence(data) {
  if (data.length > 1024 * 1024)
    throw new Error("Key DER exceeds size limit");
  const root = readDer(data);
  if (root.tag !== 48 || root.end !== data.length)
    throw new Error("Expected one DER sequence");
  return derChildren(root.content);
}
function unsignedDerInteger(element, allowZero = false) {
  const bytes = element.content;
  if (element.tag !== 2 || !bytes.length || bytes[0] & 128)
    throw new Error("Expected nonnegative DER integer");
  if (bytes.length > 1 && bytes[0] === 0 && !(bytes[1] & 128))
    throw new Error("Nonminimal DER integer");
  if (!allowZero && bytes.every((value) => value === 0))
    throw new Error("Expected positive DER integer");
  return bytes;
}

// src/pem/pkcs1.ts
var import_asn1js = require("@lapo/asn1js");
var Pkcs1ParseError = class extends Error {
  constructor(message) {
    super(message);
  }
};
function parsePkcs1(input) {
  const parsed = import_asn1js.ASN1.decode(decodePem(input));
  if (!parsed.sub || parsed.sub.length !== 2)
    throw new Pkcs1ParseError("Invalid SPKI (invalid sub length)");
  const modulus = parsed.sub[0];
  const publicExponent = parsed.sub[1];
  if (!modulus || modulus.tag.tagNumber !== 2)
    throw new Pkcs1ParseError("Invalid SPKI (invalid modulus)");
  if (!publicExponent || publicExponent.tag.tagNumber !== 2)
    throw new Pkcs1ParseError("Invalid SPKI (invalid publicExponent)");
  return {
    pkcs1: asn1ToArrayBuffer(parsed),
    modulus: (asn1ToArrayBuffer(modulus, true).byteLength - 1) * 8,
    publicExponent: parseInt(publicExponent.content() || "0")
  };
}
var rsaASN1AlgorithmIdentifier = Uint8Array.from([
  48,
  13,
  6,
  9,
  42,
  134,
  72,
  134,
  247,
  13,
  1,
  1,
  1,
  // 1.2.840.113549.1.1.1
  5,
  0
]);
function genSpkiFromPkcs1(input) {
  const { pkcs1 } = parsePkcs1(input);
  const pkcsLength = genASN1Length(pkcs1.byteLength + 1);
  const rootContent = Uint8Array.from([
    ...rsaASN1AlgorithmIdentifier,
    3,
    ...pkcsLength,
    // BIT STRING
    0,
    ...new Uint8Array(pkcs1)
  ]);
  return Uint8Array.from([
    48,
    ...genASN1Length(rootContent.length),
    // SEQUENCE
    ...rootContent
  ]);
}
function parsePkcs1PrivateKey(input) {
  try {
    if (typeof input === "string" && /ENCRYPTED|Proc-Type:|DEK-Info:/.test(input))
      throw new Error("Encrypted private keys are unsupported");
    const decoded = decodePem(input);
    const data = typeof decoded === "object" && "enc" in decoded ? decoded.enc : decoded;
    const bytes = typeof data === "string" ? Uint8Array.from(data, (char) => char.charCodeAt(0)) : data instanceof Uint8Array ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
    const fields = derSequence(bytes);
    if (fields.length !== 9)
      throw new Error("Expected nine two-prime RSA fields");
    const version = unsignedDerInteger(fields[0], true);
    if (version.length !== 1 || version[0] !== 0)
      throw new Error("Only two-prime version 0 is supported");
    for (const field of fields.slice(1))
      unsignedDerInteger(field);
    return { pkcs1: new Uint8Array(bytes).buffer };
  } catch (error) {
    throw new Pkcs1ParseError(`Invalid PKCS#1 private key: ${error.message}`);
  }
}
function genPkcs8FromPkcs1(input) {
  const { pkcs1 } = parsePkcs1PrivateKey(input);
  const content = Uint8Array.from([
    2,
    1,
    0,
    ...rsaASN1AlgorithmIdentifier,
    4,
    ...genASN1Length(pkcs1.byteLength),
    ...new Uint8Array(pkcs1)
  ]);
  return Uint8Array.from([48, ...genASN1Length(content.length), ...content]);
}

// src/pem/multikey.ts
var alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function decodePublicMultikey(input) {
  if (!input.startsWith("z") || input.length < 2 || input.length > 8192)
    throw new Error("Invalid or oversized public Multikey");
  let value = 0n;
  for (const char of input.slice(1)) {
    const digit = alphabet.indexOf(char);
    if (digit < 0)
      throw new Error("Invalid base58btc character");
    value = value * 58n + BigInt(digit);
  }
  const bytes = [];
  while (value) {
    bytes.push(Number(value & 255n));
    value >>= 8n;
  }
  bytes.reverse();
  let leadingZeroes = 0;
  for (const char of input.slice(1)) {
    if (char !== "1")
      break;
    leadingZeroes++;
  }
  const decoded = Uint8Array.from([...new Array(leadingZeroes).fill(0), ...bytes]);
  if (decoded[0] === 237 && decoded[1] === 1) {
    if (decoded.length !== 34)
      throw new Error("Ed25519 Multikey requires 32 public bytes");
    return Uint8Array.from([48, 42, 48, 5, 6, 3, 43, 101, 112, 3, 33, 0, ...decoded.subarray(2)]);
  }
  if (decoded[0] === 133 && decoded[1] === 36) {
    const key = decoded.subarray(2);
    if (key.length > 4096)
      throw new Error("RSA Multikey exceeds size limit");
    const fields = derSequence(key);
    if (fields.length !== 2)
      throw new Error("RSA Multikey requires a PKCS#1 public key");
    for (const field of fields)
      unsignedDerInteger(field);
    return genSpkiFromPkcs1(key);
  }
  throw new Error("Unsupported or secret Multikey codec");
}

// src/draft/verify.ts
var import_rfc4648 = require("rfc4648");

// src/pem/pss.ts
var sha512Oid = [96, 134, 72, 1, 101, 3, 4, 2, 3];
var mgf1Oid = [42, 134, 72, 134, 247, 13, 1, 1, 8];
function matchesOid(element, expected) {
  return element.tag === 6 && element.content.length === expected.length && element.content.every((byte, i) => byte === expected[i]);
}
function hash512(element) {
  if (element.tag !== 48)
    throw new Error("Invalid PSS hash identifier");
  const parts = derChildren(element.content);
  if (parts.length < 1 || parts.length > 2 || !matchesOid(parts[0], sha512Oid) || parts[1] && (parts[1].tag !== 5 || parts[1].content.length)) {
    throw new Error("RSA-PSS requires SHA-512");
  }
}
function validateRfc9421PssParameters(identifier) {
  const parts = derSequence(identifier.encoded);
  if (parts.length === 1)
    return;
  if (parts.length !== 2 || parts[1].tag !== 48)
    throw new Error("Invalid RSA-PSS parameters");
  let hash = false;
  let mgf = false;
  let saltLength = 20;
  let lastTag = -1;
  for (const field of derChildren(parts[1].content)) {
    if (field.tag < 160 || field.tag > 163 || field.tag <= lastTag)
      throw new Error("Invalid RSA-PSS parameter field");
    lastTag = field.tag;
    const values = derChildren(field.content);
    if (values.length !== 1)
      throw new Error("Invalid explicit RSA-PSS field");
    if (field.tag === 160) {
      hash512(values[0]);
      hash = true;
    }
    if (field.tag === 161) {
      const mgfParts = derSequence(values[0].encoded);
      if (mgfParts.length !== 2 || !matchesOid(mgfParts[0], mgf1Oid))
        throw new Error("RSA-PSS requires MGF1");
      hash512(mgfParts[1]);
      mgf = true;
    }
    if (field.tag === 162 || field.tag === 163) {
      const integer = unsignedDerInteger(values[0], true);
      if (integer.length > 2)
        throw new Error("Unsupported RSA-PSS integer parameter");
      const value = integer.reduce((total, byte) => total * 256 + byte, 0);
      if (field.tag === 162)
        saltLength = value;
      else if (value !== 1)
        throw new Error("Unsupported RSA-PSS trailer");
    }
  }
  if (!hash || !mgf || saltLength > 64)
    throw new Error("RSA-PSS key restrictions conflict with RFC 9421");
}
function normalizePssContainer(data, identifierIndex) {
  const fields = derSequence(data);
  validateRfc9421PssParameters(fields[identifierIndex]);
  const content = fields.flatMap((field, i) => Array.from(i === identifierIndex ? rsaASN1AlgorithmIdentifier : field.encoded));
  return Uint8Array.from([48, ...genASN1Length(content.length), ...content]).buffer;
}

// src/pem/pkcs8.ts
var import_asn1js2 = require("@lapo/asn1js");
var Pkcs8ParseError = class extends Error {
  constructor(message) {
    super(message);
  }
};
function parsePkcs8(input) {
  const parsed = import_asn1js2.ASN1.decode(decodePem(input));
  if (!parsed.sub || parsed.sub.length < 3 || parsed.sub.length > 4)
    throw new Pkcs8ParseError("Invalid PKCS#8 (invalid sub length)");
  const version = parsed.sub[0];
  if (!version || !version.tag || version.tag.tagNumber !== 2)
    throw new Pkcs8ParseError("Invalid PKCS#8 (invalid version)");
  const privateKeyAlgorithm = parseAlgorithmIdentifier(parsed.sub[1]);
  if (privateKeyAlgorithm.algorithm.split("\n")[0] === "1.2.840.113549.1.1.10" && parsed.posEnd() !== parsed.stream.enc.length)
    throw new Pkcs8ParseError("Trailing PSS key data");
  const privateKey = parsed.sub[2];
  if (!privateKey || !privateKey.tag || privateKey.tag.tagNumber !== 4)
    throw new Pkcs8ParseError("Invalid PKCS#8 (invalid privateKey)");
  const attributes = parsed.sub[3];
  if (attributes) {
    if (attributes.tag.tagNumber !== 49)
      throw new Pkcs8ParseError("Invalid PKCS#8 (invalid attributes)");
  }
  return {
    der: privateKeyAlgorithm.algorithm.split("\n")[0] === "1.2.840.113549.1.1.10" ? normalizePssContainer(new Uint8Array(asn1ToArrayBuffer(parsed)), 1) : asn1ToArrayBuffer(parsed),
    ...privateKeyAlgorithm,
    attributesRaw: attributes ? asn1ToArrayBuffer(attributes) : null
  };
}
async function importPrivateKey(key, keyUsages = ["sign"], defaults = defaultSignInfoDefaults, extractable = false) {
  if (typeof key === "object" && "kty" in key)
    return importPrivateJwk(key, keyUsages, defaults, extractable);
  key = key;
  let parsedPrivateKey;
  try {
    parsedPrivateKey = parsePkcs8(key);
  } catch {
    parsedPrivateKey = parsePkcs8(genPkcs8FromPkcs1(key));
  }
  const importParams = genSignInfo(parsedPrivateKey, defaults);
  return await (await getWebcrypto()).subtle.importKey("pkcs8", parsedPrivateKey.der, importParams, extractable, keyUsages);
}

// src/const.ts
var textEncoder = new TextEncoder();

// src/shared/sign.ts
async function genSignature(privateKey, signingString, defaults = defaultSignInfoDefaults) {
  if (defaults.rsa && (privateKey.algorithm.name === "RSA-PSS" || privateKey.algorithm.name === "RSASSA-PKCS1-v1_5") && defaults.rsa !== privateKey.algorithm.name)
    throw new Error("CryptoKey RSA mode conflicts with signing defaults");
  const signatureAB = await (await getWebcrypto()).subtle.sign(genAlgorithmForSignAndVerify(privateKey.algorithm, defaults.hash), privateKey, textEncoder.encode(signingString));
  return encodeArrayBufferToBase64(signatureAB);
}

// src/draft/const.ts
var keyHashAlgosForDraftEncofing = {
  "SHA": "sha1",
  "SHA-1": "sha1",
  "SHA-256": "sha256",
  "SHA-384": "sha384",
  "SHA-512": "sha512",
  "MD5": "md5"
};
var keyHashAlgosForDraftDecoding = {
  "sha1": "SHA",
  "sha256": "SHA-256",
  "sha384": "SHA-384",
  "sha512": "SHA-512",
  "md5": "MD5"
};

// src/draft/string.ts
function genDraftSigningString(source, includeHeaders, additional) {
  if (!source.method) {
    throw new Error("Request method not found");
  }
  if (!source.url) {
    throw new Error("Request URL not found");
  }
  const headers = collectHeaders(source);
  const results = [];
  for (const key of includeHeaders.map((x) => x.toLowerCase())) {
    if (key === "(request-target)") {
      let requestTarget;
      if (source.url.startsWith("/")) {
        requestTarget = source.url.split("#", 1)[0];
      } else {
        const url = new URL(source.url);
        const search = url.search || (url.href.split("#", 1)[0].endsWith("?") ? "?" : "");
        requestTarget = url.pathname + search;
      }
      results.push(`(request-target): ${source.method.toLowerCase()} ${requestTarget}`);
    } else if (key === "(keyid)") {
      results.push(`(keyid): ${additional?.keyId}`);
    } else if (key === "(algorithm)") {
      results.push(`(algorithm): ${additional?.algorithm}`);
    } else if (key === "(created)") {
      results.push(`(created): ${additional?.created}`);
    } else if (key === "(expires)") {
      results.push(`(expires): ${additional?.expires}`);
    } else if (key === "(opaque)") {
      results.push(`(opaque): ${additional?.opaque}`);
    } else {
      if (key === "date" && !headers["date"] && headers["x-date"]) {
        results.push(`date: ${headers["x-date"]}`);
      } else {
        results.push(`${key}: ${headers[key]}`);
      }
    }
  }
  return results.join("\n");
}

// src/draft/sign.ts
function getDraftAlgoString(keyAlgorithm, hashAlgorithm) {
  const verifyHash = () => {
    if (!hashAlgorithm)
      throw new Error("hash is required or must not be null");
    if (!(hashAlgorithm in keyHashAlgosForDraftEncofing))
      throw new Error(`unsupported hash: ${hashAlgorithm}`);
  };
  if (keyAlgorithm === "RSASSA-PKCS1-v1_5") {
    verifyHash();
    return `rsa-${keyHashAlgosForDraftEncofing[hashAlgorithm]}`;
  }
  if (keyAlgorithm === "ECDSA") {
    verifyHash();
    return `ecdsa-${keyHashAlgosForDraftEncofing[hashAlgorithm]}`;
  }
  if (keyAlgorithm === "ECDH") {
    verifyHash();
    return `ecdh-${keyHashAlgosForDraftEncofing[hashAlgorithm]}`;
  }
  if (keyAlgorithm === "Ed25519") {
    return "ed25519-sha512";
  }
  if (keyAlgorithm === "Ed448") {
    return "ed448";
  }
  throw new Error("unsupported keyAlgorithm");
}
var genDraftSignature = genSignature;
function genDraftSignatureHeader(includeHeaders, keyId, signature, algorithm) {
  return `keyId="${keyId}",algorithm="${algorithm}",headers="${includeHeaders.join(" ")}",signature="${signature}"`;
}
async function signAsDraftToRequest(request, key, includeHeaders, opts) {
  if (opts && opts.hashAlgorithm)
    opts.hash = opts.hashAlgorithm;
  const prepared = await prepareSigningKey("draft", key, opts, opts?.signer);
  const algoString = prepared.wire;
  const signingString = genDraftSigningString(request, includeHeaders, { keyId: key.keyId, algorithm: algoString });
  const bytes = await prepared.signer({ version: "draft", keyId: key.keyId, algorithm: prepared.operation, signatureAlgorithm: algoString, signingString, key: prepared.key });
  if (!(bytes instanceof Uint8Array))
    throw new Error("Signer must return Uint8Array");
  const signature = encodeArrayBufferToBase64(new Uint8Array(bytes).buffer);
  const signatureHeader = genDraftSignatureHeader(includeHeaders, key.keyId, signature, algoString);
  Object.assign(request.headers, {
    Signature: signatureHeader
  });
  return {
    signingString,
    signature,
    signatureHeader
  };
}

// src/rfc9421/sign.ts
var sh = __toESM(require_dist(), 1);
function getRFC9421AlgoString(keyAlgorithm, hashAlgorithm) {
  if (typeof keyAlgorithm === "string") {
    keyAlgorithm = { name: keyAlgorithm };
  }
  if (keyAlgorithm.name === "RSA-PSS") {
    if (hashAlgorithm !== "SHA-512" || keyAlgorithm.hash.name !== "SHA-512")
      throw new Error("RFC 9421 RSA-PSS requires SHA-512");
    return "rsa-pss-sha512";
  }
  if (keyAlgorithm.name === "RSASSA-PKCS1-v1_5") {
    if (hashAlgorithm === "SHA-256")
      return "rsa-v1_5-sha256";
    if (hashAlgorithm === "SHA-512")
      return "rsa-v1_5-sha512";
    throw new Error(`unsupported hash(RSASSA-PKCS1-v1_5): ${hashAlgorithm}`);
  }
  if (keyAlgorithm.name === "ECDSA") {
    if (keyAlgorithm.namedCurve === "P-256" && hashAlgorithm === "SHA-256") {
      return "ecdsa-p256-sha256";
    }
    if (keyAlgorithm.namedCurve === "P-384" && hashAlgorithm === "SHA-384") {
      return "ecdsa-p384-sha384";
    }
    throw new Error(`unsupported curve(${keyAlgorithm.namedCurve}) or hash(${hashAlgorithm})`);
  }
  if (keyAlgorithm.name === "Ed25519") {
    return "ed25519";
  }
  throw new Error(`unsupported keyAlgorithm(${JSON.stringify(keyAlgorithm)}) or hash(${hashAlgorithm})`);
}
async function processSingleRFC9421SignSource(source) {
  const prepared = await prepareSigningKey("rfc9421", source.key, source.defaults, source.signer);
  const alg = prepared.wire;
  const created = source.created ?? Math.round(Date.now() / 1e3);
  const expires = source.expiresAfter ? created + source.expiresAfter : void 0;
  return {
    key: prepared.key,
    params: [
      source.identifiers,
      {
        keyid: source.key.keyId,
        alg,
        created,
        expires,
        nonce: source.nonce,
        tag: source.tag
      }
    ]
  };
}
async function signAsRFC9421ToRequestOrResponse(request, sources, signatureBaseOptions = {
  scheme: "https",
  additionalSfvTypeDictionary: {}
}) {
  const sourcesMap = getMap(sources);
  const preparedKeys = /* @__PURE__ */ new Map();
  const inputDictionary = /* @__PURE__ */ new Map();
  for (const [label, source] of sourcesMap) {
    const prepared = await prepareSigningKey("rfc9421", source.key, source.defaults, source.signer ?? ("signer" in source.key ? source.key.signer : signatureBaseOptions.signer));
    preparedKeys.set(label, prepared);
    const created = source.created ?? Math.round(Date.now() / 1e3);
    const params = [source.identifiers, { keyid: source.key.keyId, alg: prepared.wire, created, ...source.expiresAfter ? { expires: created + source.expiresAfter } : {}, ...source.nonce !== void 0 ? { nonce: source.nonce } : {}, ...source.tag !== void 0 ? { tag: source.tag } : {} }];
    inputDictionary.set(label, params);
  }
  const inputHeader = convertSignatureParamsDictionary(inputDictionary);
  setHeaderToRequestOrResponse(request, "Signature-Input", inputHeader);
  const factory = new RFC9421SignatureBaseFactory(
    request,
    signatureBaseOptions.scheme,
    signatureBaseOptions.additionalSfvTypeDictionary,
    signatureBaseOptions.request
  );
  const signaturesEntries = (factory.isRequest() ? factory.requestSignatureInput : factory.responseSignatureInput).keys();
  if (!signaturesEntries)
    throw new Error("signaturesEntries is undefined");
  const signatureDictionary = /* @__PURE__ */ new Map();
  const signatureBases = /* @__PURE__ */ new Map();
  for (const label of signaturesEntries) {
    const base = factory.generate(label);
    const prepared = preparedKeys.get(label);
    if (!prepared)
      throw new Error(`key not found: ${label}`);
    const bytes = await prepared.signer({ version: "rfc9421", label, keyId: sourcesMap.get(label).key.keyId, algorithm: prepared.operation, signatureAlgorithm: prepared.wire, signingString: base, key: prepared.key });
    if (!(bytes instanceof Uint8Array))
      throw new Error("Signer must return Uint8Array");
    signatureBases.set(label, base);
    signatureDictionary.set(label, [
      new sh.ByteSequence(
        encodeArrayBufferToBase64(new Uint8Array(bytes).buffer)
      ),
      /* @__PURE__ */ new Map()
    ]);
  }
  const signatureHeader = sh.serializeDictionary(signatureDictionary);
  setHeaderToRequestOrResponse(request, "Signature", signatureHeader);
  return {
    inputHeader,
    signatureHeader,
    signatureDictionary,
    signatureBases
  };
}

// src/shared/backend.ts
function isVerificationOptions(value) {
  return !!value && typeof value === "object" && !(value instanceof Map) && !("algorithm" in value) && !("kty" in value);
}
function validateSignatureAlgorithm(version, wire) {
  const allowed = version === "rfc9421" ? ["rsa-pss-sha512", "rsa-v1_5-sha256", "ecdsa-p256-sha256", "ecdsa-p384-sha384", "ed25519"] : ["hs2019", "rsa-sha1", "rsa-sha256", "rsa-sha384", "rsa-sha512", "ecdsa-sha1", "ecdsa-sha256", "ecdsa-sha384", "ecdsa-sha512", "ed25519-sha512", "ed25519", "ed448"];
  if (!allowed.includes(wire.toLowerCase()))
    throw new Error("Unsupported signature algorithm");
}
function validateSignatureOperation(version, wire, operation) {
  validateSignatureAlgorithm(version, wire);
  if (operation.name === "RSA-PSS" && (operation.hash !== "SHA-512" || operation.saltLength !== 64))
    throw new Error("RFC 9421 PSS operation requires SHA-512 and saltLength 64");
  if (!["RSA-PSS", "RSASSA-PKCS1-v1_5", "ECDSA", "Ed25519", "Ed448"].includes(operation.name))
    throw new Error("Unsupported signing operation");
  if ((operation.name === "Ed25519" || operation.name === "Ed448") && ("hash" in operation || "saltLength" in operation))
    throw new Error("EdDSA does not accept a prehash operation");
  const expected = parseSignInfo(wire, operation);
  if (expected.name !== operation.name || "hash" in expected && (!("hash" in operation) || expected.hash !== operation.hash) || "namedCurve" in expected && (!("namedCurve" in operation) || expected.namedCurve !== operation.namedCurve))
    throw new Error("Operation conflicts with wire algorithm");
  return expected;
}
function operationWithoutKey(version, wire) {
  validateSignatureAlgorithm(version, wire);
  if (wire === "rsa-pss-sha512")
    return { name: "RSA-PSS", hash: "SHA-512", saltLength: 64 };
  if (wire === "ecdsa-p256-sha256")
    return { name: "ECDSA", hash: "SHA-256", namedCurve: "P-256" };
  if (wire === "ecdsa-p384-sha384")
    return { name: "ECDSA", hash: "SHA-384", namedCurve: "P-384" };
  if (wire === "ed25519" || wire === "ed25519-sha512")
    return { name: "Ed25519" };
  if (wire === "ed448")
    return { name: "Ed448" };
  if (wire.startsWith("rsa-"))
    return parseSignInfo(wire, { name: "RSASSA-PKCS1-v1_5" });
  throw new Error("Keyless verification requires an unambiguous signature algorithm");
}
function validateOperationKey(key, operation, usage) {
  if (key.type !== (usage === "sign" ? "private" : "public") || !key.usages.includes(usage) || key.algorithm.name !== operation.name)
    throw new Error("CryptoKey is incompatible with signature operation");
  if ("hash" in key.algorithm && (!("hash" in operation) || key.algorithm.hash.name !== operation.hash))
    throw new Error("CryptoKey hash conflicts with signature operation");
  if ("namedCurve" in key.algorithm && (!("namedCurve" in operation) || key.algorithm.namedCurve !== operation.namedCurve))
    throw new Error("CryptoKey curve conflicts with signature operation");
}
async function webCryptoSigner(context) {
  validateSignatureOperation(context.version, context.signatureAlgorithm, context.algorithm);
  if (!context.key)
    throw new Error("WebCrypto signing requires a private key");
  validateOperationKey(context.key, context.algorithm, "sign");
  return new Uint8Array(await (await getWebcrypto()).subtle.sign(context.algorithm, context.key, textEncoder.encode(context.signingString)));
}
async function webCryptoVerifier(context) {
  validateSignatureOperation(context.version, context.signatureAlgorithm, context.algorithm);
  if (!context.key)
    throw new Error("WebCrypto verification requires a public key");
  validateOperationKey(context.key, context.algorithm, "verify");
  return (await getWebcrypto()).subtle.verify(context.algorithm, context.key, context.signature, textEncoder.encode(context.signingString));
}
async function prepareSigningKey(version, source, defaults, signer) {
  if ("signatureAlgorithm" in source) {
    const operation2 = validateSignatureOperation(version, source.signatureAlgorithm, source.algorithm);
    if (defaults && "hash" in operation2 && defaults.hash !== operation2.hash)
      throw new Error("Signing defaults conflict with explicit operation");
    if (defaults?.rsa && defaults.rsa !== operation2.name)
      throw new Error("Signing defaults conflict with explicit RSA mode");
    if (source.privateKey)
      validateOperationKey(source.privateKey, operation2, "sign");
    return { key: source.privateKey, operation: operation2, wire: source.signatureAlgorithm, signer: signer ?? source.signer };
  }
  const effective = "privateKeyJwk" in source ? getJwkSigningDefaults(source.privateKeyJwk, defaults) : defaults ?? defaultSignInfoDefaults;
  const key = "privateKey" in source ? source.privateKey : await importPrivateKey("privateKeyJwk" in source ? source.privateKeyJwk : source.privateKeyPem, ["sign"], effective);
  if (effective.rsa && (key.algorithm.name === "RSA-PSS" || key.algorithm.name === "RSASSA-PKCS1-v1_5") && effective.rsa !== key.algorithm.name)
    throw new Error("CryptoKey RSA mode conflicts with signing defaults");
  const wire = version === "draft" ? getDraftAlgoString(key.algorithm.name, effective.hash) : getRFC9421AlgoString(key.algorithm, effective.hash);
  const operation = validateSignatureOperation(version, wire, parseSignInfo(wire, key.algorithm));
  validateOperationKey(key, operation, "sign");
  return { key, operation, wire, signer: signer ?? webCryptoSigner };
}

// src/draft/verify.ts
var genSignInfoDraft = parseSignInfo;
async function verifyDraftSignature(parsed, keyOrOptions, errorLogger) {
  const options = isVerificationOptions(keyOrOptions) ? keyOrOptions : { keys: keyOrOptions, logger: errorLogger };
  if (parsed.algorithm) {
    try {
      validateSignatureAlgorithm("draft", parsed.algorithm);
    } catch (error) {
      options.logger?.(error);
      return false;
    }
  }
  let candidates;
  if (options.resolveKey) {
    const resolved = await options.resolveKey({ version: "draft", keyId: parsed.keyId, algorithm: parsed.algorithm?.toLowerCase() });
    candidates = resolved === void 0 ? [] : Array.isArray(resolved) ? [...resolved] : [resolved];
  } else if (options.keys instanceof Map)
    candidates = options.keys.has(parsed.keyId) ? [options.keys.get(parsed.keyId)] : [];
  else
    candidates = options.keys === void 0 ? options.verifier && parsed.algorithm ? [void 0] : [] : [options.keys];
  for (const candidate of candidates) {
    if (candidate === void 0 && (options.keys !== void 0 || options.resolveKey))
      continue;
    let context;
    try {
      const key = candidate === void 0 ? void 0 : (await parseAndImportPublicKey(candidate, ["verify"], parsed.algorithm)).publicKey;
      const algorithm = key ? parseSignInfo(parsed.algorithm, key.algorithm) : operationWithoutKey("draft", parsed.algorithm.toLowerCase());
      const signatureAlgorithm = parsed.algorithm?.toLowerCase() ?? getDraftAlgoString(key.algorithm.name, "hash" in algorithm ? algorithm.hash : null);
      validateSignatureOperation("draft", signatureAlgorithm, algorithm);
      if (key)
        validateOperationKey(key, algorithm, "verify");
      context = { version: "draft", keyId: parsed.keyId, key, algorithm, signatureAlgorithm, signature: import_rfc4648.base64.parse(parsed.params.signature), signingString: parsed.signingString };
    } catch (error) {
      options.logger?.(error);
      continue;
    }
    if (options.verifier)
      return await options.verifier(context) === true;
    try {
      if (await webCryptoVerifier(context))
        return true;
      options.logger?.("verification simply failed");
    } catch (error) {
      options.logger?.(error);
    }
  }
  return false;
}

// src/rfc9421/verify.ts
var import_rfc46482 = require("rfc4648");
var algorithmsDefault = ["ed25519", "rsa-pss-sha512", "ecdsa-p384-sha384", "ecdsa-p256-sha256", "hmac-sha256", "rsa-v1_5-sha256"];
async function verifyRFC9421Signature(parsedEntries, keysOrOptions, options, errorLogger) {
  const settings = isVerificationOptions(keysOrOptions) ? keysOrOptions : { ...options, keys: keysOrOptions, logger: errorLogger };
  const keys = settings.keys;
  const verifyAll = settings.verifyAll ?? false;
  const logger = settings.logger;
  if (parsedEntries.length === 0)
    throw new Error("parsedEntries is empty");
  if (verifyAll && !(keys instanceof Map) && !settings.resolveKey && !settings.verifier && parsedEntries.length > 1)
    throw new Error("If you want to verify multiple signatures, you need to use Map as the keys");
  const algorithms = settings.algorithms?.map((x) => x.toLowerCase()) ?? algorithmsDefault;
  if (algorithms.length === 0)
    throw new Error("algorithms is empty");
  const toVerify = parsedEntries.filter(([, parsed]) => !parsed.algorithm || algorithms.includes(parsed.algorithm.toLowerCase()));
  if (!toVerify.length) {
    logger?.("No matched signature found");
    return false;
  }
  if (!verifyAll)
    toVerify.sort(([, a], [, b]) => algorithms.indexOf(a.algorithm?.toLowerCase()) - algorithms.indexOf(b.algorithm?.toLowerCase()));
  for (const [label, parsed] of toVerify) {
    const wire = parsed.algorithm?.toLowerCase();
    if (wire) {
      try {
        validateSignatureAlgorithm("rfc9421", wire);
      } catch (error) {
        logger?.(error);
        if (verifyAll)
          return false;
        continue;
      }
    }
    let candidates;
    if (settings.resolveKey) {
      const resolved = await settings.resolveKey({ version: "rfc9421", label, keyId: parsed.keyid, algorithm: wire });
      candidates = resolved === void 0 ? [] : Array.isArray(resolved) ? [...resolved] : [resolved];
    } else if (keys instanceof Map) {
      candidates = keys.has(label) ? [keys.get(label)] : parsed.keyid !== void 0 ? keys.has(parsed.keyid) ? [keys.get(parsed.keyid)] : [] : wire ? [...keys.values()] : [];
    } else
      candidates = keys === void 0 ? settings.verifier && wire ? [void 0] : [] : [keys];
    let verified = false;
    for (const candidate of candidates) {
      if (candidate === void 0 && (keys !== void 0 || settings.resolveKey))
        continue;
      let key;
      let operation;
      let signature;
      let signatureAlgorithm;
      try {
        key = candidate === void 0 ? void 0 : (await parseAndImportPublicKey(candidate, ["verify"], wire)).publicKey;
        operation = key ? parseSignInfo(wire, key.algorithm) : operationWithoutKey("rfc9421", wire);
        signatureAlgorithm = wire ?? getRFC9421AlgoString(key.algorithm, "hash" in operation ? operation.hash : null);
        validateSignatureOperation("rfc9421", signatureAlgorithm, operation);
        if (key)
          validateOperationKey(key, operation, "verify");
        signature = import_rfc46482.base64.parse(parsed.signature);
      } catch (error) {
        logger?.(`Invalid candidate in ${label}: ${error}`);
        continue;
      }
      const context = { version: "rfc9421", label, keyId: parsed.keyid, key, algorithm: operation, signatureAlgorithm, signature, signingString: parsed.base };
      if (settings.verifier) {
        verified = await settings.verifier(context) === true;
        if (!verified)
          logger?.(`verification simply failed, label: ${label}`);
        break;
      }
      try {
        verified = await webCryptoVerifier(context);
      } catch (error) {
        logger?.(`Verification failed in ${label}: ${error}`);
      }
      if (!verified)
        logger?.(`verification simply failed, label: ${label}`);
      if (verified)
        break;
    }
    if (verifyAll && !verified)
      return false;
    if (!verifyAll && verified)
      return true;
  }
  return verifyAll;
}

// src/shared/verify.ts
var KeyHashValidationError = class extends Error {
  constructor(message) {
    super(message);
  }
};
function buildErrorMessage(providedAlgorithm, real) {
  return `Provided algorithm does not match the public key type: provided=${providedAlgorithm}, real=${real}`;
}
function parseSignInfo(algorithm, real, errorLogger) {
  if (typeof real !== "object" && typeof real !== "string") {
    console.error("invalid real:", algorithm, real);
    throw new KeyHashValidationError("invalid real");
  }
  algorithm = algorithm?.toLowerCase();
  const realKeyType = typeof real === "string" ? real : "algorithm" in real ? getPublicKeyAlgorithmNameFromOid(real.algorithm) : real.name;
  if (realKeyType === "RSA-PSS") {
    if (!algorithm || algorithm === "rsa-pss-sha512") {
      return { name: "RSA-PSS", hash: "SHA-512", saltLength: 64 };
    }
  }
  if (realKeyType === "RSASSA-PKCS1-v1_5") {
    if (!algorithm || algorithm === "hs2019" || // Draft
    algorithm === "rsa-sha256" || // Draft
    algorithm === "rsa-v1_5-sha256") {
      return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
    }
    if (algorithm === "rsa-pss-sha512") {
      return { name: "RSA-PSS", hash: "SHA-512", saltLength: 64 };
    }
    const [parsedName, hash] = algorithm.split("-");
    if (!hash || !(hash in keyHashAlgosForDraftDecoding)) {
      throw new KeyHashValidationError(`unsupported hash(RSASSA-PKCS1-v1_5): ${hash} / ${algorithm}`);
    }
    if (parsedName === "rsa") {
      return { name: "RSASSA-PKCS1-v1_5", hash: keyHashAlgosForDraftDecoding[hash] };
    }
    throw new KeyHashValidationError(buildErrorMessage(algorithm, realKeyType));
  }
  if (realKeyType === "EC" || realKeyType === "ECDSA") {
    const namedCurve = "parameter" in real ? getNistCurveFromOid(real.parameter) : real.namedCurve;
    if (!namedCurve)
      throw new KeyHashValidationError("could not get namedCurve");
    if (!algorithm || algorithm === "hs2019" || // Draft
    algorithm === "ecdsa-sha256") {
      return { name: "ECDSA", hash: "SHA-256", namedCurve };
    }
    if (algorithm === "ecdsa-p256-sha256") {
      if (namedCurve !== "P-256") {
        throw new KeyHashValidationError(`curve is not P-256: ${namedCurve}`);
      }
      return { name: "ECDSA", hash: "SHA-256", namedCurve };
    }
    if (algorithm === "ecdsa-p384-sha384") {
      if (namedCurve !== "P-384") {
        throw new KeyHashValidationError(`curve is not P-384: ${namedCurve}`);
      }
      return { name: "ECDSA", hash: "SHA-384", namedCurve };
    }
    const [dsaOrDH, hash] = algorithm.split("-");
    if (!hash || !(hash in keyHashAlgosForDraftDecoding)) {
      throw new KeyHashValidationError(`unsupported hash(EC): ${hash}`);
    }
    if (dsaOrDH === "ecdsa") {
      return { name: "ECDSA", hash: keyHashAlgosForDraftDecoding[hash], namedCurve };
    }
    if (dsaOrDH === "ecdh") {
      return { name: "ECDH", hash: keyHashAlgosForDraftDecoding[hash], namedCurve };
    }
    throw new KeyHashValidationError(buildErrorMessage(algorithm, realKeyType));
  }
  if (realKeyType === "Ed25519") {
    if (!algorithm || algorithm === "hs2019" || algorithm === "ed25519-sha512" || algorithm === "ed25519") {
      return { name: "Ed25519" };
    }
    throw new KeyHashValidationError(buildErrorMessage(algorithm, realKeyType));
  }
  if (realKeyType === "Ed448") {
    if (!algorithm || algorithm === "hs2019" || algorithm === "ed448") {
      return { name: "Ed448" };
    }
    throw new KeyHashValidationError(buildErrorMessage(algorithm, realKeyType));
  }
  throw new KeyHashValidationError(`unsupported keyAlgorithm: ${realKeyType} (provided: ${algorithm})`);
}
function verifyParsedSignature(parsed, keysOrOptions, errorLogger) {
  if (isVerificationOptions(keysOrOptions)) {
    if (parsed.version === "draft")
      return verifyDraftSignature(parsed.value, keysOrOptions);
    if (parsed.version === "rfc9421")
      return verifyRFC9421Signature(parsed.value, { ...keysOrOptions, verifyAll: false });
  } else {
    if (parsed.version === "draft") {
      let key = keysOrOptions;
      if (key instanceof Map) {
        const selected = key.get(parsed.value.keyId);
        if (!selected)
          throw new Error(`key not found: ${parsed.value.keyId}`);
        key = selected;
      }
      return verifyDraftSignature(parsed.value, key, errorLogger);
    }
    if (parsed.version === "rfc9421")
      return verifyRFC9421Signature(parsed.value, keysOrOptions, void 0, errorLogger);
  }
  throw new Error("unsupported parsed signature");
}

// src/pem/jwk.ts
var jwkAlgorithms = {
  RS256: "rsa-sha256",
  RS384: "rsa-sha384",
  RS512: "rsa-sha512",
  PS512: "rsa-pss-sha512",
  ES256: "ecdsa-p256-sha256",
  ES384: "ecdsa-p384-sha384",
  ES512: "ecdsa-sha512"
};
var privateMembers = ["d", "p", "q", "dp", "dq", "qi", "oth", "k"];
function operationForJwk(jwk, wire, defaults = defaultSignInfoDefaults) {
  let real;
  if (jwk.kty === "RSA")
    real = { name: "RSASSA-PKCS1-v1_5" };
  else if (jwk.kty === "EC" && ["P-256", "P-384", "P-521"].includes(jwk.crv ?? ""))
    real = { name: "ECDSA", namedCurve: jwk.crv };
  else if (jwk.kty === "OKP" && ["Ed25519", "Ed448"].includes(jwk.crv ?? ""))
    real = { name: jwk.crv };
  else
    throw new Error("Unsupported signature JWK key type or curve");
  let declared;
  if (jwk.alg !== void 0) {
    declared = jwk.alg === "EdDSA" && jwk.kty === "OKP" ? jwk.crv.toLowerCase() : jwkAlgorithms[jwk.alg];
    if (!declared)
      throw new Error("Unsupported JWK alg");
    if (jwk.alg === "ES512" && jwk.crv !== "P-521")
      throw new Error("ES512 requires P-521");
  }
  const fallback = real.name === "RSASSA-PKCS1-v1_5" ? defaults.rsa === "RSA-PSS" ? "rsa-pss-sha512" : `rsa-${defaults.hash?.replace("-", "").toLowerCase()}` : real.name === "ECDSA" ? `ecdsa-${defaults.hash?.replace("-", "").toLowerCase()}` : real.name.toLowerCase();
  const operation = parseSignInfo(wire ?? declared ?? fallback, real);
  if (declared && JSON.stringify(parseSignInfo(declared, real)) !== JSON.stringify(operation))
    throw new Error("JWK alg conflicts with requested signature algorithm");
  return operation;
}
async function importSignatureJwk(jwk, privateKey, keyUsages, defaults = defaultSignInfoDefaults, extractable = false, providedAlgorithm) {
  if (!jwk || typeof jwk !== "object" || Array.isArray(jwk))
    throw new Error("Invalid JWK");
  if (jwk.use !== void 0 && jwk.use !== "sig")
    throw new Error("JWK use must be sig");
  if (jwk.ext !== void 0 && typeof jwk.ext !== "boolean")
    throw new Error("Invalid JWK ext");
  if (extractable && jwk.ext === false)
    throw new Error("Nonextractable JWK");
  const expectedUsage = privateKey ? "sign" : "verify";
  if (!keyUsages.length || keyUsages.some((usage) => usage !== expectedUsage))
    throw new Error("Invalid signature key usage");
  if (jwk.key_ops !== void 0 && (!Array.isArray(jwk.key_ops) || new Set(jwk.key_ops).size !== jwk.key_ops.length || jwk.key_ops.some((usage) => usage !== expectedUsage) || !jwk.key_ops.includes(expectedUsage)))
    throw new Error("JWK key_ops conflicts with requested usage");
  if (!privateKey && privateMembers.some((member) => member in jwk))
    throw new Error("Private or secret material in public JWK");
  if (privateKey && (typeof jwk.d !== "string" || !jwk.d))
    throw new Error("Missing JWK private key material");
  const operation = operationForJwk(jwk, providedAlgorithm, defaults);
  const key = await (await getWebcrypto()).subtle.importKey("jwk", jwk, operation, extractable, keyUsages);
  return { key, algorithm: genAlgorithmForSignAndVerify(key.algorithm, "hash" in operation ? operation.hash : null) };
}
async function importPublicJwk(jwk, keyUsages = ["verify"], defaults = defaultSignInfoDefaults, extractable = false) {
  return (await importSignatureJwk(jwk, false, keyUsages, defaults, extractable)).key;
}
async function importPrivateJwk(jwk, keyUsages = ["sign"], defaults = defaultSignInfoDefaults, extractable = false) {
  return (await importSignatureJwk(jwk, true, keyUsages, defaults, extractable)).key;
}
function getJwkSigningDefaults(jwk, defaults) {
  const operation = operationForJwk(jwk, void 0, defaults ?? defaultSignInfoDefaults);
  if (jwk.alg !== void 0 && defaults) {
    if ("hash" in operation && defaults.hash !== operation.hash)
      throw new Error("Signing defaults conflict with JWK alg hash");
    if (operation.name === "ECDSA" && defaults.ec !== "DSA")
      throw new Error("Signing defaults conflict with JWK signature usage");
    if ((operation.name === "RSA-PSS" || operation.name === "RSASSA-PKCS1-v1_5") && defaults.rsa && defaults.rsa !== operation.name)
      throw new Error("Signing defaults conflict with JWK RSA mode");
  }
  return {
    ...defaults ?? defaultSignInfoDefaults,
    hash: "hash" in operation ? operation.hash : defaults?.hash ?? defaultSignInfoDefaults.hash,
    ...operation.name === "RSA-PSS" ? { rsa: "RSA-PSS" } : {}
  };
}

// src/pem/spki.ts
var import_asn1js3 = require("@lapo/asn1js");
var import_hex = require("@lapo/asn1js/hex.js");
var import_base64 = require("@lapo/asn1js/base64.js");
var SpkiParseError = class extends Error {
  constructor(message) {
    super(message);
  }
};
function getPublicKeyAlgorithmNameFromOid(oidStr) {
  const oid = oidStr.split("\n")[0].trim();
  if (oid === "1.2.840.113549.1.1.1")
    return "RSASSA-PKCS1-v1_5";
  if (oid === "1.2.840.113549.1.1.10")
    return "RSA-PSS";
  if (oid === "1.2.840.10040.4.1")
    return "DSA";
  if (oid === "1.2.840.10046.2.1")
    return "DH";
  if (oid === "2.16.840.1.101.2.1.1.22")
    return "KEA";
  if (oid === "1.2.840.10045.2.1")
    return "EC";
  if (oid === "1.3.101.112")
    return "Ed25519";
  if (oid === "1.3.101.113")
    return "Ed448";
  throw new SpkiParseError("Unknown Public Key Algorithm OID");
}
function getNistCurveFromOid(oidStr) {
  const oid = oidStr.split("\n")[0].trim();
  if (oid === "1.2.840.10045.3.1.1")
    return "P-192";
  if (oid === "1.3.132.0.33")
    return "P-224";
  if (oid === "1.2.840.10045.3.1.7")
    return "P-256";
  if (oid === "1.3.132.0.34")
    return "P-384";
  if (oid === "1.3.132.0.35")
    return "P-521";
  throw new SpkiParseError("Unknown Named Curve OID");
}
function asn1ToArrayBuffer(asn1, contentOnly = false) {
  const fullEnc = asn1.stream.enc;
  const start = contentOnly ? asn1.posContent() : asn1.posStart();
  const end = asn1.posEnd();
  if (typeof fullEnc === "string") {
    return Uint8Array.from(fullEnc.slice(start, end), (s) => s.charCodeAt(0)).buffer;
  } else if (fullEnc instanceof Uint8Array) {
    return new Uint8Array(fullEnc.subarray(start, end)).buffer;
  }
  if (fullEnc instanceof ArrayBuffer) {
    return new Uint8Array(fullEnc.slice(start, end)).buffer;
  } else if (Array.isArray(fullEnc)) {
    return new Uint8Array(fullEnc.slice(start, end)).buffer;
  }
  throw new SpkiParseError("Invalid SPKI (invalid ASN1 Stream data)");
}
var reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
function decodePem(input) {
  const der = typeof input === "string" ? reHex.test(input) ? import_hex.Hex.decode(input) : import_base64.Base64.unarmor(input) : input;
  return der;
}
function parseAlgorithmIdentifier(input) {
  const algorithmIdentifierSub = input.sub;
  if (!algorithmIdentifierSub)
    throw new SpkiParseError("Invalid AlgorithmIdentifier");
  if (algorithmIdentifierSub.length === 0)
    throw new SpkiParseError("Invalid AlgorithmIdentifier (sub length, zero)");
  if (algorithmIdentifierSub.length > 2)
    throw new SpkiParseError("Invalid AlgorithmIdentifier (sub length, too many)");
  if (algorithmIdentifierSub[0].tag.tagNumber !== 6)
    throw new SpkiParseError("Invalid AlgorithmIdentifier (.sub[0] type)");
  const algorithm = algorithmIdentifierSub[0]?.content() ?? null;
  if (typeof algorithm !== "string")
    throw new SpkiParseError("Invalid AlgorithmIdentifier (invalid content)");
  const parameter = algorithmIdentifierSub[1]?.content() ?? null;
  return {
    algorithm,
    parameter
  };
}
function parseSpki(input) {
  const parsed = import_asn1js3.ASN1.decode(decodePem(input));
  if (!parsed.sub || parsed.sub.length === 0 || parsed.sub.length > 2)
    throw new SpkiParseError("Invalid SPKI (invalid sub)");
  const identifier = parseAlgorithmIdentifier(parsed.sub[0]);
  const der = asn1ToArrayBuffer(parsed);
  if (identifier.algorithm.split("\n")[0] === "1.2.840.113549.1.1.10" && parsed.posEnd() !== parsed.stream.enc.length)
    throw new SpkiParseError("Trailing PSS key data");
  return {
    der: identifier.algorithm.split("\n")[0] === "1.2.840.113549.1.1.10" ? normalizePssContainer(new Uint8Array(der), 0) : der,
    ...identifier
  };
}
function parsePublicKey(input) {
  if (typeof input === "string" && input.startsWith("z"))
    return parseSpki(decodePublicMultikey(input));
  try {
    return parseSpki(input);
  } catch (e) {
    try {
      const { pkcs1 } = parsePkcs1(input);
      const spki = genSpkiFromPkcs1(new Uint8Array(pkcs1));
      return parseSpki(spki);
    } catch (e2) {
      throw new SpkiParseError("Invalid SPKI or PKCS#1");
    }
  }
}
async function importPublicKey(key, keyUsages = ["verify"], defaults = defaultSignInfoDefaults, extractable = false) {
  if (typeof key === "object" && "kty" in key)
    return importPublicJwk(key, keyUsages, defaults, extractable);
  const parsedPublicKey = parsePublicKey(key);
  return await (await getWebcrypto()).subtle.importKey("spki", parsedPublicKey.der, genSignInfo(parsedPublicKey, defaults), extractable, keyUsages);
}
async function parseAndImportPublicKey(source, keyUsages = ["verify"], providedAlgorithm, errorLogger) {
  if (typeof source === "object" && "kty" in source) {
    const { key, algorithm } = await importSignatureJwk(source, false, keyUsages, defaultSignInfoDefaults, false, providedAlgorithm);
    return { publicKey: key, algorithm };
  }
  source = source;
  if (typeof source === "string" || typeof source === "object" && !("type" in source) && (source instanceof Uint8Array || source instanceof ArrayBuffer || Array.isArray(source) || "enc" in source)) {
    const keyAlgorithmIdentifier = parsePublicKey(source);
    const signInfo2 = parseSignInfo(providedAlgorithm, keyAlgorithmIdentifier, errorLogger);
    const publicKey = await (await getWebcrypto()).subtle.importKey("spki", keyAlgorithmIdentifier.der, signInfo2, false, keyUsages);
    return {
      publicKey,
      algorithm: genAlgorithmForSignAndVerify(publicKey.algorithm, "hash" in signInfo2 ? signInfo2.hash : null)
    };
  }
  const signInfo = parseSignInfo(providedAlgorithm, source.algorithm, errorLogger);
  if (signInfo.name !== source.algorithm.name) {
    throw new KeyHashValidationError("Provided algorithm does not match the imported CryptoKey");
  }
  if ("hash" in signInfo && "hash" in source.algorithm && source.algorithm.hash.name !== signInfo.hash) {
    throw new KeyHashValidationError("Provided hash does not match the imported CryptoKey");
  }
  return {
    publicKey: source,
    algorithm: genAlgorithmForSignAndVerify(source.algorithm, "hash" in signInfo ? signInfo.hash : null)
  };
}

// src/utils.ts
var import_rfc46483 = require("rfc4648");
async function getWebcrypto() {
  return globalThis.crypto ?? (await import("node:crypto")).webcrypto;
}
var obsoleteLineFoldingRegEx = /[^\S\r\n]*\r?\n[^\S\r\n]+/g;
function removeObsoleteLineFolding(str) {
  return str.replaceAll(obsoleteLineFoldingRegEx, " ");
}
function canonicalizeHeaderValue(value) {
  if (typeof value === "number")
    return value.toString();
  if (!value)
    return "";
  if (typeof value === "string")
    return removeObsoleteLineFolding(value).trim();
  if (Array.isArray(value)) {
    return value.map((v) => {
      if (v == null)
        return "";
      if (typeof v === "number")
        return v.toString();
      if (typeof v === "string")
        return removeObsoleteLineFolding(v).trim();
      throw new Error(`Invalid header value type ${v}`);
    }).join(", ");
  }
  throw new Error(`Invalid header value type ${value}`);
}
function lcObjectKey(src) {
  return Object.entries(src).reduce((dst, [key, value]) => {
    if (key === "__proto__")
      return dst;
    dst[key.toLowerCase()] = value;
    return dst;
  }, {});
}
function getHeaderValue(src, key) {
  key = key.toLowerCase();
  for (const [k, v] of Object.entries(src)) {
    if (k.toLowerCase() === key) {
      return canonicalizeHeaderValue(v);
    }
  }
  return void 0;
}
function getValueByLc(src, key) {
  key = key.toLowerCase();
  for (const [k, v] of Object.entries(src)) {
    if (k.toLowerCase() === key) {
      return v;
    }
  }
  return void 0;
}
function toStringOrToLc(src) {
  if (typeof src === "number")
    return src.toString();
  if (typeof src === "string")
    return src.toLowerCase();
  return "";
}
function correctHeadersFromFlatArray(src) {
  return src.reduce((dst, prop, i) => {
    if (i % 2 === 0) {
      if (typeof prop !== "string") {
        throw new Error(`Invalid header key type '${typeof prop}' of ${prop}`);
      }
      if (prop.toLowerCase() in dst)
        return dst;
      dst[prop.toLowerCase()] = [];
    } else {
      dst[toStringOrToLc(src[i - 1])].push(prop == null ? "" : prop.toString());
    }
    return dst;
  }, {});
}
function collectHeaders(source) {
  if ("rawHeaders" in source && source.rawHeaders) {
    return correctHeadersFromFlatArray(source.rawHeaders.flat(1));
  } else if ("getHeaders" in source && typeof source.getHeaders === "function") {
    return lcObjectKey(source.getHeaders());
  } else if ("headers" in source && source.headers) {
    if (typeof source.headers !== "object") {
      throw new Error("headers must be an object");
    }
    if (isBrowserHeader(source.headers)) {
      return correctHeadersFromFlatArray(Array.from(source.headers.entries()).flat(1));
    } else if (Array.isArray(source.headers)) {
      return correctHeadersFromFlatArray(source.headers.flat(1));
    } else {
      return lcObjectKey(source.headers);
    }
  }
  throw new Error("Cannot get headers from request object");
}
function setHeaderToRequestOrResponse(reqres, key, value) {
  if ("setHeader" in reqres && typeof reqres.setHeader === "function") {
    reqres.setHeader(key, value.toString());
  } else if ("headers" in reqres && typeof reqres.headers === "object") {
    if (isBrowserHeader(reqres.headers)) {
      reqres.headers.set(key, value.toString());
    } else {
      reqres.headers[key] = value.toString();
    }
  } else {
    throw new Error("Cannot set headers to request object");
  }
}
function isBrowserResponse(input) {
  return "Response" in globalThis && typeof input === "object" && input instanceof Response;
}
function isBrowserRequest(input) {
  return "Request" in globalThis && typeof input === "object" && input instanceof Request;
}
function isBrowserHeader(input) {
  return "Headers" in globalThis && typeof input === "object" && input instanceof Headers;
}
function numberToUint8Array(num) {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setBigUint64(0, BigInt(num), false);
  const viewUint8Array = new Uint8Array(buf);
  const firstNonZero = viewUint8Array.findIndex((v) => v !== 0);
  return viewUint8Array.slice(firstNonZero);
}
function genASN1Length(length) {
  if (length < 0x80n) {
    return new Uint8Array([Number(length)]);
  }
  const lengthUint8Array = numberToUint8Array(length);
  return new Uint8Array([128 + lengthUint8Array.length, ...lengthUint8Array]);
}
function encodeArrayBufferToBase64(buffer) {
  const uint8Array = new Uint8Array(buffer);
  return import_rfc46483.base64.stringify(uint8Array);
}
function compareUint8Array(a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i])
      return false;
  }
  return true;
}
var KeyValidationError = class extends Error {
  constructor(message) {
    super(message);
  }
};
var defaultSignInfoDefaults = {
  hash: "SHA-256",
  ec: "DSA"
};
function genSignInfo(parsed, defaults = defaultSignInfoDefaults) {
  const algorithm = getPublicKeyAlgorithmNameFromOid(parsed.algorithm);
  if (!algorithm)
    throw new KeyValidationError("Unknown algorithm");
  if (algorithm === "RSA-PSS" || algorithm === "RSASSA-PKCS1-v1_5" && defaults.rsa === "RSA-PSS") {
    if (defaults.hash !== "SHA-512")
      throw new KeyValidationError("RFC 9421 RSA-PSS requires SHA-512");
    return { name: "RSA-PSS", hash: "SHA-512", saltLength: 64 };
  }
  if (algorithm === "RSASSA-PKCS1-v1_5") {
    return {
      name: "RSASSA-PKCS1-v1_5",
      hash: defaults.hash ?? "SHA-256"
    };
  }
  if (algorithm === "EC") {
    if (typeof parsed.parameter !== "string")
      throw new KeyValidationError("Invalid EC parameter");
    return {
      name: `EC${defaults.ec}`,
      hash: defaults.hash ?? "SHA-256",
      namedCurve: getNistCurveFromOid(parsed.parameter)
    };
  }
  if (algorithm === "Ed25519") {
    return { name: "Ed25519" };
  }
  if (algorithm === "Ed448") {
    return { name: "Ed448" };
  }
  throw new KeyValidationError("Unknown algorithm");
}
function genAlgorithmForSignAndVerify(keyAlgorithm, hashAlgorithm) {
  if (keyAlgorithm.name === "RSA-PSS") {
    if (hashAlgorithm !== "SHA-512" || keyAlgorithm.hash?.name !== "SHA-512")
      throw new KeyValidationError("RFC 9421 RSA-PSS requires SHA-512");
    return { name: "RSA-PSS", hash: "SHA-512", saltLength: 64 };
  }
  return { hash: hashAlgorithm, ...keyAlgorithm };
}
function splitPer64Chars(str) {
  const result = [];
  for (let i = 0; i < str.length; i += 64) {
    result.push(str.slice(i, i + 64));
  }
  return result;
}
function getMap(obj) {
  if (obj instanceof Map)
    return new Map(obj);
  if (Array.isArray(obj))
    return new Map(obj);
  return new Map(Object.entries(obj));
}
function getMapWithoutUndefined(obj) {
  const map = getMap(obj);
  for (const [k, v] of map.entries()) {
    if (v === void 0) {
      map.delete(k);
    }
  }
  return map;
}

// src/rfc9421/base.ts
var sh2 = __toESM(require_dist(), 1);

// src/rfc9421/sfv.ts
var knownSfvHeaderTypeDictionary = {
  /**
   * RFC 9421 HTTP Message Signatures
   * https://datatracker.ietf.org/doc/html/rfc9421#name-initial-contents-3
   */
  // https://datatracker.ietf.org/doc/html/rfc9421#signature-header
  "signature": "dict",
  // https://datatracker.ietf.org/doc/html/rfc9421#signature-input-header
  "signature-input": "dict",
  // https://datatracker.ietf.org/doc/html/rfc9421#accept-signature-header
  "accept-signature": "dict",
  /**
   * RFC 9530 Digest Fields
   * https://datatracker.ietf.org/doc/html/rfc9530#name-http-field-name-registratio
   */
  // https://datatracker.ietf.org/doc/html/rfc9530#name-the-content-digest-field
  "content-digest": "dict",
  // https://datatracker.ietf.org/doc/html/rfc9530#name-the-repr-digest-field
  "repr-digest": "dict",
  // https://datatracker.ietf.org/doc/html/rfc9530#name-integrity-preference-fields
  "want-content-digest": "dict",
  // https://datatracker.ietf.org/doc/html/rfc9530#want-fields
  "want-repr-digest": "dict",
  // https://datatracker.ietf.org/doc/html/rfc8942#name-the-accept-ch-response-head
  "accept-ch": "list",
  // https://datatracker.ietf.org/doc/html/rfc9209#name-the-proxy-status-http-field
  "proxy-status": "list",
  // https://datatracker.ietf.org/doc/html/rfc9211#name-the-cache-status-http-respo
  "cache-status": "list",
  // https://datatracker.ietf.org/doc/html/rfc9218#name-priority-parameters
  "priority": "dict",
  // https://datatracker.ietf.org/doc/html/rfc9440#name-client-cert-http-header-fie
  "client-cert": "bs",
  // https://datatracker.ietf.org/doc/html/rfc9440#name-client-cert-chain-http-head
  "client-cert-chain": "list"
};

// src/rfc9421/base.ts
var requestTargetDerivedComponents = [
  "@method",
  "@authority",
  "@scheme",
  "@target-uri",
  "@request-target",
  "@path",
  "@query"
];
var responseTargetDerivedComponents = [
  "@status"
];
var RFC9421SignatureBaseFactory = class {
  isRequest() {
    return this.response === null;
  }
  isResponse() {
    return this.response !== null;
  }
  /**
   *
   * @param source request or response, must include 'signature-input' header
   *	If source is node response, it must include 'req' property.
   * @param scheme optional, used when source request url starts with '/'
   * @param additionalSfvTypeDictionary additional SFV type dictionary
   * @param request optional, used when source is a browser Response
   * @param requiredComponents
   *   Required components for the signature base. If provided, generate method will throw an error if the label lacks any of the components.
   *   e.g. `['@method', '@authority', '@path', '@query', '"@query-param";name="foo"', 'content-digest', 'accept']`
   */
  constructor(source, scheme = "https", additionalSfvTypeDictionary = {}, request, requiredComponents = null) {
    if (requiredComponents && !Array.isArray(requiredComponents)) {
      throw new Error("requiredComponents must be an array");
    } else if (requiredComponents && requiredComponents.length > 0) {
      this.requiredComponents = requiredComponents.map((component) => {
        let item;
        if (component.startsWith('"')) {
          item = sh2.parseItem(component);
        } else {
          item = [component, /* @__PURE__ */ new Map()];
        }
        return sh2.serializeItem(item);
      });
    } else {
      this.requiredComponents = null;
    }
    this.sfvTypeDictionary = lcObjectKey({ ...knownSfvHeaderTypeDictionary, ...additionalSfvTypeDictionary });
    if ("req" in source) {
      this.response = source;
      this.responseHeaders = collectHeaders(source);
      this.request = source.req;
      this.requestHeaders = collectHeaders(this.request);
    } else if (isBrowserResponse(source)) {
      if (!request)
        throw new Error("Request is not provided");
      this.response = source;
      this.responseHeaders = collectHeaders(source);
      this.request = request;
      this.requestHeaders = collectHeaders(this.request);
    } else {
      this.response = null;
      this.responseHeaders = null;
      this.request = source;
      this.requestHeaders = collectHeaders(source);
    }
    if (!this.request.url) {
      throw new Error("Request URL is empty");
    }
    if (!this.request.method) {
      throw new Error("Request method is empty");
    }
    if (!("signature-input" in this.requestHeaders))
      throw new Error("Signature-Input header is not found in request");
    this.requestSignatureInput = sh2.parseDictionary(canonicalizeHeaderValue(this.requestHeaders["signature-input"]));
    if (this.isResponse()) {
      if (!this.responseHeaders)
        throw new Error("responseHeaders is empty");
      if (!("signature-input" in this.responseHeaders))
        throw new Error("Signature-Input header is not found in response");
      this.responseSignatureInput = sh2.parseDictionary(canonicalizeHeaderValue(this.responseHeaders["signature-input"]));
    }
    this.sfvTypeDictionary = lcObjectKey(additionalSfvTypeDictionary);
    this.scheme = this.request.url.startsWith("/") ? scheme : new URL(this.request.url).protocol.replace(":", "");
    const rawHost = "httpVersionMajor" in this.request && this.request.httpVersionMajor === 2 ? this.requestHeaders[":authority"] : this.requestHeaders["host"];
    if (!isBrowserRequest(this.request) && !rawHost)
      throw new Error("Host header is empty");
    const host = canonicalizeHeaderValue(rawHost);
    this.targetUri = this.request.url.startsWith("/") ? new URL(this.request.url, `${scheme}://${host}`).href : this.request.url;
    this.url = new URL(this.targetUri);
  }
  get(name, paramsLike = /* @__PURE__ */ new Map()) {
    const params = getMap(paramsLike);
    const componentIdentifier = sh2.serializeItem([name, params]);
    if (!name) {
      throw new Error(`Type is empty: ${componentIdentifier}`);
    }
    if (name.startsWith('"')) {
      if (name.endsWith('"')) {
        name = name.slice(1, -1);
      } else {
        throw new Error(`Invalid component type string: ${componentIdentifier}`);
      }
    }
    if (this.isResponse() && params.get("req") !== true && requestTargetDerivedComponents.includes(name)) {
      throw new Error(`component is not available in response (must use with ;req, or provided object is unintentionally treated as response (existing req prop.)): ${name}`);
    }
    if (this.isRequest() && responseTargetDerivedComponents.includes(name)) {
      throw new Error(`component is not available in request (provided object is unintentionally treated as request (including req prop.)): ${name}`);
    }
    if (this.isRequest() && params.get("req") === true) {
      throw new Error("req param is not available in request (provided object is treated as request, please set req param with Request)");
    }
    const isReq = this.isRequest() || params.get("req") === true;
    if (name === "@signature-params") {
      throw new Error(`@signature-params is not available in get method: ${componentIdentifier}`);
    } else if (name === "@method") {
      if (!this.request.method) {
        throw new Error("Request method is empty");
      }
      return this.request.method.toUpperCase();
    } else if (name === "@authority") {
      return this.url.host;
    } else if (name === "@scheme") {
      return this.scheme.toLocaleLowerCase();
    } else if (name === "@target-uri") {
      return this.targetUri;
    } else if (name === "@request-target") {
      if (!this.request.method) {
        throw new Error("Request method is empty");
      }
      return `${this.request.method.toLowerCase()} ${this.url.pathname}`;
    } else if (name === "@path") {
      return this.url.pathname;
    } else if (name === "@query") {
      return this.url.search;
    } else if (name === "@query-param") {
      const key = params.get("name");
      if (key === void 0) {
        throw new Error("Query parameter name not found or invalid");
      }
      const value = this.url.searchParams.get(key.toString());
      if (value === null) {
        throw new Error(`Query parameter not found: ${key} (${componentIdentifier})`);
      }
      return value;
    } else if (name === "@status") {
      if (!this.response)
        throw new Error("response is empty (@status)");
      if (isBrowserResponse(this.response)) {
        return this.response.status.toString();
      } else {
        return this.response.statusCode.toString();
      }
    } else if (name.startsWith("@")) {
      throw new Error(`Unknown derived component: ${name}`);
    } else {
      const key = params.get("key");
      const isSf = params.get("sf") === true;
      const isBs = params.get("bs") === true;
      const isTr = params.get("tr") === true;
      if ([key, isSf, isBs].filter((x) => x).length > 1) {
        throw new Error(`Invalid component: ${componentIdentifier} (multiple params are specified)`);
      }
      const rawValue = (() => {
        if (isReq) {
          if (isTr) {
            if ("trailers" in this.request && this.request.trailers) {
              return getValueByLc(this.request.trailers, name);
            }
            throw new Error(`Trailers not found in request object (${componentIdentifier})`);
          } else {
            return this.requestHeaders[name];
          }
        } else {
          if (!this.response || !this.responseHeaders)
            throw new Error("response is not provided");
          if (isTr) {
            if ("trailers" in this.response && this.response.trailers) {
              return getValueByLc(this.response.trailers, name);
            }
            throw new Error(`Trailers not found in response object (${componentIdentifier})`);
          } else {
            return this.responseHeaders[name];
          }
        }
      })();
      if (rawValue === void 0) {
        throw new Error(`Header not found: ${componentIdentifier}`);
      }
      if (isSf) {
        if (!(name in this.sfvTypeDictionary)) {
          throw new Error(`Type not found in SFV type dictionary: ${name}`);
        }
        const canonicalized = canonicalizeHeaderValue(rawValue);
        if (this.sfvTypeDictionary[name] === "dict") {
          return sh2.serializeDictionary(sh2.parseDictionary(canonicalized));
        } else if (this.sfvTypeDictionary[name] === "list") {
          return sh2.serializeList(sh2.parseList(canonicalized));
        } else if (["item", "bs", "int", "dec", "str", "bool", "token"].includes(this.sfvTypeDictionary[name])) {
          return sh2.serializeItem(sh2.parseItem(canonicalized));
        }
      }
      if (key) {
        if (!(name in this.sfvTypeDictionary)) {
          throw new Error(`key specified but type unknown (Type not found in SFV type dictionary): ${componentIdentifier}`);
        }
        if (typeof rawValue !== "string") {
          throw new Error(`Key specified but value is not a string: ${componentIdentifier}`);
        }
        if (this.sfvTypeDictionary[name] === "dict") {
          const dictionary = sh2.parseDictionary(rawValue);
          const value = dictionary.get(key);
          if (value === void 0) {
            throw new Error(`Key not found in dictionary: ${key} (${componentIdentifier})`);
          }
          if (Array.isArray(value[0])) {
            return sh2.serializeList([value]);
          } else {
            return sh2.serializeItem(value);
          }
        } else {
          throw new Error(`"${name}" is not dict: ${this.sfvTypeDictionary[name]} (${componentIdentifier})`);
        }
      }
      if (isBs) {
        const sequences = (Array.isArray(rawValue) ? rawValue : [rawValue]).map((x) => {
          if (typeof x !== "string") {
            throw new Error(`Invalid header value type: ${typeof x}`);
          }
          return [
            new sh2.ByteSequence(
              encodeArrayBufferToBase64(
                textEncoder.encode(canonicalizeHeaderValue(x)).buffer
              )
            ),
            /* @__PURE__ */ new Map()
          ];
        });
        return sh2.serializeList(sequences);
      }
      return canonicalizeHeaderValue(rawValue);
    }
  }
  /**
   * Generate signature base for the label
   * If `requiredComponents` is set by the constructor, this method will throw an error if the label lacks any of the components.
   * @param label label of the signature input
   * @returns signature base
   */
  generate(label) {
    const item = this.isRequest() ? this.requestSignatureInput?.get(label) : this.responseSignatureInput?.get(label);
    if (!item) {
      throw new Error(`label not found: ${label}`);
    }
    if (!Array.isArray(item[0])) {
      throw new Error(`item is not InnerList: ${sh2.serializeDictionary(/* @__PURE__ */ new Map([[label, item]]))}`);
    }
    const results = /* @__PURE__ */ new Map();
    for (const component of item[0]) {
      let name = component[0];
      if (name.startsWith('"')) {
        if (name.endsWith('"')) {
          name = name.slice(1, -1);
        } else {
          throw new Error(`Invalid component identifier name: ${name}`);
        }
      }
      component[0] = name;
      const componentIdentifier = sh2.serializeItem(component);
      if (results.has(componentIdentifier)) {
        throw new Error(`Duplicate key: ${name}`);
      }
      results.set(componentIdentifier, this.get(name, component[1]));
    }
    if (this.requiredComponents) {
      for (const component of this.requiredComponents) {
        if (!results.has(component)) {
          throw new Error(`Required component not found: ${component}`);
        }
      }
    }
    results.set('"@signature-params"', sh2.serializeInnerList(item));
    return Array.from(results.entries(), ([key, value]) => `${key}: ${value}`).join("\n");
  }
};
function convertSignatureParamsDictionary(input) {
  const map = getMap(input);
  const output = /* @__PURE__ */ new Map();
  for (const [label, item] of map) {
    if (!Array.isArray(item))
      throw new Error("item is not array");
    const [components, params] = item;
    output.set(
      label,
      [
        components.map(
          (identifier) => typeof identifier === "string" ? [identifier, /* @__PURE__ */ new Map()] : [identifier[0], getMapWithoutUndefined(identifier[1])]
        ),
        getMapWithoutUndefined(params)
      ]
    );
  }
  return sh2.serializeDictionary(output);
}

// src/rfc9421/parse.ts
var sh3 = __toESM(require_dist(), 1);
var RFC9421SignatureParams = ["created", "expires", "nonce", "alg", "keyid", "tag"];
function validateRFC9421SignatureInputParameters(input, options) {
  const labels = input.entries();
  for (const [, value] of labels) {
    const params = value[1];
    if (params.has("alg") && typeof params.get("alg") !== "string")
      throw new SignatureParamsContentLackedError("alg");
    if (params.has("nonce") && typeof params.get("nonce") !== "string")
      throw new SignatureParamsContentLackedError("nonce");
    if (params.has("tag") && typeof params.get("tag") !== "string")
      throw new SignatureParamsContentLackedError("tag");
    if (params.has("created")) {
      const createdSec = params.get("created");
      if (typeof createdSec !== "number")
        throw new SignatureParamsClockInvalidError("created");
      const nowTime = (options?.clockSkew?.now || /* @__PURE__ */ new Date()).getTime();
      if (createdSec * 1e3 > nowTime + (options?.clockSkew?.forward ?? 2e3)) {
        throw new SignatureParamsClockInvalidError("created");
      }
    }
    if (params.has("expires")) {
      const expiresSec = params.get("expires");
      if (typeof expiresSec !== "number")
        throw new SignatureParamsClockInvalidError("expires");
      const nowTime = (options?.clockSkew?.now || /* @__PURE__ */ new Date()).getTime();
      if (expiresSec * 1e3 < nowTime - (options?.clockSkew?.forward ?? 2e3)) {
        throw new SignatureParamsClockInvalidError("expires");
      }
    }
  }
  return true;
}
function parseSingleRFC9421Signature(label, factory, params, signature) {
  const base = factory.generate(label);
  if (!params)
    throw new SignatureInputLackedError(`label not found: ${label}`);
  const bareKeyid = params[1].get("keyid");
  return {
    keyid: bareKeyid ? typeof bareKeyid === "string" ? bareKeyid : sh3.serializeBareItem(bareKeyid) : void 0,
    base,
    signature: signature.toBase64(),
    params: sh3.serializeInnerList(params),
    algorithm: params[1].get("alg"),
    created: params[1].get("created"),
    expires: params[1].get("expires"),
    nonce: params[1].get("nonce"),
    tag: params[1].get("tag")
  };
}
function parseRFC9421RequestOrResponse(request, options, validated, errorLogger) {
  if (!validated)
    validated = validateRequestAndGetSignatureHeader(request, options?.clockSkew);
  if (validated.signatureInput == null)
    throw new SignatureInputLackedError("signatureInput");
  const signatureDictionary = sh3.parseDictionary(validated.signatureHeader);
  const signatureInput = sh3.parseDictionary(validated.signatureInput);
  const inputIsValid = validateRFC9421SignatureInputParameters(signatureInput, options);
  if (!inputIsValid)
    throw new Error("signatureInput");
  const factory = new RFC9421SignatureBaseFactory(
    request,
    void 0,
    options?.additionalSfvTypeDictionary,
    void 0,
    options?.requiredComponents?.rfc9421 || options?.requiredInputs?.rfc9421
  );
  const results = /* @__PURE__ */ new Map();
  for (const [label, params] of Array.from(signatureInput.entries())) {
    const bs = signatureDictionary.get(label);
    if (!bs)
      throw new Error("signature not found");
    if (!(bs[0] instanceof sh3.ByteSequence))
      throw new Error("signature not ByteSequence");
    try {
      results.set(label, parseSingleRFC9421Signature(label, factory, params, bs[0]));
    } catch (e) {
      if (errorLogger)
        errorLogger(`Error while parsing signature ${label}: ${e}`);
    }
  }
  if (results.size === 0) {
    if (options?.requiredComponents?.rfc9421 || options?.requiredInputs?.rfc9421) {
      throw new Error("No valid signature found. This may have occurred because all signatures were filtered out by requiredComponents.");
    } else {
      throw new Error("No valid signature found. Something went wrong.");
    }
  }
  return {
    version: "rfc9421",
    value: Array.from(results.entries())
  };
}

// src/draft/parse.ts
var DraftSignatureHeaderKeys = ["keyId", "algorithm", "created", "expires", "opaque", "headers", "signature"];
function parseDraftRequestSignatureHeader(signatureHeader) {
  const result = {};
  let prevStatus = "none";
  let currentKey = "";
  let currentValue = "";
  const spaceRegex = /\s/;
  for (let i = 0; i < signatureHeader.length; i++) {
    const char = signatureHeader[i];
    if (prevStatus === "none") {
      if (char === ",")
        continue;
      if (spaceRegex.test(char))
        continue;
      prevStatus = "name";
      currentKey = char;
    } else if (prevStatus === "name") {
      if (char === "=") {
        prevStatus = "equal";
      } else {
        currentKey = `${currentKey}${char}`;
      }
    } else if (prevStatus === "equal") {
      if (char === '"') {
        prevStatus = "startQuote";
      } else {
        prevStatus = "valueWithoutQuote";
        currentValue = char;
      }
    } else if (prevStatus === "startQuote") {
      if (char === '"') {
        prevStatus = "endQuote";
        result[currentKey] = currentValue;
        currentKey = "";
        currentValue = "";
      } else {
        prevStatus = "value";
        currentValue = char;
      }
    } else if (prevStatus === "value") {
      if (char === '"') {
        prevStatus = "endQuote";
        result[currentKey] = currentValue;
        currentKey = "";
        currentValue = "";
      } else {
        currentValue = `${currentValue}${char}`;
      }
    } else if (prevStatus === "valueWithoutQuote") {
      if (char === ",") {
        prevStatus = "none";
        result[currentKey] = currentValue;
        currentKey = "";
        currentValue = "";
      }
    } else if (prevStatus === "endQuote") {
      prevStatus = "none";
    }
  }
  return result;
}
function validateAndProcessParsedDraftSignatureHeader(parsed, options) {
  if (!parsed.keyId)
    throw new SignatureParamsContentLackedError("keyId");
  if (!parsed.algorithm)
    throw new SignatureParamsContentLackedError("algorithm");
  if (!parsed.signature)
    throw new SignatureParamsContentLackedError("signature");
  if (!parsed.headers)
    throw new SignatureParamsContentLackedError("headers");
  const headersArray = parsed.headers.split(" ");
  const requiredHeaders = options?.requiredComponents?.draft || options?.requiredInputs?.draft;
  if (requiredHeaders) {
    for (const requiredInput of requiredHeaders) {
      if (requiredInput === "x-date" || requiredInput === "date") {
        if (headersArray.includes("date"))
          continue;
        if (headersArray.includes("x-date"))
          continue;
        throw new SignatureParamsContentLackedError(`headers.${requiredInput}`);
      }
      if (!headersArray.includes(requiredInput))
        throw new SignatureParamsContentLackedError(`headers.${requiredInput}`);
    }
  }
  if (parsed.created) {
    const createdSec = parseInt(parsed.created);
    if (isNaN(createdSec))
      throw new SignatureParamsClockInvalidError("created");
    const nowTime = (options?.clockSkew?.now || /* @__PURE__ */ new Date()).getTime();
    if (createdSec * 1e3 > nowTime + (options?.clockSkew?.forward ?? 2e3)) {
      throw new SignatureParamsClockInvalidError("created");
    }
  }
  if (parsed.expires) {
    const expiresSec = parseInt(parsed.expires);
    if (isNaN(expiresSec))
      throw new SignatureParamsClockInvalidError("expires");
    const nowTime = (options?.clockSkew?.now || /* @__PURE__ */ new Date()).getTime();
    if (expiresSec * 1e3 < nowTime - (options?.clockSkew?.forward ?? 2e3)) {
      throw new SignatureParamsClockInvalidError("expires");
    }
  }
  return {
    keyId: parsed.keyId,
    algorithm: parsed.algorithm.toLowerCase(),
    signature: parsed.signature,
    headers: headersArray,
    created: parsed.created,
    expires: parsed.expires,
    opaque: parsed.opaque
  };
}
function parseDraftRequest(request, options, validated) {
  if (!validated)
    validated = validateRequestAndGetSignatureHeader(request, options?.clockSkew);
  const parsedSignatureHeader = validateAndProcessParsedDraftSignatureHeader(parseDraftRequestSignatureHeader(validated.signatureHeader), options);
  const signingString = genDraftSigningString(
    request,
    parsedSignatureHeader.headers,
    {
      keyId: parsedSignatureHeader.keyId,
      algorithm: parsedSignatureHeader.algorithm,
      created: parsedSignatureHeader.created,
      expires: parsedSignatureHeader.expires,
      opaque: parsedSignatureHeader.opaque
    }
  );
  return {
    version: "draft",
    value: {
      scheme: "Signature",
      params: parsedSignatureHeader,
      signingString,
      algorithm: parsedSignatureHeader.algorithm.toUpperCase(),
      keyId: parsedSignatureHeader.keyId
    }
  };
}

// src/shared/parse.ts
var HTTPMessageSignaturesParseError = class extends Error {
  constructor(message) {
    super(message);
  }
};
var SignatureHeaderNotFoundError = class extends HTTPMessageSignaturesParseError {
  constructor() {
    super("Signature header not found");
  }
};
var InvalidRequestError = class extends HTTPMessageSignaturesParseError {
  constructor(message) {
    super(message);
  }
};
var RequestHasMultipleSignatureHeadersError = class extends HTTPMessageSignaturesParseError {
  constructor() {
    super("Request has multiple signature headers");
  }
};
var RequestHasMultipleDateHeadersError = class extends HTTPMessageSignaturesParseError {
  constructor() {
    super("Request has multiple date headers");
  }
};
var ClockSkewInvalidError = class extends HTTPMessageSignaturesParseError {
  constructor(reqDate, nowDate) {
    super(`Clock skew is invalid: request="${reqDate.toJSON()}",now="${nowDate.toJSON()}",diff="${nowDate.getTime() - reqDate.getTime()}"`);
  }
};
var UnknownSignatureHeaderFormatError = class extends HTTPMessageSignaturesParseError {
  constructor() {
    super("Unknown signature header format");
  }
};
var SignatureParamsContentLackedError = class extends HTTPMessageSignaturesParseError {
  constructor(lackedContent) {
    super(`Signature header content lacked: ${lackedContent}`);
  }
};
var SignatureParamsClockInvalidError = class extends HTTPMessageSignaturesParseError {
  constructor(prop) {
    super(`Clock skew is invalid (${prop})`);
  }
};
var SignatureInputLackedError = class extends HTTPMessageSignaturesParseError {
  constructor(message) {
    super(message);
  }
};
function signatureHeaderIsDraft(signatureHeader) {
  return signatureHeader.includes('signature="');
}
function checkClockSkew(reqDate, nowDate, delay = 300 * 1e3, forward = 2e3) {
  const reqTime = reqDate.getTime();
  const nowTime = nowDate.getTime();
  if (reqTime > nowTime + forward)
    throw new ClockSkewInvalidError(reqDate, nowDate);
  if (reqTime < nowTime - delay)
    throw new ClockSkewInvalidError(reqDate, nowDate);
}
function validateRequestAndGetSignatureHeader(source, clock) {
  const headers = collectHeaders(source);
  if (headers["date"]) {
    checkClockSkew(new Date(canonicalizeHeaderValue(headers["date"])), clock?.now || /* @__PURE__ */ new Date(), clock?.delay, clock?.forward);
  } else if (headers["x-date"]) {
    if (Array.isArray(headers["x-date"]))
      throw new RequestHasMultipleDateHeadersError();
    checkClockSkew(new Date(canonicalizeHeaderValue(headers["date"])), clock?.now || /* @__PURE__ */ new Date(), clock?.delay, clock?.forward);
  }
  const request = "req" in source ? source.req : source;
  if (!isBrowserResponse(request) && !("method" in request)) {
    throw new InvalidRequestError("Request method not found");
  }
  if (!request.url)
    throw new InvalidRequestError("Request URL not found");
  let signatureHeader = "signature" in headers ? canonicalizeHeaderValue(headers["signature"]) : null;
  const authorizationHeader = canonicalizeHeaderValue(headers["authorization"]);
  if (authorizationHeader) {
    if (authorizationHeader.startsWith("Signature ")) {
      signatureHeader = authorizationHeader.slice(10);
    }
  }
  if (!signatureHeader) {
    throw new SignatureHeaderNotFoundError();
  }
  return {
    signatureHeader,
    signatureInput: "signature-input" in headers ? canonicalizeHeaderValue(headers["signature-input"]) : null,
    headers
  };
}
function parseRequestSignature(request, options) {
  const validated = validateRequestAndGetSignatureHeader(request, options?.clockSkew);
  if (validated.signatureInput != null) {
    return parseRFC9421RequestOrResponse(request, options);
  } else if (signatureHeaderIsDraft(validated.signatureHeader)) {
    return parseDraftRequest(request, options, validated);
  }
  throw new UnknownSignatureHeaderFormatError();
}

// src/keypair.ts
async function exportPublicKeyPem(key) {
  const ab = await (await getWebcrypto()).subtle.exportKey("spki", key);
  return "-----BEGIN PUBLIC KEY-----\n" + splitPer64Chars(encodeArrayBufferToBase64(ab)).join("\n") + "\n-----END PUBLIC KEY-----\n";
}
async function exportPrivateKeyPem(key) {
  const ab = await (await getWebcrypto()).subtle.exportKey("pkcs8", key);
  return "-----BEGIN PRIVATE KEY-----\n" + splitPer64Chars(encodeArrayBufferToBase64(ab)).join("\n") + "\n-----END PRIVATE KEY-----\n";
}
async function genRsaKeyPair(modulusLength = 4096, keyUsage = ["sign", "verify"]) {
  const keyPair = await (await getWebcrypto()).subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    keyUsage
  );
  return {
    publicKey: await exportPublicKeyPem(keyPair.publicKey),
    privateKey: await exportPrivateKeyPem(keyPair.privateKey)
  };
}
async function genEcKeyPair(namedCurve = "P-256", keyUsage = ["sign", "verify"]) {
  const keyPair = await (await getWebcrypto()).subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve
    },
    true,
    keyUsage
  );
  return {
    publicKey: await exportPublicKeyPem(keyPair.publicKey),
    privateKey: await exportPrivateKeyPem(keyPair.privateKey)
  };
}
async function genEd25519KeyPair(keyUsage = ["sign", "verify"]) {
  const keyPair = await (await getWebcrypto()).subtle.generateKey(
    {
      name: "Ed25519"
    },
    true,
    keyUsage
  );
  return {
    publicKey: await exportPublicKeyPem(keyPair.publicKey),
    privateKey: await exportPrivateKeyPem(keyPair.privateKey)
  };
}
async function genEd448KeyPair(keyUsage) {
  const keyPair = await (await getWebcrypto()).subtle.generateKey(
    {
      name: "Ed448"
    },
    true,
    keyUsage
  );
  return {
    publicKey: await exportPublicKeyPem(keyPair.publicKey),
    privateKey: await exportPrivateKeyPem(keyPair.privateKey)
  };
}

// src/digest/utils.ts
async function createBase64Digest(body, hash = "SHA-256") {
  if (hash === "SHA") {
    hash = "SHA-1";
  }
  if (typeof body === "string") {
    body = textEncoder.encode(body);
  }
  return await (await getWebcrypto()).subtle.digest(hash, body);
}

// src/digest/digest-rfc3230.ts
var import_rfc46484 = require("rfc4648");
async function genRFC3230DigestHeader(body, hashAlgorithm) {
  return `${hashAlgorithm}=${await createBase64Digest(body, hashAlgorithm).then(encodeArrayBufferToBase64)}`;
}
var digestHeaderRegEx = /^([a-zA-Z0-9\-]+)=([^\,]+)/;
async function verifyRFC3230DigestHeader(request, rawBody, opts = {
  failOnNoDigest: true,
  algorithms: ["SHA-256", "SHA-512"]
}, errorLogger) {
  const failOnNoDigest = typeof opts === "boolean" ? opts : opts.failOnNoDigest;
  const algorithms = typeof opts === "boolean" ? ["SHA-256", "SHA-512"] : opts.algorithms.map((algo2) => algo2.toUpperCase());
  const digestHeader = getHeaderValue(collectHeaders(request), "digest");
  if (!digestHeader) {
    if (failOnNoDigest) {
      if (errorLogger)
        errorLogger("Digest header not found");
      return false;
    }
    return true;
  }
  const match = digestHeader.match(digestHeaderRegEx);
  if (!match) {
    if (errorLogger)
      errorLogger("Invalid Digest header format");
    return false;
  }
  if (!match[2]) {
    if (errorLogger)
      errorLogger("Invalid Digest header format");
    return false;
  }
  let value;
  try {
    value = import_rfc46484.base64.parse(match[2]);
  } catch {
    if (errorLogger)
      errorLogger(`Invalid Digest header format. (base64 syntax)`);
    return false;
  }
  let algo = match[1];
  if (!algo) {
    if (errorLogger)
      errorLogger(`Invalid Digest header algorithm: ${match[1]}`);
    return false;
  }
  algo = algo.toUpperCase();
  if (!algorithms.includes(algo) && !(algo === "SHA" && algorithms.includes("SHA-1"))) {
    if (errorLogger)
      errorLogger(`Unsupported hash algorithm detected in opts.algorithms: ${algo} (supported: ${algorithms.join(", ")})`);
    return false;
  }
  let hash;
  try {
    hash = await createBase64Digest(rawBody, algo);
  } catch (e) {
    if (e.name === "NotSupportedError") {
      if (errorLogger)
        errorLogger(`Invalid Digest header algorithm: ${algo}`);
      return false;
    }
    throw e;
  }
  if (!compareUint8Array(new Uint8Array(hash), value)) {
    if (errorLogger)
      errorLogger(`Digest header hash mismatch`);
    return false;
  }
  return true;
}

// src/digest/digest-rfc9530.ts
var sh4 = __toESM(require_dist(), 1);
var import_rfc46485 = require("rfc4648");
var RFC9530GenerateDigestHeaderError = class extends Error {
  constructor(message) {
    super(message);
  }
};
var RFC9530HashAlgorithmRegistry = {
  "sha-512": "Active",
  "sha-256": "Active",
  "md5": "Deprecated",
  "sha": "Deprecated",
  "unixsum": "Deprecated",
  "unixcksum": "Deprecated",
  "adler": "Deprecated",
  "crc32c": "Deprecated"
};
var supportedHashAlgorithmsWithRFC9530AndWebCrypto = ["sha-256", "sha-512"];
function isRFC9530Prefernece(obj) {
  if (!(obj instanceof Map))
    return false;
  if (obj.size === 0)
    return false;
  const zeroth = obj.values().next().value;
  if (!(zeroth instanceof Array))
    return false;
  if (zeroth.length !== 2)
    return false;
  if (typeof zeroth[0] !== "number")
    return false;
  if (!(zeroth[1] instanceof Map))
    return false;
  return true;
}
function isSupportedRFC9530HashAlgorithm(algo) {
  return supportedHashAlgorithmsWithRFC9530AndWebCrypto.includes(algo.toLowerCase());
}
function convertHashAlgorithmFromRFC9530ToWebCrypto(algo) {
  const lowercased = algo.toLowerCase();
  if (lowercased === "sha-256")
    return "SHA-256";
  if (lowercased === "sha-512")
    return "SHA-512";
  throw new Error(`Unsupported hash algorithm: ${algo}`);
}
function convertHashAlgorithmFromWebCryptoToRFC9530(algo) {
  const uppercased = algo.toUpperCase();
  if (uppercased === "SHA-256")
    return "sha-256";
  if (uppercased === "SHA-512")
    return "sha-512";
  throw new Error(`Unsupported hash algorithm: ${algo}`);
}
function chooseRFC9530HashAlgorithmByPreference(prefernece, meAcceptable = supportedHashAlgorithmsWithRFC9530AndWebCrypto) {
  const meAcceptableLower = new Set(meAcceptable.map((v) => v.toLowerCase()));
  const arr = Array.from(
    prefernece.entries(),
    ([k, [v]]) => [k.toLowerCase(), v]
    // 一応lowercaseにしておく
  );
  const res = arr.reduce(([kp, vp], [kc, vc]) => {
    if (!meAcceptableLower.has(kc) || vc === 0)
      return [kp, vp];
    if (kc == null)
      return [kp, vp];
    if (vc > vp) {
      return [kc, vc];
    }
    return [kp, vp];
  }, [null, 0]);
  return res[0];
}
async function genSingleRFC9530DigestHeader(body, hashAlgorithm) {
  if (!isSupportedRFC9530HashAlgorithm(hashAlgorithm)) {
    throw new RFC9530GenerateDigestHeaderError("Unsupported hash algorithm");
  }
  return [
    [
      hashAlgorithm.toLowerCase(),
      [
        new sh4.ByteSequence(
          await createBase64Digest(body, convertHashAlgorithmFromRFC9530ToWebCrypto(hashAlgorithm)).then((data) => import_rfc46485.base64.stringify(new Uint8Array(data)))
        ),
        /* @__PURE__ */ new Map()
      ]
    ]
  ];
}
async function genRFC9530DigestHeader(body, hashAlgorithms = ["SHA-256"], process = "concurrent") {
  if (typeof hashAlgorithms === "string") {
    return await genSingleRFC9530DigestHeader(body, hashAlgorithms);
  }
  if (isRFC9530Prefernece(hashAlgorithms)) {
    const chosen = chooseRFC9530HashAlgorithmByPreference(hashAlgorithms);
    if (chosen == null) {
      throw new RFC9530GenerateDigestHeaderError("Provided hashAlgorithms does not contain SHA-256 or SHA-512");
    }
    return await genSingleRFC9530DigestHeader(body, chosen);
  }
  if (process === "concurrent") {
    return await Promise.all(Array.from(
      hashAlgorithms,
      (algo) => genSingleRFC9530DigestHeader(body, algo).then(([v]) => v)
    ));
  }
  const result = [];
  for (const algo of hashAlgorithms) {
    await genSingleRFC9530DigestHeader(body, algo).then(([v]) => result.push(v));
  }
  return result;
}
async function verifyRFC9530DigestHeader(request, rawBody, opts = {
  failOnNoDigest: true,
  verifyAll: true,
  algorithms: ["sha-256", "sha-512"]
}, errorLogger) {
  const headers = collectHeaders(request);
  const contentDigestHeader = getHeaderValue(headers, "content-digest");
  if (!contentDigestHeader) {
    if (opts.failOnNoDigest) {
      if (errorLogger)
        errorLogger("Repr-Digest or Content-Digest header not found");
      return false;
    }
    return true;
  }
  let dictionary;
  try {
    dictionary = Array.from(sh4.parseDictionary(contentDigestHeader), ([k, v]) => [k.toLowerCase(), v]);
  } catch (e) {
    if (errorLogger)
      errorLogger("Invalid Digest header");
    return false;
  }
  if (dictionary.length === 0) {
    if (errorLogger)
      errorLogger("Digest header is empty");
    return false;
  }
  let acceptableAlgorithms = (opts.algorithms || ["sha-256", "sha-512"]).map((v) => v.toLowerCase());
  if (acceptableAlgorithms.length === 0) {
    throw new Error("hashAlgorithms is empty");
  }
  if (acceptableAlgorithms.some((algo) => !isSupportedRFC9530HashAlgorithm(algo))) {
    throw new Error(`Unsupported hash algorithm detected in opts.hashAlgorithms (supported: ${supportedHashAlgorithmsWithRFC9530AndWebCrypto.join(", ")})`);
  }
  const dictionaryAlgorithms = dictionary.reduce((prev, [k]) => prev.add(k), /* @__PURE__ */ new Set());
  if (!acceptableAlgorithms.some((v) => dictionaryAlgorithms.has(v))) {
    if (errorLogger)
      errorLogger("No supported Content-Digest header algorithm");
    return false;
  }
  if (!opts.verifyAll) {
    acceptableAlgorithms = [acceptableAlgorithms.find((v) => dictionaryAlgorithms.has(v))];
  }
  const results = await Promise.allSettled(
    dictionary.map(([algo, [value]]) => {
      if (!acceptableAlgorithms.includes(algo.toLowerCase())) {
        return Promise.resolve(null);
      }
      if (!(value instanceof sh4.ByteSequence)) {
        return Promise.reject(new Error("Invalid dictionary value type"));
      }
      return createBase64Digest(rawBody, convertHashAlgorithmFromRFC9530ToWebCrypto(algo.toLowerCase())).then((hash) => compareUint8Array(import_rfc46485.base64.parse(value.toBase64()), new Uint8Array(hash)));
    })
  );
  if (!results.some((v) => v.status === "fulfilled" && v.value === true)) {
    if (errorLogger)
      errorLogger(`No digest(s) matched`);
    return false;
  }
  for (const result of results) {
    if (result.status === "fulfilled" && result.value === false) {
      if (errorLogger)
        errorLogger(`Content-Digest header hash simply mismatched`);
      return false;
    } else if (result.status === "rejected") {
      if (errorLogger)
        errorLogger(`Content-Digest header parse error: ${result.reason}`);
      return false;
    }
  }
  return true;
}

// src/digest/digest.ts
async function genDigestHeaderBothRFC3230AndRFC9530(request, body, hashAlgorithm = "SHA-256") {
  const base646 = await createBase64Digest(body, hashAlgorithm).then(encodeArrayBufferToBase64);
  const digest = `${hashAlgorithm}=${base646}`;
  const contentDigest = `${convertHashAlgorithmFromWebCryptoToRFC9530(hashAlgorithm)}=:${base646}:`;
  setHeaderToRequestOrResponse(request, "Digest", digest);
  setHeaderToRequestOrResponse(request, "Content-Digest", contentDigest);
}
async function verifyDigestHeader(request, rawBody, opts = {
  failOnNoDigest: true,
  algorithms: ["SHA-256", "SHA-512"],
  verifyAll: true
}, errorLogger) {
  const failOnNoDigest = typeof opts === "boolean" ? opts : opts.failOnNoDigest;
  const algorithms = typeof opts === "boolean" ? ["SHA-256", "SHA-512"] : opts.algorithms;
  const verifyAll = typeof opts === "boolean" ? true : opts.verifyAll;
  const headerKeys = new Set(Object.keys(collectHeaders(request)));
  if (headerKeys.has("content-digest")) {
    return await verifyRFC9530DigestHeader(
      request,
      rawBody,
      { failOnNoDigest, verifyAll, algorithms: algorithms.map(convertHashAlgorithmFromWebCryptoToRFC9530) },
      errorLogger
    );
  } else if (headerKeys.has("digest")) {
    return await verifyRFC3230DigestHeader(
      request,
      rawBody,
      { failOnNoDigest, algorithms },
      errorLogger
    );
  }
  if (failOnNoDigest) {
    if (errorLogger)
      errorLogger("Content-Digest or Digest header not found");
    return false;
  }
  return true;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClockSkewInvalidError,
  DraftSignatureHeaderKeys,
  HTTPMessageSignaturesParseError,
  InvalidRequestError,
  KeyHashValidationError,
  KeyValidationError,
  Pkcs1ParseError,
  Pkcs8ParseError,
  RFC9421SignatureBaseFactory,
  RFC9421SignatureParams,
  RFC9530GenerateDigestHeaderError,
  RFC9530HashAlgorithmRegistry,
  RequestHasMultipleDateHeadersError,
  RequestHasMultipleSignatureHeadersError,
  SignatureHeaderNotFoundError,
  SignatureInputLackedError,
  SignatureParamsClockInvalidError,
  SignatureParamsContentLackedError,
  SpkiParseError,
  UnknownSignatureHeaderFormatError,
  asn1ToArrayBuffer,
  canonicalizeHeaderValue,
  checkClockSkew,
  chooseRFC9530HashAlgorithmByPreference,
  collectHeaders,
  compareUint8Array,
  convertHashAlgorithmFromWebCryptoToRFC9530,
  convertSignatureParamsDictionary,
  correctHeadersFromFlatArray,
  decodePem,
  decodePublicMultikey,
  defaultSignInfoDefaults,
  digestHeaderRegEx,
  encodeArrayBufferToBase64,
  exportPrivateKeyPem,
  exportPublicKeyPem,
  genASN1Length,
  genAlgorithmForSignAndVerify,
  genDigestHeaderBothRFC3230AndRFC9530,
  genDraftSignature,
  genDraftSignatureHeader,
  genDraftSigningString,
  genEcKeyPair,
  genEd25519KeyPair,
  genEd448KeyPair,
  genPkcs8FromPkcs1,
  genRFC3230DigestHeader,
  genRFC9530DigestHeader,
  genRsaKeyPair,
  genSignInfo,
  genSignInfoDraft,
  genSignature,
  genSingleRFC9530DigestHeader,
  genSpkiFromPkcs1,
  getDraftAlgoString,
  getHeaderValue,
  getMap,
  getMapWithoutUndefined,
  getNistCurveFromOid,
  getPublicKeyAlgorithmNameFromOid,
  getRFC9421AlgoString,
  getValueByLc,
  getWebcrypto,
  importPrivateJwk,
  importPrivateKey,
  importPublicJwk,
  importPublicKey,
  isBrowserHeader,
  isBrowserRequest,
  isBrowserResponse,
  keyHashAlgosForDraftDecoding,
  keyHashAlgosForDraftEncofing,
  knownSfvHeaderTypeDictionary,
  lcObjectKey,
  numberToUint8Array,
  obsoleteLineFoldingRegEx,
  parseAlgorithmIdentifier,
  parseAndImportPublicKey,
  parseDraftRequest,
  parseDraftRequestSignatureHeader,
  parsePkcs1,
  parsePkcs1PrivateKey,
  parsePkcs8,
  parsePublicKey,
  parseRFC9421RequestOrResponse,
  parseRequestSignature,
  parseSignInfo,
  parseSingleRFC9421Signature,
  parseSpki,
  processSingleRFC9421SignSource,
  removeObsoleteLineFolding,
  requestTargetDerivedComponents,
  responseTargetDerivedComponents,
  rsaASN1AlgorithmIdentifier,
  setHeaderToRequestOrResponse,
  signAsDraftToRequest,
  signAsRFC9421ToRequestOrResponse,
  signatureHeaderIsDraft,
  splitPer64Chars,
  supportedHashAlgorithmsWithRFC9530AndWebCrypto,
  toStringOrToLc,
  validateAndProcessParsedDraftSignatureHeader,
  validateRFC9421SignatureInputParameters,
  validateRequestAndGetSignatureHeader,
  verifyDigestHeader,
  verifyDraftSignature,
  verifyParsedSignature,
  verifyRFC3230DigestHeader,
  verifyRFC9421Signature,
  verifyRFC9530DigestHeader,
  webCryptoSigner,
  webCryptoVerifier
});
