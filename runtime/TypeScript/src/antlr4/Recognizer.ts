//
// [The "BSD license"]
//  Copyright (c) 2012 Terence Parr
//  Copyright (c) 2012 Sam Harwell
//  Copyright (c) 2014 Eric Vergnaud
//  Copyright (c) 2016 Burt Harris
//  All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions
//  are met:
//
//  1. Redistributions of source code must retain the above copyright
//     notice, this list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright
//     notice, this list of conditions and the following disclaimer in the
//     documentation and/or other materials provided with the distribution.
//  3. The name of the author may not be used to endorse or promote products
//     derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
//  IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
//  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
//  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
//  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

import { Token } from './Token';
import { RuleContext } from './RuleContext';
import { ATN } from './ATN/ATN';
import { ATNSimulator } from './ATN/ATNSimulator'
import { RecognitionException, ErrorListener, ConsoleErrorListener, ProxyErrorListener} from './error';

export class Vocabulary {
    constructor(private _literalNames: string[], private _symbolicNames: string[], private _displayNames?: string[]){
    }

    getDisplayName(tokenType: number) {

        let strings = this._displayNames;
        if (strings && tokenType < strings.length && strings[tokenType]) return strings[tokenType];
        
        strings = this._literalNames;
        if (strings && tokenType < strings.length && strings[tokenType]) return strings[tokenType];
        
        strings = this._literalNames;
        if (strings && tokenType < strings.length && strings[tokenType]) return strings[tokenType];
        
        return tokenType.toString();
    }
}

export abstract class Recognizer<Symbol, ATNInterpreter extends ATNSimulator> {
    // 
    // CONSIDER: Typescript enum might be a better choice.
    //
    protected tokenTypeMapCache: Map<string, number>;
    protected ruleIndexMapCache: Map<string, number>;
    
    public vocabulary: Vocabulary;

    private _listeners: Array<ErrorListener> = [ConsoleErrorListener.INSTANCE];
    protected _interp : ATNInterpreter = null;
    private _stateNumber = -1;
    atn: ATN = null;

    constructor() {
        this.tokenTypeMapCache = Recognizer.createMap( this.getTokenNames() );
        this.ruleIndexMapCache = Recognizer.createMap( this.getRuleNames() );
    }

    checkVersion(toolVersion) {
        var runtimeVersion = "4.5.3";
        if (runtimeVersion !== toolVersion) {
            console.log("ANTLR runtime and generated code versions disagree: " + runtimeVersion + "!=" + toolVersion);
        }
    };

    addErrorListener(listener) {
        this._listeners.push(listener);
    };

    removeErrorListeners() {
        this._listeners = [];
    };

    private static createMap(names: string[]) {
        if (name === null) {
            throw (new Error("The current recognizer does not provide a list of names."));
        }
        var result = new Map<string, number>();
        names.forEach( (v, i, a) => result[v] = i )
        result['EOF'] = Token.EOF;
        return result;
    };

    getTokenType(tokenName) {
        return this.tokenTypeMapCache[tokenName] || Token.INVALID_TYPE;
    };


    // What is the error header, normally line/character position information?//
    getErrorHeader(e: RecognitionException ) {
        return `line ${e.offendingToken.line}:${e.offendingToken.column}`;
    }

    // How should a token be displayed in an error message? The default
    //  is to display just the text, but during development you might
    //  want to have a lot of information spit out.  Override in that case
    //  to use t.toString() (which, for CommonToken, dumps everything about
    //  the token). This is better than forcing you to override a method in
    //  your token objects because you don't have to go modify your lexer
    //  so that it creates a new Java type.
    //
    // @deprecated This method is not called by the ANTLR 4 Runtime. Specific
    // implementations of {@link ANTLRErrorStrategy} may provide a similar
    // feature when necessary. For example, see
    // {@link DefaultErrorStrategy//getTokenErrorDisplay}.
    //
    getTokenErrorDisplay(t) {
        if (t === null) {
            return "<no token>";
        }
        var s = t.text;
        if (s === null) {
            if (t.type === Token.EOF) {
                s = "<EOF>";
            } else {
                s = "<" + t.type + ">";
            }
        }
        s = s.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
        return "'" + s + "'";
    };

    getErrorListenerDispatch() {
        return new ProxyErrorListener(this._listeners);
    };

    // subclass needs to override these if there are sempreds or actions
    // that the ATN interp needs to execute
    sempred(localctx: RuleContext, ruleIndex: number, actionIndex:number ) {
        return true;
    };

    precpred(localctx, precedence) {
        return true;
    };

    //Indicate that the recognizer has changed internal state that is
    //consistent with the ATN state passed in.  This way we always know
    //where we are in the ATN as the parser goes along. The rule
    //context objects form a stack that lets us see the stack of
    //invoking rules. Combine this and we have complete ATN
    //configuration information.

    public get state() {
        return this._stateNumber;
    }
    public set state(state) {
        this._stateNumber = state;
    }

    protected getSerializedATN(): string { throw new Error('getSerializedATN not implemented')}
}
