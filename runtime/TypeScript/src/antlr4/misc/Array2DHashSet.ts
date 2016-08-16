/*
 * [The "BSD license"]
 *  Copyright (c) 2012 Terence Parr
 *  Copyright (c) 2012 Sam Harwell
 *  Copyright (c) 2016 Burt Harris
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

import * as Misc from './index'

/** {@link ValueSet} implementation with closed hashing (open addressing). */
export class Array2DHashSet<T> implements Misc.ValueSet<T>, Iterable<T> {
	static const INITAL_CAPACITY = 16; // must be power of 2
	static const INITAL_BUCKET_CAPACITY = 8;
	static const LOAD_FACTOR = 0.75;

	protected buckets: T[][];

	/** Number of elements in set */
	protected n = 0;

	protected threshold = Math.floor(Array2DHashSet.INITAL_CAPACITY * Array2DHashSet.LOAD_FACTOR); // when to expand

	protected currentPrime = 1; // jump by 4 primes each expand or whatever

    protected valueHash(o: any) { return o.hashCode() }
    protected valueEquals(a: any, b: any) { return a.equals(b) }

	constructor( 
        comparator?: Misc.ValueComparitor<T>, 
        protected initialCapacity: number = Array2DHashSet.INITAL_CAPACITY,
        protected initialBucketCapacity: number = Array2DHashSet.INITAL_CAPACITY
        ) {
        if (comparator) {
            this.valueHash = comparator.hashCode;
            this.valueEquals = comparator.equals;
        }
	}

	/**
	 * Add {@code o} to set if not there; return existing value if already
	 * there. This method performs the same operation as {@link #add} aside from
	 * the return value.
	 */
	public getOrAdd(o:T): T {
		if ( this.n > this.threshold ) this.expand();
		return this.getOrAddImpl(o);
	}

	protected getOrAddImpl(o: T): T {
		let b = this.getBucketIndex(o);
		let bucket = this.buckets[b];

		// NEW BUCKET
		if ( !bucket ) {
			bucket = this.createBucket(this.initialBucketCapacity);
			bucket[0] = o;
			this.buckets[b] = bucket;
			this.n++;
			return o;
		}

		// LOOK FOR IT IN BUCKET
        let x = bucket.findIndex(existing=> !existing || this.valueEquals(existing, o) )
        if (x) return bucket[x];

		for (let i=0; i<bucket.length; i++) {
			let existing = bucket[i];
			if ( !(existing) ) { // empty slot; not there, add.
				bucket[i] = o;
				this.n++;
				return o;
			}
			if ( this.valueEquals(existing, o) ) return existing; // found existing, quit
		}

		// FULL BUCKET, expand and add to end
		let oldLength = bucket.length;
		bucket = bucket.concat(new Array<T>(bucket.length));
		this.buckets[b] = bucket;
		bucket[oldLength] = o; // add to end
		this.n++;
		return o;
	}

	public get(o: T): T {
		if ( !(o) ) return o;
		let b = this.getBucketIndex(o);
		let bucket = this.buckets[b];
		if ( !(bucket) ) return null; // no bucket
		for (let e of bucket) {
			if ( !(e) ) return null; // empty slot; not there
			if ( this.valueEquals(e, o) ) return e;
		}
		return null;
	}

	protected  getBucketIndex(o: T) {
		let hash =this.valueHash(o);
		let b = hash & (this.buckets.length-1); // assumes len is power of 2
		return b;
	}

    hashCode() {
		let hashes = [];

		for (let bucket of this.buckets) {
			if ( !(bucket) ) continue;
			for (let o of bucket) {
				if ( !(o) ) break;
				hashes.push( this.valueHash(o))
			}
		}
        return MurmerHash(hashes);
	}

	public equals(o: Array2DHashSet<T>): boolean {
		if (o == this) return true;
		if ( !(o instanceof Array2DHashSet) ) return false;
		if ( o.size() != this.size() ) return false;
		this.containsAll(o);
	}

	protected expand() {
		let old = this.buckets;
		this.currentPrime += 4;
		let newCapacity = this.buckets.length * 2;
		let newTable = this.createBuckets(newCapacity);
		let newBucketLengths = new Array<number>[newTable.length];
		this.buckets = newTable;
		this.threshold = Math.floor(newCapacity * Array2DHashSet.LOAD_FACTOR);

		// rehash all existing entries
		let oldSize = this.size();
		for (let bucket of old) {
			if ( !(bucket) ) {
				continue;
			}

			for (let o of bucket) {
				if ( !(o) ) {
					break;
				}

				let b = this.getBucketIndex(o);
				let bucketLength = newBucketLengths[b];
				let newBucket: T[] ;
				if (bucketLength == 0) {
					// new bucket
					newBucket = this.createBucket(this.initialBucketCapacity);
					newTable[b] = newBucket;
				}
				else {
					newBucket = newTable[b];
					if (bucketLength == newBucket.length) {
						// expand
						newBucket = Arrays.copyOf(newBucket, newBucket.length * 2);
						newTable[b] = newBucket;
					}
				}

				newBucket[bucketLength] = o;
				newBucketLengths[b]++;
			}
		}

		console.assert( this.n == oldSize );
    }

