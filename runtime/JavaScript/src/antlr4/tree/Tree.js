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
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// The basic notion of a tree has a parent, a payload, and a list of children.
//  It is the most abstract interface for all the trees used by ANTLR.
///
var Token_1 = require('./../Token');
var IntervalSet_1 = require('./../IntervalSet');
exports.INVALID_INTERVAL = new IntervalSet_1.Interval(-1, -2);
var Utils = require('../Utils');
var TerminalNode = (function () {
    function TerminalNode() {
    }
    return TerminalNode;
}());
exports.TerminalNode = TerminalNode;
// While the Java runtime makes this class an interface, the
// JavaScript runtime uses a class to allow runtime checking
var ErrorNode = (function (_super) {
    __extends(ErrorNode, _super);
    function ErrorNode() {
        _super.apply(this, arguments);
    }
    return ErrorNode;
}(TerminalNode));
exports.ErrorNode = ErrorNode;
// TODO:  this probably needs to be split into interface and 
// base class.
var ParseTreeVisitor = (function () {
    function ParseTreeVisitor() {
    }
    ParseTreeVisitor.prototype.visit = function (ctx) {
        if (Utils.isArray(ctx)) {
            var self = this;
            return ctx.map(function (child) { return visitAtom(self, child); });
        }
        else {
            return visitAtom(this, ctx);
        }
    };
    ;
    ParseTreeVisitor.prototype.visitTerminal = function (node) {
    };
    ;
    ParseTreeVisitor.prototype.visitErrorNode = function (node) {
    };
    ;
    return ParseTreeVisitor;
}());
exports.ParseTreeVisitor = ParseTreeVisitor;
var visitAtom = function (visitor, ctx) {
    if (ctx.parser === undefined) {
        return;
    }
    var name = ctx.parser.ruleNames[ctx.ruleIndex];
    var funcName = "visit" + Utils.titleCase(name);
    return visitor[funcName](ctx);
};
// Note while Java in runtime ParseTreeListener is an interface,
// the JavaScript runtime has made it a class
var ParseTreeListener = (function () {
    function ParseTreeListener() {
    }
    ParseTreeListener.prototype.visitTerminal = function (node) {
    };
    ;
    ParseTreeListener.prototype.visitErrorNode = function (node) {
    };
    ;
    ParseTreeListener.prototype.enterEveryRule = function (ctx) {
    };
    ;
    ParseTreeListener.prototype.exitEveryRule = function (ctx) {
    };
    ;
    return ParseTreeListener;
}());
exports.ParseTreeListener = ParseTreeListener;
var TerminalNodeImpl = (function () {
    function TerminalNodeImpl(symbol) {
        this.symbol = symbol;
        this.parentCtx = null;
    }
    TerminalNodeImpl.prototype.getChild = function (i) {
        return null;
    };
    ;
    TerminalNodeImpl.prototype.getSymbol = function () {
        return this.symbol;
    };
    ;
    TerminalNodeImpl.prototype.getParent = function () {
        return this.parentCtx;
    };
    ;
    TerminalNodeImpl.prototype.getPayload = function () {
        return this.symbol;
    };
    ;
    TerminalNodeImpl.prototype.getSourceInterval = function () {
        if (this.symbol === null) {
            return exports.INVALID_INTERVAL;
        }
        var tokenIndex = this.symbol.tokenIndex;
        return new IntervalSet_1.Interval(tokenIndex, tokenIndex);
    };
    ;
    TerminalNodeImpl.prototype.getChildCount = function () {
        return 0;
    };
    ;
    TerminalNodeImpl.prototype.accept = function (visitor) {
        return visitor.visitTerminal(this);
    };
    ;
    TerminalNodeImpl.prototype.getText = function () {
        return this.symbol.text;
    };
    ;
    TerminalNodeImpl.prototype.toString = function () {
        if (this.symbol.type === Token_1.Token.EOF) {
            return "<EOF>";
        }
        else {
            return this.symbol.text;
        }
    };
    ;
    return TerminalNodeImpl;
}());
exports.TerminalNodeImpl = TerminalNodeImpl;
// Represents a token that was consumed during resynchronization
// rather than during a valid match operation. For example,
// we will create this kind of a node during single token insertion
// and deletion as well as during "consume until error recovery set"
// upon no viable alternative exceptions.
var ErrorNodeImpl = (function (_super) {
    __extends(ErrorNodeImpl, _super);
    function ErrorNodeImpl(token) {
        _super.call(this, token);
    }
    ErrorNodeImpl.prototype.isErrorNode = function () {
        return true;
    };
    ErrorNodeImpl.prototype.accept = function (visitor) {
        return visitor.visitErrorNode(this);
    };
    return ErrorNodeImpl;
}(TerminalNodeImpl));
exports.ErrorNodeImpl = ErrorNodeImpl;
var ParseTreeWalker = (function () {
    function ParseTreeWalker() {
        return this;
    }
    ParseTreeWalker.prototype.walk = function (listener, t) {
        var errorNode = t instanceof ErrorNode ||
            (t.isErrorNode !== undefined && t.isErrorNode());
        if (errorNode) {
            listener.visitErrorNode(t);
        }
        else if (t instanceof TerminalNode) {
            listener.visitTerminal(t);
        }
        else {
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
    ParseTreeWalker.prototype.enterRule = function (listener, r) {
        var ctx = r.getRuleContext();
        listener.enterEveryRule(ctx);
        ctx.enterRule(listener);
    };
    ;
    ParseTreeWalker.prototype.exitRule = function (listener, r) {
        var ctx = r.getRuleContext();
        ctx.exitRule(listener);
        listener.exitEveryRule(ctx);
    };
    ;
    ParseTreeWalker.DEFAULT = new ParseTreeWalker();
    return ParseTreeWalker;
}());
exports.ParseTreeWalker = ParseTreeWalker;
//# sourceMappingURL=Tree.js.map