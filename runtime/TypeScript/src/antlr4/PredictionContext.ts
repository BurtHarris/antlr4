//
// [The "BSD license"]
//  Copyright (c) 2012 Terence Parr
//  Copyright (c) 2012 Sam Harwell
//  Copyright (c) 2014 Eric Vergnaud
//  Copyright (c) 2014 Burt Harris
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

import { RuleContext } from './RuleContext';
import { StringHashed, StringHashedSet } from './Utils';
import { ATN } from './atn/ATN'

export abstract class PredictionContext implements StringHashed {
    // Represents {@code $} in local context prediction, which means wildcard.
    // {@code//+x =//}.
    // /
    static /*readonly*/ EMPTY = new EmptyPredictionContext();

    // Represents {@code $} in an array in full context mode, when {@code $}
    // doesn't mean wildcard: {@code $ + x = [$,x]}. Here,
    // {@code $} = {@link //EMPTY_RETURN_STATE}.
    // /
    static /*readonly*/ EMPTY_RETURN_STATE = 0x7FFFFFFF;


    static globalNodeCount = 1;

    id = PredictionContext.globalNodeCount++;

    constructor(public cachedHashString) {
    }

    abstract getParent(i: number): PredictionContext;

    equals(other: PredictionContext): boolean {
        return this === other
            || this.cachedHashString == other.cachedHashString && this.getParent(0) == other.getParent(0);
    }


    // Stores the computed hash code of this {@link PredictionContext}. The hash
    // code is computed in parts to match the following reference algorithm.
    //
    // <pre>
    // private int referenceHashCode() {
    // int hash = {@link MurmurHash//initialize MurmurHash.initialize}({@link
    // //INITIAL_HASH});
    //
    // for (int i = 0; i &lt; {@link //size()}; i++) {
    // hash = {@link MurmurHash//update MurmurHash.update}(hash, {@link //getParent
    // getParent}(i));
    // }
    //
    // for (int i = 0; i &lt; {@link //size()}; i++) {
    // hash = {@link MurmurHash//update MurmurHash.update}(hash, {@link
    // //getReturnState getReturnState}(i));
    // }
    //
    // hash = {@link MurmurHash//finish MurmurHash.finish}(hash, 2// {@link
    // //size()});
    // return hash;
    // }
    // </pre>
    // /

    // This means only the {@link //EMPTY} context is in set.
    isEmpty() {
        return this === PredictionContext.EMPTY as PredictionContext;
    };

    abstract getReturnState(index: number): number;
    abstract getLength(): number;

    hasEmptyPath() {
        return this.getReturnState(this.getLength() - 1) === PredictionContext.EMPTY_RETURN_STATE;
    };

    hashString(): string {
        return this.cachedHashString;
    };

    static calculateHashString(parent, returnState) {
        return "" + parent + returnState;
    }

    static calculateEmptyHashString() {
        return "";
    }


    static getCachedPredictionContext(
        context: PredictionContext,
        contextCache: StringHashedSet<PredictionContext>,
        visited: StringHashedSet<PredictionContext>
    ): PredictionContext {
        if (context.isEmpty()) {
            return context;
        }
        var existing = visited.get(context);
        if (existing !== null) {
            return existing;
        }
        existing = contextCache.get(context);
        if (existing !== null) {
            visited.add(existing);
            return existing;
        }
        var changed = false;
        var parents = [];
        for (var i = 0; i < parents.length; i++) {
            var parent = PredictionContext.getCachedPredictionContext(context.getParent(i), contextCache, visited);
            if (changed || parent !== context.getParent(i)) {
                if (!changed) {
                    parents = [];
                    for (var j = 0; j < context.getLength(); j++) {
                        parents[j] = context.getParent(j);
                    }
                    changed = true;
                }
                parents[i] = parent;
            }
        }
        if (!changed) {
            contextCache.add(context);
            visited.add(context);
            return context;
        }
        var updated = null;
        if (parents.length === 0) {
            updated = PredictionContext.EMPTY;
        } else if (parents.length === 1) {
            updated = SingletonPredictionContext.create(parents[0], context
                .getReturnState(0));
        } else {
            updated = new ArrayPredictionContext(parents,
                (context as ArrayPredictionContext).returnStates
            );
        }
        contextCache.add(updated);
        visited.add(updated);
        visited.add(context);

        return updated;
    }
}

// Used to cache {@link PredictionContext} objects. Its used for the shared
// context cash associated with contexts in DFA states. This cache
// can be used for both lexers and parsers.

