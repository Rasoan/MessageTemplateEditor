'use strict';

import * as React from 'react';

import StickerForCondition from "../StickerForCondition/StickerForCondition";
import MessageSnippetsBlock from "../MessageSnippetsBlock/MessageSnippetsBlock";
import useBaseStore from "../../store/store";

import {shallow} from "zustand/shallow";

import "./MessageTemplateEditorWidget.scss";
import MessageTemplatePreviewWidget from "../MessageTemplatePreviewWidget/MessageTemplatePreviewWidget";
import MessageTemplate from "../../utils/MessageTemplate/MessageTemplate";
import {IMessageTemplate, MESSAGE_TEMPLATE_BLOCK_TYPE} from "../../utils/MessageTemplate/types/MessageTemplate";

interface MessageTemplateEditorWidgetProps {
    /** асинхронный callback сохранения шаблона */
    callbackSave: () => Promise<void>;
    /** массив имён переменных */
    arrVarNames: string[];
    /** шаблон сообщения */
    template?: MessageTemplate;
}

const MessageTemplateEditorWidget: React.FC<MessageTemplateEditorWidgetProps> = (props) => {
    const {
        callbackSave,
        template,
        arrVarNames: keysOfVariablesList,
    } = props;
    const [] = useBaseStore(
        stateManager => [
            stateManager.state.messageTemplate.previewWidget,
            stateManager.state.messageTemplate.getAllFields().length,
            stateManager.state.isOpenMessageTemplateEditor,
        ],
        shallow,
    );
    const messageTemplate: MessageTemplate = template
        ? template
        : useBaseStore(stateManager => stateManager.state.messageTemplate)
    ;
    const onClickOnVariable = (event: React.MouseEvent<HTMLButtonElement>) => {
        const {
            currentTarget,
        } = event;
        const {
            value,
        } = currentTarget;

        messageTemplate.insertVariableInSubMessage(value);
    }

    return <div
        className={"MessageTemplateEditorWidget"}
    >
        <h2
            className={'MessageTemplateEditorWidget__header header'}
        >
            Message Template Editor PRO
        </h2>
        <div
            className={"MessageTemplateEditorWidget__containerForContent containerForContent"}
        >
            <div
                className={"containerForContent__contentItem contentItem contentItem-listIfThenElse"}
            >
                <div
                    className={'contentItem__variablesContainer variablesContainer'}
                >
                    <>
                        {
                            keysOfVariablesList.map((variableKey, index) => <button
                                className={'variablesContainer__variableButton variableButton'}
                                key={variableKey + index}
                                value={variableKey}
                                onClick={onClickOnVariable}
                            >
                                {`{${variableKey}}`}
                            </button>)
                        }
                    </>
                </div>
                <MessageSnippetsBlock
                    countNested={1}
                    blockType={MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}
                    path={'' as IMessageTemplate.PathToIfThenElse}
                />
            </div>
            <div
                className={"containerForContent__contentItem contentItem contentItem-preview"}
            >
                <MessageTemplatePreviewWidget callbackSave={callbackSave}/>
            </div>
        </div>
    </div>;
}

export default MessageTemplateEditorWidget;