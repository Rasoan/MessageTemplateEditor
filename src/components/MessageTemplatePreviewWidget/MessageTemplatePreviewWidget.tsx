'use strict';

import * as React from "react";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";

import './MessageTemplatePreviewWidget.scss';
import VariableValueEditor from "../VariableValueEditor/VariableValueEditor";
import Modal from "../Modal/Modal";

const MessageTemplatePreviewWidget: React.FC = () => {
    const [
        messageTemplate,
        previewWidget,
    ] = useBaseStore(stateManager =>
            [
                stateManager.state.messageTemplate,
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

    return <>
        <div
            className={'MessageTemplatePreviewWidget'}
        >
            <div className={'MessageTemplatePreviewWidget__previewWidgetContainer previewWidgetContainer'}>
            <div
                className={'previewWidgetContainer__text previewWidgetContainerText'}
            >
                <span>{previewWidget}</span>
            </div>
            </div>
            <div className={'MessageTemplatePreviewWidget__variablesContainer variablesContainer'}>
                <span
                    className={'variablesContainer__variablesHeader variablesHeader'}
                >
                    Linkedin variables:
                </span>
                {variables}
            </div>
        </div>
    </>
}

export default MessageTemplatePreviewWidget;