class SingletonPredictionContext extends PredictionContext {
    constructor(private _parentCtx: PredictionContext, private _returnState: number) {
        super(parent !== null ? PredictionContext.calculateHashString(parent, _returnState)
            : PredictionContext.calculateEmptyHashString());
    }

    static create(parent: PredictionContext, returnState: number): SingletonPredictionContext {
        if (returnState === PredictionContext.EMPTY_RETURN_STATE && parent === null) {
            // someone can pass in the bits of an array ctx that mean $
            return PredictionContext.EMPTY;
        } else {
            return new SingletonPredictionContext(parent, returnState);
        }
    };

    getLength() {
        return 1;
    }

    getParent(index: number): PredictionContext {
        return this._parentCtx;
    };

    getReturnState(index) {
        return this._returnState;
    };

    equals(other) {
        if (this === other) {
            return true;
        } else if (!(other instanceof SingletonPredictionContext)) {
            return false;
        } else if (this.hashString() !== other.hashString()) {
            return false; // can't be same if hash is different
        } else {
            if (this._returnState !== other.returnState)
                return false;
            else if (this._parentCtx == null)
                return other.parentCtx == null
            else
                return this._parentCtx.equals(other.parentCtx);
        }
    };

    hashString() {
        return this.cachedHashString;
    };

    toString() {
        var up = this._parentCtx === null ? "" : this._parentCtx.toString();
        if (up.length === 0) {
            if (this._returnState === PredictionContext.EMPTY_RETURN_STATE) {
                return "$";
            } else {
                return "" + this._returnState;
            }
        } else {
            return "" + this._returnState + " " + up;
        }
    };
}


class EmptyPredictionContext extends SingletonPredictionContext {
    constructor() {
        super(null, PredictionContext.EMPTY_RETURN_STATE);
    }

    isEmpty() {
        return true;
    };

    getParent(index) {
        return null;
    };

    equals(other) {
        return this === other;
    };

    get length() {
        return 0;
    }

    toString() {
        return "$";
    };
}

export class ArrayPredictionContext extends PredictionContext {
    constructor(public parents, public returnStates) {
        // Parent can be null only if full ctx mode and we make an array
        // from {@link //EMPTY} and non-empty. We merge {@link //EMPTY} by using
        // null parent and
        // returnState == {@link //EMPTY_RETURN_STATE}.
        super(PredictionContext.calculateHashString(parents, returnStates));
    }

    isEmpty() {
        // since EMPTY_RETURN_STATE can only appear in the last position, we
        // don't need to verify that size==1
        return this.returnStates[0] === PredictionContext.EMPTY_RETURN_STATE;
    };

    getLength() {
        return this.returnStates.length;
    }


    getParent(index) {
        return this.parents[index];
    };

    getReturnState(index) {
        return this.returnStates[index];
    };

    equals(other) {
        if (this === other) {
            return true;
        } else if (!(other instanceof ArrayPredictionContext)) {
            return false;
        } else if (this.hashString !== other.hashString()) {
            return false; // can't be same if hash is different
        } else {
            return this.returnStates === other.returnStates &&
                this.parents === other.parents;
        }
    };

    toString() {
        if (this.isEmpty()) {
            return "[]";
        } else {
            var s = "[";
            for (var i = 0; i < this.returnStates.length; i++) {
                if (i > 0) {
                    s = s + ", ";
                }
                if (this.returnStates[i] === PredictionContext.EMPTY_RETURN_STATE) {
                    s = s + "$";
                    continue;
                }
                s = s + this.returnStates[i];
                if (this.parents[i] !== null) {
                    s = s + " " + this.parents[i];
                } else {
                    s = s + "null";
                }
            }
            return s + "]";
        }
    };
}

// Convert a {@link RuleContext} tree to a {@link PredictionContext} graph.
// Return {@link //EMPTY} if {@code outerContext} is empty or null.
// /
function predictionContextFromRuleContext(atn: ATN, outerContext: RuleContext): PredictionContext {
    if (outerContext === undefined || outerContext === null) {
        outerContext = RuleContext.EMPTY;
    }
    // if we are in RuleContext of start rule, s, then PredictionContext
    // is EMPTY. Nobody called us. (if we are empty, return empty)
    if (outerContext.parentCtx === null || outerContext === RuleContext.EMPTY) {
        return PredictionContext.EMPTY;
    }
    // If we have a parent, convert it to a PredictionContext graph
    var parent = predictionContextFromRuleContext(atn, outerContext.parentCtx);
    var state = atn.states[outerContext.invokingState];
    var transition = state.transitions[0];
    return SingletonPredictionContext.create(parent, transition.followState.stateNumber);
}

