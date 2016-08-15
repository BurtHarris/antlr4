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
import {ATN} from './ATN'
import {StringHashed} from '../Utils'
import {Transition} from './Transition'

// The following images show the relation of states and
// {@link ATNState//transitions} for various grammar constructs.
//
// <ul>
//
// <li>Solid edges marked with an &//0949; indicate a required
// {@link EpsilonTransition}.</li>
//
// <li>Dashed edges indicate locations where any transition derived from
// {@link Transition} might appear.</li>
//
// <li>Dashed nodes are place holders for either a sequence of linked
// {@link BasicState} states or the inclusion of a block representing a nested
// construct in one of the forms below.</li>
//
// <li>Nodes showing multiple outgoing alternatives with a {@code ...} support
// any number of alternatives (one or more). Nodes without the {@code ...} only
// support the exact number of alternatives shown in the diagram.</li>
//
// </ul>
//
// <h2>Basic Blocks</h2>
//
// <h3>Rule</h3>
//
// <embed src="images/Rule.svg" type="image/svg+xml"/>
//
// <h3>Block of 1 or more alternatives</h3>
//
// <embed src="images/Block.svg" type="image/svg+xml"/>
//
// <h2>Greedy Loops</h2>
//
// <h3>Greedy Closure: {@code (...)*}</h3>
//
// <embed src="images/ClosureGreedy.svg" type="image/svg+xml"/>
//
// <h3>Greedy Positive Closure: {@code (...)+}</h3>
//
// <embed src="images/PositiveClosureGreedy.svg" type="image/svg+xml"/>
//
// <h3>Greedy Optional: {@code (...)?}</h3>
//
// <embed src="images/OptionalGreedy.svg" type="image/svg+xml"/>
//
// <h2>Non-Greedy Loops</h2>
//
// <h3>Non-Greedy Closure: {@code (...)*?}</h3>
//
// <embed src="images/ClosureNonGreedy.svg" type="image/svg+xml"/>
//
// <h3>Non-Greedy Positive Closure: {@code (...)+?}</h3>
//
// <embed src="images/PositiveClosureNonGreedy.svg" type="image/svg+xml"/>
//
// <h3>Non-Greedy Optional: {@code (...)??}</h3>
//
// <embed src="images/OptionalNonGreedy.svg" type="image/svg+xml"/>
//

const INITIAL_NUM_TRANSITIONS = 4;

// constants for serialization
export enum ATNStateType {
    INVALID_TYPE = 0,
    BASIC = 1,
    RULE_START = 2,
    BLOCK_START = 3,
    PLUS_BLOCK_START = 4,
    STAR_BLOCK_START = 5,
    TOKEN_START = 6,
    RULE_STOP = 7,
    BLOCK_END = 8,
    STAR_LOOP_BACK = 9,
    STAR_LOOP_ENTRY = 10,
    PLUS_LOOP_BACK = 11,
    LOOP_END = 12,
}

export abstract class ATNState implements StringHashed {

    static INVALID_STATE_NUMBER = -1;

    // Which ATN are we in?
    atn: ATN = null;
    stateNumber = ATNState.INVALID_STATE_NUMBER;
    ruleIndex = 0; // at runtime, we don't have Rule objects
    epsilonOnlyTransitions = false;
    
    // Track the transitions emanating from this ATN state.
    transitions: Transition[] = [];
    
    // Used to cache lookahead during parsing, not used during construction
    nextTokenWithinRule = null;
    
    constructor(public stateType : ATNStateType ) {
    }
    
    // StringHashable interface
    hashString() { return this.stateNumber.toString() };
    
    equals(other) {
        if (other instanceof ATNState) {
            return this.stateNumber === other.stateNumber;
        } else {
            return false;
        }
    };

    toString() {
        return this.stateNumber;
    };

    isNonGreedyExitState() {
        return false;
    };

    addTransition(trans:Transition, index?: number) {
        if (index === undefined) {
            index = -1;
        }
        if (this.transitions.length === 0) {
            this.epsilonOnlyTransitions = trans.isEpsilon;
        } else if (this.epsilonOnlyTransitions !== trans.isEpsilon) {
            this.epsilonOnlyTransitions = false;
        }
        if (index === -1) {
            this.transitions.push(trans);
        } else {
            this.transitions.splice(index, 1, trans);
        }
    };
}

export class BasicState extends ATNState {
    constructor() {
        super(ATNStateType.BASIC);
    }
};

export abstract class DecisionState extends ATNState {
    decision = -1;
    nonGreedy = false;
    constructor(stateType: ATNStateType) {
        super(stateType);
    }
}

//  The start of a regular {@code (...)} block.
export abstract class BlockStartState extends DecisionState {
    constructor( public stateType: ATNStateType, public endState : BlockEndState = null ) {
        super(stateType);
    }
}

export class BasicBlockStartState extends BlockStartState {
    constructor() {
        super(ATNStateType.BLOCK_START);
    }
}

// Terminal node of a simple {@code (a|b|c)} block.
export class BlockEndState extends ATNState {
    startState: ATNState = null;
    constructor() {
        super(ATNStateType.BLOCK_END);
    }
}

// The last node in the ATN for a rule, unless that rule is the start symbol.
//  In that case, there is one transition to EOF. Later, we might encode
//  references to all calls to this rule to compute FOLLOW sets for
//  error handling.
//
export class RuleStopState extends ATNState {
    constructor() {
        super(ATNStateType.RULE_STOP);
    }
}

export class RuleStartState extends ATNState {

    stopState: ATNState = null;
    isPrecedenceRule = false;

    constructor() {
        super(ATNStateType.RULE_START);
    }
}

// Decision state for {@code A+} and {@code (A|B)+}.  It has two transitions:
//  one to the loop back to start of the block and one to exit.
//
export class PlusLoopbackState extends DecisionState {
    constructor() {
        super(ATNStateType.PLUS_LOOP_BACK);
    }
}

// Start of {@code (A|B|...)+} loop. Technically a decision state, but
//  we don't use for code generation; somebody might need it, so I'm defining
//  it for completeness. In reality, the {@link PlusLoopbackState} node is the
//  real decision-making note for {@code A+}.
//
export class PlusBlockStartState extends BlockStartState {
    loopBackState: ATNState = null;
    constructor() {
        super(ATNStateType.PLUS_BLOCK_START);
    }
}

// The block that begins a closure loop.
export class StarBlockStartState extends BlockStartState {
    constructor() {
        super(ATNStateType.STAR_BLOCK_START);
    }
}

export class StarLoopbackState extends ATNState {
    constructor() {
        super(ATNStateType.STAR_LOOP_BACK);
    }
}

export class StarLoopEntryState extends DecisionState {
    loopBackState = null;
    // Indicates whether this state can benefit from a precedence DFA during SLL decision making.
    precedenceRuleDecision = null;
    constructor() {
        super(ATNStateType.STAR_LOOP_ENTRY);
    }
}

// Mark the end of a * or + loop.
export class LoopEndState extends ATNState {
    loopBackState: ATNState = null;
    constructor() {
        super(ATNStateType.LOOP_END);
    }
}

// The Tokens rule start state linking to each lexer rule start state */
export class TokensStartState extends DecisionState {
    constructor() {
        super(ATNStateType.TOKEN_START);
    }
}
