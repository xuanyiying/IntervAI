/// <reference types="react" />
export declare enum PropsControlTypes {
    Checkbox = "checkbox",
    Input = "input",
    Radio = "radio",
    Select = "select",
    Textarea = "textarea",
    JsonEditor = "jsonEditor"
}
export declare type ControlInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
export declare type ControlSelectHandler = (event: React.ChangeEvent<HTMLSelectElement>) => void;
export declare type ControlTextareaHandler = (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
export declare type ControlJsonHandler = (propName: string, propValue: string) => void;
export declare type ControlUnionHandler = ControlInputHandler | ControlSelectHandler | ControlTextareaHandler | ControlJsonHandler;
declare type PropEditSelect = {
    controlType: PropsControlTypes.Select;
    data?: string[] | number[];
};
declare type PropEditInput = {
    controlType: PropsControlTypes.Input;
    data?: string | number;
};
declare type PropEditRadio = {
    controlType: PropsControlTypes.Radio;
    data?: string[] | number[];
};
declare type PropEditTextarea = {
    controlType: PropsControlTypes.Textarea;
    data?: string | number;
};
declare type PropEditCheckbox = {
    controlType: PropsControlTypes.Checkbox;
    data?: boolean;
};
declare type PropEditJson = {
    controlType: PropsControlTypes.JsonEditor;
    data?: ComponentPreviewProps;
};
declare type PropsEditItem = PropEditInput | PropEditTextarea | PropEditSelect | PropEditRadio | PropEditCheckbox | PropEditJson;
export declare type TableItemControlData = number[] | string[] | ComponentPreviewProps;
export declare type ComponentPreviewProps = {
    [propsName: string]: unknown;
} | null;
export declare type ToolsPropsModifier = {
    initialProps?: ComponentPreviewProps;
    props?: ComponentPreviewProps;
    propsEditInfo?: PropsEditInfo;
    updateProps?: (updatedProps: ComponentPreviewProps) => void;
} | null;
export declare type PropsModifier = {
    props: ComponentPreviewProps;
    updateProps: (updatedProps: ComponentPreviewProps) => void;
} | null;
export declare type PropsEditInfo = {
    [propsName: string]: PropsEditItem;
};
export {};