function calculateListsHashString(parents, returnStates) {
    var s = "";
    parents.map(function (p) {
        s = s + p;
    });
    returnStates.map(function (r) {
        s = s + r;
    });
    return s;
}

function merge(a, b, rootIsWildcard, mergeCache) {
    // share same graph if both same
    if (a === b) {
        return a;
    }
    if (a instanceof SingletonPredictionContext && b instanceof SingletonPredictionContext) {
        return mergeSingletons(a, b, rootIsWildcard, mergeCache);
    }
    // At least one of a or b is array
    // If one is $ and rootIsWildcard, return $ as// wildcard
    if (rootIsWildcard) {
        if (a instanceof EmptyPredictionContext) {
            return a;
        }
        if (b instanceof EmptyPredictionContext) {
            return b;
        }
    }
    // convert singleton so both are arrays to normalize
    if (a instanceof SingletonPredictionContext) {
        a = new ArrayPredictionContext([a.getParent()], [a.returnState]);
    }
    if (b instanceof SingletonPredictionContext) {
        b = new ArrayPredictionContext([b.getParent()], [b.returnState]);
    }
    return mergeArrays(a, b, rootIsWildcard, mergeCache);
}

//
// Merge two {@link SingletonPredictionContext} instances.
//
// <p>Stack tops equal, parents merge is same; return left graph.<br>
// <embed src="images/SingletonMerge_SameRootSamePar.svg"
// type="image/svg+xml"/></p>
//
// <p>Same stack top, parents differ; merge parents giving array node, then
// remainders of those graphs. A new root node is created to point to the
// merged parents.<br>
// <embed src="images/SingletonMerge_SameRootDiffPar.svg"
// type="image/svg+xml"/></p>
//
// <p>Different stack tops pointing to same parent. Make array node for the
// root where both element in the root point to the same (original)
// parent.<br>
// <embed src="images/SingletonMerge_DiffRootSamePar.svg"
// type="image/svg+xml"/></p>
//
// <p>Different stack tops pointing to different parents. Make array node for
// the root where each element points to the corresponding original
// parent.<br>
// <embed src="images/SingletonMerge_DiffRootDiffPar.svg"
// type="image/svg+xml"/></p>
//
// @param a the first {@link SingletonPredictionContext}
// @param b the second {@link SingletonPredictionContext}
// @param rootIsWildcard {@code true} if this is a local-context merge,
// otherwise false to indicate a full-context merge
// @param mergeCache
// /
function mergeSingletons(a, b, rootIsWildcard, mergeCache) {
    if (mergeCache !== null) {
        var previous = mergeCache.get(a, b);
        if (previous !== null) {
            return previous;
        }
        previous = mergeCache.get(b, a);
        if (previous !== null) {
            return previous;
        }
    }

    var rootMerge = mergeRoot(a, b, rootIsWildcard);
    if (rootMerge !== null) {
        if (mergeCache !== null) {
            mergeCache.set(a, b, rootMerge);
        }
        return rootMerge;
    }
    if (a.returnState === b.returnState) {
        var parent = merge(a.parentCtx, b.parentCtx, rootIsWildcard, mergeCache);
        // if parent is same as existing a or b parent or reduced to a parent,
        // return it
        if (parent === a.parentCtx) {
            return a; // ax + bx = ax, if a=b
        }
        if (parent === b.parentCtx) {
            return b; // ax + bx = bx, if a=b
        }
        // else: ax + ay = a'[x,y]
        // merge parents x and y, giving array node with x,y then remainders
        // of those graphs. dup a, a' points at merged array
        // new joined parent so create new singleton pointing to it, a'
        var spc = SingletonPredictionContext.create(parent, a.returnState);
        if (mergeCache !== null) {
            mergeCache.set(a, b, spc);
        }
        return spc;
    } else { // a != b payloads differ
        // see if we can collapse parents due to $+x parents if local ctx
        var singleParent = null;
        if (a === b || (a.parentCtx !== null && a.parentCtx === b.parentCtx)) { // ax +
            // bx =
            // [a,b]x
            singleParent = a.parentCtx;
        }
        if (singleParent !== null) { // parents are same
            // sort payloads and use same parent
            var payloads = [a.returnState, b.returnState];
            if (a.returnState > b.returnState) {
                payloads[0] = b.returnState;
                payloads[1] = a.returnState;
            }
            var parents = [singleParent, singleParent];
            var apc = new ArrayPredictionContext(parents, payloads);
            if (mergeCache !== null) {
                mergeCache.set(a, b, apc);
            }
            return apc;
        }
        // parents differ and can't merge them. Just pack together
        // into array; can't merge.
        // ax + by = [ax,by]
        var payloads = [a.returnState, b.returnState];
        var parents = [a.parentCtx, b.parentCtx];
        if (a.returnState > b.returnState) { // sort by payload
            payloads[0] = b.returnState;
            payloads[1] = a.returnState;
            parents = [b.parentCtx, a.parentCtx];
        }
        var a_ = new ArrayPredictionContext(parents, payloads);
        if (mergeCache !== null) {
            mergeCache.set(a, b, a_);
        }
        return a_;
    }
}

