'use strict';

import * as React from "react";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";

import './MessageTemplatePreviewWidget.scss';
import VariableValueEditor from "../VariableValueEditor/VariableValueEditor";
import Modal from "../Modal/Modal";

const _MessageTemplatePreviewWidget: React.FC = () => {
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
                    Variables:
                </span>
                {variables}
            </div>
            <button
                className={'MessageTemplatePreviewWidget__buttonClose buttonClose'}
                onClick={() => {
                    setIsOpenMessageTemplatePreviewWidget(false);
                    clearVariablesValue();
                }}
            >
                Close
            </button>
        </div>
    </>
}

const MessageTemplatePreviewWidget: React.FC = () => {
    const setIsOpenMessageTemplatePreviewWidget = useBaseStore(
        stateManager => stateManager.state.setIsOpenMessageTemplatePreviewWidget
    );

    return <Modal
        isShowing={true}
        close={() => setIsOpenMessageTemplatePreviewWidget(false)}
        component={<_MessageTemplatePreviewWidget />}
    />
}
export default MessageTemplatePreviewWidget;