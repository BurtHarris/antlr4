// [The "BSD license"]
//  Copyright (c) 2013 Terence Parr
//  Copyright (c) 2013 Sam Harwell
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

import { Token } from './../Token';
import { ATN } from './ATN';
import { ATNType } from './ATNType';
import * as ATNStates from './ATNState';
import * as Transitions from './Transition';
import { Interval, IntervalSet } from './../IntervalSet';
import { ATNDeserializationOptions } from './ATNDeserializationOptions';
import * as LexerActions from './LexerAction';

// This is the earliest supported serialized UUID.
// stick to serialized version for now, we don't need a UUID instance
const BASE_SERIALIZED_UUID = "AADB8D7E-AEEF-4415-AD2B-8204D6CF042E";

// This list contains all of the currently supported UUIDs, ordered by when
// the feature first appeared in this branch.
const SUPPORTED_UUIDS = [ BASE_SERIALIZED_UUID ];

const SERIALIZED_VERSION = 3;

// This is the current serialized UUID.
const SERIALIZED_UUID = BASE_SERIALIZED_UUID;

function initArray( length, value) {
	var tmp = [];
	tmp.length = length;
    tmp.fill(value, 0, length);
    return tmp;
}

export class ATNDeserializer {
    stateFactories = null;
    actionFactories = null;
    pos: number;
    data: any;
    uuid;

    
    constructor(public deserializationOptions: ATNDeserializationOptions =  ATNDeserializationOptions.defaultOptions) {
}

// Determines if a particular serialized representation of an ATN supports
// a particular feature, identified by the {@link UUID} used for serializing
// the ATN at the time the feature was first introduced.
//
// @param feature The {@link UUID} marking the first time the feature was
// supported in the serialized ATN.
// @param actualUuid The {@link UUID} of the actual serialized ATN which is
// currently being deserialized.
// @return {@code true} if the {@code actualUuid} value represents a
// serialized ATN at or after the feature identified by {@code feature} was
// introduced; otherwise, {@code false}.

isFeatureSupported(feature, actualUuid) {
    var idx1 = SUPPORTED_UUIDS.indexOf(feature);
    if (idx1<0) {
        return false;
    }
    var idx2 = SUPPORTED_UUIDS.indexOf(actualUuid);
    return idx2 >= idx1;
};

deserialize(data) {
    this.reset(data);
    this.checkVersion();
    this.checkUUID();
    var atn = this.readATN();
    this.readStates(atn);
    this.readRules(atn);
    this.readModes(atn);
    var sets = this.readSets(atn);
    this.readEdges(atn, sets);
    this.readDecisions(atn);
    this.readLexerActions(atn);
    this.markPrecedenceDecisions(atn);
    this.verifyATN(atn);
    if (this.deserializationOptions.generateRuleBypassTransitions && atn.grammarType === ATNType.PARSER ) {
        this.generateRuleBypassTransitions(atn);
        // re-verify after modification
        this.verifyATN(atn);
    }
    return atn;
};

reset(data) {
	var adjust = function(c) {
        var v = c.charCodeAt(0);
        return v>1  ? v-2 : -1;
	};
    var temp = data.split("").map(adjust);
    // don't adjust the first value since that's the version number
    temp[0] = data.charCodeAt(0);
    this.data = temp;
    this.pos = 0;
};

checkVersion() {
    var version = this.readInt();
    if ( version !== SERIALIZED_VERSION ) {
        throw ("Could not deserialize ATN with version " + version + " (expected " + SERIALIZED_VERSION + ").");
    }
};

checkUUID() {
    var uuid = this.readUUID();
    if (SUPPORTED_UUIDS.indexOf(uuid)<0) {
        throw ("Could not deserialize ATN with UUID: " + uuid +
                        " (expected " + SERIALIZED_UUID + " or a legacy UUID).", uuid, SERIALIZED_UUID);
    }
    this.uuid = uuid;
};

readATN() {
    var grammarType = this.readInt();
    var maxTokenType = this.readInt();
    return new ATN(grammarType, maxTokenType);
};

readStates(atn) {
	var j, pair, stateNumber;
    var loopBackStateNumbers = [];
    var endStateNumbers = [];
    var nstates = this.readInt();
    for(var i=0; i<nstates; i++) {
        var stype = this.readInt();
        // ignore bad type of states
        if (stype===ATNStates.ATNStateType.INVALID_TYPE) {
            atn.addState(null);
            continue;
        }
        var ruleIndex = this.readInt();
        if (ruleIndex === 0xFFFF) {
            ruleIndex = -1;
        }
        var s = this.stateFactory(stype, ruleIndex);
        if (stype === ATNStates.ATNStateType.LOOP_END) { // special case
            var loopBackStateNumber = this.readInt();
            loopBackStateNumbers.push([s, loopBackStateNumber]);
        } else if(s instanceof ATNStates.BlockStartState) {
            var endStateNumber = this.readInt();
            endStateNumbers.push([s, endStateNumber]);
        }
        atn.addState(s);
    }
    // delay the assignment of loop back and end states until we know all the
	// state instances have been initialized
    for (j=0; j<loopBackStateNumbers.length; j++) {
        pair = loopBackStateNumbers[j];
        pair[0].loopBackState = atn.states[pair[1]];
    }

    for (j=0; j<endStateNumbers.length; j++) {
        pair = endStateNumbers[j];
        pair[0].endState = atn.states[pair[1]];
    }
    
    var numNonGreedyStates = this.readInt();
    for (j=0; j<numNonGreedyStates; j++) {
        stateNumber = this.readInt();
        atn.states[stateNumber].nonGreedy = true;
    }

    var numPrecedenceStates = this.readInt();
    for (j=0; j<numPrecedenceStates; j++) {
        stateNumber = this.readInt();
        atn.states[stateNumber].isPrecedenceRule = true;
    }
};

readRules(atn) {
    var i;
    var nrules = this.readInt();
    if (atn.grammarType === ATNType.LEXER ) {
        atn.ruleToTokenType = initArray(nrules, 0);
    }
    atn.ruleToStartState = initArray(nrules, 0);
    for (i=0; i<nrules; i++) {
        var s = this.readInt();
        var startState = atn.states[s];
        atn.ruleToStartState[i] = startState;
        if ( atn.grammarType === ATNType.LEXER ) {
            var tokenType = this.readInt();
            if (tokenType === 0xFFFF) {
                tokenType = Token.EOF;
            }
            atn.ruleToTokenType[i] = tokenType;
        }
    }
    atn.ruleToStopState = initArray(nrules, 0);
    for (i=0; i<atn.states.length; i++) {
        var state = atn.states[i];
        if (!(state instanceof ATNStates.RuleStopState)) {
            continue;
        }
        atn.ruleToStopState[state.ruleIndex] = state;
        atn.ruleToStartState[state.ruleIndex].stopState = state;
    }
};

readModes(atn) {
    var nmodes = this.readInt();
    for (var i=0; i<nmodes; i++) {
        var s = this.readInt();
        atn.modeToStartState.push(atn.states[s]);
    }
};

readSets(atn) {
    var sets = [];
    var m = this.readInt();
    for (var i=0; i<m; i++) {
        var iset = new IntervalSet();
        sets.push(iset);
        var n = this.readInt();
        var containsEof = this.readInt();
        if (containsEof!==0) {
            iset.addOne(-1);
        }
        for (var j=0; j<n; j++) {
            var i1 = this.readInt();
            var i2 = this.readInt();
            iset.addRange(i1, i2);
        }
    }
    return sets;
};

readEdges(atn, sets) {
	var i, j, state, trans, target;
    var nedges = this.readInt();
    for (i=0; i<nedges; i++) {
        var src = this.readInt();
        var trg = this.readInt();
        var ttype = this.readInt();
        var arg1 = this.readInt();
        var arg2 = this.readInt();
        var arg3 = this.readInt();
        trans = this.edgeFactory(atn, ttype, src, trg, arg1, arg2, arg3, sets);
        var srcState = atn.states[src];
        srcState.addTransition(trans);
    }
    // edges for rule stop states can be derived, so they aren't serialized
    for (i=0; i<atn.states.length; i++) {
        state = atn.states[i];
        for (j=0; j<state.transitions.length; j++) {
            var t = state.transitions[j];
            if (!(t instanceof Transitions.RuleTransition)) {
                continue;
            }
			var outermostPrecedenceReturn = -1;
			if (atn.ruleToStartState[t.target.ruleIndex].isPrecedenceRule) {
				if (t.precedence === 0) {
					outermostPrecedenceReturn = t.target.ruleIndex;
				}
			}

			trans = new Transitions.EpsilonTransition(t.followState, outermostPrecedenceReturn);
            atn.ruleToStopState[t.target.ruleIndex].addTransition(trans);
        }
    }

    for (i=0; i<atn.states.length; i++) {
        state = atn.states[i];
        if (state instanceof ATNStates.BlockStartState) {
            // we need to know the end state to set its start state
            if (state.endState === null) {
                throw ("IllegalState");
            }
            // block end states can only be associated to a single block start
			// state
            if ( state.endState.startState !== null) {
                throw ("IllegalState");
            }
            state.endState.startState = state;
        }
        if (state instanceof ATNStates.PlusLoopbackState) {
            for (j=0; j<state.transitions.length; j++) {
                target = state.transitions[j].target;
                if (target instanceof ATNStates.PlusBlockStartState) {
                    target.loopBackState = state;
                }
            }
        } else if (state instanceof ATNStates.StarLoopbackState) {
            for (j=0; j<state.transitions.length; j++) {
                target = state.transitions[j].target;
                if (target instanceof ATNStates.StarLoopEntryState) {
                    target.loopBackState = state;
                }
            }
        }
    }
};

readDecisions(atn) {
    var ndecisions = this.readInt();
    for (var i=0; i<ndecisions; i++) {
        var s = this.readInt();
        var decState = atn.states[s];
        atn.decisionToState.push(decState);
        decState.decision = i;
    }
};

readLexerActions(atn) {
    if (atn.grammarType === ATNType.LEXER) {
        var count = this.readInt();
        atn.lexerActions = initArray(count, null);
        for (var i=0; i<count; i++) {
            var actionType = this.readInt();
            var data1 = this.readInt();
            if (data1 === 0xFFFF) {
                data1 = -1;
            }
            var data2 = this.readInt();
            if (data2 === 0xFFFF) {
                data2 = -1;
            }
            var lexerAction = this.lexerActionFactory(actionType, data1, data2);
            atn.lexerActions[i] = lexerAction;
        }
    }
};

generateRuleBypassTransitions(atn) {
	var i;
    var count = atn.ruleToStartState.length;
    for(i=0; i<count; i++) {
        atn.ruleToTokenType[i] = atn.maxTokenType + i + 1;
    }
    for(i=0; i<count; i++) {
        this.generateRuleBypassTransition(atn, i);
    }
};

generateRuleBypassTransition(atn: ATN, idx: number) {
	var i, state;
    var bypassStart = new ATNStates.BasicBlockStartState();
    bypassStart.ruleIndex = idx;
    atn.addState(bypassStart);

    var bypassStop = new ATNStates.BlockEndState();
    bypassStop.ruleIndex = idx;
    atn.addState(bypassStop);

    bypassStart.endState = bypassStop;
    atn.defineDecisionState(bypassStart);

    bypassStop.startState = bypassStart;

    var excludeTransition = null;
    var endState = null;
    
    if (atn.ruleToStartState[idx].isPrecedenceRule) {
        // wrap from the beginning of the rule to the StarLoopEntryState
        endState = null;
        for(i=0; i<atn.states.length; i++) {
            state = atn.states[i];
            if (this.stateIsEndStateFor(state, idx)) {
                endState = state;
                excludeTransition = state.loopBackState.transitions[0];
                break;
            }
        }
        if (excludeTransition === null) {
            throw ("Couldn't identify final state of the precedence rule prefix section.");
        }
    } else {
        endState = atn.ruleToStopState[idx];
    }
    
    // all non-excluded transitions that currently target end state need to
	// target blockEnd instead
    for(i=0; i<atn.states.length; i++) {
        state = atn.states[i];
        for(var j=0; j<state.transitions.length; j++) {
            var transition = state.transitions[j];
            if (transition === excludeTransition) {
                continue;
            }
            if (transition.target === endState) {
                transition.target = bypassStop;
            }
        }
    }

    // all transitions leaving the rule start state need to leave blockStart
	// instead
    var ruleToStartState = atn.ruleToStartState[idx];
    var count = ruleToStartState.transitions.length;
    while ( count > 0) {
        bypassStart.addTransition(ruleToStartState.transitions[count-1]);
        ruleToStartState.transitions = ruleToStartState.transitions.slice(-1);
    }
    // link the new states
    atn.ruleToStartState[idx].addTransition(new Transitions.EpsilonTransition(bypassStart));
    bypassStop.addTransition(new Transitions.EpsilonTransition(endState));

    var matchState = new ATNStates.BasicState();
    atn.addState(matchState);
    matchState.addTransition(new Transitions.AtomTransition(bypassStop, atn.ruleToTokenType[idx]));
    bypassStart.addTransition(new Transitions.EpsilonTransition(matchState));
};

stateIsEndStateFor(state, idx) {
    if ( state.ruleIndex !== idx) {
        return null;
    }
    if (!( state instanceof ATNStates.StarLoopEntryState)) {
        return null;
    }
    var maybeLoopEndState = state.transitions[state.transitions.length - 1].target;
    if (!( maybeLoopEndState instanceof ATNStates.LoopEndState)) {
        return null;
    }
    if (maybeLoopEndState.epsilonOnlyTransitions &&
        (maybeLoopEndState.transitions[0].target instanceof ATNStates.RuleStopState)) {
        return state;
    } else {
        return null;
    }
};

//
// Analyze the {@link StarLoopEntryState} states in the specified ATN to set
// the {@link StarLoopEntryState//precedenceRuleDecision} field to the
// correct value.
//
// @param atn The ATN.
//
markPrecedenceDecisions(atn) {
	for(var i=0; i<atn.states.length; i++) {
		var state = atn.states[i];
		if (!( state instanceof ATNStates.StarLoopEntryState)) {
            continue;
        }
        // We analyze the ATN to determine if this ATN decision state is the
        // decision for the closure block that determines whether a
        // precedence rule should continue or complete.
        //
        if ( atn.ruleToStartState[state.ruleIndex].isPrecedenceRule) {
            var maybeLoopEndState = state.transitions[state.transitions.length - 1].target;
            if (maybeLoopEndState instanceof ATNStates.LoopEndState) {
                if ( maybeLoopEndState.epsilonOnlyTransitions &&
                        (maybeLoopEndState.transitions[0].target instanceof ATNStates.RuleStopState)) {
                    state.precedenceRuleDecision = true;
                }
            }
        }
	}
};

verifyATN(atn) {
    if (!this.deserializationOptions.verifyATN) {
        return;
    }
    // verify assumptions
	for(var i=0; i<atn.states.length; i++) {
        var state:ATNStates.ATNState = atn.states[i];
        if (state === null) {
            continue;
        }
        this.checkCondition(state.epsilonOnlyTransitions || state.transitions.length <= 1);
        if (state instanceof ATNStates.PlusBlockStartState) {
            this.checkCondition(state.loopBackState !== null);
        } else  if (state instanceof ATNStates.StarLoopEntryState) {
            this.checkCondition(state.loopBackState !== null);
            this.checkCondition(state.transitions.length === 2);
            if (state.transitions[0].target instanceof ATNStates.StarBlockStartState) {
                this.checkCondition(state.transitions[1].target instanceof ATNStates.LoopEndState);
                this.checkCondition(!state.nonGreedy);
            } else if (state.transitions[0].target instanceof ATNStates.LoopEndState) {
                this.checkCondition(state.transitions[1].target instanceof ATNStates.StarBlockStartState);
                this.checkCondition(state.nonGreedy);
            } else {
                throw("IllegalState");
            }
        } else if (state instanceof ATNStates.StarLoopbackState) {
            this.checkCondition(state.transitions.length === 1);
            this.checkCondition(state.transitions[0].target instanceof ATNStates.StarLoopEntryState);
        } else if (state instanceof ATNStates.LoopEndState) {
            this.checkCondition(state.loopBackState !== null);
        } else if (state instanceof ATNStates.RuleStartState) {
            this.checkCondition(state.stopState !== null);
        } else if (state instanceof ATNStates.BlockStartState) {
            this.checkCondition(state.endState !== null);
        } else if (state instanceof ATNStates.BlockEndState) {
            this.checkCondition(state.startState !== null);
        } else if (state instanceof ATNStates.DecisionState) {
            this.checkCondition(state.transitions.length <= 1 || state.decision >= 0);
        } else {
            this.checkCondition(state.transitions.length <= 1 || (state instanceof ATNStates.RuleStopState));
        }
	}
};

checkCondition(condition: boolean, message?: string) {
    if (!condition) {
        if (message === undefined || message===null) {
            message = "IllegalState";
        }
        throw (message);
    }
};

readInt() {
    return this.data[this.pos++];
};

readInt32() {
    var low = this.readInt();
    var high = this.readInt();
    return low | (high << 16);
};

readLong() {
    var low = this.readInt32();
    var high = this.readInt32();
    return (low & 0x00000000FFFFFFFF) | (high << 32);
};

	
readUUID() {
	var bb = [];
	for(var i=7;i>=0;i--) {
		var int = this.readInt();
		/* jshint bitwise: false */
		bb[(2*i)+1] = int & 0xFF;
		bb[2*i] = (int >> 8) & 0xFF;
	}
    return byteToHex[bb[0]] + byteToHex[bb[1]] +
    byteToHex[bb[2]] + byteToHex[bb[3]] + '-' +
    byteToHex[bb[4]] + byteToHex[bb[5]] + '-' +
    byteToHex[bb[6]] + byteToHex[bb[7]] + '-' +
    byteToHex[bb[8]] + byteToHex[bb[9]] + '-' +
    byteToHex[bb[10]] + byteToHex[bb[11]] +
    byteToHex[bb[12]] + byteToHex[bb[13]] +
    byteToHex[bb[14]] + byteToHex[bb[15]];
};

edgeFactory(atn:ATN, type, src, trg, arg1, arg2, arg3, sets): Transitions.Transition {
    var target = atn.states[trg];
    switch(type) {
    case Transitions.Transition.EPSILON:
        return new Transitions.EpsilonTransition(target);
    case Transitions.Transition.RANGE:
        return arg3 !== 0 ? new Transitions.RangeTransition(target, Token.EOF, arg2) : new Transitions.RangeTransition(target, arg1, arg2);
    case Transitions.Transition.RULE:
        return new Transitions.RuleTransition(atn.states[arg1], arg2, arg3, target);
    case Transitions.Transition.PREDICATE:
        return new Transitions.PredicateTransition(target, arg1, arg2, arg3 !== 0);
    case Transitions.Transition.PRECEDENCE:
        return new Transitions.PrecedencePredicateTransition(target, arg1);
    case Transitions.Transition.ATOM:
        return arg3 !== 0 ? new Transitions.AtomTransition(target, Token.EOF) : new Transitions.AtomTransition(target, arg1);
    case Transitions.Transition.ACTION:
        return new Transitions.ActionTransition(target, arg1, arg2, arg3 !== 0);
    case Transitions.Transition.SET:
        return new Transitions.SetTransition(target, sets[arg1]);
    case Transitions.Transition.NOT_SET:
        return new Transitions.NotSetTransition(target, sets[arg1]);
    case Transitions.Transition.WILDCARD:
        return new Transitions.WildcardTransition(target);
    default:
        throw "The specified transition type: " + type + " is not valid.";
    }
};

stateFactory(type: ATNStates.ATNStateType, ruleIndex) {
    if (this.stateFactories === null) {
        var sf = [];
        sf[ATNStates.ATNStateType.INVALID_TYPE] = null;
        sf[ATNStates.ATNStateType.BASIC] = function() { return new ATNStates.BasicState(); };
        sf[ATNStates.ATNStateType.RULE_START] = function() { return new ATNStates.RuleStartState(); };
        sf[ATNStates.ATNStateType.BLOCK_START] = function() { return new ATNStates.BasicBlockStartState(); };
        sf[ATNStates.ATNStateType.PLUS_BLOCK_START] = function() { return new ATNStates.PlusBlockStartState(); };
        sf[ATNStates.ATNStateType.STAR_BLOCK_START] = function() { return new ATNStates.StarBlockStartState(); };
        sf[ATNStates.ATNStateType.TOKEN_START] = function() { return new ATNStates.TokensStartState(); };
        sf[ATNStates.ATNStateType.RULE_STOP] = function() { return new ATNStates.RuleStopState(); };
        sf[ATNStates.ATNStateType.BLOCK_END] = function() { return new ATNStates.BlockEndState(); };
        sf[ATNStates.ATNStateType.STAR_LOOP_BACK] = function() { return new ATNStates.StarLoopbackState(); };
        sf[ATNStates.ATNStateType.STAR_LOOP_ENTRY] = function() { return new ATNStates.StarLoopEntryState(); };
        sf[ATNStates.ATNStateType.PLUS_LOOP_BACK] = function() { return new ATNStates.PlusLoopbackState(); };
        sf[ATNStates.ATNStateType.LOOP_END] = function() { return new ATNStates.LoopEndState(); };
        this.stateFactories = sf;
    }
    if (type>this.stateFactories.length || this.stateFactories[type] === null) {
        throw("The specified state type " + type + " is not valid.");
    } else {
        var s = this.stateFactories[type]();
        if (s!==null) {
            s.ruleIndex = ruleIndex;
            return s;
        }
    }
};

lexerActionFactory(type, data1, data2) {
    if (this.actionFactories === null) {
        var af = [];
        af[LexerActions.LexerActionType.CHANNEL] = function(data1, data2) { return new LexerActions.LexerChannelAction(data1); };
        af[LexerActions.LexerActionType.CUSTOM] = function(data1, data2) { return new LexerActions.LexerCustomAction(data1, data2); };
        af[LexerActions.LexerActionType.MODE] = function(data1, data2) { return new LexerActions.LexerModeAction(data1); };
        af[LexerActions.LexerActionType.MORE] = function(data1, data2) { return LexerActions.LexerMoreAction.INSTANCE; };
        af[LexerActions.LexerActionType.POP_MODE] = function(data1, data2) { return LexerActions.LexerPopModeAction.INSTANCE; };
        af[LexerActions.LexerActionType.PUSH_MODE] = function(data1, data2) { return new LexerActions.LexerPushModeAction(data1); };
        af[LexerActions.LexerActionType.SKIP] = function(data1, data2) { return LexerActions.LexerSkipAction.INSTANCE; };
        af[LexerActions.LexerActionType.TYPE] = function(data1, data2) { return new LexerActions.LexerTypeAction(data1); };
        this.actionFactories = af;
    }
    if (type>this.actionFactories.length || this.actionFactories[type] === null) {
        throw("The specified lexer action type " + type + " is not valid.");
    } else {
        return this.actionFactories[type](data1, data2);
    }
};
   
}
function createByteToHex() {
	var bth = [];
	for (var i = 0; i < 256; i++) {
		bth[i] = (i + 0x100).toString(16).substr(1).toUpperCase();
	}
	return bth;
}

var byteToHex = createByteToHex();
