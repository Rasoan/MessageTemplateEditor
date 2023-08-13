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
    pathToParentBlock: IMessageTemplate.PathToBlock;
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE;
    fieldType: MESSAGE_TEMPLATE_FIELD_TYPE;
}

// todo: rename to MessageEditor
const MessageTemplateEditor: React.FC<MessageTemplateEditorProps> = (props) => {
    const {
        pathToParentBlock,
        blockType,
        fieldType,
    } = props;
    const [
        messageTemplate,
        message,
    ] = useBaseStore(
        (stateManager) => [
            stateManager.state.messageTemplate,
            stateManager.state.messageTemplate.getBlockInformationForce(
                pathToParentBlock,
                blockType,
            )[fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL ? 'field' : 'fieldAdditional'].message,
        ],
        shallow,
    );

    const ref = useRef<HTMLTextAreaElement>(null);

    const onChangeField = (onChangeEvent: React.FormEvent<HTMLTextAreaElement>) => {
        messageTemplate.setSnippetMessage(
            onChangeEvent.currentTarget.value,
            {
                pathToParentBlock,
                currentBlockType: blockType,
                fieldType: MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL,
            }
        );
    };
    const onChangeCursorPosition = (onChangeCursorPositionEvent: KeyboardEvent) => {
        messageTemplate.setLastBlurSnippetMessageInformation({
            blockType,
            fieldType,
            pathToParentBlock,
            cursorPosition: 3,
        });
    };

    useEffect(() => {
        ref.current.addEventListener('keydown', onChangeCursorPosition);

        return () => {
            ref.current.removeEventListener('keydown', onChangeCursorPosition);
        };
    }, []);

    return <>
        <TextareaAutosize
            ref={ref}
            className={'messageTemplateEditor'}
            value={message}
            onChange={onChangeField}
        />
    </>;
}

export default MessageTemplateEditor;
