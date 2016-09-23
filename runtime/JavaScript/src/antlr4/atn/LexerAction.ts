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

import { Lexer } from '../Lexer';

export class LexerActionType {
    constructor() {
    }

    static CHANNEL = 0;     //The type of a {@link LexerChannelAction} action.
    static CUSTOM = 1;      //The type of a {@link LexerCustomAction} action.
    static MODE = 2;        //The type of a {@link LexerModeAction} action.
    static MORE = 3;        //The type of a {@link LexerMoreAction} action.
    static POP_MODE = 4;    //The type of a {@link LexerPopModeAction} action.
    static PUSH_MODE = 5;   //The type of a {@link LexerPushModeAction} action.
    static SKIP = 6;        //The type of a {@link LexerSkipAction} action.
    static TYPE = 7;        //The type of a {@link LexerTypeAction} action.
}

export abstract class LexerAction {
    constructor(public actionType) {
    }

    abstract execute(lexer: Lexer);

    isPositionDependent = false;

    hashString() {
        return "" + this.actionType;
    };

    equals(other) {
        return this === other;
    };

}


//
// Implements the {@code skip} lexer action by calling {@link Lexer//skip}.
//
// <p>The {@code skip} command does not have any parameters, so this action is
// implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
export class LexerSkipAction extends LexerAction {
    constructor() {
        super(LexerActionType.SKIP);
    }

    // Provides a singleton instance of this parameterless lexer action.
    static INSTANCE = new LexerSkipAction();

    execute(lexer) {
        lexer.skip();
    };

    toString() {
        return "skip";
    };
}

//  Implements the {@code type} lexer action by calling {@link Lexer//setType}
// with the assigned type.
export class LexerTypeAction extends LexerAction {
    constructor(public type) {
        super(LexerActionType.TYPE);
    }

    execute(lexer) {
        lexer.type = this.type;
    };

    hashString() {
        return "" + this.actionType + this.type;
    };


    equals(other) {
        if(this === other) {
            return true;
        } else if (! (other instanceof LexerTypeAction)) {
            return false;
        } else {
            return this.type === other.type;
        }
    };

    toString() {
        return "type(" + this.type + ")";
    };
}

// Implements the {@code pushMode} lexer action by calling
// {@link Lexer//pushMode} with the assigned mode.
export class LexerPushModeAction extends LexerAction {
    constructor(public mode) {
        super(LexerActionType.PUSH_MODE);
    }

    // <p>This action is implemented by calling {@link Lexer//pushMode} with the
    // value provided by {@link //getMode}.</p>
    execute(lexer) {
        lexer.pushMode(this.mode);
    };

    hashString() {
        return "" + this.actionType + this.mode;
    };

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerPushModeAction)) {
            return false;
        } else {
            return this.mode === other.mode;
        }
    };

    toString() {
        return "pushMode(" + this.mode + ")";
    };
}

// Implements the {@code popMode} lexer action by calling {@link Lexer//popMode}.
//
// <p>The {@code popMode} command does not have any parameters, so this action is
// implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
export class LexerPopModeAction extends LexerAction {
    constructor() {
        super(LexerActionType.POP_MODE);
    }

    static INSTANCE = new LexerPopModeAction();

    // <p>This action is implemented by calling {@link Lexer//popMode}.</p>
    execute(lexer) {
        lexer.popMode();
    };

    toString() {
        return "popMode";
    };
}

// Implements the {@code more} lexer action by calling {@link Lexer//more}.
//
// <p>The {@code more} command does not have any parameters, so this action is
// implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
export class LexerMoreAction extends LexerAction {
    constructor() {
        super(LexerActionType.MORE);
    }

    static INSTANCE = new LexerMoreAction();

    // <p>This action is implemented by calling {@link Lexer//popMode}.</p>
    execute(lexer) {
        lexer.more();
    };

    toString() {
        return "more";
    };
}

// Implements the {@code mode} lexer action by calling {@link Lexer//mode} with
// the assigned mode.
export class LexerModeAction extends LexerAction {
    constructor(public mode) {
        super(LexerActionType.MODE);
    }

    // <p>This action is implemented by calling {@link Lexer//mode} with the
    // value provided by {@link //getMode}.</p>
    execute(lexer) {
        lexer.mode(this.mode);
    };

    hashString() {
        return "" + this.actionType + this.mode;
    };

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerModeAction)) {
            return false;
        } else {
            return this.mode === other.mode;
        }
    };

    toString() {
        return "mode(" + this.mode + ")";
    };
}
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

export class LexerCustomAction extends LexerAction {
    isPositionDependent = true;
    constructor(public ruleIndex, public actionIndex) {
        super(LexerActionType.CUSTOM);
    }

    // <p>Custom actions are implemented by calling {@link Lexer//action} with the
    // appropriate rule and action indexes.</p>
    execute(lexer) {
        lexer.action(null, this.ruleIndex, this.actionIndex);
    };

    hashString() {
        return "" + this.actionType + this.ruleIndex + this.actionIndex;
    };

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerCustomAction)) {
            return false;
        } else {
            return this.ruleIndex === other.ruleIndex && this.actionIndex === other.actionIndex;
        }
    };
}

// Implements the {@code channel} lexer action by calling
// {@link Lexer//setChannel} with the assigned channel.
// Constructs a new {@code channel} action with the specified channel value.
// @param channel The channel value to pass to {@link Lexer//setChannel}.
export class LexerChannelAction extends LexerAction {
    constructor(public channel: number) {
        super(LexerActionType.CHANNEL);
    }

    // <p>This action is implemented by calling {@link Lexer//setChannel} with the
    // value provided by {@link //getChannel}.</p>
    execute(lexer) {
        lexer._channel = this.channel;
    };

    hashString() {
        return "" + this.actionType + this.channel;
    };

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerChannelAction)) {
            return false;
        } else {
            return this.channel === other.channel;
        }
    };

    toString() {
        return "channel(" + this.channel + ")";
    };
}

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
export class LexerIndexedCustomAction extends LexerAction {
    isPositionDependent = true;
    constructor(public offset, public action) {
        super(action.actionType);
    }

    // <p>This method calls {@link //execute} on the result of {@link //getAction}
    // using the provided {@code lexer}.</p>
    execute(lexer) {
        // assume the input stream position was properly set by the calling code
        this.action.execute(lexer);
    };

    hashString() {
        return "" + this.actionType + this.offset + this.action;
    };

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerIndexedCustomAction)) {
            return false;
        } else {
            return this.offset === other.offset && this.action === other.action;
        }
    };
}
