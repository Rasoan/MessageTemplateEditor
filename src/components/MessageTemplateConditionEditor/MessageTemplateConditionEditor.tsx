'use strict'

import * as React from 'react';

import "./MessageTemplateConditionEditor.scss";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";
import {IMessageTemplate} from "../../utils/MessageTemplate/types/MessageTemplate";
import {onKeyDown_or_mouseClick} from "../../utils/utils";
import {useEffect, useRef} from "react";

interface MessageTemplateConditionEditorProps {
    /** Путь к ifThenElse */
    path?: IMessageTemplate.PathToBlock | void,
}

// todo: rename to FieldForEditVariableName, Название параметров тоже переименовать
const MessageTemplateConditionEditor: React.FC<MessageTemplateConditionEditorProps> = (props) => {
    const {
        path,
    } = props;
    const [
        messageTemplate,
        variableName,
        insertedVariablesVersion,
    ] = useBaseStore(stateManager =>
            [
                stateManager.state.messageTemplate,
                stateManager.state.messageTemplate.getDependencyVariableNameForce(path),
                stateManager.state.messageTemplate.lastBlurInformation?.insertedVariablesVersion,
            ],
        shallow,
    );

    const isThisFieldLastBlur = messageTemplate.checkIsLastBlurField(path);
    const ref = useRef<HTMLInputElement>(null);

    /*
        Курсор выставляем в 2 случаях:
         - при первом рендере компонеты выставить курсор (если здесь он был в предыдущей загрузке страницы);
         - после вставки переменной в текстовое поле вернём ему курсор.
    */
    useEffect(() => {
        const {
            lastBlurInformation: {
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
        messageTemplate.setDependencyVariable(
            onChangeEvent.currentTarget.value,
            path,
        );
    };

    const onClick = (onClickEvent: React.MouseEvent<HTMLInputElement>) => {
        onKeyDown_or_mouseClick<HTMLInputElement, React.MouseEvent<HTMLInputElement>>(
            onClickEvent,
            messageTemplate,
            path,
        );
    };

    const onKeyUp = (KeyboardEvent: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown_or_mouseClick<HTMLInputElement, React.KeyboardEvent<HTMLInputElement>>(
            KeyboardEvent,
            messageTemplate,
            path,
        );
    };

    return <>
        <input
            ref={ref}
            className={'messageTemplateConditionEditor'}
            value={variableName}
            onClick={(Event) => onClick(Event)}
            onKeyUp={(Event) => onKeyUp(Event)}
            onChange={onChangeField}
        />
    </>;
}

export default MessageTemplateConditionEditor;
