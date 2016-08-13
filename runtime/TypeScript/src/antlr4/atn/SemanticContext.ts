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

// A tree structure used to record the semantic context in which
//  an ATN configuration is valid.  It's either a single predicate,
//  a conjunction {@code p1&&p2}, or a sum of products {@code p1||p2}.
//
//  <p>I have scoped the {@link AND}, {@link OR}, and {@link Predicate} subclasses of
//  {@link SemanticContext} within the scope of this outer class.</p>
//

import { Recognizer } from '../Recognizer';
import { RuleContext } from '../RuleContext';
var Set = require('./../Utils').Set;

class SemanticContext {
	static NONE = new Predicate();

	constructor() {
	}

	// For context independent predicates, we evaluate them without a local
	// context (i.e., null context). That way, we can evaluate them without
	// having to create proper rule-specific context during prediction (as
	// opposed to the parser, which creates them naturally). In a practical
	// sense, this avoids a cast exception from RuleContext to myruleContext.
	//
	// <p>For context dependent predicates, we must pass in a local context so that
	// references such as $arg evaluate properly as _localctx.arg. We only
	// capture context dependent predicates in the context in which we begin
	// prediction, so we passed in the outer context here in case of context
	// dependent predicate evaluation.</p>
	//
	evaluate(parser: Recognizer, outerContext: RuleContext) : boolean {
		throw new Error('evaluate() not implemented');
	};

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
	evalPrecedence(parser: Recognizer, outerContext: RuleContext) : SemanticContext {
		return this;
	};

	static andContext(a: SemanticContext, b: SemanticContext) : SemanticContext {
		if (a === null || a === SemanticContext.NONE) {
			return b;
		}
		if (b === null || b === SemanticContext.NONE) {
			return a;
		}
		var result = new AND(a, b);
		if (result.opnds.length === 1) {
			return result.opnds[0];
		} else {
			return result;
		}
	};

	static orContext(a: SemanticContext, b: SemanticContext): SemanticContext {
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
		} else {
			return result;
		}
	}
}

export class Predicate extends SemanticContext {
	constructor(
		public ruleIndex = -1, 
		public predIndex = -1, 
		public isCtxDependent = false) {
		super();
	}

	evaluate(parser: Recognizer, outerContext: RuleContext ) {
		var localctx = this.isCtxDependent ? outerContext : null;
		return parser.sempred(localctx, this.ruleIndex, this.predIndex);
	};

	hashString() {
		return "" + this.ruleIndex + "/" + this.predIndex + "/" + this.isCtxDependent;
	};

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof Predicate)) {
			return false;
		} else {
			return this.ruleIndex === other.ruleIndex &&
				this.predIndex === other.predIndex &&
				this.isCtxDependent === other.isCtxDependent;
		}
	};

	toString() {
		return "{" + this.ruleIndex + ":" + this.predIndex + "}?";
	};
}

export class PrecedencePredicate extends SemanticContext {
	constructor(public precedence = 0) {
		super()
	}

	evaluate(parser: Recognizer, outerContext: RuleContext ) {
		return parser.precpred(outerContext, this.precedence);
	};

	evalPrecedence(parser: Recognizer, outerContext: RuleContext ) {
		if (parser.precpred(outerContext, this.precedence)) {
			return SemanticContext.NONE;
		} else {
			return null;
		}
	};

	compareTo(other) {
		return this.precedence - other.precedence;
	};

	hashString() {
		return "31";
	};

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof PrecedencePredicate)) {
			return false;
		} else {
			return this.precedence === other.precedence;
		}
	};

	toString() {
		return "{" + this.precedence + ">=prec}?";
	};



	static filterPrecedencePredicates(set) {
		var result = [];
		set.values().map(function (context) {
			if (context instanceof PrecedencePredicate) {
				result.push(context);
			}
		});
		return result;
	};
}

// A semantic context which is true whenever none of the contained contexts
// is false.
//
class AND extends SemanticContext {
	opnds: Array<SemanticContext> = [];

	constructor(a, b) {
		super();
		var operands = new Set();
		if (a instanceof AND) {
			a.opnds.map(function (o) {
				operands.add(o);
			});
		} else {
			operands.add(a);
		}
		if (b instanceof AND) {
			b.opnds.map(function (o) {
				operands.add(o);
			});
		} else {
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
	}

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof AND)) {
			return false;
		} else {
			return this.opnds === other.opnds;
		}
	};

	hashString() {
		return "" + this.opnds + "/AND";
	};
	//
	// {@inheritDoc}
	//
	// <p>
	// The evaluation of predicates by this context is short-circuiting, but
	// unordered.</p>
	//
	evaluate(parser: Recognizer, outerContext: RuleContext ) {
		for (var i = 0; i < this.opnds.length; i++) {
			if (!this.opnds[i].evaluate(parser, outerContext)) {
				return false;
			}
		}
		return true;
	};

	evalPrecedence(parser: Recognizer, outerContext: RuleContext ) {
		var differs = false;
		var operands = [];
		for (var i = 0; i < this.opnds.length; i++) {
			var context = this.opnds[i];
			var evaluated = context.evalPrecedence(parser, outerContext);
			differs = differs || (evaluated !== context);
			if (evaluated === null) {
				// The AND context is false if any element is false
				return null;
			} else if (evaluated !== SemanticContext.NONE) {
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

	toString() {
		var s = "";
		this.opnds.map(function (o) {
			s += "&& " + o.toString();
		});
		return s.length > 3 ? s.slice(3) : s;
	};
}
//
// A semantic context which is true whenever at least one of the contained
// contexts is true.
//
class OR extends SemanticContext {
	opnds: Array<SemanticContext> = [];

	constructor(a: SemanticContext, b: SemanticContext) {
		super();
		var operands = new Set();
		if (a instanceof OR) {
			a.opnds.map(function (o) {
				operands.add(o);
			});
		} else {
			operands.add(a);
		}
		if (b instanceof OR) {
			b.opnds.map(function (o) {
				operands.add(o);
			});
		} else {
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

/* Something extremely bizzare about this in the JavaScript runtime
	constructor(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof OR)) {
			return false;
		} else {
			return this.opnds === other.opnds;
		}
	};
*/

	hashString() {
		return "" + this.opnds + "/OR";
	};

	// <p>
	// The evaluation of predicates by this context is short-circuiting, but
	// unordered.</p>
	//
	evaluate(parser: Recognizer, outerContext: RuleContext ) {
		for (var i = 0; i < this.opnds.length; i++) {
			if (this.opnds[i].evaluate(parser, outerContext)) {
				return true;
			}
		}
		return false;
	};

	evalPrecedence(parser: Recognizer, outerContext: RuleContext ) {
		var differs = false;
		var operands = [];
		for (var i = 0; i < this.opnds.length; i++) {
			var context = this.opnds[i];
			var evaluated = context.evalPrecedence(parser, outerContext);
			differs = differs || (evaluated !== context);
			if (evaluated === SemanticContext.NONE) {
				// The OR context is true if any element is true
				return SemanticContext.NONE;
			} else if (evaluated !== null) {
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

	toString() {
		var s = "";
		this.opnds.map(function (o) {
			s += "|| " + o.toString();
		});
		return s.length > 3 ? s.slice(3) : s;
	};
}
