//
export namespace IMessageTemplate {
    // todo: MessageSnippets не существует, есть ifThenElse блок, и надо это переименовать на IfThenElseBlock
    /** Части сообщения, некоторые из которых попадут в результирующее сообщение (блок IF_THEN_ELSE) */
    interface MessageSnippets {
        /** Путь к родительскому блоку (включая его самого). */
        pathToParentBlock: PathToBlock,
        /** Название переменной от которой будет зависеть этот блок */
        dependencyVariableName: string;
        /** Блок THEN */
        blockDetails_THEN: BlockDetails;
        /** Блок ELSE */
        blockDetails_ELSE: BlockDetails;
    }

    /** Информация о блоке THEN/ELSE */
    interface BlockDetails {
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
    type KeyMessageSnippets = Opaque<string, 'KeyMessageSnippets'>;
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