'use strict';

import * as React from "react";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";

import './MessageTemplatePreviewWidget.scss';
import VariableValueEditor from "../VariableValueEditor/VariableValueEditor";

interface MessageTemplatePreviewWidgetProps {
    /** асинхронный callback сохранения шаблона */
    callbackSave: () => Promise<void>;
}

const MessageTemplatePreviewWidget: React.FC<MessageTemplatePreviewWidgetProps> = (props) => {
    const {
        callbackSave,
    } = props;
    const [
        messageTemplate,
        previewWidget,
        setIsOpenMessageTemplateEditor,
    ] = useBaseStore(stateManager =>
            [
                stateManager.state.messageTemplate,
                stateManager.state.messageTemplate.previewWidget,
                stateManager.state.setIsOpenMessageTemplateEditor,
            ],
        shallow,
    );

    const variables = messageTemplate.variablesKeysList.map((variable, index) => {
        return <VariableValueEditor
            key={variable + index}
            variableKey={variable}
        />
    });

    const handleCloseMessageTemplateEditorWidget = () => {
        setIsOpenMessageTemplateEditor(false);
    }

    return <>
        <div
            className={'MessageTemplatePreviewWidget'}
        >
            <div
                className={'MessageTemplatePreviewWidget__controlPanel controlPanel'}
            >
                <button
                    className={'controlPanel__controlButton controlButton controlButton-left'}
                    onClick={callbackSave}
                >
                    Save
                </button>
                <button
                    className={'controlPanel__controlButton controlButton controlButton-right'}
                    onClick={handleCloseMessageTemplateEditorWidget}
                    title={'Перед нажатием убедитесь, что сохранили редактор шаблона сообщений!'}
                >
                    Close
                </button>
            </div>
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
                    Linkedin variables
                </span>
                {variables}
            </div>
        </div>
    </>
}

export default MessageTemplatePreviewWidget;