'use strict';

import {KEY_POSTFIX_SUBSTRING} from "./constants";
import {
    BlurSnippetMessageInformationDTO,
    BlurSnippetMessageInformationDTO_Props,
    IfThenElseBlockDTO,
    IfThenElseBlockDTO_Props,
    IfThenElseBlockInfoDTO,
    IfThenElseBlockInfoDTO_Props,
    IfThenElseBlockInfoJSON,
    IMessageTemplate,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
    MESSAGE_TEMPLATE_FIELD_TYPE,
    MessageFieldDetailsDTO,
    MessageFieldDetailsDTO_Props,
    MessageSnippetsDTO,
    MessageSnippetsDTO_Props,
    MessageTemplateDTO,
    MessageTemplateDTO_Props,
    MessageTemplateJSON,
} from "./types/MessageTemplate";

/** Количество добавляемых текстовых полей (THEN + ELSE). */
const QUANTITY_NEW_FIELDS = 3;

/** Класс, который работает с шаблоном сообщения */
export default class MessageTemplate {
    /** Первое и последнее (если разбили первое) поля для ввода текста */
    private readonly _defaultMessageSnippets: IMessageTemplate.MessageSnippets;
    private readonly _stateChangeNotify: Function;
    private _lastBlurSnippetMessageInformation?: IMessageTemplate.BlurSnippetMessageInformation;

    /** map-а со значениями полей THEN и ELSE */
    private _mapOfIfThenElseBlocks = new Map<
        IMessageTemplate.KeyIfThenElseBlock,
        IMessageTemplate.IfThenElseBlock
    >();

    constructor(options: IMessageTemplate.Options) {
        const {
            stateChangeNotify,
            messageTemplateJSON,
        } = options;

        this._stateChangeNotify = stateChangeNotify;

        if (messageTemplateJSON !== void 0) {
            const {
                ifThenElseBlockInfoListJSON,
                lastBlurSnippetMessageInformation,
                defaultMessageSnippets,
            } = messageTemplateJSON;

            this._defaultMessageSnippets = defaultMessageSnippets;
            this._lastBlurSnippetMessageInformation = lastBlurSnippetMessageInformation;

            for (const ifThenElseBlockInfoJSON of ifThenElseBlockInfoListJSON) {
                const {
                    key: keyIfThenElseBlockJSON,
                    ifThenElseBlock,
                } = ifThenElseBlockInfoJSON;

                this._mapOfIfThenElseBlocks.set(keyIfThenElseBlockJSON, ifThenElseBlock);
            }

            return;
        }

        this._defaultMessageSnippets = {
            // первый блок тем и отличается от THEN/ELSE, что у него пути нет, ведь он первый:)
            path: void 0,
            field: {
                fieldType: MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL,
                message: '',
                isCanSplit: true,
                positionInResultMessage: 0,
            },
        };
    }

    get lastBlurSnippetMessageInformation() {
        return { ...this._lastBlurSnippetMessageInformation };
    }

    /** Количество IF_THEN_ELSE блоков */
    get countIfThenElseBlocks() {
        return this._mapOfIfThenElseBlocks.size;
    }

    public setLastBlurSnippetMessageInformation(blurSnippetMessageInformation: IMessageTemplate.BlurSnippetMessageInformation) {
        this._lastBlurSnippetMessageInformation = blurSnippetMessageInformation;

        this._stateChangeNotify();
    }

