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

// The root of the ANTLR exception hierarchy. In general, ANTLR tracks just
//  3 kinds of errors: prediction errors, failed predicate errors, and
//  mismatched input errors. In each case, the parser knows where it is
//  in the input, where it is in the ATN, the rule invocation stack,
//  and what kind of problem occurred.

import {PredicateTransition} from '../atn/Transition';
import {Recognizer} from '../Recognizer';
import {Token} from '../Token';
import {Lexer} from '../Lexer';
import {Parser} from '../Parser';
import {IntStream, CharStream, ParserRuleContext} from '../index.d';

export class RecognitionException extends Error {
    message: string;
    recognizer: Recognizer;
    input: CharStream;
    ctx: ParserRuleContext;
    offendingToken: Token;
    offendingState: number;

    constructor(params: {
        recognizer: Recognizer,
        input: CharStream,
        ctx?: ParserRuleContext,
        message?: string
    }
    ) {
        super()
        if (!!Error.captureStackTrace) {
            Error.captureStackTrace(this, RecognitionException);
        } else {
            var stack = new Error().stack;
        }
        this.message = params.message;
        this.recognizer = params.recognizer;
        this.input = params.input;
        this.ctx = params.ctx;
        // The current {@link Token} when an error occurred. Since not all streams
        // support accessing symbols by index, we have to track the {@link Token}
        // instance itself.
        this.offendingToken = null;
        // Get the ATN state number the parser was in at the time the error
        // occurred. For {@link NoViableAltException} and
        // {@link LexerNoViableAltException} exceptions, this is the
        // {@link DecisionState} number. For others, it is the state whose outgoing
        // edge we couldn't match.
        this.offendingState = -1;
        if (this.recognizer !== null) {
            this.offendingState = this.recognizer.state;
        }
        return this;
    }

    // <p>If the state number is not known, this method returns -1.</p>

    //
    // Gets the set of input symbols which could potentially follow the
    // previously matched symbol at the time this exception was thrown.
    //
    // <p>If the set of expected tokens is not known and could not be computed,
    // this method returns {@code null}.</p>
    //
    // @return The set of token types that could potentially follow the current
    // state in the ATN, or {@code null} if the information is not available.
    // /
    getExpectedTokens() {
        if (this.recognizer !== null) {
            return this.recognizer.atn.getExpectedTokens(this.offendingState, this.ctx);
        } else {
            return null;
        }
    };

    toString() {
        return this.message;
    };
}

export class LexerNoViableAltException extends RecognitionException {
    constructor(
        lexer: Lexer,
        input: CharStream,
        public startIndex,
        public deadEndConfigs
    ) {
        super({ message: "", recognizer: lexer, input: input, ctx: null });
    }

    toString() {
        var symbol = "";
        if (this.startIndex >= 0 && this.startIndex < this.input.size) {
            symbol = this.input.getText(
                new Interval(this.startIndex, this.startIndex));
        }
        return "LexerNoViableAltException" + symbol;
    };
}

// Indicates that the parser could not decide which of two or more paths
// to take based upon the remaining input. It tracks the starting token
// of the offending input and also knows where the parser was
// in the various paths when the error. Reported by reportNoViableAlternative()
//
export class NoViableAltException extends RecognitionException {
    constructor(
        recognizer: Parser,
        input: CharStream,
        public startToken: Token,
        public offendingToken: Token,
        public deadEndConfigs,
        ctx) {
        super({
            message: "", recognizer: recognizer,
            input: input || recognizer.getInputStream(),
            ctx: ctx || recognizer._ctx
        });
        this.offendingToken |= recognizer.getCurrentToken();
        this.startToken |= recognizer.getCurrentToken();

    }
}

// This signifies any kind of mismatched input exceptions such as
// when the current input does not match the expected token.
//
export class InputMismatchException extends RecognitionException {
    constructor(recognizer) {
        super({ message: "", recognizer: recognizer, input: recognizer.getInputStream(), ctx: recognizer._ctx });
        this.offendingToken = recognizer.getCurrentToken();
    }

    // A semantic predicate failed during validation. Validation of predicates
    // occurs when normally parsing the alternative just like matching a token.
    // Disambiguating predicate evaluation occurs when we test a predicate during
    // prediction.
}

export class FailedPredicateException extends RecognitionException {
    constructor(recognizer, predicate, message) {
        super({
            message: this.formatMessage(predicate, message || null), recognizer: recognizer,
            input: recognizer.getInputStream(), ctx: recognizer._ctx
        });
        var s = recognizer._interp.atn.states[recognizer.state];
        var trans = s.transitions[0];
        if (trans instanceof PredicateTransition) {
            this.ruleIndex = trans.ruleIndex;
            this.predicateIndex = trans.predIndex;
        } else {
            this.ruleIndex = 0;
            this.predicateIndex = 0;
        }
        this.predicate = predicate;
        this.offendingToken = recognizer.getCurrentToken();
    }

    formatMessage(predicate, message) {
        if (message !== null) {
            return message;
        } else {
            return "failed predicate: {" + predicate + "}?";
        }
    };
}

export class ParseCancellationException extends Error {
    constructor(message? :string, cause?: Error) {
        super(message);
        Error.captureStackTrace(this, ParseCancellationException);
    }
}
