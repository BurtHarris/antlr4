//
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
//
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// A tree structure used to record the semantic context in which
//  an ATN configuration is valid.  It's either a single predicate,
//  a conjunction {@code p1&&p2}, or a sum of products {@code p1||p2}.
//
//  <p>I have scoped the {@link AND}, {@link OR}, and {@link Predicate} subclasses of
//  {@link SemanticContext} within the scope of this outer class.</p>
//
var Utils_1 = require('./../Utils');
var SemanticContext = (function () {
    function SemanticContext() {
    }
    //
    // Evaluate the precedence predicates for the context and reduce the result.
    //
    // @param parser The parser instance.
    // @param outerContext The current parser context object.
    // @return The simplified semantic context after precedence predicates are
    // evaluated, which will be one of the following values.
    // <ul>
    // <li>{@link //NONE}: if the predicate simplifies to {@code true} after
    // precedence predicates are evaluated.</li>
    // <li>{@code null}: if the predicate simplifies to {@code false} after
    // precedence predicates are evaluated.</li>
    // <li>{@code this}: if the semantic context is not changed as a result of
    // precedence predicate evaluation.</li>
    // <li>A non-{@code null} {@link SemanticContext}: the new simplified
    // semantic context after precedence predicates are evaluated.</li>
    // </ul>
    //
    SemanticContext.prototype.evalPrecedence = function (parser, outerContext) {
        return this;
    };
    ;
    SemanticContext.andContext = function (a, b) {
        if (a === null || a === SemanticContext.NONE) {
            return b;
        }
        if (b === null || b === SemanticContext.NONE) {
            return a;
        }
        var result = new AND(a, b);
        if (result.opnds.length === 1) {
            return result.opnds[0];
        }
        else {
            return result;
        }
    };
    ;
    SemanticContext.orContext = function (a, b) {
        if (a === null) {
            return b;
        }
        if (b === null) {
            return a;
        }
        if (a === SemanticContext.NONE || b === SemanticContext.NONE) {
            return SemanticContext.NONE;
        }
        var result = new OR(a, b);
        if (result.opnds.length === 1) {
            return result.opnds[0];
        }
        else {
            return result;
        }
    };
    ;
    //The default {@link SemanticContext}, which is semantically equivalent to
    //a predicate of the form {@code {true}?}.
    //
    SemanticContext.NONE = new Predicate();
    return SemanticContext;
}());
exports.SemanticContext = SemanticContext;
var Predicate = (function (_super) {
    __extends(Predicate, _super);
    function Predicate(ruleIndex, predIndex, isCtxDependent) {
        _super.call(this);
        this.predIndex = predIndex === undefined ? -1 : predIndex;
        this.isCtxDependent = isCtxDependent === undefined ? false : isCtxDependent; // e.g., $i ref in pred
        return this;
    }
    Predicate.prototype.evaluate = function (parser, outerContext) {
        var localctx = this.isCtxDependent ? outerContext : null;
        return parser.sempred(localctx, this.ruleIndex, this.predIndex);
    };
    ;
    Predicate.prototype.hashString = function () {
        return "" + this.ruleIndex + "/" + this.predIndex + "/" + this.isCtxDependent;
    };
    ;
    Predicate.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof Predicate)) {
            return false;
        }
        else {
            return this.ruleIndex === other.ruleIndex &&
                this.predIndex === other.predIndex &&
                this.isCtxDependent === other.isCtxDependent;
        }
    };
    ;
    Predicate.prototype.toString = function () {
        return "{" + this.ruleIndex + ":" + this.predIndex + "}?";
    };
    ;
    return Predicate;
}(SemanticContext));
exports.Predicate = Predicate;
var PrecedencePredicate = (function (_super) {
    __extends(PrecedencePredicate, _super);
    function PrecedencePredicate(precedence) {
        if (precedence === void 0) { precedence = 0; }
        _super.call(this);
        this.precedence = precedence;
    }
    PrecedencePredicate.prototype.evaluate = function (parser, outerContext) {
        return parser.precpred(outerContext, this.precedence);
    };
    ;
    PrecedencePredicate.prototype.evalPrecedence = function (parser, outerContext) {
        if (parser.precpred(outerContext, this.precedence)) {
            return SemanticContext.NONE;
        }
        else {
            return null;
        }
    };
    ;
    PrecedencePredicate.prototype.compareTo = function (other) {
        return this.precedence - other.precedence;
    };
    ;
    PrecedencePredicate.prototype.hashString = function () {
        return "31";
    };
    ;
    PrecedencePredicate.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof PrecedencePredicate)) {
            return false;
        }
        else {
            return this.precedence === other.precedence;
        }
    };
    ;
    PrecedencePredicate.prototype.toString = function () {
        return "{" + this.precedence + ">=prec}?";
    };
    ;
    PrecedencePredicate.filterPrecedencePredicates = function (set) {
        var result = [];
        set.values()
            .map(function (context) {
            if (context instanceof PrecedencePredicate) {
                result.push(context);
            }
        });
        return result;
    };
    ;
    return PrecedencePredicate;
}(SemanticContext));
exports.PrecedencePredicate = PrecedencePredicate;
// A semantic context which is true whenever none of the contained contexts
// is false.
//
var AND = (function (_super) {
    __extends(AND, _super);
    function AND(a, b) {
        _super.call(this);
        var operands = new Utils_1.Set();
        if (a instanceof AND) {
            a.opnds.map(function (o) {
                operands.add(o);
            });
        }
        else {
            operands.add(a);
        }
        if (b instanceof AND) {
            b.opnds.map(function (o) {
                operands.add(o);
            });
        }
        else {
            operands.add(b);
        }
        var precedencePredicates = PrecedencePredicate.filterPrecedencePredicates(operands);
        if (precedencePredicates.length > 0) {
            // interested in the transition with the lowest precedence
            var reduced = null;
            precedencePredicates.map(function (p) {
                if (reduced === null || p.precedence < reduced.precedence) {
                    reduced = p;
                }
            });
            operands.add(reduced);
        }
        this.opnds = operands.values();
        return this;
    }
    AND.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof AND)) {
            return false;
        }
        else {
            return this.opnds === other.opnds;
        }
    };
    ;
    AND.prototype.hashString = function () {
        return "" + this.opnds + "/AND";
    };
    ;
    //
    // {@inheritDoc}
    //
    // <p>
    // The evaluation of predicates by this context is short-circuiting, but
    // unordered.</p>
    //
    AND.prototype.evaluate = function (parser, outerContext) {
        for (var i = 0; i < this.opnds.length; i++) {
            if (!this.opnds[i].evaluate(parser, outerContext)) {
                return false;
            }
        }
        return true;
    };
    ;
    AND.prototype.evalPrecedence = function (parser, outerContext) {
        var differs = false;
        var operands = [];
        for (var i = 0; i < this.opnds.length; i++) {
            var context = this.opnds[i];
            var evaluated = context.evalPrecedence(parser, outerContext);
            differs |= (evaluated !== context);
            if (evaluated === null) {
                // The AND context is false if any element is false
                return null;
            }
            else if (evaluated !== SemanticContext.NONE) {
                // Reduce the result by skipping true elements
                operands.push(evaluated);
            }
        }
        if (!differs) {
            return this;
        }
        if (operands.length === 0) {
            // all elements were true, so the AND context is true
            return SemanticContext.NONE;
        }
        var result = null;
        operands.map(function (o) {
            result = result === null ? o : SemanticContext.andContext(result, o);
        });
        return result;
    };
    ;
    AND.prototype.toString = function () {
        var s = "";
        this.opnds.map(function (o) {
            s += "&& " + o.toString();
        });
        return s.length > 3 ? s.slice(3) : s;
    };
    ;
    return AND;
}(SemanticContext));
//
// A semantic context which is true whenever at least one of the contained
// contexts is true.
//
var OR = (function (_super) {
    __extends(OR, _super);
    function OR(a, b) {
        _super.call(this);
        var operands = new Utils_1.Set();
        if (a instanceof OR) {
            a.opnds.map(function (o) {
                operands.add(o);
            });
        }
        else {
            operands.add(a);
        }
        if (b instanceof OR) {
            b.opnds.map(function (o) {
                operands.add(o);
            });
        }
        else {
            operands.add(b);
        }
        var precedencePredicates = PrecedencePredicate.filterPrecedencePredicates(operands);
        if (precedencePredicates.length > 0) {
            // interested in the transition with the highest precedence
            var s = precedencePredicates.sort(function (a, b) {
                return a.compareTo(b);
            });
            var reduced = s[s.length - 1];
            operands.add(reduced);
        }
        this.opnds = operands.values();
        return this;
    }
    /* TODO: Figure out what this was for!
    OR.prototype.constructor = function(other) {
        if (this === other) {
            return true;
        } else if (!(other instanceof OR)) {
            return false;
        } else {
            return this.opnds === other.opnds;
        }
    };
    */
    OR.prototype.hashString = function () {
        return "" + this.opnds + "/OR";
    };
    ;
    // <p>
    // The evaluation of predicates by this context is short-circuiting, but
    // unordered.</p>
    //
    OR.prototype.evaluate = function (parser, outerContext) {
        for (var i = 0; i < this.opnds.length; i++) {
            if (this.opnds[i].evaluate(parser, outerContext)) {
                return true;
            }
        }
        return false;
    };
    ;
    OR.prototype.evalPrecedence = function (parser, outerContext) {
        var differs = false;
        var operands = [];
        for (var i = 0; i < this.opnds.length; i++) {
            var context = this.opnds[i];
            var evaluated = context.evalPrecedence(parser, outerContext);
            differs |= (evaluated !== context);
            if (evaluated === SemanticContext.NONE) {
                // The OR context is true if any element is true
                return SemanticContext.NONE;
            }
            else if (evaluated !== null) {
                // Reduce the result by skipping false elements
                operands.push(evaluated);
            }
        }
        if (!differs) {
            return this;
        }
        if (operands.length === 0) {
            // all elements were false, so the OR context is false
            return null;
        }
        var result = null;
        operands.map(function (o) {
            return result === null ? o : SemanticContext.orContext(result, o);
        });
        return result;
    };
    ;
    OR.prototype.toString = function () {
        var s = "";
        this.opnds.map(function (o) {
            s += "|| " + o.toString();
        });
        return s.length > 3 ? s.slice(3) : s;
    };
    ;
    return OR;
}(SemanticContext));
//# sourceMappingURL=SemanticContext.js.map