	add(t: T): boolean {
		let existing = this.getOrAdd(t);
		return existing==t;
	}

	size() {
		return n;
	}

	isEmpty() {
		return n==0;
	}


	has(obj: T) {
		if (!(obj)) {
			return false;
		}

		return this.get(obj) != null;
	}

	[Symbol.iterator](): Iterator<T> {
		return new SetIterator(this.toArray());
	}

	public toArray(): T[]  {
		let a = this.createBucket(this.size());
		let i = 0;
		for (let bucket of this.buckets) {
			if ( !(bucket) ) {
				continue;
			}

			for (let o of bucket) {
				if ( !(o) ) {
					break;
				}

				a[i++] = o;
			}
		}

		return a;
	}


	// public <U> U[] toArray(U[] a) {
	// 	if (a.length < size()) {
	// 		a = Arrays.copyOf(a, size());
	// 	}

	// 	int i = 0;
	// 	for (T[] bucket : buckets) {
	// 		if ( !(bucket) ) {
	// 			continue;
	// 		}

	// 		for (T o : bucket) {
	// 			if ( !(o) ) {
	// 				break;
	// 			}

	// 			@SuppressWarnings("unchecked") // array store will check this
	// 			U targetElement = (U)o;
	// 			a[i++] = targetElement;
	// 		}
	// 	}
	// 	return a;
	// }

	public remove(obj: T): boolean {
		if (!(obj)) {
			return false;
		}

		let b = this.getBucketIndex(obj);
		let bucket = this.buckets[b];
		if ( !(bucket) ) {
			// no bucket
			return false;
		}

		for (let i=0; i<bucket.length; i++) {
			let e = bucket[i];
			if ( !(e) ) {
				// empty slot; not there
				return false;
			}

			if ( this.valueEquals(e, obj) ) {          // found it
				// shift all elements to the right down one
                bucket.copyWithin(i, i+1)
				bucket[bucket.length - 1] = null;
				this.n--;
				return true;
			}
		}
		return false;
	}

	public containsAll( collection: Iterable<T>):  boolean {
        for (let e of collection) {
            if (!this.has(e)) return false;
        }
		return true;
	}

	public addAll(c: Iterable<T>) {
		let changed = false;
		for (let o of c) {
			let existing = this.getOrAdd(o);
			if ( existing!==o )
                changed=true;
		}
		return changed;
	}

	public retainAll(c: Array<T>): boolean {
		let newsize = 0;
		for (let bucket of this.buckets) {
			if (!(bucket)) {
				continue;
			}

			let i: number;
			let j: number;
			for (i = 0, j = 0; i < bucket.length; i++) {
				if (bucket[i] == null) {
					break;
				}

				if (!c.includes(bucket[i])) {
					// removed
					continue;
				}

				// keep
				if (i != j) {
					bucket[j] = bucket[i];
				}

				j++;
				newsize++;
			}

			newsize += j;

			while (j < i) {
				bucket[j] = null;
				j++;
			}
		}

		let changed = newsize != this.n;
		this.n = newsize;
		return changed;
	}

	public removeAll(c:Iterable<T>) {
		let changed = false;
		for (let o of c) {
			changed |= this.remove(o);
		}
        return changed;
	}

	public clear() {
		this.buckets = this.createBuckets(INITAL_CAPACITY);
		this.n = 0;
	}

	public toString() {
		if ( this.size()==0 ) return "{}";

		let buf='{';
		let first = true;
		for (let bucket of this.buckets) {
			if ( !(bucket) ) continue;
			for (let o of bucket) {
				if ( !(o) ) break;
				if ( first ) first=false;
				else buf = buf + ", ";
				buf = buf + o.toString();
			}
		}
		buf = buf + '}';
		return buf;
	}

	public toTableString():string {
		let buf ="";
		for (let bucket of this.buckets) {
			if ( !(bucket) ) {
				buf = buf + "null\n";
				continue;
			}
			buf = buf + '[';
			let first = true;
			for (let o of bucket) {
				if ( first ) first = false;
				else buf = buf + " ");
				if ( !(o) ) buf = buf + "_";
				else buf = buf + o.toString();
			}
			buf = buf + "]\n";
		}
		return buf;
	}

	/**
	 * Return an array of {@code T[]} with length {@code capacity}.
	 *
	 * @param capacity the length of the array to return
	 * @return the newly constructed array
	 */
	createBuckets: T[][] (capacity: number) {
        return new Array<Array<T>>(capacity);
	}


	protected createBucket(capacity: number): T[] {
        return new Array<T>(capacity);
	}

}
class SetIterator implements Iterator<T> {
		nextIndex = 0;
		removed = true;

		public constructor(private _data: T[] ) {
		}


		next() {
			if (!(this.nextIndex < this._data.length)) {
                return { value: undefined, done: true }
			}
            return {value: this._data[this.nextIndex++], done: false}
		}
	}