    /**
     * Разбить текущее поле на 2 и вставить между разбитым и новым полем новый блок IF_THEN_ELSE
     */
    public splitFieldAndInsertIfThenElseBlock() {
        const {
            _lastBlurSnippetMessageInformation: lastBlurSnippetMessageInformation,
        } = this;

        if (lastBlurSnippetMessageInformation === void 0) {
            throw new Error('Can\'t split unknown block!');
        }

        const {
            fieldType,
            blockType: currentBlockType,
            pathToIfThenElseBlock,
            cursorPosition: positionSplitterInSubMessage,
        } = lastBlurSnippetMessageInformation;

        if (fieldType !== MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL) {
            throw new Error('Can split only initial block!');
        }

        const {
            _mapOfIfThenElseBlocks: mapOfIfThenElseBlocks,
        } = this;
        const key = MessageTemplate._createKeyForIfThenElseBlock(pathToIfThenElseBlock);

        const ifThenElseBlock: IMessageTemplate.IfThenElseBlock | void = mapOfIfThenElseBlocks.get(key);

        const messageSnippets_splitTarget: IMessageTemplate.MessageSnippets =
            currentBlockType === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN && _checkIsIfThenElseBlock(ifThenElseBlock)
                ? ifThenElseBlock.messageSnippets_THEN
                : currentBlockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
                    ? ifThenElseBlock.messageSnippets_ELSE
                    : this._defaultMessageSnippets
        ;

        const {
            field: splitTarget_field,
        } = messageSnippets_splitTarget;
        const {
            message: splitTarget_message,
            isCanSplit: splitTarget_isCanSplit,
            positionInResultMessage: splitTarget_positionInResultMessage,
        } = splitTarget_field;

        if (!splitTarget_isCanSplit) {
            throw new Error('The current field is already broken!');
        }

        for (const currentIfThenElse of mapOfIfThenElseBlocks.values()) {
            const {
                messageSnippets_THEN,
                messageSnippets_ELSE,
            } = currentIfThenElse;
            const {
                field: fieldBlock_then,
                fieldAdditional: fieldAdditionalBlock_then,
            } = messageSnippets_THEN;
            const {
                field: fieldBlock_else,
                fieldAdditional: fieldAdditionalBlock_else,
            } = messageSnippets_ELSE;

            // поскольку поля добавились после разбитого, позицию предыдущих НЕ трогаем
            {
                if (fieldBlock_then.positionInResultMessage > splitTarget_positionInResultMessage) {
                    fieldBlock_then.positionInResultMessage += QUANTITY_NEW_FIELDS;
                }

                if (fieldAdditionalBlock_then?.positionInResultMessage > splitTarget_positionInResultMessage) {
                    fieldAdditionalBlock_then.positionInResultMessage += QUANTITY_NEW_FIELDS;
                }

                if (fieldBlock_else.positionInResultMessage > splitTarget_positionInResultMessage) {
                    fieldBlock_else.positionInResultMessage += QUANTITY_NEW_FIELDS;
                }

                if (fieldAdditionalBlock_else?.positionInResultMessage > splitTarget_positionInResultMessage) {
                    fieldAdditionalBlock_else.positionInResultMessage += QUANTITY_NEW_FIELDS;
                }
            }
        }

        this._createIfThenElseBlock(
            splitTarget_positionInResultMessage,
            MessageTemplate.createPath(currentBlockType, pathToIfThenElseBlock),
        );

        messageSnippets_splitTarget.fieldAdditional = {
            fieldType: MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL,
            // закинули вторую часть разбитого поля в дополнительное поле
            message: splitTarget_message.slice(positionSplitterInSubMessage),
            /*
                Дополнительное поле текущего блока после разбития текущего блока (на два) будет на 3 позже разбитого поля,
                поскольку между ними появились 2 новых поля THEN/ELSE нового дочернего блока.
            */
            positionInResultMessage: splitTarget_positionInResultMessage + QUANTITY_NEW_FIELDS,
            // это поле всегда false, опции разбить дополнительное поля нет (никогда).
            isCanSplit: false,
        };

        /* При любом раскладе, это текстовое поле ВСЕГДА последнее. */
        this._defaultMessageSnippets.fieldAdditional.positionInResultMessage = Infinity;

        // удалили вторую часть сообщения из разбитого поля
        splitTarget_field.message = splitTarget_message.slice(0, positionSplitterInSubMessage);
        splitTarget_field.isCanSplit = false;

        this._stateChangeNotify();
    }

