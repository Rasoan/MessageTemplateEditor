//
export namespace IMessageTemplate {
    interface Options {
        stateChangeNotify: Function;
        variablesList?: VariablesListDTO;
        messageTemplateJSON?: MessageTemplateJSON;
    }

    type VariablesListDTO = string[];

    /** Части сообщения, некоторые из которых попадут в результирующее сообщение (блок IF_THEN_ELSE) */
    interface IfThenElseBlock {
        /** Путь к ifThenElse блоку. */
        path?: PathToBlock | void,
        /** Название переменной в IF от которой будет зависеть этот блок */
        dependencyVariableName: string;
        /** Блок THEN */
        messageSnippets_THEN: MessageSnippets;
        /** Блок ELSE */
        messageSnippets_ELSE: MessageSnippets;
    }

    /** Информация о родительском ifThenElse  */
    interface ParentIfThenElseInfoForChildIfThenElseBlock {
        path: PathToBlock | void,
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE | void;
    }

    /** Информация о блоке THEN/ELSE или первом поле ввода */
    interface MessageSnippets {
        /** Исходное поле ввода текста в блоке */
        field: MessageFieldDetails,
        blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE | void;
        /**
         * Путь к текущему блоку THEN/ELSE
         * (состоит из пути к родительскому ifThenElse + тип текущего блока) (void 0 если это исходный первый блок).
         */
        path?: PathToBlock | void,
        /** Дополнительное (после разбития исходного поля отображается) поле ввода текста в блоке */
        fieldAdditional?: MessageAdditionalFieldDetails,
    }

    interface MessageFieldDetails {
        fieldType: MESSAGE_TEMPLATE_FIELD_TYPE,
        /** Текст сообщения */
        message: string,
        /** Номер позиции в результирующем сообщении */
        positionInResultMessage: number,
        /** true если поле можно разбить на 2 и закинуть IF_THEN_ELSE между */
        isCanSplit: boolean;
    }

    interface LastBlurInformation {
        cursorPosition: number;
        /** Путь к родительскому блоку ifThenElse выделенного field */
        pathToIfThenElseBlock?: IMessageTemplate.PathToBlock | void;
        /** void 0 если выделили field от IF */
        snippetMessageInformation?: LastBlurSnippetMessageInformation;
        /**
         * При вставке переменной в текстовое поле версия обновится,
         * что бы текстовое поле узнало о том,
         * что была вставлена переменная и сработал focus().
         */
        insertedVariablesVersion: number;
    }

    interface LastBlurSnippetMessageInformation {
        fieldType: MESSAGE_TEMPLATE_FIELD_TYPE;
        /** void 0 если это самый первый блок */
        blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE | void;
    }

    /** Дополнительное (после разбития исходного поля отображается) поле ввода текста в блоке */
    type MessageAdditionalFieldDetails = MessageFieldDetails & { isCanSplit: false }

    /**
     * Путь к родительскому блоку (включая его самого) от самого начала дерева.
     * Выглядит так "1/2/1/1/2", где каждое число - это тип родительского блока на соответствующем уровне {@link MESSAGE_TEMPLATE_BLOCK_TYPE}
    */
    type PathToBlock = Opaque<string, 'PathToThisBlock'>;

    /**
     * Ключ для хранения данных о блоке IF_THEN_ELSE в map-е.
     *
     * Выглядит так "1/2/1/1/2{@link KEY_POSTFIX_SUBSTRING}",
     * где каждое число - это тип родительского блока на соответствующем уровне
     * (включая родителя в которого вложен) {@link MESSAGE_TEMPLATE_BLOCK_TYPE}
     */
    type KeyIfThenElseBlock = Opaque<string, 'KeyMessageSnippets'>;
}

type Opaque<T, OpaqueName> = T & {
    __TYPE__: OpaqueName;
};

/** Тип поля ввода */
export const enum MESSAGE_TEMPLATE_FIELD_TYPE {
    /** Исходное поле ввода */
    INITIAL = 1,
    /** Дополнительное (появляется после дробления исходного) */
    ADDITIONAL = 2,
}

