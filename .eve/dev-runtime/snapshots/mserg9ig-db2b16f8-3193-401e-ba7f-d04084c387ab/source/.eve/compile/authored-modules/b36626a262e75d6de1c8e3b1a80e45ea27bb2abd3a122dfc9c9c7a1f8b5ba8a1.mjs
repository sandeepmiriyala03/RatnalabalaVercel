import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
import { createRequire as __eveCreateRequire } from "node:module";
const __filename = __eveFileURLToPath(import.meta.url);
__eveDirname(__filename);
__eveCreateRequire(import.meta.url);
import { defineAgent } from "eve";
import { eveChannel } from "eve/channels/eve";
import { localDev, placeholderAuth, vercelOidc } from "eve/channels/auth";
import { defineTool } from "eve/tools";
import nodeCrypto from "node:crypto";
var __defProp$1 = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp$1(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp$1(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var marker$1 = "vercel.ai.error";
var symbol$1 = Symbol.for(marker$1);
var _a$1;
var _b$1;
var AISDKError = class _AISDKError extends (_b$1 = Error, _a$1 = symbol$1, _b$1) {
	constructor({ name: name15, message, cause }) {
		super(message);
		this[_a$1] = true;
		this.name = name15;
		this.cause = cause;
	}
	static isInstance(error) {
		return _AISDKError.hasMarker(error, marker$1);
	}
	static hasMarker(error, marker16) {
		const markerSymbol = Symbol.for(marker16);
		return error != null && typeof error === "object" && markerSymbol in error && typeof error[markerSymbol] === "boolean" && error[markerSymbol] === true;
	}
};
var name$1 = "AI_APICallError";
var marker2$1 = `vercel.ai.error.${name$1}`;
var symbol2$1 = Symbol.for(marker2$1);
var _a2$1;
var _b2$1;
var APICallError = class extends (_b2$1 = AISDKError, _a2$1 = symbol2$1, _b2$1) {
	constructor({ message, url, requestBodyValues, statusCode, responseHeaders, responseBody, cause, isRetryable = statusCode != null && (statusCode === 408 || statusCode === 409 || statusCode === 429 || statusCode >= 500), data }) {
		super({
			name: name$1,
			message,
			cause
		});
		this[_a2$1] = true;
		this.url = url;
		this.requestBodyValues = requestBodyValues;
		this.statusCode = statusCode;
		this.responseHeaders = responseHeaders;
		this.responseBody = responseBody;
		this.isRetryable = isRetryable;
		this.data = data;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker2$1);
	}
};
var name2$1 = "AI_EmptyResponseBodyError";
var marker3 = `vercel.ai.error.${name2$1}`;
var symbol3 = Symbol.for(marker3);
var _a3;
var _b3;
var EmptyResponseBodyError = class extends (_b3 = AISDKError, _a3 = symbol3, _b3) {
	constructor({ message = "Empty response body" } = {}) {
		super({
			name: name2$1,
			message
		});
		this[_a3] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker3);
	}
};
function getErrorMessage(error) {
	if (error == null) return "unknown error";
	if (typeof error === "string") return error;
	if (error instanceof Error) return error.toString();
	return JSON.stringify(error);
}
var name3 = "AI_InvalidArgumentError";
var marker4 = `vercel.ai.error.${name3}`;
var symbol4 = Symbol.for(marker4);
var _a4;
var _b4;
var InvalidArgumentError = class extends (_b4 = AISDKError, _a4 = symbol4, _b4) {
	constructor({ message, cause, argument }) {
		super({
			name: name3,
			message,
			cause
		});
		this[_a4] = true;
		this.argument = argument;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker4);
	}
};
var name5 = "AI_InvalidResponseDataError";
var marker6 = `vercel.ai.error.${name5}`;
var symbol6 = Symbol.for(marker6);
var _a6;
var _b6;
var InvalidResponseDataError = class extends (_b6 = AISDKError, _a6 = symbol6, _b6) {
	constructor({ data, message = `Invalid response data: ${JSON.stringify(data)}.` }) {
		super({
			name: name5,
			message
		});
		this[_a6] = true;
		this.data = data;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker6);
	}
};
var name6 = "AI_JSONParseError";
var marker7 = `vercel.ai.error.${name6}`;
var symbol7 = Symbol.for(marker7);
var _a7;
var _b7;
var JSONParseError = class extends (_b7 = AISDKError, _a7 = symbol7, _b7) {
	constructor({ text, cause }) {
		super({
			name: name6,
			message: `JSON parsing failed: Text: ${text}.
Error message: ${getErrorMessage(cause)}`,
			cause
		});
		this[_a7] = true;
		this.text = text;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker7);
	}
};
var name7 = "AI_LoadAPIKeyError";
var marker8 = `vercel.ai.error.${name7}`;
var symbol8 = Symbol.for(marker8);
var _a8;
var _b8;
var LoadAPIKeyError = class extends (_b8 = AISDKError, _a8 = symbol8, _b8) {
	constructor({ message }) {
		super({
			name: name7,
			message
		});
		this[_a8] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker8);
	}
};
var name10 = "AI_NoSuchModelError";
var marker11 = `vercel.ai.error.${name10}`;
var symbol11 = Symbol.for(marker11);
var _a11;
var _b11;
var NoSuchModelError = class extends (_b11 = AISDKError, _a11 = symbol11, _b11) {
	constructor({ errorName = name10, modelId, modelType, message = `No such ${modelType}: ${modelId}` }) {
		super({
			name: errorName,
			message
		});
		this[_a11] = true;
		this.modelId = modelId;
		this.modelType = modelType;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker11);
	}
};
var name13 = "AI_TypeValidationError";
var marker14 = `vercel.ai.error.${name13}`;
var symbol14 = Symbol.for(marker14);
var _a14;
var _b14;
var TypeValidationError = class _TypeValidationError extends (_b14 = AISDKError, _a14 = symbol14, _b14) {
	constructor({ value, cause, context }) {
		let contextPrefix = "Type validation failed";
		if (context == null ? void 0 : context.field) contextPrefix += ` for ${context.field}`;
		if ((context == null ? void 0 : context.entityName) || (context == null ? void 0 : context.entityId)) {
			contextPrefix += " (";
			const parts = [];
			if (context.entityName) parts.push(context.entityName);
			if (context.entityId) parts.push(`id: "${context.entityId}"`);
			contextPrefix += parts.join(", ");
			contextPrefix += ")";
		}
		super({
			name: name13,
			message: `${contextPrefix}: Value: ${JSON.stringify(value)}.
Error message: ${getErrorMessage(cause)}`,
			cause
		});
		this[_a14] = true;
		this.value = value;
		this.context = context;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker14);
	}
	static wrap({ value, cause, context }) {
		var _a16, _b16, _c;
		if (_TypeValidationError.isInstance(cause) && cause.value === value && ((_a16 = cause.context) == null ? void 0 : _a16.field) === (context == null ? void 0 : context.field) && ((_b16 = cause.context) == null ? void 0 : _b16.entityName) === (context == null ? void 0 : context.entityName) && ((_c = cause.context) == null ? void 0 : _c.entityId) === (context == null ? void 0 : context.entityId)) return cause;
		return new _TypeValidationError({
			value,
			cause,
			context
		});
	}
};
var name14 = "AI_UnsupportedFunctionalityError";
var marker15 = `vercel.ai.error.${name14}`;
var symbol15 = Symbol.for(marker15);
var _a15;
var _b15;
var UnsupportedFunctionalityError = class extends (_b15 = AISDKError, _a15 = symbol15, _b15) {
	constructor({ functionality, message = `'${functionality}' functionality not supported.` }) {
		super({
			name: name14,
			message
		});
		this[_a15] = true;
		this.functionality = functionality;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker15);
	}
};
Object.freeze({ status: "aborted" });
function $constructor(name, initializer, params) {
	function init(inst, def) {
		var _a;
		Object.defineProperty(inst, "_zod", {
			value: inst._zod ?? {},
			enumerable: false
		});
		(_a = inst._zod).traits ?? (_a.traits = new Set());
		inst._zod.traits.add(name);
		initializer(inst, def);
		for (const k in _.prototype) if (!(k in inst)) Object.defineProperty(inst, k, { value: _.prototype[k].bind(inst) });
		inst._zod.constr = _;
		inst._zod.def = def;
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		var _a;
		const inst = params?.Parent ? new Definition() : this;
		init(inst, def);
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		for (const fn of inst._zod.deferred) fn();
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
const globalConfig = {};
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array, separator = "|") {
	return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
function cached(getter) {
	return { get value() {
		{
			const value = getter();
			Object.defineProperty(this, "value", { value });
			return value;
		}
	} };
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const valDecCount = (val.toString().split(".")[1] || "").length;
	const stepDecCount = (step.toString().split(".")[1] || "").length;
	const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
	return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
}
function defineLazy(object, key, getter) {
	Object.defineProperty(object, key, {
		get() {
			{
				const value = getter();
				object[key] = value;
				return value;
			}
		},
		set(v) {
			Object.defineProperty(object, key, { value: v });
		},
		configurable: true
	});
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
function esc(str) {
	return JSON.stringify(str);
}
const captureStackTrace = Error.captureStackTrace ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = cached(() => {
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
const propertyKeyTypes = new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
	});
}
const NUMBER_FORMAT_RANGES = {
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick(schema, mask) {
	const newShape = {};
	const currDef = schema._zod.def;
	for (const key in mask) {
		if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
		if (!mask[key]) continue;
		newShape[key] = currDef.shape[key];
	}
	return clone(schema, {
		...schema._zod.def,
		shape: newShape,
		checks: []
	});
}
function omit(schema, mask) {
	const newShape = { ...schema._zod.def.shape };
	const currDef = schema._zod.def;
	for (const key in mask) {
		if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
		if (!mask[key]) continue;
		delete newShape[key];
	}
	return clone(schema, {
		...schema._zod.def,
		shape: newShape,
		checks: []
	});
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	return clone(schema, {
		...schema._zod.def,
		get shape() {
			const _shape = {
				...schema._zod.def.shape,
				...shape
			};
			assignProp(this, "shape", _shape);
			return _shape;
		},
		checks: []
	});
}
function merge$1(a, b) {
	return clone(a, {
		...a._zod.def,
		get shape() {
			const _shape = {
				...a._zod.def.shape,
				...b._zod.def.shape
			};
			assignProp(this, "shape", _shape);
			return _shape;
		},
		catchall: b._zod.def.catchall,
		checks: []
	});
}
function partial(Class, schema, mask) {
	const oldShape = schema._zod.def.shape;
	const shape = { ...oldShape };
	if (mask) for (const key in mask) {
		if (!(key in oldShape)) throw new Error(`Unrecognized key: "${key}"`);
		if (!mask[key]) continue;
		shape[key] = Class ? new Class({
			type: "optional",
			innerType: oldShape[key]
		}) : oldShape[key];
	}
	else for (const key in oldShape) shape[key] = Class ? new Class({
		type: "optional",
		innerType: oldShape[key]
	}) : oldShape[key];
	return clone(schema, {
		...schema._zod.def,
		shape,
		checks: []
	});
}
function required(Class, schema, mask) {
	const oldShape = schema._zod.def.shape;
	const shape = { ...oldShape };
	if (mask) for (const key in mask) {
		if (!(key in shape)) throw new Error(`Unrecognized key: "${key}"`);
		if (!mask[key]) continue;
		shape[key] = new Class({
			type: "nonoptional",
			innerType: oldShape[key]
		});
	}
	else for (const key in oldShape) shape[key] = new Class({
		type: "nonoptional",
		innerType: oldShape[key]
	});
	return clone(schema, {
		...schema._zod.def,
		shape,
		checks: []
	});
}
function aborted(x, startIndex = 0) {
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
	const full = {
		...iss,
		path: iss.path ?? []
	};
	if (!iss.message) full.message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	delete full.inst;
	delete full.continue;
	if (!ctx?.reportInput) delete full.input;
	return full;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
const initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	Object.defineProperty(inst, "_zod", {
		value: inst._zod,
		enumerable: false
	});
	Object.defineProperty(inst, "issues", {
		value: def,
		enumerable: false
	});
	Object.defineProperty(inst, "message", {
		get() {
			return JSON.stringify(def, jsonStringifyReplacer, 2);
		},
		enumerable: true
	});
	Object.defineProperty(inst, "toString", {
		value: () => inst.message,
		enumerable: false
	});
};
const $ZodError = $constructor("$ZodError", initializer$1);
const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) {
		fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
		fieldErrors[sub.path[0]].push(mapper(sub));
	} else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, _mapper) {
	const mapper = _mapper || function(issue) {
		return issue.message;
	};
	const fieldErrors = { _errors: [] };
	const processError = (error) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues });
		else if (issue.code === "invalid_element") processError({ issues: issue.issues });
		else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
		else {
			let curr = fieldErrors;
			let i = 0;
			while (i < issue.path.length) {
				const el = issue.path[i];
				if (!(i === issue.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
				else {
					curr[el] = curr[el] || { _errors: [] };
					curr[el]._errors.push(mapper(issue));
				}
				curr = curr[el];
				i++;
			}
		}
	};
	processError(error);
	return fieldErrors;
}
const _parse$1 = (_Err) => (schema, value, _ctx, _params) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	if (result.issues.length) {
		const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, _params?.callee);
		throw e;
	}
	return result.value;
};
const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	if (result.issues.length) {
		const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, params?.callee);
		throw e;
	}
	return result.value;
};
const _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? {
		success: false,
		error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
const safeParse$1 = _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? {
		success: false,
		error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
const safeParseAsync$1 = _safeParseAsync($ZodRealError);
const cuid = /^[cC][^\s-]{8,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
const duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
const uuid = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^[A-Za-z0-9_-]*$/;
const hostname = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
const e164 = /^\+(?:[0-9]){6,14}[0-9]$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
const date$1 = new RegExp(`^${dateSource}$`);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time$1(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime$1(args) {
	const time = timeSource({ precision: args.precision });
	const opts = ["Z"];
	if (args.local) opts.push("");
	if (args.offset) opts.push(`([+-]\\d{2}:\\d{2})`);
	const timeRegex = `${time}(?:${opts.join("|")})`;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const string$1 = (params) => {
	const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
	return new RegExp(`^${regex}$`);
};
const integer = /^\d+$/;
const number$1 = /^-?\d+(?:\.\d+)?/i;
const boolean$1 = /true|false/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
const $ZodCheck = $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
const numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
const $ZodCheckLessThan = $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
		if (def.value < curr) if (def.inclusive) bag.maximum = def.value;
		else bag.exclusiveMaximum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckGreaterThan = $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
		if (def.value > curr) if (def.inclusive) bag.minimum = def.value;
		else bag.exclusiveMinimum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMultipleOf = $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst) => {
		var _a;
		(_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
	});
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckNumberFormat = $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = def.format;
		bag.minimum = minimum;
		bag.maximum = maximum;
		if (isInt) bag.pattern = integer;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inst
		});
	};
});
const $ZodCheckMaxLength = $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
		if (def.maximum < curr) inst._zod.bag.maximum = def.maximum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMinLength = $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
		if (def.minimum > curr) inst._zod.bag.minimum = def.minimum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLengthEquals = $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.minimum = def.length;
		bag.maximum = def.length;
		bag.length = def.length;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		const length = input.length;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStringFormat = $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = def.format;
		if (def.pattern) {
			bag.patterns ?? (bag.patterns = new Set());
			bag.patterns.add(def.pattern);
		}
	});
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
const $ZodCheckRegex = $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLowerCase = $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
	def.pattern = pattern;
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStartsWith = $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckEndsWith = $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckOverwrite = $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
var Doc = class {
	constructor(args = []) {
		this.content = [];
		this.indent = 0;
		if (this) this.args = args;
	}
	indented(fn) {
		this.indent += 1;
		fn(this);
		this.indent -= 1;
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const args = this?.args;
		const lines = [...(this?.content ?? [``]).map((x) => `  ${x}`)];
		return new F(...args, lines.join("\n"));
	}
};
const version = {
	major: 4,
	minor: 0,
	patch: 0
};
const $ZodType = $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const checks = [...inst._zod.def.checks ?? []];
	if (inst._zod.traits.has("$ZodCheck")) checks.unshift(inst);
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		inst._zod.run = (payload, ctx) => {
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
	inst["~standard"] = {
		validate: (value) => {
			try {
				const r = safeParse$1(inst, value);
				return r.success ? { value: r.data } : { issues: r.error?.issues };
			} catch (_) {
				return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
			}
		},
		vendor: "zod",
		version: 1
	};
});
const $ZodString = $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodStringFormat = $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
const $ZodGUID = $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
const $ZodUUID = $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
const $ZodEmail = $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
const $ZodURL = $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const orig = payload.value;
			const url = new URL(orig);
			const href = url.href;
			if (def.hostname) {
				def.hostname.lastIndex = 0;
				if (!def.hostname.test(url.hostname)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid hostname",
					pattern: hostname.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (def.protocol) {
				def.protocol.lastIndex = 0;
				if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid protocol",
					pattern: def.protocol.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (!orig.endsWith("/") && href.endsWith("/")) payload.value = href.slice(0, -1);
			else payload.value = href;
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodEmoji = $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
const $ZodNanoID = $constructor("$ZodNanoID", (inst, def) => {
	def.pattern ?? (def.pattern = nanoid);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID = $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
const $ZodULID = $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
const $ZodXID = $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
const $ZodKSUID = $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime$1(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODate = $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodISOTime = $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time$1(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODuration = $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = `ipv4`;
	});
});
const $ZodIPv6 = $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = `ipv6`;
	});
	inst._zod.check = (payload) => {
		try {
			new URL(`http://[${payload.value}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "ipv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodCIDRv4 = $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
const $ZodCIDRv6 = $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		const [address, prefix] = payload.value.split("/");
		try {
			if (!prefix) throw new Error();
			const prefixNum = Number(prefix);
			if (`${prefixNum}` !== prefix) throw new Error();
			if (prefixNum < 0 || prefixNum > 128) throw new Error();
			new URL(`http://[${address}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "cidrv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
const $ZodBase64 = $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64);
	$ZodStringFormat.init(inst, def);
	inst._zod.onattach.push((inst) => {
		inst._zod.bag.contentEncoding = "base64";
	});
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64URL(data) {
	if (!base64url.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
const $ZodBase64URL = $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64url);
	$ZodStringFormat.init(inst, def);
	inst._zod.onattach.push((inst) => {
		inst._zod.bag.contentEncoding = "base64url";
	});
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodE164 = $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
const $ZodJWT = $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodNumber = $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
const $ZodNumberFormat = $constructor("$ZodNumber", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
const $ZodBoolean = $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodUnknown = $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodNever = $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
const $ZodArray = $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = Array(input.length);
		const proms = [];
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else handleArrayResult(result, payload, i);
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handleObjectResult(result, final, key) {
	if (result.issues.length) final.issues.push(...prefixIssues(key, result.issues));
	final.value[key] = result.value;
}
function handleOptionalObjectResult(result, final, key, input) {
	if (result.issues.length) if (input[key] === void 0) if (key in input) final.value[key] = void 0;
	else final.value[key] = result.value;
	else final.issues.push(...prefixIssues(key, result.issues));
	else if (result.value === void 0) {
		if (key in input) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
const $ZodObject = $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	const _normalized = cached(() => {
		const keys = Object.keys(def.shape);
		for (const k of keys) if (!(def.shape[k] instanceof $ZodType)) throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
		const okeys = optionalKeys(def.shape);
		return {
			shape: def.shape,
			keys,
			keySet: new Set(keys),
			numKeys: keys.length,
			optionalKeys: new Set(okeys)
		};
	});
	defineLazy(inst._zod, "propValues", () => {
		const shape = def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				propValues[key] ?? (propValues[key] = new Set());
				for (const v of field.values) propValues[key].add(v);
			}
		}
		return propValues;
	});
	const generateFastpass = (shape) => {
		const doc = new Doc([
			"shape",
			"payload",
			"ctx"
		]);
		const normalized = _normalized.value;
		const parseStr = (key) => {
			const k = esc(key);
			return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		};
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.keys) ids[key] = `key_${counter++}`;
		doc.write(`const newResult = {}`);
		for (const key of normalized.keys) if (normalized.optionalKeys.has(key)) {
			const id = ids[key];
			doc.write(`const ${id} = ${parseStr(key)};`);
			const k = esc(key);
			doc.write(`
        if (${id}.issues.length) {
          if (input[${k}] === undefined) {
            if (${k} in input) {
              newResult[${k}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              ${id}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [${k}, ...iss.path] : [${k}],
              }))
            );
          }
        } else if (${id}.value === undefined) {
          if (${k} in input) newResult[${k}] = undefined;
        } else {
          newResult[${k}] = ${id}.value;
        }
        `);
		} else {
			const id = ids[key];
			doc.write(`const ${id} = ${parseStr(key)};`);
			doc.write(`
          if (${id}.issues.length) payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${esc(key)}, ...iss.path] : [${esc(key)}]
          })));`);
			doc.write(`newResult[${esc(key)}] = ${id}.value`);
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		const fn = doc.compile();
		return (payload, ctx) => fn(shape, payload, ctx);
	};
	let fastpass;
	const isObject$1 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		const proms = [];
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
		} else {
			payload.value = {};
			const shape = value.shape;
			for (const key of value.keys) {
				const el = shape[key];
				const r = el._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				const isOptional = el._zod.optin === "optional" && el._zod.optout === "optional";
				if (r instanceof Promise) proms.push(r.then((r) => isOptional ? handleOptionalObjectResult(r, payload, key, input) : handleObjectResult(r, payload, key)));
				else if (isOptional) handleOptionalObjectResult(r, payload, key, input);
				else handleObjectResult(r, payload, key);
			}
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		const unrecognized = [];
		const keySet = value.keySet;
		const _catchall = catchall._zod;
		const t = _catchall.def.type;
		for (const key of Object.keys(input)) {
			if (keySet.has(key)) continue;
			if (t === "never") {
				unrecognized.push(key);
				continue;
			}
			const r = _catchall.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handleObjectResult(r, payload, key)));
			else handleObjectResult(r, payload, key);
		}
		if (unrecognized.length) payload.issues.push({
			code: "unrecognized_keys",
			keys: unrecognized,
			input,
			inst
		});
		if (!proms.length) return payload;
		return Promise.all(proms).then(() => {
			return payload;
		});
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
const $ZodUnion = $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "values", () => {
		if (def.options.every((o) => o._zod.values)) return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazy(inst._zod, "pattern", () => {
		if (def.options.every((o) => o._zod.pattern)) {
			const patterns = def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	inst._zod.parse = (payload, ctx) => {
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
const $ZodIntersection = $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		for (const key of sharedKeys) {
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	if (left.issues.length) result.issues.push(...left.issues);
	if (right.issues.length) result.issues.push(...right.issues);
	if (aborted(result)) return result;
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	result.value = merged.data;
	return result;
}
const $ZodEnum = $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	inst._zod.values = new Set(values);
	inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (inst._zod.values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodLiteral = $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.values = new Set(def.values);
	inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? o.toString() : String(o)).join("|")})$`);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (inst._zod.values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodTransform = $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		const _out = def.transform(payload.value, payload);
		if (_ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
const $ZodOptional = $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	inst._zod.optout = "optional";
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, void 0]) : void 0;
	});
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (def.innerType._zod.optin === "optional") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNullable = $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodDefault = $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
const $ZodPrefault = $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNonOptional = $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => {
		const v = def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
const $ZodCatch = $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => {
			payload.value = result.value;
			if (result.issues.length) {
				payload.value = def.catchValue({
					...payload,
					error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
					input: payload.value
				});
				payload.issues = [];
			}
			return payload;
		});
		payload.value = result.value;
		if (result.issues.length) {
			payload.value = def.catchValue({
				...payload,
				error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
				input: payload.value
			});
			payload.issues = [];
		}
		return payload;
	};
});
const $ZodPipe = $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => def.in._zod.values);
	defineLazy(inst._zod, "optin", () => def.in._zod.optin);
	defineLazy(inst._zod, "optout", () => def.out._zod.optout);
	inst._zod.parse = (payload, ctx) => {
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def, ctx));
		return handlePipeResult(left, def, ctx);
	};
});
function handlePipeResult(left, def, ctx) {
	if (aborted(left)) return left;
	return def.out._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
const $ZodReadonly = $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	payload.value = Object.freeze(payload.value);
	return payload;
}
const $ZodCustom = $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
const parsedType = (data) => {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "NaN" : "number";
		case "object":
			if (Array.isArray(data)) return "array";
			if (data === null) return "null";
			if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) return data.constructor.name;
	}
	return t;
};
const error = () => {
	const Sizable = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const Nouns = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		jwt: "JWT",
		template_literal: "input"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": return `Invalid input: expected ${issue.expected}, received ${parsedType(issue.input)}`;
			case "invalid_value":
				if (issue.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
				return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Invalid string: must start with "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Invalid string: must end with "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Invalid string: must include "${_issue.includes}"`;
				if (_issue.format === "regex") return `Invalid string: must match pattern ${_issue.pattern}`;
				return `Invalid ${Nouns[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${issue.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${issue.origin}`;
			case "invalid_union": return "Invalid input";
			case "invalid_element": return `Invalid value in ${issue.origin}`;
			default: return `Invalid input`;
		}
	};
};
function en_default() {
	return { localeError: error() };
}
var $ZodRegistry = class {
	constructor() {
		this._map = new Map();
		this._idmap = new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) {
			if (this._idmap.has(meta.id)) throw new Error(`ID ${meta.id} already exists in the registry`);
			this._idmap.set(meta.id, schema);
		}
		return this;
	}
	clear() {
		this._map = new Map();
		this._idmap = new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			return {
				...pm,
				...this._map.get(schema)
			};
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
const globalRegistry = registry();
function _string(Class, params) {
	return new Class({
		type: "string",
		...normalizeParams(params)
	});
}
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
function _number(Class, params) {
	return new Class({
		type: "number",
		checks: [],
		...normalizeParams(params)
	});
}
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
function _normalize(form) {
	return _overwrite((input) => input.normalize(form));
}
function _trim() {
	return _overwrite((input) => input.trim());
}
function _toLowerCase() {
	return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
	return _overwrite((input) => input.toUpperCase());
}
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
var JSONSchemaGenerator = class {
	constructor(params) {
		this.counter = 0;
		this.metadataRegistry = params?.metadata ?? globalRegistry;
		this.target = params?.target ?? "draft-2020-12";
		this.unrepresentable = params?.unrepresentable ?? "throw";
		this.override = params?.override ?? (() => {});
		this.io = params?.io ?? "output";
		this.seen = new Map();
	}
	process(schema, _params = {
		path: [],
		schemaPath: []
	}) {
		var _a;
		const def = schema._zod.def;
		const formatMap = {
			guid: "uuid",
			url: "uri",
			datetime: "date-time",
			json_string: "json-string",
			regex: ""
		};
		const seen = this.seen.get(schema);
		if (seen) {
			seen.count++;
			if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
			return seen.schema;
		}
		const result = {
			schema: {},
			count: 1,
			cycle: void 0,
			path: _params.path
		};
		this.seen.set(schema, result);
		const overrideSchema = schema._zod.toJSONSchema?.();
		if (overrideSchema) result.schema = overrideSchema;
		else {
			const params = {
				..._params,
				schemaPath: [..._params.schemaPath, schema],
				path: _params.path
			};
			const parent = schema._zod.parent;
			if (parent) {
				result.ref = parent;
				this.process(parent, params);
				this.seen.get(parent).isParent = true;
			} else {
				const _json = result.schema;
				switch (def.type) {
					case "string": {
						const json = _json;
						json.type = "string";
						const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
						if (typeof minimum === "number") json.minLength = minimum;
						if (typeof maximum === "number") json.maxLength = maximum;
						if (format) {
							json.format = formatMap[format] ?? format;
							if (json.format === "") delete json.format;
						}
						if (contentEncoding) json.contentEncoding = contentEncoding;
						if (patterns && patterns.size > 0) {
							const regexes = [...patterns];
							if (regexes.length === 1) json.pattern = regexes[0].source;
							else if (regexes.length > 1) result.schema.allOf = [...regexes.map((regex) => ({
								...this.target === "draft-7" ? { type: "string" } : {},
								pattern: regex.source
							}))];
						}
						break;
					}
					case "number": {
						const json = _json;
						const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
						if (typeof format === "string" && format.includes("int")) json.type = "integer";
						else json.type = "number";
						if (typeof exclusiveMinimum === "number") json.exclusiveMinimum = exclusiveMinimum;
						if (typeof minimum === "number") {
							json.minimum = minimum;
							if (typeof exclusiveMinimum === "number") if (exclusiveMinimum >= minimum) delete json.minimum;
							else delete json.exclusiveMinimum;
						}
						if (typeof exclusiveMaximum === "number") json.exclusiveMaximum = exclusiveMaximum;
						if (typeof maximum === "number") {
							json.maximum = maximum;
							if (typeof exclusiveMaximum === "number") if (exclusiveMaximum <= maximum) delete json.maximum;
							else delete json.exclusiveMaximum;
						}
						if (typeof multipleOf === "number") json.multipleOf = multipleOf;
						break;
					}
					case "boolean": {
						const json = _json;
						json.type = "boolean";
						break;
					}
					case "bigint":
						if (this.unrepresentable === "throw") throw new Error("BigInt cannot be represented in JSON Schema");
						break;
					case "symbol":
						if (this.unrepresentable === "throw") throw new Error("Symbols cannot be represented in JSON Schema");
						break;
					case "null":
						_json.type = "null";
						break;
					case "any": break;
					case "unknown": break;
					case "undefined":
						if (this.unrepresentable === "throw") throw new Error("Undefined cannot be represented in JSON Schema");
						break;
					case "void":
						if (this.unrepresentable === "throw") throw new Error("Void cannot be represented in JSON Schema");
						break;
					case "never":
						_json.not = {};
						break;
					case "date":
						if (this.unrepresentable === "throw") throw new Error("Date cannot be represented in JSON Schema");
						break;
					case "array": {
						const json = _json;
						const { minimum, maximum } = schema._zod.bag;
						if (typeof minimum === "number") json.minItems = minimum;
						if (typeof maximum === "number") json.maxItems = maximum;
						json.type = "array";
						json.items = this.process(def.element, {
							...params,
							path: [...params.path, "items"]
						});
						break;
					}
					case "object": {
						const json = _json;
						json.type = "object";
						json.properties = {};
						const shape = def.shape;
						for (const key in shape) json.properties[key] = this.process(shape[key], {
							...params,
							path: [
								...params.path,
								"properties",
								key
							]
						});
						const allKeys = new Set(Object.keys(shape));
						const requiredKeys = new Set([...allKeys].filter((key) => {
							const v = def.shape[key]._zod;
							if (this.io === "input") return v.optin === void 0;
							else return v.optout === void 0;
						}));
						if (requiredKeys.size > 0) json.required = Array.from(requiredKeys);
						if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
						else if (!def.catchall) {
							if (this.io === "output") json.additionalProperties = false;
						} else if (def.catchall) json.additionalProperties = this.process(def.catchall, {
							...params,
							path: [...params.path, "additionalProperties"]
						});
						break;
					}
					case "union": {
						const json = _json;
						json.anyOf = def.options.map((x, i) => this.process(x, {
							...params,
							path: [
								...params.path,
								"anyOf",
								i
							]
						}));
						break;
					}
					case "intersection": {
						const json = _json;
						const a = this.process(def.left, {
							...params,
							path: [
								...params.path,
								"allOf",
								0
							]
						});
						const b = this.process(def.right, {
							...params,
							path: [
								...params.path,
								"allOf",
								1
							]
						});
						const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
						json.allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
						break;
					}
					case "tuple": {
						const json = _json;
						json.type = "array";
						const prefixItems = def.items.map((x, i) => this.process(x, {
							...params,
							path: [
								...params.path,
								"prefixItems",
								i
							]
						}));
						if (this.target === "draft-2020-12") json.prefixItems = prefixItems;
						else json.items = prefixItems;
						if (def.rest) {
							const rest = this.process(def.rest, {
								...params,
								path: [...params.path, "items"]
							});
							if (this.target === "draft-2020-12") json.items = rest;
							else json.additionalItems = rest;
						}
						if (def.rest) json.items = this.process(def.rest, {
							...params,
							path: [...params.path, "items"]
						});
						const { minimum, maximum } = schema._zod.bag;
						if (typeof minimum === "number") json.minItems = minimum;
						if (typeof maximum === "number") json.maxItems = maximum;
						break;
					}
					case "record": {
						const json = _json;
						json.type = "object";
						json.propertyNames = this.process(def.keyType, {
							...params,
							path: [...params.path, "propertyNames"]
						});
						json.additionalProperties = this.process(def.valueType, {
							...params,
							path: [...params.path, "additionalProperties"]
						});
						break;
					}
					case "map":
						if (this.unrepresentable === "throw") throw new Error("Map cannot be represented in JSON Schema");
						break;
					case "set":
						if (this.unrepresentable === "throw") throw new Error("Set cannot be represented in JSON Schema");
						break;
					case "enum": {
						const json = _json;
						const values = getEnumValues(def.entries);
						if (values.every((v) => typeof v === "number")) json.type = "number";
						if (values.every((v) => typeof v === "string")) json.type = "string";
						json.enum = values;
						break;
					}
					case "literal": {
						const json = _json;
						const vals = [];
						for (const val of def.values) if (val === void 0) {
							if (this.unrepresentable === "throw") throw new Error("Literal `undefined` cannot be represented in JSON Schema");
						} else if (typeof val === "bigint") if (this.unrepresentable === "throw") throw new Error("BigInt literals cannot be represented in JSON Schema");
						else vals.push(Number(val));
						else vals.push(val);
						if (vals.length === 0) {} else if (vals.length === 1) {
							const val = vals[0];
							json.type = val === null ? "null" : typeof val;
							json.const = val;
						} else {
							if (vals.every((v) => typeof v === "number")) json.type = "number";
							if (vals.every((v) => typeof v === "string")) json.type = "string";
							if (vals.every((v) => typeof v === "boolean")) json.type = "string";
							if (vals.every((v) => v === null)) json.type = "null";
							json.enum = vals;
						}
						break;
					}
					case "file": {
						const json = _json;
						const file = {
							type: "string",
							format: "binary",
							contentEncoding: "binary"
						};
						const { minimum, maximum, mime } = schema._zod.bag;
						if (minimum !== void 0) file.minLength = minimum;
						if (maximum !== void 0) file.maxLength = maximum;
						if (mime) if (mime.length === 1) {
							file.contentMediaType = mime[0];
							Object.assign(json, file);
						} else json.anyOf = mime.map((m) => {
							return {
								...file,
								contentMediaType: m
							};
						});
						else Object.assign(json, file);
						break;
					}
					case "transform":
						if (this.unrepresentable === "throw") throw new Error("Transforms cannot be represented in JSON Schema");
						break;
					case "nullable":
						_json.anyOf = [this.process(def.innerType, params), { type: "null" }];
						break;
					case "nonoptional":
						this.process(def.innerType, params);
						result.ref = def.innerType;
						break;
					case "success": {
						const json = _json;
						json.type = "boolean";
						break;
					}
					case "default":
						this.process(def.innerType, params);
						result.ref = def.innerType;
						_json.default = JSON.parse(JSON.stringify(def.defaultValue));
						break;
					case "prefault":
						this.process(def.innerType, params);
						result.ref = def.innerType;
						if (this.io === "input") _json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
						break;
					case "catch": {
						this.process(def.innerType, params);
						result.ref = def.innerType;
						let catchValue;
						try {
							catchValue = def.catchValue(void 0);
						} catch {
							throw new Error("Dynamic catch values are not supported in JSON Schema");
						}
						_json.default = catchValue;
						break;
					}
					case "nan":
						if (this.unrepresentable === "throw") throw new Error("NaN cannot be represented in JSON Schema");
						break;
					case "template_literal": {
						const json = _json;
						const pattern = schema._zod.pattern;
						if (!pattern) throw new Error("Pattern not found in template literal");
						json.type = "string";
						json.pattern = pattern.source;
						break;
					}
					case "pipe": {
						const innerType = this.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
						this.process(innerType, params);
						result.ref = innerType;
						break;
					}
					case "readonly":
						this.process(def.innerType, params);
						result.ref = def.innerType;
						_json.readOnly = true;
						break;
					case "promise":
						this.process(def.innerType, params);
						result.ref = def.innerType;
						break;
					case "optional":
						this.process(def.innerType, params);
						result.ref = def.innerType;
						break;
					case "lazy": {
						const innerType = schema._zod.innerType;
						this.process(innerType, params);
						result.ref = innerType;
						break;
					}
					case "custom": if (this.unrepresentable === "throw") throw new Error("Custom types cannot be represented in JSON Schema");
				}
			}
		}
		const meta = this.metadataRegistry.get(schema);
		if (meta) Object.assign(result.schema, meta);
		if (this.io === "input" && isTransforming(schema)) {
			delete result.schema.examples;
			delete result.schema.default;
		}
		if (this.io === "input" && result.schema._prefault) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
		delete result.schema._prefault;
		return this.seen.get(schema).schema;
	}
	emit(schema, _params) {
		const params = {
			cycles: _params?.cycles ?? "ref",
			reused: _params?.reused ?? "inline",
			external: _params?.external ?? void 0
		};
		const root = this.seen.get(schema);
		if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
		const makeURI = (entry) => {
			const defsSegment = this.target === "draft-2020-12" ? "$defs" : "definitions";
			if (params.external) {
				const externalId = params.external.registry.get(entry[0])?.id;
				const uriGenerator = params.external.uri ?? ((id) => id);
				if (externalId) return { ref: uriGenerator(externalId) };
				const id = entry[1].defId ?? entry[1].schema.id ?? `schema${this.counter++}`;
				entry[1].defId = id;
				return {
					defId: id,
					ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}`
				};
			}
			if (entry[1] === root) return { ref: "#" };
			const defUriPrefix = `#/${defsSegment}/`;
			const defId = entry[1].schema.id ?? `__schema${this.counter++}`;
			return {
				defId,
				ref: defUriPrefix + defId
			};
		};
		const extractToDef = (entry) => {
			if (entry[1].schema.$ref) return;
			const seen = entry[1];
			const { ref, defId } = makeURI(entry);
			seen.def = { ...seen.schema };
			if (defId) seen.defId = defId;
			const schema = seen.schema;
			for (const key in schema) delete schema[key];
			schema.$ref = ref;
		};
		if (params.cycles === "throw") for (const entry of this.seen.entries()) {
			const seen = entry[1];
			if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
		}
		for (const entry of this.seen.entries()) {
			const seen = entry[1];
			if (schema === entry[0]) {
				extractToDef(entry);
				continue;
			}
			if (params.external) {
				const ext = params.external.registry.get(entry[0])?.id;
				if (schema !== entry[0] && ext) {
					extractToDef(entry);
					continue;
				}
			}
			if (this.metadataRegistry.get(entry[0])?.id) {
				extractToDef(entry);
				continue;
			}
			if (seen.cycle) {
				extractToDef(entry);
				continue;
			}
			if (seen.count > 1) {
				if (params.reused === "ref") {
					extractToDef(entry);
					continue;
				}
			}
		}
		const flattenRef = (zodSchema, params) => {
			const seen = this.seen.get(zodSchema);
			const schema = seen.def ?? seen.schema;
			const _cached = { ...schema };
			if (seen.ref === null) return;
			const ref = seen.ref;
			seen.ref = null;
			if (ref) {
				flattenRef(ref, params);
				const refSchema = this.seen.get(ref).schema;
				if (refSchema.$ref && params.target === "draft-7") {
					schema.allOf = schema.allOf ?? [];
					schema.allOf.push(refSchema);
				} else {
					Object.assign(schema, refSchema);
					Object.assign(schema, _cached);
				}
			}
			if (!seen.isParent) this.override({
				zodSchema,
				jsonSchema: schema,
				path: seen.path ?? []
			});
		};
		for (const entry of [...this.seen.entries()].reverse()) flattenRef(entry[0], { target: this.target });
		const result = {};
		if (this.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
		else if (this.target === "draft-7") result.$schema = "http://json-schema.org/draft-07/schema#";
		else console.warn(`Invalid target: ${this.target}`);
		if (params.external?.uri) {
			const id = params.external.registry.get(schema)?.id;
			if (!id) throw new Error("Schema is missing an `id` property");
			result.$id = params.external.uri(id);
		}
		Object.assign(result, root.def);
		const defs = params.external?.defs ?? {};
		for (const entry of this.seen.entries()) {
			const seen = entry[1];
			if (seen.def && seen.defId) defs[seen.defId] = seen.def;
		}
		if (params.external) {} else if (Object.keys(defs).length > 0) if (this.target === "draft-2020-12") result.$defs = defs;
		else result.definitions = defs;
		try {
			return JSON.parse(JSON.stringify(result));
		} catch (_err) {
			throw new Error("Error converting schema to JSON.");
		}
	}
};
function toJSONSchema(input, _params) {
	if (input instanceof $ZodRegistry) {
		const gen = new JSONSchemaGenerator(_params);
		const defs = {};
		for (const entry of input._idmap.entries()) {
			const [_, schema] = entry;
			gen.process(schema);
		}
		const schemas = {};
		const external = {
			registry: input,
			uri: _params?.uri,
			defs
		};
		for (const entry of input._idmap.entries()) {
			const [key, schema] = entry;
			schemas[key] = gen.emit(schema, {
				..._params,
				external
			});
		}
		if (Object.keys(defs).length > 0) schemas.__shared = { [gen.target === "draft-2020-12" ? "$defs" : "definitions"]: defs };
		return { schemas };
	}
	const gen = new JSONSchemaGenerator(_params);
	gen.process(input);
	return gen.emit(input, _params);
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	switch (def.type) {
		case "string":
		case "number":
		case "bigint":
		case "boolean":
		case "date":
		case "symbol":
		case "undefined":
		case "null":
		case "any":
		case "unknown":
		case "never":
		case "void":
		case "literal":
		case "enum":
		case "nan":
		case "file":
		case "template_literal": return false;
		case "array": return isTransforming(def.element, ctx);
		case "object":
			for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
			return false;
		case "union":
			for (const option of def.options) if (isTransforming(option, ctx)) return true;
			return false;
		case "intersection": return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
		case "tuple":
			for (const item of def.items) if (isTransforming(item, ctx)) return true;
			if (def.rest && isTransforming(def.rest, ctx)) return true;
			return false;
		case "record": return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
		case "map": return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
		case "set": return isTransforming(def.valueType, ctx);
		case "promise":
		case "optional":
		case "nonoptional":
		case "nullable":
		case "readonly": return isTransforming(def.innerType, ctx);
		case "lazy": return isTransforming(def.getter(), ctx);
		case "default": return isTransforming(def.innerType, ctx);
		case "prefault": return isTransforming(def.innerType, ctx);
		case "custom": return false;
		case "transform": return true;
		case "pipe": return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
		case "success": return false;
		case "catch": return false;
	}
	throw new Error(`Unknown schema type: ${def.type}`);
}
const ZodISODateTime = $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function datetime(params) {
	return _isoDateTime(ZodISODateTime, params);
}
const ZodISODate = $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function date(params) {
	return _isoDate(ZodISODate, params);
}
const ZodISOTime = $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function time(params) {
	return _isoTime(ZodISOTime, params);
}
const ZodISODuration = $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function duration(params) {
	return _isoDuration(ZodISODuration, params);
}
const initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	Object.defineProperties(inst, {
		format: { value: (mapper) => formatError(inst, mapper) },
		flatten: { value: (mapper) => flattenError(inst, mapper) },
		addIssue: { value: (issue) => inst.issues.push(issue) },
		addIssues: { value: (issues) => inst.issues.push(...issues) },
		isEmpty: { get() {
			return inst.issues.length === 0;
		} }
	});
};
$constructor("ZodError", initializer);
const ZodRealError = $constructor("ZodError", initializer, { Parent: Error });
const parse = _parse$1(ZodRealError);
const parseAsync = _parseAsync(ZodRealError);
const safeParse = _safeParse(ZodRealError);
const safeParseAsync = _safeParseAsync(ZodRealError);
const ZodType = $constructor("ZodType", (inst, def) => {
	$ZodType.init(inst, def);
	inst.def = def;
	Object.defineProperty(inst, "_def", { value: def });
	inst.check = (...checks) => {
		return inst.clone({
			...def,
			checks: [...def.checks ?? [], ...checks.map((ch) => typeof ch === "function" ? { _zod: {
				check: ch,
				def: { check: "custom" },
				onattach: []
			} } : ch)]
		});
	};
	inst.clone = (def, params) => clone(inst, def, params);
	inst.brand = () => inst;
	inst.register = ((reg, meta) => {
		reg.add(inst, meta);
		return inst;
	});
	inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
	inst.safeParse = (data, params) => safeParse(inst, data, params);
	inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
	inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
	inst.spa = inst.safeParseAsync;
	inst.refine = (check, params) => inst.check(refine(check, params));
	inst.superRefine = (refinement) => inst.check(superRefine(refinement));
	inst.overwrite = (fn) => inst.check(_overwrite(fn));
	inst.optional = () => optional(inst);
	inst.nullable = () => nullable(inst);
	inst.nullish = () => optional(nullable(inst));
	inst.nonoptional = (params) => nonoptional(inst, params);
	inst.array = () => array(inst);
	inst.or = (arg) => union([inst, arg]);
	inst.and = (arg) => intersection(inst, arg);
	inst.transform = (tx) => pipe(inst, transform$1(tx));
	inst.default = (def) => _default(inst, def);
	inst.prefault = (def) => prefault(inst, def);
	inst.catch = (params) => _catch(inst, params);
	inst.pipe = (target) => pipe(inst, target);
	inst.readonly = () => readonly(inst);
	inst.describe = (description) => {
		const cl = inst.clone();
		globalRegistry.add(cl, { description });
		return cl;
	};
	Object.defineProperty(inst, "description", {
		get() {
			return globalRegistry.get(inst)?.description;
		},
		configurable: true
	});
	inst.meta = (...args) => {
		if (args.length === 0) return globalRegistry.get(inst);
		const cl = inst.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	};
	inst.isOptional = () => inst.safeParse(void 0).success;
	inst.isNullable = () => inst.safeParse(null).success;
	return inst;
});
const _ZodString = $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	const bag = inst._zod.bag;
	inst.format = bag.format ?? null;
	inst.minLength = bag.minimum ?? null;
	inst.maxLength = bag.maximum ?? null;
	inst.regex = (...args) => inst.check(_regex(...args));
	inst.includes = (...args) => inst.check(_includes(...args));
	inst.startsWith = (...args) => inst.check(_startsWith(...args));
	inst.endsWith = (...args) => inst.check(_endsWith(...args));
	inst.min = (...args) => inst.check(_minLength(...args));
	inst.max = (...args) => inst.check(_maxLength(...args));
	inst.length = (...args) => inst.check(_length(...args));
	inst.nonempty = (...args) => inst.check(_minLength(1, ...args));
	inst.lowercase = (params) => inst.check(_lowercase(params));
	inst.uppercase = (params) => inst.check(_uppercase(params));
	inst.trim = () => inst.check(_trim());
	inst.normalize = (...args) => inst.check(_normalize(...args));
	inst.toLowerCase = () => inst.check(_toLowerCase());
	inst.toUpperCase = () => inst.check(_toUpperCase());
});
const ZodString = $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
	inst.email = (params) => inst.check(_email(ZodEmail, params));
	inst.url = (params) => inst.check(_url(ZodURL, params));
	inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
	inst.emoji = (params) => inst.check(_emoji(ZodEmoji, params));
	inst.guid = (params) => inst.check(_guid(ZodGUID, params));
	inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
	inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
	inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
	inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
	inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
	inst.guid = (params) => inst.check(_guid(ZodGUID, params));
	inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
	inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
	inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
	inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
	inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
	inst.xid = (params) => inst.check(_xid(ZodXID, params));
	inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
	inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
	inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
	inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
	inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
	inst.e164 = (params) => inst.check(_e164(ZodE164, params));
	inst.datetime = (params) => inst.check(datetime(params));
	inst.date = (params) => inst.check(date(params));
	inst.time = (params) => inst.check(time(params));
	inst.duration = (params) => inst.check(duration(params));
});
function string(params) {
	return _string(ZodString, params);
}
const ZodStringFormat = $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
const ZodEmail = $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodGUID = $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodUUID = $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodURL = $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmoji = $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNanoID = $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID = $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID2 = $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodULID = $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodXID = $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodKSUID = $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv4 = $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv6 = $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64 = $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64URL = $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodE164 = $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodJWT = $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNumber = $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst.gt = (value, params) => inst.check(_gt(value, params));
	inst.gte = (value, params) => inst.check(_gte(value, params));
	inst.min = (value, params) => inst.check(_gte(value, params));
	inst.lt = (value, params) => inst.check(_lt(value, params));
	inst.lte = (value, params) => inst.check(_lte(value, params));
	inst.max = (value, params) => inst.check(_lte(value, params));
	inst.int = (params) => inst.check(int(params));
	inst.safe = (params) => inst.check(int(params));
	inst.positive = (params) => inst.check(_gt(0, params));
	inst.nonnegative = (params) => inst.check(_gte(0, params));
	inst.negative = (params) => inst.check(_lt(0, params));
	inst.nonpositive = (params) => inst.check(_lte(0, params));
	inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
	inst.step = (value, params) => inst.check(_multipleOf(value, params));
	inst.finite = () => inst;
	const bag = inst._zod.bag;
	inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
	inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
	inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? .5);
	inst.isFinite = true;
	inst.format = bag.format ?? null;
});
function number(params) {
	return _number(ZodNumber, params);
}
const ZodNumberFormat = $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return _int(ZodNumberFormat, params);
}
const ZodBoolean = $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType.init(inst, def);
});
function boolean(params) {
	return _boolean(ZodBoolean, params);
}
const ZodUnknown = $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
});
function unknown() {
	return _unknown(ZodUnknown);
}
const ZodNever = $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
});
function never(params) {
	return _never(ZodNever, params);
}
const ZodArray = $constructor("ZodArray", (inst, def) => {
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst.element = def.element;
	inst.min = (minLength, params) => inst.check(_minLength(minLength, params));
	inst.nonempty = (params) => inst.check(_minLength(1, params));
	inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params));
	inst.length = (len, params) => inst.check(_length(len, params));
	inst.unwrap = () => inst.element;
});
function array(element, params) {
	return _array(ZodArray, element, params);
}
const ZodObject = $constructor("ZodObject", (inst, def) => {
	$ZodObject.init(inst, def);
	ZodType.init(inst, def);
	defineLazy(inst, "shape", () => def.shape);
	inst.keyof = () => _enum(Object.keys(inst._zod.def.shape));
	inst.catchall = (catchall) => inst.clone({
		...inst._zod.def,
		catchall
	});
	inst.passthrough = () => inst.clone({
		...inst._zod.def,
		catchall: unknown()
	});
	inst.loose = () => inst.clone({
		...inst._zod.def,
		catchall: unknown()
	});
	inst.strict = () => inst.clone({
		...inst._zod.def,
		catchall: never()
	});
	inst.strip = () => inst.clone({
		...inst._zod.def,
		catchall: void 0
	});
	inst.extend = (incoming) => {
		return extend(inst, incoming);
	};
	inst.merge = (other) => merge$1(inst, other);
	inst.pick = (mask) => pick(inst, mask);
	inst.omit = (mask) => omit(inst, mask);
	inst.partial = (...args) => partial(ZodOptional, inst, args[0]);
	inst.required = (...args) => required(ZodNonOptional, inst, args[0]);
});
function object(shape, params) {
	const def = {
		type: "object",
		get shape() {
			assignProp(this, "shape", { ...shape });
			return this.shape;
		},
		...normalizeParams(params)
	};
	return new ZodObject(def);
}
const ZodUnion = $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
const ZodIntersection = $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
const ZodEnum = $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst.enum = def.entries;
	inst.options = Object.values(def.entries);
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
	return new ZodEnum({
		type: "enum",
		entries,
		...normalizeParams(params)
	});
}
const ZodLiteral = $constructor("ZodLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodType.init(inst, def);
	inst.values = new Set(def.values);
	Object.defineProperty(inst, "value", { get() {
		if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return def.values[0];
	} });
});
function literal(value, params) {
	return new ZodLiteral({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
const ZodTransform = $constructor("ZodTransform", (inst, def) => {
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = inst);
				_issue.continue ?? (_issue.continue = true);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform$1(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
const ZodOptional = $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
const ZodNullable = $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
const ZodDefault = $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : defaultValue;
		}
	});
}
const ZodPrefault = $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : defaultValue;
		}
	});
}
const ZodNonOptional = $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
const ZodCatch = $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
	});
}
const ZodPipe = $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
const ZodReadonly = $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
const ZodCustom = $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
});
function check(fn) {
	const ch = new $ZodCheck({ check: "custom" });
	ch._zod.check = fn;
	return ch;
}
function refine(fn, _params = {}) {
	return _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
	const ch = check((payload) => {
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, ch._zod.def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	});
	return ch;
}
config(en_default());
var ParseError = class extends Error {
	constructor(message, options) {
		super(message), this.name = "ParseError", this.type = options.type, this.field = options.field, this.value = options.value, this.line = options.line;
	}
};
const LF = 10;
const CR = 13;
const SPACE = 32;
function noop(_arg) {}
function createParser(config) {
	if (typeof config == "function") throw new TypeError("`config` must be an object, got a function instead. Did you mean `createParser({onEvent: fn})`?");
	const { onEvent = noop, onError = noop, onRetry = noop, onComment, maxBufferSize } = config, pendingFragments = [];
	let pendingFragmentsLength = 0, isFirstChunk = !0, id, data = "", dataLines = 0, eventType, terminated = !1;
	function feed(chunk) {
		if (terminated) throw new Error("Cannot feed parser: it was terminated after exceeding the configured max buffer size. Call `reset()` to resume parsing.");
		if (isFirstChunk && (isFirstChunk = !1, chunk.charCodeAt(0) === 239 && chunk.charCodeAt(1) === 187 && chunk.charCodeAt(2) === 191 && (chunk = chunk.slice(3))), pendingFragments.length === 0) {
			const trailing2 = processLines(chunk);
			trailing2 !== "" && (pendingFragments.push(trailing2), pendingFragmentsLength = trailing2.length), checkBufferSize();
			return;
		}
		if (chunk.indexOf(`
`) === -1 && chunk.indexOf("\r") === -1) {
			pendingFragments.push(chunk), pendingFragmentsLength += chunk.length, checkBufferSize();
			return;
		}
		pendingFragments.push(chunk);
		const input = pendingFragments.join("");
		pendingFragments.length = 0, pendingFragmentsLength = 0;
		const trailing = processLines(input);
		trailing !== "" && (pendingFragments.push(trailing), pendingFragmentsLength = trailing.length), checkBufferSize();
	}
	function checkBufferSize() {
		maxBufferSize !== void 0 && (pendingFragmentsLength + data.length <= maxBufferSize || (terminated = !0, pendingFragments.length = 0, pendingFragmentsLength = 0, id = void 0, data = "", dataLines = 0, eventType = void 0, onError(new ParseError(`Buffered data exceeded max buffer size of ${maxBufferSize} characters`, { type: "max-buffer-size-exceeded" }))));
	}
	function processLines(chunk) {
		let searchIndex = 0;
		if (chunk.indexOf("\r") === -1) {
			let lfIndex = chunk.indexOf(`
`, searchIndex);
			for (; lfIndex !== -1;) {
				if (searchIndex === lfIndex) {
					dataLines > 0 && onEvent({
						id,
						event: eventType,
						data
					}), id = void 0, data = "", dataLines = 0, eventType = void 0, searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
					continue;
				}
				const firstCharCode = chunk.charCodeAt(searchIndex);
				if (isDataPrefix(chunk, searchIndex, firstCharCode)) {
					const valueStart = chunk.charCodeAt(searchIndex + 5) === SPACE ? searchIndex + 6 : searchIndex + 5, value = chunk.slice(valueStart, lfIndex);
					if (dataLines === 0 && chunk.charCodeAt(lfIndex + 1) === LF) {
						onEvent({
							id,
							event: eventType,
							data: value
						}), id = void 0, data = "", eventType = void 0, searchIndex = lfIndex + 2, lfIndex = chunk.indexOf(`
`, searchIndex);
						continue;
					}
					data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
				} else isEventPrefix(chunk, searchIndex, firstCharCode) ? eventType = chunk.slice(chunk.charCodeAt(searchIndex + 6) === SPACE ? searchIndex + 7 : searchIndex + 6, lfIndex) || void 0 : parseLine(chunk, searchIndex, lfIndex);
				searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
			}
			return chunk.slice(searchIndex);
		}
		for (; searchIndex < chunk.length;) {
			const crIndex = chunk.indexOf("\r", searchIndex), lfIndex = chunk.indexOf(`
`, searchIndex);
			let lineEnd = -1;
			if (crIndex !== -1 && lfIndex !== -1 ? lineEnd = crIndex < lfIndex ? crIndex : lfIndex : crIndex !== -1 ? crIndex === chunk.length - 1 ? lineEnd = -1 : lineEnd = crIndex : lfIndex !== -1 && (lineEnd = lfIndex), lineEnd === -1) break;
			parseLine(chunk, searchIndex, lineEnd), searchIndex = lineEnd + 1, chunk.charCodeAt(searchIndex - 1) === CR && chunk.charCodeAt(searchIndex) === LF && searchIndex++;
		}
		return chunk.slice(searchIndex);
	}
	function parseLine(chunk, start, end) {
		if (start === end) {
			dispatchEvent();
			return;
		}
		const firstCharCode = chunk.charCodeAt(start);
		if (isDataPrefix(chunk, start, firstCharCode)) {
			const valueStart = chunk.charCodeAt(start + 5) === SPACE ? start + 6 : start + 5, value2 = chunk.slice(valueStart, end);
			data = dataLines === 0 ? value2 : `${data}
${value2}`, dataLines++;
			return;
		}
		if (isEventPrefix(chunk, start, firstCharCode)) {
			eventType = chunk.slice(chunk.charCodeAt(start + 6) === SPACE ? start + 7 : start + 6, end) || void 0;
			return;
		}
		if (firstCharCode === 105 && chunk.charCodeAt(start + 1) === 100 && chunk.charCodeAt(start + 2) === 58) {
			const value2 = chunk.slice(chunk.charCodeAt(start + 3) === SPACE ? start + 4 : start + 3, end);
			id = value2.includes("\0") ? void 0 : value2;
			return;
		}
		if (firstCharCode === 58) {
			if (onComment) {
				const line2 = chunk.slice(start, end);
				onComment(line2.slice(chunk.charCodeAt(start + 1) === SPACE ? 2 : 1));
			}
			return;
		}
		const line = chunk.slice(start, end), fieldSeparatorIndex = line.indexOf(":");
		if (fieldSeparatorIndex === -1) {
			processField(line, "", line);
			return;
		}
		const field = line.slice(0, fieldSeparatorIndex), offset = line.charCodeAt(fieldSeparatorIndex + 1) === SPACE ? 2 : 1;
		processField(field, line.slice(fieldSeparatorIndex + offset), line);
	}
	function processField(field, value, line) {
		switch (field) {
			case "event":
				eventType = value || void 0;
				break;
			case "data":
				data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
				break;
			case "id":
				id = value.includes("\0") ? void 0 : value;
				break;
			case "retry":
				/^\d+$/.test(value) ? onRetry(parseInt(value, 10)) : onError(new ParseError(`Invalid \`retry\` value: "${value}"`, {
					type: "invalid-retry",
					value,
					line
				}));
				break;
			default: onError(new ParseError(`Unknown field "${field.length > 20 ? `${field.slice(0, 20)}\u2026` : field}"`, {
				type: "unknown-field",
				field,
				value,
				line
			}));
		}
	}
	function dispatchEvent() {
		dataLines > 0 && onEvent({
			id,
			event: eventType,
			data
		}), id = void 0, data = "", dataLines = 0, eventType = void 0;
	}
	function reset(options = {}) {
		if (options.consume && pendingFragments.length > 0) {
			const incompleteLine = pendingFragments.join("");
			parseLine(incompleteLine, 0, incompleteLine.length);
		}
		isFirstChunk = !0, id = void 0, data = "", dataLines = 0, eventType = void 0, pendingFragments.length = 0, pendingFragmentsLength = 0, terminated = !1;
	}
	return {
		feed,
		reset
	};
}
function isDataPrefix(chunk, i, firstCharCode) {
	return firstCharCode === 100 && chunk.charCodeAt(i + 1) === 97 && chunk.charCodeAt(i + 2) === 116 && chunk.charCodeAt(i + 3) === 97 && chunk.charCodeAt(i + 4) === 58;
}
function isEventPrefix(chunk, i, firstCharCode) {
	return firstCharCode === 101 && chunk.charCodeAt(i + 1) === 118 && chunk.charCodeAt(i + 2) === 101 && chunk.charCodeAt(i + 3) === 110 && chunk.charCodeAt(i + 4) === 116 && chunk.charCodeAt(i + 5) === 58;
}
var EventSourceParserStream = class extends TransformStream {
	constructor({ onError, onRetry, onComment, maxBufferSize } = {}) {
		let parser;
		super({
			start(controller) {
				parser = createParser({
					onEvent: (event) => {
						controller.enqueue(event);
					},
					onError(error) {
						typeof onError == "function" && onError(error), (onError === "terminate" || error.type === "max-buffer-size-exceeded") && controller.error(error);
					},
					onRetry,
					onComment,
					maxBufferSize
				});
			},
			transform(chunk) {
				parser.feed(chunk);
			}
		});
	}
};
const WORKFLOW_SERIALIZE = Symbol.for("workflow-serialize");
const WORKFLOW_DESERIALIZE = Symbol.for("workflow-deserialize");
function combineHeaders(...headers) {
	return headers.reduce((combinedHeaders, currentHeaders) => ({
		...combinedHeaders,
		...currentHeaders != null ? currentHeaders : {}
	}), {});
}
new TextDecoder();
var { btoa, atob: atob$1 } = globalThis;
function convertBase64ToUint8Array(base64String) {
	const latin1string = atob$1(base64String.replace(/-/g, "+").replace(/_/g, "/"));
	return Uint8Array.from(latin1string, (byte) => byte.codePointAt(0));
}
function convertUint8ArrayToBase64(array) {
	let latin1string = "";
	for (let i = 0; i < array.length; i++) latin1string += String.fromCodePoint(array[i]);
	return btoa(latin1string);
}
function convertToBase64(value) {
	return value instanceof Uint8Array ? convertUint8ArrayToBase64(value) : value;
}
function createLanguageModelResponseMetadata({ id, model, created }) {
	return {
		id: id != null ? id : void 0,
		modelId: model != null ? model : void 0,
		timestamp: created != null ? new Date(created * 1e3) : void 0
	};
}
function createNullLanguageModelUsage() {
	return {
		inputTokens: {
			total: void 0,
			noCache: void 0,
			cacheRead: void 0,
			cacheWrite: void 0
		},
		outputTokens: {
			total: void 0,
			text: void 0,
			reasoning: void 0
		},
		raw: void 0
	};
}
var imageMediaTypeSignatures = [
	{
		mediaType: "image/gif",
		bytesPrefix: [
			71,
			73,
			70
		]
	},
	{
		mediaType: "image/png",
		bytesPrefix: [
			137,
			80,
			78,
			71
		]
	},
	{
		mediaType: "image/jpeg",
		bytesPrefix: [255, 216]
	},
	{
		mediaType: "image/webp",
		bytesPrefix: [
			82,
			73,
			70,
			70,
			null,
			null,
			null,
			null,
			87,
			69,
			66,
			80
		]
	},
	{
		mediaType: "image/bmp",
		bytesPrefix: [66, 77]
	},
	{
		mediaType: "image/tiff",
		bytesPrefix: [
			73,
			73,
			42,
			0
		]
	},
	{
		mediaType: "image/tiff",
		bytesPrefix: [
			77,
			77,
			0,
			42
		]
	},
	{
		mediaType: "image/avif",
		bytesPrefix: [
			0,
			0,
			0,
			32,
			102,
			116,
			121,
			112,
			97,
			118,
			105,
			102
		]
	},
	{
		mediaType: "image/heic",
		bytesPrefix: [
			0,
			0,
			0,
			32,
			102,
			116,
			121,
			112,
			104,
			101,
			105,
			99
		]
	}
];
var documentMediaTypeSignatures = [{
	mediaType: "application/pdf",
	bytesPrefix: [
		37,
		80,
		68,
		70
	]
}];
var audioMediaTypeSignaturesWithoutMp4 = [
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 251]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 250]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 243]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 242]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 227]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 226]
	},
	{
		mediaType: "audio/wav",
		bytesPrefix: [
			82,
			73,
			70,
			70,
			null,
			null,
			null,
			null,
			87,
			65,
			86,
			69
		]
	},
	{
		mediaType: "audio/ogg",
		bytesPrefix: [
			79,
			103,
			103,
			83
		]
	},
	{
		mediaType: "audio/flac",
		bytesPrefix: [
			102,
			76,
			97,
			67
		]
	},
	{
		mediaType: "audio/aac",
		bytesPrefix: [
			64,
			21,
			0,
			0
		]
	},
	{
		mediaType: "audio/webm",
		bytesPrefix: [
			26,
			69,
			223,
			163
		]
	}
];
var audioMediaTypeSignatures = [...audioMediaTypeSignaturesWithoutMp4, {
	mediaType: "audio/mp4",
	bytesPrefix: [
		0,
		0,
		0,
		null,
		102,
		116,
		121,
		112
	]
}];
var videoMediaTypeSignatures = [
	{
		mediaType: "video/mp4",
		bytesPrefix: [
			0,
			0,
			0,
			null,
			102,
			116,
			121,
			112
		]
	},
	{
		mediaType: "video/webm",
		bytesPrefix: [
			26,
			69,
			223,
			163
		]
	},
	{
		mediaType: "video/quicktime",
		bytesPrefix: [
			0,
			0,
			0,
			20,
			102,
			116,
			121,
			112,
			113,
			116
		]
	},
	{
		mediaType: "video/x-msvideo",
		bytesPrefix: [
			82,
			73,
			70,
			70
		]
	}
];
var DEFAULT_SNIFF_BYTES = 18;
var ID3_SCAN_BYTES = 131084;
function decodePrefix(data, maxBytes) {
	if (typeof data !== "string") return data.length > maxBytes ? data.subarray(0, maxBytes) : data;
	const maxChars = Math.ceil(maxBytes / 3) * 4;
	const bytes = convertBase64ToUint8Array(data.substring(0, Math.min(data.length, maxChars)));
	return bytes.length > maxBytes ? bytes.subarray(0, maxBytes) : bytes;
}
function hasID3(bytes) {
	return bytes.length > 10 && bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51;
}
var stripID3 = (bytes) => {
	const id3Size = (bytes[6] & 127) << 21 | (bytes[7] & 127) << 14 | (bytes[8] & 127) << 7 | bytes[9] & 127;
	return bytes.subarray(id3Size + 10);
};
function detectMediaTypeBySignatures({ data, signatures }) {
	let bytes = decodePrefix(data, DEFAULT_SNIFF_BYTES);
	if (hasID3(bytes)) bytes = stripID3(decodePrefix(data, ID3_SCAN_BYTES));
	for (const signature of signatures) if (bytes.length >= signature.bytesPrefix.length && signature.bytesPrefix.every((byte, index) => byte === null || bytes[index] === byte)) return signature.mediaType;
}
var topLevelSignatureTables = {
	image: imageMediaTypeSignatures,
	audio: audioMediaTypeSignatures,
	video: videoMediaTypeSignatures,
	application: documentMediaTypeSignatures
};
function detectMediaType({ data, topLevelType }) {
	if (topLevelType === void 0) return detectMediaTypeBySignatures({
		data,
		signatures: [
			...imageMediaTypeSignatures,
			...documentMediaTypeSignatures,
			...audioMediaTypeSignaturesWithoutMp4,
			...videoMediaTypeSignatures
		]
	});
	const signatures = topLevelSignatureTables[topLevelType];
	if (signatures === void 0) return;
	return detectMediaTypeBySignatures({
		data,
		signatures
	});
}
function getTopLevelMediaType(mediaType) {
	const slashIndex = mediaType.indexOf("/");
	return slashIndex === -1 ? mediaType : mediaType.substring(0, slashIndex);
}
function isFullMediaType(mediaType) {
	const slashIndex = mediaType.indexOf("/");
	if (slashIndex === -1) return false;
	const subtype = mediaType.substring(slashIndex + 1);
	return subtype.length > 0 && subtype !== "*";
}
async function cancelResponseBody(response) {
	var _a3;
	try {
		await ((_a3 = response.body) == null ? void 0 : _a3.cancel());
	} catch (e) {}
}
var name = "AI_DownloadError";
var marker = `vercel.ai.error.${name}`;
var symbol = Symbol.for(marker);
var _a;
var _b;
var DownloadError = class extends (_b = AISDKError, _a = symbol, _b) {
	constructor({ url, statusCode, statusText, cause, message = cause == null ? `Failed to download ${url}: ${statusCode} ${statusText}` : `Failed to download ${url}: ${cause}` }) {
		super({
			name,
			message,
			cause
		});
		this[_a] = true;
		this.url = url;
		this.statusCode = statusCode;
		this.statusText = statusText;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker);
	}
};
var initialGlobalFetch = globalThis.fetch;
isNodeDefaultFetch(initialGlobalFetch);
function isNodeDefaultFetch(fetch) {
	const source = Function.prototype.toString.call(fetch);
	return source.includes("internal/deps/undici") || source.includes("lazy loading of undici");
}
var DEFAULT_MAX_DOWNLOAD_SIZE = 2147483648;
async function readResponseWithSizeLimit({ response, url, maxBytes = DEFAULT_MAX_DOWNLOAD_SIZE }) {
	const contentLength = response.headers.get("content-length");
	if (contentLength != null) {
		const length = parseInt(contentLength, 10);
		if (!isNaN(length) && length > maxBytes) {
			await cancelResponseBody(response);
			throw new DownloadError({
				url,
				message: `Download of ${url} exceeded maximum size of ${maxBytes} bytes (Content-Length: ${length}).`
			});
		}
	}
	const body = response.body;
	if (body == null) return new Uint8Array(0);
	const reader = body.getReader();
	const chunks = [];
	let totalBytes = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBytes += value.length;
			if (totalBytes > maxBytes) throw new DownloadError({
				url,
				message: `Download of ${url} exceeded maximum size of ${maxBytes} bytes.`
			});
			chunks.push(value);
		}
	} finally {
		try {
			await reader.cancel();
		} finally {
			reader.releaseLock();
		}
	}
	const result = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	return result;
}
function extractResponseHeaders(response) {
	return Object.fromEntries([...response.headers]);
}
var createIdGenerator = ({ prefix, size = 16, alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", separator = "-" } = {}) => {
	const generator = () => {
		const alphabetLength = alphabet.length;
		const chars = new Array(size);
		for (let i = 0; i < size; i++) chars[i] = alphabet[Math.random() * alphabetLength | 0];
		return chars.join("");
	};
	if (prefix == null) return generator;
	if (alphabet.includes(separator)) throw new InvalidArgumentError({
		argument: "separator",
		message: `The separator "${separator}" must not be part of the alphabet "${alphabet}".`
	});
	return () => `${prefix}${separator}${generator()}`;
};
var generateId = createIdGenerator();
function isAbortError(error) {
	return (error instanceof Error || error instanceof DOMException) && (error.name === "AbortError" || error.name === "ResponseAborted" || error.name === "TimeoutError");
}
var FETCH_FAILED_ERROR_MESSAGES = ["fetch failed", "failed to fetch"];
var BUN_ERROR_CODES = [
	"ConnectionRefused",
	"ConnectionClosed",
	"FailedToOpenSocket",
	"ECONNRESET",
	"ECONNREFUSED",
	"ETIMEDOUT",
	"EPIPE"
];
function isBunNetworkError(error) {
	if (!(error instanceof Error)) return false;
	const code = error.code;
	if (typeof code === "string" && BUN_ERROR_CODES.includes(code)) return true;
	return false;
}
function handleFetchError({ error, url, requestBodyValues }) {
	if (isAbortError(error)) return error;
	if (error instanceof TypeError && FETCH_FAILED_ERROR_MESSAGES.includes(error.message.toLowerCase())) {
		const cause = error.cause;
		if (cause != null) return new APICallError({
			message: `Cannot connect to API: ${cause.message}`,
			cause,
			url,
			requestBodyValues,
			isRetryable: true
		});
	}
	if (isBunNetworkError(error)) return new APICallError({
		message: `Cannot connect to API: ${error.message}`,
		cause: error,
		url,
		requestBodyValues,
		isRetryable: true
	});
	return error;
}
function getRuntimeEnvironmentUserAgent(globalThisAny = globalThis) {
	var _a3, _b3, _c;
	if (globalThisAny.window) return `runtime/browser`;
	if ((_a3 = globalThisAny.navigator) == null ? void 0 : _a3.userAgent) return `runtime/${globalThisAny.navigator.userAgent.toLowerCase()}`;
	if ((_c = (_b3 = globalThisAny.process) == null ? void 0 : _b3.versions) == null ? void 0 : _c.node) return `runtime/node.js/${globalThisAny.process.version.substring(0)}`;
	if (globalThisAny.EdgeRuntime) return `runtime/vercel-edge`;
	return "runtime/unknown";
}
function normalizeHeaders(headers) {
	if (headers == null) return {};
	const normalized = {};
	if (headers instanceof Headers) headers.forEach((value, key) => {
		normalized[key.toLowerCase()] = value;
	});
	else {
		if (!Array.isArray(headers)) headers = Object.entries(headers);
		for (const [key, value] of headers) if (value != null) normalized[key.toLowerCase()] = value;
	}
	return normalized;
}
function withUserAgentSuffix(headers, ...userAgentSuffixParts) {
	const normalizedHeaders = new Headers(normalizeHeaders(headers));
	const currentUserAgentHeader = normalizedHeaders.get("user-agent") || "";
	normalizedHeaders.set("user-agent", [currentUserAgentHeader, ...userAgentSuffixParts].filter(Boolean).join(" "));
	return Object.fromEntries(normalizedHeaders.entries());
}
var VERSION$2 = "5.0.20";
function loadApiKey({ apiKey, environmentVariableName, apiKeyParameterName = "apiKey", description }) {
	if (typeof apiKey === "string") return apiKey;
	if (apiKey != null) throw new LoadAPIKeyError({ message: `${description} API key must be a string.` });
	if (typeof process === "undefined") throw new LoadAPIKeyError({ message: `${description} API key is missing. Pass it using the '${apiKeyParameterName}' parameter. Environment variables are not supported in this environment.` });
	apiKey = process.env[environmentVariableName];
	if (apiKey == null) throw new LoadAPIKeyError({ message: `${description} API key is missing. Pass it using the '${apiKeyParameterName}' parameter or the ${environmentVariableName} environment variable.` });
	if (typeof apiKey !== "string") throw new LoadAPIKeyError({ message: `${description} API key must be a string. The value of the ${environmentVariableName} environment variable is not a string.` });
	return apiKey;
}
function isCustomReasoning(reasoning) {
	return reasoning !== void 0 && reasoning !== "provider-default";
}
function mapReasoningToProviderEffort({ reasoning, effortMap, warnings }) {
	const mapped = effortMap[reasoning];
	if (mapped == null) {
		warnings.push({
			type: "unsupported",
			feature: "reasoning",
			details: `reasoning "${reasoning}" is not supported by this model.`
		});
		return;
	}
	if (mapped !== reasoning) warnings.push({
		type: "compatibility",
		feature: "reasoning",
		details: `reasoning "${reasoning}" is not directly supported by this model. mapped to effort "${mapped}".`
	});
	return mapped;
}
function mediaTypeToExtension(mediaType) {
	var _a3;
	const [_type, subtype = ""] = mediaType.toLowerCase().split("/");
	return (_a3 = {
		mpeg: "mp3",
		"x-wav": "wav",
		opus: "ogg",
		mp4: "m4a",
		"x-m4a": "m4a"
	}[subtype]) != null ? _a3 : subtype;
}
var suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
var suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
function _parse(text) {
	const obj = JSON.parse(text);
	if (obj === null || typeof obj !== "object") return obj;
	if (suspectProtoRx.test(text) === false && suspectConstructorRx.test(text) === false) return obj;
	return filter(obj);
}
function filter(obj) {
	let next = [obj];
	while (next.length) {
		const nodes = next;
		next = [];
		for (const node of nodes) {
			if (Object.prototype.hasOwnProperty.call(node, "__proto__")) throw new SyntaxError("Object contains forbidden prototype property");
			if (Object.prototype.hasOwnProperty.call(node, "constructor") && node.constructor !== null && typeof node.constructor === "object" && Object.prototype.hasOwnProperty.call(node.constructor, "prototype")) throw new SyntaxError("Object contains forbidden prototype property");
			for (const key in node) {
				const value = node[key];
				if (value && typeof value === "object") next.push(value);
			}
		}
	}
	return obj;
}
function secureJsonParse(text) {
	const { stackTraceLimit } = Error;
	try {
		Error.stackTraceLimit = 0;
	} catch (e) {
		return _parse(text);
	}
	try {
		return _parse(text);
	} finally {
		Error.stackTraceLimit = stackTraceLimit;
	}
}
function addAdditionalPropertiesToJsonSchema(jsonSchema2) {
	if (jsonSchema2.type === "object" || Array.isArray(jsonSchema2.type) && jsonSchema2.type.includes("object")) {
		jsonSchema2.additionalProperties = false;
		const { properties } = jsonSchema2;
		if (properties != null) for (const key of Object.keys(properties)) properties[key] = visit(properties[key]);
	}
	if (jsonSchema2.items != null) jsonSchema2.items = Array.isArray(jsonSchema2.items) ? jsonSchema2.items.map(visit) : visit(jsonSchema2.items);
	if (jsonSchema2.anyOf != null) jsonSchema2.anyOf = jsonSchema2.anyOf.map(visit);
	if (jsonSchema2.allOf != null) jsonSchema2.allOf = jsonSchema2.allOf.map(visit);
	if (jsonSchema2.oneOf != null) jsonSchema2.oneOf = jsonSchema2.oneOf.map(visit);
	const { definitions } = jsonSchema2;
	if (definitions != null) for (const key of Object.keys(definitions)) definitions[key] = visit(definitions[key]);
	return jsonSchema2;
}
function visit(def) {
	if (typeof def === "boolean") return def;
	return addAdditionalPropertiesToJsonSchema(def);
}
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
	name: void 0,
	$refStrategy: "root",
	basePath: ["#"],
	effectStrategy: "input",
	pipeStrategy: "all",
	dateStrategy: "format:date-time",
	mapStrategy: "entries",
	removeAdditionalStrategy: "passthrough",
	allowedAdditionalProperties: true,
	rejectedAdditionalProperties: false,
	definitionPath: "definitions",
	strictUnions: false,
	definitions: {},
	errorMessages: false,
	patternStrategy: "escape",
	applyRegexFlags: false,
	emailStrategy: "format:email",
	base64Strategy: "contentEncoding:base64",
	nameStrategy: "ref"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
	...defaultOptions,
	name: options
} : {
	...defaultOptions,
	...options
};
function parseAnyDef() {
	return {};
}
function parseArrayDef(def, refs) {
	var _a3, _b3, _c;
	const res = { type: "array" };
	if (((_a3 = def.type) == null ? void 0 : _a3._def) && ((_c = (_b3 = def.type) == null ? void 0 : _b3._def) == null ? void 0 : _c.typeName) !== "ZodAny") res.items = parseDef(def.type._def, {
		...refs,
		currentPath: [...refs.currentPath, "items"]
	});
	if (def.minLength) res.minItems = def.minLength.value;
	if (def.maxLength) res.maxItems = def.maxLength.value;
	if (def.exactLength) {
		res.minItems = def.exactLength.value;
		res.maxItems = def.exactLength.value;
	}
	return res;
}
function parseBigintDef(def) {
	const res = {
		type: "integer",
		format: "int64"
	};
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "min":
			if (check.inclusive) res.minimum = check.value;
			else res.exclusiveMinimum = check.value;
			break;
		case "max":
			if (check.inclusive) res.maximum = check.value;
			else res.exclusiveMaximum = check.value;
			break;
		case "multipleOf": res.multipleOf = check.value;
	}
	return res;
}
function parseBooleanDef() {
	return { type: "boolean" };
}
function parseBrandedDef(_def, refs) {
	return parseDef(_def.type._def, refs);
}
var parseCatchDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
function parseDateDef(def, refs, overrideDateStrategy) {
	const strategy = overrideDateStrategy != null ? overrideDateStrategy : refs.dateStrategy;
	if (Array.isArray(strategy)) return { anyOf: strategy.map((item) => parseDateDef(def, refs, item)) };
	switch (strategy) {
		case "string":
		case "format:date-time": return {
			type: "string",
			format: "date-time"
		};
		case "format:date": return {
			type: "string",
			format: "date"
		};
		case "integer": return integerDateParser(def);
	}
}
var integerDateParser = (def) => {
	const res = {
		type: "integer",
		format: "unix-time"
	};
	for (const check of def.checks) switch (check.kind) {
		case "min":
			res.minimum = check.value;
			break;
		case "max": res.maximum = check.value;
	}
	return res;
};
function parseDefaultDef(_def, refs) {
	return {
		...parseDef(_def.innerType._def, refs),
		default: _def.defaultValue()
	};
}
function parseEffectsDef(_def, refs) {
	return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef();
}
function parseEnumDef(def) {
	return {
		type: "string",
		enum: Array.from(def.values)
	};
}
var isJsonSchema7AllOfType = (type) => {
	if ("type" in type && type.type === "string") return false;
	return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
	const allOf = [parseDef(def.left._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"0"
		]
	}), parseDef(def.right._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"1"
		]
	})].filter((x) => !!x);
	const mergedAllOf = [];
	allOf.forEach((schema) => {
		if (isJsonSchema7AllOfType(schema)) mergedAllOf.push(...schema.allOf);
		else {
			let nestedSchema = schema;
			if ("additionalProperties" in schema && schema.additionalProperties === false) {
				const { additionalProperties: _additionalProperties, ...rest } = schema;
				nestedSchema = rest;
			}
			mergedAllOf.push(nestedSchema);
		}
	});
	return mergedAllOf.length ? { allOf: mergedAllOf } : void 0;
}
function parseLiteralDef(def) {
	const parsedType = typeof def.value;
	if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") return { type: Array.isArray(def.value) ? "array" : "object" };
	return {
		type: parsedType === "bigint" ? "integer" : parsedType,
		const: def.value
	};
}
var emojiRegex = void 0;
var zodPatterns = {
	cuid: /^[cC][^\s-]{8,}$/,
	cuid2: /^[0-9a-z]+$/,
	ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
	email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
	emoji: () => {
		if (emojiRegex === void 0) emojiRegex = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
		return emojiRegex;
	},
	uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
	ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
	ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
	ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
	ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
	base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
	base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
	nanoid: /^[a-zA-Z0-9_-]{21}$/,
	jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
	const res = { type: "string" };
	if (def.checks) for (const check of def.checks) switch (check.kind) {
		case "min":
			res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
			break;
		case "max":
			res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
			break;
		case "email":
			switch (refs.emailStrategy) {
				case "format:email":
					addFormat(res, "email", check.message, refs);
					break;
				case "format:idn-email":
					addFormat(res, "idn-email", check.message, refs);
					break;
				case "pattern:zod": addPattern(res, zodPatterns.email, check.message, refs);
			}
			break;
		case "url":
			addFormat(res, "uri", check.message, refs);
			break;
		case "uuid":
			addFormat(res, "uuid", check.message, refs);
			break;
		case "regex":
			addPattern(res, check.regex, check.message, refs);
			break;
		case "cuid":
			addPattern(res, zodPatterns.cuid, check.message, refs);
			break;
		case "cuid2":
			addPattern(res, zodPatterns.cuid2, check.message, refs);
			break;
		case "startsWith":
			addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
			break;
		case "endsWith":
			addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
			break;
		case "datetime":
			addFormat(res, "date-time", check.message, refs);
			break;
		case "date":
			addFormat(res, "date", check.message, refs);
			break;
		case "time":
			addFormat(res, "time", check.message, refs);
			break;
		case "duration":
			addFormat(res, "duration", check.message, refs);
			break;
		case "length":
			res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
			res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
			break;
		case "includes":
			addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
			break;
		case "ip":
			if (check.version !== "v6") addFormat(res, "ipv4", check.message, refs);
			if (check.version !== "v4") addFormat(res, "ipv6", check.message, refs);
			break;
		case "base64url":
			addPattern(res, zodPatterns.base64url, check.message, refs);
			break;
		case "jwt":
			addPattern(res, zodPatterns.jwt, check.message, refs);
			break;
		case "cidr":
			if (check.version !== "v6") addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
			if (check.version !== "v4") addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
			break;
		case "emoji":
			addPattern(res, zodPatterns.emoji(), check.message, refs);
			break;
		case "ulid":
			addPattern(res, zodPatterns.ulid, check.message, refs);
			break;
		case "base64":
			switch (refs.base64Strategy) {
				case "format:binary":
					addFormat(res, "binary", check.message, refs);
					break;
				case "contentEncoding:base64":
					res.contentEncoding = "base64";
					break;
				case "pattern:zod": addPattern(res, zodPatterns.base64, check.message, refs);
			}
			break;
		case "nanoid": addPattern(res, zodPatterns.nanoid, check.message, refs);
	}
	return res;
}
function escapeLiteralCheckValue(literal, refs) {
	return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
	let result = "";
	for (let i = 0; i < source.length; i++) {
		if (!ALPHA_NUMERIC.has(source[i])) result += "\\";
		result += source[i];
	}
	return result;
}
function addFormat(schema, value, message, refs) {
	var _a3;
	if (schema.format || ((_a3 = schema.anyOf) == null ? void 0 : _a3.some((x) => x.format))) {
		if (!schema.anyOf) schema.anyOf = [];
		if (schema.format) {
			schema.anyOf.push({ format: schema.format });
			delete schema.format;
		}
		schema.anyOf.push({
			format: value,
			...message && refs.errorMessages && { errorMessage: { format: message } }
		});
	} else schema.format = value;
}
function addPattern(schema, regex, message, refs) {
	var _a3;
	if (schema.pattern || ((_a3 = schema.allOf) == null ? void 0 : _a3.some((x) => x.pattern))) {
		if (!schema.allOf) schema.allOf = [];
		if (schema.pattern) {
			schema.allOf.push({ pattern: schema.pattern });
			delete schema.pattern;
		}
		schema.allOf.push({
			pattern: stringifyRegExpWithFlags(regex, refs),
			...message && refs.errorMessages && { errorMessage: { pattern: message } }
		});
	} else schema.pattern = stringifyRegExpWithFlags(regex, refs);
}
function stringifyRegExpWithFlags(regex, refs) {
	var _a3;
	if (!refs.applyRegexFlags || !regex.flags) return regex.source;
	const flags = {
		i: regex.flags.includes("i"),
		m: regex.flags.includes("m"),
		s: regex.flags.includes("s")
	};
	const source = flags.i ? regex.source.toLowerCase() : regex.source;
	let pattern = "";
	let isEscaped = false;
	let inCharGroup = false;
	let inCharRange = false;
	for (let i = 0; i < source.length; i++) {
		if (isEscaped) {
			pattern += source[i];
			isEscaped = false;
			continue;
		}
		if (flags.i) {
			if (inCharGroup) {
				if (source[i].match(/[a-z]/)) {
					if (inCharRange) {
						pattern += source[i];
						pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
						inCharRange = false;
					} else if (source[i + 1] === "-" && ((_a3 = source[i + 2]) == null ? void 0 : _a3.match(/[a-z]/))) {
						pattern += source[i];
						inCharRange = true;
					} else pattern += `${source[i]}${source[i].toUpperCase()}`;
					continue;
				}
			} else if (source[i].match(/[a-z]/)) {
				pattern += `[${source[i]}${source[i].toUpperCase()}]`;
				continue;
			}
		}
		if (flags.m) {
			if (source[i] === "^") {
				pattern += `(^|(?<=[\r
]))`;
				continue;
			} else if (source[i] === "$") {
				pattern += `($|(?=[\r
]))`;
				continue;
			}
		}
		if (flags.s && source[i] === ".") {
			pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
			continue;
		}
		pattern += source[i];
		if (source[i] === "\\") isEscaped = true;
		else if (inCharGroup && source[i] === "]") inCharGroup = false;
		else if (!inCharGroup && source[i] === "[") inCharGroup = true;
	}
	try {
		new RegExp(pattern);
	} catch (e) {
		console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
		return regex.source;
	}
	return pattern;
}
function parseRecordDef(def, refs) {
	var _a3, _b3, _c, _d, _e, _f;
	const schema = {
		type: "object",
		additionalProperties: (_a3 = parseDef(def.valueType._def, {
			...refs,
			currentPath: [...refs.currentPath, "additionalProperties"]
		})) != null ? _a3 : refs.allowedAdditionalProperties
	};
	if (((_b3 = def.keyType) == null ? void 0 : _b3._def.typeName) === "ZodString" && ((_c = def.keyType._def.checks) == null ? void 0 : _c.length)) {
		const { type: _type, ...keyType } = parseStringDef(def.keyType._def, refs);
		return {
			...schema,
			propertyNames: keyType
		};
	} else if (((_d = def.keyType) == null ? void 0 : _d._def.typeName) === "ZodEnum") return {
		...schema,
		propertyNames: { enum: def.keyType._def.values }
	};
	else if (((_e = def.keyType) == null ? void 0 : _e._def.typeName) === "ZodBranded" && def.keyType._def.type._def.typeName === "ZodString" && ((_f = def.keyType._def.type._def.checks) == null ? void 0 : _f.length)) {
		const { type: _type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
		return {
			...schema,
			propertyNames: keyType
		};
	}
	return schema;
}
function parseMapDef(def, refs) {
	if (refs.mapStrategy === "record") return parseRecordDef(def, refs);
	return {
		type: "array",
		maxItems: 125,
		items: {
			type: "array",
			items: [parseDef(def.keyType._def, {
				...refs,
				currentPath: [
					...refs.currentPath,
					"items",
					"items",
					"0"
				]
			}) || parseAnyDef(), parseDef(def.valueType._def, {
				...refs,
				currentPath: [
					...refs.currentPath,
					"items",
					"items",
					"1"
				]
			}) || parseAnyDef()],
			minItems: 2,
			maxItems: 2
		}
	};
}
function parseNativeEnumDef(def) {
	const object = def.values;
	const actualValues = Object.keys(def.values).filter((key) => {
		return typeof object[object[key]] !== "number";
	}).map((key) => object[key]);
	const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
	return {
		type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
		enum: actualValues
	};
}
function parseNeverDef() {
	return { not: parseAnyDef() };
}
function parseNullDef() {
	return { type: "null" };
}
var primitiveMappings = {
	ZodString: "string",
	ZodNumber: "number",
	ZodBigInt: "integer",
	ZodBoolean: "boolean",
	ZodNull: "null"
};
function parseUnionDef(def, refs) {
	const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
	if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
		const types = options.reduce((types2, x) => {
			const type = primitiveMappings[x._def.typeName];
			return type && !types2.includes(type) ? [...types2, type] : types2;
		}, []);
		return { type: types.length > 1 ? types : types[0] };
	} else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
		const types = options.reduce((acc, x) => {
			const type = typeof x._def.value;
			switch (type) {
				case "string":
				case "number":
				case "boolean": return [...acc, type];
				case "bigint": return [...acc, "integer"];
				case "object": if (x._def.value === null) return [...acc, "null"];
				default: return acc;
			}
		}, []);
		if (types.length === options.length) {
			const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
			return {
				type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
				enum: options.reduce((acc, x) => {
					return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
				}, [])
			};
		}
	} else if (options.every((x) => x._def.typeName === "ZodEnum")) return {
		type: "string",
		enum: options.reduce((acc, x) => [...acc, ...x._def.values.filter((x2) => !acc.includes(x2))], [])
	};
	return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
	const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			`${i}`
		]
	})).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
	return anyOf.length ? { anyOf } : void 0;
};
function parseNullableDef(def, refs) {
	if ([
		"ZodString",
		"ZodNumber",
		"ZodBigInt",
		"ZodBoolean",
		"ZodNull"
	].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) return { type: [primitiveMappings[def.innerType._def.typeName], "null"] };
	const base = parseDef(def.innerType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			"0"
		]
	});
	return base && { anyOf: [base, { type: "null" }] };
}
function parseNumberDef(def) {
	const res = { type: "number" };
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "int":
			res.type = "integer";
			break;
		case "min":
			if (check.inclusive) res.minimum = check.value;
			else res.exclusiveMinimum = check.value;
			break;
		case "max":
			if (check.inclusive) res.maximum = check.value;
			else res.exclusiveMaximum = check.value;
			break;
		case "multipleOf": res.multipleOf = check.value;
	}
	return res;
}
function parseObjectDef(def, refs) {
	const result = {
		type: "object",
		properties: {}
	};
	const required = [];
	const shape = def.shape();
	for (const propName in shape) {
		let propDef = shape[propName];
		if (propDef === void 0 || propDef._def === void 0) continue;
		const propOptional = safeIsOptional(propDef);
		const parsedDef = parseDef(propDef._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"properties",
				propName
			],
			propertyPath: [
				...refs.currentPath,
				"properties",
				propName
			]
		});
		if (parsedDef === void 0) continue;
		result.properties[propName] = parsedDef;
		if (!propOptional) required.push(propName);
	}
	if (required.length) result.required = required;
	const additionalProperties = decideAdditionalProperties(def, refs);
	if (additionalProperties !== void 0) result.additionalProperties = additionalProperties;
	return result;
}
function decideAdditionalProperties(def, refs) {
	if (def.catchall._def.typeName !== "ZodNever") return parseDef(def.catchall._def, {
		...refs,
		currentPath: [...refs.currentPath, "additionalProperties"]
	});
	switch (def.unknownKeys) {
		case "passthrough": return refs.allowedAdditionalProperties;
		case "strict": return refs.rejectedAdditionalProperties;
		case "strip": return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
	}
}
function safeIsOptional(schema) {
	try {
		return schema.isOptional();
	} catch (e) {
		return true;
	}
}
var parseOptionalDef = (def, refs) => {
	var _a3;
	if (refs.currentPath.toString() === ((_a3 = refs.propertyPath) == null ? void 0 : _a3.toString())) return parseDef(def.innerType._def, refs);
	const innerSchema = parseDef(def.innerType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			"1"
		]
	});
	return innerSchema ? { anyOf: [{ not: parseAnyDef() }, innerSchema] } : parseAnyDef();
};
var parsePipelineDef = (def, refs) => {
	if (refs.pipeStrategy === "input") return parseDef(def.in._def, refs);
	else if (refs.pipeStrategy === "output") return parseDef(def.out._def, refs);
	const inputSchema = parseDef(def.in._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"0"
		]
	});
	return { allOf: [inputSchema, parseDef(def.out._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			inputSchema ? "1" : "0"
		]
	})].filter((schema) => schema !== void 0) };
};
function parsePromiseDef(def, refs) {
	return parseDef(def.type._def, refs);
}
function parseSetDef(def, refs) {
	const schema = {
		type: "array",
		uniqueItems: true,
		items: parseDef(def.valueType._def, {
			...refs,
			currentPath: [...refs.currentPath, "items"]
		})
	};
	if (def.minSize) schema.minItems = def.minSize.value;
	if (def.maxSize) schema.maxItems = def.maxSize.value;
	return schema;
}
function parseTupleDef(def, refs) {
	if (def.rest) return {
		type: "array",
		minItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"items",
				`${i}`
			]
		})).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
		additionalItems: parseDef(def.rest._def, {
			...refs,
			currentPath: [...refs.currentPath, "additionalItems"]
		})
	};
	else return {
		type: "array",
		minItems: def.items.length,
		maxItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"items",
				`${i}`
			]
		})).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
	};
}
function parseUndefinedDef() {
	return { not: parseAnyDef() };
}
function parseUnknownDef() {
	return parseAnyDef();
}
var parseReadonlyDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
var selectParser = (def, typeName, refs) => {
	switch (typeName) {
		case "ZodString": return parseStringDef(def, refs);
		case "ZodNumber": return parseNumberDef(def);
		case "ZodObject": return parseObjectDef(def, refs);
		case "ZodBigInt": return parseBigintDef(def);
		case "ZodBoolean": return parseBooleanDef();
		case "ZodDate": return parseDateDef(def, refs);
		case "ZodUndefined": return parseUndefinedDef();
		case "ZodNull": return parseNullDef();
		case "ZodArray": return parseArrayDef(def, refs);
		case "ZodUnion":
		case "ZodDiscriminatedUnion": return parseUnionDef(def, refs);
		case "ZodIntersection": return parseIntersectionDef(def, refs);
		case "ZodTuple": return parseTupleDef(def, refs);
		case "ZodRecord": return parseRecordDef(def, refs);
		case "ZodLiteral": return parseLiteralDef(def);
		case "ZodEnum": return parseEnumDef(def);
		case "ZodNativeEnum": return parseNativeEnumDef(def);
		case "ZodNullable": return parseNullableDef(def, refs);
		case "ZodOptional": return parseOptionalDef(def, refs);
		case "ZodMap": return parseMapDef(def, refs);
		case "ZodSet": return parseSetDef(def, refs);
		case "ZodLazy": return () => def.getter()._def;
		case "ZodPromise": return parsePromiseDef(def, refs);
		case "ZodNaN":
		case "ZodNever": return parseNeverDef();
		case "ZodEffects": return parseEffectsDef(def, refs);
		case "ZodAny": return parseAnyDef();
		case "ZodUnknown": return parseUnknownDef();
		case "ZodDefault": return parseDefaultDef(def, refs);
		case "ZodBranded": return parseBrandedDef(def, refs);
		case "ZodReadonly": return parseReadonlyDef(def, refs);
		case "ZodCatch": return parseCatchDef(def, refs);
		case "ZodPipeline": return parsePipelineDef(def, refs);
		case "ZodFunction":
		case "ZodVoid":
		case "ZodSymbol": return;
		default: return ((_) => void 0)(typeName);
	}
};
var getRelativePath = (pathA, pathB) => {
	let i = 0;
	for (; i < pathA.length && i < pathB.length; i++) if (pathA[i] !== pathB[i]) break;
	return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};
