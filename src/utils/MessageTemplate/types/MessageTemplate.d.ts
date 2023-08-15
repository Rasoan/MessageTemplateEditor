//
export namespace IMessageTemplate {
    interface Options {
        stateChangeNotify: Function;
        messageTemplateJSON?: MessageTemplateJSON;
    }

    /** Части сообщения, некоторые из которых попадут в результирующее сообщение (блок IF_THEN_ELSE) */
    interface IfThenElseBlock {
        /** Путь к ifThenElse блоку. */
        path: PathToBlock,
        /** Название переменной в IF от которой будет зависеть этот блок */
        dependencyVariableName: string;
        /** Блок THEN */
        messageSnippets_THEN: MessageSnippets;
        /** Блок ELSE */
        messageSnippets_ELSE: MessageSnippets;
    }

    /** Информация о блоке THEN/ELSE */
    interface MessageSnippets {
        /**
         * Путь к текущему блоку THEN/ELSE
         * (состоит из пути к родительскому ifThenElse + тип текущего блока) (void 0 если это исходный первый блок).
         */
        path?: PathToBlock,
        /** Исходное поле ввода текста в блоке */
        field: MessageFieldDetails,
        /** Дополнительное (после разбития исходного поля отображается) поле ввода текста в блоке */
        fieldAdditional?: MessageAdditionalFieldDetails,
    }

    interface MessageFieldDetails {
        /** Текст сообщения */
        message: string,
        /** Номер позиции в результирующем сообщении */
        positionInResultMessage: number,
        /** true если поле можно разбить на 2 и закинуть IF_THEN_ELSE между */
        isCanSplit: boolean;
    }

    interface BlurSnippetMessageInformation {
        /** Путь к родительскому блоку ifThenElse выделенного field */
        pathToIfThenElseBlock: IMessageTemplate.PathToBlock;
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE;
        fieldType: MESSAGE_TEMPLATE_FIELD_TYPE;
        cursorPosition: number;
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

export interface IfThenElseBlockInfoJSON {
    key: IMessageTemplate.KeyIfThenElseBlock;
    ifThenElseBlockJSON: IMessageTemplate.IfThenElseBlock;
}

export const enum IfThenElseBlockDTO_Props {
    path = 0,
    dependencyVariableName = 1,
    messageSnippets_THEN = 2,
    messageSnippets_ELSE = 3,

    __SIZE__ = 4
}

export type IfThenElseBlockDTO = [
    path: IMessageTemplate.PathToBlock,
    dependencyVariableName: string,
    messageSnippets_THEN: MessageSnippetsDTO,
    messageSnippets_ELSE: MessageSnippetsDTO,
];

export const enum MessageSnippetsDTO_Props {
    path = 0,
    field = 1,
    fieldAdditional = 2,

    __SIZE__ = 3
}

export type MessageSnippetsDTO = [
    path: IMessageTemplate.PathToBlock,
    field: MessageFieldDetailsDTO,
    fieldAdditional: MessageFieldDetailsDTO,
];

export const enum MessageFieldDetailsDTO_Props {
    message = 0,
    positionInResultMessage = 1,
    isCanSplit = 2,

    __SIZE__ = 3
}

export type MessageFieldDetailsDTO = [
    message: string,
    positionInResultMessage: number,
    isCanSplit: boolean,
];

export const enum MessageTemplateDTO_Props {
    ifThenElseDTOList = 0,
    defaultMessageSnippets = 1,
    lastBlurSnippetMessageInformation = 2,

    __SIZE__ = 3,
}

export const enum BlurSnippetMessageInformationDTO_Props {
    pathToIfThenElseBlock = 0,
    blockType = 1,
    fieldType = 2,
    cursorPosition = 3,

    __SIZE__ = 4
}

export type BlurSnippetMessageInformationDTO = [
    pathToIfThenElseBlock: IMessageTemplate.PathToBlock,
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
    fieldType: MESSAGE_TEMPLATE_FIELD_TYPE,
    cursorPosition: number,
]

export type MessageTemplateDTO = [
    ifThenElseDTOList: IfThenElseBlockInfoDTO[],
    defaultMessageSnippets: MessageSnippetsDTO,
    lastBlurSnippetMessageInformation: BlurSnippetMessageInformationDTO,
];

export interface MessageTemplateJSON {
    ifThenElseBlockInfoListJSON: IfThenElseBlockInfoJSON[];
    defaultMessageSnippets: IMessageTemplate.MessageSnippets;
    lastBlurSnippetMessageInformation: IMessageTemplate.BlurSnippetMessageInformation;
}