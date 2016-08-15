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
///

import { ATNConfigSet } from '../atn/ATNConfigSet';
import {LexerActionExecutor} from '../atn/LexerActionExecutor'
import {SemanticContext} from '../atn/SemanticContext'
import * as Misc from '../misc'

/** Map a predicate to a predicted alternative. */

class PredPrediction {
	constructor(public pred: SemanticContext, public alt:number) {
	}

	toString() {
		return "(" + this.pred + ", " + this.alt + ")";
	};
}

/** A DFA state represents a set of possible ATN configurations.
 *  As Aho, Sethi, Ullman p. 117 says "The DFA uses its state
 *  to keep track of all possible states the ATN can be in after
 *  reading each input symbol.  That is to say, after reading
 *  input a1a2..an, the DFA is in a state that represents the
 *  subset T of the states of the ATN that are reachable from the
 *  ATN's start state along some path labeled a1a2..an."
 *  In conventional NFA&rarr;DFA conversion, therefore, the subset T
 *  would be a bitset representing the set of states the
 *  ATN could be in.  We need to track the alt predicted by each
 *  state as well, however.  More importantly, we need to maintain
 *  a stack of states, tracking the closure operations as they
 *  jump from rule to rule, emulating rule invocations (method calls).
 *  I have to add a stack to simulate the proper lookahead sequences for
 *  the underlying LL grammar from which the ATN was derived.
 *
 *  <p>I use a set of ATNConfig objects not simple states.  An ATNConfig
 *  is both a state (ala normal conversion) and a RuleContext describing
 *  the chain of rules (if any) followed to arrive at that state.</p>
 *
 *  <p>A DFA state may have multiple references to a particular state,
 *  but with different ATN contexts (with same or different alts)
 *  meaning that state was reached via a different set of rule invocations.</p>
 */

export class DFAState implements Misc.Value {
	/** {@code edges[symbol]} points to target of symbol. Shift up by 1 so (-1)
	 *  {@link Token#EOF} maps to {@code edges[0]}.
	 */
	edges: DFAState[] = null;

	isAcceptState = false;

	/** if accept state, what ttype do we match or alt do we predict?
	 *  This is set to {@link ATN#INVALID_ALT_NUMBER} when {@link #predicates}{@code !=null} or
	 *  {@link #requiresFullContext}.
	 */
	prediction = 0;

	lexerActionExecutor: LexerActionExecutor = null;

	/**
	 * Indicates that this state was created during SLL prediction that
	 * discovered a conflict between the configurations in the state. Future
	 * {@link ParserATNSimulator#execATN} invocations immediately jumped doing
	 * full context prediction if this field is true.
	 */
	requiresFullContext = false

	/** During SLL parsing, this is a list of predicates associated with the
	 *  ATN configurations of the DFA state. When we have predicates,
	 *  {@link #requiresFullContext} is {@code false} since full context prediction evaluates predicates
	 *  on-the-fly. If this is not null, then {@link #prediction} is
	 *  {@link ATN#INVALID_ALT_NUMBER}.
	 *
	 *  <p>We only use these for non-{@link #requiresFullContext} but conflicting states. That
	 *  means we know from the context (it's $ or we don't dip into outer
	 *  context) that it's an ambiguity not a conflict.</p>
	 *
	 *  <p>This list is computed by {@link ParserATNSimulator#predicateDFAState}.</p>
	 */
	predicates: PredPrediction[] = null;

	constructor(public stateNumber = -1, public configs = new ATNConfigSet()) {
	}

	/** Get the set of all alts mentioned by all ATN configurations in this
		 *  DFA state.
		 */
	getAltSet(): Set<number> {
		var alts = new Set<number>();
		if (this.configs !== null) {
			for (var i = 0; i < this.configs.length; i++) {
				var c = this.configs[i];
				alts.add(c.alt);
			}
		}
		if (alts.size === 0) {
			return null;
		} else {
			return alts;
		}
	};

	public int hashCode() {
		int hash = MurmurHash.initialize(7);
		hash = MurmurHash.update(hash, configs.hashCode());
		hash = MurmurHash.finish(hash, 1);
		return hash;
	}
	/**
	 * Two {@link DFAState} instances are equal if their ATN configuration sets
	 * are the same. This method is used to see if a state already exists.
	 *
	 * <p>Because the number of alternatives and number of ATN configurations are
	 * finite, there is a finite number of DFA states that can be processed.
	 * This is necessary to show that the algorithm terminates.</p>
	 *
	 * <p>Cannot test the DFA state numbers here because in
	 * {@link ParserATNSimulator#addDFAState} we need to know if any other state
	 * exists that has this exact set of ATN configurations. The
	 * {@link #stateNumber} is irrelevant.</p>
	 */
	equals(other) {
		// compare set of ATN configurations in this set with other
		if (this === other) {
			return true;
		} else if (!(other instanceof DFAState)) {
			return false;
		} else {
			return this.configs.equals(other.configs);
		}
	};

	toString() {
		return "" + this.stateNumber + ":" + this.hashString();
	};

	hashString() {
		return "" + this.configs +
			(this.isAcceptState ?
				"=>" + (this.predicates !== null ?
					this.predicates :
					this.prediction) :
				"");
	};
}
