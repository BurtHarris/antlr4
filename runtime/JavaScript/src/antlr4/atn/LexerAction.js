//
//[The "BSD license"]
// Copyright (c) 2013 Terence Parr
// Copyright (c) 2013 Sam Harwell
// Copyright (c) 2014 Eric Vergnaud
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//
// 1. Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
// 3. The name of the author may not be used to endorse or promote products
//    derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
// OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
// IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
// NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var LexerActionType = (function () {
    function LexerActionType() {
    }
    LexerActionType.CHANNEL = 0; //The type of a {@link LexerChannelAction} action.
    LexerActionType.CUSTOM = 1; //The type of a {@link LexerCustomAction} action.
    LexerActionType.MODE = 2; //The type of a {@link LexerModeAction} action.
    LexerActionType.MORE = 3; //The type of a {@link LexerMoreAction} action.
    LexerActionType.POP_MODE = 4; //The type of a {@link LexerPopModeAction} action.
    LexerActionType.PUSH_MODE = 5; //The type of a {@link LexerPushModeAction} action.
    LexerActionType.SKIP = 6; //The type of a {@link LexerSkipAction} action.
    LexerActionType.TYPE = 7; //The type of a {@link LexerTypeAction} action.
    return LexerActionType;
}());
exports.LexerActionType = LexerActionType;
var LexerAction = (function () {
    function LexerAction(actionType) {
        this.actionType = actionType;
        this.isPositionDependent = false;
    }
    LexerAction.prototype.hashString = function () {
        return "" + this.actionType;
    };
    ;
    LexerAction.prototype.equals = function (other) {
        return this === other;
    };
    ;
    return LexerAction;
}());
exports.LexerAction = LexerAction;
//
// Implements the {@code skip} lexer action by calling {@link Lexer//skip}.
//
// <p>The {@code skip} command does not have any parameters, so this action is
// implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
var LexerSkipAction = (function (_super) {
    __extends(LexerSkipAction, _super);
    function LexerSkipAction() {
        _super.call(this, LexerActionType.SKIP);
    }
    LexerSkipAction.prototype.execute = function (lexer) {
        lexer.skip();
    };
    ;
    LexerSkipAction.prototype.toString = function () {
        return "skip";
    };
    ;
    // Provides a singleton instance of this parameterless lexer action.
    LexerSkipAction.INSTANCE = new LexerSkipAction();
    return LexerSkipAction;
}(LexerAction));
exports.LexerSkipAction = LexerSkipAction;
//  Implements the {@code type} lexer action by calling {@link Lexer//setType}
// with the assigned type.
var LexerTypeAction = (function (_super) {
    __extends(LexerTypeAction, _super);
    function LexerTypeAction(type) {
        _super.call(this, LexerActionType.TYPE);
        this.type = type;
    }
    LexerTypeAction.prototype.execute = function (lexer) {
        lexer.type = this.type;
    };
    ;
    LexerTypeAction.prototype.hashString = function () {
        return "" + this.actionType + this.type;
    };
    ;
    LexerTypeAction.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof LexerTypeAction)) {
            return false;
        }
        else {
            return this.type === other.type;
        }
    };
    ;
    LexerTypeAction.prototype.toString = function () {
        return "type(" + this.type + ")";
    };
    ;
    return LexerTypeAction;
}(LexerAction));
exports.LexerTypeAction = LexerTypeAction;
// Implements the {@code pushMode} lexer action by calling
// {@link Lexer//pushMode} with the assigned mode.
var LexerPushModeAction = (function (_super) {
    __extends(LexerPushModeAction, _super);
    function LexerPushModeAction(mode) {
        _super.call(this, LexerActionType.PUSH_MODE);
        this.mode = mode;
    }
    // <p>This action is implemented by calling {@link Lexer//pushMode} with the
    // value provided by {@link //getMode}.</p>
    LexerPushModeAction.prototype.execute = function (lexer) {
        lexer.pushMode(this.mode);
    };
    ;
    LexerPushModeAction.prototype.hashString = function () {
        return "" + this.actionType + this.mode;
    };
    ;
    LexerPushModeAction.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof LexerPushModeAction)) {
            return false;
        }
        else {
            return this.mode === other.mode;
        }
    };
    ;
    LexerPushModeAction.prototype.toString = function () {
        return "pushMode(" + this.mode + ")";
    };
    ;
    return LexerPushModeAction;
}(LexerAction));
exports.LexerPushModeAction = LexerPushModeAction;
// Implements the {@code popMode} lexer action by calling {@link Lexer//popMode}.
//
// <p>The {@code popMode} command does not have any parameters, so this action is
// implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
var LexerPopModeAction = (function (_super) {
    __extends(LexerPopModeAction, _super);
    function LexerPopModeAction() {
        _super.call(this, LexerActionType.POP_MODE);
    }
    // <p>This action is implemented by calling {@link Lexer//popMode}.</p>
    LexerPopModeAction.prototype.execute = function (lexer) {
        lexer.popMode();
    };
    ;
    LexerPopModeAction.prototype.toString = function () {
        return "popMode";
    };
    ;
    LexerPopModeAction.INSTANCE = new LexerPopModeAction();
    return LexerPopModeAction;
}(LexerAction));
exports.LexerPopModeAction = LexerPopModeAction;
// Implements the {@code more} lexer action by calling {@link Lexer//more}.
//
// <p>The {@code more} command does not have any parameters, so this action is
// implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
var LexerMoreAction = (function (_super) {
    __extends(LexerMoreAction, _super);
    function LexerMoreAction() {
        _super.call(this, LexerActionType.MORE);
    }
    // <p>This action is implemented by calling {@link Lexer//popMode}.</p>
    LexerMoreAction.prototype.execute = function (lexer) {
        lexer.more();
    };
    ;
    LexerMoreAction.prototype.toString = function () {
        return "more";
    };
    ;
    LexerMoreAction.INSTANCE = new LexerMoreAction();
    return LexerMoreAction;
}(LexerAction));
exports.LexerMoreAction = LexerMoreAction;
// Implements the {@code mode} lexer action by calling {@link Lexer//mode} with
// the assigned mode.
var LexerModeAction = (function (_super) {
    __extends(LexerModeAction, _super);
    function LexerModeAction(mode) {
        _super.call(this, LexerActionType.MODE);
        this.mode = mode;
    }
    // <p>This action is implemented by calling {@link Lexer//mode} with the
    // value provided by {@link //getMode}.</p>
    LexerModeAction.prototype.execute = function (lexer) {
        lexer.mode(this.mode);
    };
    ;
    LexerModeAction.prototype.hashString = function () {
        return "" + this.actionType + this.mode;
    };
    ;
    LexerModeAction.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof LexerModeAction)) {
            return false;
        }
        else {
            return this.mode === other.mode;
        }
    };
    ;
    LexerModeAction.prototype.toString = function () {
        return "mode(" + this.mode + ")";
    };
    ;
    return LexerModeAction;
}(LexerAction));
exports.LexerModeAction = LexerModeAction;
// Executes a custom lexer action by calling {@link Recognizer//action} with the
// rule and action indexes assigned to the custom action. The implementation of
// a custom action is added to the generated code for the lexer in an override
// of {@link Recognizer//action} when the grammar is compiled.
//
// <p>This class may represent embedded actions created with the <code>{...}</code>
// syntax in ANTLR 4, as well as actions created for lexer commands where the
// command argument could not be evaluated when the grammar was compiled.</p>
// Constructs a custom lexer action with the specified rule and action
// indexes.
//
// @param ruleIndex The rule index to use for calls to
// {@link Recognizer//action}.
// @param actionIndex The action index to use for calls to
// {@link Recognizer//action}.
var LexerCustomAction = (function (_super) {
    __extends(LexerCustomAction, _super);
    function LexerCustomAction(ruleIndex, actionIndex) {
        _super.call(this, LexerActionType.CUSTOM);
        this.ruleIndex = ruleIndex;
        this.actionIndex = actionIndex;
        this.isPositionDependent = true;
    }
    // <p>Custom actions are implemented by calling {@link Lexer//action} with the
    // appropriate rule and action indexes.</p>
    LexerCustomAction.prototype.execute = function (lexer) {
        lexer.action(null, this.ruleIndex, this.actionIndex);
    };
    ;
    LexerCustomAction.prototype.hashString = function () {
        return "" + this.actionType + this.ruleIndex + this.actionIndex;
    };
    ;
    LexerCustomAction.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof LexerCustomAction)) {
            return false;
        }
        else {
            return this.ruleIndex === other.ruleIndex && this.actionIndex === other.actionIndex;
        }
    };
    ;
    return LexerCustomAction;
}(LexerAction));
exports.LexerCustomAction = LexerCustomAction;
// Implements the {@code channel} lexer action by calling
// {@link Lexer//setChannel} with the assigned channel.
// Constructs a new {@code channel} action with the specified channel value.
// @param channel The channel value to pass to {@link Lexer//setChannel}.
var LexerChannelAction = (function (_super) {
    __extends(LexerChannelAction, _super);
    function LexerChannelAction(channel) {
        _super.call(this, LexerActionType.CHANNEL);
        this.channel = channel;
    }
    // <p>This action is implemented by calling {@link Lexer//setChannel} with the
    // value provided by {@link //getChannel}.</p>
    LexerChannelAction.prototype.execute = function (lexer) {
        lexer._channel = this.channel;
    };
    ;
    LexerChannelAction.prototype.hashString = function () {
        return "" + this.actionType + this.channel;
    };
    ;
    LexerChannelAction.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof LexerChannelAction)) {
            return false;
        }
        else {
            return this.channel === other.channel;
        }
    };
    ;
    LexerChannelAction.prototype.toString = function () {
        return "channel(" + this.channel + ")";
    };
    ;
    return LexerChannelAction;
}(LexerAction));
exports.LexerChannelAction = LexerChannelAction;
// This implementation of {@link LexerAction} is used for tracking input offsets
// for position-dependent actions within a {@link LexerActionExecutor}.
//
// <p>This action is not serialized as part of the ATN, and is only required for
// position-dependent lexer actions which appear at a location other than the
// end of a rule. For more information about DFA optimizations employed for
// lexer actions, see {@link LexerActionExecutor//append} and
// {@link LexerActionExecutor//fixOffsetBeforeMatch}.</p>
// Constructs a new indexed custom action by associating a character offset
// with a {@link LexerAction}.
//
// <p>Note: This class is only required for lexer actions for which
// {@link LexerAction//isPositionDependent} returns {@code true}.</p>
//
// @param offset The offset into the input {@link CharStream}, relative to
// the token start index, at which the specified lexer action should be
// executed.
// @param action The lexer action to execute at a particular offset in the
// input {@link CharStream}.
var LexerIndexedCustomAction = (function (_super) {
    __extends(LexerIndexedCustomAction, _super);
    function LexerIndexedCustomAction(offset, action) {
        _super.call(this, action.actionType);
        this.offset = offset;
        this.action = action;
        this.isPositionDependent = true;
    }
    // <p>This method calls {@link //execute} on the result of {@link //getAction}
    // using the provided {@code lexer}.</p>
    LexerIndexedCustomAction.prototype.execute = function (lexer) {
        // assume the input stream position was properly set by the calling code
        this.action.execute(lexer);
    };
    ;
    LexerIndexedCustomAction.prototype.hashString = function () {
        return "" + this.actionType + this.offset + this.action;
    };
    ;
    LexerIndexedCustomAction.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof LexerIndexedCustomAction)) {
            return false;
        }
        else {
            return this.offset === other.offset && this.action === other.action;
        }
    };
    ;
    return LexerIndexedCustomAction;
}(LexerAction));
exports.LexerIndexedCustomAction = LexerIndexedCustomAction;
//# sourceMappingURL=LexerAction.js.map