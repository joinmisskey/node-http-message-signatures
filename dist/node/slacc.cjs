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
    var ByteSequence3 = class {
      constructor(base64Value) {
        this.base64Value = base64Value;
      }
      toBase64() {
        return this.base64Value;
      }
    };
    exports2.ByteSequence = ByteSequence3;
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
          return serializeInnerList2(value);
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
            out += serializeInnerList2(value);
          } else {
            out += serializeItem2(value);
          }
        }
        return out;
      }).join(", ");
    }
    exports2.serializeDictionary = serializeDictionary3;
    function serializeItem2(input) {
      return serializeBareItem(input[0]) + serializeParameters(input[1]);
    }
    exports2.serializeItem = serializeItem2;
    function serializeInnerList2(input) {
      return `(${input[0].map((value) => serializeItem2(value)).join(" ")})${serializeParameters(input[1])}`;
    }
    exports2.serializeInnerList = serializeInnerList2;
    function serializeBareItem(input) {
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
    exports2.serializeBareItem = serializeBareItem;
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
          out += "=" + serializeBareItem(value);
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
    function parseDictionary2(input) {
      const parser = new Parser(input);
      return parser.parseDictionary();
    }
    exports2.parseDictionary = parseDictionary2;
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

// src/node/slacc.ts
var slacc_exports = {};
__export(slacc_exports, {
  createLegacySlaccRsaSigningKey: () => createLegacySlaccRsaSigningKey,
  createLegacySlaccWebCryptoSigningKey: () => createLegacySlaccWebCryptoSigningKey,
  createSlaccSigningKey: () => createSlaccSigningKey,
  createSlaccVerifier: () => createSlaccVerifier
});
module.exports = __toCommonJS(slacc_exports);
var import_node_buffer = require("node:buffer");
var import_node_crypto = require("node:crypto");

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
    if (children.length >= 64)
      throw new Error("Too many DER fields");
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
  const bytes2 = element.content;
  if (element.tag !== 2 || !bytes2.length || bytes2[0] & 128)
    throw new Error("Expected nonnegative DER integer");
  if (bytes2.length > 1 && bytes2[0] === 0 && !(bytes2[1] & 128))
    throw new Error("Nonminimal DER integer");
  if (!allowZero && bytes2.every((value) => value === 0))
    throw new Error("Expected positive DER integer");
  return bytes2;
}

// src/pem/pkcs1.ts
var import_asn1js = require("@lapo/asn1js");

