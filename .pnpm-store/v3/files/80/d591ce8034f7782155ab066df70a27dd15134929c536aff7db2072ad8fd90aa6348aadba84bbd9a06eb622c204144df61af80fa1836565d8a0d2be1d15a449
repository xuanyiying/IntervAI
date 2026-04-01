'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

var _a;
const envDevmode = typeof process !== 'undefined'
    ? ((_a = process.env) === null || _a === void 0 ? void 0 : _a.REACT_APP_IDE_DEVMODE) === 'true'
    : false;
const windowDevmode = typeof window !== 'undefined' && (window === null || window === void 0 ? void 0 : window.REACT_BUDDY_IDE_DEVMODE) === true;
const DEV_MODE = windowDevmode || envDevmode;

const withInitialHook = (useInitialHook, ComponentPreviews) => {
    const DevBootstrapWrapped = () => {
        const status = useInitialHook();
        if (status.loading) {
            return React__default['default'].createElement("div", null, " loading... ");
        }
        if (status.error) {
            return (React__default['default'].createElement("div", null, "Unable to bootstrap dev mode. Probably you need to run backend or enable backend mocking mode."));
        }
        return React__default['default'].createElement(DevBootstrap, { ComponentPreviews: ComponentPreviews });
    };
    return DevBootstrapWrapped;
};
const DevBootstrap = ({ ComponentPreviews }) => {
    return (React__default['default'].createElement(React.Suspense, { fallback: React__default['default'].createElement("div", null, "Loading sources...") },
        React__default['default'].createElement(ComponentPreviews, null)));
};
const DevSupport = ({ children, ComponentPreviews, useInitialHook, devmode, }) => {
    const isDevmode = enabledDevmode(devmode);
    if (isDevmode) {
        return useInitialHook ? (withInitialHook(useInitialHook, ComponentPreviews)({})) : (React__default['default'].createElement(DevBootstrap, { ComponentPreviews: ComponentPreviews }));
    }
    return React__default['default'].createElement(React__default['default'].Fragment, null, children);
};
function enabledDevmode(devmode) {
    return devmode != null ? devmode : DEV_MODE;
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z$9 = ".table-header {\n  border-color: #363636;\n  border-width: 1px 0;\n  border-style: solid;\n  font-weight: 800;\n  padding: 10px 20px 10px 10px;\n  display: flex;\n}\n.table-header:after {\n  content: \"\";\n}\n.table-header .table-header-item {\n  flex-basis: 22%;\n  color: #444;\n}\n.table-header .table-header-item-control {\n  flex-basis: 78%;\n  color: #444;\n}";
styleInject(css_248z$9);

const TableHeader = () => {
    return (React__default['default'].createElement("div", { className: 'table-header' },
        React__default['default'].createElement("div", { className: 'table-header-item' }, "Property name"),
        React__default['default'].createElement("div", { className: 'table-header-item-control' }, "Edit")));
};

exports.PropsControlTypes = void 0;
(function (PropsControlTypes) {
    PropsControlTypes["Checkbox"] = "checkbox";
    PropsControlTypes["Input"] = "input";
    PropsControlTypes["Radio"] = "radio";
    PropsControlTypes["Select"] = "select";
    PropsControlTypes["Textarea"] = "textarea";
    PropsControlTypes["JsonEditor"] = "jsonEditor";
})(exports.PropsControlTypes || (exports.PropsControlTypes = {}));

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

const Input = (_a) => {
    var { value } = _a, restProps = __rest(_a, ["value"]);
    return React__default['default'].createElement("input", Object.assign({}, restProps, { value: value !== null && value !== void 0 ? value : '', type: 'text' }));
};

const Checkbox = (_a) => {
    var { checked, className } = _a, restProps = __rest(_a, ["checked", "className"]);
    return (React__default['default'].createElement("div", { className: className },
        React__default['default'].createElement("input", Object.assign({}, restProps, { checked: checked !== null && checked !== void 0 ? checked : false, type: 'checkbox' }))));
};

const Select = (_a) => {
    var { optionsData } = _a, restProps = __rest(_a, ["optionsData"]);
    return (React__default['default'].createElement("select", Object.assign({}, restProps), optionsData === null || optionsData === void 0 ? void 0 : optionsData.map((value) => {
        return (React__default['default'].createElement("option", { value: value, key: value }, value));
    })));
};

var css_248z$8 = ".radio-control {\n  display: flex;\n  align-items: center;\n  margin-right: 15px;\n}\n.radio-control label {\n  margin-right: 5px;\n}";
styleInject(css_248z$8);

const Radio = (_a) => {
    var { className, radioData, extValue } = _a, restProps = __rest(_a, ["className", "radioData", "extValue"]);
    return radioData ? (React__default['default'].createElement("div", { className: className }, radioData.map((value) => {
        return (React__default['default'].createElement("div", { key: value, className: 'radio-control' },
            React__default['default'].createElement("label", { htmlFor: String(value) },
                " ",
                value),
            React__default['default'].createElement("input", Object.assign({}, restProps, { type: 'radio', checked: extValue == value, id: String(value), value: value }))));
    }))) : null;
};

const Textarea = (props) => {
    return React__default['default'].createElement("textarea", Object.assign({}, props));
};

var css_248z$7 = ".json-editor {\n  flex-direction: column;\n}\n.json-editor .json-editor-textarea {\n  align-self: start;\n  width: 100%;\n  min-height: 100px;\n  margin: 0 0 10px 0;\n}\n.json-editor .json-editor-apply-button {\n  align-self: start;\n}";
styleInject(css_248z$7);

const JsonEditor = ({ className, propName, propValue, propUpdate, }) => {
    const [editedJsonValue, setEditedJsonValue] = React.useState();
    const textareaOnChange = React.useCallback((event) => {
        const { currentTarget: { value }, } = event;
        setEditedJsonValue(value);
    }, []);
    const isEnabledToApply = React.useMemo(() => {
        return editedJsonValue == null;
    }, [editedJsonValue]);
    const onPropUpdate = React.useCallback(() => {
        propUpdate(propName, editedJsonValue);
        setEditedJsonValue(undefined);
    }, [propName, editedJsonValue]);
    return (React__default['default'].createElement("div", { className: className + ' json-editor' },
        React__default['default'].createElement(Textarea, { className: 'json-editor-textarea', onChange: textareaOnChange, id: propName, value: editedJsonValue !== null && editedJsonValue !== void 0 ? editedJsonValue : propValue }),
        React__default['default'].createElement("button", { className: 'json-editor-apply-button', disabled: isEnabledToApply, onClick: onPropUpdate }, "Apply changes")));
};

const TableItemControl = ({ controlType, data, propName, propValue, onPropChange, }) => {
    switch (controlType) {
        case exports.PropsControlTypes.Input:
            return (React__default['default'].createElement(Input, { className: 'table-item-control', id: propName, value: propValue, onChange: onPropChange }));
        case exports.PropsControlTypes.Textarea:
            return (React__default['default'].createElement(Textarea, { className: 'table-item-control', id: propName, value: propValue, onChange: onPropChange }));
        case exports.PropsControlTypes.Select:
            return (React__default['default'].createElement(Select, { className: 'table-item-control', id: propName, onChange: onPropChange, optionsData: data }));
        case exports.PropsControlTypes.Checkbox:
            return (React__default['default'].createElement(Checkbox, { checked: propValue, id: propName, onChange: onPropChange }));
        case exports.PropsControlTypes.Radio:
            return (React__default['default'].createElement(Radio, { className: 'table-item-control', extValue: propValue, name: propName, onChange: onPropChange, radioData: data }));
        case exports.PropsControlTypes.JsonEditor:
            return (React__default['default'].createElement(JsonEditor, { className: 'table-item-control', propValue: propValue, propName: propName, propUpdate: onPropChange }));
        default:
            return (React__default['default'].createElement(Input, { className: 'table-item-control', id: propName, value: propValue, onChange: onPropChange }));
    }
};

var css_248z$6 = ".table-item-wrapper {\n  border-color: #363636;\n  border-width: 0 0 1px 0;\n  border-style: solid;\n  padding: 10px;\n  display: flex;\n}\n.table-item-wrapper:after {\n  content: \"\";\n}\n.table-item-wrapper .table-item,\n.table-item-wrapper .table-item-control {\n  display: flex;\n  align-items: center;\n  justify-content: start;\n}\n.table-item-wrapper .table-item {\n  flex-basis: 22%;\n}\n.table-item-wrapper .table-item-control {\n  flex-basis: 78%;\n}";
styleInject(css_248z$6);

const TableItem = ({ propName, propValue, onPropChange, controlType, data, }) => {
    return (React__default['default'].createElement("div", { className: 'table-item-wrapper' },
        React__default['default'].createElement("div", { className: 'table-item' }, propName),
        React__default['default'].createElement(TableItemControl, { data: data, controlType: controlType, propName: propName, propValue: propValue, onPropChange: onPropChange })));
};

var css_248z$5 = ".table-items {\n  background-color: whitesmoke;\n  display: flex;\n  flex-direction: column;\n  overflow-y: scroll;\n}\n.table-items:after {\n  content: \"\";\n}";
styleInject(css_248z$5);

const TableItems = ({ toolsPropsToEdit }) => {
    const { props = null, initialProps = null, propsEditInfo = null, updateProps, } = Object.assign({}, toolsPropsToEdit);
    React.useEffect(() => {
        let propsValuesFromData = {};
        propsEditInfo
            ? Object.entries(propsEditInfo).map(([propName, propEditInfo]) => {
                const propValue = Array.isArray(propEditInfo.data)
                    ? propEditInfo.data[0]
                    : propEditInfo.data;
                propsValuesFromData = Object.assign(Object.assign({}, propsValuesFromData), { [propName]: propValue });
            })
            : null;
        updateProps === null || updateProps === void 0 ? void 0 : updateProps(Object.assign(Object.assign({}, props), propsValuesFromData));
    }, [propsEditInfo]);
    const onInputChange = React.useCallback((event) => {
        const { value: updatedPropValue, id: propName } = event.currentTarget;
        const updatedProps = Object.assign(Object.assign({}, props), { [propName]: updatedPropValue });
        updateProps(updatedProps);
    }, [props]);
    const onCheckboxChange = React.useCallback((event) => {
        const { checked: updatedPropValue, id: propName } = event.currentTarget;
        const updatedProps = Object.assign(Object.assign({}, props), { [propName]: updatedPropValue });
        updateProps(updatedProps);
    }, [props]);
    const onSelectChange = React.useCallback((event) => {
        const { value: updatedPropValue, id: propName } = event.currentTarget;
        const updatedProps = Object.assign(Object.assign({}, props), { [propName]: updatedPropValue });
        updateProps(updatedProps);
    }, [props]);
    const onRadioChange = React.useCallback((event) => {
        const { value: updatedPropValue, name: propName } = event.currentTarget;
        const updatedProps = Object.assign(Object.assign({}, props), { [propName]: updatedPropValue });
        updateProps(updatedProps);
    }, [props]);
    const onTextAreaChange = React.useCallback((event) => {
        const { value: updatedPropValue, id: propName } = event.currentTarget;
        const updatedProps = Object.assign(Object.assign({}, props), { [propName]: updatedPropValue });
        updateProps(updatedProps);
    }, [props]);
    const onJsonChange = React.useCallback((propName, propValue) => {
        let updatedPropValue;
        try {
            updatedPropValue = JSON.parse(propValue);
        }
        catch (e) {
            alert(`Property ${propName} has incorrect value to object parse`);
            return;
        }
        const updatedProps = Object.assign(Object.assign({}, props), { [propName]: updatedPropValue });
        updateProps(updatedProps);
    }, [props]);
    const getChangeHendler = React.useCallback((controlType) => {
        switch (controlType) {
            case exports.PropsControlTypes.Input:
                return onInputChange;
            case exports.PropsControlTypes.Checkbox:
                return onCheckboxChange;
            case exports.PropsControlTypes.Select:
                return onSelectChange;
            case exports.PropsControlTypes.Radio:
                return onRadioChange;
            case exports.PropsControlTypes.Textarea:
                return onTextAreaChange;
            case exports.PropsControlTypes.JsonEditor:
                return onJsonChange;
            default:
                return onInputChange;
        }
    }, [props]);
    const renderTableItems = React.useCallback(() => {
        let items = [];
        const itemsWithoutInfo = props &&
            Object.entries(props)
                .filter(([propName]) => {
                return !(propsEditInfo === null || propsEditInfo === void 0 ? void 0 : propsEditInfo.hasOwnProperty(propName));
            })
                .map(([propName, propValue]) => {
                return (React__default['default'].createElement(TableItem, { key: propName, propName: propName, propValue: propValue, initialPropValue: initialProps === null || initialProps === void 0 ? void 0 : initialProps[propName], onPropChange: getChangeHendler() }));
            });
        items = itemsWithoutInfo ? [...items, ...itemsWithoutInfo] : items;
        const itemsWithInfo = propsEditInfo &&
            Object.entries(propsEditInfo).map(([propName, propInfo]) => {
                return (React__default['default'].createElement(TableItem, { key: propName, data: propInfo.data, controlType: propInfo.controlType, propName: propName, propValue: propInfo.controlType === exports.PropsControlTypes.JsonEditor
                        ? JSON.stringify(props === null || props === void 0 ? void 0 : props[propName], null, 2)
                        : props === null || props === void 0 ? void 0 : props[propName], initialPropValue: initialProps === null || initialProps === void 0 ? void 0 : initialProps[propName], onPropChange: getChangeHendler(propInfo.controlType) }));
            });
        items = itemsWithInfo ? [...items, ...itemsWithInfo] : items;
        return items;
    }, [props, propsEditInfo]);
    return React__default['default'].createElement("div", { className: 'table-items' }, renderTableItems());
};

var css_248z$4 = ".props-edit-table {\n  flex-grow: 1;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  height: 100%;\n}";
styleInject(css_248z$4);

const PropsEditTable = ({ toolsPropsToEdit }) => {
    return (React__default['default'].createElement("div", { className: 'props-edit-table' },
        React__default['default'].createElement(TableHeader, null),
        React__default['default'].createElement(TableItems, { toolsPropsToEdit: toolsPropsToEdit })));
};

var css_248z$3 = ".tools-panel {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  width: 100%;\n  height: 100%;\n  background-color: #eeeeee;\n}\n.tools-panel .empty-props-message {\n  color: red;\n}";
styleInject(css_248z$3);

const ToolsPanel = ({ toolsPropsToEdit }) => {
    const { props = null, propsEditInfo = null } = Object.assign({}, toolsPropsToEdit);
    const renederToolsPanelContent = React.useCallback(() => {
        let hasPropetiesToEdit;
        hasPropetiesToEdit = props ? Object.keys(props).length > 0 : false;
        hasPropetiesToEdit =
            hasPropetiesToEdit ||
                (propsEditInfo ? Object.keys(propsEditInfo).length > 0 : false);
        return hasPropetiesToEdit ? (React__default['default'].createElement(PropsEditTable, { toolsPropsToEdit: toolsPropsToEdit })) : (React__default['default'].createElement("div", { className: 'empty-props-message' }, "This component has no properties to edit"));
    }, [props, propsEditInfo]);
    return React__default['default'].createElement("div", { className: 'tools-panel' }, renederToolsPanelContent());
};

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PALETTE_PATH = '/REACT_BUDDY_PALETTE';
const URL_CHANGE_EVENT = 'urlchange';
const useRoute = (path, exact) => {
    const [, setUpdate] = React.useState(false);
    const update = React.useCallback(() => {
        setUpdate((reRender) => {
            return !reRender;
        });
    }, []);
    React.useEffect(() => {
        window.addEventListener(URL_CHANGE_EVENT, update);
        window.addEventListener('popstate', update);
        return () => {
            window.removeEventListener(URL_CHANGE_EVENT, update);
            window.removeEventListener('popstate', update);
        };
    }, []);
    return isMatchPath(path, exact);
};
function isMatchPath(path, exact = false) {
    const currentPath = getCurrentPath();
    const match = new RegExp(transformPath(path)).exec(currentPath);
    if (match) {
        const [url] = match;
        return exact ? currentPath === url : true;
    }
    return false;
}
function transformPath(path) {
    return escapeRegExp(encodeURI(path));
}
function getCurrentPath() {
    const { hash, pathname } = window.location;
    return hash ? hash.replace('#', '') : pathname;
}
function historyPush(url) {
    window.history.replaceState({}, '', url);
    dispatchUrlChangeEvent(url);
}
function dispatchUrlChangeEvent(url) {
    const urlChangeEvent = new CustomEvent(URL_CHANGE_EVENT, {
        bubbles: true,
        detail: url,
    });
    window.dispatchEvent(urlChangeEvent);
}

var css_248z$2 = ".previews-module_previewsMain__31L3F {\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n}\n\n.previews-module_previewsContent__1aMUf {\n  flex-basis: 100%;\n  flex-grow: 1;\n  overflow-y: auto;\n}\n\n.previews-module_previewsToolsPanel__30jjI {\n  flex-basis: 295px;\n  min-height: 100px;\n}";
var styles$2 = {"previewsMain":"previews-module_previewsMain__31L3F","previewsContent":"previews-module_previewsContent__1aMUf","previewsToolsPanel":"previews-module_previewsToolsPanel__30jjI"};
styleInject(css_248z$2);

const Previews = ({ children, palette = null, }) => {
    const [toolsPropsToEdit, setToolsPropsToEdit] = React.useState(null);
    const [toolsPanelEnabled, enableToolsPanel] = React.useState(() => { var _a; return (_a = window.__PROPERTIES_EDIT_PANEL_ENABLED__) !== null && _a !== void 0 ? _a : false; });
    const isPalettePath = useRoute(PALETTE_PATH);
    const childrenWithSetProps = React.useMemo(() => {
        return children
            ? React__default['default'].Children.map(children, (child) => {
                return React__default['default'].cloneElement(child, { setToolsPropsToEdit });
            })
            : null;
    }, [children]);
    React.useEffect(() => {
        var _a;
        window.enableComponentsPropsPanelEditor = (toolsPanelStatus) => {
            var _a;
            (_a = window.setPropertiesEditPanelStatus) === null || _a === void 0 ? void 0 : _a.call(window, toolsPanelStatus);
            enableToolsPanel(toolsPanelStatus);
        };
        window.reactBuddyHistoryPush = historyPush;
        (_a = window.cefQuery) === null || _a === void 0 ? void 0 : _a.call(window, { request: 'event:react-toolbox-initialized' });
    }, []);
    if (isPalettePath) {
        return palette;
    }
    return (React__default['default'].createElement("div", { className: styles$2.previewsMain },
        React__default['default'].createElement("div", { className: styles$2.previewsContent }, childrenWithSetProps),
        toolsPanelEnabled && (React__default['default'].createElement("div", { className: styles$2.previewsToolsPanel },
            React__default['default'].createElement(ToolsPanel, { toolsPropsToEdit: toolsPropsToEdit })))));
};

const RoutePreview = ({ children, path, exact, setPropsToEdit, }) => {
    const [modfiedProps, setModifiedProps] = React.useState(null);
    const isMatchPath = useRoute(path, exact);
    React.useEffect(() => {
        if (isMatchPath) {
            const currentProps = modfiedProps !== null && modfiedProps !== void 0 ? modfiedProps : children.props;
            const propsToEdit = {
                props: currentProps,
                updateProps: setModifiedProps,
            };
            setPropsToEdit(propsToEdit);
        }
        return () => {
            isMatchPath ? null : setModifiedProps(null);
        };
    }, [isMatchPath]);
    const childrenWithUpdatedProps = modfiedProps
        ? React__default['default'].cloneElement(children, Object.assign({}, modfiedProps))
        : children;
    return isMatchPath ? React__default['default'].createElement(React__default['default'].Fragment, null, childrenWithUpdatedProps) : null;
};

var css_248z$1 = ".react-buddy-error-boundary-module_errorMessageContainer__1L848 {\n  width: 100%;\n  height: 100%;\n  padding-left: 20px;\n  padding-right: 20px;\n  background-color: #fff;\n}\n\n.react-buddy-error-boundary-module_errorMessageTitle__r4YnX {\n  color: #d32f2f;\n}\n\n.react-buddy-error-boundary-module_errorMessageStack__2XNRm {\n  color: #a9a9a9;\n  font-size: 0.8rem;\n  width: 100%;\n  overflow-x: scroll;\n}";
var styles$1 = {"errorMessageContainer":"react-buddy-error-boundary-module_errorMessageContainer__1L848","errorMessageTitle":"react-buddy-error-boundary-module_errorMessageTitle__r4YnX","errorMessageStack":"react-buddy-error-boundary-module_errorMessageStack__2XNRm"};
styleInject(css_248z$1);

class ReactBuddyErrorBoundary extends React__default['default'].Component {
    constructor() {
        super(...arguments);
        this.state = { error: null };
    }
    componentDidCatch(error) {
        console.error(error);
        this.setState({ error });
    }
    componentDidUpdate(_prevProps, prevState) {
        if (prevState.error != null) {
            this.setState({ error: null });
        }
    }
    render() {
        const { error } = this.state;
        const { componentName, children } = this.props;
        if (error != null) {
            return (React__default['default'].createElement("div", { className: styles$1.errorMessageContainer },
                React__default['default'].createElement("h2", { className: styles$1.errorMessageTitle }, componentName
                    ? `Something went wrong while rendering ${componentName} component`
                    : 'Something went wrong'),
                React__default['default'].createElement("p", null, error.message),
                React__default['default'].createElement("pre", { className: styles$1.errorMessageStack }, error.stack)));
        }
        return children;
    }
}

const ComponentPreview = ({ path, children, setToolsPropsToEdit, exact = true, propsEditInfo, }) => {
    const setPropsToEdit = React.useCallback((propsToEdit) => {
        setToolsPropsToEdit(Object.assign(Object.assign({}, propsToEdit), { initialProps: children.props, propsEditInfo }));
    }, []);
    return (React__default['default'].createElement(RoutePreview, { path: path, exact: exact, setPropsToEdit: setPropsToEdit },
        React__default['default'].createElement(ReactBuddyErrorBoundary, null, children)));
};

const Palette = ({ style, className, embeddable, children }) => {
    return embeddable
        ? React__default['default'].createElement(React__default['default'].Fragment, null, children)
        : React__default['default'].createElement("div", { style: style, className: className }, children);
};

const CategoryContext = React__default['default'].createContext({});
const useCategoryContext = () => React.useContext(CategoryContext);
const Category = ({ children, name, className, style }) => {
    return (React__default['default'].createElement(CategoryContext.Provider, { value: { categoryClassName: className, categoryStyle: style } }, getTransformedCategoryChildren({
        children,
        categoryName: name,
    })));
};
function getTransformedCategoryChildren({ children, categoryName, }) {
    return React__default['default'].Children.map(children, (child) => {
        return React__default['default'].cloneElement(child, { categoryName });
    });
}

const ComponentContext = React__default['default'].createContext({});
const useComponentContext = () => React.useContext(ComponentContext);
const Component = ({ children, categoryName, name, className, style, }) => {
    return (React__default['default'].createElement(ComponentContext.Provider, { value: { componentClassName: className, componentStyle: style } }, getTransformedComponentChildren({
        children,
        componentName: name,
        categoryName,
    })));
};
function getTransformedComponentChildren({ children, componentName, categoryName, }) {
    return React__default['default'].Children.map(children, (child) => {
        return React__default['default'].cloneElement(child, {
            categoryName,
            componentName,
        });
    });
}

function classNames(...classNames) {
    const splittedClassNamesWithoutNullable = classNames.flatMap(className => className ? className.split(' ') : []);
    const uniqClassNames = [...new Set(splittedClassNamesWithoutNullable)];
    return uniqClassNames.join(' ');
}

var css_248z = ".variant-module_fullWindow__1DkCI {\n  padding: 0;\n  margin: 0;\n  width: 100%;\n  height: 100%;\n}\n\n.variant-module_variantRouteCenter__ce423 {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  width: 100%;\n  min-height: 100%;\n}";
var styles = {"fullWindow":"variant-module_fullWindow__1DkCI","variantRouteCenter":"variant-module_variantRouteCenter__ce423"};
styleInject(css_248z);

const DEFAULT_VARIANT_NAME = 'DEFAULT_VARIANT';
const VariantRoute = ({ categoryName, componentName, variantName = DEFAULT_VARIANT_NAME, previewLayout = 'center', children, }) => {
    const { categoryClassName, categoryStyle } = useCategoryContext();
    const { componentClassName, componentStyle } = useComponentContext();
    const { variantClassName, variantStyle } = useVariantContext();
    const paletteItemPath = React.useMemo(() => {
        return getPaletteItemPath([categoryName, componentName, variantName]);
    }, [categoryName, componentName, variantName]);
    const isPathMatch = useRoute(paletteItemPath, true);
    const [paletteNode, setPaletteNode] = React.useState(null);
    React.useLayoutEffect(() => {
        if (paletteNode !== null)
            addFullWindowClassToParents(paletteNode);
        return () => {
            if (paletteNode !== null)
                removeFullWindowClassFromParents(paletteNode);
        };
    }, [paletteNode]);
    if (!isPathMatch) {
        return null;
    }
    return (React__default['default'].createElement("div", { className: categoryClassName, style: categoryStyle },
        React__default['default'].createElement("div", { className: componentClassName, style: componentStyle, ref: setPaletteNode },
            React__default['default'].createElement("div", { className: previewLayout === 'center'
                    ? classNames(styles.variantRouteCenter, variantClassName)
                    : variantClassName, style: variantStyle }, children))));
};
function getPaletteItemPath(names) {
    return PALETTE_PATH + '/' + names.filter((name) => name != null).join('/');
}
const VariantContext = React__default['default'].createContext({});
const useVariantContext = () => React.useContext(VariantContext);
const Variant = ({ children, categoryName, componentName, name, previewLayout, className, style, }) => {
    return (React__default['default'].createElement(VariantContext.Provider, { value: { variantClassName: className, variantStyle: style } },
        React__default['default'].createElement(VariantRoute, { previewLayout: previewLayout, variantName: name, categoryName: categoryName, componentName: componentName },
            React__default['default'].createElement(ReactBuddyErrorBoundary, { componentName: componentName }, children))));
};
function addFullWindowClassToParents(curNode) {
    if (curNode === null || curNode === document)
        return;
    curNode.className = classNames(styles.fullWindow, curNode.className);
    addFullWindowClassToParents(curNode.parentElement);
}
function removeFullWindowClassFromParents(curNode) {
    if (curNode === null || curNode === document)
        return;
    curNode.classList.remove(styles.fullWindow);
    removeFullWindowClassFromParents(curNode.parentElement);
}

exports.Category = Category;
exports.Component = Component;
exports.ComponentPreview = ComponentPreview;
exports.DevSupport = DevSupport;
exports.Palette = Palette;
exports.Previews = Previews;
exports.Variant = Variant;
exports.useCategoryContext = useCategoryContext;
exports.useComponentContext = useComponentContext;
//# sourceMappingURL=index.js.map
