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
///

// The basic notion of a tree has a parent, a payload, and a list of children.
//  It is the most abstract interface for all the trees used by ANTLR.
///

import { Token } from '../Token';
import { Interval } from '../IntervalSet';
import { Parser } from '../Parser';
import { RuleContext } from '../RuleContext';
import { ParserRuleContext } from '../ParserRuleContext';

//export Utils = require('../Utils.js');



export interface Tree {
	getChild(i: number): Tree;
	getChildCount(): number;
	getParent(): Tree;
	getPayload(): any;
	toStringTree(): string;
}

export interface SyntaxTree extends Tree {
	getSourceInterval(): Interval;
}

export interface ParseTree extends SyntaxTree {
	accept(visitor: ParseTreeVisitor<SyntaxTree>);
	getParent(): ParseTree;
	getChild(i: number): ParseTree;
	getText(): string;
	toStringTree(parser: Parser): string;

	isErrorNode?(): boolean;
}

export interface TerminalNode extends ParseTree {

}

export interface ErrorNode extends TerminalNode {
	symbol: Token;

}

export interface RuleNode extends ParseTree {
	getRuleContext(): RuleContext;
}

export interface ParseTreeVisitor<T> {
	visit(tree: ParseTree): T;
	visitChildren(node: RuleNode): T;
	visitTerminal(node: TerminalNode): T;
	visitErrorNode(node: ErrorNode): T;
}

export class ParseTreeListener {
	visitTerminal(node: TerminalNode) { };
	visitErrorNode(node: ErrorNode) { };
	enterEveryRule(ctx: ParserRuleContext) { };
	exitEveryRule(ctx: ParserRuleContext) { };
}

export class ParseTreeWalker {

	constructor() { }

	public walk(listener: ParseTreeListener, t: ParseTree) {
		var errorNode = t instanceof ErrorNode ||
			(t.isErrorNode !== undefined && t.isErrorNode());
		if (errorNode) {
			listener.visitErrorNode(t);
		} else if (t instanceof TerminalNode) {
			listener.visitTerminal(t);
		} else {
			this.enterRule(listener, t);
			for (var i = 0; i < t.getChildCount(); i++) {
				var child = t.getChild(i);
				this.walk(listener, child);
			}
			this.exitRule(listener, t);
		}
	};
	//
	// The discovery of a rule node, involves sending two events: the generic
	// {@link ParseTreeListener//enterEveryRule} and a
	// {@link RuleContext}-specific event. First we trigger the generic and then
	// the rule specific. We to them in reverse order upon finishing the node.
	//
	protected enterRule(listener: ParseTreeListener, r: RuleNode) {
		var ctx = r.getRuleContext();
		listener.enterEveryRule(ctx);
		ctx.enterRule(listener);
	};

	protected exitRule(listener: ParseTreeListener, r: RuleNode) {
		var ctx = r.getRuleContext();
		ctx.exitRule(listener);
		listener.exitEveryRule(ctx);
	};

	static DEFAULT = new ParseTreeWalker();
}

class RuleNode extends ParseTree {
	constructor() {
		super();
	}
}

export class TerminalNode extends ParseTree {
	constructor() {
		super();
	}
}

export class ErrorNode {
	constructor() {
		super()
	}
}

export class ParseTreeVisitorBase {
	constructor() {
	}

	visit(ctx) {
		if (Utils.isArray(ctx)) {
			var self = this;
			return ctx.map(function (child) { return visitAtom(self, child) });
		} else {
			return visitAtom(this, ctx);
		}
	};

	visitTerminal(node) {
	};

	visitErrorNode(node) {
	};
}

function visitAtom(visitor, ctx) {
	if (ctx.parser === undefined) { //is terminal
		return;
	}

	var name = ctx.parser.ruleNames[ctx.ruleIndex];
	var funcName = "visit" + Utils.titleCase(name);

	return visitor[funcName](ctx);
};


export class TerminalNodeImpl extends TerminalNode {
	parentCtx = null;
	constructor(private symbol) {
		super();

	}
	getChild(i) {
		return null;
	};

	getSymbol() {
		return this.symbol;
	};

	getParent() {
		return this.parentCtx;
	};

	getPayload() {
		return this.symbol;
	};

	getSourceInterval() {
		if (this.symbol === null) {
			return INVALID_INTERVAL;
		}
		var tokenIndex = this.symbol.tokenIndex;
		return new Interval(tokenIndex, tokenIndex);
	};

	getChildCount() {
		return 0;
	};

	accept(visitor) {
		return visitor.visitTerminal(this);
	};

	getText() {
		return this.symbol.text;
	};

	toString() {
		if (this.symbol.type === Token.EOF) {
			return "<EOF>";
		} else {
			return this.symbol.text;
		}
	}
}

// Represents a token that was consumed during resynchronization
// rather than during a valid match operation. For example,
// we will create this kind of a node during single token insertion
// and deletion as well as during "consume until error recovery set"
// upon no viable alternative exceptions.

export class ErrorNodeImpl extends TerminalNode {
	constructor(token) {
		super(token);
	}

	isErrorNode() {
		return true;
	};

	accept(visitor) {
		return visitor.visitErrorNode(this);
	};

}
