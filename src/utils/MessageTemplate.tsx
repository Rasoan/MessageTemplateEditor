'use strict';

import {
    IMessageTemplate,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
    MESSAGE_TEMPLATE_FIELD_TYPE,
} from "./MessageTemplate/types/MessageTemplate";
import {KEY_POSTFIX_SUBSTRING,} from "./MessageTemplate/constants";

/** Класс, который работает с шаблоном сообщения */
export default class MessageTemplate {
    /** Первое и последнее (если разбили первое) поля для ввода текста */
    private _defaultMessageSnippets: IMessageTemplate.BlockDetails;

    /** map-а со значениями полей THEN и ELSE */
    private _mapMessageSnippets = new Map<
        IMessageTemplate.KeyMessageSnippets,
        IMessageTemplate.MessageSnippets
    >();

    constructor() {
        // todo: заглушка до того момента, когда подключим localStorage
        this._defaultMessageSnippets.field = {
            message: '',
            isCanSplit: true,
            positionInResultMessage: 0,
        };
    }

    /** Количество всех блоков */
    get countAllBlocks() {
        const countDefaultBlocks = this._defaultMessageSnippets.fieldAdditional !== void 0
            // если первый блок разбит, то всего 2 поля ввода текста
            ? 2
            // иначе одно первое поле ввода и всё (второе до разбития первого отсутствует)
            : 1
        ;

        return this.countIfThenElseBlocks + countDefaultBlocks;
    }

    /** Количество IF_THEN_ELSE блоков */
    get countIfThenElseBlocks() {
        return this._mapMessageSnippets.size;
    }

    /**
     * Разбить текущее поле на 2 и вставить между разбитым и новым полем новый блок IF_THEN_ELSE
     *
     * @param positionSplitterInSubMessage - позиция строки в которой мы поделим её на 2 части
     * @param splitDetails - void 0 если разбили самое первое поле
     * @param splitDetails.pathToParentBlock - путь к родительскому блоку (void 0 для первого IF_THEN_ELSE)
     * @param splitDetails.currentBlockType - тип разбиваемого блока
     */
    public splitField(
        positionSplitterInSubMessage: number,
        splitDetails?: {
            currentBlockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
            pathToParentBlock?: IMessageTemplate.PathToBlock,
        },
    ) {
        const {
            pathToParentBlock,
            currentBlockType,
        } = splitDetails;
        const {
            _mapMessageSnippets: mapMessageSnippets,
        } = this;
        const key = MessageTemplate._createKeyForMessageSnippetsBlock(pathToParentBlock);

        const messageSnippets: IMessageTemplate.MessageSnippets | void = mapMessageSnippets.get(key);

        _checkIsMessageSnippets(messageSnippets);

        const blockDetails_splitTarget = currentBlockType === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
            ? messageSnippets.blockDetails_THEN
            : currentBlockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
                ? messageSnippets.blockDetails_ELSE
                : this._defaultMessageSnippets
        ;

        const {
            field: splitTarget_field,
        } = blockDetails_splitTarget;
        const {
            message: splitTarget_message,
            isCanSplit: splitTarget_isCanSplit,
            positionInResultMessage: splitTarget_positionInResultMessage,
        } = splitTarget_field;

        if (!splitTarget_isCanSplit) {
            throw new Error('The current field is already broken!');
        }

        for (const currentBlockIfThenElse of mapMessageSnippets.values()) {
            const {
                blockDetails_THEN,
                blockDetails_ELSE,
            } = currentBlockIfThenElse;
            const {
                field: fieldBlock_then,
                fieldAdditional: fieldAdditionalBlock_then,
            } = blockDetails_THEN;
            const {
                field: fieldBlock_else,
                fieldAdditional: fieldAdditionalBlock_else,
            } = blockDetails_ELSE;

            // поскольку поля добавились после разбитого, позицию предыдущих НЕ трогаем
            if (fieldBlock_then.positionInResultMessage <= splitTarget_positionInResultMessage) {
                continue;
            }

            // все поля после разбитого увеличиваем на 3, поскольку +3 новых поля (THEN/ELSE и часть разбитого поля) втиснулись
            fieldBlock_then.positionInResultMessage = fieldBlock_then.positionInResultMessage + 3;
            fieldBlock_else.positionInResultMessage = fieldBlock_else.positionInResultMessage + 3;

            if (fieldAdditionalBlock_then !== void 0) {
                fieldAdditionalBlock_then.positionInResultMessage = fieldAdditionalBlock_then.positionInResultMessage + 3;
            }

            if (fieldAdditionalBlock_else !== void 0) {
                fieldAdditionalBlock_else.positionInResultMessage = fieldAdditionalBlock_else.positionInResultMessage + 3;
            }
        }

        this._createIfThenElseBlock(
            splitTarget_positionInResultMessage,
            currentBlockType,
            pathToParentBlock,
        );

        blockDetails_splitTarget.fieldAdditional = {
            // закинули вторую часть разбитого поля в дополнительное поле
            message: splitTarget_message.slice(positionSplitterInSubMessage),
            /*
                Дополнительное поле текущего блока после разбития текущего блока (на два) будет на 3 позже разбитого поля,
                поскольку между ними появились 2 новых поля THEN/ELSE нового дочернего блока.
            */
            positionInResultMessage: splitTarget_positionInResultMessage + 3,
            // это поле всегда false, опции разбить дополнительное поля нет (никогда).
            isCanSplit: false,
        };

        // выбросили вторую часть сообщения из разбитого поля
        splitTarget_field.message = splitTarget_message.slice(0, positionSplitterInSubMessage);
    }

