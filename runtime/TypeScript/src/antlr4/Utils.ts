//[The "BSD license"]
// Copyright (c) 2012 Terence Parr
// Copyright (c) 2012 Sam Harwell
// Copyright (c) 2014 Eric Vergnaud
// Copyright (c) 2016 Burt Harris
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//
// 1. Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
// 3. The name of the author may not be used to endorse or promote products
//    derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
// OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
// IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
// NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

export function arrayToString(a: string[]) {
    return "[" + a.join(", ") + "]";
}

export function hashCode(s) {
    var hash = 0;
    if (this.length === 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var character = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};


export interface StringHashed {
    equals(other: StringHashed): boolean
    hashString(): string
}

export class StringHashedSet<T extends StringHashed > {

    private _map = new Map<string, T>();

    constructor() { }

    add(value: T): StringHashedSet<T> {
        const s = value.hashString()
        const v = this._map[s];
        if (v) {
            console.assert(value.equals(v), 'identicly hased objects fail equals()')
        } else {
            this._map[s] = value;
        }
        return this;
    }

    clear() {
        this._map.clear()
    }

    delete(value: T) {
        return this._map.delete(value.hashString())
    }

    entries() {
        return this._map.entries();
    }

    // forEach(callbackfn: (value: T, index: T, set: Set<T>) => void, thisArg?: any) {
    //     this._map.forEach(callbackfn);
    // }

    get( value: T) : T {
        const s = value.hashString()
        const v = this._map[s];
        if (v) {
            console.assert(value.equals(v), 'identicly hased objects fail equals()')
            return v;
        }
        return null;
        
    }

    has(value: T) {
        const s = value.hashString()
        const v = this._map[s];
        if (v) {
            console.assert(value.equals(v), 'identicly hased objects fail equals()')
            return true;
        }
        return false;
    }

    keys() { return this._map.values() }
    
    get size() { return this._map.size }
    
    values() { return this._map.values() }

 //   [Symbol.iterator](): IterableIterator<T>;

    [Symbol.toStringTag]: "StringHashedSet";
}


// class Set {
//     static standardEqualsFunction(a, b) {
//         return a.equals(b);
//     }

//     static standardHashFunction(a) {
//         return a.hashString();
//     }
//     data = {};
//     constructor(private hashFunction = Set.standardHashFunction, private equalsFunction = Set.standardEqualsFunction) {
//     }

//     public get length() {
//         return this.values().length;
//     }

//     add(value) {
//         var hash = this.hashFunction(value);
//         var key = "hash_" + hash.hashCode();
//         if (key in this.data) {
//             var i;
//             var values = this.data[key];
//             for (i = 0; i < values.length; i++) {
//                 if (this.equalsFunction(value, values[i])) {
//                     return values[i];
//                 }
//             }
//             values.push(value);
//             return value;
//         } else {
//             this.data[key] = [value];
//             return value;
//         }
//     };

//     contains(value) {
//         var hash = this.hashFunction(value);
//         var key = hash.hashCode();
//         if (key in this.data) {
//             var i;
//             var values = this.data[key];
//             for (i = 0; i < values.length; i++) {
//                 if (this.equalsFunction(value, values[i])) {
//                     return true;
//                 }
//             }
//         }
//         return false;
//     };

//     values() {
//         var l = [];
//         for (var key in this.data) {
//             if (key.indexOf("hash_") === 0) {
//                 l = l.concat(this.data[key]);
//             }
//         }
//         return l;
//     };

//     toString() {
//         return arrayToString(this.values());
//     };
// }

class BitSet {
    data = [];
    constructor() { }

    add(value) {
        this.data[value] = true;
    };

    or(set) {
        var bits = this;
        Object.keys(set.data).map(function (alt) { bits.add(alt); });
    };

    remove(value) {
        delete this.data[value];
    };

    contains(value) {
        return this.data[value] === true;
    };

    values() {
        return Object.keys(this.data);
    };

    minValue() {
        return Math.min.apply(null, this.values());
    };

    hashString() {
        return this.values().toString();
    };

    equals(other) {
        if (!(other instanceof BitSet)) {
            return false;
        }
        return this.hashString() === other.hashString();
    };

    get length() {
        return this.values().length;
    }


    toString() {
        return "{" + this.values().join(", ") + "}";
    }
}

// class AltDict {
//     data = {};
//     constructor() {
//     }

//     get(key) {
//         key = "k-" + key;
//         if (key in this.data) {
//             return this.data[key];
//         } else {
//             return null;
//         }
//     };

//     put(key, value) {
//         key = "k-" + key;
//         this.data[key] = value;
//     };

//     values() {
//         var data = this.data;
//         var keys = Object.keys(this.data);
//         return keys.map(function (key) {
//             return data[key];
//         });
//     };
// }

// class DoubleDict {
//     constructor() {
//     }

//     get(a, b) {
//         var d = this[a] || null;
//         return d === null ? null : (d[b] || null);
//     };

//     set(a, b, o) {
//         var d = this[a] || null;
//         if (d === null) {
//             d = {};
//             this[a] = d;
//         }
//         d[b] = o;
//     };
// }

export function escapeWhitespace(s, escapeSpaces) {
    s = s.replace("\t", "\\t");
    s = s.replace("\n", "\\n");
    s = s.replace("\r", "\\r");
    if (escapeSpaces) {
        s = s.replace(" ", "\u00B7");
    }
    return s;
}

export function isArray(entity) {
    return Object.prototype.toString.call(entity) === '[object Array]'
};

export function titleCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1); });
};