    /**
     * Получить ifThenElse блок
     *
     * @param path - путь к ifThenElse блоку
     */
    public getIfThenElseForce(path?: IMessageTemplate.PathToBlock | void): IMessageTemplate.IfThenElseBlock {
        const key = MessageTemplate._createKeyForIfThenElseBlock(path);
        const ifThenElseBlock: void | IMessageTemplate.IfThenElseBlock = this._mapOfIfThenElseBlocks.get(key);

        _assertIsIfThenElseBlock(ifThenElseBlock);

        return ifThenElseBlock;
    }

    /**
     * Получить THEN или ELSE или первый блок
     *
     * @param pathToParentBlock - путь к родительскому блоку
     * @param blockType - тип блока (void 0 если первый блок НЕ вложенный в ifThenElse)
     */
    public getBlockInformationForce(
        pathToParentBlock?: IMessageTemplate.PathToBlock | void,
        blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE | void,
    ): IMessageTemplate.MessageSnippets {
        if (blockType === void 0) {
            return this._defaultMessageSnippets;
        }

        const ifThenElseBlock: void | IMessageTemplate.IfThenElseBlock = this.getIfThenElseForce(pathToParentBlock);

        switch (blockType) {
            case MESSAGE_TEMPLATE_BLOCK_TYPE.THEN: {
                return ifThenElseBlock.messageSnippets_THEN;
            }
            case MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE: {
                return ifThenElseBlock.messageSnippets_ELSE;
            }
        }
    }

    /**
     * Получить текст поля в которое вводим название переменной
     *
     * @param pathToParentBlock - путь к родительскому блоку (включая родителя) (void 0 если первый ifThenElse)
     */
    public getDependencyVariableNameForce(pathToParentBlock?: IMessageTemplate.PathToBlock | void): string {
        const ifThenElseBlock: IMessageTemplate.IfThenElseBlock = this.getIfThenElseForce(pathToParentBlock);

        return ifThenElseBlock.dependencyVariableName;
    }

    public getMessageSnippets() {
        const messageSnippets = [
            this._defaultMessageSnippets.field,
            this._defaultMessageSnippets.fieldAdditional,
        ];

        for (const ifThenElseBlock of this._mapOfIfThenElseBlocks.values()) {
            messageSnippets.push(
                ifThenElseBlock.messageSnippets_THEN.field,
                ifThenElseBlock.messageSnippets_ELSE.field,
            );

            if (ifThenElseBlock.messageSnippets_ELSE.fieldAdditional !== void 0) {
                messageSnippets.push(ifThenElseBlock.messageSnippets_ELSE.fieldAdditional);
            }

            if (ifThenElseBlock.messageSnippets_THEN.fieldAdditional !== void 0) {
                messageSnippets.push(ifThenElseBlock.messageSnippets_THEN.fieldAdditional);
            }
        }

        return messageSnippets.sort(
            (prevMessageSnippet, nextMessageSnippet) => {
                return prevMessageSnippet.positionInResultMessage - nextMessageSnippet.positionInResultMessage;
        });
    }

