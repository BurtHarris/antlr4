// [The "BSD license"]
//  Copyright (c) 2013 Terence Parr
//  Copyright (c) 2013 Sam Harwell
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

//  A rule context is a record of a single rule invocation. It knows
//  which context invoked it, if any. If there is no parent context, then
//  naturally the invoking state is not valid.  The parent link
//  provides a chain upwards from the current rule invocation to the root
//  of the invocation tree, forming a stack. We actually carry no
//  information about the rule associated with this context (except
//  when parsing). We keep only the state number of the invoking state from
//  the ATN submachine that invoked this. Contrast this with the s
//  pointer inside ParserRuleContext that tracks the current state
//  being "executed" for the current rule.
//
//  The parent contexts are useful for computing lookahead sets and
//  getting error information.
//
//  These objects are used during parsing and prediction.
//  For the special case of parsers, we use the subclass
//  ParserRuleContext.
//
//  @see ParserRuleContext
///

import { RuleNode } from './tree/Tree';
import { INVALID_INTERVAL } from './tree/Tree';
import { INVALID_ALT_NUMBER } from './atn/ATN';
import { Trees } from './tree/Trees';
import { ParserRuleContext } from './ParserRuleContext';

export class RuleContext implements RuleNode {
    constructor(public parentCtx = null, public invokingState = -1) {
        super();
        // What state invoked the rule associated with this context?
        // The "return address" is the followState of invokingState
        // If parent is null, this should be -1.
    }

    depth() {
        var n = 0;
        var p = this;
        while (p !== null) {
            p = p.parentCtx;
            n += 1;
        }
        return n;
    };

// A context is empty if there is no invoking state; meaning nobody call
// current context.
    isEmpty() {
        return this.invokingState === -1;
    };

// satisfy the ParseTree / SyntaxTree interface

    getSourceInterval() {
        return INVALID_INTERVAL;
    };

    getRuleContext() {
        return this;
    };

    getPayload() {
        return this;
    };

// Return the combined text of all child nodes. This method only considers
// tokens which have been added to the parse tree.
// <p>
// Since tokens on hidden channels (e.g. whitespace or comments) are not
// added to the parse trees, they will not appear in the output of this
// method.
// /
    getText() {
        if (this.getChildCount() === 0) {
            return "";
        } else {
            return this.children.map(function(child) {
                    return child.getText();
                }).join("");
        }
    };

// For rule associated with this parse tree internal node, return
// the outer alternative number used to match the input. Default
// implementation does not compute nor store this alt num. Create
// a subclass of ParserRuleContext with backing field and set
// option contextSuperClass.
// to set it.
    getAltNumber() { return INVALID_ALT_NUMBER; }

// Set the outer alternative number for this context node. Default
// implementation does nothing to avoid backing field overhead for
// trees that don't need it.  Create
// a subclass of ParserRuleContext with backing field and set
// option contextSuperClass.
    setAltNumber(altNumber) {}

    getChild(i) {
        return null;
    };

    getChildCount() {
        return 0;
    };

    accept(visitor) {
        return visitor.visitChildren(this);
    };


// Print out a whole tree, not just a node, in LISP format
// (root child1 .. childN). Print just a node if this is a leaf.
//

    toStringTree(ruleNames, recog) {
        return Trees.toStringTree(this, ruleNames, recog);
    };

    toString(ruleNames, stop) {
        ruleNames = ruleNames || null;
        stop = stop || null;
        var p = this;
        var s = "[";
        while (p !== null && p !== stop) {
            if (ruleNames === null) {
                if (!p.isEmpty()) {
                    s += p.invokingState;
                }
            } else {
                var ri = p.ruleIndex;
			var ruleName = (ri >= 0 && ri < ruleNames.length) ? ruleNames[ri]
                    : "" + ri;
                s += ruleName;
            }
            if (p.parentCtx !== null && (ruleNames !== null || !p.parentCtx.isEmpty())) {
                s += " ";
            }
            p = p.parentCtx;
        }
        s += "]";
        return s;
    };
}
