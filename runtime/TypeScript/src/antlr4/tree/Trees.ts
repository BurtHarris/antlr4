/*
 * [The "BSD license"]
 *  Copyright (c) 2012 Terence Parr
 *  Copyright (c) 2012 Sam Harwell
//  Copyright (c) 2016 Burt Harris
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions
 *  are met:
 *
 *  1. Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *  2. Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *  3. The name of the author may not be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 *  IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 *  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 *  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 *  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 *  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as  Utils from '../Utils';
import { Token } from '../Token'
import { Tree, RuleNode, ErrorNode, TerminalNode } from './Tree'
import { ParserRuleContext } from '../ParserRuleContext'
import { RuleContext } from '../RuleContext'
import { Recognizer } from '../Recognizer' 
import { ATN } from '../atn/ATN';
const INVALID_ALT_NUMBER = ATN.INVALID_ALT_NUMBER;


/** A set of utility routines useful for all kinds of ANTLR trees. */
export class Trees {
    constructor() { }

    // Print out a whole tree in LISP form. {@link //getNodeText} is used on the
    //  node payloads to get the text for the nodes.  Detect
    //  parse trees and extract data appropriately.
    static toStringTree(tree: Tree, ruleNames: string[], recog?: Parser) {
        ruleNames = ruleNames || null;
        recog = recog || null;
        if (recog !== null) {
            ruleNames = recog.ruleNames;
        }
        var s = Trees.getNodeText(tree, ruleNames);
        s = Utils.escapeWhitespace(s, false);
        var c = tree.getChildCount();
        if (c === 0) {
            return s;
        }
        var res = "(" + s + ' ';
        if (c > 0) {
            s = Trees.toStringTree(tree.getChild(0), ruleNames);
            res = res.concat(s);
        }
        for (var i = 1; i < c; i++) {
            s = Trees.toStringTree(tree.getChild(i), ruleNames);
            res = res.concat(' ' + s);
        }
        res = res.concat(")");
        return res;
    }

    static getNodeText(t: Tree, ruleNames: string[], recog? : Recognizer) {
        ruleNames = ruleNames || null;
        recog = recog || null;
        if (recog !== null) {
            ruleNames = recog.ruleNames;
        }
        if (ruleNames !== null) {
            if (t instanceof RuleContext) {
                var altNumber = (t as RuleContext).getAltNumber();
                if (altNumber != INVALID_ALT_NUMBER) {
                    return ruleNames[t.ruleIndex] + ":" + altNumber;
                }
                return ruleNames[t.ruleIndex];
            } else if (t instanceof ErrorNode) {
                return t.toString();
            } 
        }
        // no recog for rule names
        var payload = t.getPayload();
        if (payload instanceof Token) {
            return payload.text;
        }
        return t.getPayload().toString();
    };

    // XXX
    // // Return ordered list of all children of this node
    // static getChildren(t) {
    //     var list = [];
    //     for (var i = 0; i < t.getChildCount(); i++) {
    //         list.push(t.getChild(i));
    //     }
    //     return list;
    // };

    // Return a list of all ancestors of this node.  The first node of
    //  list is the root and the last is the parent of this node.
    //
    static getAncestors(t) {
        var ancestors = [];
        t = t.getParent();
        while (t !== null) {
            ancestors = [t].concat(ancestors);
            t = t.getParent();
        }
        return ancestors;
    };

    static findAllTokenNodes(t, ttype) {
        return Trees.findAllNodes(t, ttype, true);
    };

    static findAllRuleNodes(t, ruleIndex) {
        return Trees.findAllNodes(t, ruleIndex, false);
    };

    static findAllNodes(t, index, findTokens) {
        var nodes = [];
        Trees._findAllNodes(t, index, findTokens, nodes);
        return nodes;
    };

    private static _findAllNodes(t, index, findTokens, nodes) {
        // check this node (the root) first
        if (findTokens && (t instanceof TerminalNode)) {
            if (t.symbol.type === index) {
                nodes.push(t);
            }
        } else if (!findTokens && (t instanceof ParserRuleContext)) {
            if (t.ruleIndex === index) {
                nodes.push(t);
            }
        }
        // check children
        for (var i = 0; i < t.getChildCount(); i++) {
            Trees._findAllNodes(t.getChild(i), index, findTokens, nodes);
        }
    };

    static descendants(t) {
        var nodes = [t];
        for (var i = 0; i < t.getChildCount(); i++) {
            nodes = nodes.concat(Trees.descendants(t.getChild(i)));
        }
        return nodes;
    };

}