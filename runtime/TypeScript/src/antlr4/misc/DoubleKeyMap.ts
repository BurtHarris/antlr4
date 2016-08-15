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


/** Sometimes we need to map a key to a value but key is two pieces of data.
 *  This nested hash table saves creating a single key each time we access
 *  map; avoids mem creation.
 */
export class DoubleKeyMap<Key1, Key2, Value> {

    private _data: Map<Key1, Map<Key2, Value>> = new Map<Key1, Map<Key2, Value>>();

	public set(k1:Key1, k2:Key2, v: Value ): Value  {
		let data2 = this._data.get(k1);
		let prev: Value = null;
		if ( data2==null ) {
			data2 = new Map<Key2, Value>();
			this._data.set(k1, data2);
		}
		else {
			prev = data2.get(k2);
		}
		data2.set(k2, v);
		return prev;
	}

    public get(k1: Key1 ): Map<Key2, Value>
	public get(k1: Key1, k2?: Key2): Value 
    public get(k1: any, k2?: any ): Value | Map<Key2, Value>  {
		let data2 = this._data.get(k1);
		if ( data2 == null ) return null;
        if (k2 == undefined) return data2;
		return data2.get(k2);
	}

	/** Get all values associated with primary key */
	public values(k1: Key1 ): Iterable<Value> {
		let data2 = this._data.get(k1);
		if ( data2 == null ) return null;
		return data2.values();
	}

	/** get all primary keys */
	keys(): Iterable<Key1>
    keys(k1?: Key1): Iterable<Key2>
    keys(k1?: any): Iterable<Key1>| Iterable<Key2>
    {
        if (k1 ==undefined ) return this._data.keys();
        let data2 = this._data.get(k1);
        return data2 ? data2.keys() : null;
	}
}