    /**
     * Получить текст для текстового поля
     *
     * @param pathToParentBlock - путь к родительскому блоку
     * @param fieldType - тип field
     * @param currentBlockType - тип блока (void 0 - если это самый первый блок (не IF_THEN_ELSE))
     */
    public getSnippetMessage(
        pathToParentBlock: IMessageTemplate.PathToBlock,
        fieldType: MESSAGE_TEMPLATE_FIELD_TYPE,
        currentBlockType?: MESSAGE_TEMPLATE_BLOCK_TYPE,
    ): string {
        if (currentBlockType === void 0) {
            const {
                _defaultMessageSnippets: defaultMessageSnippets,
            } = this;

            switch (fieldType) {
                case MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL: {
                    return defaultMessageSnippets.field.message;
                }
                case MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL: {
                    return defaultMessageSnippets.fieldAdditional.message;
                }
                default: {
                    // ошибка которая никогда не произойдёт
                    throw new Error('Unknown type!');
                }
            }
        }

        const key = MessageTemplate._createKeyForMessageSnippetsBlock(pathToParentBlock);

        const messageSnippets: void | IMessageTemplate.MessageSnippets = this._mapMessageSnippets.get(key);

        _checkIsMessageSnippets(messageSnippets);

        switch (currentBlockType) {
            case MESSAGE_TEMPLATE_BLOCK_TYPE.THEN: {
                const {
                    blockDetails_THEN,
                } = messageSnippets;

                switch (fieldType) {
                    case MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL: {
                        return blockDetails_THEN.field.message;
                    }
                    case MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL: {
                        return blockDetails_THEN.fieldAdditional.message;
                    }
                    default: {
                        // ошибка которая никогда не произойдёт
                        throw new Error('Unknown type!');
                    }
                }
            }
            case MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE: {
                const {
                    blockDetails_ELSE,
                } = messageSnippets;

                switch (fieldType) {
                    case MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL: {
                        return blockDetails_ELSE.field.message;
                    }
                    case MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL: {
                        return blockDetails_ELSE.fieldAdditional.message;
                    }
                    default: {
                        // ошибка которая никогда не произойдёт
                        throw new Error('Unknown type!');
                    }
                }
            }
            default: {
                // ошибка которая никогда не произойдёт
                throw new Error('Unknown type!');
            }
        }
    }