    /**
     * Сохранить данные (одной из подстрок блока IF_THEN_ELSE) подстроки результирующего сообщения
     *
     * @param message - сообщение из field
     * @param details
     * @param details.pathToParentBlock - путь к родительскому блоку (включая его самого) IF_THEN_ELSE {@link IMessageTemplate}
     * @param details.currentBlockType - тип блока THEN/ELSE (void 0 если это первый блок не входящий в IF_THEN_ELSE)
     * @param details.fieldType - тип поля
     */
    public setSnippetMessage(
        message: string,
        details: {
            fieldType: MESSAGE_TEMPLATE_FIELD_TYPE,
            currentBlockType?: MESSAGE_TEMPLATE_BLOCK_TYPE | void,
            /** Путь к родительскому ifThenElse или void 0, если первый блок */
            path?: IMessageTemplate.PathToBlock | void,
        },
    ) {
        const {
            currentBlockType,
            fieldType,
            path = '' as IMessageTemplate.PathToBlock,
        } = details;

        if (currentBlockType === void 0) {
            const {
                _defaultMessageSnippets: defaultMessageSnippets,
            } = this;

            switch (fieldType) {
                case MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL: {
                    defaultMessageSnippets.field.message = message;

                    break;
                }
                case MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL: {
                    defaultMessageSnippets.fieldAdditional.message = message;

                    break;
                }
                default: {
                    // ошибка которая никогда не произойдёт
                    throw new Error('Unknown type!');
                }
            }

            this._stateChangeNotify();

            return;
        }

        const key = MessageTemplate._createKeyForIfThenElseBlock(path);

        const ifThenElseBlock: IMessageTemplate.IfThenElseBlock | void = this._mapOfIfThenElseBlocks.get(key);

        _assertIsIfThenElseBlock(ifThenElseBlock);

        switch (currentBlockType) {
            case MESSAGE_TEMPLATE_BLOCK_TYPE.THEN: {
                const {
                    messageSnippets_THEN,
                } = ifThenElseBlock;

                switch (fieldType) {
                    case MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL: {
                        messageSnippets_THEN.field.message = message;

                        break;
                    }
                    case MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL: {
                        messageSnippets_THEN.fieldAdditional.message = message;

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
                    messageSnippets_ELSE,
                } = ifThenElseBlock;

                switch (fieldType) {
                    case MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL: {
                        messageSnippets_ELSE.field.message = message;

                        break;
                    }
                    case MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL: {
                        messageSnippets_ELSE.fieldAdditional.message = message;

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

        this._stateChangeNotify();
    }

    /**
     * Сохранить данные переменной, которая будет отвечать за блок THEN/ELSE
     *
     * @param variableName - название переменной
     * @param path - путь к ifThenELse
     */
    public setDependencyVariable(
        variableName: string,
        path?: IMessageTemplate.PathToBlock | void,
    ) {
        const key = MessageTemplate._createKeyForIfThenElseBlock(path);

        const ifThenElseBlock: void | IMessageTemplate.IfThenElseBlock = this._mapOfIfThenElseBlocks.get(key);

        _assertIsIfThenElseBlock(ifThenElseBlock);

        ifThenElseBlock.dependencyVariableName = variableName;

        this._stateChangeNotify();
    }

    /**
     * Создать IF_THEN_ELSE блок
     *
     * @param positionPreviousFieldInResultMessage - позиция в результирующем сообщении первой части разбитого на 2 field
     * @param path - путь к создаваемому ifThenElse блоку
     *
     * @private
     */
    private _createIfThenElseBlock(
        positionPreviousFieldInResultMessage: number,
        path?: IMessageTemplate.PathToBlock | void,
    ) {
        const keyForNewIfThenElseBlock = MessageTemplate._createKeyForIfThenElseBlock(path);

        const newIfThenElseBlock: IMessageTemplate.IfThenElseBlock = {
            path,
            dependencyVariableName: '',
            messageSnippets_THEN: {
                blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.THEN,
                path: MessageTemplate.createPath(MESSAGE_TEMPLATE_BLOCK_TYPE.THEN, path),
                field: {
                    fieldType: MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL,
                    message: '',
                    // новый field блока THEN будет на 1 после предыдущего родительского
                    positionInResultMessage: positionPreviousFieldInResultMessage + 1,
                    isCanSplit: true,
                },
            },
            messageSnippets_ELSE: {
                blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE,
                path: MessageTemplate.createPath(MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE, path),
                field: {
                    fieldType: MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL,
                    message: '',
                    // новый field блока ELSE будет на 2 после предыдущего родительского (перед ним блок THEN)
                    positionInResultMessage: positionPreviousFieldInResultMessage + 2,
                    isCanSplit: true,
                },
            },
        }

        this._mapOfIfThenElseBlocks.set(keyForNewIfThenElseBlock, newIfThenElseBlock);
    }

    public toJSON(): MessageTemplateJSON {
        const ifThenElseBlockInfoListJSON: IfThenElseBlockInfoJSON[] = [];

        for (const [keyIfThenElseBlock, ifThenElseBlock] of this._mapOfIfThenElseBlocks.entries()) {
            ifThenElseBlockInfoListJSON.push({
                ifThenElseBlock,
                key: keyIfThenElseBlock,
            });
        }

        return {
            ifThenElseBlockInfoListJSON,
            lastBlurSnippetMessageInformation: this._lastBlurSnippetMessageInformation,
            defaultMessageSnippets: this._defaultMessageSnippets,
        }
    }

    public toDTO(): MessageTemplateDTO {
        const messageTemplateJSON = this.toJSON();

        const ifThenElseDTOList: IfThenElseBlockInfoDTO[] = [];
        const {
            ifThenElseBlockInfoListJSON,
            lastBlurSnippetMessageInformation,
            defaultMessageSnippets
        } = messageTemplateJSON;

        for (const { key: keyIfThenElseBlock, ifThenElseBlock } of ifThenElseBlockInfoListJSON) {
            const ifThenElseBlockInfoDTO = new Array(IfThenElseBlockInfoDTO_Props.__SIZE__) as IfThenElseBlockInfoDTO;

            ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.key] = keyIfThenElseBlock;

            const ifThenElseBlockDTO = new Array(IfThenElseBlockDTO_Props.__SIZE__) as IfThenElseBlockDTO;

            const {
                messageSnippets_THEN,
                messageSnippets_ELSE,
                path,
                dependencyVariableName,
            } = ifThenElseBlock;

            ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_THEN] = _messageSnippetsJSONToDTO(messageSnippets_THEN);
            ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_ELSE] = _messageSnippetsJSONToDTO(messageSnippets_ELSE);
            ifThenElseBlockDTO[IfThenElseBlockDTO_Props.dependencyVariableName] = dependencyVariableName;
            ifThenElseBlockDTO[IfThenElseBlockDTO_Props.path] = path;

            ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.ifThenElseBlockDTO] = ifThenElseBlockDTO;

            ifThenElseDTOList.push(ifThenElseBlockInfoDTO);
        }

        const messageTemplateDTO = new Array(MessageTemplateDTO_Props.__SIZE__) as MessageTemplateDTO;

        messageTemplateDTO[MessageTemplateDTO_Props.ifThenElseDTOList] = ifThenElseDTOList;
        messageTemplateDTO[MessageTemplateDTO_Props.defaultMessageSnippets] = _messageSnippetsJSONToDTO(defaultMessageSnippets);

        // blurSnippetMessageInformationDTO
        if (lastBlurSnippetMessageInformation !== void 0) {
            const {
                fieldType,
                blockType,
                pathToIfThenElseBlock,
                cursorPosition,
            } = lastBlurSnippetMessageInformation;

            const blurSnippetMessageInformationDTO = new Array(BlurSnippetMessageInformationDTO_Props.__SIZE__) as BlurSnippetMessageInformationDTO;

            blurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.blockType] = blockType;
            blurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.fieldType] = fieldType;
            blurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.cursorPosition] = cursorPosition;
            blurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.pathToIfThenElseBlock] = pathToIfThenElseBlock;

            messageTemplateDTO[MessageTemplateDTO_Props.lastBlurSnippetMessageInformation] = blurSnippetMessageInformationDTO;
        }

        return messageTemplateDTO;
    }

    public static fromDTO(messageTemplateDTO: MessageTemplateDTO, stateChangeNotify: Function): MessageTemplate {
        const messageTemplateJSON: MessageTemplateJSON = MessageTemplate.dtoToJSON(messageTemplateDTO);

        return new MessageTemplate({
            messageTemplateJSON,
            stateChangeNotify,
        });
    }

    static dtoToJSON(messageTemplateDTO: MessageTemplateDTO): MessageTemplateJSON {
        const lastBlurSnippetMessageInformationDTO: BlurSnippetMessageInformationDTO = messageTemplateDTO[MessageTemplateDTO_Props.lastBlurSnippetMessageInformation];

        return {
            defaultMessageSnippets: _messageSnippetsDTOtoJSON(messageTemplateDTO[MessageTemplateDTO_Props.defaultMessageSnippets]),
            ifThenElseBlockInfoListJSON: messageTemplateDTO[MessageTemplateDTO_Props.ifThenElseDTOList].map((ifThenElseBlockInfoDTO: IfThenElseBlockInfoDTO) => {
                const ifThenElseBlockDTO: IfThenElseBlockDTO = ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.ifThenElseBlockDTO];

                return {
                    ifThenElseBlock: {
                        path: _nullToVoid0(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.path]),
                        dependencyVariableName: _normalizeString(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.dependencyVariableName]),
                        messageSnippets_ELSE: _messageSnippetsDTOtoJSON(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_ELSE]),
                        messageSnippets_THEN: _messageSnippetsDTOtoJSON(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_THEN]),
                    },
                    key: ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.key],
                };
            }),
            lastBlurSnippetMessageInformation: {
                pathToIfThenElseBlock: _nullToVoid0(lastBlurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.pathToIfThenElseBlock]),
                blockType: _nullToVoid0(lastBlurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.blockType]),
                fieldType: lastBlurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.fieldType],
                cursorPosition: lastBlurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.cursorPosition],
            },
        };
    }

    /**
     * Собрать родительский путь к новому дочернему блоку IF_THEN_ELSE
     *
     * @param currentBlockType - тип текущего блока (void 0 для самого первого блока (не IF_THEN_ELSE)
     * @param path - путь к родительскому блоку (включая его самого) IF_THEN_ELSE (void 0 если это первый IF_THEN_ELSE или самое первое поле) {@link IMessageTemplate}
     * @private
     */
    public static createPath(
        currentBlockType?: MESSAGE_TEMPLATE_BLOCK_TYPE | void,
        path?: IMessageTemplate.PathToBlock | void,
    ): IMessageTemplate.PathToBlock | void {
        // типа текущего блока не будет только в одном случае, если это самый первый блок (не IF_THEN_ELSE)
        if (!currentBlockType) {
            return;
        }
        // если тип текущего блока есть, но путь отсутствует, значит это первый IF_THEN_ELSE
        else if (!path) {
            return String(currentBlockType) as IMessageTemplate.PathToBlock;
        }

        // путь к новому IF_THEN_ELSE блоку внутри блока THEN
        return `${path}/${currentBlockType}` as IMessageTemplate.PathToBlock;
    }

    /**
     * Генератор ключа для переменных или для подстроки результирующего сообщения
     *
     * @param path - путь к родительскому блоку (включая его самого) (если void 0, то это путь к первому ifThenElse)
     * @private
     */
    private static _createKeyForIfThenElseBlock(
        path?: IMessageTemplate.PathToBlock | void,
    ): IMessageTemplate.KeyIfThenElseBlock {
        const prefix = path
            ? path
            : ''
        ;

        return prefix + KEY_POSTFIX_SUBSTRING as IMessageTemplate.KeyIfThenElseBlock;
    }
}

