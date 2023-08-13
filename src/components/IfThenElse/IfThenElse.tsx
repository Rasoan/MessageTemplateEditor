'use strict';

import * as React from 'react';
import StickerForCondition from "../StickerForCondition/StickerForCondition";
import MessageTemplateConditionEditor from "../MessageTemplateConditionEditor/MessageTemplateConditionEditor";
import {IMessageTemplate, MESSAGE_TEMPLATE_BLOCK_TYPE} from "../../utils/MessageTemplate/types/MessageTemplate";
import MessageSnippetsBlock from "../MessageSnippetsBlock/MessageSnippetsBlock";
import {MAX_RECURSION_OF_NESTED_BLOCKS} from "../../utils/constants";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";

import "./IfThenElse.scss";

interface IfThenElseProps {
    /** Путь к родительскому блоку (void 0 если самый первый ifThenElse) */
    pathToParentBlock?: IMessageTemplate.PathToBlock;
    /** Количество вложенности (это технический параметр - страхуемся от зацикливания) {@link MAX_RECURSION_OF_NESTED_BLOCKS} */
    countNested: number,
}

const IfThenElse: React.FC<IfThenElseProps> = (props) => {
    const {
        pathToParentBlock,
        countNested,
    } = props;

    if (countNested > MAX_RECURSION_OF_NESTED_BLOCKS) {
        const textError = 'Превышен порог максимальной вложенности ifThenElse друг в друга, программа зациклилась!';

        // todo: я бы сделал так, нужно поставить фиксатор на ограничение рекурсивной вложенности,
        //  но поскольку этого в ТЗ нет, ограничусь console.error.
        //throw new Error(textError);

        console.error(textError);
    }

    return <div className={"conditionalBlock"}>
        <div className={"conditionalBlock__if conditionalBlockIf"}>
            <StickerForCondition content={'if'} />
            <MessageTemplateConditionEditor
                pathToParentBlock={pathToParentBlock}
            />
        </div>
        <div className={"conditionalBlock__then conditionalBlockThen"}>
            <div className={"conditionalBlockThen__header"}>
                <StickerForCondition content={'then'}/>
            </div>
            <MessageSnippetsBlock
                pathToParentBlock={pathToParentBlock}
                blockType={MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}
                // увеличим счётчик вложенности ifThenElse в ifThenElse на 1
                countNested={countNested + 1}
            />
        </div>
        <div className={"conditionalBlock__else conditionalBlockElse"}>
            <div className={"conditionalBlockElse__header"}>
                <StickerForCondition content={'else'} />
            </div>
            <MessageSnippetsBlock
                pathToParentBlock={pathToParentBlock}
                blockType={MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}
                // увеличим счётчик вложенности ifThenElse в ifThenElse на 1
                countNested={countNested + 1}
            />
        </div>
    </div>
};

export default IfThenElse;