/** Тип блока */
export const enum MESSAGE_TEMPLATE_BLOCK_TYPE {
    /** если блок не принадлежит ни к THEN, ни к ELSE (например - блок на самом верхнем уровне) */
    // NULL = 0,
    /** если блок является сущностью THEN */
    THEN = 1,
    /** если блок является сущностью ELSE */
    ELSE = 2,
}

export const enum IfThenElseBlockInfoDTO_Props {
    key = 0,
    ifThenElseBlockDTO = 1,

    __SIZE__ = 2,
}

export type IfThenElseBlockInfoDTO = [
    key: IMessageTemplate.KeyIfThenElseBlock,
    ifThenElseBlockDTO: IfThenElseBlockDTO,
];

export const enum VariableInfoDTO_Props {
    key = 0,
    value = 1,

    __SIZE__ = 3,
}

export type VariableInfoDTO = [
    key: string,
    value: string,
];

export type VariableInfoJSON = VariableInfoDTO;

export interface IfThenElseBlockInfoJSON {
    key: IMessageTemplate.KeyIfThenElseBlock;
    ifThenElseBlock: IMessageTemplate.IfThenElseBlock;
}

export const enum IfThenElseBlockDTO_Props {
    path = 0,
    dependencyVariableName = 1,
    messageSnippets_THEN = 2,
    messageSnippets_ELSE = 3,

    __SIZE__ = 4
}

export type IfThenElseBlockDTO = [
    path: IMessageTemplate.PathToBlock | void,
    dependencyVariableName: string,
    messageSnippets_THEN: MessageSnippetsDTO,
    messageSnippets_ELSE: MessageSnippetsDTO,
];

export const enum MessageSnippetsDTO_Props {
    blockType = 0,
    path = 1,
    field = 2,
    fieldAdditional = 3,

    __SIZE__ = 4
}

export type MessageSnippetsDTO = [
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE | void,
    path: IMessageTemplate.PathToBlock | void,
    field: MessageFieldDetailsDTO,
    fieldAdditional: MessageFieldDetailsDTO,
];

export const enum MessageFieldDetailsDTO_Props {
    message = 0,
    fieldType = 1,
    positionInResultMessage = 2,
    isCanSplit = 3,

    __SIZE__ = 4
}

export type MessageFieldDetailsDTO = [
    message: string,
    fieldType: MESSAGE_TEMPLATE_FIELD_TYPE,
    positionInResultMessage: number,
    isCanSplit: boolean,
];

export const enum MessageTemplateDTO_Props {
    ifThenElseDTOList = 0,
    defaultMessageSnippets = 1,
    lastBlurSnippetMessageInformation = 2,

    __SIZE__ = 3,
}

export type MessageTemplateDTO = [
    ifThenElseDTOList: IfThenElseBlockInfoDTO[],
    defaultMessageSnippets: MessageSnippetsDTO,
    lastBlurInformation: LastBlurInformationDTO,
];

export const enum LastBlurSnippetMessageInformationDTO_Props {
    fieldType = 0,
    /** void 0 если это самый первый блок */
    blockType = 1,

    __SIZE__ = 2
}

export type LastBlurSnippetMessageInformationDTO = [
    fieldType: MESSAGE_TEMPLATE_FIELD_TYPE,
    /** void 0 если это самый первый блок */
    blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE | void,
]

export const enum LastBlurInformationDTO_Props {
    pathToIfThenElseBlock = 0,
    cursorPosition = 1,
    insertedVariablesVersion = 2,
    snippetMessageInformationDTO = 3,

    __SIZE__ = 4
}

export type LastBlurInformationDTO = [
    pathToIfThenElseBlock: IMessageTemplate.PathToBlock | void,
    cursorPosition: number,
    insertedVariablesVersion: number,
    snippetMessageInformationDTO?: LastBlurSnippetMessageInformationDTO | void,
];

export interface MessageTemplateJSON {
    ifThenElseBlockInfoListJSON: IfThenElseBlockInfoJSON[];
    defaultMessageSnippets: IMessageTemplate.MessageSnippets;
    lastBlurInformation: IMessageTemplate.LastBlurInformation;
}