function _checkIsIfThenElseBlock(
    ifThenElseBlock: IMessageTemplate.IfThenElseBlock | any,
): ifThenElseBlock is IMessageTemplate.IfThenElseBlock  {
    if (typeof ifThenElseBlock !== 'object') {
        return false;
    }

    const {
        dependencyVariableName,
        messageSnippets_THEN,
        messageSnippets_ELSE,
    } = (ifThenElseBlock || {}) as IMessageTemplate.IfThenElseBlock;

    return !(dependencyVariableName === void 0
        || messageSnippets_THEN === void 0
        || messageSnippets_ELSE === void 0)
    ;


}

function _assertIsIfThenElseBlock(
    ifThenElseBlock: IMessageTemplate.IfThenElseBlock | any,
): asserts ifThenElseBlock is IMessageTemplate.IfThenElseBlock  {
    const textError = 'MessageSnippets is any type';

    if (!_checkIsIfThenElseBlock(ifThenElseBlock)) {
        throw new Error(textError);
    }
}

/**
 * THEN/ELSE или первый блок => в DTO формат
 *
 * @param messageSnippetsJSON
 */
function _messageSnippetsJSONToDTO(messageSnippetsJSON: IMessageTemplate.MessageSnippets): MessageSnippetsDTO             {
    const messageSnippetsDTO = new Array(MessageSnippetsDTO_Props.__SIZE__) as MessageSnippetsDTO;

    const {
        path,
        field,
        fieldAdditional,
        blockType,
    } = messageSnippetsJSON;

    messageSnippetsDTO[MessageSnippetsDTO_Props.path] = path;
    messageSnippetsDTO[MessageSnippetsDTO_Props.blockType] = blockType;

    // field
    {
        const {
            fieldType,
            message,
            positionInResultMessage,
            isCanSplit,
        } = field;
        const messageFieldDetailsDTO = new Array(MessageFieldDetailsDTO_Props.__SIZE__) as MessageFieldDetailsDTO;

        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.message] = message;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.positionInResultMessage] = positionInResultMessage;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.isCanSplit] = isCanSplit;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.fieldType] = fieldType;

        messageSnippetsDTO[MessageSnippetsDTO_Props.field] = messageFieldDetailsDTO;
    }

    // field additional
    if (fieldAdditional !== void 0) {
        const {
            message,
            positionInResultMessage,
            isCanSplit,
            fieldType,
        } = fieldAdditional;
        const messageFieldDetailsDTO = new Array(MessageFieldDetailsDTO_Props.__SIZE__) as MessageFieldDetailsDTO;

        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.message] = message;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.positionInResultMessage] = positionInResultMessage;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.isCanSplit] = isCanSplit;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.fieldType] = fieldType;

        messageSnippetsDTO[MessageSnippetsDTO_Props.fieldAdditional] = messageFieldDetailsDTO;
    }

    return messageSnippetsDTO;
}

