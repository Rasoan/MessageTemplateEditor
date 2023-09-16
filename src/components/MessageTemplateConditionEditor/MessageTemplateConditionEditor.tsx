'use strict'

import * as React from 'react';

import "./MessageTemplateConditionEditor.scss";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";
import {IMessageTemplate, MESSAGE_TEMPLATE_BLOCK_TYPE} from "../../utils/MessageTemplate/types/MessageTemplate";
import {onKeyDown_or_mouseClick} from "../../utils/utils";
import {useEffect, useRef} from "react";

interface MessageTemplateConditionEditorProps {
    /** Путь к ifThenElse */
    pathToIfThenElse: IMessageTemplate.PathToIfThenElse,
}

const MessageTemplateConditionEditor: React.FC<MessageTemplateConditionEditorProps> = (props) => {
    const {
        pathToIfThenElse,
    } = props;
    const [
        messageTemplate,
        variableName,
        insertedVariablesVersion,
    ] = useBaseStore(stateManager =>
            [
                stateManager.state.messageTemplate,
                stateManager.state.messageTemplate.getDependencyVariableNameForce(pathToIfThenElse),
                stateManager.state.messageTemplate.lastBlurInfo.version,
            ],
        shallow,
    );

    const isThisFieldLastBlur = messageTemplate.checkIsLastBlurField(
        MESSAGE_TEMPLATE_BLOCK_TYPE.NULL,
        pathToIfThenElse,
    );
    const ref = useRef<HTMLInputElement>(null);

    /*
        Курсор выставляем в 2 случаях:
         - при первом рендере компонеты выставить курсор (если здесь он был в предыдущей загрузке страницы);
         - после вставки переменной в текстовое поле вернём ему курсор.
    */
    useEffect(() => {
        const {
            lastBlurInfo: {
                cursorPosition,
            },
        }  = messageTemplate;

        if (isThisFieldLastBlur) {
            const {
                current,
            } = ref;

            if (current) {
                current.focus();

                current.selectionStart = cursorPosition;
                current.selectionEnd = cursorPosition;
            }
        }
    }, [ insertedVariablesVersion ]);

    const onChangeField = (onChangeEvent: React.FormEvent<HTMLInputElement>) => {
        messageTemplate.setMessageSnippetOrVariableValue(
            onChangeEvent.currentTarget.value,
            MESSAGE_TEMPLATE_BLOCK_TYPE.NULL,
            pathToIfThenElse,
        );
    };

    const onClick = (onClickEvent: React.MouseEvent<HTMLInputElement>) => {
        onKeyDown_or_mouseClick<HTMLInputElement, React.MouseEvent<HTMLInputElement>>(
            onClickEvent,
            messageTemplate,
            MESSAGE_TEMPLATE_BLOCK_TYPE.NULL,
            pathToIfThenElse,
        );
    };

    const onKeyUp = (KeyboardEvent: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown_or_mouseClick<HTMLInputElement, React.KeyboardEvent<HTMLInputElement>>(
            KeyboardEvent,
            messageTemplate,
            MESSAGE_TEMPLATE_BLOCK_TYPE.NULL,
            pathToIfThenElse,
        );
    };

    return <>
        <input
            ref={ref}
            className={'MessageTemplateConditionEditor'}
            value={variableName}
            onClick={(Event) => onClick(Event)}
            onKeyUp={(Event) => onKeyUp(Event)}
            onChange={onChangeField}
        />
    </>;
}

export default MessageTemplateConditionEditor;