// src/utils.ts
var import_rfc4648 = require("rfc4648");
async function getWebcrypto() {
  return globalThis.crypto ?? (await import("node:crypto")).webcrypto;
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

// src/pem/pkcs1.ts
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
    const bytes2 = typeof data === "string" ? Uint8Array.from(data, (char) => char.charCodeAt(0)) : data instanceof Uint8Array ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
    const fields = derSequence(bytes2);
    if (fields.length !== 9)
      throw new Error("Expected nine two-prime RSA fields");
    const version = unsignedDerInteger(fields[0], true);
    if (version.length !== 1 || version[0] !== 0)
      throw new Error("Only two-prime version 0 is supported");
    for (const field of fields.slice(1))
      unsignedDerInteger(field);
    return { pkcs1: new Uint8Array(bytes2).buffer };
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

// src/draft/verify.ts
var import_rfc46482 = require("rfc4648");

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
  const privateKey2 = parsed.sub[2];
  if (!privateKey2 || !privateKey2.tag || privateKey2.tag.tagNumber !== 4)
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

// src/draft/const.ts
var keyHashAlgosForDraftDecoding = {
  "sha1": "SHA",
  "sha256": "SHA-256",
  "sha384": "SHA-384",
  "sha512": "SHA-512",
  "md5": "MD5"
};

// src/rfc9421/sign.ts
var sh2 = __toESM(require_dist(), 1);

// src/rfc9421/base.ts
var sh = __toESM(require_dist(), 1);

// src/shared/backend.ts
function validateSignatureAlgorithm(version, wire2) {
  const allowed = version === "rfc9421" ? ["rsa-pss-sha512", "rsa-v1_5-sha256", "ecdsa-p256-sha256", "ecdsa-p384-sha384", "ed25519"] : ["hs2019", "rsa-sha1", "rsa-sha256", "rsa-sha384", "rsa-sha512", "ecdsa-sha1", "ecdsa-sha256", "ecdsa-sha384", "ecdsa-sha512", "ed25519-sha512", "ed25519", "ed448"];
  if (!allowed.includes(wire2.toLowerCase()))
    throw new Error("Unsupported signature algorithm");
}
function validateSignatureOperation(version, wire2, operation2) {
  validateSignatureAlgorithm(version, wire2);
  if (operation2.name === "RSA-PSS" && (operation2.hash !== "SHA-512" || operation2.saltLength !== 64))
    throw new Error("RFC 9421 PSS operation requires SHA-512 and saltLength 64");
  if (!["RSA-PSS", "RSASSA-PKCS1-v1_5", "ECDSA", "Ed25519", "Ed448"].includes(operation2.name))
    throw new Error("Unsupported signing operation");
  if ((operation2.name === "Ed25519" || operation2.name === "Ed448") && ("hash" in operation2 || "saltLength" in operation2))
    throw new Error("EdDSA does not accept a prehash operation");
  const expected = parseSignInfo(wire2, operation2);
  if (expected.name !== operation2.name || "hash" in expected && (!("hash" in operation2) || expected.hash !== operation2.hash) || "namedCurve" in expected && (!("namedCurve" in operation2) || expected.namedCurve !== operation2.namedCurve))
    throw new Error("Operation conflicts with wire algorithm");
  return expected;
}
function validateOperationKey(key, operation2, usage) {
  if (key.type !== (usage === "sign" ? "private" : "public") || !key.usages.includes(usage) || key.algorithm.name !== operation2.name)
    throw new Error("CryptoKey is incompatible with signature operation");
  if ("hash" in key.algorithm && (!("hash" in operation2) || key.algorithm.hash.name !== operation2.hash))
    throw new Error("CryptoKey hash conflicts with signature operation");
  if ("namedCurve" in key.algorithm && (!("namedCurve" in operation2) || key.algorithm.namedCurve !== operation2.namedCurve))
    throw new Error("CryptoKey curve conflicts with signature operation");
}
async function webCryptoSigner(context) {
  validateSignatureOperation(context.version, context.signatureAlgorithm, context.algorithm);
  if (!context.key)
    throw new Error("WebCrypto signing requires a private key");
  validateOperationKey(context.key, context.algorithm, "sign");
  return new Uint8Array(await (await getWebcrypto()).subtle.sign(context.algorithm, context.key, textEncoder.encode(context.signingString)));
}

// src/rfc9421/verify.ts
var import_rfc46483 = require("rfc4648");

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
function operationForJwk(jwk, wire2, defaults = defaultSignInfoDefaults) {
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
  const operation2 = parseSignInfo(wire2 ?? declared ?? fallback, real);
  if (declared && JSON.stringify(parseSignInfo(declared, real)) !== JSON.stringify(operation2))
    throw new Error("JWK alg conflicts with requested signature algorithm");
  return operation2;
}
async function importSignatureJwk(jwk, privateKey2, keyUsages, defaults = defaultSignInfoDefaults, extractable = false, providedAlgorithm) {
  if (!jwk || typeof jwk !== "object" || Array.isArray(jwk))
    throw new Error("Invalid JWK");
  if (jwk.use !== void 0 && jwk.use !== "sig")
    throw new Error("JWK use must be sig");
  if (jwk.ext !== void 0 && typeof jwk.ext !== "boolean")
    throw new Error("Invalid JWK ext");
  if (extractable && jwk.ext === false)
    throw new Error("Nonextractable JWK");
  const expectedUsage = privateKey2 ? "sign" : "verify";
  if (!keyUsages.length || keyUsages.some((usage) => usage !== expectedUsage))
    throw new Error("Invalid signature key usage");
  if (jwk.key_ops !== void 0 && (!Array.isArray(jwk.key_ops) || new Set(jwk.key_ops).size !== jwk.key_ops.length || jwk.key_ops.some((usage) => usage !== expectedUsage) || !jwk.key_ops.includes(expectedUsage)))
    throw new Error("JWK key_ops conflicts with requested usage");
  if (!privateKey2 && privateMembers.some((member) => member in jwk))
    throw new Error("Private or secret material in public JWK");
  if (privateKey2 && (typeof jwk.d !== "string" || !jwk.d))
    throw new Error("Missing JWK private key material");
  const operation2 = operationForJwk(jwk, providedAlgorithm, defaults);
  const key = await (await getWebcrypto()).subtle.importKey("jwk", jwk, operation2, extractable, keyUsages);
  return { key, algorithm: genAlgorithmForSignAndVerify(key.algorithm, "hash" in operation2 ? operation2.hash : null) };
}
async function importPrivateJwk(jwk, keyUsages = ["sign"], defaults = defaultSignInfoDefaults, extractable = false) {
  return (await importSignatureJwk(jwk, true, keyUsages, defaults, extractable)).key;
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
  if (typeof input === "string" && input.length > 4 * 1024 * 1024)
    throw new SpkiParseError("Encoded key exceeds 4 MiB limit");
  const der = typeof input === "string" ? reHex.test(input) ? import_hex.Hex.decode(input) : import_base64.Base64.unarmor(input) : input;
  const data = typeof der === "object" && "enc" in der ? der.enc : der;
  const length = data instanceof ArrayBuffer ? data.byteLength : data.length;
  if (length > 1024 * 1024)
    throw new SpkiParseError("Decoded key exceeds 1 MiB limit");
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

// src/node/slacc.ts
function operation(algorithm) {
  if (algorithm === "rsa-v1_5-sha256")
    return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  if (algorithm === "ed25519")
    return { name: "Ed25519" };
  throw new Error("Unsupported slacc signature algorithm");
}
function wire(version, algorithm) {
  if (version !== "draft" && version !== "rfc9421")
    throw new Error("Unsupported signature version");
  return version === "rfc9421" ? algorithm : algorithm === "ed25519" ? "ed25519-sha512" : "rsa-sha256";
}
function bytes(input) {
  if (typeof input !== "string" && !(input instanceof Uint8Array) && !(input instanceof ArrayBuffer))
    throw new Error("slacc requires explicit PEM or DER; CryptoKey/JWK inputs are unsupported");
  if (typeof input === "string" && /-----BEGIN ENCRYPTED|^Proc-Type:|^DEK-Info:/m.test(input))
    throw new Error("Encrypted keys are unsupported");
  const decoded = decodePem(input);
  const raw = typeof decoded === "object" && "enc" in decoded ? decoded.enc : decoded;
  return typeof raw === "string" ? Uint8Array.from(raw, (char) => char.charCodeAt(0)) : new Uint8Array(raw);
}
function checkIdentifier(encoded, algorithm) {
  const fields = derSequence(encoded);
  const oid = algorithm === "ed25519" ? [43, 101, 112] : [42, 134, 72, 134, 247, 13, 1, 1, 1];
  if (!fields[0] || fields[0].tag !== 6 || !import_node_buffer.Buffer.from(fields[0].content).equals(import_node_buffer.Buffer.from(oid)))
    throw new Error("Key type conflicts with slacc algorithm");
  if (algorithm === "ed25519" ? fields.length !== 1 : fields.length !== 1 && !(fields.length === 2 && fields[1].tag === 5 && fields[1].content.length === 0))
    throw new Error("Unsupported key algorithm parameters");
}
function checkKey(key, algorithm) {
  if (key.asymmetricKeyType !== (algorithm === "ed25519" ? "ed25519" : "rsa"))
    throw new Error("Key type conflicts with slacc algorithm");
  if (algorithm === "ed25519")
    return 64;
  const bits = key.asymmetricKeyDetails?.modulusLength;
  if (!bits || bits < 2048 || bits > 8192)
    throw new Error("slacc RSA keys must be 2048\u20138192 bits");
  return Math.ceil(bits / 8);
}
function privateKey(input, algorithm) {
  let der = bytes(input);
  let fields = derSequence(der);
  if (fields.length === 9 && fields.every((field) => field.tag === 2)) {
    if (algorithm !== "rsa-v1_5-sha256")
      throw new Error("PKCS#1 requires RSA");
    der = genPkcs8FromPkcs1(der);
    fields = derSequence(der);
  }
  if (fields.length !== 3 || fields[0].tag !== 2 || fields[0].content.length !== 1 || fields[0].content[0] !== 0 || fields[2].tag !== 4)
    throw new Error("Expected unencrypted version-0 PKCS#8 without attributes");
  checkIdentifier(fields[1].encoded, algorithm);
  if (algorithm === "rsa-v1_5-sha256")
    parsePkcs1PrivateKey(fields[2].content);
  else {
    const seed = readDer(fields[2].content);
    if (seed.tag !== 4 || seed.content.length !== 32 || seed.end !== fields[2].content.length)
      throw new Error("Invalid Ed25519 PKCS#8 seed");
  }
  const key = (0, import_node_crypto.createPrivateKey)({ key: import_node_buffer.Buffer.from(der), format: "der", type: "pkcs8" });
  return { key, der: import_node_buffer.Buffer.from(der), signatureLength: checkKey(key, algorithm) };
}
function publicKey(input, algorithm) {
  let der = bytes(input);
  let fields = derSequence(der);
  if (fields.length === 2 && fields.every((field) => field.tag === 2)) {
    if (algorithm !== "rsa-v1_5-sha256")
      throw new Error("PKCS#1 requires RSA");
    for (const field of fields)
      unsignedDerInteger(field);
    der = genSpkiFromPkcs1(der);
    fields = derSequence(der);
  }
  if (fields.length !== 2 || fields[1].tag !== 3 || fields[1].content[0] !== 0)
    throw new Error("Expected SPKI with an unpadded public key");
  checkIdentifier(fields[0].encoded, algorithm);
  const raw = fields[1].content.subarray(1);
  if (algorithm === "ed25519" && raw.length !== 32)
    throw new Error("Invalid Ed25519 public key");
  if (algorithm === "rsa-v1_5-sha256") {
    const rsa = derSequence(raw);
    if (rsa.length !== 2)
      throw new Error("Invalid RSA public key");
    for (const field of rsa)
      unsignedDerInteger(field);
  }
  const key = (0, import_node_crypto.createPublicKey)({ key: import_node_buffer.Buffer.from(der), format: "der", type: "spki" });
  return { der: import_node_buffer.Buffer.from(der), signatureLength: checkKey(key, algorithm) };
}
function suite(binding, algorithm) {
  const value = algorithm === "ed25519" ? binding.SignatureAlgorithmIdentifier.Eddsa : binding.SignatureAlgorithmIdentifier.Rsa2048_8192;
  if (value !== (algorithm === "ed25519" ? "Eddsa" : "Rsa2048_8192"))
    throw new Error("Unknown slacc suite");
  return value;
}
function invoke(run, valid) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const callback = (error, result) => {
      if (settled)
        return;
      settled = true;
      if (error)
        reject(error);
      else if (!valid(result))
        reject(new Error("Invalid slacc callback result"));
      else
        resolve(result);
    };
    try {
      run(callback);
    } catch (error) {
      if (!settled) {
        settled = true;
        reject(error);
      }
    }
  });
}
function checkContext(context, algorithm, version) {
  if (context.key !== void 0)
    throw new Error("Fixed-key slacc adapters require a keyless context; route keys explicitly");
  if (version !== void 0 && context.version !== version)
    throw new Error("Signature version conflicts with slacc adapter");
  const expected = operation(algorithm);
  wire(context.version, algorithm);
  validateSignatureOperation(context.version, context.signatureAlgorithm, context.algorithm);
  if (context.algorithm.name !== expected.name || "hash" in expected && (!("hash" in context.algorithm) || context.algorithm.hash !== expected.hash))
    throw new Error("Signature operation conflicts with slacc adapter");
}
function createSlaccSigningKey(binding, options) {
  const { keyId, version, algorithm: selection, privateKey: input } = options;
  const algorithm = operation(selection);
  const signatureAlgorithm = wire(version, selection);
  const parsed = privateKey(input, selection);
  const signatureLength = parsed.signatureLength;
  const handle = binding.Signer.fromPkcs8Der(suite(binding, selection), parsed.der);
  const publicPart = (0, import_node_crypto.createPublicKey)(parsed.key).export({ format: "der", type: "spki" });
  const expectedPublic = selection === "ed25519" ? publicPart.subarray(publicPart.length - 32) : (0, import_node_crypto.createPublicKey)(parsed.key).export({ format: "der", type: "pkcs1" });
  if (!import_node_buffer.Buffer.isBuffer(handle.publicKey) || !handle.publicKey.equals(expectedPublic))
    throw new Error("slacc signer handle conflicts with provided key");
  return { keyId, algorithm, signatureAlgorithm, signer: async (context) => {
    checkContext(context, selection, version);
    if (context.keyId !== keyId)
      throw new Error("Signer key ID conflicts with slacc adapter");
    return Uint8Array.from(await invoke((callback) => handle.signRaw(import_node_buffer.Buffer.from(context.signingString, "utf8"), callback), (result) => import_node_buffer.Buffer.isBuffer(result) && result.length === signatureLength));
  } };
}
function createSlaccVerifier(binding, options) {
  const { algorithm, version, publicKey: input } = options;
  operation(algorithm);
  if (version !== void 0)
    wire(version, algorithm);
  const parsed = publicKey(input, algorithm);
  const signatureLength = parsed.signatureLength;
  const handle = binding.Verifier.fromSpkiDer(suite(binding, algorithm), parsed.der);
  return async (context) => {
    checkContext(context, algorithm, version);
    if (context.signature.length !== signatureLength)
      return false;
    return invoke((callback) => handle.verifyRaw(import_node_buffer.Buffer.from(context.signature), import_node_buffer.Buffer.from(context.signingString, "utf8"), callback), (result) => typeof result === "boolean");
  };
}
function createLegacySlaccRsaSigningKey(binding, options) {
  const { keyId, version, privateKey: input } = options;
  const signatureAlgorithm = wire(version, "rsa-v1_5-sha256");
  const parsed = privateKey(input, "rsa-v1_5-sha256");
  const signatureLength = parsed.signatureLength;
  const handle = binding.RsaKeyPair.fromPem(parsed.key.export({ type: "pkcs8", format: "pem" }).toString());
  return { keyId, algorithm: operation("rsa-v1_5-sha256"), signatureAlgorithm, signer: async (context) => {
    checkContext(context, "rsa-v1_5-sha256", version);
    if (context.keyId !== keyId)
      throw new Error("Signer key ID conflicts with slacc adapter");
    return Uint8Array.from(await invoke((callback) => handle.sign(import_node_buffer.Buffer.from(context.signingString, "utf8"), callback), (result) => import_node_buffer.Buffer.isBuffer(result) && result.length === signatureLength));
  } };
}
async function createLegacySlaccWebCryptoSigningKey(binding, options) {
  const { keyId, version, privateKey: input } = options;
  const fields = derSequence(bytes(input));
  let selection;
  if (fields.length === 9 && fields.every((field) => field.tag === 2))
    selection = "rsa-v1_5-sha256";
  else {
    if (fields.length !== 3)
      throw new Error("Expected unencrypted PKCS#8 or PKCS#1");
    const identifier = derSequence(fields[1].encoded);
    if (identifier[0]?.tag !== 6)
      throw new Error("Expected key algorithm OID");
    const oid = import_node_buffer.Buffer.from(identifier[0].content).toString("hex");
    if (oid === "2b6570")
      selection = "ed25519";
    else if (oid === "2a864886f70d010101")
      selection = "rsa-v1_5-sha256";
    else
      throw new Error("Legacy slacc/WebCrypto supports only RSA-v1.5/SHA-256 and Ed25519");
  }
  const signatureAlgorithm = wire(version, selection);
  const parsed = privateKey(input, selection);
  if (selection === "rsa-v1_5-sha256")
    return createLegacySlaccRsaSigningKey(binding, { keyId, version, privateKey: parsed.der });
  const key = await importPrivateKey(parsed.der);
  return { keyId, algorithm: operation(selection), signatureAlgorithm, signer: async (context) => {
    checkContext(context, selection, version);
    if (context.keyId !== keyId)
      throw new Error("Signer key ID conflicts with slacc adapter");
    return webCryptoSigner({ ...context, key });
  } };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createLegacySlaccRsaSigningKey,
  createLegacySlaccWebCryptoSigningKey,
  createSlaccSigningKey,
  createSlaccVerifier
});
