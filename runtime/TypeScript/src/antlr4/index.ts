import {Interval} from './IntervalSet'
import * as Utils from "./Utils";

export {Interval} from './IntervalSet'

export interface IntStream {
    consume(): void;                   // Consumes the current symbol in the stream
    getSourceName(): string;           // Gets the name of the underlying symbol source
    index(): number;                   // Returns the index into the stream of input symbol referenced to by LA(1)
    LA(i: number): number;             // Look Ahead symbol value at offset i
    mark(): number;                    // Ensure seek() operations will be valid...
    release(marker: number): void;     // Release marked range created by mark()
    seek(index: number);
}

export interface CharStream extends IntStream {
    getText(interval: Interval): string;

}

export {Recognizer} from './Recognizer'
export * from "./tree/index";
export * from "./error/index";
export {Token, CommonToken} from "./Token";
export {InputStream} from "./InputStream";
export * from "./Lexer";
export * from "./Parser";
export { PredictionContext } from "./PredictionContext";
export * from "./ParserRuleContext";
export * from "./IntervalSet";
