// tests/index.ts 
//
// Copyright (C) 2016 Burt Harris
// All rights reserved
// See LICENSE.TXT
//
import * as assert from 'assert';

console.log( 'just beginning to create tests')


import {BitSet} from '../BitSet'

let v = new BitSet(5);

v.set(3);

assert.equal( v.get(0), 0)
assert.equal( v.get(1), 0)
assert.equal( v.get(2), 0)
assert.equal( v.get(3), 1)
assert.equal( v.get(4), 0)
