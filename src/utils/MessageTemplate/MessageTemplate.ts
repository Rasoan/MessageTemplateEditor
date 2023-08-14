'use strict';

import {KEY_POSTFIX_SUBSTRING} from "./constants";
import {
    BlurSnippetMessageInformationDTO, BlurSnippetMessageInformationDTO_Props,
    IfThenElseBlockDTO,
    IfThenElseBlockDTO_Props,
    IfThenElseBlockInfoDTO,
    IfThenElseBlockInfoDTO_Props,
    IfThenElseBlockInfoJSON,
    IMessageTemplate,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
    MESSAGE_TEMPLATE_FIELD_TYPE, MessageFieldDetailsDTO, MessageFieldDetailsDTO_Props,
    MessageSnippetsDTO,
    MessageSnippetsDTO_Props,
    MessageTemplateDTO,
    MessageTemplateDTO_Props,
    MessageTemplateJSON,
} from "./types/MessageTemplate";
import messageSnippetsBlock from "../../components/MessageSnippetsBlock/MessageSnippetsBlock";

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
                    ifThenElseBlockJSON,
                } = ifThenElseBlockInfoJSON;

                this._mapOfIfThenElseBlocks.set(keyIfThenElseBlockJSON, ifThenElseBlockJSON);
            }

            return;
        }

        this._defaultMessageSnippets = {
            field: {
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
            pathToParentBlock,
            cursorPosition: positionSplitterInSubMessage,
        } = lastBlurSnippetMessageInformation;

        if (fieldType !== MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL) {
            throw new Error('Can split only initial block!');
        }

        const {
            _mapOfIfThenElseBlocks: mapOfIfThenElseBlocks,
        } = this;
        const key = MessageTemplate._createKeyForIfThenElseBlock(pathToParentBlock);

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

        for (const currentBlockIfThenElse of mapOfIfThenElseBlocks.values()) {
            const {
                messageSnippets_THEN,
                messageSnippets_ELSE,
            } = currentBlockIfThenElse;
            const {
                field: fieldBlock_then,
                fieldAdditional: fieldAdditionalBlock_then,
            } = messageSnippets_THEN;
            const {
                field: fieldBlock_else,
                fieldAdditional: fieldAdditionalBlock_else,
            } = messageSnippets_ELSE;

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

        messageSnippets_splitTarget.fieldAdditional = {
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

        this._defaultMessageSnippets.fieldAdditional.positionInResultMessage = this.countIfThenElseBlocks > 1
            /*
                При вставке первого IF_THEN_ELSE между основным и дополнительным полем
                вставляется 2 поля (THEN + ELSE).
             */
            ? splitTarget_positionInResultMessage + 4
            /*
                При вставке 2-го,3,4...N-ного IF_THEN_ELSE между первым и последним (дополнительным от первого) полем
                вставляется 3 поля (THEN + ELSE + дополнительное поле от разбитого).
            */
            : splitTarget_positionInResultMessage + 3
        ;

        // удалили вторую часть сообщения из разбитого поля
        splitTarget_field.message = splitTarget_message.slice(0, positionSplitterInSubMessage);
        splitTarget_field.isCanSplit = false;

        this._stateChangeNotify();
    }

    /**
     * Получить THEN или ELSE или первый блок
     *
     * @param pathToParentBlock - путь к родительскому блоку
     * @param blockType - тип блока (void 0 если первый блок НЕ вложенный в ifThenElse)
     */
    public getBlockInformationForce(
        pathToParentBlock?: IMessageTemplate.PathToBlock,
        blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE,
    ): IMessageTemplate.MessageSnippets {
        if (blockType === void 0) {
            return this._defaultMessageSnippets;
        }

        const key = MessageTemplate._createKeyForIfThenElseBlock(pathToParentBlock);
        const ifThenElseBlock: void | IMessageTemplate.IfThenElseBlock = this._mapOfIfThenElseBlocks.get(key);

        _assertIsIfThenElseBlock(ifThenElseBlock);

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
    public getDependencyVariableNameForce(pathToParentBlock?: IMessageTemplate.PathToBlock): string {
        const key = MessageTemplate._createKeyForIfThenElseBlock(pathToParentBlock);

        const ifThenElseBlock: void | IMessageTemplate.IfThenElseBlock = this._mapOfIfThenElseBlocks.get(key);

        _assertIsIfThenElseBlock(ifThenElseBlock);

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
            currentBlockType?: MESSAGE_TEMPLATE_BLOCK_TYPE,
            pathToParentBlock?: IMessageTemplate.PathToBlock,
        },
    ) {
        const {
            currentBlockType,
            fieldType,
            pathToParentBlock = '' as IMessageTemplate.PathToBlock,
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

        const key = MessageTemplate._createKeyForIfThenElseBlock(pathToParentBlock);

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
     * @param pathToParentBlock - путь к родительскому блоку (включая его самого) IF_THEN_ELSE {@link IMessageTemplate}
     */
    public setDependencyVariable(
        variableName: string,
        pathToParentBlock: IMessageTemplate.PathToBlock,
    ) {
        const key = MessageTemplate._createKeyForIfThenElseBlock(pathToParentBlock);

        const ifThenElseBlock: void | IMessageTemplate.IfThenElseBlock = this._mapOfIfThenElseBlocks.get(key);

        _assertIsIfThenElseBlock(ifThenElseBlock);

        ifThenElseBlock.dependencyVariableName = variableName;

        this._stateChangeNotify();
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
        const keyForNewIfThenElseBlock = MessageTemplate._createKeyForIfThenElseBlock(parentPathForNewIfThenElseBlock);

        const newIfThenElseBlock: IMessageTemplate.IfThenElseBlock = {
            pathToParentBlock,
            dependencyVariableName: '',
            messageSnippets_THEN: {
                field: {
                    message: '',
                    // новый field блока THEN будет на 1 после предыдущего родительского
                    positionInResultMessage: positionPreviousFieldInResultMessage + 1,
                    isCanSplit: true,
                },
            },
            messageSnippets_ELSE: {
                field: {
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
                ifThenElseBlockJSON: ifThenElseBlock,
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

        for (const { key: keyIfThenElseBlock, ifThenElseBlockJSON } of ifThenElseBlockInfoListJSON) {
            const ifThenElseBlockInfoDTO = new Array(IfThenElseBlockInfoDTO_Props.__SIZE__) as IfThenElseBlockInfoDTO;

            ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.key] = keyIfThenElseBlock;

            const ifThenElseBlockDTO = new Array(IfThenElseBlockDTO_Props.__SIZE__) as IfThenElseBlockDTO;

            const {
                messageSnippets_THEN,
                messageSnippets_ELSE,
                pathToParentBlock,
                dependencyVariableName,
            } = ifThenElseBlockJSON;

            ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_THEN] = _messageSnippetsJSONToDTO(messageSnippets_THEN);
            ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_ELSE] = _messageSnippetsJSONToDTO(messageSnippets_ELSE);
            ifThenElseBlockDTO[IfThenElseBlockDTO_Props.dependencyVariableName] = dependencyVariableName;
            ifThenElseBlockDTO[IfThenElseBlockDTO_Props.pathToParentBlock] = pathToParentBlock;

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
                pathToParentBlock,
                cursorPosition,
            } = lastBlurSnippetMessageInformation;

            const blurSnippetMessageInformationDTO = new Array(BlurSnippetMessageInformationDTO_Props.__SIZE__) as BlurSnippetMessageInformationDTO;

            blurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.blockType] = blockType;
            blurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.fieldType] = fieldType;
            blurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.cursorPosition] = cursorPosition;
            blurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.pathToParentBlock] = pathToParentBlock;

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
                    ifThenElseBlockJSON: {
                        messageSnippets_ELSE: _messageSnippetsDTOtoJSON(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_ELSE]),
                        messageSnippets_THEN: _messageSnippetsDTOtoJSON(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_THEN]),
                        pathToParentBlock: ifThenElseBlockDTO[IfThenElseBlockDTO_Props.pathToParentBlock],
                        dependencyVariableName: _normalizeString(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.dependencyVariableName]),
                    },
                    key: ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.key],
                };
            }),
            lastBlurSnippetMessageInformation: {
                fieldType: lastBlurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.fieldType],
                pathToParentBlock: lastBlurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.pathToParentBlock],
                blockType: lastBlurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.blockType],
                cursorPosition: lastBlurSnippetMessageInformationDTO[BlurSnippetMessageInformationDTO_Props.cursorPosition],
            },
        };
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
     * @param pathToParentBlock - путь к родительскому блоку (включая его самого) (если void 0, то это путь к первому ifThenElse)
     * @private
     */
    private static _createKeyForIfThenElseBlock(
        pathToParentBlock?: IMessageTemplate.PathToBlock,
    ): IMessageTemplate.KeyIfThenElseBlock {
        const prefix = pathToParentBlock !== void 0
            ? pathToParentBlock
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
        field,
        fieldAdditional,
    } = messageSnippetsJSON;

    // field
    {
        const {
            message,
            positionInResultMessage,
            isCanSplit,
        } = field;
        const messageFieldDetailsDTO = new Array(MessageFieldDetailsDTO_Props.__SIZE__) as MessageFieldDetailsDTO;

        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.message] = message;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.positionInResultMessage] = positionInResultMessage;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.isCanSplit] = isCanSplit;

        messageSnippetsDTO[MessageSnippetsDTO_Props.field] = messageFieldDetailsDTO;
    }

    // field additional
    if (fieldAdditional !== void 0) {
        const {
            message,
            positionInResultMessage,
            isCanSplit,
        } = fieldAdditional;
        const messageFieldDetailsDTO = new Array(MessageFieldDetailsDTO_Props.__SIZE__) as MessageFieldDetailsDTO;

        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.message] = message;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.positionInResultMessage] = positionInResultMessage;
        messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.isCanSplit] = isCanSplit;

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
    const fieldJSON = {
        message: _normalizeString(fieldDTO[MessageFieldDetailsDTO_Props.message]),
        isCanSplit: fieldDTO[MessageFieldDetailsDTO_Props.isCanSplit],
        positionInResultMessage: fieldDTO[MessageFieldDetailsDTO_Props.positionInResultMessage],
    };

    if (!fieldAdditionalDTO) {
        return {
            field: fieldJSON,
        }
    }

    if (fieldAdditionalDTO[MessageFieldDetailsDTO_Props.isCanSplit] === true) {
        throw new Error('Flag isCanSplit of fieldAdditionalDTO can\'t be true!');
    }

    return {
        field: fieldJSON,
        fieldAdditional: {
            message: _normalizeString(fieldAdditionalDTO[MessageFieldDetailsDTO_Props.message]),
            isCanSplit: fieldAdditionalDTO[MessageFieldDetailsDTO_Props.isCanSplit],
            positionInResultMessage: fieldAdditionalDTO[MessageFieldDetailsDTO_Props.positionInResultMessage],
        },
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