    /**
     * Сохранить данные (одной из подстрок блока IF_THEN_ELSE) подстроки результирующего сообщения
     *
     * @param message - сообщение из field
     * @param details
     * @param details.pathToParentBlock - путь к родительскому блоку (включая его самого) IF_THEN_ELSE {@link IMessageTemplate}
     * @param details.currentBlockType - тип блока THEN/ELSE
     * @param details.fieldType - тип поля
     */
    public setSnippetMessage(
        message: string,
        details: {
            pathToParentBlock: IMessageTemplate.PathToBlock,
            currentBlockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
            fieldType: MESSAGE_TEMPLATE_FIELD_TYPE,
        },
    ) {
        const {
            pathToParentBlock,
            currentBlockType,
            fieldType,
        } = details;
        const key = MessageTemplate._createKeyForMessageSnippetsBlock(pathToParentBlock);

        const messageSnippets: IMessageTemplate.MessageSnippets | void = this._mapMessageSnippets.get(key);

        _checkIsMessageSnippets(messageSnippets);

        switch (currentBlockType) {
            case MESSAGE_TEMPLATE_BLOCK_TYPE.THEN: {
                const {
                    blockDetails_THEN,
                } = messageSnippets;

                switch (fieldType) {
                    case MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL: {
                        blockDetails_THEN.field.message = message;

                        break;
                    }
                    case MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL: {
                        blockDetails_THEN.fieldAdditional.message = message;

                        break;
                    }
                    default: {
                        // ошибка которая никогда не произойдёт
                        throw new Error('Unknown type!');
                    }
                }

                break;
            }
            case MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE: {
                const {
                    blockDetails_ELSE,
                } = messageSnippets;

                switch (fieldType) {
                    case MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL: {
                        blockDetails_ELSE.field.message = message;

                        break;
                    }
                    case MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL: {
                        blockDetails_ELSE.fieldAdditional.message = message;

                        break;
                    }
                    default: {
                        // ошибка которая никогда не произойдёт
                        throw new Error('Unknown type!');
                    }
                }

                break;
            }
            default: {
                // ошибка которая никогда не произойдёт
                throw new Error('Unknown type!');
            }
        }
    }

    /**
     * Получить текст поля в которое вводим название переменной
     *
     * @param pathToParentBlock - путь к родительскому блоку (включая родителя)
     */
    public getDependencyVariableName(pathToParentBlock: IMessageTemplate.PathToBlock): string {
        const key = MessageTemplate._createKeyForMessageSnippetsBlock(pathToParentBlock);

        const messageSnippets: void | IMessageTemplate.MessageSnippets = this._mapMessageSnippets.get(key);

        _checkIsMessageSnippets(messageSnippets);

        return messageSnippets.dependencyVariableName;
    }

    /**
     * Сохранить данные переменной, которая будет отвечать за блок THEN/ELSE
     *
     * @param variableName - название переменной
     * @param pathToParentBlock - путь к родительскому блоку (включая его самого) IF_THEN_ELSE {@link IMessageTemplate}
     */
    public setDependencyVariable(
        variableName: string,
        pathToParentBlock: IMessageTemplate.PathToBlock,
    ) {
        const key = MessageTemplate._createKeyForMessageSnippetsBlock(pathToParentBlock);

        const messageSnippets: void | IMessageTemplate.MessageSnippets = this._mapMessageSnippets.get(key);

        _checkIsMessageSnippets(messageSnippets);

        messageSnippets.dependencyVariableName = variableName;
    }

