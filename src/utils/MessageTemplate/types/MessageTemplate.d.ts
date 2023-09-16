//
export namespace IMessageTemplate {
    interface Options {
        stateChangeNotify: Function;
        variablesKeysList?: VariablesKeysList;
        messageTemplateJSON?: MessageTemplateJSON;
    }

    type VariablesKeysList = string[];

    /** Части сообщения, некоторые из которых попадут в результирующее сообщение (блок IF_THEN_ELSE) */
    interface IfThenElse {
        /** Путь к ifThenElse блоку */
        path: PathToIfThenElse;
        /** Позиция среди соседних одно уровневых ifThenElse */
        position: number;
        /** Название переменной в IF от которой будет зависеть этот блок */
        conditionalIf: string;
        /** Блок then */
        messageSnippetsInfoThen: MessageSnippetsInfo<MESSAGE_TEMPLATE_BLOCK_TYPE.THEN>;
        /** Блок else */
        messageSnippetsInfoElse: MessageSnippetsInfo<MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE>;
        /** Дополнительный блок */
        messageSnippetsInfoAdditional: MessageSnippetsInfo<MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL>;
    }

    interface MessageSnippetsInfo<T = MESSAGE_TEMPLATE_BLOCK_TYPE> {
        /** Тип блока */
        blockType: T;
        /** Текстовое поле */
        field: FieldInfo;
    }

    interface FieldInfo {
        /** Текст сообщения */
        message: string,
        /** Номер позиции в результирующем сообщении */
        positionInResultMessage: number,
    }

    interface LastBlurInfo {
        /** Позиция курсора */
        cursorPosition: number;
        /** Путь к ifThenElse выделенного field */
        pathToIfThenElse: IMessageTemplate.PathToIfThenElse;
        /** Тип блока, NULL если выделен if */
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE;
        /**
         * Для того, что бы что-то изменилось здесь и GUI узнал об этом и сработал "cursor focus"
         *
         * Например, при вставке переменной в текстовое поле версия обновится,
         * что бы текстовое поле узнало о том,
         * что была вставлена переменная и сработал focus().
         */
        version: number;
    }

    /**
     * Путь к ifThenElse от начала дерева.
     * Выглядит так "1-2/1-2":
     * 1) 1 - тип блока в котором вложен {@link MESSAGE_TEMPLATE_BLOCK_TYPE};
     * 2) 2 - порядковый номер ifThenElse среди соседних;
    */
    type PathToIfThenElse = Opaque<string, 'PathToIfThenElse'>;

    /**
     * Путь к верхнему текстовому полю (не вложенному никуда).
     * Выглядит так 1 или 2 или 3 или N
     * 1) цифра - означает порядковый номер
    */
    type PathMessageSnippetTop = Opaque<string, 'PathInitialField'>;

    /** Выудить информацию из пути об родительском ifThenElse */
    interface ParentIfThenElseInfo {
        /** Путь к родительскому ifThenElse (внимание, НЕ к этому ifThenElse, а к РОДИТЕЛЬСКОМУ ifThenElse)  */
        pathToIfThenElse: IMessageTemplate.PathToIfThenElse;
        /** Тип блока, в который вложен этот ifThenElse (тип родительского блока) */
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL
            | MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
            | MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE;
        /** Позиция среди одно уровневых ifThenElse */
        position: number;
        /** Уровень вложенности ifThenElse */
        nestingLevel: number;
    }
}

type Opaque<T, OpaqueName> = T & {
    __TYPE__: OpaqueName;
};

/** Тип блока */
export const enum MESSAGE_TEMPLATE_BLOCK_TYPE {
    /**
     * Использовать вместо "void 0"
     */
    NULL = 0,
    /** Блок на самом верхнем уровне, не принадлежит ни к THEN, ни к ELSE */
    INITIAL = 1,
    /** Блок является сущностью THEN */
    THEN = 2,
    /** Блок является сущностью ELSE */
    ELSE = 3,
    /** Дополнительный блок, в конце ifThenElse */
    ADDITIONAL = 4,
}