//
// Handle case where at least one of {@code a} or {@code b} is
// {@link //EMPTY}. In the following diagrams, the symbol {@code $} is used
// to represent {@link //EMPTY}.
//
// <h2>Local-Context Merges</h2>
//
// <p>These local-context merge operations are used when {@code rootIsWildcard}
// is true.</p>
//
// <p>{@link //EMPTY} is superset of any graph; return {@link //EMPTY}.<br>
// <embed src="images/LocalMerge_EmptyRoot.svg" type="image/svg+xml"/></p>
//
// <p>{@link //EMPTY} and anything is {@code //EMPTY}, so merged parent is
// {@code //EMPTY}; return left graph.<br>
// <embed src="images/LocalMerge_EmptyParent.svg" type="image/svg+xml"/></p>
//
// <p>Special case of last merge if local context.<br>
// <embed src="images/LocalMerge_DiffRoots.svg" type="image/svg+xml"/></p>
//
// <h2>Full-Context Merges</h2>
//
// <p>These full-context merge operations are used when {@code rootIsWildcard}
// is false.</p>
//
// <p><embed src="images/FullMerge_EmptyRoots.svg" type="image/svg+xml"/></p>
//
// <p>Must keep all contexts; {@link //EMPTY} in array is a special value (and
// null parent).<br>
// <embed src="images/FullMerge_EmptyRoot.svg" type="image/svg+xml"/></p>
//
// <p><embed src="images/FullMerge_SameRoot.svg" type="image/svg+xml"/></p>
//
// @param a the first {@link SingletonPredictionContext}
// @param b the second {@link SingletonPredictionContext}
// @param rootIsWildcard {@code true} if this is a local-context merge,
// otherwise false to indicate a full-context merge
// /
function mergeRoot(a, b, rootIsWildcard): PredictionContext {
    if (rootIsWildcard) {
        if (a === PredictionContext.EMPTY) {
            return PredictionContext.EMPTY; // // + b =//
        }
        if (b === PredictionContext.EMPTY) {
            return PredictionContext.EMPTY; // a +// =//
        }
    } else {
        if (a === PredictionContext.EMPTY && b === PredictionContext.EMPTY) {
            return PredictionContext.EMPTY; // $ + $ = $
        } else if (a === PredictionContext.EMPTY) { // $ + x = [$,x]
            var payloads = [b.returnState,
                PredictionContext.EMPTY_RETURN_STATE];
            var parents = [b.parentCtx, null];
            return new ArrayPredictionContext(parents, payloads);
        } else if (b === PredictionContext.EMPTY) { // x + $ = [$,x] ($ is always first if present)
            var payloads = [a.returnState, PredictionContext.EMPTY_RETURN_STATE];
            var parents = [a.parentCtx, null];
            return new ArrayPredictionContext(parents, payloads);
        }
    }
    return null;
}

