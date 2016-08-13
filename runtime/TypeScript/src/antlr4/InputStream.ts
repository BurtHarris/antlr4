// 
//  [The "BSD license"]
//   Copyright (c) 2012 Terence Parr
//   Copyright (c) 2012 Sam Harwell
//   Copyright (c) 2014 Eric Vergnaud
//   Copyright (c) 2016 Burt Harris
//   All rights reserved.
// 
//   Redistribution and use in source and binary forms, with or without
//   modification, are permitted provided that the following conditions
//   are met:
// 
//   1. Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//   2. Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//   3. The name of the author may not be used to endorse or promote products
//      derived from this software without specific prior written permission.
// 
//   THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
//   IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//   OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//   IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
//   INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
//   NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
//   DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
//   THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//   (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
//   THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// 

import { Interval } from './IntervalSet';

export interface IntStream {
    consume(): void;                   // Consumes the current symbol in the stream
    getSourceName(): string;           // Gets the name of the underlying symbol source
    index(): number;                   // Returns the index into the stream of input symbol referenced to by LA(1)
    LA(i: number): number;             // Look Ahead symbol value at offset i
    mark(): number;                    // Ensure seek() operations will be valid...
    release(marker: number): void;     // Release marked range created by mark()
    seek(index: number);
}

export interface CharStream extends IntStream {
    getText(interval: Interval): string;

}

export const EOF = -1;

export class InputStream implements CharStream {
	protected _index = 0;
	constructor(private _strdata: string) { }
	get index() { return this._index; }
	get size() { return this._strdata.length; }

	public reset() { this._index = 0; }
	public consume() {
		if (this._index >= this._strdata.length) {
			throw new Error("cannot consume EOF");
		}
		this._index++;
	}

	public LA(offset: number): number {
		if (offset == 0) return 0;
		if (offset < 0) offset++;
		const pos = this._index + offset - 1;

		if (pos < 0 || pos >= this._strdata.length){
			return EOF;
		}
		return this._strdata.charCodeAt(pos);
	}

	public mark() { return -1; }
	public release(marker: number) { }

	public seek(index: number) {
		if (index <= this._index) {
			this._index = index;
		} else {
			this._index = Math.min(index, this._strdata.length);
		}
	}

	public getText(start: number, stop: number) {
		const len = this._strdata.length;
		if (stop >= len) stop = len - 1;
		if (start >= len) { return "";}
		return this._strdata.slice(start, stop + 1);
	}

	public toString() { return this._strdata; }

};

export default InputStream;