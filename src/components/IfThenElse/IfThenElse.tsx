'use strict';

import * as React from 'react';
import StickerForCondition from "../StickerForCondition/StickerForCondition";
import MessageTemplateConditionEditor from "../MessageTemplateConditionEditor/MessageTemplateConditionEditor";
import {
    IMessageTemplate,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
    MESSAGE_TEMPLATE_FIELD_TYPE
} from "../../utils/MessageTemplate/types/MessageTemplate";
import MessageSnippetsBlock from "../MessageSnippetsBlock/MessageSnippetsBlock";
import {MAX_RECURSION_OF_NESTED_BLOCKS} from "../../utils/constants";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";

import "./IfThenElse.scss";
import MessageTemplate from "../../utils/MessageTemplate/MessageTemplate";

interface IfThenElseProps {
    /**
     * Путь к родительскому блоку (void 0 если самый первый ifThenElse), именно к родительскому блоку, а не к ifThenElse
    */
    path?: IMessageTemplate.PathToBlock | void;
    /** Количество вложенности (это технический параметр - страхуемся от зацикливания) {@link MAX_RECURSION_OF_NESTED_BLOCKS} */
    countNested: number,
}

const IfThenElse: React.FC<IfThenElseProps> = (props) => {
    const {
        path,
        countNested,
    } = props;
    const [
        ifThenElse,
        messageTemplate,
    ] = useBaseStore(
        (stateManager) => [
            stateManager.state.messageTemplate.getIfThenElse(path),
            stateManager.state.messageTemplate,
        ],
        shallow,
    );

    // после удаления текущего ifThenElse он станет void 0
    if (!ifThenElse) {
        return <></>;
    }

    const {
        messageSnippets_THEN: {
            blockType: blockTypeTHEN,
        },
        messageSnippets_ELSE: {
            blockType: blockTypeELSE,
        },
    } = ifThenElse;

    MessageTemplate.checkMaxNestedIfThenElse(countNested);

    const undoBlockBreaking = () => {
        messageTemplate.deleteIfThenElse(path);
    }

    return <div className={"IfThenElse"}>
        <button
            className={"IfThenElse__buttonDeleter buttonDeleter"}
            onClick={undoBlockBreaking}
        >
            Delete
        </button>
        <div
            className={"IfThenElse__wrapperContent wrapperContent"}
        >
            <div className={"wrapperContent__if conditionalBlock conditionalBlockIf"}>
                <div
                    className={'conditionalBlock__stickerForConditionContainer stickerForConditionContainer'}
                >
                    <StickerForCondition content={'if'}/>
                </div>
                <MessageTemplateConditionEditor
                    path={path}
                />
            </div>
            <div className={"wrapperContent__conditionalBlock conditionalBlock conditionalBlockThen"}>
                <div className={"conditionalBlock__stickerForConditionContainer stickerForConditionContainer"}>
                    <StickerForCondition content={'then'}/>
                </div>
                <MessageSnippetsBlock
                    path={path}
                    blockType={blockTypeTHEN}
                    // увеличим счётчик вложенности ifThenElse в ifThenElse на 1
                    countNested={countNested + 1}
                />
            </div>
            <div className={"wrapperContent__conditionalBlock conditionalBlock conditionalBlockElse"}>
                <div className={"conditionalBlock__stickerForConditionContainer stickerForConditionContainer"}>
                    <StickerForCondition content={'else'}/>
                </div>
                <MessageSnippetsBlock
                    path={path}
                    blockType={blockTypeELSE}
                    // увеличим счётчик вложенности ifThenElse в ifThenElse на 1
                    countNested={countNested + 1}
                />
            </div>
        </div>
    </div>
};

export default IfThenElse;
