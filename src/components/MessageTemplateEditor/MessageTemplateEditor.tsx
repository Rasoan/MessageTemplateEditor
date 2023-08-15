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
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE;
    fieldType: MESSAGE_TEMPLATE_FIELD_TYPE;
    path?: IMessageTemplate.PathToBlock;
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
    ] = useBaseStore(
        (stateManager) => [
            stateManager.state.messageTemplate,
            stateManager.state.messageTemplate.getBlockInformationForce(
                path,
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