function parseDef(def, refs, forceResolution = false) {
	var _a3;
	const seenItem = refs.seen.get(def);
	if (refs.override) {
		const overrideResult = (_a3 = refs.override) == null ? void 0 : _a3.call(refs, def, refs, seenItem, forceResolution);
		if (overrideResult !== ignoreOverride) return overrideResult;
	}
	if (seenItem && !forceResolution) {
		const seenSchema = get$ref(seenItem, refs);
		if (seenSchema !== void 0) return seenSchema;
	}
	const newItem = {
		def,
		path: refs.currentPath,
		jsonSchema: void 0
	};
	refs.seen.set(def, newItem);
	const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
	const jsonSchema2 = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
	if (jsonSchema2) addMeta(def, refs, jsonSchema2);
	if (refs.postProcess) {
		const postProcessResult = refs.postProcess(jsonSchema2, def, refs);
		newItem.jsonSchema = jsonSchema2;
		return postProcessResult;
	}
	newItem.jsonSchema = jsonSchema2;
	return jsonSchema2;
}
var get$ref = (item, refs) => {
	switch (refs.$refStrategy) {
		case "root": return { $ref: item.path.join("/") };
		case "relative": return { $ref: getRelativePath(refs.currentPath, item.path) };
		case "none":
		case "seen":
			if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
				console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
				return parseAnyDef();
			}
			return refs.$refStrategy === "seen" ? parseAnyDef() : void 0;
	}
};
var addMeta = (def, refs, jsonSchema2) => {
	if (def.description) jsonSchema2.description = def.description;
	return jsonSchema2;
};
var getRefs = (options) => {
	const _options = getDefaultOptions(options);
	const currentPath = _options.name !== void 0 ? [
		..._options.basePath,
		_options.definitionPath,
		_options.name
	] : _options.basePath;
	return {
		..._options,
		currentPath,
		propertyPath: void 0,
		seen: new Map(Object.entries(_options.definitions).map(([name3, def]) => [def._def, {
			def: def._def,
			path: [
				..._options.basePath,
				_options.definitionPath,
				name3
			],
			jsonSchema: void 0
		}]))
	};
};
var zod3ToJsonSchema = (schema, options) => {
	var _a3;
	const refs = getRefs(options);
	let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name4, schema2]) => {
		var _a4;
		return {
			...acc,
			[name4]: (_a4 = parseDef(schema2._def, {
				...refs,
				currentPath: [
					...refs.basePath,
					refs.definitionPath,
					name4
				]
			}, true)) != null ? _a4 : parseAnyDef()
		};
	}, {}) : void 0;
	const name3 = typeof options === "string" ? options : (options == null ? void 0 : options.nameStrategy) === "title" ? void 0 : options == null ? void 0 : options.name;
	const main = (_a3 = parseDef(schema._def, name3 === void 0 ? refs : {
		...refs,
		currentPath: [
			...refs.basePath,
			refs.definitionPath,
			name3
		]
	}, false)) != null ? _a3 : parseAnyDef();
	const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
	if (title !== void 0) main.title = title;
	const combined = name3 === void 0 ? definitions ? {
		...main,
		[refs.definitionPath]: definitions
	} : main : {
		$ref: [
			...refs.$refStrategy === "relative" ? [] : refs.basePath,
			refs.definitionPath,
			name3
		].join("/"),
		[refs.definitionPath]: {
			...definitions,
			[name3]: main
		}
	};
	combined.$schema = "http://json-schema.org/draft-07/schema#";
	return combined;
};
var schemaSymbol = Symbol.for("vercel.ai.schema");
function lazySchema(createSchema) {
	let schema;
	return () => {
		if (schema == null) schema = createSchema();
		return schema;
	};
}
function jsonSchema(jsonSchema2, { validate } = {}) {
	return {
		[schemaSymbol]: true,
		_type: void 0,
		get jsonSchema() {
			if (typeof jsonSchema2 === "function") jsonSchema2 = jsonSchema2();
			return jsonSchema2;
		},
		validate
	};
}
function isSchema(value) {
	return typeof value === "object" && value !== null && schemaSymbol in value && value[schemaSymbol] === true && "jsonSchema" in value && "validate" in value;
}
function asSchema(schema) {
	return schema == null ? jsonSchema({
		type: "object",
		properties: {},
		additionalProperties: false
	}) : isSchema(schema) ? schema : "~standard" in schema ? schema["~standard"].vendor === "zod" ? zodSchema(schema) : standardSchema(schema) : schema();
}
function standardSchema(standardSchema2) {
	return jsonSchema(() => {
		if (!hasStandardJsonSchema(standardSchema2)) throw new Error(`Standard schema vendor '${standardSchema2["~standard"].vendor}' does not support JSON Schema conversion.`);
		return addAdditionalPropertiesToJsonSchema(standardSchema2["~standard"].jsonSchema.input({ target: "draft-07" }));
	}, { validate: async (value) => {
		const result = await standardSchema2["~standard"].validate(value);
		return "value" in result ? {
			success: true,
			value: result.value
		} : {
			success: false,
			error: new TypeValidationError({
				value,
				cause: result.issues
			})
		};
	} });
}
function hasStandardJsonSchema(schema) {
	return schema["~standard"].jsonSchema != null;
}
function zod3Schema(zodSchema2, options) {
	var _a3;
	const useReferences = (_a3 = options == null ? void 0 : options.useReferences) != null ? _a3 : false;
	return jsonSchema(() => zod3ToJsonSchema(zodSchema2, { $refStrategy: useReferences ? "root" : "none" }), { validate: async (value) => {
		const result = await zodSchema2.safeParseAsync(value);
		return result.success ? {
			success: true,
			value: result.data
		} : {
			success: false,
			error: result.error
		};
	} });
}
function zod4Schema(zodSchema2, options) {
	var _a3;
	const useReferences = (_a3 = options == null ? void 0 : options.useReferences) != null ? _a3 : false;
	return jsonSchema(() => addAdditionalPropertiesToJsonSchema(toJSONSchema(zodSchema2, {
		target: "draft-7",
		io: "input",
		reused: useReferences ? "ref" : "inline"
	})), { validate: async (value) => {
		const result = await safeParseAsync(zodSchema2, value);
		return result.success ? {
			success: true,
			value: result.data
		} : {
			success: false,
			error: result.error
		};
	} });
}
function isZod4Schema(zodSchema2) {
	return "_zod" in zodSchema2;
}
function zodSchema(zodSchema2, options) {
	if (isZod4Schema(zodSchema2)) return zod4Schema(zodSchema2, options);
	else return zod3Schema(zodSchema2, options);
}
async function validateTypes({ value, schema, context }) {
	const result = await safeValidateTypes({
		value,
		schema,
		context
	});
	if (!result.success) throw TypeValidationError.wrap({
		value,
		cause: result.error,
		context
	});
	return result.value;
}
async function safeValidateTypes({ value, schema, context }) {
	const actualSchema = asSchema(schema);
	try {
		if (actualSchema.validate == null) return {
			success: true,
			value,
			rawValue: value
		};
		const result = await actualSchema.validate(value);
		if (result.success) return {
			success: true,
			value: result.value,
			rawValue: value
		};
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: result.error,
				context
			}),
			rawValue: value
		};
	} catch (error) {
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: error,
				context
			}),
			rawValue: value
		};
	}
}
async function parseJSON({ text, schema }) {
	try {
		const value = secureJsonParse(text);
		if (schema == null) return value;
		return await validateTypes({
			value,
			schema
		});
	} catch (error) {
		if (JSONParseError.isInstance(error) || TypeValidationError.isInstance(error)) throw error;
		throw new JSONParseError({
			text,
			cause: error
		});
	}
}
async function safeParseJSON({ text, schema }) {
	try {
		const value = secureJsonParse(text);
		if (schema == null) return {
			success: true,
			value,
			rawValue: value
		};
		return await safeValidateTypes({
			value,
			schema
		});
	} catch (error) {
		return {
			success: false,
			error: JSONParseError.isInstance(error) ? error : new JSONParseError({
				text,
				cause: error
			}),
			rawValue: void 0
		};
	}
}
function parseJsonEventStream({ stream, schema }) {
	return stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).pipeThrough(new TransformStream({ async transform({ data }, controller) {
		if (data === "[DONE]") return;
		controller.enqueue(await safeParseJSON({
			text: data,
			schema
		}));
	} }));
}
async function parseProviderOptions({ provider, providerOptions, schema }) {
	if ((providerOptions == null ? void 0 : providerOptions[provider]) == null) return;
	const parsedProviderOptions = await safeValidateTypes({
		value: providerOptions[provider],
		schema
	});
	if (!parsedProviderOptions.success) throw new InvalidArgumentError({
		argument: "providerOptions",
		message: `invalid ${provider} provider options`,
		cause: parsedProviderOptions.error
	});
	return parsedProviderOptions.value;
}
var getOriginalFetch2 = () => globalThis.fetch;
var postJsonToApi = async ({ url, headers, body, failedResponseHandler, successfulResponseHandler, abortSignal, fetch }) => await postToApi({
	url,
	headers: {
		"Content-Type": "application/json",
		...headers
	},
	body: {
		content: JSON.stringify(body),
		values: body
	},
	failedResponseHandler,
	successfulResponseHandler,
	abortSignal,
	fetch
});
var postFormDataToApi = async ({ url, headers, formData, failedResponseHandler, successfulResponseHandler, abortSignal, fetch }) => await postToApi({
	url,
	headers,
	body: {
		content: formData,
		values: Object.fromEntries(formData.entries())
	},
	failedResponseHandler,
	successfulResponseHandler,
	abortSignal,
	fetch
});
var postToApi = async ({ url, headers = {}, body, successfulResponseHandler, failedResponseHandler, abortSignal, fetch = getOriginalFetch2() }) => {
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: withUserAgentSuffix(headers, `ai-sdk/provider-utils/${VERSION$2}`, getRuntimeEnvironmentUserAgent()),
			body: body.content,
			signal: abortSignal
		});
		const responseHeaders = extractResponseHeaders(response);
		if (!response.ok) {
			let errorInformation;
			try {
				errorInformation = await failedResponseHandler({
					response,
					url,
					requestBodyValues: body.values
				});
			} catch (error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
				throw new APICallError({
					message: "Failed to process error response",
					cause: error,
					statusCode: response.status,
					url,
					responseHeaders,
					requestBodyValues: body.values
				});
			}
			throw errorInformation.value;
		}
		try {
			return await successfulResponseHandler({
				response,
				url,
				requestBodyValues: body.values
			});
		} catch (error) {
			if (error instanceof Error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
			}
			throw new APICallError({
				message: "Failed to process successful response",
				cause: error,
				statusCode: response.status,
				url,
				responseHeaders,
				requestBodyValues: body.values
			});
		}
	} catch (error) {
		throw handleFetchError({
			error,
			url,
			requestBodyValues: body.values
		});
	}
};
function tool(tool2) {
	return tool2;
}
function createProviderExecutedToolFactory({ id, inputSchema, outputSchema, supportsDeferredResults }) {
	return ({ onInputStart, onInputDelta, onInputAvailable, ...args }) => tool({
		type: "provider",
		isProviderExecuted: true,
		id,
		args,
		inputSchema,
		outputSchema,
		onInputStart,
		onInputDelta,
		onInputAvailable,
		supportsDeferredResults
	});
}
function resolveFullMediaType({ part }) {
	if (isFullMediaType(part.mediaType)) return part.mediaType;
	if (part.data.type === "data") {
		const detected = detectMediaType({
			data: part.data.data,
			topLevelType: getTopLevelMediaType(part.mediaType)
		});
		if (detected) return detected;
		throw new UnsupportedFunctionalityError({ functionality: `file of media type "${part.mediaType}" must specify subtype since it could not be auto-detected` });
	}
	throw new UnsupportedFunctionalityError({ functionality: `file of media type "${part.mediaType}" must specify subtype since it is not passed as inline bytes` });
}
var textDecoder2 = new TextDecoder();
async function readResponseBodyAsText({ response, url }) {
	return textDecoder2.decode(await readResponseWithSizeLimit({
		response,
		url
	}));
}
var createJsonErrorResponseHandler = ({ errorSchema, errorToMessage, isRetryable }) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await readResponseBodyAsText({
		response,
		url
	});
	const responseHeaders = extractResponseHeaders(response);
	if (responseBody.trim() === "") return {
		responseHeaders,
		value: new APICallError({
			message: response.statusText,
			url,
			requestBodyValues,
			statusCode: response.status,
			responseHeaders,
			responseBody,
			isRetryable: isRetryable == null ? void 0 : isRetryable(response)
		})
	};
	try {
		const parsedError = await parseJSON({
			text: responseBody,
			schema: errorSchema
		});
		return {
			responseHeaders,
			value: new APICallError({
				message: errorToMessage(parsedError),
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				data: parsedError,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response, parsedError)
			})
		};
	} catch (e) {
		return {
			responseHeaders,
			value: new APICallError({
				message: response.statusText,
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response)
			})
		};
	}
};
var createEventSourceResponseHandler = (chunkSchema) => async ({ response }) => {
	const responseHeaders = extractResponseHeaders(response);
	if (response.body == null) throw new EmptyResponseBodyError({});
	return {
		responseHeaders,
		value: parseJsonEventStream({
			stream: response.body,
			schema: chunkSchema
		})
	};
};
var createJsonResponseHandler = (responseSchema) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await readResponseBodyAsText({
		response,
		url
	});
	const parsedResult = await safeParseJSON({
		text: responseBody,
		schema: responseSchema
	});
	const responseHeaders = extractResponseHeaders(response);
	if (!parsedResult.success) throw new APICallError({
		message: "Invalid JSON response",
		cause: parsedResult.error,
		statusCode: response.status,
		responseHeaders,
		responseBody,
		url,
		requestBodyValues
	});
	return {
		responseHeaders,
		value: parsedResult.value,
		rawValue: parsedResult.rawValue
	};
};
var createBinaryResponseHandler = () => async ({ response, url, requestBodyValues }) => {
	const responseHeaders = extractResponseHeaders(response);
	if (!response.body) throw new APICallError({
		message: "Response body is empty",
		url,
		requestBodyValues,
		statusCode: response.status,
		responseHeaders,
		responseBody: void 0
	});
	try {
		const buffer = await response.arrayBuffer();
		return {
			responseHeaders,
			value: new Uint8Array(buffer)
		};
	} catch (error) {
		throw new APICallError({
			message: "Failed to read response as array buffer",
			url,
			requestBodyValues,
			statusCode: response.status,
			responseHeaders,
			responseBody: void 0,
			cause: error
		});
	}
};
function isJSONSerializable(value) {
	if (value === null || value === void 0) return true;
	const type = typeof value;
	if (type === "string" || type === "number" || type === "boolean") return true;
	if (type === "function" || type === "symbol" || type === "bigint") return false;
	if (Array.isArray(value)) return value.every(isJSONSerializable);
	if (Object.getPrototypeOf(value) === Object.prototype) return Object.values(value).every(isJSONSerializable);
	return false;
}
var name2 = "AI_SerializationError";
var marker2 = `vercel.ai.error.${name2}`;
var symbol2 = Symbol.for(marker2);
var _a2;
var _b2;
var SerializationError = class extends (_b2 = AISDKError, _a2 = symbol2, _b2) {
	constructor({ message = "Failed to serialize value.", cause } = {}) {
		super({
			name: name2,
			message,
			cause
		});
		this[_a2] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker2);
	}
};
function serializeModelOptions(options) {
	const serializableConfig = {};
	for (const [key, value] of Object.entries(options.config)) if (key === "headers") {
		const resolvedHeaders = resolveSync(value);
		if (isJSONSerializable(resolvedHeaders)) serializableConfig[key] = resolvedHeaders;
	} else if (isJSONSerializable(value)) serializableConfig[key] = value;
	return {
		modelId: options.modelId,
		config: serializableConfig
	};
}
function resolveSync(value) {
	let next = value;
	if (typeof value === "function") next = value();
	if (next instanceof Promise) throw new SerializationError({ message: "Cannot serialize asynchronous model options." });
	return next;
}
var StreamingToolCallTracker = class {
	constructor(controller, options = {}) {
		this.toolCalls = [];
		var _a3, _b3;
		this.controller = controller;
		this._generateId = (_a3 = options.generateId) != null ? _a3 : generateId;
		this.typeValidation = (_b3 = options.typeValidation) != null ? _b3 : "none";
		this.extractMetadata = options.extractMetadata;
		this.buildToolCallProviderMetadata = options.buildToolCallProviderMetadata;
	}
	processDelta(toolCallDelta) {
		var _a3;
		const index = (_a3 = toolCallDelta.index) != null ? _a3 : this.toolCalls.length;
		if (this.toolCalls[index] == null) this.processNewToolCall(index, toolCallDelta);
		else this.processExistingToolCall(index, toolCallDelta);
	}
	flush() {
		for (const toolCall of this.toolCalls) if (!toolCall.hasFinished) this.finishToolCall(toolCall);
	}
	processNewToolCall(index, toolCallDelta) {
		var _a3, _b3, _c;
		if (this.typeValidation === "required") {
			if (toolCallDelta.type !== "function") throw new InvalidResponseDataError({
				data: toolCallDelta,
				message: `Expected 'function' type.`
			});
		} else if (this.typeValidation === "if-present") {
			if (toolCallDelta.type != null && toolCallDelta.type !== "function") throw new InvalidResponseDataError({
				data: toolCallDelta,
				message: `Expected 'function' type.`
			});
		}
		if (toolCallDelta.id == null) throw new InvalidResponseDataError({
			data: toolCallDelta,
			message: `Expected 'id' to be a string.`
		});
		if (((_a3 = toolCallDelta.function) == null ? void 0 : _a3.name) == null) throw new InvalidResponseDataError({
			data: toolCallDelta,
			message: `Expected 'function.name' to be a string.`
		});
		this.controller.enqueue({
			type: "tool-input-start",
			id: toolCallDelta.id,
			toolName: toolCallDelta.function.name
		});
		const metadata = (_b3 = this.extractMetadata) == null ? void 0 : _b3.call(this, toolCallDelta);
		this.toolCalls[index] = {
			id: toolCallDelta.id,
			type: "function",
			function: {
				name: toolCallDelta.function.name,
				arguments: (_c = toolCallDelta.function.arguments) != null ? _c : ""
			},
			hasFinished: false,
			metadata
		};
		const toolCall = this.toolCalls[index];
		if (toolCall.function.arguments.length > 0) this.controller.enqueue({
			type: "tool-input-delta",
			id: toolCall.id,
			delta: toolCall.function.arguments
		});
	}
	processExistingToolCall(index, toolCallDelta) {
		var _a3;
		const toolCall = this.toolCalls[index];
		if (toolCall.hasFinished) return;
		if (((_a3 = toolCallDelta.function) == null ? void 0 : _a3.arguments) != null) {
			toolCall.function.arguments += toolCallDelta.function.arguments;
			this.controller.enqueue({
				type: "tool-input-delta",
				id: toolCall.id,
				delta: toolCallDelta.function.arguments
			});
		}
	}
	finishToolCall(toolCall) {
		var _a3, _b3;
		this.controller.enqueue({
			type: "tool-input-end",
			id: toolCall.id
		});
		const providerMetadata = (_a3 = this.buildToolCallProviderMetadata) == null ? void 0 : _a3.call(this, toolCall.metadata);
		this.controller.enqueue({
			type: "tool-call",
			toolCallId: (_b3 = toolCall.id) != null ? _b3 : this._generateId(),
			toolName: toolCall.function.name,
			input: toolCall.function.arguments,
			...providerMetadata ? { providerMetadata } : {}
		});
		toolCall.hasFinished = true;
	}
};
function withoutTrailingSlash(url) {
	return url == null ? void 0 : url.replace(/\/$/, "");
}
function convertGroqUsage(usage) {
	var _a, _b, _c, _d, _e, _f;
	if (usage == null) return createNullLanguageModelUsage();
	const promptTokens = (_a = usage.prompt_tokens) != null ? _a : 0;
	const cacheReadTokens = (_c = (_b = usage.prompt_tokens_details) == null ? void 0 : _b.cached_tokens) != null ? _c : void 0;
	const completionTokens = (_d = usage.completion_tokens) != null ? _d : 0;
	const reasoningTokens = (_f = (_e = usage.completion_tokens_details) == null ? void 0 : _e.reasoning_tokens) != null ? _f : void 0;
	const textTokens = reasoningTokens != null ? completionTokens - reasoningTokens : completionTokens;
	return {
		inputTokens: {
			total: promptTokens,
			noCache: cacheReadTokens != null ? promptTokens - cacheReadTokens : promptTokens,
			cacheRead: cacheReadTokens,
			cacheWrite: void 0
		},
		outputTokens: {
			total: completionTokens,
			text: textTokens,
			reasoning: reasoningTokens
		},
		raw: usage
	};
}
function convertToGroqChatMessages(prompt) {
	var _a;
	const messages = [];
	for (const { role, content } of prompt) switch (role) {
		case "system":
			messages.push({
				role: "system",
				content
			});
			break;
		case "user":
			if (content.length === 1 && content[0].type === "text") {
				messages.push({
					role: "user",
					content: content[0].text
				});
				break;
			}
			messages.push({
				role: "user",
				content: content.map((part) => {
					switch (part.type) {
						case "text": return {
							type: "text",
							text: part.text
						};
						case "file": switch (part.data.type) {
							case "reference": throw new UnsupportedFunctionalityError({ functionality: "file parts with provider references" });
							case "text": throw new UnsupportedFunctionalityError({ functionality: "text file parts" });
							case "url":
							case "data":
								if (getTopLevelMediaType(part.mediaType) !== "image") throw new UnsupportedFunctionalityError({ functionality: "Non-image file content parts" });
								return {
									type: "image_url",
									image_url: { url: part.data.type === "url" ? part.data.url.toString() : `data:${resolveFullMediaType({ part })};base64,${convertToBase64(part.data.data)}` }
								};
						}
					}
				})
			});
			break;
		case "assistant": {
			let text = "";
			let reasoning = "";
			const toolCalls = [];
			for (const part of content) switch (part.type) {
				case "reasoning":
					reasoning += part.text;
					break;
				case "text":
					text += part.text;
					break;
				case "tool-call": toolCalls.push({
					id: part.toolCallId,
					type: "function",
					function: {
						name: part.toolName,
						arguments: JSON.stringify(part.input)
					}
				});
			}
			messages.push({
				role: "assistant",
				content: text,
				...reasoning.length > 0 ? { reasoning } : null,
				...toolCalls.length > 0 ? { tool_calls: toolCalls } : null
			});
			break;
		}
		case "tool":
			for (const toolResponse of content) {
				if (toolResponse.type === "tool-approval-response") continue;
				const output = toolResponse.output;
				let contentValue;
				switch (output.type) {
					case "text":
					case "error-text":
						contentValue = output.value;
						break;
					case "execution-denied":
						contentValue = (_a = output.reason) != null ? _a : "Tool call execution denied.";
						break;
					case "content":
					case "json":
					case "error-json": contentValue = JSON.stringify(output.value);
				}
				messages.push({
					role: "tool",
					tool_call_id: toolResponse.toolCallId,
					content: contentValue
				});
			}
			break;
		default: throw new Error(`Unsupported role: ${role}`);
	}
	return messages;
}
var groqLanguageModelChatOptions = object({
	reasoningFormat: _enum([
		"parsed",
		"raw",
		"hidden"
	]).optional(),
	reasoningEffort: _enum([
		"none",
		"default",
		"low",
		"medium",
		"high"
	]).optional(),
	parallelToolCalls: boolean().optional(),
	user: string().optional(),
	structuredOutputs: boolean().optional(),
	strictJsonSchema: boolean().optional(),
	serviceTier: _enum([
		"on_demand",
		"performance",
		"flex",
		"auto"
	]).optional()
});
var groqErrorDataSchema = object({ error: object({
	message: string(),
	type: string()
}) });
var groqFailedResponseHandler = createJsonErrorResponseHandler({
	errorSchema: groqErrorDataSchema,
	errorToMessage: (data) => data.error.message
});
var BROWSER_SEARCH_SUPPORTED_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];
function isBrowserSearchSupportedModel(modelId) {
	return BROWSER_SEARCH_SUPPORTED_MODELS.includes(modelId);
}
function getSupportedModelsString() {
	return BROWSER_SEARCH_SUPPORTED_MODELS.join(", ");
}
function prepareTools({ tools, toolChoice, modelId }) {
	tools = (tools == null ? void 0 : tools.length) ? tools : void 0;
	const toolWarnings = [];
	if (tools == null) return {
		tools: void 0,
		toolChoice: void 0,
		toolWarnings
	};
	const groqTools2 = [];
	for (const tool of tools) if (tool.type === "provider") if (tool.id === "groq.browser_search") if (!isBrowserSearchSupportedModel(modelId)) toolWarnings.push({
		type: "unsupported",
		feature: `provider-defined tool ${tool.id}`,
		details: `Browser search is only supported on the following models: ${getSupportedModelsString()}. Current model: ${modelId}`
	});
	else groqTools2.push({ type: "browser_search" });
	else toolWarnings.push({
		type: "unsupported",
		feature: `provider-defined tool ${tool.id}`
	});
	else groqTools2.push({
		type: "function",
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.inputSchema,
			...tool.strict != null ? { strict: tool.strict } : {}
		}
	});
	if (toolChoice == null) return {
		tools: groqTools2,
		toolChoice: void 0,
		toolWarnings
	};
	const type = toolChoice.type;
	switch (type) {
		case "auto":
		case "none":
		case "required": return {
			tools: groqTools2,
			toolChoice: type,
			toolWarnings
		};
		case "tool": return {
			tools: groqTools2,
			toolChoice: {
				type: "function",
				function: { name: toolChoice.toolName }
			},
			toolWarnings
		};
		default: throw new UnsupportedFunctionalityError({ functionality: `tool choice type: ${type}` });
	}
}
function mapGroqFinishReason(finishReason) {
	switch (finishReason) {
		case "stop": return "stop";
		case "length": return "length";
		case "content_filter": return "content-filter";
		case "function_call":
		case "tool_calls": return "tool-calls";
		default: return "other";
	}
}
var GroqChatLanguageModel = class _GroqChatLanguageModel {
	constructor(modelId, config) {
		this.specificationVersion = "v4";
		this.supportedUrls = { "image/*": [/^https?:\/\/.*$/] };
		this.modelId = modelId;
		this.config = config;
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _GroqChatLanguageModel(options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	async getArgs({ prompt, maxOutputTokens, temperature, topP, topK, frequencyPenalty, presencePenalty, stopSequences, responseFormat, seed, reasoning, tools, toolChoice, providerOptions }) {
		var _a, _b, _c, _d;
		const warnings = [];
		const groqOptions = await parseProviderOptions({
			provider: "groq",
			providerOptions,
			schema: groqLanguageModelChatOptions
		});
		const structuredOutputs = (_a = groqOptions == null ? void 0 : groqOptions.structuredOutputs) != null ? _a : true;
		const strictJsonSchema = (_b = groqOptions == null ? void 0 : groqOptions.strictJsonSchema) != null ? _b : true;
		if (topK != null) warnings.push({
			type: "unsupported",
			feature: "topK"
		});
		if ((responseFormat == null ? void 0 : responseFormat.type) === "json" && responseFormat.schema != null && !structuredOutputs) warnings.push({
			type: "unsupported",
			feature: "responseFormat",
			details: "JSON response format schema is only supported with structuredOutputs"
		});
		const { tools: groqTools2, toolChoice: groqToolChoice, toolWarnings } = prepareTools({
			tools,
			toolChoice,
			modelId: this.modelId
		});
		return {
			args: {
				model: this.modelId,
				user: groqOptions == null ? void 0 : groqOptions.user,
				parallel_tool_calls: groqOptions == null ? void 0 : groqOptions.parallelToolCalls,
				max_tokens: maxOutputTokens,
				temperature,
				top_p: topP,
				frequency_penalty: frequencyPenalty,
				presence_penalty: presencePenalty,
				stop: stopSequences,
				seed,
				response_format: (responseFormat == null ? void 0 : responseFormat.type) === "json" ? structuredOutputs && responseFormat.schema != null ? {
					type: "json_schema",
					json_schema: {
						schema: responseFormat.schema,
						strict: strictJsonSchema,
						name: (_c = responseFormat.name) != null ? _c : "response",
						description: responseFormat.description
					}
				} : { type: "json_object" } : void 0,
				reasoning_format: groqOptions == null ? void 0 : groqOptions.reasoningFormat,
				reasoning_effort: (_d = groqOptions == null ? void 0 : groqOptions.reasoningEffort) != null ? _d : isCustomReasoning(reasoning) && reasoning !== "none" ? mapReasoningToProviderEffort({
					reasoning,
					effortMap: {
						minimal: "low",
						low: "low",
						medium: "medium",
						high: "high",
						xhigh: "high"
					},
					warnings
				}) : void 0,
				service_tier: groqOptions == null ? void 0 : groqOptions.serviceTier,
				messages: convertToGroqChatMessages(prompt),
				tools: groqTools2,
				tool_choice: groqToolChoice
			},
			warnings: [...warnings, ...toolWarnings]
		};
	}
	async doGenerate(options) {
		var _a, _b, _c, _d;
		const { args, warnings } = await this.getArgs(options);
		const body = JSON.stringify(args);
		const { responseHeaders, value: response, rawValue: rawResponse } = await postJsonToApi({
			url: this.config.url({
				path: "/chat/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders((_b = (_a = this.config).headers) == null ? void 0 : _b.call(_a), options.headers),
			body: args,
			failedResponseHandler: groqFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(groqChatResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const choice = response.choices[0];
		const content = [];
		const text = choice.message.content;
		if (text != null && text.length > 0) content.push({
			type: "text",
			text
		});
		const reasoning = choice.message.reasoning;
		if (reasoning != null && reasoning.length > 0) content.push({
			type: "reasoning",
			text: reasoning
		});
		if (choice.message.tool_calls != null) for (const toolCall of choice.message.tool_calls) content.push({
			type: "tool-call",
			toolCallId: (_c = toolCall.id) != null ? _c : generateId(),
			toolName: toolCall.function.name,
			input: toolCall.function.arguments
		});
		return {
			content,
			finishReason: {
				unified: mapGroqFinishReason(choice.finish_reason),
				raw: (_d = choice.finish_reason) != null ? _d : void 0
			},
			usage: convertGroqUsage(response.usage),
			response: {
				...createLanguageModelResponseMetadata(response),
				headers: responseHeaders,
				body: rawResponse
			},
			warnings,
			request: { body }
		};
	}
	async doStream(options) {
		var _a, _b;
		const { args, warnings } = await this.getArgs(options);
		const body = {
			...args,
			stream: true
		};
		const { responseHeaders, value: response } = await postJsonToApi({
			url: this.config.url({
				path: "/chat/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders((_b = (_a = this.config).headers) == null ? void 0 : _b.call(_a), options.headers),
			body,
			failedResponseHandler: groqFailedResponseHandler,
			successfulResponseHandler: createEventSourceResponseHandler(groqChatChunkSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		let toolCallTracker;
		let finishReason = {
			unified: "other",
			raw: void 0
		};
		let usage = void 0;
		let isFirstChunk = true;
		let isActiveText = false;
		let isActiveReasoning = false;
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					toolCallTracker = new StreamingToolCallTracker(controller, {
						generateId,
						typeValidation: "required"
					});
					controller.enqueue({
						type: "stream-start",
						warnings
					});
				},
				transform(chunk, controller) {
					var _a2;
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = {
							unified: "error",
							raw: void 0
						};
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const value = chunk.value;
					if ("error" in value) {
						finishReason = {
							unified: "error",
							raw: void 0
						};
						controller.enqueue({
							type: "error",
							error: value.error
						});
						return;
					}
					if (isFirstChunk) {
						isFirstChunk = false;
						controller.enqueue({
							type: "response-metadata",
							...createLanguageModelResponseMetadata(value)
						});
					}
					if (((_a2 = value.x_groq) == null ? void 0 : _a2.usage) != null) usage = value.x_groq.usage;
					const choice = value.choices[0];
					if ((choice == null ? void 0 : choice.finish_reason) != null) finishReason = {
						unified: mapGroqFinishReason(choice.finish_reason),
						raw: choice.finish_reason
					};
					if ((choice == null ? void 0 : choice.delta) == null) return;
					const delta = choice.delta;
					if (delta.reasoning != null && delta.reasoning.length > 0) {
						if (!isActiveReasoning) {
							controller.enqueue({
								type: "reasoning-start",
								id: "reasoning-0"
							});
							isActiveReasoning = true;
						}
						controller.enqueue({
							type: "reasoning-delta",
							id: "reasoning-0",
							delta: delta.reasoning
						});
					}
					if (delta.content != null && delta.content.length > 0) {
						if (isActiveReasoning) {
							controller.enqueue({
								type: "reasoning-end",
								id: "reasoning-0"
							});
							isActiveReasoning = false;
						}
						if (!isActiveText) {
							controller.enqueue({
								type: "text-start",
								id: "txt-0"
							});
							isActiveText = true;
						}
						controller.enqueue({
							type: "text-delta",
							id: "txt-0",
							delta: delta.content
						});
					}
					if (delta.tool_calls != null) {
						if (isActiveReasoning) {
							controller.enqueue({
								type: "reasoning-end",
								id: "reasoning-0"
							});
							isActiveReasoning = false;
						}
						for (const toolCallDelta of delta.tool_calls) toolCallTracker.processDelta(toolCallDelta);
					}
				},
				flush(controller) {
					if (isActiveReasoning) controller.enqueue({
						type: "reasoning-end",
						id: "reasoning-0"
					});
					if (isActiveText) controller.enqueue({
						type: "text-end",
						id: "txt-0"
					});
					toolCallTracker.flush();
					controller.enqueue({
						type: "finish",
						finishReason,
						usage: convertGroqUsage(usage)
					});
				}
			})),
			request: { body: JSON.stringify(body) },
			response: { headers: responseHeaders }
		};
	}
};
var groqChatResponseSchema = object({
	id: string().nullish(),
	created: number().nullish(),
	model: string().nullish(),
	choices: array(object({
		message: object({
			content: string().nullish(),
			reasoning: string().nullish(),
			tool_calls: array(object({
				id: string().nullish(),
				type: literal("function"),
				function: object({
					name: string(),
					arguments: string()
				})
			})).nullish()
		}),
		index: number(),
		finish_reason: string().nullish()
	})),
	usage: object({
		prompt_tokens: number().nullish(),
		completion_tokens: number().nullish(),
		total_tokens: number().nullish(),
		prompt_tokens_details: object({ cached_tokens: number().nullish() }).nullish(),
		completion_tokens_details: object({ reasoning_tokens: number().nullish() }).nullish()
	}).nullish()
});
var groqChatChunkSchema = union([object({
	id: string().nullish(),
	created: number().nullish(),
	model: string().nullish(),
	choices: array(object({
		delta: object({
			content: string().nullish(),
			reasoning: string().nullish(),
			tool_calls: array(object({
				index: number(),
				id: string().nullish(),
				type: literal("function").optional(),
				function: object({
					name: string().nullish(),
					arguments: string().nullish()
				})
			})).nullish()
		}).nullish(),
		finish_reason: string().nullable().optional(),
		index: number()
	})),
	x_groq: object({ usage: object({
		prompt_tokens: number().nullish(),
		completion_tokens: number().nullish(),
		total_tokens: number().nullish(),
		prompt_tokens_details: object({ cached_tokens: number().nullish() }).nullish(),
		completion_tokens_details: object({ reasoning_tokens: number().nullish() }).nullish()
	}).nullish() }).nullish()
}), groqErrorDataSchema]);
var groqTranscriptionModelOptions = lazySchema(() => zodSchema(object({
	language: string().nullish(),
	prompt: string().nullish(),
	responseFormat: string().nullish(),
	temperature: number().min(0).max(1).nullish(),
	timestampGranularities: array(string()).nullish()
})));
var GroqTranscriptionModel = class _GroqTranscriptionModel {
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
		this.specificationVersion = "v4";
	}
	get provider() {
		return this.config.provider;
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _GroqTranscriptionModel(options.modelId, options.config);
	}
	async getArgs({ audio, mediaType, providerOptions }) {
		var _a, _b, _c, _d, _e;
		const warnings = [];
		const groqOptions = await parseProviderOptions({
			provider: "groq",
			providerOptions,
			schema: groqTranscriptionModelOptions
		});
		const formData = new FormData();
		const blob = audio instanceof Uint8Array ? new Blob([audio]) : new Blob([convertBase64ToUint8Array(audio)]);
		formData.append("model", this.modelId);
		const fileExtension = mediaTypeToExtension(mediaType);
		formData.append("file", new File([blob], "audio", { type: mediaType }), `audio.${fileExtension}`);
		if (groqOptions) {
			const transcriptionModelOptions = {
				language: (_a = groqOptions.language) != null ? _a : void 0,
				prompt: (_b = groqOptions.prompt) != null ? _b : void 0,
				response_format: (_c = groqOptions.responseFormat) != null ? _c : void 0,
				temperature: (_d = groqOptions.temperature) != null ? _d : void 0,
				timestamp_granularities: (_e = groqOptions.timestampGranularities) != null ? _e : void 0
			};
			for (const key in transcriptionModelOptions) {
				const value = transcriptionModelOptions[key];
				if (value !== void 0) if (Array.isArray(value)) for (const item of value) formData.append(`${key}[]`, String(item));
				else formData.append(key, String(value));
			}
		}
		return {
			formData,
			responseFormat: groqOptions == null ? void 0 : groqOptions.responseFormat,
			warnings
		};
	}
	async doGenerate(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
		const currentDate = (_c = (_b = (_a = this.config._internal) == null ? void 0 : _a.currentDate) == null ? void 0 : _b.call(_a)) != null ? _c : new Date();
		const { formData, responseFormat, warnings } = await this.getArgs(options);
		const successfulResponseHandler = responseFormat === "text" ? groqTextTranscriptionResponseHandler : createJsonResponseHandler(groqTranscriptionResponseSchema);
		const { value: response, responseHeaders, rawValue: rawResponse } = await postFormDataToApi({
			url: this.config.url({
				path: "/audio/transcriptions",
				modelId: this.modelId
			}),
			headers: combineHeaders((_e = (_d = this.config).headers) == null ? void 0 : _e.call(_d), options.headers),
			formData,
			failedResponseHandler: groqFailedResponseHandler,
			successfulResponseHandler,
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		return {
			text: response.text,
			segments: (_i = (_h = (_f = response.segments) == null ? void 0 : _f.map((segment) => ({
				text: segment.text,
				startSecond: segment.start,
				endSecond: segment.end
			}))) != null ? _h : (_g = response.words) == null ? void 0 : _g.map((word) => ({
				text: word.word,
				startSecond: word.start,
				endSecond: word.end
			}))) != null ? _i : [],
			language: (_j = response.language) != null ? _j : void 0,
			durationInSeconds: (_k = response.duration) != null ? _k : void 0,
			warnings,
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders,
				body: rawResponse
			}
		};
	}
};
var groqTranscriptionResponseSchema = object({
	text: string(),
	x_groq: object({ id: string() }),
	task: string().nullish(),
	language: string().nullish(),
	duration: number().nullish(),
	segments: array(object({
		id: number(),
		seek: number(),
		start: number(),
		end: number(),
		text: string(),
		tokens: array(number()),
		temperature: number(),
		avg_logprob: number(),
		compression_ratio: number(),
		no_speech_prob: number()
	})).nullish(),
	words: array(object({
		word: string(),
		start: number(),
		end: number()
	})).nullish()
});
var binaryResponseHandler = createBinaryResponseHandler();
var textDecoder = new TextDecoder();
var groqTextTranscriptionResponseHandler = async (options) => {
	const { value, responseHeaders } = await binaryResponseHandler(options);
	const text = textDecoder.decode(value);
	return {
		value: { text },
		rawValue: text,
		responseHeaders
	};
};
var groqTools = { browserSearch: createProviderExecutedToolFactory({
	id: "groq.browser_search",
	inputSchema: lazySchema(() => zodSchema(object({}))),
	outputSchema: lazySchema(() => zodSchema(object({})))
}) };
var VERSION$1 = "4.0.21";
function createGroq(options = {}) {
	var _a;
	const baseURL = (_a = withoutTrailingSlash(options.baseURL)) != null ? _a : "https://api.groq.com/openai/v1";
	const getHeaders = () => withUserAgentSuffix({
		Authorization: `Bearer ${loadApiKey({
			apiKey: options.apiKey,
			environmentVariableName: "GROQ_API_KEY",
			description: "Groq"
		})}`,
		...options.headers
	}, `ai-sdk/groq/${VERSION$1}`);
	const createChatModel = (modelId) => new GroqChatLanguageModel(modelId, {
		provider: "groq.chat",
		url: ({ path }) => `${baseURL}${path}`,
		headers: getHeaders,
		fetch: options.fetch
	});
	const createLanguageModel = (modelId) => {
		if (new.target) throw new Error("The Groq model function cannot be called with the new keyword.");
		return createChatModel(modelId);
	};
	const createTranscriptionModel = (modelId) => {
		return new GroqTranscriptionModel(modelId, {
			provider: "groq.transcription",
			url: ({ path }) => `${baseURL}${path}`,
			headers: getHeaders,
			fetch: options.fetch
		});
	};
	const provider = function(modelId) {
		return createLanguageModel(modelId);
	};
	provider.specificationVersion = "v4";
	provider.languageModel = createLanguageModel;
	provider.chat = createChatModel;
	provider.embeddingModel = (modelId) => {
		throw new NoSuchModelError({
			modelId,
			modelType: "embeddingModel"
		});
	};
	provider.textEmbeddingModel = provider.embeddingModel;
	provider.imageModel = (modelId) => {
		throw new NoSuchModelError({
			modelId,
			modelType: "imageModel"
		});
	};
	provider.transcription = createTranscriptionModel;
	provider.transcriptionModel = createTranscriptionModel;
	provider.tools = groqTools;
	return provider;
}
var groq = createGroq();
var agent_exports = __exportAll({ default: () => agent_default });
var agent_default = defineAgent({ model: groq("llama-3.1-8b-instant") });
var eve_exports = __exportAll({ default: () => eve_default });
var eve_default = eveChannel({ auth: [
	vercelOidc(),
	localDev(),
	placeholderAuth()
] });
const subtle = nodeCrypto.webcrypto?.subtle || {};
var __defProp = Object.defineProperty;
var __export = (target, all) => {
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
};
__export({}, {
	UpstashError: () => UpstashError,
	UpstashJSONParseError: () => UpstashJSONParseError,
	UrlError: () => UrlError
});
var UpstashError = class extends Error {
	constructor(message, options) {
		super(message, options);
		this.name = "UpstashError";
	}
};
var UrlError = class extends Error {
	constructor(url) {
		super(`Upstash Redis client was passed an invalid URL. You should pass a URL starting with https. Received: "${url}". `);
		this.name = "UrlError";
	}
};
var UpstashJSONParseError = class extends UpstashError {
	constructor(body, options) {
		const truncatedBody = body.length > 200 ? body.slice(0, 200) + "..." : body;
		super(`Unable to parse response body: ${truncatedBody}`, options);
		this.name = "UpstashJSONParseError";
	}
};
function parseRecursive(obj) {
	const parsed = Array.isArray(obj) ? obj.map((o) => {
		try {
			return parseRecursive(o);
		} catch {
			return o;
		}
	}) : JSON.parse(obj);
	if (typeof parsed === "number" && parsed.toString() !== obj) return obj;
	return parsed;
}
function parseResponse(result) {
	try {
		return parseRecursive(result);
	} catch {
		return result;
	}
}
function deserializeScanResponse(result) {
	return [result[0], ...parseResponse(result.slice(1))];
}
function deserializeScanWithTypesResponse(result) {
	const [cursor, keys] = result;
	const parsedKeys = [];
	for (let i = 0; i < keys.length; i += 2) parsedKeys.push({
		key: keys[i],
		type: keys[i + 1]
	});
	return [cursor, parsedKeys];
}
function mergeHeaders(...headers) {
	const merged = {};
	for (const header of headers) {
		if (!header) continue;
		for (const [key, value] of Object.entries(header)) if (value !== void 0 && value !== null) merged[key] = value;
	}
	return merged;
}
function kvArrayToObject(v) {
	if (typeof v === "object" && v !== null && !Array.isArray(v)) return v;
	if (!Array.isArray(v)) return {};
	const obj = {};
	for (let i = 0; i < v.length; i += 2) if (typeof v[i] === "string") obj[v[i]] = v[i + 1];
	return obj;
}
var MAX_BUFFER_SIZE = 1048576;
var HttpClient = class {
	baseUrl;
	headers;
	options;
	readYourWrites;
	upstashSyncToken = "";
	hasCredentials;
	retry;
	constructor(config) {
		this.options = {
			backend: config.options?.backend,
			agent: config.agent,
			responseEncoding: config.responseEncoding ?? "base64",
			cache: config.cache,
			signal: config.signal,
			keepAlive: config.keepAlive ?? true
		};
		this.upstashSyncToken = "";
		this.readYourWrites = config.readYourWrites ?? true;
		this.baseUrl = (config.baseUrl || "").replace(/\/$/, "");
		if (this.baseUrl && !/^https?:\/\/[^\s#$./?].\S*$/.test(this.baseUrl)) throw new UrlError(this.baseUrl);
		this.headers = {
			"Content-Type": "application/json",
			...config.headers
		};
		this.hasCredentials = Boolean(this.baseUrl && this.headers.authorization.split(" ")[1]);
		if (this.options.responseEncoding === "base64") this.headers["Upstash-Encoding"] = "base64";
		this.retry = typeof config.retry === "boolean" && !config.retry ? {
			attempts: 1,
			backoff: () => 0
		} : {
			attempts: config.retry?.retries ?? 5,
			backoff: config.retry?.backoff ?? ((retryCount) => Math.exp(retryCount) * 50)
		};
	}
	mergeTelemetry(telemetry) {
		this.headers = merge(this.headers, "Upstash-Telemetry-Runtime", telemetry.runtime);
		this.headers = merge(this.headers, "Upstash-Telemetry-Platform", telemetry.platform);
		this.headers = merge(this.headers, "Upstash-Telemetry-Sdk", telemetry.sdk);
	}
	async request(req) {
		const requestHeaders = mergeHeaders(this.headers, req.headers ?? {});
		const requestUrl = [this.baseUrl, ...req.path ?? []].join("/");
		const isEventStream = requestHeaders.Accept === "text/event-stream";
		const signal = req.signal ?? this.options.signal;
		const isSignalFunction = typeof signal === "function";
		const requestOptions = {
			cache: this.options.cache,
			method: "POST",
			headers: requestHeaders,
			body: JSON.stringify(req.body),
			keepalive: this.options.keepAlive,
			agent: this.options.agent,
			signal: isSignalFunction ? signal() : signal,
			backend: this.options.backend
		};
		if (!this.hasCredentials) console.warn("[Upstash Redis] Redis client was initialized without url or token. Failed to execute command.");
		if (this.readYourWrites) {
			const newHeader = this.upstashSyncToken;
			this.headers["upstash-sync-token"] = newHeader;
		}
		let res = null;
		let error = null;
		for (let i = 0; i <= this.retry.attempts; i++) try {
			res = await fetch(requestUrl, requestOptions);
			break;
		} catch (error_) {
			if (requestOptions.signal?.aborted && isSignalFunction) throw error_;
			else if (requestOptions.signal?.aborted) {
				const myBlob = new Blob([JSON.stringify({ result: requestOptions.signal.reason ?? "Aborted" })]);
				const myOptions = {
					status: 200,
					statusText: requestOptions.signal.reason ?? "Aborted"
				};
				res = new Response(myBlob, myOptions);
				break;
			}
			error = error_;
			if (i < this.retry.attempts) await new Promise((r) => setTimeout(r, this.retry.backoff(i)));
		}
		if (!res) throw error ?? new Error("Exhausted all retries");
		if (!res.ok) {
			let body2;
			const rawBody2 = await res.text();
			try {
				body2 = JSON.parse(rawBody2);
			} catch (error2) {
				throw new UpstashJSONParseError(rawBody2, { cause: error2 });
			}
			throw new UpstashError(`${body2.error}, command was: ${JSON.stringify(req.body)}`);
		}
		if (this.readYourWrites) {
			const headers = res.headers;
			this.upstashSyncToken = headers.get("upstash-sync-token") ?? "";
		}
		if (isEventStream && req && req.onMessage && res.body) {
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			(async () => {
				try {
					let buffer = "";
					while (true) {
						const { value, done } = await reader.read();
						if (done) break;
						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split("\n");
						buffer = lines.pop() || "";
						if (buffer.length > MAX_BUFFER_SIZE) throw new Error("Buffer size exceeded (1MB)");
						for (const line of lines) if (line.startsWith("data: ")) {
							const data = line.slice(6);
							req.onMessage?.(data);
						}
					}
				} catch (error2) {
					if (error2 instanceof Error && error2.name === "AbortError") {} else console.error("Stream reading error:", error2);
				} finally {
					try {
						await reader.cancel();
					} catch {}
				}
			})();
			return { result: 1 };
		}
		let body;
		const rawBody = await res.text();
		try {
			body = JSON.parse(rawBody);
		} catch (error2) {
			throw new UpstashJSONParseError(rawBody, { cause: error2 });
		}
		if (this.readYourWrites) {
			const headers = res.headers;
			this.upstashSyncToken = headers.get("upstash-sync-token") ?? "";
		}
		if (this.options.responseEncoding === "base64") {
			if (Array.isArray(body)) return body.map(({ result: result2, error: error2 }) => ({
				result: decode(result2),
				error: error2
			}));
			return {
				result: decode(body.result),
				error: body.error
			};
		}
		return body;
	}
};
function base64decode(b64) {
	let dec = "";
	try {
		const binString = atob(b64);
		const size = binString.length;
		const bytes = new Uint8Array(size);
		for (let i = 0; i < size; i++) bytes[i] = binString.charCodeAt(i);
		dec = new TextDecoder().decode(bytes);
	} catch {
		dec = b64;
	}
	return dec;
}
function decode(raw) {
	let result = void 0;
	switch (typeof raw) {
		case "undefined": return raw;
		case "number":
			result = raw;
			break;
		case "object":
			if (Array.isArray(raw)) result = raw.map((v) => typeof v === "string" ? base64decode(v) : Array.isArray(v) ? v.map((element) => decode(element)) : v);
			else result = null;
			break;
		case "string": result = raw === "OK" ? "OK" : base64decode(raw);
	}
	return result;
}
function merge(obj, key, value) {
	if (!value) return obj;
	obj[key] = obj[key] ? [obj[key], value].join(",") : value;
	return obj;
}
var defaultSerializer = (c) => {
	switch (typeof c) {
		case "string":
		case "number":
		case "boolean": return c;
		default: return JSON.stringify(c);
	}
};
var Command = class {
	command;
	serialize;
	deserialize;
	headers;
	path;
	onMessage;
	isStreaming;
	signal;
	constructor(command, opts) {
		this.serialize = defaultSerializer;
		this.deserialize = opts?.automaticDeserialization === void 0 || opts.automaticDeserialization ? opts?.deserialize ?? parseResponse : (x) => x;
		this.command = command.map((c) => this.serialize(c));
		this.headers = opts?.headers;
		this.path = opts?.path;
		this.onMessage = opts?.streamOptions?.onMessage;
		this.isStreaming = opts?.streamOptions?.isStreaming ?? false;
		this.signal = opts?.streamOptions?.signal;
		if (opts?.latencyLogging) {
			const originalExec = this.exec.bind(this);
			this.exec = async (client) => {
				const start = performance.now();
				const result = await originalExec(client);
				const loggerResult = (performance.now() - start).toFixed(2);
				console.log(`Latency for \x1B[38;2;19;185;39m${this.command[0].toString().toUpperCase()}\x1B[0m: \x1B[38;2;0;255;255m${loggerResult} ms\x1B[0m`);
				return result;
			};
		}
	}
	async exec(client) {
		const { result, error } = await client.request({
			body: this.command,
			path: this.path,
			upstashSyncToken: client.upstashSyncToken,
			headers: this.headers,
			onMessage: this.onMessage,
			isStreaming: this.isStreaming,
			signal: this.signal
		});
		if (error) throw new UpstashError(error);
		if (result === void 0) throw new TypeError("Request did not return a result");
		return this.deserialize(result);
	}
};
var ExecCommand = class extends Command {
	constructor(cmd, opts) {
		const normalizedCmd = cmd.map((arg) => typeof arg === "string" ? arg : String(arg));
		super(normalizedCmd, opts);
	}
};
var FIELD_TYPES = [
	"TEXT",
	"U64",
	"I64",
	"F64",
	"BOOL",
	"DATE",
	"KEYWORD",
	"FACET"
];
function isFieldType(value) {
	return typeof value === "string" && FIELD_TYPES.includes(value);
}
function isDetailedField(value) {
	return typeof value === "object" && value !== null && "type" in value && isFieldType(value.type);
}
function isNestedSchema(value) {
	return typeof value === "object" && value !== null && !isDetailedField(value);
}
function flattenSchema(schema, pathPrefix = []) {
	const fields = [];
	for (const [key, value] of Object.entries(schema)) {
		const currentPath = [...pathPrefix, key];
		const pathString = currentPath.join(".");
		if (isFieldType(value)) fields.push({
			path: pathString,
			type: value
		});
		else if (isDetailedField(value)) fields.push({
			path: pathString,
			type: value.type,
			fast: "fast" in value ? value.fast : void 0,
			noTokenize: "noTokenize" in value ? value.noTokenize : void 0,
			noStem: "noStem" in value ? value.noStem : void 0,
			from: "from" in value ? value.from : void 0
		});
		else if (isNestedSchema(value)) {
			const nestedFields = flattenSchema(value, currentPath);
			fields.push(...nestedFields);
		}
	}
	return fields;
}
function deserializeQueryResponse(rawResponse) {
	return rawResponse.map((itemRaw) => {
		const raw = itemRaw;
		const key = raw[0];
		const score = Number(raw[1]);
		const rawFields = raw[2];
		if (rawFields === void 0) return {
			key,
			score
		};
		if (!Array.isArray(rawFields) || rawFields.length === 0) return {
			key,
			score,
			data: {}
		};
		let data = {};
		for (const fieldRaw of rawFields) {
			const key2 = fieldRaw[0];
			const value = fieldRaw[1];
			const pathParts = key2.split(".");
			if (pathParts.length === 1) data[key2] = value;
			else {
				let currentObj = data;
				for (let i = 0; i < pathParts.length - 1; i++) {
					const pathPart = pathParts[i];
					if (!(pathPart in currentObj)) currentObj[pathPart] = {};
					currentObj = currentObj[pathPart];
				}
				currentObj[pathParts.at(-1)] = value;
			}
		}
		if ("$" in data) data = data["$"];
		return {
			key,
			score,
			data
		};
	});
}
function deserializeDescribeResponse(rawResponse) {
	const description = {};
	for (let i = 0; i < rawResponse.length; i += 2) switch (rawResponse[i]) {
		case "name":
			description["name"] = rawResponse[i + 1];
			break;
		case "type":
			description["dataType"] = rawResponse[i + 1].toLowerCase();
			break;
		case "prefixes":
			description["prefixes"] = rawResponse[i + 1];
			break;
		case "language":
			description["language"] = rawResponse[i + 1];
			break;
		case "schema": {
			const schema = {};
			for (const fieldDescription of rawResponse[i + 1]) {
				const fieldName = fieldDescription[0];
				const fieldInfo = { type: fieldDescription[1] };
				if (fieldDescription.length > 2) for (let j = 2; j < fieldDescription.length; j++) switch (fieldDescription[j]) {
					case "NOSTEM":
						fieldInfo.noStem = true;
						break;
					case "NOTOKENIZE":
						fieldInfo.noTokenize = true;
						break;
					case "FAST":
						fieldInfo.fast = true;
						break;
					case "FROM": fieldInfo.from = fieldDescription[++j];
				}
				schema[fieldName] = fieldInfo;
			}
			description["schema"] = schema;
			break;
		}
	}
	return description;
}
function parseCountResponse(rawResponse) {
	return typeof rawResponse === "number" ? rawResponse : Number.parseInt(rawResponse, 10);
}
function deserializeAggregateResponse(rawResponse) {
	return parseAggregationArray(rawResponse);
}
function parseAggregationArray(arr) {
	const result = {};
	for (let i = 0; i < arr.length; i += 2) {
		const key = arr[i];
		const value = arr[i + 1];
		if (Array.isArray(value)) if (value.length > 0 && typeof value[0] === "string") result[key] = value[0] === "buckets" ? parseBucketsValue(value) : parseStatsValue(value);
		else result[key] = parseAggregationArray(value);
		else result[key] = value;
	}
	return result;
}
function coerceNumericString(value) {
	if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) return Number(value);
	return value;
}
function parseStatsValue(arr) {
	const result = {};
	for (let i = 0; i < arr.length; i += 2) {
		const key = arr[i];
		const value = arr[i + 1];
		if (Array.isArray(value) && value.length > 0) if (typeof value[0] === "string") result[key] = parseStatsValue(value);
		else if (Array.isArray(value[0]) && typeof value[0][0] === "string") result[key] = value.map((item) => parseStatsValue(item));
		else result[key] = value;
		else result[key] = coerceNumericString(value);
	}
	return result;
}
function parseBucketsValue(arr) {
	if (arr[0] === "buckets" && Array.isArray(arr[1])) {
		const result = { buckets: arr[1].map((bucket) => {
			const bucketObj = {};
			for (let i = 0; i < bucket.length; i += 2) {
				const key = bucket[i];
				const value = bucket[i + 1];
				bucketObj[key] = Array.isArray(value) && value.length > 0 && typeof value[0] === "string" ? parseStatsValue(value) : value;
			}
			return bucketObj;
		}) };
		for (let i = 2; i < arr.length; i += 2) result[arr[i]] = arr[i + 1];
		return result;
	}
	return arr;
}
function buildQueryCommand(redisCommand, name, options) {
	const command = [
		redisCommand,
		name,
		JSON.stringify(options?.filter ?? {})
	];
	if (options?.limit !== void 0) command.push("LIMIT", options.limit.toString());
	if (options?.offset !== void 0) command.push("OFFSET", options.offset.toString());
	if (options?.select && Object.keys(options.select).length === 0) command.push("NOCONTENT");
	if (options) {
		if ("orderBy" in options && options.orderBy) {
			command.push("ORDERBY");
			for (const [field, direction] of Object.entries(options.orderBy)) command.push(field, direction);
		} else if ("scoreFunc" in options && options.scoreFunc) command.push("SCOREFUNC", ...buildScoreFunc(options.scoreFunc));
	}
	if (options?.highlight) {
		command.push("HIGHLIGHT", "FIELDS", options.highlight.fields.length.toString(), ...options.highlight.fields);
		if (options.highlight.preTag && options.highlight.postTag) command.push("TAGS", options.highlight.preTag, options.highlight.postTag);
	}
	if (options?.select && Object.keys(options.select).length > 0) command.push("SELECT", Object.keys(options.select).length.toString(), ...Object.keys(options.select));
	return command;
}
function buildScoreFunc(scoreBy) {
	const result = [];
	if (typeof scoreBy === "string") result.push("FIELDVALUE", scoreBy);
	else if ("fields" in scoreBy) {
		if (scoreBy.combineMode) result.push("COMBINEMODE", scoreBy.combineMode.toUpperCase());
		if (scoreBy.scoreMode) result.push("SCOREMODE", scoreBy.scoreMode.toUpperCase());
		for (const field of scoreBy.fields) result.push(...buildScoreFuncField(field));
	} else result.push(...buildScoreFuncField(scoreBy));
	return result;
}
function buildScoreFuncField(field) {
	const result = [];
	if (typeof field === "string") result.push("FIELDVALUE", field);
	else {
		if (field.scoreMode) result.push("SCOREMODE", field.scoreMode.toUpperCase());
		result.push("FIELDVALUE", field.field);
		if (field.modifier) result.push("MODIFIER", field.modifier.toUpperCase());
		if (field.factor !== void 0) result.push("FACTOR", field.factor.toString());
		if (field.missing !== void 0) result.push("MISSING", field.missing.toString());
	}
	return result;
}
function buildCreateIndexCommand(params) {
	const { name, schema, dataType, prefix, language, skipInitialScan, existsOk } = params;
	const prefixArray = Array.isArray(prefix) ? prefix : [prefix];
	const payload = [
		name,
		...skipInitialScan ? ["SKIPINITIALSCAN"] : [],
		...existsOk ? ["EXISTSOK"] : [],
		"ON",
		dataType.toUpperCase(),
		"PREFIX",
		prefixArray.length.toString(),
		...prefixArray,
		...language ? ["LANGUAGE", language] : [],
		"SCHEMA"
	];
	const fields = flattenSchema(schema);
	for (const field of fields) {
		payload.push(field.path, field.type);
		if (field.fast) payload.push("FAST");
		if (field.noTokenize) payload.push("NOTOKENIZE");
		if (field.noStem) payload.push("NOSTEM");
		if (field.from) payload.push("FROM", field.from);
	}
	return ["SEARCH.CREATE", ...payload];
}
function buildAggregateCommand(name, options) {
	return [
		"SEARCH.AGGREGATE",
		name,
		JSON.stringify(options?.filter ?? {}),
		JSON.stringify(options.aggregations)
	];
}
var SearchIndex = class {
	name;
	schema;
	client;
	constructor({ name, schema, client }) {
		this.name = name;
		this.schema = schema;
		this.client = client;
	}
	async waitIndexing() {
		return await new ExecCommand(["SEARCH.WAITINDEXING", this.name]).exec(this.client);
	}
	async describe() {
		const rawResult = await new ExecCommand(["SEARCH.DESCRIBE", this.name]).exec(this.client);
		if (!rawResult) return null;
		return deserializeDescribeResponse(rawResult);
	}
	async query(options) {
		const rawResult = await new ExecCommand(buildQueryCommand("SEARCH.QUERY", this.name, options)).exec(this.client);
		if (!rawResult) return rawResult;
		return deserializeQueryResponse(rawResult);
	}
	async aggregate(options) {
		return deserializeAggregateResponse(await new ExecCommand(buildAggregateCommand(this.name, options)).exec(this.client));
	}
	async count({ filter }) {
		return { count: parseCountResponse(await new ExecCommand(buildQueryCommand("SEARCH.COUNT", this.name, { filter })).exec(this.client)) };
	}
	async drop() {
		return await new ExecCommand(["SEARCH.DROP", this.name]).exec(this.client);
	}
	async addAlias({ alias }) {
		return await new ExecCommand([
			"SEARCH.ALIASADD",
			alias,
			this.name
		]).exec(this.client);
	}
};
async function createIndex(client, params) {
	const { name, schema } = params;
	await new ExecCommand(buildCreateIndexCommand(params)).exec(client);
	return initIndex(client, {
		name,
		schema
	});
}
function initIndex(client, params) {
	const { name, schema } = params;
	return new SearchIndex({
		name,
		schema,
		client
	});
}
async function listAliases(client) {
	const rawResult = await new ExecCommand(["SEARCH.LISTALIASES"]).exec(client);
	if (rawResult === 0 || Array.isArray(rawResult) && rawResult.length === 0) return {};
	if (!Array.isArray(rawResult)) return {};
	const aliases = {};
	for (const pair of rawResult) if (Array.isArray(pair) && pair.length === 2) {
		const [alias, index] = pair;
		aliases[alias] = index;
	}
	return aliases;
}
async function addAlias(client, { indexName, alias }) {
	return await new ExecCommand([
		"SEARCH.ALIASADD",
		alias,
		indexName
	]).exec(client);
}
async function delAlias(client, { alias }) {
	return await new ExecCommand(["SEARCH.ALIASDEL", alias]).exec(client);
}
function deserialize(result) {
	if (result.length === 0) return null;
	const obj = {};
	for (let i = 0; i < result.length; i += 2) {
		const key = result[i];
		const value = result[i + 1];
		try {
			obj[key] = JSON.parse(value);
		} catch {
			obj[key] = value;
		}
	}
	return obj;
}
var HRandFieldCommand = class extends Command {
	constructor(cmd, opts) {
		const command = ["hrandfield", cmd[0]];
		if (typeof cmd[1] === "number") command.push(cmd[1]);
		if (cmd[2]) command.push("WITHVALUES");
		super(command, {
			deserialize: cmd[2] ? (result) => deserialize(result) : opts?.deserialize,
			...opts
		});
	}
};
var AppendCommand = class extends Command {
	constructor(cmd, opts) {
		super(["append", ...cmd], opts);
	}
};
var BitCountCommand = class extends Command {
	constructor([key, start, end], opts) {
		const command = ["bitcount", key];
		if (typeof start === "number") command.push(start);
		if (typeof end === "number") command.push(end);
		super(command, opts);
	}
};
var BitFieldCommand = class {
	constructor(args, client, opts, execOperation = (command) => command.exec(this.client)) {
		this.client = client;
		this.opts = opts;
		this.execOperation = execOperation;
		this.command = ["bitfield", ...args];
	}
	command;
	chain(...args) {
		this.command.push(...args);
		return this;
	}
	get(...args) {
		return this.chain("get", ...args);
	}
	set(...args) {
		return this.chain("set", ...args);
	}
	incrby(...args) {
		return this.chain("incrby", ...args);
	}
	overflow(overflow) {
		return this.chain("overflow", overflow);
	}
	exec() {
		const command = new Command(this.command, this.opts);
		return this.execOperation(command);
	}
};
var BitOpCommand = class extends Command {
	constructor(cmd, opts) {
		super(["bitop", ...cmd], opts);
	}
};
var BitPosCommand = class extends Command {
	constructor(cmd, opts) {
		super(["bitpos", ...cmd], opts);
	}
};
var ClientSetInfoCommand = class extends Command {
	constructor([attribute, value], opts) {
		super([
			"CLIENT",
			"SETINFO",
			attribute.toUpperCase(),
			value
		], opts);
	}
};
var CopyCommand = class extends Command {
	constructor([key, destinationKey, opts], commandOptions) {
		super([
			"COPY",
			key,
			destinationKey,
			...opts?.replace ? ["REPLACE"] : []
		], {
			...commandOptions,
			deserialize(result) {
				if (result > 0) return "COPIED";
				return "NOT_COPIED";
			}
		});
	}
};
var DBSizeCommand = class extends Command {
	constructor(opts) {
		super(["dbsize"], opts);
	}
};
var DecrCommand = class extends Command {
	constructor(cmd, opts) {
		super(["decr", ...cmd], opts);
	}
};
var DecrByCommand = class extends Command {
	constructor(cmd, opts) {
		super(["decrby", ...cmd], opts);
	}
};
var DelCommand = class extends Command {
	constructor(cmd, opts) {
		super(["del", ...cmd], opts);
	}
};
var EchoCommand = class extends Command {
	constructor(cmd, opts) {
		super(["echo", ...cmd], opts);
	}
};
var EvalROCommand = class extends Command {
	constructor([script, keys, args], opts) {
		super([
			"eval_ro",
			script,
			keys.length,
			...keys,
			...args ?? []
		], opts);
	}
};
var EvalCommand = class extends Command {
	constructor([script, keys, args], opts) {
		super([
			"eval",
			script,
			keys.length,
			...keys,
			...args ?? []
		], opts);
	}
};
var EvalshaROCommand = class extends Command {
	constructor([sha, keys, args], opts) {
		super([
			"evalsha_ro",
			sha,
			keys.length,
			...keys,
			...args ?? []
		], opts);
	}
};
var EvalshaCommand = class extends Command {
	constructor([sha, keys, args], opts) {
		super([
			"evalsha",
			sha,
			keys.length,
			...keys,
			...args ?? []
		], opts);
	}
};
var ExistsCommand = class extends Command {
	constructor(cmd, opts) {
		super(["exists", ...cmd], opts);
	}
};
var ExpireCommand = class extends Command {
	constructor(cmd, opts) {
		super(["expire", ...cmd.filter(Boolean)], opts);
	}
};
var ExpireAtCommand = class extends Command {
	constructor(cmd, opts) {
		super(["expireat", ...cmd], opts);
	}
};
var FCallCommand = class extends Command {
	constructor([functionName, keys, args], opts) {
		super([
			"fcall",
			functionName,
			...keys ? [keys.length, ...keys] : [0],
			...args ?? []
		], opts);
	}
};
var FCallRoCommand = class extends Command {
	constructor([functionName, keys, args], opts) {
		super([
			"fcall_ro",
			functionName,
			...keys ? [keys.length, ...keys] : [0],
			...args ?? []
		], opts);
	}
};
var FlushAllCommand = class extends Command {
	constructor(args, opts) {
		const command = ["flushall"];
		if (args && args.length > 0 && args[0].async) command.push("async");
		super(command, opts);
	}
};
var FlushDBCommand = class extends Command {
	constructor([opts], cmdOpts) {
		const command = ["flushdb"];
		if (opts?.async) command.push("async");
		super(command, cmdOpts);
	}
};
var FunctionDeleteCommand = class extends Command {
	constructor([libraryName], opts) {
		super([
			"function",
			"delete",
			libraryName
		], opts);
	}
};
var FunctionFlushCommand = class extends Command {
	constructor(opts) {
		super(["function", "flush"], opts);
	}
};
var FunctionListCommand = class extends Command {
	constructor([args], opts) {
		const command = ["function", "list"];
		if (args?.libraryName) command.push("libraryname", args.libraryName);
		if (args?.withCode) command.push("withcode");
		super(command, {
			deserialize: deserialize2,
			...opts
		});
	}
};
function deserialize2(result) {
	if (!Array.isArray(result)) return [];
	return result.map((libRaw) => {
		const lib = kvArrayToObject(libRaw);
		const functionsParsed = lib.functions.map((fnRaw) => kvArrayToObject(fnRaw));
		return {
			libraryName: lib.library_name,
			engine: lib.engine,
			functions: functionsParsed.map((fn) => ({
				name: fn.name,
				description: fn.description ?? void 0,
				flags: fn.flags
			})),
			libraryCode: lib.library_code
		};
	});
}
var FunctionLoadCommand = class extends Command {
	constructor([args], opts) {
		super([
			"function",
			"load",
			...args.replace ? ["replace"] : [],
			args.code
		], opts);
	}
};
var FunctionStatsCommand = class extends Command {
	constructor(opts) {
		super(["function", "stats"], {
			deserialize: deserialize3,
			...opts
		});
	}
};
function deserialize3(result) {
	const rawEngines = kvArrayToObject(kvArrayToObject(result).engines);
	const parsedEngines = Object.fromEntries(Object.entries(rawEngines).map(([key, value]) => [key, kvArrayToObject(value)]));
	return { engines: Object.fromEntries(Object.entries(parsedEngines).map(([key, value]) => [key, {
		librariesCount: value.libraries_count,
		functionsCount: value.functions_count
	}])) };
}
var GeoAddCommand = class extends Command {
	constructor([key, arg1, ...arg2], opts) {
		const command = ["geoadd", key];
		if ("nx" in arg1 && arg1.nx) command.push("nx");
		else if ("xx" in arg1 && arg1.xx) command.push("xx");
		if ("ch" in arg1 && arg1.ch) command.push("ch");
		if ("latitude" in arg1 && arg1.latitude) command.push(arg1.longitude, arg1.latitude, arg1.member);
		command.push(...arg2.flatMap(({ latitude, longitude, member }) => [
			longitude,
			latitude,
			member
		]));
		super(command, opts);
	}
};
var GeoDistCommand = class extends Command {
	constructor([key, member1, member2, unit = "M"], opts) {
		super([
			"GEODIST",
			key,
			member1,
			member2,
			unit
		], opts);
	}
};
var GeoHashCommand = class extends Command {
	constructor(cmd, opts) {
		const [key] = cmd;
		const members = Array.isArray(cmd[1]) ? cmd[1] : cmd.slice(1);
		super([
			"GEOHASH",
			key,
			...members
		], opts);
	}
};
var GeoPosCommand = class extends Command {
	constructor(cmd, opts) {
		const [key] = cmd;
		const members = Array.isArray(cmd[1]) ? cmd[1] : cmd.slice(1);
		super([
			"GEOPOS",
			key,
			...members
		], {
			deserialize: (result) => transform(result),
			...opts
		});
	}
};
function transform(result) {
	const final = [];
	for (const pos of result) {
		if (!pos?.[0] || !pos?.[1]) continue;
		final.push({
			lng: Number.parseFloat(pos[0]),
			lat: Number.parseFloat(pos[1])
		});
	}
	return final;
}
var GeoSearchCommand = class extends Command {
	constructor([key, centerPoint, shape, order, opts], commandOptions) {
		const command = ["GEOSEARCH", key];
		if (centerPoint.type === "FROMMEMBER" || centerPoint.type === "frommember") command.push(centerPoint.type, centerPoint.member);
		if (centerPoint.type === "FROMLONLAT" || centerPoint.type === "fromlonlat") command.push(centerPoint.type, centerPoint.coordinate.lon, centerPoint.coordinate.lat);
		if (shape.type === "BYRADIUS" || shape.type === "byradius") command.push(shape.type, shape.radius, shape.radiusType);
		if (shape.type === "BYBOX" || shape.type === "bybox") command.push(shape.type, shape.rect.width, shape.rect.height, shape.rectType);
		command.push(order);
		if (opts?.count) command.push("COUNT", opts.count.limit, ...opts.count.any ? ["ANY"] : []);
		const transform2 = (result) => {
			if (!opts?.withCoord && !opts?.withDist && !opts?.withHash) return result.map((member) => {
				try {
					return { member: JSON.parse(member) };
				} catch {
					return { member };
				}
			});
			return result.map((members) => {
				let counter = 1;
				const obj = {};
				try {
					obj.member = JSON.parse(members[0]);
				} catch {
					obj.member = members[0];
				}
				if (opts.withDist) obj.dist = Number.parseFloat(members[counter++]);
				if (opts.withHash) obj.hash = members[counter++].toString();
				if (opts.withCoord) obj.coord = {
					long: Number.parseFloat(members[counter][0]),
					lat: Number.parseFloat(members[counter][1])
				};
				return obj;
			});
		};
		super([
			...command,
			...opts?.withCoord ? ["WITHCOORD"] : [],
			...opts?.withDist ? ["WITHDIST"] : [],
			...opts?.withHash ? ["WITHHASH"] : []
		], {
			deserialize: transform2,
			...commandOptions
		});
	}
};
var GeoSearchStoreCommand = class extends Command {
	constructor([destination, key, centerPoint, shape, order, opts], commandOptions) {
		const command = [
			"GEOSEARCHSTORE",
			destination,
			key
		];
		if (centerPoint.type === "FROMMEMBER" || centerPoint.type === "frommember") command.push(centerPoint.type, centerPoint.member);
		if (centerPoint.type === "FROMLONLAT" || centerPoint.type === "fromlonlat") command.push(centerPoint.type, centerPoint.coordinate.lon, centerPoint.coordinate.lat);
		if (shape.type === "BYRADIUS" || shape.type === "byradius") command.push(shape.type, shape.radius, shape.radiusType);
		if (shape.type === "BYBOX" || shape.type === "bybox") command.push(shape.type, shape.rect.width, shape.rect.height, shape.rectType);
		command.push(order);
		if (opts?.count) command.push("COUNT", opts.count.limit, ...opts.count.any ? ["ANY"] : []);
		super([...command, ...opts?.storeDist ? ["STOREDIST"] : []], commandOptions);
	}
};
var GetCommand = class extends Command {
	constructor(cmd, opts) {
		super(["get", ...cmd], opts);
	}
};
var GetBitCommand = class extends Command {
	constructor(cmd, opts) {
		super(["getbit", ...cmd], opts);
	}
};
var GetDelCommand = class extends Command {
	constructor(cmd, opts) {
		super(["getdel", ...cmd], opts);
	}
};
var GetExCommand = class extends Command {
	constructor([key, opts], cmdOpts) {
		const command = ["getex", key];
		if (opts) {
			if ("ex" in opts && typeof opts.ex === "number") command.push("ex", opts.ex);
			else if ("px" in opts && typeof opts.px === "number") command.push("px", opts.px);
			else if ("exat" in opts && typeof opts.exat === "number") command.push("exat", opts.exat);
			else if ("pxat" in opts && typeof opts.pxat === "number") command.push("pxat", opts.pxat);
			else if ("persist" in opts && opts.persist) command.push("persist");
		}
		super(command, cmdOpts);
	}
};
var GetRangeCommand = class extends Command {
	constructor(cmd, opts) {
		super(["getrange", ...cmd], opts);
	}
};
var GetSetCommand = class extends Command {
	constructor(cmd, opts) {
		super(["getset", ...cmd], opts);
	}
};
var HDelCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hdel", ...cmd], opts);
	}
};
var HExistsCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hexists", ...cmd], opts);
	}
};
var HExpireCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, fields, seconds, option] = cmd;
		const fieldArray = Array.isArray(fields) ? fields : [fields];
		super([
			"hexpire",
			key,
			seconds,
			...option ? [option] : [],
			"FIELDS",
			fieldArray.length,
			...fieldArray
		], opts);
	}
};
var HExpireAtCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, fields, timestamp, option] = cmd;
		const fieldArray = Array.isArray(fields) ? fields : [fields];
		super([
			"hexpireat",
			key,
			timestamp,
			...option ? [option] : [],
			"FIELDS",
			fieldArray.length,
			...fieldArray
		], opts);
	}
};
var HExpireTimeCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, fields] = cmd;
		const fieldArray = Array.isArray(fields) ? fields : [fields];
		super([
			"hexpiretime",
			key,
			"FIELDS",
			fieldArray.length,
			...fieldArray
		], opts);
	}
};
var HPersistCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, fields] = cmd;
		const fieldArray = Array.isArray(fields) ? fields : [fields];
		super([
			"hpersist",
			key,
			"FIELDS",
			fieldArray.length,
			...fieldArray
		], opts);
	}
};
var HPExpireCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, fields, milliseconds, option] = cmd;
		const fieldArray = Array.isArray(fields) ? fields : [fields];
		super([
			"hpexpire",
			key,
			milliseconds,
			...option ? [option] : [],
			"FIELDS",
			fieldArray.length,
			...fieldArray
		], opts);
	}
};
var HPExpireAtCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, fields, timestamp, option] = cmd;
		const fieldArray = Array.isArray(fields) ? fields : [fields];
		super([
			"hpexpireat",
			key,
			timestamp,
			...option ? [option] : [],
			"FIELDS",
			fieldArray.length,
			...fieldArray
		], opts);
	}
};
var HPExpireTimeCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, fields] = cmd;
		const fieldArray = Array.isArray(fields) ? fields : [fields];
		super([
			"hpexpiretime",
			key,
			"FIELDS",
			fieldArray.length,
			...fieldArray
		], opts);
	}
};
var HPTtlCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, fields] = cmd;
		const fieldArray = Array.isArray(fields) ? fields : [fields];
		super([
			"hpttl",
			key,
			"FIELDS",
			fieldArray.length,
			...fieldArray
		], opts);
	}
};
var HGetCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hget", ...cmd], opts);
	}
};
function deserialize4(result) {
	if (result.length === 0) return null;
	const obj = {};
	for (let i = 0; i < result.length; i += 2) {
		const key = result[i];
		const value = result[i + 1];
		try {
			obj[key] = !Number.isNaN(Number(value)) && !Number.isSafeInteger(Number(value)) ? value : JSON.parse(value);
		} catch {
			obj[key] = value;
		}
	}
	return obj;
}
var HGetAllCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hgetall", ...cmd], {
			deserialize: (result) => deserialize4(result),
			...opts
		});
	}
};
function deserialize5(fields, result) {
	if (result.every((field) => field === null)) return null;
	const obj = {};
	for (const [i, field] of fields.entries()) try {
		obj[field] = JSON.parse(result[i]);
	} catch {
		obj[field] = result[i];
	}
	return obj;
}
var HMGetCommand = class extends Command {
	constructor([key, ...fields], opts) {
		super([
			"hmget",
			key,
			...fields
		], {
			deserialize: (result) => deserialize5(fields, result),
			...opts
		});
	}
};
var HGetDelCommand = class extends Command {
	constructor([key, ...fields], opts) {
		super([
			"hgetdel",
			key,
			"FIELDS",
			fields.length,
			...fields
		], {
			deserialize: (result) => deserialize5(fields.map(String), result),
			...opts
		});
	}
};
var HGetExCommand = class extends Command {
	constructor([key, opts, ...fields], cmdOpts) {
		const command = ["hgetex", key];
		if ("ex" in opts && typeof opts.ex === "number") command.push("EX", opts.ex);
		else if ("px" in opts && typeof opts.px === "number") command.push("PX", opts.px);
		else if ("exat" in opts && typeof opts.exat === "number") command.push("EXAT", opts.exat);
		else if ("pxat" in opts && typeof opts.pxat === "number") command.push("PXAT", opts.pxat);
		else if ("persist" in opts && opts.persist) command.push("PERSIST");
		command.push("FIELDS", fields.length, ...fields);
		super(command, {
			deserialize: (result) => deserialize5(fields.map(String), result),
			...cmdOpts
		});
	}
};
var HIncrByCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hincrby", ...cmd], opts);
	}
};
var HIncrByFloatCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hincrbyfloat", ...cmd], opts);
	}
};
var HKeysCommand = class extends Command {
	constructor([key], opts) {
		super(["hkeys", key], opts);
	}
};
var HLenCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hlen", ...cmd], opts);
	}
};
var HMSetCommand = class extends Command {
	constructor([key, kv], opts) {
		super([
			"hmset",
			key,
			...Object.entries(kv).flatMap(([field, value]) => [field, value])
		], opts);
	}
};
var HScanCommand = class extends Command {
	constructor([key, cursor, cmdOpts], opts) {
		const command = [
			"hscan",
			key,
			cursor
		];
		if (cmdOpts?.match) command.push("match", cmdOpts.match);
		if (typeof cmdOpts?.count === "number") command.push("count", cmdOpts.count);
		super(command, {
			deserialize: deserializeScanResponse,
			...opts
		});
	}
};
var HSetCommand = class extends Command {
	constructor([key, kv], opts) {
		super([
			"hset",
			key,
			...Object.entries(kv).flatMap(([field, value]) => [field, value])
		], opts);
	}
};
var HSetExCommand = class extends Command {
	constructor([key, opts, kv], cmdOpts) {
		const command = ["hsetex", key];
		if (opts.conditional) command.push(opts.conditional.toUpperCase());
		if (opts.expiration) {
			if ("ex" in opts.expiration && typeof opts.expiration.ex === "number") command.push("EX", opts.expiration.ex);
			else if ("px" in opts.expiration && typeof opts.expiration.px === "number") command.push("PX", opts.expiration.px);
			else if ("exat" in opts.expiration && typeof opts.expiration.exat === "number") command.push("EXAT", opts.expiration.exat);
			else if ("pxat" in opts.expiration && typeof opts.expiration.pxat === "number") command.push("PXAT", opts.expiration.pxat);
			else if ("keepttl" in opts.expiration && opts.expiration.keepttl) command.push("KEEPTTL");
		}
		const entries = Object.entries(kv);
		command.push("FIELDS", entries.length);
		for (const [field, value] of entries) command.push(field, value);
		super(command, cmdOpts);
	}
};
var HSetNXCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hsetnx", ...cmd], opts);
	}
};
var HStrLenCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hstrlen", ...cmd], opts);
	}
};
var HTtlCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, fields] = cmd;
		const fieldArray = Array.isArray(fields) ? fields : [fields];
		super([
			"httl",
			key,
			"FIELDS",
			fieldArray.length,
			...fieldArray
		], opts);
	}
};
var HValsCommand = class extends Command {
	constructor(cmd, opts) {
		super(["hvals", ...cmd], opts);
	}
};
var IncrCommand = class extends Command {
	constructor(cmd, opts) {
		super(["incr", ...cmd], opts);
	}
};
var IncrByCommand = class extends Command {
	constructor(cmd, opts) {
		super(["incrby", ...cmd], opts);
	}
};
var IncrByFloatCommand = class extends Command {
	constructor(cmd, opts) {
		super(["incrbyfloat", ...cmd], opts);
	}
};
var JsonArrAppendCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.ARRAPPEND", ...cmd], opts);
	}
};
var JsonArrIndexCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.ARRINDEX", ...cmd], opts);
	}
};
var JsonArrInsertCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.ARRINSERT", ...cmd], opts);
	}
};
var JsonArrLenCommand = class extends Command {
	constructor(cmd, opts) {
		super([
			"JSON.ARRLEN",
			cmd[0],
			cmd[1] ?? "$"
		], opts);
	}
};
var JsonArrPopCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.ARRPOP", ...cmd], opts);
	}
};
var JsonArrTrimCommand = class extends Command {
	constructor(cmd, opts) {
		const path = cmd[1] ?? "$";
		const start = cmd[2] ?? 0;
		const stop = cmd[3] ?? 0;
		super([
			"JSON.ARRTRIM",
			cmd[0],
			path,
			start,
			stop
		], opts);
	}
};
var JsonClearCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.CLEAR", ...cmd], opts);
	}
};
var JsonDelCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.DEL", ...cmd], opts);
	}
};
var JsonForgetCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.FORGET", ...cmd], opts);
	}
};
var JsonGetCommand = class extends Command {
	constructor(cmd, opts) {
		const command = ["JSON.GET"];
		if (typeof cmd[1] === "string") command.push(...cmd);
		else {
			command.push(cmd[0]);
			if (cmd[1]) {
				if (cmd[1].indent) command.push("INDENT", cmd[1].indent);
				if (cmd[1].newline) command.push("NEWLINE", cmd[1].newline);
				if (cmd[1].space) command.push("SPACE", cmd[1].space);
			}
			command.push(...cmd.slice(2));
		}
		super(command, opts);
	}
};
var JsonMergeCommand = class extends Command {
	constructor(cmd, opts) {
		const command = ["JSON.MERGE", ...cmd];
		super(command, opts);
	}
};
var JsonMGetCommand = class extends Command {
	constructor(cmd, opts) {
		super([
			"JSON.MGET",
			...cmd[0],
			cmd[1]
		], opts);
	}
};
var JsonMSetCommand = class extends Command {
	constructor(cmd, opts) {
		const command = ["JSON.MSET"];
		for (const c of cmd) command.push(c.key, c.path, c.value);
		super(command, opts);
	}
};
var JsonNumIncrByCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.NUMINCRBY", ...cmd], opts);
	}
};
var JsonNumMultByCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.NUMMULTBY", ...cmd], opts);
	}
};
var JsonObjKeysCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.OBJKEYS", ...cmd], opts);
	}
};
var JsonObjLenCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.OBJLEN", ...cmd], opts);
	}
};
var JsonRespCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.RESP", ...cmd], opts);
	}
};
var JsonSetCommand = class extends Command {
	constructor(cmd, opts) {
		const command = [
			"JSON.SET",
			cmd[0],
			cmd[1],
			cmd[2]
		];
		if (cmd[3]) {
			if (cmd[3].nx) command.push("NX");
			else if (cmd[3].xx) command.push("XX");
		}
		super(command, opts);
	}
};
var JsonStrAppendCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.STRAPPEND", ...cmd], opts);
	}
};
var JsonStrLenCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.STRLEN", ...cmd], opts);
	}
};
var JsonToggleCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.TOGGLE", ...cmd], opts);
	}
};
var JsonTypeCommand = class extends Command {
	constructor(cmd, opts) {
		super(["JSON.TYPE", ...cmd], opts);
	}
};
var KeysCommand = class extends Command {
	constructor(cmd, opts) {
		super(["keys", ...cmd], opts);
	}
};
var LIndexCommand = class extends Command {
	constructor(cmd, opts) {
		super(["lindex", ...cmd], opts);
	}
};
var LInsertCommand = class extends Command {
	constructor(cmd, opts) {
		super(["linsert", ...cmd], opts);
	}
};
var LLenCommand = class extends Command {
	constructor(cmd, opts) {
		super(["llen", ...cmd], opts);
	}
};
var LMoveCommand = class extends Command {
	constructor(cmd, opts) {
		super(["lmove", ...cmd], opts);
	}
};
var LmPopCommand = class extends Command {
	constructor(cmd, opts) {
		const [numkeys, keys, direction, count] = cmd;
		super([
			"LMPOP",
			numkeys,
			...keys,
			direction,
			...count ? ["COUNT", count] : []
		], opts);
	}
};
var LPopCommand = class extends Command {
	constructor(cmd, opts) {
		super(["lpop", ...cmd], opts);
	}
};
var LPosCommand = class extends Command {
	constructor(cmd, opts) {
		const args = [
			"lpos",
			cmd[0],
			cmd[1]
		];
		if (typeof cmd[2]?.rank === "number") args.push("rank", cmd[2].rank);
		if (typeof cmd[2]?.count === "number") args.push("count", cmd[2].count);
		if (typeof cmd[2]?.maxLen === "number") args.push("maxLen", cmd[2].maxLen);
		super(args, opts);
	}
};
var LPushCommand = class extends Command {
	constructor(cmd, opts) {
		super(["lpush", ...cmd], opts);
	}
};
var LPushXCommand = class extends Command {
	constructor(cmd, opts) {
		super(["lpushx", ...cmd], opts);
	}
};
var LRangeCommand = class extends Command {
	constructor(cmd, opts) {
		super(["lrange", ...cmd], opts);
	}
};
var LRemCommand = class extends Command {
	constructor(cmd, opts) {
		super(["lrem", ...cmd], opts);
	}
};
var LSetCommand = class extends Command {
	constructor(cmd, opts) {
		super(["lset", ...cmd], opts);
	}
};
var LTrimCommand = class extends Command {
	constructor(cmd, opts) {
		super(["ltrim", ...cmd], opts);
	}
};
var MGetCommand = class extends Command {
	constructor(cmd, opts) {
		const keys = Array.isArray(cmd[0]) ? cmd[0] : cmd;
		super(["mget", ...keys], opts);
	}
};
var MSetCommand = class extends Command {
	constructor([kv], opts) {
		super(["mset", ...Object.entries(kv).flatMap(([key, value]) => [key, value])], opts);
	}
};
var MSetNXCommand = class extends Command {
	constructor([kv], opts) {
		super(["msetnx", ...Object.entries(kv).flat()], opts);
	}
};
var PersistCommand = class extends Command {
	constructor(cmd, opts) {
		super(["persist", ...cmd], opts);
	}
};
var PExpireCommand = class extends Command {
	constructor(cmd, opts) {
		super(["pexpire", ...cmd], opts);
	}
};
var PExpireAtCommand = class extends Command {
	constructor(cmd, opts) {
		super(["pexpireat", ...cmd], opts);
	}
};
var PfAddCommand = class extends Command {
	constructor(cmd, opts) {
		super(["pfadd", ...cmd], opts);
	}
};
var PfCountCommand = class extends Command {
	constructor(cmd, opts) {
		super(["pfcount", ...cmd], opts);
	}
};
var PfMergeCommand = class extends Command {
	constructor(cmd, opts) {
		super(["pfmerge", ...cmd], opts);
	}
};
var PingCommand = class extends Command {
	constructor(cmd, opts) {
		const command = ["ping"];
		if (cmd?.[0] !== void 0) command.push(cmd[0]);
		super(command, opts);
	}
};
var PSetEXCommand = class extends Command {
	constructor(cmd, opts) {
		super(["psetex", ...cmd], opts);
	}
};
var PTtlCommand = class extends Command {
	constructor(cmd, opts) {
		super(["pttl", ...cmd], opts);
	}
};
var PublishCommand = class extends Command {
	constructor(cmd, opts) {
		super(["publish", ...cmd], opts);
	}
};
var RandomKeyCommand = class extends Command {
	constructor(opts) {
		super(["randomkey"], opts);
	}
};
var RenameCommand = class extends Command {
	constructor(cmd, opts) {
		super(["rename", ...cmd], opts);
	}
};
var RenameNXCommand = class extends Command {
	constructor(cmd, opts) {
		super(["renamenx", ...cmd], opts);
	}
};
var RPopCommand = class extends Command {
	constructor(cmd, opts) {
		super(["rpop", ...cmd], opts);
	}
};
var RPushCommand = class extends Command {
	constructor(cmd, opts) {
		super(["rpush", ...cmd], opts);
	}
};
var RPushXCommand = class extends Command {
	constructor(cmd, opts) {
		super(["rpushx", ...cmd], opts);
	}
};
var SAddCommand = class extends Command {
	constructor(cmd, opts) {
		super(["sadd", ...cmd], opts);
	}
};
var ScanCommand = class extends Command {
	constructor([cursor, opts], cmdOpts) {
		const command = ["scan", cursor];
		if (opts?.match) command.push("match", opts.match);
		if (typeof opts?.count === "number") command.push("count", opts.count);
		if (opts && "withType" in opts && opts.withType === true) command.push("withtype");
		else if (opts && "type" in opts && opts.type && opts.type.length > 0) command.push("type", opts.type);
		super(command, {
			deserialize: opts?.withType ? deserializeScanWithTypesResponse : deserializeScanResponse,
			...cmdOpts
		});
	}
};
var SCardCommand = class extends Command {
	constructor(cmd, opts) {
		super(["scard", ...cmd], opts);
	}
};
var ScriptExistsCommand = class extends Command {
	constructor(hashes, opts) {
		super([
			"script",
			"exists",
			...hashes
		], {
			deserialize: (result) => result,
			...opts
		});
	}
};
var ScriptFlushCommand = class extends Command {
	constructor([opts], cmdOpts) {
		const cmd = ["script", "flush"];
		if (opts?.sync) cmd.push("sync");
		else if (opts?.async) cmd.push("async");
		super(cmd, cmdOpts);
	}
};
var ScriptLoadCommand = class extends Command {
	constructor(args, opts) {
		super([
			"script",
			"load",
			...args
		], opts);
	}
};
var SDiffCommand = class extends Command {
	constructor(cmd, opts) {
		super(["sdiff", ...cmd], opts);
	}
};
var SDiffStoreCommand = class extends Command {
	constructor(cmd, opts) {
		super(["sdiffstore", ...cmd], opts);
	}
};
var SetCommand = class extends Command {
	constructor([key, value, opts], cmdOpts) {
		const command = [
			"set",
			key,
			value
		];
		if (opts) {
			if ("nx" in opts && opts.nx) command.push("nx");
			else if ("xx" in opts && opts.xx) command.push("xx");
			if ("get" in opts && opts.get) command.push("get");
			if ("ex" in opts && typeof opts.ex === "number") command.push("ex", opts.ex);
			else if ("px" in opts && typeof opts.px === "number") command.push("px", opts.px);
			else if ("exat" in opts && typeof opts.exat === "number") command.push("exat", opts.exat);
			else if ("pxat" in opts && typeof opts.pxat === "number") command.push("pxat", opts.pxat);
			else if ("keepTtl" in opts && opts.keepTtl) command.push("keepTtl");
		}
		super(command, cmdOpts);
	}
};
var SetBitCommand = class extends Command {
	constructor(cmd, opts) {
		super(["setbit", ...cmd], opts);
	}
};
var SetExCommand = class extends Command {
	constructor(cmd, opts) {
		super(["setex", ...cmd], opts);
	}
};
var SetNxCommand = class extends Command {
	constructor(cmd, opts) {
		super(["setnx", ...cmd], opts);
	}
};
var SetRangeCommand = class extends Command {
	constructor(cmd, opts) {
		super(["setrange", ...cmd], opts);
	}
};
var SInterCommand = class extends Command {
	constructor(cmd, opts) {
		super(["sinter", ...cmd], opts);
	}
};
var SInterCardCommand = class extends Command {
	constructor(cmd, cmdOpts) {
		const [keys, opts] = cmd;
		const command = [
			"sintercard",
			keys.length,
			...keys
		];
		if (opts?.limit !== void 0) command.push("LIMIT", opts.limit);
		super(command, cmdOpts);
	}
};
var SInterStoreCommand = class extends Command {
	constructor(cmd, opts) {
		super(["sinterstore", ...cmd], opts);
	}
};
var SIsMemberCommand = class extends Command {
	constructor(cmd, opts) {
		super(["sismember", ...cmd], opts);
	}
};
var SMembersCommand = class extends Command {
	constructor(cmd, opts) {
		super(["smembers", ...cmd], opts);
	}
};
var SMIsMemberCommand = class extends Command {
	constructor(cmd, opts) {
		super([
			"smismember",
			cmd[0],
			...cmd[1]
		], opts);
	}
};
var SMoveCommand = class extends Command {
	constructor(cmd, opts) {
		super(["smove", ...cmd], opts);
	}
};
var SPopCommand = class extends Command {
	constructor([key, count], opts) {
		const command = ["spop", key];
		if (typeof count === "number") command.push(count);
		super(command, opts);
	}
};
var SRandMemberCommand = class extends Command {
	constructor([key, count], opts) {
		const command = ["srandmember", key];
		if (typeof count === "number") command.push(count);
		super(command, opts);
	}
};
var SRemCommand = class extends Command {
	constructor(cmd, opts) {
		super(["srem", ...cmd], opts);
	}
};
var SScanCommand = class extends Command {
	constructor([key, cursor, opts], cmdOpts) {
		const command = [
			"sscan",
			key,
			cursor
		];
		if (opts?.match) command.push("match", opts.match);
		if (typeof opts?.count === "number") command.push("count", opts.count);
		super(command, {
			deserialize: deserializeScanResponse,
			...cmdOpts
		});
	}
};
var StrLenCommand = class extends Command {
	constructor(cmd, opts) {
		super(["strlen", ...cmd], opts);
	}
};
var SUnionCommand = class extends Command {
	constructor(cmd, opts) {
		super(["sunion", ...cmd], opts);
	}
};
var SUnionStoreCommand = class extends Command {
	constructor(cmd, opts) {
		super(["sunionstore", ...cmd], opts);
	}
};
var TimeCommand = class extends Command {
	constructor(opts) {
		super(["time"], opts);
	}
};
var TouchCommand = class extends Command {
	constructor(cmd, opts) {
		super(["touch", ...cmd], opts);
	}
};
var TtlCommand = class extends Command {
	constructor(cmd, opts) {
		super(["ttl", ...cmd], opts);
	}
};
var TypeCommand = class extends Command {
	constructor(cmd, opts) {
		super(["type", ...cmd], opts);
	}
};
var UnlinkCommand = class extends Command {
	constructor(cmd, opts) {
		super(["unlink", ...cmd], opts);
	}
};
var XAckCommand = class extends Command {
	constructor([key, group, id], opts) {
		const ids = Array.isArray(id) ? [...id] : [id];
		super([
			"XACK",
			key,
			group,
			...ids
		], opts);
	}
};
var XAckDelCommand = class extends Command {
	constructor([key, group, opts, ...ids], cmdOpts) {
		const command = [
			"XACKDEL",
			key,
			group
		];
		command.push(opts.toUpperCase(), "IDS", ids.length, ...ids);
		super(command, cmdOpts);
	}
};
var XAddCommand = class extends Command {
	constructor([key, id, entries, opts], commandOptions) {
		const command = ["XADD", key];
		if (opts) {
			if (opts.nomkStream) command.push("NOMKSTREAM");
			if (opts.trim) {
				command.push(opts.trim.type, opts.trim.comparison, opts.trim.threshold);
				if (opts.trim.limit !== void 0) command.push("LIMIT", opts.trim.limit);
			}
		}
		command.push(id);
		for (const [k, v] of Object.entries(entries)) command.push(k, v);
		super(command, commandOptions);
	}
};
var XAutoClaim = class extends Command {
	constructor([key, group, consumer, minIdleTime, start, options], opts) {
		const commands = [];
		if (options?.count) commands.push("COUNT", options.count);
		if (options?.justId) commands.push("JUSTID");
		super([
			"XAUTOCLAIM",
			key,
			group,
			consumer,
			minIdleTime,
			start,
			...commands
		], opts);
	}
};
var XClaimCommand = class extends Command {
	constructor([key, group, consumer, minIdleTime, id, options], opts) {
		const ids = Array.isArray(id) ? [...id] : [id];
		const commands = [];
		if (options?.idleMS) commands.push("IDLE", options.idleMS);
		if (options?.idleMS) commands.push("TIME", options.timeMS);
		if (options?.retryCount) commands.push("RETRYCOUNT", options.retryCount);
		if (options?.force) commands.push("FORCE");
		if (options?.justId) commands.push("JUSTID");
		if (options?.lastId) commands.push("LASTID", options.lastId);
		super([
			"XCLAIM",
			key,
			group,
			consumer,
			minIdleTime,
			...ids,
			...commands
		], opts);
	}
};
var XDelCommand = class extends Command {
	constructor([key, ids], opts) {
		const cmds = Array.isArray(ids) ? [...ids] : [ids];
		super([
			"XDEL",
			key,
			...cmds
		], opts);
	}
};
var XDelExCommand = class extends Command {
	constructor([key, opts, ...ids], cmdOpts) {
		const command = ["XDELEX", key];
		if (opts) command.push(opts.toUpperCase());
		command.push("IDS", ids.length, ...ids);
		super(command, cmdOpts);
	}
};
var XGroupCommand = class extends Command {
	constructor([key, opts], commandOptions) {
		const command = ["XGROUP"];
		switch (opts.type) {
			case "CREATE":
				command.push("CREATE", key, opts.group, opts.id);
				if (opts.options) {
					if (opts.options.MKSTREAM) command.push("MKSTREAM");
					if (opts.options.ENTRIESREAD !== void 0) command.push("ENTRIESREAD", opts.options.ENTRIESREAD.toString());
				}
				break;
			case "CREATECONSUMER":
				command.push("CREATECONSUMER", key, opts.group, opts.consumer);
				break;
			case "DELCONSUMER":
				command.push("DELCONSUMER", key, opts.group, opts.consumer);
				break;
			case "DESTROY":
				command.push("DESTROY", key, opts.group);
				break;
			case "SETID":
				command.push("SETID", key, opts.group, opts.id);
				if (opts.options?.ENTRIESREAD !== void 0) command.push("ENTRIESREAD", opts.options.ENTRIESREAD.toString());
				break;
			default: throw new Error("Invalid XGROUP");
		}
		super(command, commandOptions);
	}
};
var XInfoCommand = class extends Command {
	constructor([key, options], opts) {
		const cmds = [];
		if (options.type === "CONSUMERS") cmds.push("CONSUMERS", key, options.group);
		else cmds.push("GROUPS", key);
		super(["XINFO", ...cmds], opts);
	}
};
var XLenCommand = class extends Command {
	constructor(cmd, opts) {
		super(["XLEN", ...cmd], opts);
	}
};
var XPendingCommand = class extends Command {
	constructor([key, group, start, end, count, options], opts) {
		const consumers = options?.consumer === void 0 ? [] : Array.isArray(options.consumer) ? [...options.consumer] : [options.consumer];
		super([
			"XPENDING",
			key,
			group,
			...options?.idleTime ? ["IDLE", options.idleTime] : [],
			start,
			end,
			count,
			...consumers
		], opts);
	}
};
function deserialize6(result) {
	const obj = {};
	for (const e of result) for (let i = 0; i < e.length; i += 2) {
		const streamId = e[i];
		const entries = e[i + 1];
		if (!(streamId in obj)) obj[streamId] = {};
		for (let j = 0; j < entries.length; j += 2) {
			const field = entries[j];
			const value = entries[j + 1];
			try {
				obj[streamId][field] = JSON.parse(value);
			} catch {
				obj[streamId][field] = value;
			}
		}
	}
	return obj;
}
var XRangeCommand = class extends Command {
	constructor([key, start, end, count], opts) {
		const command = [
			"XRANGE",
			key,
			start,
			end
		];
		if (typeof count === "number") command.push("COUNT", count);
		super(command, {
			deserialize: (result) => deserialize6(result),
			...opts
		});
	}
};
var UNBALANCED_XREAD_ERR = "ERR Unbalanced XREAD list of streams: for each stream key an ID or '$' must be specified";
var XReadCommand = class extends Command {
	constructor([key, id, options], opts) {
		if (Array.isArray(key) && Array.isArray(id) && key.length !== id.length) throw new Error(UNBALANCED_XREAD_ERR);
		const commands = [];
		if (typeof options?.count === "number") commands.push("COUNT", options.count);
		if (typeof options?.blockMS === "number") commands.push("BLOCK", options.blockMS);
		commands.push("STREAMS", ...Array.isArray(key) ? [...key] : [key], ...Array.isArray(id) ? [...id] : [id]);
		super(["XREAD", ...commands], opts);
	}
};
var UNBALANCED_XREADGROUP_ERR = "ERR Unbalanced XREADGROUP list of streams: for each stream key an ID or '$' must be specified";
var XReadGroupCommand = class extends Command {
	constructor([group, consumer, key, id, options], opts) {
		if (Array.isArray(key) && Array.isArray(id) && key.length !== id.length) throw new Error(UNBALANCED_XREADGROUP_ERR);
		const commands = [];
		if (typeof options?.count === "number") commands.push("COUNT", options.count);
		if (typeof options?.blockMS === "number") commands.push("BLOCK", options.blockMS);
		if (typeof options?.NOACK === "boolean" && options.NOACK) commands.push("NOACK");
		commands.push("STREAMS", ...Array.isArray(key) ? [...key] : [key], ...Array.isArray(id) ? [...id] : [id]);
		super([
			"XREADGROUP",
			"GROUP",
			group,
			consumer,
			...commands
		], opts);
	}
};
var XRevRangeCommand = class extends Command {
	constructor([key, end, start, count], opts) {
		const command = [
			"XREVRANGE",
			key,
			end,
			start
		];
		if (typeof count === "number") command.push("COUNT", count);
		super(command, {
			deserialize: (result) => deserialize7(result),
			...opts
		});
	}
};
function deserialize7(result) {
	const obj = {};
	for (const e of result) for (let i = 0; i < e.length; i += 2) {
		const streamId = e[i];
		const entries = e[i + 1];
		if (!(streamId in obj)) obj[streamId] = {};
		for (let j = 0; j < entries.length; j += 2) {
			const field = entries[j];
			const value = entries[j + 1];
			try {
				obj[streamId][field] = JSON.parse(value);
			} catch {
				obj[streamId][field] = value;
			}
		}
	}
	return obj;
}
var XTrimCommand = class extends Command {
	constructor([key, options], opts) {
		const { limit, strategy, threshold, exactness = "~" } = options;
		super([
			"XTRIM",
			key,
			strategy,
			exactness,
			threshold,
			...limit ? ["LIMIT", limit] : []
		], opts);
	}
};
var ZAddCommand = class extends Command {
	constructor([key, arg1, ...arg2], opts) {
		const command = ["zadd", key];
		if ("nx" in arg1 && arg1.nx) command.push("nx");
		else if ("xx" in arg1 && arg1.xx) command.push("xx");
		if ("ch" in arg1 && arg1.ch) command.push("ch");
		if ("incr" in arg1 && arg1.incr) command.push("incr");
		if ("lt" in arg1 && arg1.lt) command.push("lt");
		else if ("gt" in arg1 && arg1.gt) command.push("gt");
		if ("score" in arg1 && "member" in arg1) command.push(arg1.score, arg1.member);
		command.push(...arg2.flatMap(({ score, member }) => [score, member]));
		super(command, opts);
	}
};
var ZCardCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zcard", ...cmd], opts);
	}
};
var ZCountCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zcount", ...cmd], opts);
	}
};
var ZIncrByCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zincrby", ...cmd], opts);
	}
};
var ZInterStoreCommand = class extends Command {
	constructor([destination, numKeys, keyOrKeys, opts], cmdOpts) {
		const command = [
			"zinterstore",
			destination,
			numKeys
		];
		if (Array.isArray(keyOrKeys)) command.push(...keyOrKeys);
		else command.push(keyOrKeys);
		if (opts) {
			if ("weights" in opts && opts.weights) command.push("weights", ...opts.weights);
			else if ("weight" in opts && typeof opts.weight === "number") command.push("weights", opts.weight);
			if ("aggregate" in opts) command.push("aggregate", opts.aggregate);
		}
		super(command, cmdOpts);
	}
};
var ZLexCountCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zlexcount", ...cmd], opts);
	}
};
var ZPopMaxCommand = class extends Command {
	constructor([key, count], opts) {
		const command = ["zpopmax", key];
		if (typeof count === "number") command.push(count);
		super(command, opts);
	}
};
var ZPopMinCommand = class extends Command {
	constructor([key, count], opts) {
		const command = ["zpopmin", key];
		if (typeof count === "number") command.push(count);
		super(command, opts);
	}
};
var ZRangeCommand = class extends Command {
	constructor([key, min, max, opts], cmdOpts) {
		const command = [
			"zrange",
			key,
			min,
			max
		];
		if (opts?.byScore) command.push("byscore");
		if (opts?.byLex) command.push("bylex");
		if (opts?.rev) command.push("rev");
		if (opts?.count !== void 0 && opts.offset !== void 0) command.push("limit", opts.offset, opts.count);
		if (opts?.withScores) command.push("withscores");
		super(command, cmdOpts);
	}
};
var ZRankCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zrank", ...cmd], opts);
	}
};
var ZRemCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zrem", ...cmd], opts);
	}
};
var ZRemRangeByLexCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zremrangebylex", ...cmd], opts);
	}
};
var ZRemRangeByRankCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zremrangebyrank", ...cmd], opts);
	}
};
var ZRemRangeByScoreCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zremrangebyscore", ...cmd], opts);
	}
};
var ZRevRankCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zrevrank", ...cmd], opts);
	}
};
var ZScanCommand = class extends Command {
	constructor([key, cursor, opts], cmdOpts) {
		const command = [
			"zscan",
			key,
			cursor
		];
		if (opts?.match) command.push("match", opts.match);
		if (typeof opts?.count === "number") command.push("count", opts.count);
		super(command, {
			deserialize: deserializeScanResponse,
			...cmdOpts
		});
	}
};
var ZScoreCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zscore", ...cmd], opts);
	}
};
var ZUnionCommand = class extends Command {
	constructor([numKeys, keyOrKeys, opts], cmdOpts) {
		const command = ["zunion", numKeys];
		if (Array.isArray(keyOrKeys)) command.push(...keyOrKeys);
		else command.push(keyOrKeys);
		if (opts) {
			if ("weights" in opts && opts.weights) command.push("weights", ...opts.weights);
			else if ("weight" in opts && typeof opts.weight === "number") command.push("weights", opts.weight);
			if ("aggregate" in opts) command.push("aggregate", opts.aggregate);
			if (opts.withScores) command.push("withscores");
		}
		super(command, cmdOpts);
	}
};
var ZUnionStoreCommand = class extends Command {
	constructor([destination, numKeys, keyOrKeys, opts], cmdOpts) {
		const command = [
			"zunionstore",
			destination,
			numKeys
		];
		if (Array.isArray(keyOrKeys)) command.push(...keyOrKeys);
		else command.push(keyOrKeys);
		if (opts) {
			if ("weights" in opts && opts.weights) command.push("weights", ...opts.weights);
			else if ("weight" in opts && typeof opts.weight === "number") command.push("weights", opts.weight);
			if ("aggregate" in opts) command.push("aggregate", opts.aggregate);
		}
		super(command, cmdOpts);
	}
};
var ZDiffStoreCommand = class extends Command {
	constructor(cmd, opts) {
		super(["zdiffstore", ...cmd], opts);
	}
};
var ZMScoreCommand = class extends Command {
	constructor(cmd, opts) {
		const [key, members] = cmd;
		super([
			"zmscore",
			key,
			...members
		], opts);
	}
};
var Pipeline = class {
	client;
	commands;
	commandOptions;
	multiExec;
	constructor(opts) {
		this.client = opts.client;
		this.commands = [];
		this.commandOptions = opts.commandOptions;
		this.multiExec = opts.multiExec ?? false;
		if (this.commandOptions?.latencyLogging) {
			const originalExec = this.exec.bind(this);
			this.exec = async (options) => {
				const start = performance.now();
				const result = await (options ? originalExec(options) : originalExec());
				const loggerResult = (performance.now() - start).toFixed(2);
				console.log(`Latency for \x1B[38;2;19;185;39m${this.multiExec ? ["MULTI-EXEC"] : ["PIPELINE"].toString().toUpperCase()}\x1B[0m: \x1B[38;2;0;255;255m${loggerResult} ms\x1B[0m`);
				return result;
			};
		}
	}
	exec = async (options) => {
		if (this.commands.length === 0) throw new Error("Pipeline is empty");
		const path = this.multiExec ? ["multi-exec"] : ["pipeline"];
		const res = await this.client.request({
			path,
			body: Object.values(this.commands).map((c) => c.command)
		});
		return options?.keepErrors ? res.map(({ error, result }, i) => {
			return {
				error,
				result: this.commands[i].deserialize(result)
			};
		}) : res.map(({ error, result }, i) => {
			if (error) throw new UpstashError(`Command ${i + 1} [ ${this.commands[i].command[0]} ] failed: ${error}`);
			return this.commands[i].deserialize(result);
		});
	};
	length() {
		return this.commands.length;
	}
	chain(command) {
		this.commands.push(command);
		return this;
	}
	append = (...args) => this.chain(new AppendCommand(args, this.commandOptions));
	bitcount = (...args) => this.chain(new BitCountCommand(args, this.commandOptions));
	bitfield = (...args) => new BitFieldCommand(args, this.client, this.commandOptions, this.chain.bind(this));
	bitop = (op, destinationKey, sourceKey, ...sourceKeys) => this.chain(new BitOpCommand([
		op,
		destinationKey,
		sourceKey,
		...sourceKeys
	], this.commandOptions));
	bitpos = (...args) => this.chain(new BitPosCommand(args, this.commandOptions));
	clientSetinfo = (...args) => this.chain(new ClientSetInfoCommand(args, this.commandOptions));
	copy = (...args) => this.chain(new CopyCommand(args, this.commandOptions));
	zdiffstore = (...args) => this.chain(new ZDiffStoreCommand(args, this.commandOptions));
	dbsize = () => this.chain(new DBSizeCommand(this.commandOptions));
	decr = (...args) => this.chain(new DecrCommand(args, this.commandOptions));
	decrby = (...args) => this.chain(new DecrByCommand(args, this.commandOptions));
	del = (...args) => this.chain(new DelCommand(args, this.commandOptions));
	echo = (...args) => this.chain(new EchoCommand(args, this.commandOptions));
	evalRo = (...args) => this.chain(new EvalROCommand(args, this.commandOptions));
	eval = (...args) => this.chain(new EvalCommand(args, this.commandOptions));
	evalshaRo = (...args) => this.chain(new EvalshaROCommand(args, this.commandOptions));
	evalsha = (...args) => this.chain(new EvalshaCommand(args, this.commandOptions));
	exists = (...args) => this.chain(new ExistsCommand(args, this.commandOptions));
	expire = (...args) => this.chain(new ExpireCommand(args, this.commandOptions));
	expireat = (...args) => this.chain(new ExpireAtCommand(args, this.commandOptions));
	flushall = (args) => this.chain(new FlushAllCommand(args, this.commandOptions));
	flushdb = (...args) => this.chain(new FlushDBCommand(args, this.commandOptions));
	geoadd = (...args) => this.chain(new GeoAddCommand(args, this.commandOptions));
	geodist = (...args) => this.chain(new GeoDistCommand(args, this.commandOptions));
	geopos = (...args) => this.chain(new GeoPosCommand(args, this.commandOptions));
	geohash = (...args) => this.chain(new GeoHashCommand(args, this.commandOptions));
	geosearch = (...args) => this.chain(new GeoSearchCommand(args, this.commandOptions));
	geosearchstore = (...args) => this.chain(new GeoSearchStoreCommand(args, this.commandOptions));
	get = (...args) => this.chain(new GetCommand(args, this.commandOptions));
	getbit = (...args) => this.chain(new GetBitCommand(args, this.commandOptions));
	getdel = (...args) => this.chain(new GetDelCommand(args, this.commandOptions));
	getex = (...args) => this.chain(new GetExCommand(args, this.commandOptions));
	getrange = (...args) => this.chain(new GetRangeCommand(args, this.commandOptions));
	getset = (key, value) => this.chain(new GetSetCommand([key, value], this.commandOptions));
	hdel = (...args) => this.chain(new HDelCommand(args, this.commandOptions));
	hexists = (...args) => this.chain(new HExistsCommand(args, this.commandOptions));
	hexpire = (...args) => this.chain(new HExpireCommand(args, this.commandOptions));
	hexpireat = (...args) => this.chain(new HExpireAtCommand(args, this.commandOptions));
	hexpiretime = (...args) => this.chain(new HExpireTimeCommand(args, this.commandOptions));
	httl = (...args) => this.chain(new HTtlCommand(args, this.commandOptions));
	hpexpire = (...args) => this.chain(new HPExpireCommand(args, this.commandOptions));
	hpexpireat = (...args) => this.chain(new HPExpireAtCommand(args, this.commandOptions));
	hpexpiretime = (...args) => this.chain(new HPExpireTimeCommand(args, this.commandOptions));
	hpttl = (...args) => this.chain(new HPTtlCommand(args, this.commandOptions));
	hpersist = (...args) => this.chain(new HPersistCommand(args, this.commandOptions));
	hget = (...args) => this.chain(new HGetCommand(args, this.commandOptions));
	hgetall = (...args) => this.chain(new HGetAllCommand(args, this.commandOptions));
	hgetdel = (...args) => this.chain(new HGetDelCommand(args, this.commandOptions));
	hgetex = (...args) => this.chain(new HGetExCommand(args, this.commandOptions));
	hincrby = (...args) => this.chain(new HIncrByCommand(args, this.commandOptions));
	hincrbyfloat = (...args) => this.chain(new HIncrByFloatCommand(args, this.commandOptions));
	hkeys = (...args) => this.chain(new HKeysCommand(args, this.commandOptions));
	hlen = (...args) => this.chain(new HLenCommand(args, this.commandOptions));
	hmget = (...args) => this.chain(new HMGetCommand(args, this.commandOptions));
	hmset = (key, kv) => this.chain(new HMSetCommand([key, kv], this.commandOptions));
	hrandfield = (key, count, withValues) => this.chain(new HRandFieldCommand([
		key,
		count,
		withValues
	], this.commandOptions));
	hscan = (...args) => this.chain(new HScanCommand(args, this.commandOptions));
	hset = (key, kv) => this.chain(new HSetCommand([key, kv], this.commandOptions));
	hsetex = (...args) => this.chain(new HSetExCommand(args, this.commandOptions));
	hsetnx = (key, field, value) => this.chain(new HSetNXCommand([
		key,
		field,
		value
	], this.commandOptions));
	hstrlen = (...args) => this.chain(new HStrLenCommand(args, this.commandOptions));
	hvals = (...args) => this.chain(new HValsCommand(args, this.commandOptions));
	incr = (...args) => this.chain(new IncrCommand(args, this.commandOptions));
	incrby = (...args) => this.chain(new IncrByCommand(args, this.commandOptions));
	incrbyfloat = (...args) => this.chain(new IncrByFloatCommand(args, this.commandOptions));
	keys = (...args) => this.chain(new KeysCommand(args, this.commandOptions));
	lindex = (...args) => this.chain(new LIndexCommand(args, this.commandOptions));
	linsert = (key, direction, pivot, value) => this.chain(new LInsertCommand([
		key,
		direction,
		pivot,
		value
	], this.commandOptions));
	llen = (...args) => this.chain(new LLenCommand(args, this.commandOptions));
	lmove = (...args) => this.chain(new LMoveCommand(args, this.commandOptions));
	lpop = (...args) => this.chain(new LPopCommand(args, this.commandOptions));
	lmpop = (...args) => this.chain(new LmPopCommand(args, this.commandOptions));
	lpos = (...args) => this.chain(new LPosCommand(args, this.commandOptions));
	lpush = (key, ...elements) => this.chain(new LPushCommand([key, ...elements], this.commandOptions));
	lpushx = (key, ...elements) => this.chain(new LPushXCommand([key, ...elements], this.commandOptions));
	lrange = (...args) => this.chain(new LRangeCommand(args, this.commandOptions));
	lrem = (key, count, value) => this.chain(new LRemCommand([
		key,
		count,
		value
	], this.commandOptions));
	lset = (key, index, value) => this.chain(new LSetCommand([
		key,
		index,
		value
	], this.commandOptions));
	ltrim = (...args) => this.chain(new LTrimCommand(args, this.commandOptions));
	mget = (...args) => this.chain(new MGetCommand(args, this.commandOptions));
	mset = (kv) => this.chain(new MSetCommand([kv], this.commandOptions));
	msetnx = (kv) => this.chain(new MSetNXCommand([kv], this.commandOptions));
	persist = (...args) => this.chain(new PersistCommand(args, this.commandOptions));
	pexpire = (...args) => this.chain(new PExpireCommand(args, this.commandOptions));
	pexpireat = (...args) => this.chain(new PExpireAtCommand(args, this.commandOptions));
	pfadd = (...args) => this.chain(new PfAddCommand(args, this.commandOptions));
	pfcount = (...args) => this.chain(new PfCountCommand(args, this.commandOptions));
	pfmerge = (...args) => this.chain(new PfMergeCommand(args, this.commandOptions));
	ping = (args) => this.chain(new PingCommand(args, this.commandOptions));
	psetex = (key, ttl, value) => this.chain(new PSetEXCommand([
		key,
		ttl,
		value
	], this.commandOptions));
	pttl = (...args) => this.chain(new PTtlCommand(args, this.commandOptions));
	publish = (...args) => this.chain(new PublishCommand(args, this.commandOptions));
	randomkey = () => this.chain(new RandomKeyCommand(this.commandOptions));
	rename = (...args) => this.chain(new RenameCommand(args, this.commandOptions));
	renamenx = (...args) => this.chain(new RenameNXCommand(args, this.commandOptions));
	rpop = (...args) => this.chain(new RPopCommand(args, this.commandOptions));
	rpush = (key, ...elements) => this.chain(new RPushCommand([key, ...elements], this.commandOptions));
	rpushx = (key, ...elements) => this.chain(new RPushXCommand([key, ...elements], this.commandOptions));
	sadd = (key, member, ...members) => this.chain(new SAddCommand([
		key,
		member,
		...members
	], this.commandOptions));
	scan = (...args) => this.chain(new ScanCommand(args, this.commandOptions));
	scard = (...args) => this.chain(new SCardCommand(args, this.commandOptions));
	scriptExists = (...args) => this.chain(new ScriptExistsCommand(args, this.commandOptions));
	scriptFlush = (...args) => this.chain(new ScriptFlushCommand(args, this.commandOptions));
	scriptLoad = (...args) => this.chain(new ScriptLoadCommand(args, this.commandOptions));
	sdiff = (...args) => this.chain(new SDiffCommand(args, this.commandOptions));
	sdiffstore = (...args) => this.chain(new SDiffStoreCommand(args, this.commandOptions));
	set = (key, value, opts) => this.chain(new SetCommand([
		key,
		value,
		opts
	], this.commandOptions));
	setbit = (...args) => this.chain(new SetBitCommand(args, this.commandOptions));
	setex = (key, ttl, value) => this.chain(new SetExCommand([
		key,
		ttl,
		value
	], this.commandOptions));
	setnx = (key, value) => this.chain(new SetNxCommand([key, value], this.commandOptions));
	setrange = (...args) => this.chain(new SetRangeCommand(args, this.commandOptions));
	sinter = (...args) => this.chain(new SInterCommand(args, this.commandOptions));
	sintercard = (...args) => this.chain(new SInterCardCommand(args, this.commandOptions));
	sinterstore = (...args) => this.chain(new SInterStoreCommand(args, this.commandOptions));
	sismember = (key, member) => this.chain(new SIsMemberCommand([key, member], this.commandOptions));
	smembers = (...args) => this.chain(new SMembersCommand(args, this.commandOptions));
	smismember = (key, members) => this.chain(new SMIsMemberCommand([key, members], this.commandOptions));
	smove = (source, destination, member) => this.chain(new SMoveCommand([
		source,
		destination,
		member
	], this.commandOptions));
	spop = (...args) => this.chain(new SPopCommand(args, this.commandOptions));
	srandmember = (...args) => this.chain(new SRandMemberCommand(args, this.commandOptions));
	srem = (key, ...members) => this.chain(new SRemCommand([key, ...members], this.commandOptions));
	sscan = (...args) => this.chain(new SScanCommand(args, this.commandOptions));
	strlen = (...args) => this.chain(new StrLenCommand(args, this.commandOptions));
	sunion = (...args) => this.chain(new SUnionCommand(args, this.commandOptions));
	sunionstore = (...args) => this.chain(new SUnionStoreCommand(args, this.commandOptions));
	time = () => this.chain(new TimeCommand(this.commandOptions));
	touch = (...args) => this.chain(new TouchCommand(args, this.commandOptions));
	ttl = (...args) => this.chain(new TtlCommand(args, this.commandOptions));
	type = (...args) => this.chain(new TypeCommand(args, this.commandOptions));
	unlink = (...args) => this.chain(new UnlinkCommand(args, this.commandOptions));
	zadd = (...args) => {
		if ("score" in args[1]) return this.chain(new ZAddCommand([
			args[0],
			args[1],
			...args.slice(2)
		], this.commandOptions));
		return this.chain(new ZAddCommand([
			args[0],
			args[1],
			...args.slice(2)
		], this.commandOptions));
	};
	xadd = (...args) => this.chain(new XAddCommand(args, this.commandOptions));
	xack = (...args) => this.chain(new XAckCommand(args, this.commandOptions));
	xackdel = (...args) => this.chain(new XAckDelCommand(args, this.commandOptions));
	xdel = (...args) => this.chain(new XDelCommand(args, this.commandOptions));
	xdelex = (...args) => this.chain(new XDelExCommand(args, this.commandOptions));
	xgroup = (...args) => this.chain(new XGroupCommand(args, this.commandOptions));
	xread = (...args) => this.chain(new XReadCommand(args, this.commandOptions));
	xreadgroup = (...args) => this.chain(new XReadGroupCommand(args, this.commandOptions));
	xinfo = (...args) => this.chain(new XInfoCommand(args, this.commandOptions));
	xlen = (...args) => this.chain(new XLenCommand(args, this.commandOptions));
	xpending = (...args) => this.chain(new XPendingCommand(args, this.commandOptions));
	xclaim = (...args) => this.chain(new XClaimCommand(args, this.commandOptions));
	xautoclaim = (...args) => this.chain(new XAutoClaim(args, this.commandOptions));
	xtrim = (...args) => this.chain(new XTrimCommand(args, this.commandOptions));
	xrange = (...args) => this.chain(new XRangeCommand(args, this.commandOptions));
	xrevrange = (...args) => this.chain(new XRevRangeCommand(args, this.commandOptions));
	zcard = (...args) => this.chain(new ZCardCommand(args, this.commandOptions));
	zcount = (...args) => this.chain(new ZCountCommand(args, this.commandOptions));
	zincrby = (key, increment, member) => this.chain(new ZIncrByCommand([
		key,
		increment,
		member
	], this.commandOptions));
	zinterstore = (...args) => this.chain(new ZInterStoreCommand(args, this.commandOptions));
	zlexcount = (...args) => this.chain(new ZLexCountCommand(args, this.commandOptions));
	zmscore = (...args) => this.chain(new ZMScoreCommand(args, this.commandOptions));
	zpopmax = (...args) => this.chain(new ZPopMaxCommand(args, this.commandOptions));
	zpopmin = (...args) => this.chain(new ZPopMinCommand(args, this.commandOptions));
	zrange = (...args) => this.chain(new ZRangeCommand(args, this.commandOptions));
	zrank = (key, member) => this.chain(new ZRankCommand([key, member], this.commandOptions));
	zrem = (key, ...members) => this.chain(new ZRemCommand([key, ...members], this.commandOptions));
	zremrangebylex = (...args) => this.chain(new ZRemRangeByLexCommand(args, this.commandOptions));
	zremrangebyrank = (...args) => this.chain(new ZRemRangeByRankCommand(args, this.commandOptions));
	zremrangebyscore = (...args) => this.chain(new ZRemRangeByScoreCommand(args, this.commandOptions));
	zrevrank = (key, member) => this.chain(new ZRevRankCommand([key, member], this.commandOptions));
	zscan = (...args) => this.chain(new ZScanCommand(args, this.commandOptions));
	zscore = (key, member) => this.chain(new ZScoreCommand([key, member], this.commandOptions));
	zunionstore = (...args) => this.chain(new ZUnionStoreCommand(args, this.commandOptions));
	zunion = (...args) => this.chain(new ZUnionCommand(args, this.commandOptions));
	get json() {
		return {
			arrappend: (...args) => this.chain(new JsonArrAppendCommand(args, this.commandOptions)),
			arrindex: (...args) => this.chain(new JsonArrIndexCommand(args, this.commandOptions)),
			arrinsert: (...args) => this.chain(new JsonArrInsertCommand(args, this.commandOptions)),
			arrlen: (...args) => this.chain(new JsonArrLenCommand(args, this.commandOptions)),
			arrpop: (...args) => this.chain(new JsonArrPopCommand(args, this.commandOptions)),
			arrtrim: (...args) => this.chain(new JsonArrTrimCommand(args, this.commandOptions)),
			clear: (...args) => this.chain(new JsonClearCommand(args, this.commandOptions)),
			del: (...args) => this.chain(new JsonDelCommand(args, this.commandOptions)),
			forget: (...args) => this.chain(new JsonForgetCommand(args, this.commandOptions)),
			get: (...args) => this.chain(new JsonGetCommand(args, this.commandOptions)),
			merge: (...args) => this.chain(new JsonMergeCommand(args, this.commandOptions)),
			mget: (...args) => this.chain(new JsonMGetCommand(args, this.commandOptions)),
			mset: (...args) => this.chain(new JsonMSetCommand(args, this.commandOptions)),
			numincrby: (...args) => this.chain(new JsonNumIncrByCommand(args, this.commandOptions)),
			nummultby: (...args) => this.chain(new JsonNumMultByCommand(args, this.commandOptions)),
			objkeys: (...args) => this.chain(new JsonObjKeysCommand(args, this.commandOptions)),
			objlen: (...args) => this.chain(new JsonObjLenCommand(args, this.commandOptions)),
			resp: (...args) => this.chain(new JsonRespCommand(args, this.commandOptions)),
			set: (...args) => this.chain(new JsonSetCommand(args, this.commandOptions)),
			strappend: (...args) => this.chain(new JsonStrAppendCommand(args, this.commandOptions)),
			strlen: (...args) => this.chain(new JsonStrLenCommand(args, this.commandOptions)),
			toggle: (...args) => this.chain(new JsonToggleCommand(args, this.commandOptions)),
			type: (...args) => this.chain(new JsonTypeCommand(args, this.commandOptions))
		};
	}
	get functions() {
		return {
			load: (...args) => this.chain(new FunctionLoadCommand(args, this.commandOptions)),
			list: (...args) => this.chain(new FunctionListCommand(args, this.commandOptions)),
			delete: (...args) => this.chain(new FunctionDeleteCommand(args, this.commandOptions)),
			flush: () => this.chain(new FunctionFlushCommand(this.commandOptions)),
			stats: () => this.chain(new FunctionStatsCommand(this.commandOptions)),
			call: (...args) => this.chain(new FCallCommand(args, this.commandOptions)),
			callRo: (...args) => this.chain(new FCallRoCommand(args, this.commandOptions))
		};
	}
};
var MAX_PIPELINE_SIZE = 1e3;
var READ_COMMANDS = new Set([
	"get",
	"getrange",
	"mget",
	"strlen",
	"bitcount",
	"bitpos",
	"getbit",
	"hexists",
	"hget",
	"hgetall",
	"hkeys",
	"hlen",
	"hmget",
	"hrandfield",
	"hscan",
	"hstrlen",
	"httl",
	"hvals",
	"hexpiretime",
	"hpexpiretime",
	"hpttl",
	"lindex",
	"llen",
	"lpos",
	"lrange",
	"scard",
	"sdiff",
	"sinter",
	"sintercard",
	"sismember",
	"smembers",
	"smismember",
	"srandmember",
	"sscan",
	"sunion",
	"zcard",
	"zcount",
	"zlexcount",
	"zmscore",
	"zrange",
	"zrank",
	"zrevrank",
	"zscan",
	"zscore",
	"zunion",
	"exists",
	"type",
	"ttl",
	"pttl",
	"randomkey",
	"touch",
	"pfcount",
	"xinfo",
	"xlen",
	"xpending",
	"xrange",
	"xread",
	"xrevrange",
	"geodist",
	"geohash",
	"geopos",
	"geosearch",
	"scriptExists",
	"evalRo",
	"evalshaRo",
	"dbsize",
	"echo",
	"ping",
	"time",
	"scan",
	"keys",
	"arrindex",
	"arrlen",
	"objkeys",
	"objlen",
	"resp",
	"list",
	"stats",
	"callRo"
]);
var EXCLUDE_COMMANDS = new Set([
	"scan",
	"keys",
	"flushdb",
	"flushall",
	"dbsize",
	"hscan",
	"hgetall",
	"hkeys",
	"lrange",
	"sscan",
	"smembers",
	"xrange",
	"xrevrange",
	"zscan",
	"zrange",
	"exec"
]);
function createAutoPipelineProxy(_redis, namespace = "root") {
	const redis = _redis;
	if (!redis.autoPipelineExecutor) redis.autoPipelineExecutor = new AutoPipelineExecutor(redis);
	return new Proxy(redis, { get: (redis2, command) => {
		if (command === "pipelineCounter") return redis2.autoPipelineExecutor.pipelineCounter;
		if (namespace === "root" && command === "json") return createAutoPipelineProxy(redis2, "json");
		if (namespace === "root" && command === "functions") return createAutoPipelineProxy(redis2, "functions");
		if (namespace === "root") {
			const commandInRedisButNotPipeline = command in redis2 && !(command in redis2.autoPipelineExecutor.pipeline);
			const isCommandExcluded = EXCLUDE_COMMANDS.has(command);
			if (commandInRedisButNotPipeline || isCommandExcluded) return redis2[command];
		}
		const pipeline = redis2.autoPipelineExecutor.pipeline;
		const targetFunction = namespace === "json" ? pipeline.json[command] : namespace === "functions" ? pipeline.functions[command] : pipeline[command];
		if (typeof targetFunction === "function") return (...args) => {
			const commandMode = READ_COMMANDS.has(command) ? "read" : "write";
			return redis2.autoPipelineExecutor.withAutoPipeline(commandMode, (pipeline2) => {
				(namespace === "json" ? pipeline2.json[command] : namespace === "functions" ? pipeline2.functions[command] : pipeline2[command])(...args);
			});
		};
		return targetFunction;
	} });
}
var AutoPipelineExecutor = class {
	pipelinePromises = new WeakMap();
	activeReadPipeline = null;
	activeWritePipeline = null;
	readIndex = 0;
	writeIndex = 0;
	redis;
	pipeline;
	pipelineCounter = 0;
	constructor(redis) {
		this.redis = redis;
		this.pipeline = redis.pipeline();
	}
	async withAutoPipeline(commandMode, executeWithPipeline) {
		const isRead = commandMode === "read";
		const activePipeline = isRead ? this.activeReadPipeline : this.activeWritePipeline;
		const pipeline = activePipeline ?? this.redis.pipeline();
		if (!activePipeline) if (isRead) {
			this.activeReadPipeline = pipeline;
			this.readIndex = 0;
		} else {
			this.activeWritePipeline = pipeline;
			this.writeIndex = 0;
		}
		const index = isRead ? this.readIndex++ : this.writeIndex++;
		executeWithPipeline(pipeline);
		if (isRead && this.readIndex >= MAX_PIPELINE_SIZE) this.activeReadPipeline = null;
		else if (!isRead && this.writeIndex >= MAX_PIPELINE_SIZE) this.activeWritePipeline = null;
		const commandResult = (await this.deferExecution().then(() => {
			if (!this.pipelinePromises.has(pipeline)) {
				const pipelinePromise = pipeline.exec({ keepErrors: true });
				this.pipelineCounter += 1;
				this.pipelinePromises.set(pipeline, pipelinePromise);
				if (this.activeReadPipeline === pipeline) this.activeReadPipeline = null;
				if (this.activeWritePipeline === pipeline) this.activeWritePipeline = null;
			}
			return this.pipelinePromises.get(pipeline);
		}))[index];
		if (commandResult.error) throw new UpstashError(`Command failed: ${commandResult.error}`);
		return commandResult.result;
	}
	async deferExecution() {
		await Promise.resolve();
		await Promise.resolve();
	}
};
var PSubscribeCommand = class extends Command {
	constructor(cmd, opts) {
		const sseHeaders = {
			Accept: "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive"
		};
		super([], {
			...opts,
			headers: sseHeaders,
			path: ["psubscribe", ...cmd],
			streamOptions: {
				isStreaming: true,
				onMessage: opts?.streamOptions?.onMessage,
				signal: opts?.streamOptions?.signal
			}
		});
	}
};
var Subscriber = class extends EventTarget {
	subscriptions;
	client;
	listeners;
	opts;
	constructor(client, channels, isPattern = false, opts) {
		super();
		this.client = client;
		this.subscriptions = new Map();
		this.listeners = new Map();
		this.opts = opts;
		for (const channel of channels) if (isPattern) this.subscribeToPattern(channel);
		else this.subscribeToChannel(channel);
	}
	subscribeToChannel(channel) {
		const controller = new AbortController();
		const command = new SubscribeCommand([channel], { streamOptions: {
			signal: controller.signal,
			onMessage: (data) => this.handleMessage(data, false)
		} });
		command.exec(this.client).catch((error) => {
			if (error.name !== "AbortError") this.dispatchToListeners("error", error);
		});
		this.subscriptions.set(channel, {
			command,
			controller,
			isPattern: false
		});
	}
	subscribeToPattern(pattern) {
		const controller = new AbortController();
		const command = new PSubscribeCommand([pattern], { streamOptions: {
			signal: controller.signal,
			onMessage: (data) => this.handleMessage(data, true)
		} });
		command.exec(this.client).catch((error) => {
			if (error.name !== "AbortError") this.dispatchToListeners("error", error);
		});
		this.subscriptions.set(pattern, {
			command,
			controller,
			isPattern: true
		});
	}
	handleMessage(data, isPattern) {
		const messageData = data.replace(/^data:\s*/, "");
		const firstCommaIndex = messageData.indexOf(",");
		const secondCommaIndex = messageData.indexOf(",", firstCommaIndex + 1);
		const thirdCommaIndex = isPattern ? messageData.indexOf(",", secondCommaIndex + 1) : -1;
		if (firstCommaIndex !== -1 && secondCommaIndex !== -1) {
			const type = messageData.slice(0, firstCommaIndex);
			if (isPattern && type === "pmessage" && thirdCommaIndex !== -1) {
				const pattern = messageData.slice(firstCommaIndex + 1, secondCommaIndex);
				const channel = messageData.slice(secondCommaIndex + 1, thirdCommaIndex);
				const messageStr = messageData.slice(thirdCommaIndex + 1);
				try {
					const message = this.opts?.automaticDeserialization === false ? messageStr : JSON.parse(messageStr);
					this.dispatchToListeners("pmessage", {
						pattern,
						channel,
						message
					});
					this.dispatchToListeners(`pmessage:${pattern}`, {
						pattern,
						channel,
						message
					});
				} catch (error) {
					this.dispatchToListeners("error", new Error(`Failed to parse message: ${error}`));
				}
			} else {
				const channel = messageData.slice(firstCommaIndex + 1, secondCommaIndex);
				const messageStr = messageData.slice(secondCommaIndex + 1);
				try {
					if (type === "subscribe" || type === "psubscribe" || type === "unsubscribe" || type === "punsubscribe") {
						const count = Number.parseInt(messageStr);
						this.dispatchToListeners(type, count);
					} else {
						const message = this.opts?.automaticDeserialization === false ? messageStr : parseWithTryCatch(messageStr);
						this.dispatchToListeners(type, {
							channel,
							message
						});
						this.dispatchToListeners(`${type}:${channel}`, {
							channel,
							message
						});
					}
				} catch (error) {
					this.dispatchToListeners("error", new Error(`Failed to parse message: ${error}`));
				}
			}
		}
	}
	dispatchToListeners(type, data) {
		const listeners = this.listeners.get(type);
		if (listeners) for (const listener of listeners) listener(data);
	}
	on(type, listener) {
		if (!this.listeners.has(type)) this.listeners.set(type, new Set());
		this.listeners.get(type)?.add(listener);
	}
	removeAllListeners() {
		this.listeners.clear();
	}
	async unsubscribe(channels) {
		if (channels) for (const channel of channels) {
			const subscription = this.subscriptions.get(channel);
			if (subscription) {
				try {
					subscription.controller.abort();
				} catch {}
				this.subscriptions.delete(channel);
			}
		}
		else {
			for (const subscription of this.subscriptions.values()) try {
				subscription.controller.abort();
			} catch {}
			this.subscriptions.clear();
			this.removeAllListeners();
		}
	}
	getSubscribedChannels() {
		return [...this.subscriptions.keys()];
	}
};
var SubscribeCommand = class extends Command {
	constructor(cmd, opts) {
		const sseHeaders = {
			Accept: "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive"
		};
		super([], {
			...opts,
			headers: sseHeaders,
			path: ["subscribe", ...cmd],
			streamOptions: {
				isStreaming: true,
				onMessage: opts?.streamOptions?.onMessage,
				signal: opts?.streamOptions?.signal
			}
		});
	}
};
var parseWithTryCatch = (str) => {
	try {
		return JSON.parse(str);
	} catch {
		return str;
	}
};
var Script = class {
	script;
	sha1;
	initPromise;
	redis;
	constructor(redis, script) {
		this.redis = redis;
		this.script = script;
		this.sha1 = "";
		this.init(script);
	}
	init(script) {
		if (!this.initPromise) this.initPromise = this.digest(script).then((sha1) => {
			this.sha1 = sha1;
		});
		return this.initPromise;
	}
	async eval(keys, args) {
		await this.init(this.script);
		return await this.redis.eval(this.script, keys, args);
	}
	async evalsha(keys, args) {
		await this.init(this.script);
		return await this.redis.evalsha(this.sha1, keys, args);
	}
	async exec(keys, args) {
		await this.init(this.script);
		return await this.redis.evalsha(this.sha1, keys, args).catch(async (error) => {
			if (error instanceof Error && error.message.toLowerCase().includes("noscript")) return await this.redis.eval(this.script, keys, args);
			throw error;
		});
	}
	async digest(s) {
		const data = new TextEncoder().encode(s);
		const hashBuffer = await subtle.digest("SHA-1", data);
		return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
	}
};
var ScriptRO = class {
	script;
	sha1;
	initPromise;
	redis;
	constructor(redis, script) {
		this.redis = redis;
		this.sha1 = "";
		this.script = script;
		this.init(script);
	}
	init(script) {
		if (!this.initPromise) this.initPromise = this.digest(script).then((sha1) => {
			this.sha1 = sha1;
		});
		return this.initPromise;
	}
	async evalRo(keys, args) {
		await this.init(this.script);
		return await this.redis.evalRo(this.script, keys, args);
	}
	async evalshaRo(keys, args) {
		await this.init(this.script);
		return await this.redis.evalshaRo(this.sha1, keys, args);
	}
	async exec(keys, args) {
		await this.init(this.script);
		return await this.redis.evalshaRo(this.sha1, keys, args).catch(async (error) => {
			if (error instanceof Error && error.message.toLowerCase().includes("noscript")) return await this.redis.evalRo(this.script, keys, args);
			throw error;
		});
	}
	async digest(s) {
		const data = new TextEncoder().encode(s);
		const hashBuffer = await subtle.digest("SHA-1", data);
		return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
	}
};
var Redis = class {
	client;
	opts;
	enableTelemetry;
	enableAutoPipelining;
	constructor(client, opts) {
		this.client = client;
		this.opts = opts;
		this.enableTelemetry = opts?.enableTelemetry ?? true;
		if (opts?.readYourWrites === false) this.client.readYourWrites = false;
		this.enableAutoPipelining = opts?.enableAutoPipelining ?? true;
	}
	get readYourWritesSyncToken() {
		return this.client.upstashSyncToken;
	}
	set readYourWritesSyncToken(session) {
		this.client.upstashSyncToken = session;
	}
	get json() {
		return {
			arrappend: (...args) => new JsonArrAppendCommand(args, this.opts).exec(this.client),
			arrindex: (...args) => new JsonArrIndexCommand(args, this.opts).exec(this.client),
			arrinsert: (...args) => new JsonArrInsertCommand(args, this.opts).exec(this.client),
			arrlen: (...args) => new JsonArrLenCommand(args, this.opts).exec(this.client),
			arrpop: (...args) => new JsonArrPopCommand(args, this.opts).exec(this.client),
			arrtrim: (...args) => new JsonArrTrimCommand(args, this.opts).exec(this.client),
			clear: (...args) => new JsonClearCommand(args, this.opts).exec(this.client),
			del: (...args) => new JsonDelCommand(args, this.opts).exec(this.client),
			forget: (...args) => new JsonForgetCommand(args, this.opts).exec(this.client),
			get: (...args) => new JsonGetCommand(args, this.opts).exec(this.client),
			merge: (...args) => new JsonMergeCommand(args, this.opts).exec(this.client),
			mget: (...args) => new JsonMGetCommand(args, this.opts).exec(this.client),
			mset: (...args) => new JsonMSetCommand(args, this.opts).exec(this.client),
			numincrby: (...args) => new JsonNumIncrByCommand(args, this.opts).exec(this.client),
			nummultby: (...args) => new JsonNumMultByCommand(args, this.opts).exec(this.client),
			objkeys: (...args) => new JsonObjKeysCommand(args, this.opts).exec(this.client),
			objlen: (...args) => new JsonObjLenCommand(args, this.opts).exec(this.client),
			resp: (...args) => new JsonRespCommand(args, this.opts).exec(this.client),
			set: (...args) => new JsonSetCommand(args, this.opts).exec(this.client),
			strappend: (...args) => new JsonStrAppendCommand(args, this.opts).exec(this.client),
			strlen: (...args) => new JsonStrLenCommand(args, this.opts).exec(this.client),
			toggle: (...args) => new JsonToggleCommand(args, this.opts).exec(this.client),
			type: (...args) => new JsonTypeCommand(args, this.opts).exec(this.client)
		};
	}
	get functions() {
		return {
			load: (...args) => new FunctionLoadCommand(args, this.opts).exec(this.client),
			list: (...args) => new FunctionListCommand(args, this.opts).exec(this.client),
			delete: (...args) => new FunctionDeleteCommand(args, this.opts).exec(this.client),
			flush: () => new FunctionFlushCommand(this.opts).exec(this.client),
			stats: () => new FunctionStatsCommand(this.opts).exec(this.client),
			call: (...args) => new FCallCommand(args, this.opts).exec(this.client),
			callRo: (...args) => new FCallRoCommand(args, this.opts).exec(this.client)
		};
	}
	use = (middleware) => {
		const makeRequest = this.client.request.bind(this.client);
		this.client.request = (req) => middleware(req, makeRequest);
	};
	addTelemetry = (telemetry) => {
		if (!this.enableTelemetry) return;
		try {
			this.client.mergeTelemetry(telemetry);
		} catch {}
	};
	createScript(script, opts) {
		return opts?.readonly ? new ScriptRO(this, script) : new Script(this, script);
	}
	get search() {
		return {
			createIndex: (params) => {
				return createIndex(this.client, params);
			},
			index: (params) => {
				return initIndex(this.client, params);
			},
			alias: {
				list: () => {
					return listAliases(this.client);
				},
				add: ({ indexName, alias }) => {
					return addAlias(this.client, {
						indexName,
						alias
					});
				},
				delete: ({ alias }) => {
					return delAlias(this.client, { alias });
				}
			}
		};
	}
	pipeline = () => new Pipeline({
		client: this.client,
		commandOptions: this.opts,
		multiExec: false
	});
	autoPipeline = () => {
		return createAutoPipelineProxy(this);
	};
	multi = () => new Pipeline({
		client: this.client,
		commandOptions: this.opts,
		multiExec: true
	});
	bitfield = (...args) => new BitFieldCommand(args, this.client, this.opts);
	append = (...args) => new AppendCommand(args, this.opts).exec(this.client);
	bitcount = (...args) => new BitCountCommand(args, this.opts).exec(this.client);
	bitop = (op, destinationKey, sourceKey, ...sourceKeys) => new BitOpCommand([
		op,
		destinationKey,
		sourceKey,
		...sourceKeys
	], this.opts).exec(this.client);
	bitpos = (...args) => new BitPosCommand(args, this.opts).exec(this.client);
	clientSetinfo = (...args) => new ClientSetInfoCommand(args, this.opts).exec(this.client);
	copy = (...args) => new CopyCommand(args, this.opts).exec(this.client);
	dbsize = () => new DBSizeCommand(this.opts).exec(this.client);
	decr = (...args) => new DecrCommand(args, this.opts).exec(this.client);
	decrby = (...args) => new DecrByCommand(args, this.opts).exec(this.client);
	del = (...args) => new DelCommand(args, this.opts).exec(this.client);
	echo = (...args) => new EchoCommand(args, this.opts).exec(this.client);
	evalRo = (...args) => new EvalROCommand(args, this.opts).exec(this.client);
	eval = (...args) => new EvalCommand(args, this.opts).exec(this.client);
	evalshaRo = (...args) => new EvalshaROCommand(args, this.opts).exec(this.client);
	evalsha = (...args) => new EvalshaCommand(args, this.opts).exec(this.client);
	exec = (args) => new ExecCommand(args, this.opts).exec(this.client);
	exists = (...args) => new ExistsCommand(args, this.opts).exec(this.client);
	expire = (...args) => new ExpireCommand(args, this.opts).exec(this.client);
	expireat = (...args) => new ExpireAtCommand(args, this.opts).exec(this.client);
	flushall = (args) => new FlushAllCommand(args, this.opts).exec(this.client);
	flushdb = (...args) => new FlushDBCommand(args, this.opts).exec(this.client);
	geoadd = (...args) => new GeoAddCommand(args, this.opts).exec(this.client);
	geopos = (...args) => new GeoPosCommand(args, this.opts).exec(this.client);
	geodist = (...args) => new GeoDistCommand(args, this.opts).exec(this.client);
	geohash = (...args) => new GeoHashCommand(args, this.opts).exec(this.client);
	geosearch = (...args) => new GeoSearchCommand(args, this.opts).exec(this.client);
	geosearchstore = (...args) => new GeoSearchStoreCommand(args, this.opts).exec(this.client);
	get = (...args) => new GetCommand(args, this.opts).exec(this.client);
	getbit = (...args) => new GetBitCommand(args, this.opts).exec(this.client);
	getdel = (...args) => new GetDelCommand(args, this.opts).exec(this.client);
	getex = (...args) => new GetExCommand(args, this.opts).exec(this.client);
	getrange = (...args) => new GetRangeCommand(args, this.opts).exec(this.client);
	getset = (key, value) => new GetSetCommand([key, value], this.opts).exec(this.client);
	hdel = (...args) => new HDelCommand(args, this.opts).exec(this.client);
	hexists = (...args) => new HExistsCommand(args, this.opts).exec(this.client);
	hexpire = (...args) => new HExpireCommand(args, this.opts).exec(this.client);
	hexpireat = (...args) => new HExpireAtCommand(args, this.opts).exec(this.client);
	hexpiretime = (...args) => new HExpireTimeCommand(args, this.opts).exec(this.client);
	httl = (...args) => new HTtlCommand(args, this.opts).exec(this.client);
	hpexpire = (...args) => new HPExpireCommand(args, this.opts).exec(this.client);
	hpexpireat = (...args) => new HPExpireAtCommand(args, this.opts).exec(this.client);
	hpexpiretime = (...args) => new HPExpireTimeCommand(args, this.opts).exec(this.client);
	hpttl = (...args) => new HPTtlCommand(args, this.opts).exec(this.client);
	hpersist = (...args) => new HPersistCommand(args, this.opts).exec(this.client);
	hget = (...args) => new HGetCommand(args, this.opts).exec(this.client);
	hgetall = (...args) => new HGetAllCommand(args, this.opts).exec(this.client);
	hgetdel = (...args) => new HGetDelCommand(args, this.opts).exec(this.client);
	hgetex = (...args) => new HGetExCommand(args, this.opts).exec(this.client);
	hincrby = (...args) => new HIncrByCommand(args, this.opts).exec(this.client);
	hincrbyfloat = (...args) => new HIncrByFloatCommand(args, this.opts).exec(this.client);
	hkeys = (...args) => new HKeysCommand(args, this.opts).exec(this.client);
	hlen = (...args) => new HLenCommand(args, this.opts).exec(this.client);
	hmget = (...args) => new HMGetCommand(args, this.opts).exec(this.client);
	hmset = (key, kv) => new HMSetCommand([key, kv], this.opts).exec(this.client);
	hrandfield = (key, count, withValues) => new HRandFieldCommand([
		key,
		count,
		withValues
	], this.opts).exec(this.client);
	hscan = (...args) => new HScanCommand(args, this.opts).exec(this.client);
	hset = (key, kv) => new HSetCommand([key, kv], this.opts).exec(this.client);
	hsetex = (...args) => new HSetExCommand(args, this.opts).exec(this.client);
	hsetnx = (key, field, value) => new HSetNXCommand([
		key,
		field,
		value
	], this.opts).exec(this.client);
	hstrlen = (...args) => new HStrLenCommand(args, this.opts).exec(this.client);
	hvals = (...args) => new HValsCommand(args, this.opts).exec(this.client);
	incr = (...args) => new IncrCommand(args, this.opts).exec(this.client);
	incrby = (...args) => new IncrByCommand(args, this.opts).exec(this.client);
	incrbyfloat = (...args) => new IncrByFloatCommand(args, this.opts).exec(this.client);
	keys = (...args) => new KeysCommand(args, this.opts).exec(this.client);
	lindex = (...args) => new LIndexCommand(args, this.opts).exec(this.client);
	linsert = (key, direction, pivot, value) => new LInsertCommand([
		key,
		direction,
		pivot,
		value
	], this.opts).exec(this.client);
	llen = (...args) => new LLenCommand(args, this.opts).exec(this.client);
	lmove = (...args) => new LMoveCommand(args, this.opts).exec(this.client);
	lpop = (...args) => new LPopCommand(args, this.opts).exec(this.client);
	lmpop = (...args) => new LmPopCommand(args, this.opts).exec(this.client);
	lpos = (...args) => new LPosCommand(args, this.opts).exec(this.client);
	lpush = (key, ...elements) => new LPushCommand([key, ...elements], this.opts).exec(this.client);
	lpushx = (key, ...elements) => new LPushXCommand([key, ...elements], this.opts).exec(this.client);
	lrange = (...args) => new LRangeCommand(args, this.opts).exec(this.client);
	lrem = (key, count, value) => new LRemCommand([
		key,
		count,
		value
	], this.opts).exec(this.client);
	lset = (key, index, value) => new LSetCommand([
		key,
		index,
		value
	], this.opts).exec(this.client);
	ltrim = (...args) => new LTrimCommand(args, this.opts).exec(this.client);
	mget = (...args) => new MGetCommand(args, this.opts).exec(this.client);
	mset = (kv) => new MSetCommand([kv], this.opts).exec(this.client);
	msetnx = (kv) => new MSetNXCommand([kv], this.opts).exec(this.client);
	persist = (...args) => new PersistCommand(args, this.opts).exec(this.client);
	pexpire = (...args) => new PExpireCommand(args, this.opts).exec(this.client);
	pexpireat = (...args) => new PExpireAtCommand(args, this.opts).exec(this.client);
	pfadd = (...args) => new PfAddCommand(args, this.opts).exec(this.client);
	pfcount = (...args) => new PfCountCommand(args, this.opts).exec(this.client);
	pfmerge = (...args) => new PfMergeCommand(args, this.opts).exec(this.client);
	ping = (args) => new PingCommand(args, this.opts).exec(this.client);
	psetex = (key, ttl, value) => new PSetEXCommand([
		key,
		ttl,
		value
	], this.opts).exec(this.client);
	psubscribe = (patterns) => {
		const patternArray = Array.isArray(patterns) ? patterns : [patterns];
		return new Subscriber(this.client, patternArray, true, this.opts);
	};
	pttl = (...args) => new PTtlCommand(args, this.opts).exec(this.client);
	publish = (...args) => new PublishCommand(args, this.opts).exec(this.client);
	randomkey = () => new RandomKeyCommand().exec(this.client);
	rename = (...args) => new RenameCommand(args, this.opts).exec(this.client);
	renamenx = (...args) => new RenameNXCommand(args, this.opts).exec(this.client);
	rpop = (...args) => new RPopCommand(args, this.opts).exec(this.client);
	rpush = (key, ...elements) => new RPushCommand([key, ...elements], this.opts).exec(this.client);
	rpushx = (key, ...elements) => new RPushXCommand([key, ...elements], this.opts).exec(this.client);
	sadd = (key, member, ...members) => new SAddCommand([
		key,
		member,
		...members
	], this.opts).exec(this.client);
	scan(cursor, opts) {
		return new ScanCommand([cursor, opts], this.opts).exec(this.client);
	}
	scard = (...args) => new SCardCommand(args, this.opts).exec(this.client);
	scriptExists = (...args) => new ScriptExistsCommand(args, this.opts).exec(this.client);
	scriptFlush = (...args) => new ScriptFlushCommand(args, this.opts).exec(this.client);
	scriptLoad = (...args) => new ScriptLoadCommand(args, this.opts).exec(this.client);
	sdiff = (...args) => new SDiffCommand(args, this.opts).exec(this.client);
	sdiffstore = (...args) => new SDiffStoreCommand(args, this.opts).exec(this.client);
	set = (key, value, opts) => new SetCommand([
		key,
		value,
		opts
	], this.opts).exec(this.client);
	setbit = (...args) => new SetBitCommand(args, this.opts).exec(this.client);
	setex = (key, ttl, value) => new SetExCommand([
		key,
		ttl,
		value
	], this.opts).exec(this.client);
	setnx = (key, value) => new SetNxCommand([key, value], this.opts).exec(this.client);
	setrange = (...args) => new SetRangeCommand(args, this.opts).exec(this.client);
	sinter = (...args) => new SInterCommand(args, this.opts).exec(this.client);
	sintercard = (...args) => new SInterCardCommand(args, this.opts).exec(this.client);
	sinterstore = (...args) => new SInterStoreCommand(args, this.opts).exec(this.client);
	sismember = (key, member) => new SIsMemberCommand([key, member], this.opts).exec(this.client);
	smismember = (key, members) => new SMIsMemberCommand([key, members], this.opts).exec(this.client);
	smembers = (...args) => new SMembersCommand(args, this.opts).exec(this.client);
	smove = (source, destination, member) => new SMoveCommand([
		source,
		destination,
		member
	], this.opts).exec(this.client);
	spop = (...args) => new SPopCommand(args, this.opts).exec(this.client);
	srandmember = (...args) => new SRandMemberCommand(args, this.opts).exec(this.client);
	srem = (key, ...members) => new SRemCommand([key, ...members], this.opts).exec(this.client);
	sscan = (...args) => new SScanCommand(args, this.opts).exec(this.client);
	strlen = (...args) => new StrLenCommand(args, this.opts).exec(this.client);
	subscribe = (channels) => {
		const channelArray = Array.isArray(channels) ? channels : [channels];
		return new Subscriber(this.client, channelArray, false, this.opts);
	};
	sunion = (...args) => new SUnionCommand(args, this.opts).exec(this.client);
	sunionstore = (...args) => new SUnionStoreCommand(args, this.opts).exec(this.client);
	time = () => new TimeCommand().exec(this.client);
	touch = (...args) => new TouchCommand(args, this.opts).exec(this.client);
	ttl = (...args) => new TtlCommand(args, this.opts).exec(this.client);
	type = (...args) => new TypeCommand(args, this.opts).exec(this.client);
	unlink = (...args) => new UnlinkCommand(args, this.opts).exec(this.client);
	xadd = (...args) => new XAddCommand(args, this.opts).exec(this.client);
	xack = (...args) => new XAckCommand(args, this.opts).exec(this.client);
	xackdel = (...args) => new XAckDelCommand(args, this.opts).exec(this.client);
	xdel = (...args) => new XDelCommand(args, this.opts).exec(this.client);
	xdelex = (...args) => new XDelExCommand(args, this.opts).exec(this.client);
	xgroup = (...args) => new XGroupCommand(args, this.opts).exec(this.client);
	xread = (...args) => new XReadCommand(args, this.opts).exec(this.client);
	xreadgroup = (...args) => new XReadGroupCommand(args, this.opts).exec(this.client);
	xinfo = (...args) => new XInfoCommand(args, this.opts).exec(this.client);
	xlen = (...args) => new XLenCommand(args, this.opts).exec(this.client);
	xpending = (...args) => new XPendingCommand(args, this.opts).exec(this.client);
	xclaim = (...args) => new XClaimCommand(args, this.opts).exec(this.client);
	xautoclaim = (...args) => new XAutoClaim(args, this.opts).exec(this.client);
	xtrim = (...args) => new XTrimCommand(args, this.opts).exec(this.client);
	xrange = (...args) => new XRangeCommand(args, this.opts).exec(this.client);
	xrevrange = (...args) => new XRevRangeCommand(args, this.opts).exec(this.client);
	zadd = (...args) => {
		if ("score" in args[1]) return new ZAddCommand([
			args[0],
			args[1],
			...args.slice(2)
		], this.opts).exec(this.client);
		return new ZAddCommand([
			args[0],
			args[1],
			...args.slice(2)
		], this.opts).exec(this.client);
	};
	zcard = (...args) => new ZCardCommand(args, this.opts).exec(this.client);
	zcount = (...args) => new ZCountCommand(args, this.opts).exec(this.client);
	zdiffstore = (...args) => new ZDiffStoreCommand(args, this.opts).exec(this.client);
	zincrby = (key, increment, member) => new ZIncrByCommand([
		key,
		increment,
		member
	], this.opts).exec(this.client);
	zinterstore = (...args) => new ZInterStoreCommand(args, this.opts).exec(this.client);
	zlexcount = (...args) => new ZLexCountCommand(args, this.opts).exec(this.client);
	zmscore = (...args) => new ZMScoreCommand(args, this.opts).exec(this.client);
	zpopmax = (...args) => new ZPopMaxCommand(args, this.opts).exec(this.client);
	zpopmin = (...args) => new ZPopMinCommand(args, this.opts).exec(this.client);
	zrange = (...args) => new ZRangeCommand(args, this.opts).exec(this.client);
	zrank = (key, member) => new ZRankCommand([key, member], this.opts).exec(this.client);
	zrem = (key, ...members) => new ZRemCommand([key, ...members], this.opts).exec(this.client);
	zremrangebylex = (...args) => new ZRemRangeByLexCommand(args, this.opts).exec(this.client);
	zremrangebyrank = (...args) => new ZRemRangeByRankCommand(args, this.opts).exec(this.client);
	zremrangebyscore = (...args) => new ZRemRangeByScoreCommand(args, this.opts).exec(this.client);
	zrevrank = (key, member) => new ZRevRankCommand([key, member], this.opts).exec(this.client);
	zscan = (...args) => new ZScanCommand(args, this.opts).exec(this.client);
	zscore = (key, member) => new ZScoreCommand([key, member], this.opts).exec(this.client);
	zunion = (...args) => new ZUnionCommand(args, this.opts).exec(this.client);
	zunionstore = (...args) => new ZUnionStoreCommand(args, this.opts).exec(this.client);
};
var VERSION = "v1.38.1";
if (typeof atob === "undefined") global.atob = (b64) => Buffer.from(b64, "base64").toString("utf8");
var Redis2 = class _Redis extends Redis {
	constructor(configOrRequester) {
		if ("request" in configOrRequester) {
			super(configOrRequester);
			return;
		}
		if (!configOrRequester.url) console.warn(`[Upstash Redis] The 'url' property is missing or undefined in your Redis config. To create a database instantly (no signup needed), run: curl -X POST https://upstash.com/start-redis`);
		else if (configOrRequester.url.startsWith(" ") || configOrRequester.url.endsWith(" ") || /\r|\n/.test(configOrRequester.url)) console.warn("[Upstash Redis] The redis url contains whitespace or newline, which can cause errors!");
		if (!configOrRequester.token) console.warn(`[Upstash Redis] The 'token' property is missing or undefined in your Redis config. To create a database instantly (no signup needed), run: curl -X POST https://upstash.com/start-redis`);
		else if (configOrRequester.token.startsWith(" ") || configOrRequester.token.endsWith(" ") || /\r|\n/.test(configOrRequester.token)) console.warn("[Upstash Redis] The redis token contains whitespace or newline, which can cause errors!");
		const client = new HttpClient({
			baseUrl: configOrRequester.url,
			retry: configOrRequester.retry,
			headers: { authorization: `Bearer ${configOrRequester.token}` },
			agent: configOrRequester.agent,
			responseEncoding: configOrRequester.responseEncoding,
			cache: configOrRequester.cache ?? "no-store",
			signal: configOrRequester.signal,
			keepAlive: configOrRequester.keepAlive,
			readYourWrites: configOrRequester.readYourWrites
		});
		const safeEnv = typeof process === "object" && process && typeof process.env === "object" && process.env ? process.env : {};
		super(client, {
			automaticDeserialization: configOrRequester.automaticDeserialization,
			enableTelemetry: configOrRequester.enableTelemetry ?? !safeEnv.UPSTASH_DISABLE_TELEMETRY,
			latencyLogging: configOrRequester.latencyLogging,
			enableAutoPipelining: configOrRequester.enableAutoPipelining
		});
		const nodeVersion = typeof process === "object" && process ? process.version : void 0;
		this.addTelemetry({
			runtime: typeof EdgeRuntime === "string" ? "edge-light" : nodeVersion ? `node@${nodeVersion}` : "unknown",
			platform: safeEnv.UPSTASH_CONSOLE ? "console" : safeEnv.VERCEL ? "vercel" : safeEnv.AWS_REGION ? "aws" : "unknown",
			sdk: `@upstash/redis@${VERSION}`
		});
		if (this.enableAutoPipelining) return this.autoPipeline();
	}
	static fromEnv(config) {
		if (typeof process !== "object" || !process || typeof process.env !== "object" || !process.env) throw new TypeError("[Upstash Redis] Unable to get environment variables, `process.env` is undefined. If you are deploying to cloudflare, please import from \"@upstash/redis/cloudflare\" instead");
		const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
		if (!url) console.warn("[Upstash Redis] Unable to find environment variable: `UPSTASH_REDIS_REST_URL`. To create a database instantly (no signup needed), run: curl -X POST https://upstash.com/start-redis");
		const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
		if (!token) console.warn("[Upstash Redis] Unable to find environment variable: `UPSTASH_REDIS_REST_TOKEN`. To create a database instantly (no signup needed), run: curl -X POST https://upstash.com/start-redis");
		return new _Redis({
			...config,
			url,
			token
		});
	}
};
var _kv = null;
process.env.UPSTASH_DISABLE_TELEMETRY = "1";
var VercelKV = class extends Redis2 {
	async *scanIterator(options) {
		let cursor = "0";
		let keys;
		do {
			[cursor, keys] = await this.scan(cursor, options);
			for (const key of keys) yield key;
		} while (cursor !== "0");
	}
	async *hscanIterator(key, options) {
		let cursor = "0";
		let items;
		do {
			[cursor, items] = await this.hscan(key, cursor, options);
			for (const item of items) yield item;
		} while (cursor !== "0");
	}
	async *sscanIterator(key, options) {
		let cursor = "0";
		let items;
		do {
			[cursor, items] = await this.sscan(key, cursor, options);
			for (const item of items) yield item;
		} while (cursor !== "0");
	}
	async *zscanIterator(key, options) {
		let cursor = "0";
		let items;
		do {
			[cursor, items] = await this.zscan(key, cursor, options);
			for (const item of items) yield item;
		} while (cursor !== "0");
	}
};
function createClient(config) {
	return new VercelKV({
		cache: "default",
		enableAutoPipelining: true,
		...config
	});
}
new Proxy({}, { get(target, prop, receiver) {
	if (prop === "then" || prop === "parse") return Reflect.get(target, prop, receiver);
	if (!_kv) {
		if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) throw new Error("@vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN");
		console.warn("\x1B[33m\"The default export has been moved to a named export and it will be removed in version 1, change to import { kv }\x1B[0m\"");
		_kv = createClient({
			url: process.env.KV_REST_API_URL,
			token: process.env.KV_REST_API_TOKEN
		});
	}
	return Reflect.get(_kv, prop);
} });
var kv = new Proxy({}, { get(target, prop) {
	if (!_kv) {
		if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) throw new Error("@vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN");
		_kv = createClient({
			url: process.env.KV_REST_API_URL,
			token: process.env.KV_REST_API_TOKEN
		});
	}
	return Reflect.get(_kv, prop);
} });
var pick_rotating_content_exports = __exportAll({ default: () => pick_rotating_content_default });
const BASE_URL = "https://ratnalabala.vercel.app";
const SAMETALU_FILES = [
	"a",
	"aa",
	"am",
	"ba",
	"bha",
	"ca",
	"cha",
	"da",
	"da2",
	"dha",
	"dha2",
	"e",
	"ee",
	"ga",
	"ha",
	"i",
	"ja",
	"ka",
	"ksha",
	"la",
	"ma",
	"na2",
	"o",
	"oo",
	"pa",
	"ra",
	"sa",
	"sha",
	"ssa",
	"tha2",
	"u",
	"uu",
	"va"
];
async function pickRandomPoem() {
	const data = await (await fetch(`${BASE_URL}/api/poems`)).json();
	const titles = Object.keys(data);
	const title = titles[Math.floor(Math.random() * titles.length)];
	return {
		category: "poem",
		title,
		text: data[title]
	};
}
async function pickRandomKatha() {
	const data = await (await fetch(`${BASE_URL}/api/kathamala`)).json();
	const titles = Object.keys(data);
	const title = titles[Math.floor(Math.random() * titles.length)];
	return {
		category: "katha",
		title,
		text: data[title]
	};
}
async function pickRandomSameta() {
	const filename = SAMETALU_FILES[Math.floor(Math.random() * SAMETALU_FILES.length)];
	const items = (await (await fetch(`${BASE_URL}/ssmetalamala/${filename}.json`)).json()).sametalu ?? [];
	const item = items[Math.floor(Math.random() * items.length)];
	return {
		category: "sameta",
		title: item?.text?.slice(0, 40) ?? "",
		text: item?.text ?? ""
	};
}
function getCurrentSlotCategory() {
	const hour = new Date().getUTCHours();
	return [
		"poem",
		"katha",
		"sameta"
	][Math.floor(hour / 6) % 3];
}
var pick_rotating_content_default = defineTool({
	description: "current 6-hour time slot based poem, katha, or sameta selector",
	inputSchema: {
		type: "object",
		properties: { trigger: {
			type: "string",
			description: "Optional trigger reason, not used"
		} }
	},
	async execute() {
		const category = getCurrentSlotCategory();
		let content;
		if (category === "poem") content = await pickRandomPoem();
		else if (category === "katha") content = await pickRandomKatha();
		else content = await pickRandomSameta();
		const payload = {
			...content,
			updatedAt: new Date().toISOString()
		};
		await kv.set("featured-content", JSON.stringify(payload));
		return payload;
	}
});
const moduleMap = Object.freeze({ "nodes": Object.freeze({ "__root__": Object.freeze({ "modules": Object.freeze({
	"agent.ts": agent_exports,
	"channels/eve.ts": eve_exports,
	"tools/pick_rotating_content.ts": pick_rotating_content_exports
}) }) }) });
export { moduleMap as default, moduleMap };
