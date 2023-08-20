'use strict';

import * as React from 'react';
import {useEffect, useRef} from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import "./MessageTemplateEditor.scss";
import {
    IMessageTemplate,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
    MESSAGE_TEMPLATE_FIELD_TYPE
} from "../../utils/MessageTemplate/types/MessageTemplate";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";
import {onKeyDown_or_mouseClick} from "../../utils/utils";

interface MessageTemplateEditorProps {
    /** true если можно разбить на 2 */
    isCanSplit: boolean;
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE | void;
    fieldType: MESSAGE_TEMPLATE_FIELD_TYPE;
    path?: IMessageTemplate.PathToBlock | void;
}

// todo: rename to MessageEditor
const MessageTemplateEditor: React.FC<MessageTemplateEditorProps> = (props) => {
    const {
        path,
        blockType,
        fieldType,
    } = props;
    const [
        messageTemplate,
        message,
        isCanSplit,
        insertedVariablesVersion,
    ] = useBaseStore(
        (stateManager) => [
            stateManager.state.messageTemplate,
            stateManager.state.messageTemplate.getBlockInformationForce(
                path,
                blockType,
            )[fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL ? 'field' : 'fieldAdditional'].message,
            stateManager.state.messageTemplate.getBlockInformationForce(
                path,
                blockType,
            )[fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL ? 'field' : 'fieldAdditional'].isCanSplit,
            stateManager.state.messageTemplate.lastBlurInformation?.insertedVariablesVersion,
            stateManager.state.messageTemplate.lastBlurInformation.pathToIfThenElseBlock,
            stateManager.state.messageTemplate.lastBlurInformation?.snippetMessageInformation?.fieldType,
            stateManager.state.messageTemplate.lastBlurInformation?.snippetMessageInformation?.blockType,
        ],
        shallow,
    );

    const ref = useRef<HTMLTextAreaElement>(null);

    const isThisFieldLastBlur = messageTemplate.checkIsLastBlurField(
        path,
        fieldType,
        blockType,
    );

    /*
        Курсор выставляем в 3 случаях:
         - при первом рендере компонеты выставить курсор (если здесь он был в предыдущей загрузке страницы);
         - если удалили ifThenElse, то кинем курсор в родительский блок
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
    }, [ isCanSplit, insertedVariablesVersion ]);

    const onChangeField = (onChangeEvent: React.FormEvent<HTMLTextAreaElement>) => {
        const {
            target,
        } = onChangeEvent;
        const {
            value,
        } = target as HTMLTextAreaElement;

        messageTemplate.setSnippetMessage(
            value,
            {
                path,
                currentBlockType: blockType,
                fieldType,
            }
        );
    };

    let classBrokenIndicatorForHoverEffect: string;

    if (isThisFieldLastBlur) {
        // На эти модификаторы вешается hover-эффект (подробности см. в соседнем css файле)
        classBrokenIndicatorForHoverEffect = `MessageTemplateEditor${isCanSplit ? '-canSplit' : '-canNotSplit'}`;
    }

    const onClick = (onClickEvent: React.MouseEvent<HTMLTextAreaElement>) => {
        onKeyDown_or_mouseClick<HTMLTextAreaElement, React.MouseEvent<HTMLTextAreaElement>>(
            onClickEvent,
            messageTemplate,
            path,
            {
                fieldType,
                blockType,
            },
        );
    };

    const onKeyUp = (KeyboardEvent: React.KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown_or_mouseClick<HTMLTextAreaElement, React.KeyboardEvent<HTMLTextAreaElement>>(
            KeyboardEvent,
            messageTemplate,
            path,
            {
                fieldType,
                blockType,
            },
        );
    };

    return <>
        <TextareaAutosize
            ref={ref}
            onClick={(Event) => onClick(Event)}
            onKeyUp={(Event) => onKeyUp(Event)}
            className={`MessageTemplateEditor ${classBrokenIndicatorForHoverEffect}`}
            value={message}
            onChange={onChangeField}
        />
    </>;
}

export default MessageTemplateEditor;
