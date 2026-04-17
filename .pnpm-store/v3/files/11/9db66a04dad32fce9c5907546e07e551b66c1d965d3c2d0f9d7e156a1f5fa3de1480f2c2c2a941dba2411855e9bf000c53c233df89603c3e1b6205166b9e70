import * as diff from "diff";
export declare enum DiffType {
    DEFAULT = 0,
    ADDED = 1,
    REMOVED = 2,
    CHANGED = 3
}
export declare enum DiffMethod {
    CHARS = "diffChars",
    WORDS = "diffWords",
    WORDS_WITH_SPACE = "diffWordsWithSpace",
    LINES = "diffLines",
    TRIMMED_LINES = "diffTrimmedLines",
    SENTENCES = "diffSentences",
    CSS = "diffCss",
    JSON = "diffJson",
    YAML = "diffYaml"
}
export interface DiffInformation {
    value?: string | DiffInformation[];
    lineNumber?: number;
    type?: DiffType;
    rawValue?: string;
}
export interface LineInformation {
    left?: DiffInformation;
    right?: DiffInformation;
}
export interface ComputedLineInformation {
    lineInformation: LineInformation[];
    diffLines: number[];
}
export interface ComputedDiffInformation {
    left?: DiffInformation[];
    right?: DiffInformation[];
}
export interface JsDiffChangeObject {
    added?: boolean;
    removed?: boolean;
    value?: string;
}
/**
 * Computes word diff information in the line.
 * [TODO]: Consider adding options argument for JsDiff text block comparison
 *
 * @param oldValue Old word in the line.
 * @param newValue New word in the line.
 * @param compareMethod JsDiff text diff method from https://github.com/kpdecker/jsdiff/tree/v4.0.1#api
 */
declare const computeDiff: (oldValue: string | Record<string, unknown>, newValue: string | Record<string, unknown>, compareMethod?: DiffMethod | ((oldStr: string, newStr: string) => diff.Change[])) => ComputedDiffInformation;
/**
 * [TODO]: Think about moving common left and right value assignment to a
 * common place. Better readability?
 *
 * Computes line wise information based in the js diff information passed. Each
 * line contains information about left and right section. Left side denotes
 * deletion and right side denotes addition.
 *
 * @param oldString Old string to compare.
 * @param newString New string to compare with old string.
 * @param disableWordDiff Flag to enable/disable word diff.
 * @param lineCompareMethod JsDiff text diff method from https://github.com/kpdecker/jsdiff/tree/v4.0.1#api
 * @param linesOffset line number to start counting from
 * @param showLines lines that are always shown, regardless of diff
 */
declare const computeLineInformation: (oldString: string | Record<string, unknown>, newString: string | Record<string, unknown>, disableWordDiff?: boolean, lineCompareMethod?: DiffMethod | ((oldStr: string, newStr: string) => diff.Change[]), linesOffset?: number, showLines?: string[], deferWordDiff?: boolean) => ComputedLineInformation;
declare const computeLineInformationWorker: (oldString: string | Record<string, unknown>, newString: string | Record<string, unknown>, disableWordDiff?: boolean, lineCompareMethod?: DiffMethod | ((oldStr: string, newStr: string) => diff.Change[]), linesOffset?: number, showLines?: string[], deferWordDiff?: boolean) => Promise<ComputedLineInformation>;
export { computeLineInformation, computeLineInformationWorker, computeDiff };
