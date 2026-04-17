var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import cn from "classnames";
import * as React from "react";
import memoize from "memoize-one";
import { computeHiddenBlocks } from "./compute-hidden-blocks.js";
import { DiffMethod, DiffType, computeLineInformationWorker, computeDiff, } from "./compute-lines.js";
import { Expand } from "./expand.js";
import computeStyles from "./styles.js";
import { Fold } from "./fold.js";
/**
 * Applies diff styling (ins/del tags) to pre-highlighted HTML by walking through
 * the HTML and wrapping text portions based on character positions in the diff.
 */
function applyDiffToHighlightedHtml(html, diffArray, styles) {
    const ranges = [];
    let pos = 0;
    for (const diff of diffArray) {
        const value = typeof diff.value === "string" ? diff.value : "";
        if (value.length > 0) {
            ranges.push({ start: pos, end: pos + value.length, type: diff.type });
            pos += value.length;
        }
    }
    const segments = [];
    let i = 0;
    while (i < html.length) {
        if (html[i] === "<") {
            const tagEnd = html.indexOf(">", i);
            if (tagEnd === -1) {
                // Malformed HTML, treat rest as text
                segments.push({ type: "text", content: html.slice(i) });
                break;
            }
            segments.push({ type: "tag", content: html.slice(i, tagEnd + 1) });
            i = tagEnd + 1;
        }
        else {
            // Find the next tag or end of string
            let textEnd = html.indexOf("<", i);
            if (textEnd === -1)
                textEnd = html.length;
            segments.push({ type: "text", content: html.slice(i, textEnd) });
            i = textEnd;
        }
    }
    // Helper to decode HTML entities for character counting
    function decodeEntities(text) {
        return text
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, "\u00A0");
    }
    // Helper to get the wrapper tag for a diff type
    function getWrapper(type) {
        if (type === DiffType.ADDED) {
            return {
                open: `<ins class="${styles.wordDiff} ${styles.wordAdded}">`,
                close: "</ins>",
            };
        }
        if (type === DiffType.REMOVED) {
            return {
                open: `<del class="${styles.wordDiff} ${styles.wordRemoved}">`,
                close: "</del>",
            };
        }
        return {
            open: `<span class="${styles.wordDiff}">`,
            close: "</span>",
        };
    }
    // Process segments, tracking text position
    let textPos = 0;
    let result = "";
    for (const segment of segments) {
        if (segment.type === "tag") {
            result += segment.content;
        }
        else {
            // Text segment - we need to split it according to diff ranges
            const text = segment.content;
            const decodedText = decodeEntities(text);
            // Walk through the text, character by character (in decoded form)
            // but output the original encoded form
            let localDecodedPos = 0;
            let localEncodedPos = 0;
            while (localDecodedPos < decodedText.length) {
                const globalPos = textPos + localDecodedPos;
                // Find the range that covers this position
                const range = ranges.find((r) => globalPos >= r.start && globalPos < r.end);
                if (!range) {
                    // No range covers this position (shouldn't happen, but be safe)
                    // Just output the character
                    const char = text[localEncodedPos];
                    result += char;
                    localEncodedPos++;
                    localDecodedPos++;
                    continue;
                }
                // How many decoded characters until the end of this range?
                const charsUntilRangeEnd = range.end - globalPos;
                // How many decoded characters until the end of this text segment?
                const charsUntilTextEnd = decodedText.length - localDecodedPos;
                // Take the minimum
                const charsToTake = Math.min(charsUntilRangeEnd, charsUntilTextEnd);
                // Now we need to find the corresponding encoded substring
                // Walk through encoded text, counting decoded characters
                let encodedChunkEnd = localEncodedPos;
                let decodedCount = 0;
                while (decodedCount < charsToTake && encodedChunkEnd < text.length) {
                    if (text[encodedChunkEnd] === "&") {
                        // Find entity end
                        const entityEnd = text.indexOf(";", encodedChunkEnd);
                        if (entityEnd !== -1 && entityEnd - encodedChunkEnd < 10) {
                            encodedChunkEnd = entityEnd + 1;
                        }
                        else {
                            encodedChunkEnd++;
                        }
                    }
                    else {
                        encodedChunkEnd++;
                    }
                    decodedCount++;
                }
                const chunk = text.slice(localEncodedPos, encodedChunkEnd);
                const wrapper = getWrapper(range.type);
                if (wrapper) {
                    result += wrapper.open + chunk + wrapper.close;
                }
                else {
                    result += chunk;
                }
                localEncodedPos = encodedChunkEnd;
                localDecodedPos += charsToTake;
            }
            textPos += decodedText.length;
        }
    }
    return result;
}
export var LineNumberPrefix;
(function (LineNumberPrefix) {
    LineNumberPrefix["LEFT"] = "L";
    LineNumberPrefix["RIGHT"] = "R";
})(LineNumberPrefix || (LineNumberPrefix = {}));
class DiffViewer extends React.Component {
    constructor(props) {
        super(props);
        // Cache for on-demand word diff computation
        this.wordDiffCache = new Map();
        // Refs for measuring content column width and character width
        this.contentColumnRef = React.createRef();
        this.charMeasureRef = React.createRef();
        this.stickyHeaderRef = React.createRef();
        this.resizeObserver = null;
        /**
         * Computes word diff on-demand for a line, with caching.
         * This is used when word diff was deferred during initial computation.
         */
        this.getWordDiffValues = (left, right, lineIndex) => {
            // Handle empty left/right
            if (!left || !right) {
                return { leftValue: left === null || left === void 0 ? void 0 : left.value, rightValue: right === null || right === void 0 ? void 0 : right.value };
            }
            // If no raw values, word diff was already computed or disabled
            // Use explicit undefined check since empty string is a valid raw value
            if (left.rawValue === undefined || right.rawValue === undefined) {
                return { leftValue: left.value, rightValue: right.value };
            }
            // Check cache
            const cacheKey = `${lineIndex}-${left.rawValue}-${right.rawValue}`;
            let cached = this.wordDiffCache.get(cacheKey);
            if (!cached) {
                // Compute word diff on-demand
                // Use CHARS method for on-demand computation since rawValue is always a string
                // (JSON/YAML methods only work with objects, not the string lines we have here)
                const compareMethod = (this.props.compareMethod === DiffMethod.JSON || this.props.compareMethod === DiffMethod.YAML)
                    ? DiffMethod.CHARS
                    : this.props.compareMethod;
                const computed = computeDiff(left.rawValue, right.rawValue, compareMethod);
                cached = { left: computed.left, right: computed.right };
                this.wordDiffCache.set(cacheKey, cached);
            }
            return { leftValue: cached.left, rightValue: cached.right };
        };
        /**
         * Resets code block expand to the initial stage. Will be exposed to the parent component via
         * refs.
         */
        this.resetCodeBlocks = () => {
            if (this.state.expandedBlocks.length > 0) {
                this.setState({
                    expandedBlocks: [],
                });
                return true;
            }
            return false;
        };
        /**
         * Pushes the target expanded code block to the state. During the re-render,
         * this value is used to expand/fold unmodified code.
         */
        this.onBlockExpand = (id) => {
            const prevState = this.state.expandedBlocks.slice();
            prevState.push(id);
            this.setState({ expandedBlocks: prevState }, () => this.recalculateOffsets());
        };
        /**
         * Recalculates cumulative offsets based on current measurements.
         * Called on resize and when blocks are expanded/collapsed.
         */
        this.recalculateOffsets = () => {
            var _a;
            if (!this.props.infiniteLoading)
                return;
            const columnWidth = this.measureContentColumnWidth();
            const charWidth = this.measureCharWidth();
            if (!columnWidth)
                return;
            const cacheKey = this.getMemoisedKey();
            const { lineInformation, lineBlocks, blocks } = (_a = this.state.computedDiffResult[cacheKey]) !== null && _a !== void 0 ? _a : {};
            if (!lineInformation)
                return;
            const offsets = this.buildCumulativeOffsets(lineInformation, lineBlocks, blocks, this.state.expandedBlocks, this.props.showDiffOnly, charWidth, columnWidth, this.props.splitView);
            this.setState({ cumulativeOffsets: offsets, contentColumnWidth: columnWidth, charWidth }, () => {
                // Force a scroll position update to recalculate visible rows with new offsets
                this.onScroll();
            });
        };
        /**
         * Computes final styles for the diff viewer. It combines the default styles with the user
         * supplied overrides. The computed styles are cached with performance in mind.
         *
         * @param styles User supplied style overrides.
         */
        this.computeStyles = memoize(computeStyles);
        /**
         * Returns a function with clicked line number in the closure. Returns an no-op function when no
         * onLineNumberClick handler is supplied.
         *
         * @param id Line id of a line.
         */
        this.onLineNumberClickProxy = (id) => {
            if (this.props.onLineNumberClick) {
                return (e) => this.props.onLineNumberClick(id, e);
            }
            return () => { };
        };
        /**
         * Checks if the current compare method should show word-level highlighting.
         * Character, word-level, JSON, and YAML diffs benefit from highlighting individual changes.
         * JSON/YAML use CHARS internally for word-level diff, so they should be highlighted.
         */
        this.shouldHighlightWordDiff = () => {
            const { compareMethod } = this.props;
            return (compareMethod === DiffMethod.CHARS ||
                compareMethod === DiffMethod.WORDS ||
                compareMethod === DiffMethod.WORDS_WITH_SPACE ||
                compareMethod === DiffMethod.JSON ||
                compareMethod === DiffMethod.YAML);
        };
        /**
         * Maps over the word diff and constructs the required React elements to show word diff.
         *
         * @param diffArray Word diff information derived from line information.
         * @param renderer Optional renderer to format diff words. Useful for syntax highlighting.
         */
        this.renderWordDiff = (diffArray, renderer) => {
            var _a, _b;
            const showHighlight = this.shouldHighlightWordDiff();
            // Reconstruct the full line from diff chunks
            const fullLine = diffArray
                .map((d) => (typeof d.value === "string" ? d.value : ""))
                .join("");
            // For very long lines (>500 chars), skip fancy processing - just render plain text
            // without word-level highlighting to avoid performance issues
            const MAX_LINE_LENGTH = 500;
            if (fullLine.length > MAX_LINE_LENGTH) {
                return [_jsx("span", { children: fullLine }, "long-line")];
            }
            // If we have a renderer, try to highlight the full line first,
            // then apply diff styling to preserve proper tokenization.
            if (renderer) {
                // Get the syntax-highlighted content
                const highlighted = renderer(fullLine);
                // Check if the renderer uses dangerouslySetInnerHTML (common with Prism, highlight.js, etc.)
                const htmlContent = (_b = (_a = highlighted === null || highlighted === void 0 ? void 0 : highlighted.props) === null || _a === void 0 ? void 0 : _a.dangerouslySetInnerHTML) === null || _b === void 0 ? void 0 : _b.__html;
                if (typeof htmlContent === "string") {
                    // Apply diff styling to the highlighted HTML
                    const styledHtml = applyDiffToHighlightedHtml(htmlContent, diffArray, {
                        wordDiff: this.styles.wordDiff,
                        wordAdded: showHighlight ? this.styles.wordAdded : "",
                        wordRemoved: showHighlight ? this.styles.wordRemoved : "",
                    });
                    // Clone the element with the modified HTML
                    return [
                        React.cloneElement(highlighted, {
                            key: "highlighted-diff",
                            dangerouslySetInnerHTML: { __html: styledHtml },
                        }),
                    ];
                }
                // Renderer doesn't use dangerouslySetInnerHTML - fall through to per-chunk rendering
            }
            // Fallback: render each chunk separately (used for JSON/YAML or non-HTML renderers)
            return diffArray.map((wordDiff, i) => {
                let content;
                if (typeof wordDiff.value === "string") {
                    content = wordDiff.value;
                }
                else {
                    // If wordDiff.value is DiffInformation[], we don't handle it. See c0c99f5712.
                    content = undefined;
                }
                return wordDiff.type === DiffType.ADDED ? (_jsx("ins", { className: cn(this.styles.wordDiff, {
                        [this.styles.wordAdded]: showHighlight,
                    }), children: content }, i)) : wordDiff.type === DiffType.REMOVED ? (_jsx("del", { className: cn(this.styles.wordDiff, {
                        [this.styles.wordRemoved]: showHighlight,
                    }), children: content }, i)) : (_jsx("span", { className: cn(this.styles.wordDiff), children: content }, i));
            });
        };
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
        this.renderLine = (lineNumber, type, prefix, value, additionalLineNumber, additionalPrefix) => {
            const lineNumberTemplate = `${prefix}-${lineNumber}`;
            const additionalLineNumberTemplate = `${additionalPrefix}-${additionalLineNumber}`;
            const highlightLine = this.props.highlightLines.includes(lineNumberTemplate) ||
                this.props.highlightLines.includes(additionalLineNumberTemplate);
            const added = type === DiffType.ADDED;
            const removed = type === DiffType.REMOVED;
            const changed = type === DiffType.CHANGED;
            let content;
            const hasWordDiff = Array.isArray(value);
            if (hasWordDiff) {
                content = this.renderWordDiff(value, this.props.renderContent);
            }
            else if (this.props.renderContent) {
                content = this.props.renderContent(value);
            }
            else {
                content = value;
            }
            let ElementType = "div";
            if (added && !hasWordDiff) {
                ElementType = "ins";
            }
            else if (removed && !hasWordDiff) {
                ElementType = "del";
            }
            return (_jsxs(_Fragment, { children: [!this.props.hideLineNumbers && (_jsx("td", { onClick: lineNumber && this.onLineNumberClickProxy(lineNumberTemplate), className: cn(this.styles.gutter, {
                            [this.styles.emptyGutter]: !lineNumber,
                            [this.styles.diffAdded]: added,
                            [this.styles.diffRemoved]: removed,
                            [this.styles.diffChanged]: changed,
                            [this.styles.highlightedGutter]: highlightLine,
                        }), children: _jsx("pre", { className: this.styles.lineNumber, children: lineNumber }) })), !this.props.splitView && !this.props.hideLineNumbers && (_jsx("td", { onClick: additionalLineNumber &&
                            this.onLineNumberClickProxy(additionalLineNumberTemplate), className: cn(this.styles.gutter, {
                            [this.styles.emptyGutter]: !additionalLineNumber,
                            [this.styles.diffAdded]: added,
                            [this.styles.diffRemoved]: removed,
                            [this.styles.diffChanged]: changed,
                            [this.styles.highlightedGutter]: highlightLine,
                        }), children: _jsx("pre", { className: this.styles.lineNumber, children: additionalLineNumber }) })), this.props.renderGutter
                        ? this.props.renderGutter({
                            lineNumber,
                            type,
                            prefix,
                            value,
                            additionalLineNumber,
                            additionalPrefix,
                            styles: this.styles,
                        })
                        : null, _jsx("td", { className: cn(this.styles.marker, {
                            [this.styles.emptyLine]: !content,
                            [this.styles.diffAdded]: added,
                            [this.styles.diffRemoved]: removed,
                            [this.styles.diffChanged]: changed,
                            [this.styles.highlightedLine]: highlightLine,
                        }), children: _jsxs("pre", { children: [added && "+", removed && "-"] }) }), _jsx("td", { ref: prefix === LineNumberPrefix.LEFT && !this.state.cumulativeOffsets ? this.contentColumnRef : undefined, className: cn(this.styles.content, {
                            [this.styles.emptyLine]: !content,
                            [this.styles.diffAdded]: added,
                            [this.styles.diffRemoved]: removed,
                            [this.styles.diffChanged]: changed,
                            [this.styles.highlightedLine]: highlightLine,
                            left: prefix === LineNumberPrefix.LEFT,
                            right: prefix === LineNumberPrefix.RIGHT,
                        }), onMouseDown: () => {
                            const elements = document.getElementsByClassName(prefix === LineNumberPrefix.LEFT ? "right" : "left");
                            for (let i = 0; i < elements.length; i++) {
                                const element = elements.item(i);
                                element.classList.add(this.styles.noSelect);
                            }
                        }, title: added && !hasWordDiff
                            ? "Added line"
                            : removed && !hasWordDiff
                                ? "Removed line"
                                : undefined, children: _jsx(ElementType, { className: this.styles.contentText, children: content }) })] }));
        };
        /**
         * Generates lines for split view.
         *
         * @param obj Line diff information.
         * @param obj.left Life diff information for the left pane of the split view.
         * @param obj.right Life diff information for the right pane of the split view.
         * @param index React key for the lines.
         */
        this.renderSplitView = ({ left, right }, index) => {
            // Compute word diff on-demand if deferred
            const { leftValue, rightValue } = this.getWordDiffValues(left, right, index);
            return (_jsxs("tr", { className: this.styles.line, children: [this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, leftValue), this.renderLine(right.lineNumber, right.type, LineNumberPrefix.RIGHT, rightValue)] }, index));
        };
        /**
         * Generates lines for inline view.
         *
         * @param obj Line diff information.
         * @param obj.left Life diff information for the added section of the inline view.
         * @param obj.right Life diff information for the removed section of the inline view.
         * @param index React key for the lines.
         */
        this.renderInlineView = ({ left, right }, index) => {
            // Compute word diff on-demand if deferred
            const { leftValue, rightValue } = this.getWordDiffValues(left, right, index);
            let content;
            if (left.type === DiffType.REMOVED && right.type === DiffType.ADDED) {
                return (_jsxs(React.Fragment, { children: [_jsx("tr", { className: this.styles.line, children: this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, leftValue, null) }), _jsx("tr", { className: this.styles.line, children: this.renderLine(null, right.type, LineNumberPrefix.RIGHT, rightValue, right.lineNumber, LineNumberPrefix.RIGHT) })] }, index));
            }
            if (left.type === DiffType.REMOVED) {
                content = this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, leftValue, null);
            }
            if (left.type === DiffType.DEFAULT) {
                content = this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, leftValue, right.lineNumber, LineNumberPrefix.RIGHT);
            }
            if (right.type === DiffType.ADDED) {
                content = this.renderLine(null, right.type, LineNumberPrefix.RIGHT, rightValue, right.lineNumber);
            }
            return (_jsx("tr", { className: this.styles.line, children: content }, index));
        };
        /**
         * Returns a function with clicked block number in the closure.
         *
         * @param id Cold fold block id.
         */
        this.onBlockClickProxy = (id) => () => this.onBlockExpand(id);
        /**
         * Generates cold fold block. It also uses the custom message renderer when available to show
         * cold fold messages.
         *
         * @param num Number of skipped lines between two blocks.
         * @param blockNumber Code fold block id.
         * @param leftBlockLineNumber First left line number after the current code fold block.
         * @param rightBlockLineNumber First right line number after the current code fold block.
         */
        this.renderSkippedLineIndicator = (num, blockNumber, leftBlockLineNumber, rightBlockLineNumber) => {
            const { hideLineNumbers, splitView } = this.props;
            const message = this.props.codeFoldMessageRenderer ? (this.props.codeFoldMessageRenderer(num, leftBlockLineNumber, rightBlockLineNumber)) : (_jsxs("span", { className: this.styles.codeFoldContent, children: ["@@ -", leftBlockLineNumber - num, ",", num, " +", rightBlockLineNumber - num, ",", num, " @@"] }));
            const content = (_jsx("td", { className: this.styles.codeFoldContentContainer, children: _jsx("button", { type: "button", className: this.styles.codeFoldExpandButton, onClick: this.onBlockClickProxy(blockNumber), tabIndex: 0, children: message }) }));
            const isUnifiedViewWithoutLineNumbers = !splitView && !hideLineNumbers;
            const expandGutter = (_jsx("td", { className: this.styles.codeFoldGutter, children: _jsx(Expand, {}) }));
            return (_jsxs("tr", { className: this.styles.codeFold, onClick: this.onBlockClickProxy(blockNumber), role: "button", tabIndex: 0, children: [!hideLineNumbers && expandGutter, this.props.renderGutter ? (_jsx("td", { className: this.styles.codeFoldGutter })) : null, _jsx("td", { className: cn({
                            [this.styles.codeFoldGutter]: isUnifiedViewWithoutLineNumbers,
                        }) }), isUnifiedViewWithoutLineNumbers ? (_jsxs(React.Fragment, { children: [_jsx("td", {}), content] })) : (_jsxs(React.Fragment, { children: [content, this.props.renderGutter ? _jsx("td", {}) : null, _jsx("td", {}), _jsx("td", {}), !hideLineNumbers ? _jsx("td", {}) : null] }))] }, `${leftBlockLineNumber}-${rightBlockLineNumber}`));
        };
        /**
         *
         * Generates a unique cache key based on the current props used in diff computation.
         *
         * This key is used to memoize results and avoid recomputation for the same inputs.
         * @returns A stringified JSON key representing the current diff settings and input values.
         *
         */
        this.getMemoisedKey = () => {
            const { oldValue, newValue, disableWordDiff, compareMethod, linesOffset, alwaysShowLines, extraLinesSurroundingDiff, } = this.props;
            return JSON.stringify({
                oldValue,
                newValue,
                disableWordDiff,
                compareMethod,
                linesOffset,
                alwaysShowLines,
                extraLinesSurroundingDiff,
            });
        };
        /**
         * Computes and memoizes the diff result between `oldValue` and `newValue`.
         *
         * If a memoized result exists for the current input configuration, it uses that.
         * Otherwise, it runs the diff logic in a Web Worker to avoid blocking the UI.
         * It also computes hidden line blocks for collapsing unchanged sections,
         * and stores the result in the local component state.
         */
        this.memoisedCompute = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { oldValue, newValue, disableWordDiff, compareMethod, linesOffset } = this.props;
            const cacheKey = this.getMemoisedKey();
            if (!!this.state.computedDiffResult[cacheKey]) {
                this.setState((prev) => (Object.assign(Object.assign({}, prev), { isLoading: false })));
                return;
            }
            // Defer word diff computation when using infinite loading with reasonable container height
            // This significantly improves initial render time for large diffs
            const containerHeight = (_a = this.props.infiniteLoading) === null || _a === void 0 ? void 0 : _a.containerHeight;
            const containerHeightPx = containerHeight
                ? typeof containerHeight === 'number'
                    ? containerHeight
                    : parseInt(containerHeight, 10) || 0
                : 0;
            const shouldDeferWordDiff = !disableWordDiff &&
                !!this.props.infiniteLoading &&
                containerHeightPx > 0 &&
                containerHeightPx < 2000;
            const { lineInformation, diffLines } = yield computeLineInformationWorker(oldValue, newValue, disableWordDiff, compareMethod, linesOffset, this.props.alwaysShowLines, shouldDeferWordDiff);
            const extraLines = this.props.extraLinesSurroundingDiff < 0
                ? 0
                : Math.round(this.props.extraLinesSurroundingDiff);
            const { lineBlocks, blocks } = computeHiddenBlocks(lineInformation, diffLines, extraLines);
            this.state.computedDiffResult[cacheKey] = { lineInformation, lineBlocks, blocks };
            this.setState((prev) => (Object.assign(Object.assign({}, prev), { computedDiffResult: this.state.computedDiffResult, isLoading: false })), () => {
                // Trigger offset recalculation after diff is computed and rendered
                // Use requestAnimationFrame to ensure DOM is ready for measurement
                if (this.props.infiniteLoading) {
                    requestAnimationFrame(() => this.recalculateOffsets());
                }
            });
        });
        /**
         * Handles scroll events on the scrollable container.
         *
         * Updates the visible start row for virtualization.
         */
        this.onScroll = () => {
            const container = this.state.scrollableContainerRef.current;
            if (!container || !this.props.infiniteLoading)
                return;
            // Account for sticky header height in scroll calculations
            const headerHeight = this.getStickyHeaderHeight();
            const contentScrollTop = Math.max(0, container.scrollTop - headerHeight);
            const { cumulativeOffsets } = this.state;
            const newStartRow = cumulativeOffsets
                ? this.findLineAtOffset(contentScrollTop, cumulativeOffsets)
                : Math.floor(contentScrollTop / DiffViewer.ESTIMATED_ROW_HEIGHT);
            // Only update state if the start row changed (avoid unnecessary re-renders)
            if (newStartRow !== this.state.visibleStartRow) {
                this.setState({ visibleStartRow: newStartRow });
            }
        };
        /**
         * Generates the entire diff view with virtualization support.
         */
        this.renderDiff = () => {
            var _a, _b, _c, _d, _e, _f;
            const { splitView, infiniteLoading, showDiffOnly } = this.props;
            const { computedDiffResult, expandedBlocks, visibleStartRow, scrollableContainerRef, cumulativeOffsets } = this.state;
            const cacheKey = this.getMemoisedKey();
            const { lineInformation = [], lineBlocks = [], blocks = [] } = (_a = computedDiffResult[cacheKey]) !== null && _a !== void 0 ? _a : {};
            // Calculate visible range for virtualization
            let visibleRowStart = 0;
            let visibleRowEnd = Infinity;
            const buffer = 5; // render extra rows above/below viewport
            if (infiniteLoading && scrollableContainerRef.current) {
                const container = scrollableContainerRef.current;
                // Account for sticky header height in scroll calculations
                const headerHeight = this.getStickyHeaderHeight();
                const contentScrollTop = Math.max(0, container.scrollTop - headerHeight);
                if (cumulativeOffsets) {
                    // Variable height mode: use binary search to find visible range
                    const totalHeight = cumulativeOffsets[cumulativeOffsets.length - 1] || 0;
                    const lastRowIndex = cumulativeOffsets.length - 2;
                    visibleRowStart = Math.max(0, this.findLineAtOffset(contentScrollTop, cumulativeOffsets) - buffer);
                    visibleRowEnd = this.findLineAtOffset(contentScrollTop + container.clientHeight, cumulativeOffsets) + buffer;
                    // IMPORTANT: The calculated offsets may overestimate row heights (based on char count),
                    // but actual CSS rendering might produce shorter rows. To prevent empty space,
                    // ensure we render at least enough rows to fill the viewport using ESTIMATED_ROW_HEIGHT
                    // as a conservative minimum.
                    const minRowsToFillViewport = Math.ceil(container.clientHeight / DiffViewer.ESTIMATED_ROW_HEIGHT);
                    visibleRowEnd = Math.max(visibleRowEnd, visibleRowStart + minRowsToFillViewport + buffer);
                    // Also ensure we render all rows when near the bottom
                    if (contentScrollTop + container.clientHeight >= totalHeight - buffer * DiffViewer.ESTIMATED_ROW_HEIGHT) {
                        visibleRowEnd = lastRowIndex + buffer;
                    }
                }
                else {
                    // Fixed height fallback
                    const viewportRows = Math.ceil(container.clientHeight / DiffViewer.ESTIMATED_ROW_HEIGHT);
                    visibleRowStart = Math.max(0, visibleStartRow - buffer);
                    visibleRowEnd = visibleStartRow + viewportRows + buffer;
                }
            }
            // First pass: build a map of lineIndex -> renderedRowIndex
            // This accounts for code folding where some lines don't render or render as fold indicators
            const lineToRowMap = new Map();
            const seenBlocks = new Set();
            let currentRow = 0;
            for (let i = 0; i < lineInformation.length; i++) {
                const blockIndex = lineBlocks[i];
                if (showDiffOnly && blockIndex !== undefined) {
                    if (!expandedBlocks.includes(blockIndex)) {
                        // Line is in a collapsed block
                        const lastLineOfBlock = blocks[blockIndex].endLine === i;
                        if (!seenBlocks.has(blockIndex) && lastLineOfBlock) {
                            // This line renders as a fold indicator
                            seenBlocks.add(blockIndex);
                            lineToRowMap.set(i, currentRow);
                            currentRow++;
                        }
                        // Other lines in collapsed block don't render
                    }
                    else {
                        // Block is expanded, line renders normally
                        lineToRowMap.set(i, currentRow);
                        currentRow++;
                    }
                }
                else {
                    // Not in a block or showDiffOnly is false, line renders normally
                    lineToRowMap.set(i, currentRow);
                    currentRow++;
                }
            }
            const totalRenderedRows = currentRow;
            // Second pass: render only lines in the visible range
            const diffNodes = [];
            let topPadding = 0;
            let firstVisibleFound = false;
            let lastRenderedRowIndex = -1;
            seenBlocks.clear();
            for (let lineIndex = 0; lineIndex < lineInformation.length; lineIndex++) {
                const line = lineInformation[lineIndex];
                const rowIndex = lineToRowMap.get(lineIndex);
                // Skip lines that don't render (hidden in collapsed blocks)
                if (rowIndex === undefined)
                    continue;
                // Skip lines before visible range
                if (rowIndex < visibleRowStart) {
                    continue;
                }
                // Stop after visible range
                if (rowIndex > visibleRowEnd) {
                    break;
                }
                // Calculate top padding from the first visible row
                if (!firstVisibleFound) {
                    topPadding = cumulativeOffsets
                        ? cumulativeOffsets[rowIndex] || 0
                        : rowIndex * DiffViewer.ESTIMATED_ROW_HEIGHT;
                    firstVisibleFound = true;
                }
                // Track the last rendered row for bottom padding calculation
                lastRenderedRowIndex = rowIndex;
                // Render the line
                if (showDiffOnly) {
                    const blockIndex = lineBlocks[lineIndex];
                    if (blockIndex !== undefined) {
                        const lastLineOfBlock = blocks[blockIndex].endLine === lineIndex;
                        if (!expandedBlocks.includes(blockIndex) &&
                            lastLineOfBlock) {
                            diffNodes.push(_jsx(React.Fragment, { children: this.renderSkippedLineIndicator(blocks[blockIndex].lines, blockIndex, line.left.lineNumber, line.right.lineNumber) }, lineIndex));
                            continue;
                        }
                        if (!expandedBlocks.includes(blockIndex)) {
                            continue;
                        }
                    }
                }
                diffNodes.push(splitView
                    ? this.renderSplitView(line, lineIndex)
                    : this.renderInlineView(line, lineIndex));
            }
            // Calculate total content height
            const totalContentHeight = cumulativeOffsets
                ? cumulativeOffsets[cumulativeOffsets.length - 1] || 0
                : totalRenderedRows * DiffViewer.ESTIMATED_ROW_HEIGHT;
            // Calculate bottom padding: space after the last rendered row
            const bottomPadding = cumulativeOffsets && lastRenderedRowIndex >= 0
                ? totalContentHeight - (cumulativeOffsets[lastRenderedRowIndex + 1] || totalContentHeight)
                : 0;
            return {
                diffNodes,
                blocks,
                lineInformation,
                totalRenderedRows,
                topPadding,
                bottomPadding,
                totalContentHeight,
                renderedCount: diffNodes.length,
                // Debug info
                debug: {
                    visibleRowStart,
                    visibleRowEnd,
                    totalRows: totalRenderedRows,
                    offsetsLength: (_b = cumulativeOffsets === null || cumulativeOffsets === void 0 ? void 0 : cumulativeOffsets.length) !== null && _b !== void 0 ? _b : 0,
                    renderedCount: diffNodes.length,
                    scrollTop: (_d = (_c = scrollableContainerRef.current) === null || _c === void 0 ? void 0 : _c.scrollTop) !== null && _d !== void 0 ? _d : 0,
                    headerHeight: this.getStickyHeaderHeight(),
                    contentScrollTop: scrollableContainerRef.current
                        ? Math.max(0, scrollableContainerRef.current.scrollTop - this.getStickyHeaderHeight())
                        : 0,
                    clientHeight: (_f = (_e = scrollableContainerRef.current) === null || _e === void 0 ? void 0 : _e.clientHeight) !== null && _f !== void 0 ? _f : 0,
                }
            };
        };
        this.render = () => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            const { oldValue, newValue, useDarkTheme, leftTitle, rightTitle, splitView, compareMethod, hideLineNumbers, nonce, } = this.props;
            if (typeof compareMethod === "string" &&
                compareMethod !== DiffMethod.JSON) {
                if (typeof oldValue !== "string" || typeof newValue !== "string") {
                    throw Error('"oldValue" and "newValue" should be strings');
                }
            }
            this.styles = this.computeStyles(this.props.styles, useDarkTheme, nonce);
            const nodes = this.renderDiff();
            let colSpanOnSplitView = 3;
            let colSpanOnInlineView = 4;
            if (hideLineNumbers) {
                colSpanOnSplitView -= 1;
                colSpanOnInlineView -= 1;
            }
            if (this.props.renderGutter) {
                colSpanOnSplitView += 1;
                colSpanOnInlineView += 1;
            }
            let deletions = 0;
            let additions = 0;
            for (const l of nodes.lineInformation) {
                if (l.left.type === DiffType.ADDED) {
                    additions++;
                }
                if (l.right.type === DiffType.ADDED) {
                    additions++;
                }
                if (l.left.type === DiffType.REMOVED) {
                    deletions++;
                }
                if (l.right.type === DiffType.REMOVED) {
                    deletions++;
                }
            }
            const totalChanges = deletions + additions;
            const percentageAddition = Math.round((additions / totalChanges) * 100);
            const blocks = [];
            for (let i = 0; i < 5; i++) {
                if (percentageAddition > i * 20) {
                    blocks.push(_jsx("span", { className: cn(this.styles.block, this.styles.blockAddition) }, i));
                }
                else {
                    blocks.push(_jsx("span", { className: cn(this.styles.block, this.styles.blockDeletion) }, i));
                }
            }
            const allExpanded = this.state.expandedBlocks.length === nodes.blocks.length;
            const LoadingElement = this.props.loadingElement;
            const scrollDivStyle = this.props.infiniteLoading ? {
                overflowY: 'scroll',
                overflowX: 'hidden',
                height: this.props.infiniteLoading.containerHeight
            } : {};
            // Only apply noWrap when infiniteLoading is enabled but we don't have cumulative offsets yet
            // Once offsets are calculated, we enable pre-wrap for proper text wrapping
            const shouldNoWrap = !!this.props.infiniteLoading && !this.state.cumulativeOffsets;
            const tableElement = (_jsxs("table", { className: cn(this.styles.diffContainer, {
                    [this.styles.splitView]: splitView,
                    [this.styles.noWrap]: shouldNoWrap,
                }), onMouseUp: () => {
                    const elements = document.getElementsByClassName("right");
                    for (let i = 0; i < elements.length; i++) {
                        const element = elements.item(i);
                        element.classList.remove(this.styles.noSelect);
                    }
                    const elementsLeft = document.getElementsByClassName("left");
                    for (let i = 0; i < elementsLeft.length; i++) {
                        const element = elementsLeft.item(i);
                        element.classList.remove(this.styles.noSelect);
                    }
                }, children: [_jsxs("colgroup", { children: [!this.props.hideLineNumbers && _jsx("col", { width: "50px" }), !splitView && !this.props.hideLineNumbers && _jsx("col", { width: "50px" }), this.props.renderGutter && _jsx("col", { width: "50px" }), _jsx("col", { width: "28px" }), _jsx("col", { width: "auto" }), splitView && (_jsxs(_Fragment, { children: [!this.props.hideLineNumbers && _jsx("col", { width: "50px" }), this.props.renderGutter && _jsx("col", { width: "50px" }), _jsx("col", { width: "28px" }), _jsx("col", { width: "auto" })] }))] }), _jsx("tbody", { children: nodes.diffNodes })] }));
            return (_jsxs("div", { style: Object.assign(Object.assign({}, scrollDivStyle), { position: 'relative' }), onScroll: this.onScroll, ref: this.state.scrollableContainerRef, children: [(!this.props.hideSummary || leftTitle || rightTitle) && (_jsxs("div", { ref: this.stickyHeaderRef, className: this.styles.stickyHeader, children: [!this.props.hideSummary && (_jsxs("div", { className: this.styles.summary, role: "banner", children: [_jsx("button", { type: "button", className: this.styles.allExpandButton, onClick: () => {
                                            this.setState({
                                                expandedBlocks: allExpanded
                                                    ? []
                                                    : nodes.blocks.map((b) => b.index),
                                            }, () => this.recalculateOffsets());
                                        }, children: allExpanded ? _jsx(Fold, {}) : _jsx(Expand, {}) }), " ", totalChanges, _jsx("div", { style: { display: "flex", gap: "1px" }, children: blocks }), this.props.summary ? _jsx("span", { children: this.props.summary }) : null] })), (leftTitle || rightTitle) && (_jsxs("div", { className: this.styles.columnHeaders, children: [_jsx("div", { className: this.styles.titleBlock, children: leftTitle ? (_jsx("pre", { className: this.styles.contentText, children: leftTitle })) : null }), splitView && (_jsx("div", { className: this.styles.titleBlock, children: rightTitle ? (_jsx("pre", { className: this.styles.contentText, children: rightTitle })) : null }))] }))] })), this.state.isLoading && LoadingElement && _jsx(LoadingElement, {}), this.props.infiniteLoading ? (_jsx("div", { style: {
                            height: nodes.totalContentHeight,
                            position: 'relative',
                        }, children: _jsx("div", { style: {
                                position: 'absolute',
                                top: nodes.topPadding,
                                left: 0,
                                right: 0,
                            }, children: tableElement }) })) : (tableElement), _jsx("span", { ref: this.charMeasureRef, style: {
                            position: 'absolute',
                            top: 0,
                            left: '-9999px',
                            visibility: 'hidden',
                            whiteSpace: 'pre',
                            fontFamily: 'monospace',
                            fontSize: 12,
                        }, "aria-hidden": "true", children: "M" }), this.props.infiniteLoading && this.props.showDebugInfo && (_jsxs("div", { style: {
                            position: 'fixed',
                            top: 10,
                            right: 10,
                            background: 'rgba(0,0,0,0.85)',
                            color: '#0f0',
                            padding: '10px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            zIndex: 9999,
                            borderRadius: '4px',
                            maxWidth: '300px',
                            lineHeight: 1.4,
                        }, children: [_jsx("div", { style: { fontWeight: 'bold', marginBottom: '5px', color: '#fff' }, children: "Debug Info" }), _jsxs("div", { children: ["scrollTop: ", nodes.debug.scrollTop] }), _jsxs("div", { children: ["headerHeight: ", nodes.debug.headerHeight] }), _jsxs("div", { children: ["contentScrollTop: ", nodes.debug.contentScrollTop] }), _jsxs("div", { children: ["clientHeight: ", nodes.debug.clientHeight] }), _jsxs("div", { style: { marginTop: '5px', borderTop: '1px solid #444', paddingTop: '5px' }, children: [_jsxs("div", { children: ["visibleRowStart: ", nodes.debug.visibleRowStart] }), _jsxs("div", { children: ["visibleRowEnd: ", nodes.debug.visibleRowEnd] })] }), _jsxs("div", { style: { marginTop: '5px', borderTop: '1px solid #444', paddingTop: '5px' }, children: [_jsxs("div", { children: ["totalRows: ", nodes.debug.totalRows] }), _jsxs("div", { children: ["offsetsLength: ", nodes.debug.offsetsLength] }), _jsxs("div", { children: ["renderedCount: ", nodes.debug.renderedCount] })] }), _jsxs("div", { style: { marginTop: '5px', borderTop: '1px solid #444', paddingTop: '5px' }, children: [_jsxs("div", { children: ["topPadding: ", nodes.topPadding.toFixed(0)] }), _jsxs("div", { children: ["bottomPadding: ", nodes.bottomPadding.toFixed(0)] }), _jsxs("div", { children: ["totalContentHeight: ", nodes.totalContentHeight.toFixed(0)] })] }), _jsxs("div", { style: { marginTop: '5px', borderTop: '1px solid #444', paddingTop: '5px', color: '#ff0' }, children: [_jsxs("div", { children: ["cumulativeOffsets: ", this.state.cumulativeOffsets ? 'SET' : 'NULL'] }), _jsxs("div", { children: ["columnWidth: ", (_b = (_a = this.state.contentColumnWidth) === null || _a === void 0 ? void 0 : _a.toFixed(0)) !== null && _b !== void 0 ? _b : 'N/A', "px"] }), _jsxs("div", { children: ["charWidth: ", (_d = (_c = this.state.charWidth) === null || _c === void 0 ? void 0 : _c.toFixed(2)) !== null && _d !== void 0 ? _d : 'N/A', "px"] }), _jsxs("div", { children: ["charsPerRow: ", this.state.contentColumnWidth && this.state.charWidth ? Math.floor(this.state.contentColumnWidth / this.state.charWidth) : 'N/A'] })] }), this.state.cumulativeOffsets && (_jsxs("div", { style: { marginTop: '5px', borderTop: '1px solid #444', paddingTop: '5px', color: '#0ff', fontSize: '10px' }, children: [_jsxs("div", { children: ["offsets[", nodes.debug.visibleRowEnd, "]: ", (_f = (_e = this.state.cumulativeOffsets[nodes.debug.visibleRowEnd]) === null || _e === void 0 ? void 0 : _e.toFixed(0)) !== null && _f !== void 0 ? _f : 'N/A'] }), _jsxs("div", { children: ["offsets[", nodes.debug.totalRows - 1, "]: ", (_h = (_g = this.state.cumulativeOffsets[nodes.debug.totalRows - 1]) === null || _g === void 0 ? void 0 : _g.toFixed(0)) !== null && _h !== void 0 ? _h : 'N/A'] }), _jsxs("div", { children: ["offsets[", nodes.debug.totalRows, "]: ", (_k = (_j = this.state.cumulativeOffsets[nodes.debug.totalRows]) === null || _j === void 0 ? void 0 : _j.toFixed(0)) !== null && _k !== void 0 ? _k : 'N/A'] }), _jsxs("div", { style: { marginTop: '3px' }, children: ["viewportEnd: ", (nodes.debug.contentScrollTop + nodes.debug.clientHeight).toFixed(0)] }), _jsxs("div", { style: { marginTop: '3px', color: '#f0f' }, children: ["scrollHeight: ", (_m = (_l = this.state.scrollableContainerRef.current) === null || _l === void 0 ? void 0 : _l.scrollHeight) !== null && _m !== void 0 ? _m : 'N/A'] }), _jsxs("div", { children: ["maxScrollTop: ", ((_p = (_o = this.state.scrollableContainerRef.current) === null || _o === void 0 ? void 0 : _o.scrollHeight) !== null && _p !== void 0 ? _p : 0) - nodes.debug.clientHeight] })] }))] }))] }));
        };
        this.state = {
            expandedBlocks: [],
            noSelect: undefined,
            scrollableContainerRef: React.createRef(),
            computedDiffResult: {},
            isLoading: false,
            visibleStartRow: 0,
            contentColumnWidth: null,
            charWidth: null,
            cumulativeOffsets: null,
        };
    }
    /**
     * Gets the height of the sticky header, if present.
     */
    getStickyHeaderHeight() {
        var _a;
        return ((_a = this.stickyHeaderRef.current) === null || _a === void 0 ? void 0 : _a.offsetHeight) || 0;
    }
    /**
     * Measures the width of a single character in the monospace font.
     * Falls back to 7.2px if measurement fails.
     */
    measureCharWidth() {
        const span = this.charMeasureRef.current;
        if (!span)
            return 7.2; // fallback
        return span.getBoundingClientRect().width || 7.2;
    }
    /**
     * Measures the available width for content in a content column.
     * Falls back to estimating from container width if direct measurement fails.
     */
    measureContentColumnWidth() {
        // Try direct measurement first
        const cell = this.contentColumnRef.current;
        if (cell && cell.clientWidth > 0) {
            const style = window.getComputedStyle(cell);
            const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            const width = cell.clientWidth - padding;
            if (width > 0)
                return width;
        }
        // Fallback: estimate from container width
        // In split view: container has 2 content columns + gutters (50px each) + markers (28px each)
        // In unified view: 1 content column + 2 gutters + 1 marker
        const container = this.state.scrollableContainerRef.current;
        if (!container || container.clientWidth <= 0)
            return null;
        const containerWidth = container.clientWidth;
        const gutterWidth = this.props.hideLineNumbers ? 0 : 50;
        const markerWidth = 28;
        const gutterCount = this.props.splitView ? 2 : 2; // left gutter(s)
        const markerCount = this.props.splitView ? 2 : 1;
        const contentColumns = this.props.splitView ? 2 : 1;
        const fixedWidth = gutterCount * gutterWidth + markerCount * markerWidth;
        const availableWidth = containerWidth - fixedWidth;
        return Math.max(100, availableWidth / contentColumns); // minimum 100px
    }
    /**
     * Gets the text length from a value that may be a string or DiffInformation array.
     */
    getTextLength(value) {
        if (!value)
            return 0;
        if (typeof value === 'string')
            return value.length;
        return value.reduce((sum, d) => sum + (typeof d.value === 'string' ? d.value.length : 0), 0);
    }
    /**
     * Builds cumulative vertical offsets for each line based on character count and column width.
     * This allows accurate scroll position calculations with variable row heights.
     */
    buildCumulativeOffsets(lineInformation, lineBlocks, blocks, expandedBlocks, showDiffOnly, charWidth, columnWidth, splitView) {
        var _a, _b;
        const offsets = [0];
        const seenBlocks = new Set();
        for (let i = 0; i < lineInformation.length; i++) {
            const line = lineInformation[i];
            if (showDiffOnly) {
                const blockIndex = lineBlocks[i];
                if (blockIndex !== undefined && !expandedBlocks.includes(blockIndex)) {
                    const isLastLine = blocks[blockIndex].endLine === i;
                    if (!seenBlocks.has(blockIndex) && isLastLine) {
                        seenBlocks.add(blockIndex);
                        offsets.push(offsets[offsets.length - 1] + DiffViewer.ESTIMATED_ROW_HEIGHT);
                    }
                    continue;
                }
            }
            // Calculate visual rows for this line
            const leftLen = ((_a = line.left) === null || _a === void 0 ? void 0 : _a.value) ? this.getTextLength(line.left.value) : 0;
            const rightLen = ((_b = line.right) === null || _b === void 0 ? void 0 : _b.value) ? this.getTextLength(line.right.value) : 0;
            const maxLen = splitView ? Math.max(leftLen, rightLen) : (leftLen || rightLen);
            const charsPerRow = Math.floor(columnWidth / charWidth);
            const visualRows = charsPerRow > 0 ? Math.max(1, Math.ceil(maxLen / charsPerRow)) : 1;
            offsets.push(offsets[offsets.length - 1] + visualRows * DiffViewer.ESTIMATED_ROW_HEIGHT);
        }
        return offsets;
    }
    /**
     * Binary search to find the line index at a given scroll offset.
     */
    findLineAtOffset(scrollTop, offsets) {
        let low = 0;
        let high = offsets.length - 2;
        while (low < high) {
            const mid = Math.floor((low + high + 1) / 2);
            if (offsets[mid] <= scrollTop) {
                low = mid;
            }
            else {
                high = mid - 1;
            }
        }
        return low;
    }
    componentDidUpdate(prevProps) {
        if (prevProps.oldValue !== this.props.oldValue ||
            prevProps.newValue !== this.props.newValue ||
            prevProps.compareMethod !== this.props.compareMethod ||
            prevProps.disableWordDiff !== this.props.disableWordDiff ||
            prevProps.linesOffset !== this.props.linesOffset) {
            // Clear word diff cache when diff changes
            this.wordDiffCache.clear();
            // Reset scroll position to top
            const container = this.state.scrollableContainerRef.current;
            if (container) {
                container.scrollTop = 0;
            }
            this.setState((prev) => (Object.assign(Object.assign({}, prev), { isLoading: true, visibleStartRow: 0, cumulativeOffsets: null })));
            this.memoisedCompute();
        }
    }
    componentDidMount() {
        this.setState((prev) => (Object.assign(Object.assign({}, prev), { isLoading: true })));
        this.memoisedCompute();
        // Set up ResizeObserver for recalculating offsets on container resize
        if (typeof ResizeObserver !== 'undefined' && this.props.infiniteLoading) {
            this.resizeObserver = new ResizeObserver(() => {
                requestAnimationFrame(() => this.recalculateOffsets());
            });
            const container = this.state.scrollableContainerRef.current;
            if (container) {
                this.resizeObserver.observe(container);
            }
        }
    }
    componentWillUnmount() {
        var _a;
        (_a = this.resizeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
    }
}
DiffViewer.defaultProps = {
    oldValue: "",
    newValue: "",
    splitView: true,
    highlightLines: [],
    disableWordDiff: false,
    compareMethod: DiffMethod.CHARS,
    styles: {},
    hideLineNumbers: false,
    extraLinesSurroundingDiff: 3,
    showDiffOnly: true,
    useDarkTheme: false,
    linesOffset: 0,
    nonce: "",
};
// Estimated row height based on lineHeight: 1.6em with 12px base font
DiffViewer.ESTIMATED_ROW_HEIGHT = 19;
export default DiffViewer;
export { DiffMethod };
export { default as computeStyles } from "./styles.js";
