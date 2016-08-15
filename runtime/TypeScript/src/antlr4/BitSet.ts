// Copyright (C) 2013 Monmohan Singh (monmohan@gmail.com)
// Copyright (C) 2016 Burt Harris
// All Rights Reserved
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


/**
 *
 * @class BitSet
 * @classdesc This class implements an vector of bits that grows as needed.
 * Each component of the bit set has a boolean value. The bits of a BitSet are indexed by non-negative integers.
 * Individual indexed bits can be examined, set, or cleared. By default, all bits in the set initially
 * have the value false.
 * [Reference: BitSet in Java Collections](http://docs.oracle.com/javase/7/docs/api/java/util/BitSet.html)
 * @param size {Number=} Initial size of the BitSet
 */

// This version uses Uint16Array to ensure that temporary values stay in the allocation-free range for JavaScript

const ARRAY_TYPE = Uint16Array;
const ADDRESS_BITS_PER_WORD = 3 * ARRAY_TYPE.BYTES_PER_ELEMENT;
const BITMASK = 0x0F;

export class BitSet {

    private _words: Uint16Array;
    private _wordsUsed: number;

    constructor(size = 1) {
        size = (typeof size !== 'number' || size <= 0) ? 1 : size;
        this._wordsUsed = ((size - 1) >> ADDRESS_BITS_PER_WORD) + 1;
        this._words = new ARRAY_TYPE(this._wordsUsed);
    }

    private _index(bitIndex: number, resize = false): [number, number] {
        if ((typeof bitIndex !== 'number') || bitIndex < 0)
            throw new Error("Invalid bitIndex " + bitIndex);

        const wordIndex = (bitIndex >> ADDRESS_BITS_PER_WORD);
        const maxOldIndex = this._wordsUsed - 1;

        if (wordIndex > maxOldIndex && resize) {
            if (wordIndex >= this._words.length) {
                // reallocate the array
                const oldArray = this._words;
                const oldLength = oldArray.length;

                // Reallocation at least doubles array size to make operations O(0)
                const newArray = new Uint16Array(Math.max(oldLength * 2, wordIndex));

                // CONSIDER: Seems like this should be a primitive
                for (var i = 0; i < oldLength; i++) newArray[i] = oldArray[i];

                // CONSIDER: is this necessary
                newArray.fill(0, oldLength)
                this._words = newArray;
            }
            this._wordsUsed = wordIndex + 1;
        }
        return [wordIndex, bitIndex & BITMASK];
    }


    /**
     * Set the bit at bitIndex to 'true'.
     * If required, BitSet is expanded to accommodate the bitIndex
     * @param bitIndex {Number} index to set
     */
    set(bitIndex): void {
        const [wordIndex, actualIndex] = this._index(bitIndex, true);
        this._words[wordIndex] |= 1 << actualIndex;
    };

    /**
     * Examine a bit.
     * @memberOf BitSet.prototype
     * @instance
     * @param bitIndex
     * @returns {Boolean}  Returns true if the bit at bitIndex is set, false otherwise.
     */
    get(bitIndex) {
        const [wordIndex, actualIndex] = this._index(bitIndex);
        return (wordIndex < this._wordsUsed) && (
            ((this._words[wordIndex]) & (1 << actualIndex)) !== 0
        );
    };

    /**
     * @memberOf BitSet.prototype
     * @instance
     * @param bitIndex  {Number=} Set the bit at bitIndex to false.
     * Clears all bits if bitIndex is not provided
     */
    clear(bitIndex?: number) {
        var words = this._wordsUsed;
        if (typeof bitIndex === 'undefined') {
            this._words.fill(0, 0, words);
        } else {
            const [wordIndex, actualIndex] = this._index(bitIndex, true);
            if (wordIndex < this._wordsUsed) {
                this._words[wordIndex] &= ~(1 << actualIndex);
            }
        }
    };

    /**
     * Sets the bit at the specified index to the complement of its current value.
     * BitSet will be expanded if bitIndex doesn't fit in the current size and
     * the bit will be set to true.
     * @memberOf BitSet.prototype
     * @instance
     * @param bitIndex Index for the operation
     */
    flip(bitIndex) {
        var [wordIndex, actualIndex] = this._index(bitIndex, true);
        this._words[wordIndex] ^= (1 << actualIndex);
    };

    /**
     * Return the number of bits set to true in this BitSet
     * Adopted from Courtesy Hacker's Delight 5.1
     * @memberOf BitSet.prototype
     * @instance
     * @returns {Number} number of bits set to true in this BitSet
     */
    cardinality() {
        return this._words.reduce(function (sum, w) {
            w = w - ((w >>> 1) & 0x5555);
            w = (w & 0x3333) + ((w >>> 2) & 0x3333);
            w = (w + (w >>> 4)) & 0x0f0f;
            w = w + (w >>> 8);
            return sum + (w & 0x1F);
        }, 0);
    }


    /**
     * Logical AND with other BitSet.
     * The current BitSet is modified as a result of this operation
     * @memberOf BitSet.prototype
     * @instance
     * @param oBitSet {BitSet} The BitSet to logically AND this BitSet with
     */
    and(oBitSet: BitSet) {
        var words = this._wordsUsed;
        while (words > oBitSet._wordsUsed) {
            this._words[--words] = 0;

        }
        while (words) {
            words--;
            this._words[words] &= oBitSet._words[words];
        }
    }
}