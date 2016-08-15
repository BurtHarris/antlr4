// misc/index.ts
/* 
 * [The "BSD license"]
 *  Copyright (c) 2012 Terence Parr
 *  Copyright (c) 2012 Sam Harwell
 *  Copyrihht (c) 2016 Burt Harris
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions
 *  are met:
 *
 *  1. Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *  2. Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *  3. The name of the author may not be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 *  IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 *  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 *  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 *  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 *  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * An alternate version of the Set interface, differing from the JavaScript standard Set in small ways (motivated by 
 * byValue semantics, rather than identity semantics):
 *   - add(value: T) **T** (not Set<T>, because if there is already an exsiting item that "equals" the existing one, we return it.
 *   - entries() is omitted.   It's redundant, use values();  
 *   - get(value: T) T (new method to retrieve and return any value that "equals" the one passed in)
 *   - keys() is omitted.   It too is redundant with values(). 
 */
interface ValueSet<T> {
    add(value: T): T;
    clear(): void;
    delete(value: T): boolean;
    forEach(callbackfn: (value: T, index: T, set: ValueSet<T>) => void, thisArg?: any): void;
    get(value: T): T;
	has(value: T): boolean;
    size: number;
    values(): IterableIterator<T>;
    //[Symbol.iterator]():IterableIterator<T>;
    //[Symbol.toStringTag]: "ValueSet";
}

interface ValueSetConstructor {
    new (): ValueSet<any>;
    new <T>(): ValueSet<T>;
    new <T>(iterable: Iterable<T>): ValueSet<T>;
    prototype: ValueSet<any>;
}

export interface Value {
	/**
	 * This method returns a hash code for the object.
	 */
	hashCode(): number;

	/**
	 * This method compares the object against another for value equality.
	 *
	 * @param a The first object to compare.
	 * @return {@code true} if {@code a} equals {@code b}, otherwise {@code false}.
	 */
	equals(a: Value): boolean;
}

/**
 * For objects where equality is a complicated business, Comparator class class
 * can be used to create sets without depending Equals interface
 */


export abstract class CachedHashValue implements Value {
	private _hashCode: number;
	abstract getHashCode(): number;
	abstract equals(other: Value) : boolean;

	constructor() {

	}

	get frozen() { 
		return this._hashCode !== undefined
	}
	
	assertNotFrozen() { 
		if (this.frozen) 
			throw new Error("object frozen by taking its hashCode")
		}

	hashCode() {
		let value = this._hashCode;
		if (value === undefined) this._hashCode = value = this.getHashCode();
		return value;
	}
}

/**
 * This class is an Ordered Set of objects with an abstract concept of value equality and hash codes generation.
 */
abstract class BaseHashSet<T> extends CachedHashValue {

	abstract valueHashCode(obj: T): number;
	abstract valueEquals(a: T, b: T): boolean;

	/*
	** underlying storage for the objects is an Array
	*/

	protected _array = new Array<T>();

	/**
	 * as an optimization in avoiding duplicates, we keep a map by hashCode() 
	 * of the indexes of entries matching that code.
	 */

    private _map = new Map<number, number[]>();

	/**
	 * Adds an item to a set, or returns an existing element equals() to it
	 */

	constructor() { 
		super()
	}

	add(value: T): T {
		this.assertNotFrozen();	

		const hashCode = this.valueHashCode(value);

		const existing = this.get(value, hashCode);
		if (existing) return existing;

		const bucket : number[] = this._map[hashCode];
		const index = this._array.push(value);

		if (bucket) {
			bucket.push(index)
		} else {
			this._map[hashCode] = [index];
		}

		return value;
	}

    clear() {
		this.assertNotFrozen();	
		this._array.length = 0;
		this._map.clear();
	}

    delete(value: T): boolean {
		throw new Error("delete not implemented on OrderedHashSet");
	}

    forEach(callbackfn: (value: T, index: T, set: ValueSet<T>) => void, thisArg?: any) {
		this._array.forEach(value => callbackfn.call(thisArg, value, value, this), this)
	}

	get(value: T, hashCode?: number): T {
		hashCode |= this.valueHashCode(value);
		const bucket: number[] = this._map[hashCode];

		if (bucket) {
			const i = bucket.find(index => this.valueEquals(value, this._array[index]));
			if (i) return this._array[i];
		}
		return null;
	}

	abstract getHashCode(): number;

    has(value: T) {
		return this.get(value) != null;
	}

	keys() {
		return this._array.values();
	}

	map(fn) { 
		return this._array.map(fn) 
	}

    get size(): number {
		return this._array.length;
	}

    values() {
		return this._array.values();
	}

}
BaseHashSet[Symbol.toStringTag] = "BaseHashSet";
BaseHashSet[Symbol.iterator] = Array[Symbol.iterator];

export abstract class BaseOrderedHashSet<T> extends  BaseHashSet<T> {

	equals(other: BaseOrderedHashSet<T>) {
		if (this === other) return true;
		if (!(other instanceof BaseOrderedHashSet)) return false;
		if (this._array.length != other._array.length) return false
		return other._array.every((v, i) => this.valueEquals(v, other._array[i]))
	}

	/**
	 * returns an order-dependent hash code of basedon contained elements
	 */
	getHashCode() {
		let code = 0;
		for (let i = 0; i < this._array.length; i++) {
			code = (code << 7) | (code >> 32 - 7) & 0xFFFF 
				 ^ this.valueHashCode(this._array[i]);
		}
		return code;
	}
}

/**
 * This class is an Ordered Set of objects which implement Value.  This allows value comparison, 
 * rather identity comparison as implemented by JavaScript's native Set class.   
 */
export abstract class BaseUnorderedHashSet<T> extends BaseHashSet<T> {

	/**
	 * Order-independent equal
	 */
	equals(other: BaseUnorderedHashSet<T>) {
		if (this === other) return true;
		if (super.size != other.size) return false;
		return this._array.every(value=>other.has(value));
	}

	/**
	 * returns an order-independent hash code of basedon contained elements
	 */
	getHashCode() {
		let code = 0;
			super.forEach(v=> code ^= this.valueHashCode(v) )
		return code;
	}
} 

export class OrderedValueSet<T extends Value> extends BaseOrderedHashSet<T> {
	valueHashCode(value: T) { return value.hashCode(); }
	valueEquals(a: T, b: T) { return a.equals(b); }
}

OrderedValueSet[Symbol.toStringTag] = "OrderedValueSet";


export class UnorderedValueSet<T extends Value> extends BaseUnorderedHashSet<T> {
	valueHashCode(value: T) { return value.hashCode(); }
	valueEquals(a: T, b: T) { return a.equals(b); }
}

UnorderedValueSet[Symbol.toStringTag] = "UnorderedValueSet";

export function combineHash(...numbers: number[]) {
	let code: number = +numbers[0];
	for (let i=1; i<numbers.length; i++)
		code ^= (+numbers[i] + 0x1e377b9b + (code << 6) + (code >> 2)) & 0x3FFFFFF;
	return code;
}

export {DoubleKeyMap} from './DoubleKeyMap';
export {MurmerHash} from './MurmerHash';