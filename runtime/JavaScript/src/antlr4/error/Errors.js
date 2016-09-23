// [The "BSD license"]
//  Copyright (c) 2012 Terence Parr
//  Copyright (c) 2012 Sam Harwell
//  Copyright (c) 2014 Eric Vergnaud
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
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// The root of the ANTLR exception hierarchy. In general, ANTLR tracks just
//  3 kinds of errors: prediction errors, failed predicate errors, and
//  mismatched input errors. In each case, the parser knows where it is
//  in the input, where it is in the ATN, the rule invocation stack,
//  and what kind of problem occurred.
var Transition_1 = require('./../atn/Transition');
var RecognitionException = (function (_super) {
    __extends(RecognitionException, _super);
    function RecognitionException(params) {
        _super.call(this);
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
        if (!!Error.captureStackTrace) {
            Error.captureStackTrace(this, RecognitionException);
        }
        else {
            var stack = new Error().stack;
        }
        this.message = params.message;
        this.recognizer = params.recognizer;
        this.input = params.input;
        this.ctx = params.ctx;
        if (this.recognizer !== null) {
            this.offendingState = this.recognizer.state;
        }
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
    RecognitionException.prototype.getExpectedTokens = function () {
        if (this.recognizer !== null) {
            return this.recognizer.atn.getExpectedTokens(this.offendingState, this.ctx);
        }
        else {
            return null;
        }
    };
    ;
    RecognitionException.prototype.toString = function () {
        return this.message;
    };
    ;
    return RecognitionException;
}(Error));
exports.RecognitionException = RecognitionException;
var LexerNoViableAltException = (function (_super) {
    __extends(LexerNoViableAltException, _super);
    function LexerNoViableAltException(lexer, input, startIndex, deadEndConfigs) {
        _super.call(this, { message: "", recognizer: lexer, input: input, ctx: null });
        this.startIndex = startIndex;
        this.deadEndConfigs = deadEndConfigs;
        return this;
    }
    LexerNoViableAltException.prototype.toString = function () {
        var symbol = "";
        if (this.startIndex >= 0 && this.startIndex < this.input.size) {
            symbol = this.input.getText((this.startIndex, this.startIndex));
        }
        return "LexerNoViableAltException" + symbol;
    };
    ;
    return LexerNoViableAltException;
}(RecognitionException));
exports.LexerNoViableAltException = LexerNoViableAltException;
// Indicates that the parser could not decide which of two or more paths
// to take based upon the remaining input. It tracks the starting token
// of the offending input and also knows where the parser was
// in the various paths when the error. Reported by reportNoViableAlternative()
//
var NoViableAltException = (function (_super) {
    __extends(NoViableAltException, _super);
    function NoViableAltException(recognizer, input, startToken, offendingToken, deadEndConfigs, ctx) {
        ctx = ctx || recognizer._ctx;
        offendingToken = offendingToken || recognizer.getCurrentToken();
        startToken = startToken || recognizer.getCurrentToken();
        input = input || recognizer.getInputStream();
        _super.call(this, { message: "", recognizer: recognizer, input: input, ctx: ctx });
        // Which configurations did we try at input.index() that couldn't match
        // input.LT(1)?//
        this.deadEndConfigs = deadEndConfigs;
        // The token object at the start index; the input stream might
        // not be buffering tokens so get a reference to it. (At the
        // time the error occurred, of course the stream needs to keep a
        // buffer all of the tokens but later we might not have access to those.)
        this.startToken = startToken;
        this.offendingToken = offendingToken;
    }
    return NoViableAltException;
}(RecognitionException));
exports.NoViableAltException = NoViableAltException;
// This signifies any kind of mismatched input exceptions such as
// when the current input does not match the expected token.
//
var InputMismatchException = (function (_super) {
    __extends(InputMismatchException, _super);
    function InputMismatchException(recognizer) {
        _super.call(this, { message: "", recognizer: recognizer, input: recognizer.getInputStream(), ctx: recognizer._ctx });
        this.offendingToken = recognizer.getCurrentToken();
    }
    return InputMismatchException;
}(RecognitionException));
exports.InputMismatchException = InputMismatchException;
// A semantic predicate failed during validation. Validation of predicates
// occurs when normally parsing the alternative just like matching a token.
// Disambiguating predicate evaluation occurs when we test a predicate during
// prediction.
var FailedPredicateException = (function (_super) {
    __extends(FailedPredicateException, _super);
    function FailedPredicateException(recognizer, predicate, message) {
        _super.call(this, {
            message: FailedPredicateException.formatMessage(predicate, message || null),
            recognizer: recognizer,
            input: recognizer.getInputStream(),
            ctx: recognizer._ctx
        });
        var s = recognizer._interp.atn.states[recognizer.state];
        var trans = s.transitions[0];
        if (trans instanceof Transition_1.PredicateTransition) {
            this.ruleIndex = trans.ruleIndex;
            this.predicateIndex = trans.predIndex;
        }
        else {
            this.ruleIndex = 0;
            this.predicateIndex = 0;
        }
        this.predicate = predicate;
        this.offendingToken = recognizer.getCurrentToken();
        return this;
    }
    FailedPredicateException.formatMessage = function (predicate, message) {
        if (message !== null) {
            return message;
        }
        else {
            return "failed predicate: {" + predicate + "}?";
        }
    };
    ;
    return FailedPredicateException;
}(RecognitionException));
exports.FailedPredicateException = FailedPredicateException;
var ParseCancellationException = (function (_super) {
    __extends(ParseCancellationException, _super);
    function ParseCancellationException(message) {
        _super.call(this, message);
        Error.captureStackTrace(this, ParseCancellationException);
    }
    return ParseCancellationException;
}(Error));
exports.ParseCancellationException = ParseCancellationException;
//# sourceMappingURL=Errors.js.map