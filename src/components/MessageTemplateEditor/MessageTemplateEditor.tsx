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
        lastBlurSnippet_pathToIfThenElseBlock,
        lastBlurSnippet_blockType,
        lastBlurSnippet_fieldType,
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

    const onChangeField = (onChangeEvent: React.FormEvent<HTMLTextAreaElement>) => {
        messageTemplate.setSnippetMessage(
            onChangeEvent.currentTarget.value,
            {
                path,
                currentBlockType: blockType,
                fieldType,
            }
        );
    };
    const onChangeCursorPosition = (onChangeCursorPositionEvent: KeyboardEvent) => {
        messageTemplate.setLastBlurSnippetMessageInformation({
            blockType,
            fieldType,
            pathToIfThenElseBlock: path,
            cursorPosition: 1,
        });
    };

    useEffect(() => {
        ref.current?.addEventListener('keydown', onChangeCursorPosition);

        return () => {
            ref.current?.removeEventListener('keydown', onChangeCursorPosition);
        };
    }, []);

    let classBrokenIndicatorForHoverEffect: string;

    if (
        path === lastBlurSnippet_pathToIfThenElseBlock
        && blockType === lastBlurSnippet_blockType
        && fieldType === lastBlurSnippet_fieldType
    ) {
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
            className={`MessageTemplateEditor ${classBrokenIndicatorForHoverEffect}`}
            value={message}
            onChange={onChangeField}
        />
    </>;
}

export default MessageTemplateEditor;
