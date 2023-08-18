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
        positionInResultMessage,
        isCanSplit,
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
            )[fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL ? 'field' : 'fieldAdditional'].positionInResultMessage,
            stateManager.state.messageTemplate.getBlockInformationForce(
                path,
                blockType,
            )[fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL ? 'field' : 'fieldAdditional'].isCanSplit,
            stateManager.state.messageTemplate.lastBlurSnippetMessageInformation.pathToIfThenElseBlock,
            stateManager.state.messageTemplate.lastBlurSnippetMessageInformation.blockType,
            stateManager.state.messageTemplate.lastBlurSnippetMessageInformation.fieldType,
        ],
        shallow,
    );

    const ref = useRef<HTMLTextAreaElement>(null);

    const isThisFieldLastBlur = messageTemplate.checkIsLastBlurField(
        fieldType,
        path,
        blockType,
    );

    useEffect(() => {
        const {
            lastBlurSnippetMessageInformation: { cursorPosition}
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
    }, [ isCanSplit ]);

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
    const onKeyDown = (keyboardEvent: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const {
            target,
        } = keyboardEvent;
        const {
            selectionStart,
            selectionEnd,
            selectionDirection,
        } = target as HTMLTextAreaElement;

        messageTemplate.setLastBlurSnippetMessageInformation({
            blockType,
            fieldType,
            pathToIfThenElseBlock: path,
            cursorPosition: _calculateCursorPosition(selectionStart, selectionEnd, selectionDirection),
        });
    };
    const onClick = (onClickEvent: React.MouseEvent<HTMLTextAreaElement>) => {
        const {
            target,
        } = onClickEvent;
        const {
            selectionStart,
            selectionEnd,
            selectionDirection,
        } = target as HTMLTextAreaElement;

        messageTemplate.setLastBlurSnippetMessageInformation({
            blockType,
            fieldType,
            pathToIfThenElseBlock: path,
            cursorPosition: _calculateCursorPosition(selectionStart, selectionEnd, selectionDirection),
        });
    };

    let classBrokenIndicatorForHoverEffect: string;

    if (isThisFieldLastBlur) {
        // На эти модификаторы вешается hover-эффект (подробности см. в соседнем css файле)
        classBrokenIndicatorForHoverEffect = `MessageTemplateEditor${isCanSplit ? '-canSplit' : '-canNotSplit'}`;
    }

    return <>
        {
            // todo: убрать дебажный span ниже
        }
        <span>positionInResultMessage: {positionInResultMessage}</span>
        <TextareaAutosize
            ref={ref}
            onClick={onClick}
            onKeyUp={onKeyDown}
            className={`MessageTemplateEditor ${classBrokenIndicatorForHoverEffect}`}
            value={message}
            onChange={onChangeField}
        />
    </>;
}

export default MessageTemplateEditor;

const enum SELECTION_DIRECTION {
    /** Выделение вперёд */
    Forward = "forward",
    /** Выделение назад */
    Backward = "backward",
    None = "none",
}

function _calculateCursorPosition(selectionStart: number, selectionEnd: number, selectionDirection: string) {
    switch (selectionDirection as SELECTION_DIRECTION) {
        case SELECTION_DIRECTION.Forward: {
            /*
                Если мы, выделили текст слева на право "===>", наверняка мы надеемся,
                что в левой части окажется всё,
                что ДО выделения включая выделенный текст.
             */
            return selectionEnd;
        }
        case SELECTION_DIRECTION.Backward: {
            /*
                Если мы, выделили текст справа на лево "<===", наверняка мы надеемся,
                что в левой части окажется всё,
                что оказалось ПЕРЕД выделенным текстом НЕ включая выделенный текст
             */
            return selectionStart;
        }
    }

    return selectionEnd;
}
