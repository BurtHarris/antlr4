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

//* A rule invocation record for parsing.
//
//  Contains all of the information about the current rule not stored in the
//  RuleContext. It handles parse tree children list, Any ATN state
//  tracing, and the default values available for rule indications:
//  start, stop, rule index, current alt number, current
//  ATN state.
//
//  Subclasses made for each rule and grammar track the parameters,
//  return values, locals, and labels specific to that rule. These
//  are the objects that are returned from rules.
//
//  Note text is not an actual field of a rule return value; it is computed
//  from start and stop using the input stream's toString() method.  I
//  could add a ctor to this so that we can pass in and store the input
//  stream, but I'm not sure we want to do that.  It would seem to be undefined
//  to get the .text property anyway if the rule matches tokens from multiple
//  input streams.
//
//  I do not use getters for fields of objects that are used simply to
//  group values such as this aggregate.  The getters/setters are there to
//  satisfy the superclass interface.
import { Token } from './Token';
import { RuleContext } from './RuleContext';
import { Tree, ParseTree, TerminalNode, TerminalNodeImpl,  ErrorNodeImpl } from './tree/Tree';
import { Interval } from "./IntervalSet";
import { RecognitionException } from './error/Errors'

const INVALID_INTERVAL = Interval.INVALID_INTERVAL;

export class ParserRuleContext extends RuleContext { 
	static EMPTY = new ParserRuleContext();
	
	ruleIndex = -1;

    // * If we are debugging or building a parse tree for a visitor,
    // we need to track all of the tokens and rule invocations associated
    // with this rule's context. This is empty for parsing w/o tree constr.
    // operation because we don't the need to track the details about
    // how we parse this rule.
    // /
    children: Array<ParseTree> = null;
    
	// The exception that forced this rule to return. If the rule successfully
    // completed, this is {@code null}.
    exception: RecognitionException = null;

    start: Token = null;
    stop: Token = null;

   constructor(parent? : ParserRuleContext, invokingStateNumber? : number) {
	super(  parent || null, invokingStateNumber || null);
}

// * COPY a ctx (I'm deliberately not using copy constructor)///
copyFrom(ctx: ParserRuleContext) {
    // from RuleContext
    this.parentCtx = ctx.parentCtx;
    this.invokingState = ctx.invokingState;
    this.children = null;
    this.start = ctx.start;
    this.stop = ctx.stop;
};

// Double dispatch methods for listeners
enterRule(listener) {
};

exitRule(listener) {
};

// * Does not set parent link; other add methods do that///
addChild(child: TerminalNode ): TerminalNode;
addChild(child: ParserRuleContext ): ParserRuleContext;
addChild( child: ParseTree ): ParseTree {
    if (this.children === null) {
        this.children = [];
    }
    this.children.push(child);
    return child;
};

// * Used by enterOuterAlt to toss out a RuleContext previously added as
// we entered a rule. If we have // label, we will need to remove
// generic ruleContext object.
// /
removeLastChild() : void {
    if (this.children !== null) {
        this.children.pop();
    }
};

addTokenNode(token: Token) {
    var node = new TerminalNodeImpl(token);
    this.addChild(node);
    node.parentCtx = this;
    return node;
};

addErrorNode( badToken: Token ) {
    var node = new ErrorNodeImpl(badToken);
    this.addChild(node);
    node.parentCtx = this;
    return node;
};

getChild(i: number, type?: any): ParseTree {
	type = type || null;
	if (type === null) {
		return this.children.length>=i ? this.children[i] : null;
	} else {
		for(var j=0; j<this.children.length; j++) {
			var child = this.children[j];
			if(child instanceof type) {
				if(i===0) {
					return child;
				} else {
					i -= 1;
				}
			}
		}
		return null;
    }
};


getToken(ttype, i) {
	for(var j=0; j<this.children.length; j++) {
		var child = this.children[j];
		if (child instanceof TerminalNode) {
			if (child.symbol.type === ttype) {
				if(i===0) {
					return child;
				} else {
					i -= 1;
				}
			}
        }
	}
    return null;
};

getTokens(ttype ) {
    if (this.children=== null) {
        return [];
    } else {
		var tokens = [];
		for(var j=0; j<this.children.length; j++) {
			var child = this.children[j];
			if (child instanceof TerminalNode) {
				if (child.symbol.type === ttype) {
					tokens.push(child);
				}
			}
		}
		return tokens;
    }
};

getTypedRuleContext(ctxType, i) {
    return this.getChild(i, ctxType);
};

getTypedRuleContexts(ctxType) {
    if (this.children=== null) {
        return [];
    } else {
		var contexts = [];
		for(var j=0; j<this.children.length; j++) {
			var child = this.children[j];
			if (child instanceof ctxType) {
				contexts.push(child);
			}
		}
		return contexts;
	}
};

getChildCount() {
	if (this.children=== null) {
		return 0;
	} else {
		return this.children.length;
	}
};

getSourceInterval() {
    if( this.start === null || this.stop === null) {
        return INVALID_INTERVAL;
    } else {
        return new Interval(this.start.tokenIndex, this.stop.tokenIndex);
    }
};

}

class InterpreterRuleContext { 
   constructor(parent, invokingStateNumber, ruleIndex) {
	ParserRuleContext.call(parent, invokingStateNumber);
    this.ruleIndex = ruleIndex;
    return this;
}
}

exports.ParserRuleContext = ParserRuleContext;