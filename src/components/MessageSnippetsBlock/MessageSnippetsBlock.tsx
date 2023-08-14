'use strict';

import * as React from 'react';

import MessageTemplateEditor from "../MessageTemplateEditor/MessageTemplateEditor";

import IfThenElse from "../IfThenElse/IfThenElse";
import {
    IMessageTemplate,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
    MESSAGE_TEMPLATE_FIELD_TYPE
} from "../../utils/MessageTemplate/types/MessageTemplate";

import "./MessageSnippetsBlock.scss";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";
import MessageTemplate from "../../utils/MessageTemplate/MessageTemplate";

interface MessageSnippetsBlockProps {
    /** Количество вложенности (это технический параметр - страхуемся от зацикливания) {@link MAX_RECURSION_OF_NESTED_BLOCKS} */
    countNested: number,
    /** Путь к родительскому блоку */
    pathToParentBlock?: IMessageTemplate.PathToBlock,
    /** Тип блока */
    blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE,
}

const MessageSnippetsBlock: React.FC<MessageSnippetsBlockProps> = (props) => {
    const {
        pathToParentBlock,
        blockType,
        countNested,
    } = props;
    const [ messageTemplate ] = useBaseStore(
        (stateManager) => [
            stateManager.state.messageTemplate,
            stateManager.state.messageTemplate.countIfThenElseBlocks,
        ],
        shallow,
    );
    const blockInformation = messageTemplate.getBlockInformationForce(
        pathToParentBlock,
        blockType,
    );
    const {
        field,
        fieldAdditional,
    } = blockInformation;
    const {
        message: field_message,
        isCanSplit: field_isCanSplit,
        positionInResultMessage: field_positionInResultMessage,
    } = field;
    const {
        message: fieldAdditional_message,
        isCanSplit: fieldAdditional_isCanSplit,
        positionInResultMessage: fieldAdditional_positionInResultMessage,
    } = fieldAdditional || {};

    return <div>
        <MessageTemplateEditor
            isCanSplit={field_isCanSplit}
            pathToParentBlock={pathToParentBlock}
            blockType={blockType}
            fieldType={MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL}
        />
        {
            // если поле нельзя разбить, то оно уже разбито, тогда отрисуем дополнительные элементы (IF_THEN_ELSE и второй осколок разбитого поля)
            !field_isCanSplit
                ? <>
                    <IfThenElse
                        countNested={countNested}
                        // todo: здесь мы должны прокидывать готовый путь, он должен быть готовым, а не переданным, мы фактически игнорируем эти пути у стейта
                        pathToParentBlock={MessageTemplate.createPathForIfThenElseBlock(
                            blockType,
                            pathToParentBlock
                        )}
                    />
                    <MessageTemplateEditor
                        isCanSplit={fieldAdditional_isCanSplit}
                        pathToParentBlock={pathToParentBlock}
                        blockType={blockType}
                        fieldType={MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL}
                    />
                </>
                : null
        }
    </div>;
}

export default MessageSnippetsBlock;