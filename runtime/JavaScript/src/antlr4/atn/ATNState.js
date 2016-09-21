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
var INITIAL_NUM_TRANSITIONS = 4;
var ATNState = (function () {
    function ATNState() {
        // Which ATN are we in?    
        this.atn = null;
        this.stateNumber = ATNState.INVALID_STATE_NUMBER;
        this.stateType = null;
        this.ruleIndex = 0;
        this.epsilonOnlyTransitions = false;
        // Track the transitions emanating from this ATN state.
        this.transitions = [];
        // Used to cache lookahead during parsing, not used during construction
        this.nextTokenWithinRule = null;
    }
    ATNState.prototype.toString = function () {
        return this.stateNumber;
    };
    ;
    ATNState.prototype.equals = function (other) {
        if (other instanceof ATNState) {
            return this.stateNumber === other.stateNumber;
        }
        else {
            return false;
        }
    };
    ;
    ATNState.prototype.isNonGreedyExitState = function () {
        return false;
    };
    ;
    ATNState.prototype.addTransition = function (trans, index) {
        if (index === undefined) {
            index = -1;
        }
        if (this.transitions.length === 0) {
            this.epsilonOnlyTransitions = trans.isEpsilon;
        }
        else if (this.epsilonOnlyTransitions !== trans.isEpsilon) {
            this.epsilonOnlyTransitions = false;
        }
        if (index === -1) {
            this.transitions.push(trans);
        }
        else {
            this.transitions.splice(index, 1, trans);
        }
    };
    ;
    // constants for serialization
    ATNState.INVALID_TYPE = 0;
    ATNState.BASIC = 1;
    ATNState.RULE_START = 2;
    ATNState.BLOCK_START = 3;
    ATNState.PLUS_BLOCK_START = 4;
    ATNState.STAR_BLOCK_START = 5;
    ATNState.TOKEN_START = 6;
    ATNState.RULE_STOP = 7;
    ATNState.BLOCK_END = 8;
    ATNState.STAR_LOOP_BACK = 9;
    ATNState.STAR_LOOP_ENTRY = 10;
    ATNState.PLUS_LOOP_BACK = 11;
    ATNState.LOOP_END = 12;
    ATNState.serializationNames = [
        "INVALID",
        "BASIC",
        "RULE_START",
        "BLOCK_START",
        "PLUS_BLOCK_START",
        "STAR_BLOCK_START",
        "TOKEN_START",
        "RULE_STOP",
        "BLOCK_END",
        "STAR_LOOP_BACK",
        "STAR_LOOP_ENTRY",
        "PLUS_LOOP_BACK",
        "LOOP_END"];
    ATNState.INVALID_STATE_NUMBER = -1;
    return ATNState;
}());
exports.ATNState = ATNState;
var BasicState = (function (_super) {
    __extends(BasicState, _super);
    function BasicState() {
        _super.call(this);
        this.stateType = ATNState.BASIC;
        return this;
    }
    return BasicState;
}(ATNState));
exports.BasicState = BasicState;
var DecisionState = (function (_super) {
    __extends(DecisionState, _super);
    function DecisionState() {
        _super.call(this);
        this.decision = -1;
        this.nonGreedy = false;
    }
    return DecisionState;
}(ATNState));
exports.DecisionState = DecisionState;
//  The start of a regular {@code (...)} block.
var BlockStartState = (function (_super) {
    __extends(BlockStartState, _super);
    function BlockStartState() {
        _super.call(this);
        this.endState = null;
    }
    return BlockStartState;
}(DecisionState));
exports.BlockStartState = BlockStartState;
var BasicBlockStartState = (function (_super) {
    __extends(BasicBlockStartState, _super);
    function BasicBlockStartState() {
        _super.call(this);
        this.stateType = ATNState.BLOCK_START;
    }
    return BasicBlockStartState;
}(BlockStartState));
exports.BasicBlockStartState = BasicBlockStartState;
// Terminal node of a simple {@code (a|b|c)} block.
var BlockEndState = (function (_super) {
    __extends(BlockEndState, _super);
    function BlockEndState() {
        _super.call(this);
        this.startState = null;
        this.stateType = ATNState.BLOCK_END;
    }
    ;
    return BlockEndState;
}(ATNState));
exports.BlockEndState = BlockEndState;
// The last node in the ATN for a rule, unless that rule is the start symbol.
//  In that case, there is one transition to EOF. Later, we might encode
//  references to all calls to this rule to compute FOLLOW sets for
//  error handling.
//
var RuleStopState = (function (_super) {
    __extends(RuleStopState, _super);
    function RuleStopState() {
        _super.call(this);
        this.stateType = ATNState.RULE_STOP;
    }
    return RuleStopState;
}(ATNState));
exports.RuleStopState = RuleStopState;
var RuleStartState = (function (_super) {
    __extends(RuleStartState, _super);
    function RuleStartState() {
        _super.call(this);
        this.stopState = null;
        this.isPrecedenceRule = false;
        this.stateType = ATNState.RULE_START;
    }
    return RuleStartState;
}(ATNState));
exports.RuleStartState = RuleStartState;
// Decision state for {@code A+} and {@code (A|B)+}.  It has two transitions:
//  one to the loop back to start of the block and one to exit.
//
var PlusLoopbackState = (function (_super) {
    __extends(PlusLoopbackState, _super);
    function PlusLoopbackState() {
        _super.call(this);
        this.stateType = ATNState.PLUS_LOOP_BACK;
    }
    return PlusLoopbackState;
}(DecisionState));
exports.PlusLoopbackState = PlusLoopbackState;
// Start of {@code (A|B|...)+} loop. Technically a decision state, but
//  we don't use for code generation; somebody might need it, so I'm defining
//  it for completeness. In reality, the {@link PlusLoopbackState} node is the
//  real decision-making note for {@code A+}.
//
var PlusBlockStartState = (function (_super) {
    __extends(PlusBlockStartState, _super);
    function PlusBlockStartState() {
        _super.call(this);
        this.loopBackState = null;
        this.stateType = ATNState.PLUS_BLOCK_START;
    }
    return PlusBlockStartState;
}(BlockStartState));
exports.PlusBlockStartState = PlusBlockStartState;
// The block that begins a closure loop.
var StarBlockStartState = (function (_super) {
    __extends(StarBlockStartState, _super);
    function StarBlockStartState() {
        _super.call(this);
        this.stateType = ATNState.STAR_BLOCK_START;
    }
    return StarBlockStartState;
}(BlockStartState));
exports.StarBlockStartState = StarBlockStartState;
var StarLoopbackState = (function (_super) {
    __extends(StarLoopbackState, _super);
    function StarLoopbackState() {
        _super.call(this);
        this.stateType = ATNState.STAR_LOOP_BACK;
    }
    return StarLoopbackState;
}(ATNState));
exports.StarLoopbackState = StarLoopbackState;
var StarLoopEntryState = (function (_super) {
    __extends(StarLoopEntryState, _super);
    function StarLoopEntryState() {
        _super.call(this);
        this.loopBackState = null;
        // Indicates whether this state can benefit from a precedence DFA during SLL decision making.
        this.precedenceRuleDecision = null;
        this.stateType = ATNState.STAR_LOOP_ENTRY;
        return this;
    }
    return StarLoopEntryState;
}(DecisionState));
exports.StarLoopEntryState = StarLoopEntryState;
// Mark the end of a * or + loop.
var LoopEndState = (function (_super) {
    __extends(LoopEndState, _super);
    function LoopEndState() {
        _super.call(this);
        this.loopBackState = null;
        this.stateType = ATNState.LOOP_END;
    }
    return LoopEndState;
}(ATNState));
exports.LoopEndState = LoopEndState;
// The Tokens rule start state linking to each lexer rule start state */
var TokensStartState = (function (_super) {
    __extends(TokensStartState, _super);
    function TokensStartState() {
        _super.call(this);
        this.stateType = ATNState.TOKEN_START;
    }
    return TokensStartState;
}(DecisionState));
exports.TokensStartState = TokensStartState;
//# sourceMappingURL=ATNState.js.map