    /**
     * Создать IF_THEN_ELSE блок
     *
     * @param positionPreviousFieldInResultMessage - позиция в результирующем сообщении первой части разбитого на 2 field
     * @param currentBlockType - тип текущего блока в который будет вложен новый IF_THEN_ELSE блок
     * @param pathToParentBlock - путь к родительскому блоку
     * @private
     */
    private _createIfThenElseBlock(
        positionPreviousFieldInResultMessage: number,
        currentBlockType?: MESSAGE_TEMPLATE_BLOCK_TYPE,
        pathToParentBlock?: IMessageTemplate.PathToBlock,
    ) {
        const parentPathForNewIfThenElseBlock = MessageTemplate.createPathForIfThenElseBlock(currentBlockType, pathToParentBlock);
        const keyForNewIfThenElseBlock = MessageTemplate._createKeyForMessageSnippetsBlock(parentPathForNewIfThenElseBlock);

        const newIfThenElseBlock: IMessageTemplate.MessageSnippets = {
            pathToParentBlock,
            dependencyVariableName: '',
            blockDetails_THEN: {
                field: {
                    message: '',
                    // новый field блока THEN будет на 1 после предыдущего родительского
                    positionInResultMessage: positionPreviousFieldInResultMessage + 1,
                    isCanSplit: true,
                },
            },
            blockDetails_ELSE: {
                field: {
                    message: '',
                    // новый field блока ELSE будет на 2 после предыдущего родительского (перед ним блок THEN)
                    positionInResultMessage: positionPreviousFieldInResultMessage + 2,
                    isCanSplit: true,
                },
            },
        }

        this._mapMessageSnippets.set(keyForNewIfThenElseBlock, newIfThenElseBlock);
    }

    /**
     * Собрать родительский путь к новому дочернему блоку IF_THEN_ELSE
     *
     * @param currentBlockType - тип текущего блока (void 0 для самого первого блока (не IF_THEN_ELSE)
     * @param pathToParentBlock - путь к родительскому блоку (включая его самого) IF_THEN_ELSE (void 0 или '' если это первый IF_THEN_ELSE) {@link IMessageTemplate}
     * @private
     */
    public static createPathForIfThenElseBlock(
        currentBlockType?: MESSAGE_TEMPLATE_BLOCK_TYPE,
        pathToParentBlock: IMessageTemplate.PathToBlock = '' as IMessageTemplate.PathToBlock,
    ): IMessageTemplate.PathToBlock {
        // типа текущего блока не будет только в одном случае, если это самый первый блок (не IF_THEN_ELSE)
        if (currentBlockType === void 0) {
            return '' as IMessageTemplate.PathToBlock;
        }
        // если тип текущего блока есть, но путь к родительскому блоку пуст, значит это первый IF_THEN_ELSE
        else if (pathToParentBlock === '') {
            return String(currentBlockType) as IMessageTemplate.PathToBlock;
        }

        // путь к новому IF_THEN_ELSE блоку внутри блока THEN
        return `${pathToParentBlock}/${currentBlockType}` as IMessageTemplate.PathToBlock;
    }

    /**
     * Генератор ключа для переменных или для подстроки результирующего сообщения
     *
     * @param pathToParentBlock - путь к родительскому блоку (включая его самого) IF_THEN_ELSE {@link IMessageTemplate}
     * @private
     */
    private static _createKeyForMessageSnippetsBlock(
        pathToParentBlock: IMessageTemplate.PathToBlock,
    ): IMessageTemplate.KeyMessageSnippets {
        // в остальных случая генерируем ключ для THEN/ELSE
        return pathToParentBlock + KEY_POSTFIX_SUBSTRING as IMessageTemplate.KeyMessageSnippets;
    }
}

function _checkIsMessageSnippets(
    messageSnippets: IMessageTemplate.MessageSnippets | any,
): asserts messageSnippets is IMessageTemplate.MessageSnippets  {
    const textError = 'MessageSnippets is any type';

    if (typeof messageSnippets !== 'object') {
        throw new Error(textError);
    }

    const {
        pathToParentBlock,
        dependencyVariableName,
        blockDetails_THEN,
        blockDetails_ELSE,
    } = (messageSnippets || {}) as IMessageTemplate.MessageSnippets;

    if (
        pathToParentBlock === void 0
        || dependencyVariableName === void 0
        || blockDetails_THEN === void 0
        || blockDetails_ELSE === void 0
    ) {
        throw new Error(textError);
    }
}
