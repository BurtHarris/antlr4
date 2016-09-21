//[The "BSD license"]
// Copyright (c) 2012 Terence Parr
// Copyright (c) 2012 Sam Harwell
// Copyright (c) 2014 Eric Vergnaud
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

// A token has properties: text, type, line, character position in the line
// (so we can ignore tabs), token channel, index, and source from which
// we obtained this token.

export class Token {
        source = null;
        type = null; // token type of the token
        channel = null; // The parser ignores everything not on DEFAULT_CHANNEL
        start = null; // optional; return -1 if not implemented.
        stop = null; // optional; return -1 if not implemented.
        tokenIndex = null; // from 0..n-1 of the token object in the input stream
        line = null; // line=1..n of the 1st character
        column = null; // beginning of the line at which it occurs, 0..n-1
        _text = null; // text of the token.

    constructor() {
    }

    static INVALID_TYPE = 0;

// During lookahead operations, this "token" signifies we hit rule end ATN state
// and did not follow it despite needing to.
    static EPSILON = -2;

    static MIN_USER_TOKEN_TYPE = 1;

    static EOF = -1;

// All tokens go to the parser (unless skip() is called in that rule)
// on a particular "channel". The parser tunes to a particular channel
// so that whitespace etc... can go to the parser on a "hidden" channel.

    static DEFAULT_CHANNEL = 0;

// Anything on different channel than DEFAULT_CHANNEL is not parsed
// by parser.

    static HIDDEN_CHANNEL = 1;

// Explicitly set the text for this token. If {code text} is not
// {@code null}, then {@link //getText} will return this value rather than
// extracting the text from the input.
//
// @param text The explicit text of the token, or {@code null} if the text
// should be obtained from the input along with the start and stop indexes
// of the token.


    get text() {
        return this._text;
    }

    set text(text) {
        this._text = text;
    }

    getTokenSource() {
        return this.source[0];
    };

    getInputStream() {
        return this.source[1];
    };
}

export class CommonToken extends Token {

    constructor(source?, type?, channel?, start?, stop?) {
        super();
        this.source = source !== undefined ? source : CommonToken.EMPTY_SOURCE;
        this.type = type !== undefined ? type : null;
        this.channel = channel !== undefined ? channel : Token.DEFAULT_CHANNEL;
        this.start = start !== undefined ? start : -1;
        this.stop = stop !== undefined ? stop : -1;
        this.tokenIndex = -1;
        if (this.source[0] !== null) {
            this.line = source[0].line;
            this.column = source[0].column;
        } else {
            this.column = -1;
        }
    }

// An empty {@link Pair} which is used as the default value of
// {@link //source} for tokens that do not have a source.
    static EMPTY_SOURCE = [ null, null ];

// Constructs a new {@link CommonToken} as a copy of another {@link Token}.
//
// <p>
// If {@code oldToken} is also a {@link CommonToken} instance, the newly
// constructed token will share a reference to the {@link //text} field and
// the {@link Pair} stored in {@link //source}. Otherwise, {@link //text} will
// be assigned the result of calling {@link //getText}, and {@link //source}
// will be constructed from the result of {@link Token//getTokenSource} and
// {@link Token//getInputStream}.</p>
//
// @param oldToken The token to copy.
//
    clone()
    {
	    var t = new CommonToken(this.source, this.type, this.channel, this.start,
            this.stop);
        t.tokenIndex = this.tokenIndex;
        t.line = this.line;
        t.column = this.column;
        t.text = this.text;
        return t;
    };

    get text()
    {
        if (this._text !== null) {
            return this._text;
        }
        var input = this.getInputStream();
        if (input === null) {
            return null;
        }
        var n = input.size;
        if (this.start < n && this.stop < n) {
            return input.getText(this.start, this.stop);
        } else {
            return "<EOF>";
        }
    }

    set text(text)
    {
        this._text = text;
    }

    toString()
    {
        var txt = this.text;
        if (txt !== null) {
            txt = txt.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
        } else {
            txt = "<no text>";
        }
        return "[@" + this.tokenIndex + "," + this.start + ":" + this.stop + "='" +
                txt + "',<" + this.type + ">" +
                (this.channel > 0 ? ",channel=" + this.channel : "") + "," +
                this.line + ":" + this.column + "]";
    };
}
