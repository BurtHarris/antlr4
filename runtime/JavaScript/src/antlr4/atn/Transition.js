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
//  An ATN transition between any two ATN states.  Subclasses define
//  atom, set, epsilon, action, predicate, rule transitions.
//
//  <p>This is a one way link.  It emanates from a state (usually via a list of
//  transitions) and has a target state.</p>
//
//  <p>Since we never have to change the ATN transitions once we construct it,
//  we can fix these transitions as specific classes. The DFA transitions
//  on the other hand need to update the labels as it adds transitions to
//  the states. We'll use the term Edge for the DFA to distinguish them from
//  ATN transitions.</p>
var Token_1 = require('./../Token');
var IntervalSet_1 = require('./../IntervalSet');
var SemanticContext_1 = require('./SemanticContext');
var SemanticContext_2 = require('./SemanticContext');
var Transition = (function () {
    function Transition(target) {
        this.target = target;
        // The target of this transition.
        if (target === undefined || target === null) {
            throw "target cannot be null.";
        }
        this.target = target;
        // Are we epsilon, action, sempred?
        this.isEpsilon = false;
        this.label = null;
        return this;
    }
    // constants for serialization
    Transition.EPSILON = 1;
    Transition.RANGE = 2;
    Transition.RULE = 3;
    Transition.PREDICATE = 4; // e.g., {isType(input.LT(1))}?
    Transition.ATOM = 5;
    Transition.ACTION = 6;
    Transition.SET = 7; // ~(A|B) or ~atom, wildcard, which convert to next 2
    Transition.NOT_SET = 8;
    Transition.WILDCARD = 9;
    Transition.PRECEDENCE = 10;
    Transition.serializationNames = [
        "INVALID",
        "EPSILON",
        "RANGE",
        "RULE",
        "PREDICATE",
        "ATOM",
        "ACTION",
        "SET",
        "NOT_SET",
        "WILDCARD",
        "PRECEDENCE"
    ];
    Transition.serializationTypes = {
        EpsilonTransition: Transition.EPSILON,
        RangeTransition: Transition.RANGE,
        RuleTransition: Transition.RULE,
        PredicateTransition: Transition.PREDICATE,
        AtomTransition: Transition.ATOM,
        ActionTransition: Transition.ACTION,
        SetTransition: Transition.SET,
        NotSetTransition: Transition.NOT_SET,
        WildcardTransition: Transition.WILDCARD,
        PrecedencePredicateTransition: Transition.PRECEDENCE
    };
    return Transition;
}());
exports.Transition = Transition;
// TODO: make all transitions sets? no, should remove set edges
var AtomTransition = (function (_super) {
    __extends(AtomTransition, _super);
    function AtomTransition(target, label) {
        _super.call(this, target);
        this.label_ = label; // The token type or character value; or, signifies special label.
        this.label = this.makeLabel();
        this.serializationType = Transition.ATOM;
        return this;
    }
    AtomTransition.prototype.makeLabel = function () {
        var s = new IntervalSet_1.IntervalSet();
        s.addOne(this.label_);
        return s;
    };
    ;
    AtomTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return this.label_ === symbol;
    };
    ;
    AtomTransition.prototype.toString = function () {
        return this.label_;
    };
    ;
    return AtomTransition;
}(Transition));
exports.AtomTransition = AtomTransition;
var RuleTransition = (function (_super) {
    __extends(RuleTransition, _super);
    function RuleTransition(ruleStart, ruleIndex, precedence, followState) {
        _super.call(this, ruleStart);
        this.ruleIndex = ruleIndex; // ptr to the rule definition object for this rule ref
        this.precedence = precedence;
        this.followState = followState; // what node to begin computations following ref to rule
        this.serializationType = Transition.RULE;
        this.isEpsilon = true;
        return this;
    }
    RuleTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    };
    return RuleTransition;
}(Transition));
exports.RuleTransition = RuleTransition;
var EpsilonTransition = (function (_super) {
    __extends(EpsilonTransition, _super);
    function EpsilonTransition(target, outermostPrecedenceReturn) {
        _super.call(this, target);
        this.serializationType = Transition.EPSILON;
        this.isEpsilon = true;
        this.outermostPrecedenceReturn = outermostPrecedenceReturn;
        return this;
    }
    EpsilonTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    };
    ;
    EpsilonTransition.prototype.toString = function () {
        return "epsilon";
    };
    ;
    return EpsilonTransition;
}(Transition));
exports.EpsilonTransition = EpsilonTransition;
var RangeTransition = (function (_super) {
    __extends(RangeTransition, _super);
    function RangeTransition(target, start, stop) {
        _super.call(this, target);
        this.serializationType = Transition.RANGE;
        this.start = start;
        this.stop = stop;
        this.label = this.makeLabel();
        return this;
    }
    RangeTransition.prototype.makeLabel = function () {
        var s = new IntervalSet_1.IntervalSet();
        s.addRange(this.start, this.stop);
        return s;
    };
    ;
    RangeTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return symbol >= this.start && symbol <= this.stop;
    };
    ;
    RangeTransition.prototype.toString = function () {
        return "'" + String.fromCharCode(this.start) + "'..'" + String.fromCharCode(this.stop) + "'";
    };
    ;
    return RangeTransition;
}(Transition));
exports.RangeTransition = RangeTransition;
var AbstractPredicateTransition = (function (_super) {
    __extends(AbstractPredicateTransition, _super);
    function AbstractPredicateTransition(target) {
        _super.call(this, target);
        return this;
    }
    return AbstractPredicateTransition;
}(Transition));
exports.AbstractPredicateTransition = AbstractPredicateTransition;
var PredicateTransition = (function (_super) {
    __extends(PredicateTransition, _super);
    function PredicateTransition(target, ruleIndex, predIndex, isCtxDependent) {
        _super.call(this, target);
        this.serializationType = Transition.PREDICATE;
        this.ruleIndex = ruleIndex;
        this.predIndex = predIndex;
        this.isCtxDependent = isCtxDependent; // e.g., $i ref in pred
        this.isEpsilon = true;
        return this;
    }
    PredicateTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    };
    ;
    PredicateTransition.prototype.getPredicate = function () {
        return new SemanticContext_1.Predicate(this.ruleIndex, this.predIndex, this.isCtxDependent);
    };
    ;
    PredicateTransition.prototype.toString = function () {
        return "pred_" + this.ruleIndex + ":" + this.predIndex;
    };
    ;
    return PredicateTransition;
}(AbstractPredicateTransition));
exports.PredicateTransition = PredicateTransition;
var ActionTransition = (function (_super) {
    __extends(ActionTransition, _super);
    function ActionTransition(target, ruleIndex, actionIndex, isCtxDependent) {
        _super.call(this, target);
        this.serializationType = Transition.ACTION;
        this.ruleIndex = ruleIndex;
        this.actionIndex = actionIndex === undefined ? -1 : actionIndex;
        this.isCtxDependent = isCtxDependent === undefined ? false : isCtxDependent; // e.g., $i ref in pred
        this.isEpsilon = true;
        return this;
    }
    ActionTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    };
    ;
    ActionTransition.prototype.toString = function () {
        return "action_" + this.ruleIndex + ":" + this.actionIndex;
    };
    ;
    return ActionTransition;
}(Transition));
exports.ActionTransition = ActionTransition;
// A transition containing a set of values.
var SetTransition = (function (_super) {
    __extends(SetTransition, _super);
    function SetTransition(target, set) {
        _super.call(this, target);
        this.serializationType = Transition.SET;
        if (set !== undefined && set !== null) {
            this.label = set;
        }
        else {
            this.label = new IntervalSet_1.IntervalSet();
            this.label.addOne(Token_1.Token.INVALID_TYPE);
        }
        return this;
    }
    SetTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return this.label.contains(symbol);
    };
    ;
    SetTransition.prototype.toString = function () {
        return this.label.toString();
    };
    ;
    return SetTransition;
}(Transition));
exports.SetTransition = SetTransition;
var NotSetTransition = (function (_super) {
    __extends(NotSetTransition, _super);
    function NotSetTransition(target, set) {
        _super.call(this, target, set);
        this.serializationType = Transition.NOT_SET;
        return this;
    }
    NotSetTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return symbol >= minVocabSymbol && symbol <= maxVocabSymbol &&
            !SetTransition.prototype.matches.call(this, symbol, minVocabSymbol, maxVocabSymbol);
    };
    ;
    NotSetTransition.prototype.toString = function () {
        return '~' + SetTransition.prototype.toString.call(this);
    };
    ;
    return NotSetTransition;
}(SetTransition));
exports.NotSetTransition = NotSetTransition;
var WildcardTransition = (function (_super) {
    __extends(WildcardTransition, _super);
    function WildcardTransition(target) {
        _super.call(this, target);
        this.serializationType = Transition.WILDCARD;
        return this;
    }
    WildcardTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return symbol >= minVocabSymbol && symbol <= maxVocabSymbol;
    };
    ;
    WildcardTransition.prototype.toString = function () {
        return ".";
    };
    ;
    return WildcardTransition;
}(Transition));
exports.WildcardTransition = WildcardTransition;
var PrecedencePredicateTransition = (function (_super) {
    __extends(PrecedencePredicateTransition, _super);
    function PrecedencePredicateTransition(target, precedence) {
        _super.call(this, target);
        this.serializationType = Transition.PRECEDENCE;
        this.precedence = precedence;
        this.isEpsilon = true;
        return this;
    }
    PrecedencePredicateTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    };
    PrecedencePredicateTransition.prototype.getPredicate = function () {
        return new SemanticContext_2.PrecedencePredicate(this.precedence);
    };
    PrecedencePredicateTransition.prototype.toString = function () {
        return this.precedence + " >= _p";
    };
    return PrecedencePredicateTransition;
}(AbstractPredicateTransition));
exports.PrecedencePredicateTransition = PrecedencePredicateTransition;
//# sourceMappingURL=Transition.js.map