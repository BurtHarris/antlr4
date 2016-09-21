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

import { Token } from './../Token';
import { Interval } from './../IntervalSet';
import { IntervalSet } from './../IntervalSet';
import { Predicate } from './SemanticContext';
import { PrecedencePredicate } from './SemanticContext';

export class Transition {
    label;
    isEpsilon: boolean;
    serializationType: number;

    constructor(public target) {
        // The target of this transition.
        if (target===undefined || target===null) {
            throw "target cannot be null.";
        }
        this.target = target;
        // Are we epsilon, action, sempred?
        this.isEpsilon = false;
        this.label = null;
        return this;
    }

// constants for serialization
static EPSILON = 1;
static RANGE = 2;
static RULE = 3;
static PREDICATE = 4; // e.g., {isType(input.LT(1))}?
static ATOM = 5;
static ACTION = 6;
static SET = 7; // ~(A|B) or ~atom, wildcard, which convert to next 2
static NOT_SET = 8;
static WILDCARD = 9;
static PRECEDENCE = 10;

static serializationNames = [
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

static serializationTypes = {
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
}


// TODO: make all transitions sets? no, should remove set edges
export class AtomTransition extends Transition {
    label_;

    constructor(target, label) {
        super(target);
        this.label_ = label; // The token type or character value; or, signifies special label.
        this.label = this.makeLabel();
        this.serializationType = Transition.ATOM;
        return this;
    }


    makeLabel() {
        var s = new IntervalSet();
        s.addOne(this.label_);
        return s;
    };

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return this.label_ === symbol;
    };

    toString() {
        return this.label_;
    };
}

export class RuleTransition extends Transition {
    followState;
    precedence;
    ruleIndex;

    constructor(ruleStart, ruleIndex, precedence, followState) {
        super(ruleStart);
        this.ruleIndex = ruleIndex; // ptr to the rule definition object for this rule ref
        this.precedence = precedence;
        this.followState = followState; // what node to begin computations following ref to rule
        this.serializationType = Transition.RULE;
        this.isEpsilon = true;
        return this;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    }
}

export class EpsilonTransition extends Transition {
    outermostPrecedenceReturn;

    constructor(target, outermostPrecedenceReturn?) {
        super(target);
        this.serializationType = Transition.EPSILON;
        this.isEpsilon = true;
        this.outermostPrecedenceReturn = outermostPrecedenceReturn;
        return this;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    };

    toString() {
        return "epsilon";
    };
}

export class RangeTransition extends Transition {
    stop;
    start;

    constructor(target, start, stop) {
        super(target);
        this.serializationType = Transition.RANGE;
        this.start = start;
        this.stop = stop;
        this.label = this.makeLabel();
        return this;
    }


    makeLabel() {
        var s = new IntervalSet();
        s.addRange(this.start, this.stop);
        return s;
    };

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return symbol >= this.start && symbol <= this.stop;
    };

    toString() {
        return "'" + String.fromCharCode(this.start) + "'..'" + String.fromCharCode(this.stop) + "'";
    };
}

export class AbstractPredicateTransition extends Transition {
    constructor(target) {
        super(target);
        return this;
    }
}

export class PredicateTransition extends AbstractPredicateTransition {
    isCtxDependent;
    predIndex;
    ruleIndex;

    constructor(target, ruleIndex, predIndex, isCtxDependent) {
        super(target);
        this.serializationType = Transition.PREDICATE;
        this.ruleIndex = ruleIndex;
        this.predIndex = predIndex;
        this.isCtxDependent = isCtxDependent; // e.g., $i ref in pred
        this.isEpsilon = true;
        return this;
    }


    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    };

    getPredicate() {
        return new Predicate(this.ruleIndex, this.predIndex, this.isCtxDependent);
    };

    toString() {
        return "pred_" + this.ruleIndex + ":" + this.predIndex;
    };
}

export class ActionTransition extends Transition {
    isCtxDependent;
    actionIndex;
    ruleIndex;

    constructor(target, ruleIndex, actionIndex, isCtxDependent) {
        super(target);
        this.serializationType = Transition.ACTION;
        this.ruleIndex = ruleIndex;
        this.actionIndex = actionIndex===undefined ? -1 : actionIndex;
        this.isCtxDependent = isCtxDependent===undefined ? false : isCtxDependent; // e.g., $i ref in pred
        this.isEpsilon = true;
        return this;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    };

    toString() {
        return "action_" + this.ruleIndex + ":" + this.actionIndex;
    };
}


// A transition containing a set of values.
export class SetTransition extends Transition {
    constructor(target, set) {
        super(target);
        this.serializationType = Transition.SET;
        if (set !==undefined && set !==null) {
            this.label = set;
        } else {
            this.label = new IntervalSet();
            this.label.addOne(Token.INVALID_TYPE);
        }
        return this;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return this.label.contains(symbol);
    };


    toString() {
        return this.label.toString();
    };
}

export class NotSetTransition extends SetTransition {
    constructor(target, set) {
        super(target, set);
        this.serializationType = Transition.NOT_SET;
        return this;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
	return symbol >= minVocabSymbol && symbol <= maxVocabSymbol &&
            !SetTransition.prototype.matches.call(this, symbol, minVocabSymbol, maxVocabSymbol);
    };

    toString() {
        return '~' + SetTransition.prototype.toString.call(this);
    };
}

export class WildcardTransition extends Transition {
    constructor(target) {
        super(target);
        this.serializationType = Transition.WILDCARD;
        return this;
    }


    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return symbol >= minVocabSymbol && symbol <= maxVocabSymbol;
    };

    toString() {
        return ".";
    };
}

export class PrecedencePredicateTransition extends AbstractPredicateTransition {
    precedence;

    constructor(target, precedence) {
        super(target);
        this.serializationType = Transition.PRECEDENCE;
        this.precedence = precedence;
        this.isEpsilon = true;
        return this;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    }

    getPredicate() {
        return new PrecedencePredicate(this.precedence);
    }

    toString() {
        return this.precedence + " >= _p";
    }

}
