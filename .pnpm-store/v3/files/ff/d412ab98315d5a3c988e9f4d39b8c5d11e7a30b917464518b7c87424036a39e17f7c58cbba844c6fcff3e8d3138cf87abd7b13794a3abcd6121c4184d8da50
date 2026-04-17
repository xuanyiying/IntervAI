import * as React from "react";
import type { ReactElement, RefObject } from "react";
import type { Change } from "diff";
import { type Block } from "./compute-hidden-blocks.js";
import { type DiffInformation, DiffMethod, DiffType, type LineInformation } from "./compute-lines.js";
import { type ReactDiffViewerStyles, type ReactDiffViewerStylesOverride } from "./styles.js";
export declare enum LineNumberPrefix {
    LEFT = "L",
    RIGHT = "R"
}
export interface InfiniteLoadingProps {
    pageSize: number;
    containerHeight: string;
}
export interface ComputedDiffResult {
    lineInformation: LineInformation[];
    lineBlocks: Record<number, number>;
    blocks: Block[];
}
export interface ReactDiffViewerProps {
    oldValue: string | Record<string, unknown>;
    newValue: string | Record<string, unknown>;
    splitView?: boolean;
    linesOffset?: number;
    disableWordDiff?: boolean;
    compareMethod?: DiffMethod | ((oldStr: string, newStr: string) => Change[]);
    extraLinesSurroundingDiff?: number;
    hideLineNumbers?: boolean;
    /**
     * Show the lines indicated here. Specified as L20 or R18 for respectively line 20 on the left or line 18 on the right.
     */
    alwaysShowLines?: string[];
    showDiffOnly?: boolean;
    renderContent?: (source: string) => ReactElement;
    codeFoldMessageRenderer?: (totalFoldedLines: number, leftStartLineNumber: number, rightStartLineNumber: number) => ReactElement;
    onLineNumberClick?: (lineId: string, event: React.MouseEvent<HTMLTableCellElement>) => void;
    renderGutter?: (data: {
        lineNumber: number;
        type: DiffType;
        prefix: LineNumberPrefix;
        value: string | DiffInformation[];
        additionalLineNumber: number;
        additionalPrefix: LineNumberPrefix;
        styles: ReactDiffViewerStyles;
    }) => ReactElement;
    highlightLines?: string[];
    styles?: ReactDiffViewerStylesOverride;
    useDarkTheme?: boolean;
    /**
     * Used to describe the thing being diffed
     */
    summary?: string | ReactElement;
    leftTitle?: string | ReactElement;
    rightTitle?: string | ReactElement;
    nonce?: string;
    /**
     * to enable infiniteLoading for better performance
     */
    infiniteLoading?: InfiniteLoadingProps;
    /**
     * to display loading element when diff is being computed
     */
    loadingElement?: () => ReactElement;
    /**
     * Hide the summary bar (expand/collapse button, change count, filename)
     */
    hideSummary?: boolean;
    /**
     * Show debug overlay with virtualization info (for development)
     */
    showDebugInfo?: boolean;
}
export interface ReactDiffViewerState {
    expandedBlocks?: number[];
    noSelect?: "left" | "right";
    scrollableContainerRef: RefObject<HTMLDivElement>;
    computedDiffResult: Record<string, ComputedDiffResult>;
    isLoading: boolean;
    visibleStartRow: number;
    contentColumnWidth: number | null;
    charWidth: number | null;
    cumulativeOffsets: number[] | null;
}
declare class DiffViewer extends React.Component<ReactDiffViewerProps, ReactDiffViewerState> {
    private styles;
    private wordDiffCache;
    private contentColumnRef;
    private charMeasureRef;
    private stickyHeaderRef;
    private resizeObserver;
    static defaultProps: ReactDiffViewerProps;
    constructor(props: ReactDiffViewerProps);
    /**
     * Computes word diff on-demand for a line, with caching.
     * This is used when word diff was deferred during initial computation.
     */
    private getWordDiffValues;
    /**
     * Resets code block expand to the initial stage. Will be exposed to the parent component via
     * refs.
     */
    resetCodeBlocks: () => boolean;
    /**
     * Pushes the target expanded code block to the state. During the re-render,
     * this value is used to expand/fold unmodified code.
     */
    private onBlockExpand;
    /**
     * Gets the height of the sticky header, if present.
     */
    private getStickyHeaderHeight;
    /**
     * Measures the width of a single character in the monospace font.
     * Falls back to 7.2px if measurement fails.
     */
    private measureCharWidth;
    /**
     * Measures the available width for content in a content column.
     * Falls back to estimating from container width if direct measurement fails.
     */
    private measureContentColumnWidth;
    /**
     * Gets the text length from a value that may be a string or DiffInformation array.
     */
    private getTextLength;
    /**
     * Builds cumulative vertical offsets for each line based on character count and column width.
     * This allows accurate scroll position calculations with variable row heights.
     */
    private buildCumulativeOffsets;
    /**
     * Binary search to find the line index at a given scroll offset.
     */
    private findLineAtOffset;
    /**
     * Recalculates cumulative offsets based on current measurements.
     * Called on resize and when blocks are expanded/collapsed.
     */
    private recalculateOffsets;
    /**
     * Computes final styles for the diff viewer. It combines the default styles with the user
     * supplied overrides. The computed styles are cached with performance in mind.
     *
     * @param styles User supplied style overrides.
     */
    private computeStyles;
    /**
     * Returns a function with clicked line number in the closure. Returns an no-op function when no
     * onLineNumberClick handler is supplied.
     *
     * @param id Line id of a line.
     */
    private onLineNumberClickProxy;
    /**
     * Checks if the current compare method should show word-level highlighting.
     * Character, word-level, JSON, and YAML diffs benefit from highlighting individual changes.
     * JSON/YAML use CHARS internally for word-level diff, so they should be highlighted.
     */
    private shouldHighlightWordDiff;
    /**
     * Maps over the word diff and constructs the required React elements to show word diff.
     *
     * @param diffArray Word diff information derived from line information.
     * @param renderer Optional renderer to format diff words. Useful for syntax highlighting.
     */
    private renderWordDiff;
    /**
     * Maps over the line diff and constructs the required react elements to show line diff. It calls
     * renderWordDiff when encountering word diff. This takes care of both inline and split view line
     * renders.
     *
     * @param lineNumber Line number of the current line.
     * @param type Type of diff of the current line.
     * @param prefix Unique id to prefix with the line numbers.
     * @param value Content of the line. It can be a string or a word diff array.
     * @param additionalLineNumber Additional line number to be shown. Useful for rendering inline
     *  diff view. Right line number will be passed as additionalLineNumber.
     * @param additionalPrefix Similar to prefix but for additional line number.
     */
    private renderLine;
    /**
     * Generates lines for split view.
     *
     * @param obj Line diff information.
     * @param obj.left Life diff information for the left pane of the split view.
     * @param obj.right Life diff information for the right pane of the split view.
     * @param index React key for the lines.
     */
    private renderSplitView;
    /**
     * Generates lines for inline view.
     *
     * @param obj Line diff information.
     * @param obj.left Life diff information for the added section of the inline view.
     * @param obj.right Life diff information for the removed section of the inline view.
     * @param index React key for the lines.
     */
    renderInlineView: ({ left, right }: LineInformation, index: number) => ReactElement;
    /**
     * Returns a function with clicked block number in the closure.
     *
     * @param id Cold fold block id.
     */
    private onBlockClickProxy;
    /**
     * Generates cold fold block. It also uses the custom message renderer when available to show
     * cold fold messages.
     *
     * @param num Number of skipped lines between two blocks.
     * @param blockNumber Code fold block id.
     * @param leftBlockLineNumber First left line number after the current code fold block.
     * @param rightBlockLineNumber First right line number after the current code fold block.
     */
    private renderSkippedLineIndicator;
    /**
     *
     * Generates a unique cache key based on the current props used in diff computation.
     *
     * This key is used to memoize results and avoid recomputation for the same inputs.
     * @returns A stringified JSON key representing the current diff settings and input values.
     *
     */
    private getMemoisedKey;
    /**
     * Computes and memoizes the diff result between `oldValue` and `newValue`.
     *
     * If a memoized result exists for the current input configuration, it uses that.
     * Otherwise, it runs the diff logic in a Web Worker to avoid blocking the UI.
     * It also computes hidden line blocks for collapsing unchanged sections,
     * and stores the result in the local component state.
     */
    private memoisedCompute;
    private static readonly ESTIMATED_ROW_HEIGHT;
    /**
     * Handles scroll events on the scrollable container.
     *
     * Updates the visible start row for virtualization.
     */
    private onScroll;
    /**
     * Generates the entire diff view with virtualization support.
     */
    private renderDiff;
    componentDidUpdate(prevProps: ReactDiffViewerProps): void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render: () => ReactElement;
}
export default DiffViewer;
export { DiffMethod };
export { default as computeStyles } from "./styles.js";
export type { ReactDiffViewerStylesOverride, ReactDiffViewerStyles };
