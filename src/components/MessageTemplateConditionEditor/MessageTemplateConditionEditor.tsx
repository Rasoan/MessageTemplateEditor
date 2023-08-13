'use strict'

import * as React from 'react';

import "./MessageTemplateConditionEditor.scss";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";
import {IMessageTemplate} from "../../utils/MessageTemplate/types/MessageTemplate";

interface MessageTemplateConditionEditorProps {
    pathToParentBlock: IMessageTemplate.PathToBlock,
}

// todo: rename to FieldForEditVariableName, Название параметров тоже переименовать
const MessageTemplateConditionEditor: React.FC<MessageTemplateConditionEditorProps> = (props) => {
    const {
        pathToParentBlock,
    } = props;
    const [
        messageTemplate,
        variableName,
    ] = useBaseStore(stateManager =>
            [
                stateManager.state.messageTemplate,
                stateManager.state.messageTemplate.getDependencyVariableNameForce(pathToParentBlock),
            ],
        shallow,
    );

    const onChangeField = (onChangeEvent: React.FormEvent<HTMLInputElement>) => {
        messageTemplate.setDependencyVariable(
            onChangeEvent.currentTarget.value,
            pathToParentBlock,
        );
    };

    return <>
        <input
            className={'messageTemplateConditionEditor'}
            value={variableName}
            onChange={onChangeField}
        />
    </>;
}

export default MessageTemplateConditionEditor;
