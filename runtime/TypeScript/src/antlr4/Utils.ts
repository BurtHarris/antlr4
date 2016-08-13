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



// Commented out to test with  with ES2015 Set?

// class Set {
//     static standardEqualsFunction(a, b) {
//         return a.equals(b);
//     }

//     static standardHashFunction(a) {
//         return a.hashString();
//     }
//     data = {};
//     constructor(private hashFunction = standardHashFunction, private equalsFunction = standardEqualsFunction) {
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

// class BitSet {
//     data = [];
//     constructor() { }

//     add(value) {
//         this.data[value] = true;
//     };

//     or(set) {
//         var bits = this;
//         Object.keys(set.data).map(function (alt) { bits.add(alt); });
//     };

//     remove(value) {
//         delete this.data[value];
//     };

//     contains(value) {
//         return this.data[value] === true;
//     };

//     values() {
//         return Object.keys(this.data);
//     };

//     minValue() {
//         return Math.min.apply(null, this.values());
//     };

//     hashString() {
//         return this.values().toString();
//     };

//     equals(other) {
//         if (!(other instanceof BitSet)) {
//             return false;
//         }
//         return this.hashString() === other.hashString();
//     };

//     get length {
//         return this.values().length;
//     }


//     toString() {
//         return "{" + this.values().join(", ") + "}";
//     }
// }

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

