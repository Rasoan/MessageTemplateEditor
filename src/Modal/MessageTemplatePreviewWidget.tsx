'use strict';

import * as React from "react";
import useBaseStore from "../store/store";
import {shallow} from "zustand/shallow";

import './MessageTemplatePreviewWidget.scss';
import VariableValueEditor from "../components/VariableValueEditor/VariableValueEditor";

const MessageTemplatePreviewWidget: React.FC = () => {
    const [
        messageTemplate,
        clearVariablesValue,
        setIsOpenMessageTemplatePreviewWidget,
        previewWidget,
    ] = useBaseStore(stateManager =>
            [
                stateManager.state.messageTemplate,
                stateManager.state.messageTemplate.clearVariablesValue,
                stateManager.state.setIsOpenMessageTemplatePreviewWidget,
                stateManager.state.messageTemplate.previewWidget,
            ],
        shallow,
    );

    const variables = messageTemplate.variablesKeysList.map((variable, index) => {
        return <VariableValueEditor
            key={variable + index}
            variableKey={variable}
        />
    });

    return <div
        className={'MessageTemplatePreviewWidget'}
    >
        <div>
            <span>{previewWidget}</span>
        </div>
        <div>
            <span>Variables:</span>
            {variables}
        </div>
        <button
            onClick={() => {
                setIsOpenMessageTemplatePreviewWidget(false);
                clearVariablesValue();
            }}
        >
            Close
        </button>
    </div>
}

export default MessageTemplatePreviewWidget;
