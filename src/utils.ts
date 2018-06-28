import * as fs from 'fs';
import * as vm from 'vm';
import * as path from 'path';
import {Context} from "vm";

import * as extend from 'extend';
import ErrorWrapper from './errorWrapper';

export function sourceSync (filename: string, context: Context) {
	if (!fs.existsSync(filename)) {
		return new ErrorWrapper('No such file: ' + filename);
	}
	const contents: string = fs.readFileSync(filename).toString();
	return vm.runInContext(contents, context);
}

export function isString (candidate: any): boolean {
	return typeof candidate === 'string' || candidate instanceof String;
}

export function isFunction (candidate: any): boolean {
	/* Javascript Garden says that this check is not complete, but it seems to be, at least in node v0.10.29. All
	 * functions pass this check, even if created with new Function(), and nothing else seems to be detected as a
	 * function, not even regular expressions. */
	return typeof candidate === 'function';
}

export function isArray (candidate: any): boolean {
	return Array.isArray(candidate);
}

/**
 * Returns true if candidate is an Object which is NOT a Function, RegExp, Array, Number, String, Error or Date
 */
export function isObject (candidate: any): boolean {
	/* According to Javascript Garden this is the one and only way to reliably do this */
	return Object.prototype.toString.call(candidate) === '[object Object]';
}

export function isNumber (candidate: any): boolean {
	return !isNaN(candidate);
}

export function getUserHome (): string {
	const prop: string = (process.platform === 'win32') ? 'USERPROFILE' : 'HOME';
	return process.env[prop];
}

export function expandHomeDir (dir: any): string {
	if (this.isString(dir)) {
		if (dir === '~') {
			return this.getUserHome();
		} else if (dir.indexOf('~' + path.sep) === 0) {
			return this.getUserHome() + path.sep + dir.substring(2);
		}
	}
	return dir;
}

export {extend as extend}

// TODO RESEARCH WHETHER IT'S POSSIBLE TO CREATE TYPE-SAFE ENUMS, LOOK INTO GENERICS
export function createEnum (...argv: string[]): { [index: string]: symbol } {
	var enum_: { [key: string]: symbol } = {};
	argv.forEach((arg: string) => {
		enum_[arg] = Symbol(arg);
	});
	return enum_;
}

/**
 * Breaks a string into individual characters and creates an object in which each character is a key, with each value
 * being the same as the key.
 * @param {string} str
 * @returns {{[key: string]: string}}
 */
export function strToObj (str: string): { [key: string]: string } {
	var props: string[] = str.split('');
	return props.reduce((obj: { [key: string]: string }, prop: string) => { /* show off */
		obj[prop] = prop;
		return obj;
	}, {});
}