//
// Merge two {@link ArrayPredictionContext} instances.
//
// <p>Different tops, different parents.<br>
// <embed src="images/ArrayMerge_DiffTopDiffPar.svg" type="image/svg+xml"/></p>
//
// <p>Shared top, same parents.<br>
// <embed src="images/ArrayMerge_ShareTopSamePar.svg" type="image/svg+xml"/></p>
//
// <p>Shared top, different parents.<br>
// <embed src="images/ArrayMerge_ShareTopDiffPar.svg" type="image/svg+xml"/></p>
//
// <p>Shared top, all shared parents.<br>
// <embed src="images/ArrayMerge_ShareTopSharePar.svg"
// type="image/svg+xml"/></p>
//
// <p>Equal tops, merge parents and reduce top to
// {@link SingletonPredictionContext}.<br>
// <embed src="images/ArrayMerge_EqualTop.svg" type="image/svg+xml"/></p>
// /
function mergeArrays(a, b, rootIsWildcard, mergeCache) {
    if (mergeCache !== null) {
        var previous = mergeCache.get(a, b);
        if (previous !== null) {
            return previous;
        }
        previous = mergeCache.get(b, a);
        if (previous !== null) {
            return previous;
        }
    }
    // merge sorted payloads a + b => M
    var i = 0; // walks a
    var j = 0; // walks b
    var k = 0; // walks target M array

    var mergedReturnStates = [];
    var mergedParents = [];
    // walk and merge to yield mergedParents, mergedReturnStates
    while (i < a.returnStates.length && j < b.returnStates.length) {
        var a_parent = a.parents[i];
        var b_parent = b.parents[j];
        if (a.returnStates[i] === b.returnStates[j]) {
            // same payload (stack tops are equal), must yield merged singleton
            var payload = a.returnStates[i];
            // $+$ = $
            var bothDollars = payload === PredictionContext.EMPTY_RETURN_STATE &&
                a_parent === null && b_parent === null;
            var ax_ax = (a_parent !== null && b_parent !== null && a_parent === b_parent); // ax+ax
            // ->
            // ax
            if (bothDollars || ax_ax) {
                mergedParents[k] = a_parent; // choose left
                mergedReturnStates[k] = payload;
            } else { // ax+ay -> a'[x,y]
                var mergedParent = merge(a_parent, b_parent, rootIsWildcard, mergeCache);
                mergedParents[k] = mergedParent;
                mergedReturnStates[k] = payload;
            }
            i += 1; // hop over left one as usual
            j += 1; // but also skip one in right side since we merge
        } else if (a.returnStates[i] < b.returnStates[j]) { // copy a[i] to M
            mergedParents[k] = a_parent;
            mergedReturnStates[k] = a.returnStates[i];
            i += 1;
        } else { // b > a, copy b[j] to M
            mergedParents[k] = b_parent;
            mergedReturnStates[k] = b.returnStates[j];
            j += 1;
        }
        k += 1;
    }
    // copy over any payloads remaining in either array
    if (i < a.returnStates.length) {
        for (var p = i; p < a.returnStates.length; p++) {
            mergedParents[k] = a.parents[p];
            mergedReturnStates[k] = a.returnStates[p];
            k += 1;
        }
    } else {
        for (var p = j; p < b.returnStates.length; p++) {
            mergedParents[k] = b.parents[p];
            mergedReturnStates[k] = b.returnStates[p];
            k += 1;
        }
    }
    // trim merged if we combined a few that had same stack tops
    if (k < mergedParents.length) { // write index < last position; trim
        if (k === 1) { // for just one merged element, return singleton top
            var a_ = SingletonPredictionContext.create(mergedParents[0],
                mergedReturnStates[0]);
            if (mergeCache !== null) {
                mergeCache.set(a, b, a_);
            }
            return a_;
        }
        mergedParents = mergedParents.slice(0, k);
        mergedReturnStates = mergedReturnStates.slice(0, k);
    }

    var M = new ArrayPredictionContext(mergedParents, mergedReturnStates);

    // if we created same array as a or b, return that instead
    // TODO: track whether this is possible above during merge sort for speed
    if (M === a) {
        if (mergeCache !== null) {
            mergeCache.set(a, b, a);
        }
        return a;
    }
    if (M === b) {
        if (mergeCache !== null) {
            mergeCache.set(a, b, b);
        }
        return b;
    }
    combineCommonParents(mergedParents);

    if (mergeCache !== null) {
        mergeCache.set(a, b, M);
    }
    return M;
}

//
// Make pass over all <em>M</em> {@code parents}; merge any {@code equals()}
// ones.
// /
function combineCommonParents(parents) {
    var uniqueParents = {};

    for (var p = 0; p < parents.length; p++) {
        var parent = parents[p];
        if (!(parent in uniqueParents)) {
            uniqueParents[parent] = parent;
        }
    }
    for (var q = 0; q < parents.length; q++) {
        parents[q] = uniqueParents[parents[q]];
    }
}


// ter's recursive version of Sam's getAllNodes()
function getAllContextNodes(context, nodes, visited) {
    if (nodes === null) {
        nodes = [];
        return getAllContextNodes(context, nodes, visited);
    } else if (visited === null) {
        visited = {};
        return getAllContextNodes(context, nodes, visited);
    } else {
        if (context === null || visited[context] !== null) {
            return nodes;
        }
        visited[context] = context;
        nodes.push(context);
        for (var i = 0; i < context.length; i++) {
            getAllContextNodes(context.getParent(i), nodes, visited);
        }
        return nodes;
    }
}

