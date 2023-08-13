//
export namespace IMessageTemplate {
    interface Options {
        handleUpdateState: () => void;
    }

    /** Части сообщения, некоторые из которых попадут в результирующее сообщение (блок IF_THEN_ELSE) */
    interface IfThenElseBlock {
        /** Путь к родительскому блоку (включая его самого). */
        pathToParentBlock: PathToBlock,
        /** Название переменной в IF от которой будет зависеть этот блок */
        dependencyVariableName: string;
        /** Блок THEN */
        messageSnippets_THEN: MessageSnippets;
        /** Блок ELSE */
        messageSnippets_ELSE: MessageSnippets;
    }

    /** Информация о блоке THEN/ELSE */
    interface MessageSnippets {
        /** Исходное поле ввода текста в блоке */
        field: MessageFieldDetails,
        /** Дополнительное (после разбития исходного поля отображается) поле ввода текста в блоке */
        fieldAdditional?: MessageAdditionalFieldDetails,
        /**
         *  Версия текущего состояния блока,
         *  при onChange текстовых полей или изменения свойств этого блока
         *  версия будет изменяться от 0 до бесконечности, а компоненты ререндерится, потому что будут подписаны
         *  на версию своего соответствующего блока.
         *  1, 2, 3... N
         * */
        version: number;
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
        pathToParentBlock: IMessageTemplate.PathToBlock;
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

type Opaque<T, OpaqueName> = T & {
    __TYPE__: OpaqueName;
};