// export const enum IfThenElseItemDTO_Props {
//     key = 0,
//     ifThenElseDTO = 1,
//
//     __SIZE__ = 2,
// }

// export type IfThenElseItemDTO = [
//     key: IMessageTemplate.Path,
//     ifThenElseDTO: IfThenElseDTO,
// ];

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

export interface IfThenElseItemJSON {
    pathToIfThenElse: IMessageTemplate.PathToIfThenElse;
    ifThenElse: IMessageTemplate.IfThenElse;
}
//
// export const enum IfThenElseDTO_Props {
//     path = 0,
//     dependencyVariableName = 1,
//     messageSnippetsThen = 2,
//     messageSnippetsElse = 3,
//
//     __SIZE__ = 4
// }
//
// export type IfThenElseDTO = [
//     path: IMessageTemplate.Path,
//     dependencyVariableName: string,
//     messageSnippetsThen: MessageSnippetsDTO,
//     messageSnippetsElse: MessageSnippetsDTO,
// ];
//
// export const enum MessageSnippetsDTO_Props {
//     blockType = 0,
//     path = 1,
//     field = 2,
//     fieldAdditional = 3,
//
//     __SIZE__ = 4
// }
//
// export type MessageSnippetsDTO = [
//     blockType: MESSAGE_TEMPLATE_BLOCK_TYPE | void,
//     path: IMessageTemplate.Path,
//     field: MessageFieldDetailsDTO,
//     fieldAdditional: MessageFieldDetailsDTO,
// ];
//
// export const enum MessageFieldDetailsDTO_Props {
//     message = 0,
//     fieldType = 1,
//     positionInResultMessage = 2,
//     isCanSplit = 3,
//
//     __SIZE__ = 4
// }
//
// export type MessageFieldDetailsDTO = [
//     message: string,
//     fieldType: MESSAGE_TEMPLATE_FIELD_TYPE,
//     positionInResultMessage: number,
//     isCanSplit: boolean,
// ];
//
// export const enum MessageTemplateDTO_Props {
//     ifThenElseDTOList = 0,
//     defaultMessageSnippets = 1,
//     lastBlurSnippetMessageInformation = 2,
//
//     __SIZE__ = 3,
// }
//
// export const enum LastBlurSnippetMessageInformationDTO_Props {
//     fieldType = 0,
//     /** void 0 если это самый первый блок */
//     blockType = 1,
//
//     __SIZE__ = 2
// }
//
// export type LastBlurSnippetMessageInformationDTO = [
//     fieldType: MESSAGE_TEMPLATE_FIELD_TYPE,
//     /** void 0 если это самый первый блок */
//     blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE | void,
// ]
//
// export const enum LastBlurInformationDTO_Props {
//     path = 0,
//     cursorPosition = 1,
//     insertedVariablesVersion = 2,
//     snippetMessageInformationDTO = 3,
//
//     __SIZE__ = 4
// }
//
// export type LastBlurInformationDTO = [
//     path: IMessageTemplate.Path,
//     cursorPosition: number,
//     insertedVariablesVersion: number,
//     snippetMessageInformationDTO?: LastBlurSnippetMessageInformationDTO | void,
// ];

export interface MessageTemplateJSON {
    /** Список ifThenElse с ключами */
    listIfThenElse: IfThenElseItemJSON[];
    /** Список текстовых полей на верхнем уровне (они не вложены ни во что) */
    messageSnippetInfoInitial: IMessageTemplate.MessageSnippetsInfo<MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL>;
    /** Информация о последнем выделенном текстовом поле */
    lastBlurInfo: IMessageTemplate.LastBlurInfo;
}

// todo: написать здесь нормальный код для DTO формата
export type MessageTemplateDTO = MessageTemplateJSON;