/**
 * THEN/ELSE или первый блок => из DTO в JSON формат
 *
 * @param messageSnippetsDTO
 */
function _messageSnippetsDTOtoJSON(messageSnippetsDTO: MessageSnippetsDTO): IMessageTemplate.MessageSnippets {
    const fieldDTO: MessageFieldDetailsDTO = messageSnippetsDTO[MessageSnippetsDTO_Props.field];
    const fieldAdditionalDTO: MessageFieldDetailsDTO = messageSnippetsDTO[MessageSnippetsDTO_Props.fieldAdditional];
    const fieldJSON: IMessageTemplate.MessageFieldDetails = {
        fieldType: MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL,
        message: _normalizeString(fieldDTO[MessageFieldDetailsDTO_Props.message]),
        isCanSplit: fieldDTO[MessageFieldDetailsDTO_Props.isCanSplit],
        positionInResultMessage: fieldDTO[MessageFieldDetailsDTO_Props.positionInResultMessage],
    };

    const fieldAdditional_isCanSplit: boolean | void = (fieldAdditionalDTO || [])[MessageFieldDetailsDTO_Props.isCanSplit];

    if (fieldAdditional_isCanSplit === true) {
        throw new Error('Flag isCanSplit of fieldAdditionalDTO can\'t be true!');
    }

    return {
        path: _nullToVoid0(messageSnippetsDTO[MessageSnippetsDTO_Props.path]),
        blockType: _nullToVoid0(messageSnippetsDTO[MessageSnippetsDTO_Props.blockType]),
        field: fieldJSON,
        fieldAdditional: fieldAdditionalDTO
            ? {
                fieldType: fieldAdditionalDTO[MessageFieldDetailsDTO_Props.fieldType],
                message: _normalizeString(fieldAdditionalDTO[MessageFieldDetailsDTO_Props.message]),
                isCanSplit: fieldAdditional_isCanSplit,
                positionInResultMessage: fieldAdditionalDTO[MessageFieldDetailsDTO_Props.positionInResultMessage],
            }
            : void 0,
    }
}

/**
 * После localStorage строка вида '' превращается в null,
 * в input нельзя сохранять null, значит конвертируем ложные значения в пустую строку ''.
 *
 * @param dependencyVariableName
 */
function _normalizeString(dependencyVariableName?: string): string {
    return dependencyVariableName !== void 0 && dependencyVariableName !== null
        ? dependencyVariableName
        : ''
    ;
}


function _nullToVoid0(value: any) {
    return value !== null
        ? value
        : void 0
    ;
}