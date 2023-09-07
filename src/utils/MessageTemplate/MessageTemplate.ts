'use strict';
import {
    IfThenElseBlockDTO,
    IfThenElseBlockDTO_Props,
    IfThenElseBlockInfoDTO,
    IfThenElseBlockInfoDTO_Props,
    IfThenElseBlockInfoJSON,
    IMessageTemplate,
    LastBlurInformationDTO,
    LastBlurInformationDTO_Props,
    LastBlurSnippetMessageInformationDTO,
    LastBlurSnippetMessageInformationDTO_Props,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
    MESSAGE_TEMPLATE_FIELD_TYPE,
    MessageFieldDetailsDTO,
    MessageFieldDetailsDTO_Props,
    MessageSnippetsDTO,
    MessageSnippetsDTO_Props,
    MessageTemplateDTO,
    MessageTemplateDTO_Props,
    MessageTemplateJSON,
    VariableInfoDTO,
    VariableInfoJSON,
} from "./types/MessageTemplate";
import {MAX_RECURSION_OF_NESTED_BLOCKS} from "../constants";
import {generatorMessage, REGEXP_FOR_FIND_KEYS_OF_VARIABLES} from "../utils";

/** Количество добавляемых текстовых полей (THEN + ELSE). */
const QUANTITY_NEW_FIELDS = 3;
/** Разделитель для путей */
const SEPARATOR_FOR_PATH = '/';

/** Класс, который работает с шаблоном сообщения */
export default class MessageTemplate {
    /** Первое и последнее (если разбили первое) поля для ввода текста */
    private readonly _defaultMessageSnippets: IMessageTemplate.MessageSnippets;
    private readonly _stateChangeNotify: Function;
    private _lastBlurInformation: IMessageTemplate.LastBlurInformation;
    private _variables: Map<string, string>;

    /** map-а со значениями полей THEN и ELSE */
    private _mapOfIfThenElseBlocks = new Map<
        IMessageTemplate.KeyIfThenElseBlock,
        IMessageTemplate.IfThenElseBlock
    >();

    constructor(options: IMessageTemplate.Options) {
        const {
            stateChangeNotify,
            messageTemplateJSON,
            variablesList = [
                'firstname',
                'lastname',
                'company',
                'position',
            ],
        } = options;

        this._stateChangeNotify = stateChangeNotify;

        if (messageTemplateJSON !== void 0) {
            const {
                ifThenElseBlockInfoListJSON,
                lastBlurInformation,
                defaultMessageSnippets,
            } = messageTemplateJSON;

            this._defaultMessageSnippets = defaultMessageSnippets;
            this._lastBlurInformation = lastBlurInformation;

            for (const ifThenElseBlockInfoJSON of ifThenElseBlockInfoListJSON) {
                const {
                    key: keyIfThenElseBlockJSON,
                    ifThenElseBlock,
                } = ifThenElseBlockInfoJSON;

                this._mapOfIfThenElseBlocks.set(keyIfThenElseBlockJSON, ifThenElseBlock);
            }
        }
        else {
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
            this._lastBlurInformation = {
                cursorPosition: 0,
                snippetMessageInformation: {
                    fieldType: MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL,
                },
                insertedVariablesVersion: 0,
            }
        }

        this._variables = new Map(variablesList.map((key) => [ key, '' ]));
    }

    /** Очистить все поля */
    public reset = () => {
        this._mapOfIfThenElseBlocks.clear();

        for (const variableKey of this._variables.keys()) {
            this._variables.set(variableKey, '');
        }

        this._defaultMessageSnippets.field = {
            ...this._defaultMessageSnippets.field,
            message: '',
            isCanSplit: true,
        }
        this._defaultMessageSnippets.fieldAdditional = void 0;

        this._lastBlurInformation = {
            cursorPosition: 0,
            snippetMessageInformation: {
                fieldType: MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL,
            },
            insertedVariablesVersion: 0,
        }
    }

    get lastBlurInformation() {
        return this._lastBlurInformation;
    }

    /** Количество IF_THEN_ELSE блоков */
    get countIfThenElseBlocks() {
        return this._mapOfIfThenElseBlocks.size;
    }

    /** Массив названий переменных */
    get variablesKeysList() {
        return [ ...this._variables.keys() ];
    }

    /**
     * Получить значение переменной из блока переменных
     */
    public getVariableValue = (key: string, options?: { force: boolean }) => {
        const {
            force,
        } = options || {};
        const variableValue = this._variables.get(key);

        if (force !== void 0 && variableValue === void 0) {
            throw new Error('Can\'t find variable!');
        }

        return variableValue;
    }

    /**
     *
     * @param key - название переменной
     * @param value - её значение
     */
    public changeVariable = (value: string, key: string) => {
        const variable = this._variables.get(key);

        if (variable === void 0) {
            throw new Error('Can\'t find variable!');
        }

        this._variables.set(key, value);

        this._stateChangeNotify();
    }

    public clearVariablesValue = () => {
        for (const variableKey of this._variables.keys()) {
            this._variables.set(variableKey, '');
        }

        this._stateChangeNotify();
    }

    public insertVariableInSubMessage(variable: string) {
        const variableWithModifier = `{${variable}}`;
        const {
            _lastBlurInformation: lastBlurInformation,
        } = this;
        const {
            pathToIfThenElseBlock,
            cursorPosition: lastBlur_cursorPosition,
            snippetMessageInformation: lastBlur_snippetMessageInformation,
        } = lastBlurInformation;
        const {
            blockType: lastBlur_blockType,
            fieldType: lastBlur_fieldType,
        } = lastBlur_snippetMessageInformation || {};

        if (
            // если тип блока есть, то это ifThenElse
            lastBlur_blockType
            // если типа поля нет, то это IF у ifThenElse
            || !lastBlur_fieldType
        ) {
            const ifThenElse = this.getIfThenElse(
                pathToIfThenElseBlock,
                { force: true }
            ) as IMessageTemplate.IfThenElseBlock;
            const {
                fieldType: lastBlur_fieldType,
                blockType: lastBlur_blockType,
            } = lastBlur_snippetMessageInformation || {};
            const {
                messageSnippets_THEN,
                messageSnippets_ELSE,
            } = ifThenElse;

            // если типа поля нет, то это IF у ifThenElse
            if (!lastBlur_fieldType) {
                ifThenElse.conditionalIf = insertSubstringInString(
                    ifThenElse.conditionalIf,
                    variableWithModifier,
                    lastBlur_cursorPosition
                );
            }
            else if (lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN) {
                const {
                    field,
                    fieldAdditional,
                } = messageSnippets_THEN;

                if (lastBlur_fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL) {
                    field.message = insertSubstringInString(
                        field.message,
                        variableWithModifier,
                        lastBlur_cursorPosition,
                    );
                }
                else if (lastBlur_fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL) {
                    fieldAdditional.message = insertSubstringInString(
                        fieldAdditional.message,
                        variableWithModifier,
                        lastBlur_cursorPosition,
                    );
                }
                else {
                    throw new Error('Unknown block!');
                }
            }
            else if (lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE) {
                const {
                    field,
                    fieldAdditional,
                } = messageSnippets_ELSE;

                if (lastBlur_fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL) {
                    field.message = insertSubstringInString(
                        field.message,
                        variableWithModifier,
                        lastBlur_cursorPosition
                    );
                }
                else if (lastBlur_fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL) {
                    fieldAdditional.message = insertSubstringInString(
                        fieldAdditional.message,
                        variableWithModifier,
                        lastBlur_cursorPosition,
                    );
                }
                else {
                    throw new Error('Unknown block!');
                }
            }
            else {
                throw new Error('Unknown block!');
            }
        }
        // если тип блока не найден, то это первый блок не входящий в ifThenElse и сам не являющийся ifThenElse
        else {
            const {
                _defaultMessageSnippets: defaultMessageSnippets,
            } = this;
            const {
                field,
                fieldAdditional,
            } = defaultMessageSnippets;

            if (lastBlur_fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL) {
                field.message = insertSubstringInString(field.message, variableWithModifier, lastBlur_cursorPosition);
            }
            else if (lastBlur_fieldType === MESSAGE_TEMPLATE_FIELD_TYPE.ADDITIONAL) {
                fieldAdditional.message = insertSubstringInString(
                    fieldAdditional.message,
                    variableWithModifier,
                    lastBlur_cursorPosition,
                );
            }
            else {
                throw new Error('Unknown block!');
            }
        }

        lastBlurInformation.cursorPosition += variableWithModifier.length;
        lastBlurInformation.insertedVariablesVersion++;

        this._stateChangeNotify();
    }

    public setLastBlurInformation(blurSnippetMessageInformation: Omit<IMessageTemplate.LastBlurInformation, 'insertedVariablesVersion'>) {
        this._lastBlurInformation = {
            ...blurSnippetMessageInformation,
            // версию нельзя изменять снаружи, только изнутри и специально для выставления фокуса в поле
            insertedVariablesVersion: this._lastBlurInformation.insertedVariablesVersion,
        };

        this._stateChangeNotify();
    }

    /**
     * Разбить текущее поле на 2 и вставить между разбитым и новым полем новый блок IF_THEN_ELSE
     */
    public splitFieldAndInsertIfThenElseBlock() {
        const {
            _lastBlurInformation: lastBlurInformation,
        } = this;

        if (lastBlurInformation === void 0) {
            throw new Error('Can\'t split unknown block!');
        }

        const {
            pathToIfThenElseBlock,
            cursorPosition: positionSplitterInSubMessage,
            snippetMessageInformation,
        } = lastBlurInformation;
        const {
            fieldType,
            blockType: currentBlockType,
        } = snippetMessageInformation || {};

        if (!snippetMessageInformation) {
            throw new Error('Can\'t split conditional block "IF"!');
        }

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
        this._defaultMessageSnippets.fieldAdditional.positionInResultMessage = Number.MAX_VALUE;

        // удалили вторую часть сообщения из разбитого поля
        splitTarget_field.message = splitTarget_message.slice(0, positionSplitterInSubMessage);
        splitTarget_field.isCanSplit = false;

        this._stateChangeNotify();
    }

    /**
     * Получить ifThenElse блок
     *
     * @param path - путь к ifThenElse блоку
     * @param options
     * @param options.force - если указали force, то вернёт или ifThenElse или ошибку выкинет, если не передать force, то может вернуть void 0
     */
    public getIfThenElse(path?: IMessageTemplate.PathToBlock | void, options?: { force: boolean }): IMessageTemplate.IfThenElseBlock | void {
        const {
            force,
        } = options || {};
        const key = MessageTemplate._createKeyForIfThenElseBlock(path);
        const ifThenElseBlock: void | IMessageTemplate.IfThenElseBlock = this._mapOfIfThenElseBlocks.get(key);

        if (force) {
            _assertIsIfThenElseBlock(ifThenElseBlock);
        }

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

        const ifThenElseBlock = this
            .getIfThenElse(pathToParentBlock, { force: true }) as IMessageTemplate.IfThenElseBlock
        ;

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
        const ifThenElseBlock: IMessageTemplate.IfThenElseBlock = this
            .getIfThenElse(pathToParentBlock, { force: true }) as IMessageTemplate.IfThenElseBlock
        ;

        return ifThenElseBlock.conditionalIf;
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

        ifThenElseBlock.conditionalIf = variableName;

        this._stateChangeNotify();
    }

    /**
     * Создать IF_THEN_ELSE блок
     *
     * @param positionPreviousFieldInResultMessage - позиция в результирующем сообщении первой части разбитого на 2 field
     * @param path - путь к создаваемому ifThenElse блоку
     * @private
     */
    private _createIfThenElseBlock(
        positionPreviousFieldInResultMessage: number,
        path?: IMessageTemplate.PathToBlock | void,
    ) {
        const keyForNewIfThenElseBlock = MessageTemplate._createKeyForIfThenElseBlock(path);

        const newIfThenElseBlock: IMessageTemplate.IfThenElseBlock = {
            path,
            conditionalIf: '',
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

        this._lastBlurInformation = {
            pathToIfThenElseBlock: newIfThenElseBlock.path,
            cursorPosition: 0,
            insertedVariablesVersion: 0,
        };
    }

    /**
     * Получить массив с объектами в которых информация о родительских ifThenElse
     *
     * @param path - путь к ifThenElse для которого получаем информацию
     */
    public getAllParentsIfThenElseInfoByPath(path?: IMessageTemplate.PathToBlock | void): IMessageTemplate.ParentIfThenElseInfoForChildIfThenElseBlock[] {
        // Для первого ifThenElse будет именно так
        if (!path) {
            return [];
        }

        const allParentsBlocks = path.split('/');
        const parentIfThenElseInfoListForChildIfThenElseBlock: IMessageTemplate.ParentIfThenElseInfoForChildIfThenElseBlock[] = [];

        for (let index = allParentsBlocks.length - 1; index >= 0; index--) {
            const lastParentBlockType = allParentsBlocks[index];

            const path = allParentsBlocks.slice(0, allParentsBlocks.length - 1).join('/');
            const parentIfThenElseInfoForChildIfThenElseBlock: IMessageTemplate.ParentIfThenElseInfoForChildIfThenElseBlock = {
                // не сохраняем пустой путь, путь или void 0, или хотя бы один блок должен быть в пути
                path: path !== ''
                    ? path as IMessageTemplate.PathToBlock
                    : void 0,
                blockType: Number(lastParentBlockType) as MESSAGE_TEMPLATE_BLOCK_TYPE,
            };

            allParentsBlocks.length--;
            parentIfThenElseInfoListForChildIfThenElseBlock.push(parentIfThenElseInfoForChildIfThenElseBlock);
        }

        // восстановим очередность путей
        return parentIfThenElseInfoListForChildIfThenElseBlock.reverse();
    }

    /**
     * Получить ближайший родительский ifThenElse
     *
     * @param path - путь к ifThenElse для которого получаем информацию
     */
    public getParentIfThenElseInfoByPath(path?: IMessageTemplate.PathToBlock | void): IMessageTemplate.ParentIfThenElseInfoForChildIfThenElseBlock | void {
        const allParentsIfThenElseInfoByPath = this.getAllParentsIfThenElseInfoByPath(path)

        // последний ifThenElse в массиве будет ближайшим родителем
        return allParentsIfThenElseInfoByPath[allParentsIfThenElseInfoByPath.length - 1];
    }

    /**
     *
     * @param path - путь к ifThenElse который удаляем
     */
    public deleteIfThenElse(path?: IMessageTemplate.PathToBlock | void) {
        const keyOfIfThenElseBlock = MessageTemplate._createKeyForIfThenElseBlock(path);

        this._mapOfIfThenElseBlocks.delete(keyOfIfThenElseBlock);

        const parentIfThenElseInfo: IMessageTemplate.ParentIfThenElseInfoForChildIfThenElseBlock | void = this.getParentIfThenElseInfoByPath(path);
        if (parentIfThenElseInfo) {
            const {
                path: pathToParentIfThenElse,
                blockType,
            } = parentIfThenElseInfo;
            const parentIfThenElse = this.getIfThenElse(pathToParentIfThenElse, { force: true }) as IMessageTemplate.IfThenElseBlock;
            const block = blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
                ? parentIfThenElse.messageSnippets_THEN
                : parentIfThenElse.messageSnippets_ELSE
            ;
            const {
                field,
                fieldAdditional,
            } = block;
            const {
                fieldType,
                message,
            } = field;
            const {
                message: message_fieldAdditional,
            } = fieldAdditional;

            block.field = {
                ...block.field,
                isCanSplit: true,
                message: message + message_fieldAdditional,
            }

            this._lastBlurInformation = {
                cursorPosition: message.length,
                pathToIfThenElseBlock: pathToParentIfThenElse,
                snippetMessageInformation: {
                    blockType,
                    fieldType,
                },
                insertedVariablesVersion: 0,
            };

            block.fieldAdditional = void 0;
        }
        else {
            const block = this._defaultMessageSnippets;
            const {
                field,
                fieldAdditional,
            } = block;
            const {
                fieldType,
                message,
            } = field;
            const {
                message: message_fieldAdditional,
            } = fieldAdditional;

            block.field = {
                ...block.field,
                isCanSplit: true,
                message: message + message_fieldAdditional,
            }

            this._lastBlurInformation = {
                cursorPosition: message.length,
                snippetMessageInformation: {
                    fieldType,
                },
                insertedVariablesVersion: 0,
            };

            block.fieldAdditional = void 0;
        }

        for (const [ currentIfThenElseKey, currentIfThenElseValue ] of this._mapOfIfThenElseBlocks.entries()) {
            const {
                _mapOfIfThenElseBlocks: mapOfIfThenElseBlocks,
            } = this;
            const {
                path: currentIfThenElse_path,
            } = currentIfThenElseValue;

            if (path) {
                // Если у текущего ifThenElse есть путь, значит он вложен, значит возможно он входит в удалённый ifThenElse
                if (currentIfThenElse_path) {
                    /*
                        Если путь удалённого (родительского по отношения к текущему) ifThenElse входит в путь текущего ifThenElse,
                         значит он ребёнок удалённого ifThenElse,
                         значит его так-же по цепочке удаляем.
                     */
                    if (currentIfThenElse_path.includes(path)) {
                        const currentIfThenElseKey = MessageTemplate._createKeyForIfThenElseBlock(currentIfThenElse_path);

                        mapOfIfThenElseBlocks.delete(currentIfThenElseKey);
                    }
                }
            }
            /*
                Если у ifThenELse нет пути, значит это первый ifThenElse был удалён,
                значит проверять и вовсе ничего не надо, сносим все ifThenElse.
             */
            else {
                mapOfIfThenElseBlocks.clear();
            }
        }

        this._stateChangeNotify();
    }

    /**
     * Проверить текстовое поле на то, что последний раз курсор был именно в нём
     *
     * @param fieldType - тип текстового поля, опциональный, void 0 если это IF
     * @param path - путь к блоку ifThenElse текстового поля
     * @param blockType - тип блока в котором находится текстовое поле
     */
    public checkIsLastBlurField(
        path?: IMessageTemplate.PathToBlock | void,
        fieldType?: MESSAGE_TEMPLATE_FIELD_TYPE | void,
        blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE | void,
    ): boolean {
        const {
            pathToIfThenElseBlock: lastBlurSnippet_pathToIfThenElseBlock,
            snippetMessageInformation,
        } = this._lastBlurInformation;
        const {
            fieldType: lastBlurSnippet_fieldType,
            blockType: lastBlurSnippet_blockType,
        } = snippetMessageInformation || {};

        if (
            // если у последнего выделенного поля нет типа этого поля, то это точно IF, а значит проверяем только путь
            fieldType === void 0
            /*
                Но и у If так же нет типа поля, значит проверим, что выделен был именно IF.

                Итого, проверяем на if ТОЛЬКО в том случае если САМО поле проверяющее является IF
                И если выделенным последнее поле было IF

                В целом, да, нужно было добавить тип для поля IF, что бы на это можно было проверять, но переделывать уже не буду,
                но если бы проект был боевым, то да, надо бы переделать это место, проверка на void 0 стала какой-то слишком умной и
                замудрённой.
             */
            && lastBlurSnippet_fieldType === void 0
        ) {
            return path === lastBlurSnippet_pathToIfThenElseBlock;
        }

        return path === lastBlurSnippet_pathToIfThenElseBlock
            && blockType === lastBlurSnippet_blockType
            && fieldType === lastBlurSnippet_fieldType;
    }

    get previewWidget() {
        const filledVariablesList: string[] = [];
        const resultIfThenElseList: IMessageTemplate.IfThenElseBlock[] = [];

        for (const [ variableKey, variableValue] of this._variables.entries()) {
            if (variableValue !== '') {
                filledVariablesList.push(
                    _keyToVariable(variableKey)
                );
            }
        }

        for (const currentIfThenElse of this._mapOfIfThenElseBlocks.values()) {
            /** Здесь выставится false если ifThenElse не попадает в результирующее сообщение */
            let isIncludeInResultIfThenElse = true;
            const {
                path,
            } = currentIfThenElse;

            // если path отсутствует, то это первый ifThenElse, он точно будет в результирующем сообщении
            if (!path) {
                resultIfThenElseList.push(currentIfThenElse);

                continue;
            }

            const listOfParentBlocks = path.split(SEPARATOR_FOR_PATH);

            // начинаем с последнего и идём к первому
            for (let index = listOfParentBlocks.length - 1; index >= 0; index--) {
                const parentBlockType: MESSAGE_TEMPLATE_BLOCK_TYPE = Number(
                    listOfParentBlocks.pop()
                ) as MESSAGE_TEMPLATE_BLOCK_TYPE;
                const pathToParentBlock = listOfParentBlocks.join(
                    SEPARATOR_FOR_PATH,
                ) as IMessageTemplate.PathToBlock;
                const parentIfThenElse = this.getIfThenElse(
                    pathToParentBlock,
                    { force: true },
                ) as IMessageTemplate.IfThenElseBlock;
                const {
                    conditionalIf,
                } = parentIfThenElse;
                /** Если здесь false, то переменная из поля IF пустая (не заполнена), значит рисуем ELSE */
                const isEmptyDependencyVariable = !filledVariablesList.includes(conditionalIf);

                if (parentBlockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE) {
                    if (!isEmptyDependencyVariable) {
                        isIncludeInResultIfThenElse = false;
                    }
                }
                else if (parentBlockType === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN) {
                    if (isEmptyDependencyVariable) {
                        isIncludeInResultIfThenElse = false;
                    }
                }
                else {
                    throw new Error('Unknown block type');
                }
            }

            if (isIncludeInResultIfThenElse) {
                resultIfThenElseList.push(currentIfThenElse);
            }
        }

        const resultBlocksOfIfThenElseList: IMessageTemplate.MessageSnippets[] = [];

        for (const currentIfThenElse of resultIfThenElseList) {
            const {
                messageSnippets_THEN,
                messageSnippets_ELSE,
                conditionalIf,
            } = currentIfThenElse;
            const listOfSubstringsOfConditionalIf = conditionalIf.split(REGEXP_FOR_FIND_KEYS_OF_VARIABLES)
                // почистим пустые строки
                .filter(substring => substring !== '')
            ;
            /** счётчик заполненных переменных из текста из блока if */
            let countFilledVariables = 0;
            let isPushedThenOrElseBlock = false;
            for (const substringOfConditionalIf of listOfSubstringsOfConditionalIf) {
                const isKeyOfVariable = Array.from(this._variables.keys())
                    .map(variableKey => `{${variableKey}}`)
                    .includes(substringOfConditionalIf)
                ;

                // если текущая строка - ключ переменной
                if (isKeyOfVariable) {
                    if (filledVariablesList.includes(substringOfConditionalIf)) {
                        countFilledVariables++;
                    }
                }
                // любой текст если есть в if отличающийся от переменной - значит это true
                else {
                    resultBlocksOfIfThenElseList.push(messageSnippets_THEN);

                    isPushedThenOrElseBlock = true;

                    break;
                }
            }

            if (!isPushedThenOrElseBlock) {
                // если только заполненные переменные в If, то это true
                if (countFilledVariables === listOfSubstringsOfConditionalIf.length) {
                    resultBlocksOfIfThenElseList.push(messageSnippets_THEN);
                }
                // иначе только переменные и среди них есть не заполненные, значит false
                else {
                    resultBlocksOfIfThenElseList.push(messageSnippets_ELSE);
                }
            }
        }

        const resultFields: IMessageTemplate.MessageFieldDetails[] = [
            this._defaultMessageSnippets,
            ...resultBlocksOfIfThenElseList,
        ].reduce((fieldsDetails: IMessageTemplate.MessageFieldDetails[], messageSnippet: IMessageTemplate.MessageSnippets) => {
            const {
                field,
                fieldAdditional,
            } = messageSnippet;

            fieldsDetails.push(field);

            if (fieldAdditional) {
                fieldsDetails.push(fieldAdditional);
            }

            return fieldsDetails;
        }, [])
            .sort((fieldPrev, fieldNext) => {
                return fieldPrev.positionInResultMessage - fieldNext.positionInResultMessage
            })
        ;

        const resultString = resultFields.reduce((resultMessage, fieldDetails) => {
            return resultMessage + fieldDetails.message;
        }, '');

        return generatorMessage(resultString, Object.fromEntries(this._variables));
    }

    public variablesListToDTO(): IMessageTemplate.VariablesListDTO {
        return [ ...this._variables.keys() ];
    }

    public toJSON(): MessageTemplateJSON {
        const ifThenElseBlockInfoListJSON: IfThenElseBlockInfoJSON[] = [];

        for (const [
            keyIfThenElseBlock,
            ifThenElseBlock
        ] of this._mapOfIfThenElseBlocks.entries()) {
            ifThenElseBlockInfoListJSON.push({
                ifThenElseBlock,
                key: keyIfThenElseBlock,
            });
        }

        return {
            ifThenElseBlockInfoListJSON,
            lastBlurInformation: this._lastBlurInformation,
            defaultMessageSnippets: this._defaultMessageSnippets,
        }
    }

    // todo: восстановить DTO
    public toDTO(): MessageTemplateDTO {
        const messageTemplateJSON = this.toJSON();

        return messageTemplateJSON as unknown as MessageTemplateDTO;
    }
    // public toDTO(): MessageTemplateDTO {
    //     const messageTemplateJSON = this.toJSON();
    //
    //     const ifThenElseDTOList: IfThenElseBlockInfoDTO[] = [];
    //     const {
    //         ifThenElseBlockInfoListJSON,
    //         lastBlurInformation,
    //         defaultMessageSnippets,
    //     } = messageTemplateJSON;
    //
    //     for (const { key: keyIfThenElseBlock, ifThenElseBlock } of ifThenElseBlockInfoListJSON) {
    //         const ifThenElseBlockInfoDTO = new Array(IfThenElseBlockInfoDTO_Props.__SIZE__) as IfThenElseBlockInfoDTO;
    //
    //         ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.key] = keyIfThenElseBlock;
    //
    //         const ifThenElseBlockDTO = new Array(IfThenElseBlockDTO_Props.__SIZE__) as IfThenElseBlockDTO;
    //
    //         const {
    //             messageSnippets_THEN,
    //             messageSnippets_ELSE,
    //             path,
    //             conditionalIf,
    //         } = ifThenElseBlock;
    //
    //         ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_THEN] = _messageSnippetsJSONToDTO(messageSnippets_THEN);
    //         ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_ELSE] = _messageSnippetsJSONToDTO(messageSnippets_ELSE);
    //         ifThenElseBlockDTO[IfThenElseBlockDTO_Props.dependencyVariableName] = conditionalIf;
    //         ifThenElseBlockDTO[IfThenElseBlockDTO_Props.path] = path;
    //
    //         ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.ifThenElseBlockDTO] = ifThenElseBlockDTO;
    //
    //         ifThenElseDTOList.push(ifThenElseBlockInfoDTO);
    //     }
    //
    //     const messageTemplateDTO = new Array(MessageTemplateDTO_Props.__SIZE__) as MessageTemplateDTO;
    //
    //     messageTemplateDTO[MessageTemplateDTO_Props.ifThenElseDTOList] = ifThenElseDTOList;
    //     messageTemplateDTO[MessageTemplateDTO_Props.defaultMessageSnippets] = _messageSnippetsJSONToDTO(defaultMessageSnippets);
    //
    //     if (lastBlurInformation !== void 0) {
    //         const {
    //             pathToIfThenElseBlock,
    //             cursorPosition,
    //             snippetMessageInformation,
    //             insertedVariablesVersion,
    //         } = lastBlurInformation;
    //
    //         const lastBlurInformationDTO = new Array(LastBlurInformationDTO_Props.__SIZE__) as LastBlurInformationDTO;
    //
    //         if (snippetMessageInformation) {
    //             const {
    //                 fieldType,
    //                 blockType,
    //             } = snippetMessageInformation;
    //
    //             const lastBlurSnippetMessageInformationDTO = new Array(LastBlurSnippetMessageInformationDTO_Props.__SIZE__) as LastBlurSnippetMessageInformationDTO;
    //
    //             lastBlurSnippetMessageInformationDTO[LastBlurSnippetMessageInformationDTO_Props.blockType] = blockType;
    //             lastBlurSnippetMessageInformationDTO[LastBlurSnippetMessageInformationDTO_Props.fieldType] = fieldType;
    //
    //             lastBlurInformationDTO[LastBlurInformationDTO_Props.snippetMessageInformationDTO] = lastBlurSnippetMessageInformationDTO;
    //         }
    //
    //         lastBlurInformationDTO[LastBlurInformationDTO_Props.cursorPosition] = cursorPosition;
    //         lastBlurInformationDTO[LastBlurInformationDTO_Props.pathToIfThenElseBlock] = pathToIfThenElseBlock;
    //         lastBlurInformationDTO[LastBlurInformationDTO_Props.insertedVariablesVersion] = insertedVariablesVersion;
    //
    //         messageTemplateDTO[MessageTemplateDTO_Props.lastBlurSnippetMessageInformation] = lastBlurInformationDTO;
    //     }
    //
    //     return messageTemplateDTO;
    // }

    // todo: восстановить DTO
    public static fromDTO(
        messageTemplateDTO: MessageTemplateDTO,
        stateChangeNotify: Function,
        variablesList: IMessageTemplate.VariablesListDTO,
    ): MessageTemplate {
        const messageTemplateJSON: MessageTemplateJSON = MessageTemplate.dtoToJSON(messageTemplateDTO);

        return new MessageTemplate({
            messageTemplateJSON,
            stateChangeNotify,
            variablesList,
        });
    }
    // public static fromDTO(
    //     messageTemplateDTO: MessageTemplateDTO,
    //     stateChangeNotify: Function,
    //     variablesList: IMessageTemplate.VariablesListDTO,
    // ): MessageTemplate {
    //     const messageTemplateJSON: MessageTemplateJSON = MessageTemplate.dtoToJSON(messageTemplateDTO);
    //
    //     return new MessageTemplate({
    //         messageTemplateJSON,
    //         stateChangeNotify,
    //         variablesList,
    //     });
    // }

    // todo: восстановить DTO
    static dtoToJSON(messageTemplateDTO: MessageTemplateDTO): MessageTemplateJSON {
        return messageTemplateDTO as unknown as MessageTemplateJSON;
    }
    // static dtoToJSON(messageTemplateDTO: MessageTemplateDTO): MessageTemplateJSON {
    //     const lastBlurInformationDTO: LastBlurInformationDTO = messageTemplateDTO[MessageTemplateDTO_Props.lastBlurSnippetMessageInformation];
    //     const snippetMessageInformationDTO: LastBlurSnippetMessageInformationDTO | void = lastBlurInformationDTO[LastBlurInformationDTO_Props.snippetMessageInformationDTO];
    //
    //     return {
    //         defaultMessageSnippets: _messageSnippetsDTOtoJSON(messageTemplateDTO[MessageTemplateDTO_Props.defaultMessageSnippets]),
    //         ifThenElseBlockInfoListJSON: messageTemplateDTO[MessageTemplateDTO_Props.ifThenElseDTOList].map((ifThenElseBlockInfoDTO: IfThenElseBlockInfoDTO) => {
    //             const ifThenElseBlockDTO: IfThenElseBlockDTO = ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.ifThenElseBlockDTO];
    //
    //             return {
    //                 ifThenElseBlock: {
    //                     path: _nullToVoid0(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.path]),
    //                     conditionalIf: _normalizeString(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.dependencyVariableName]),
    //                     messageSnippets_ELSE: _messageSnippetsDTOtoJSON(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_ELSE]),
    //                     messageSnippets_THEN: _messageSnippetsDTOtoJSON(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_THEN]),
    //                 },
    //                 key: ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.key],
    //             };
    //         }),
    //         lastBlurInformation: {
    //             pathToIfThenElseBlock: _nullToVoid0(lastBlurInformationDTO[LastBlurInformationDTO_Props.pathToIfThenElseBlock]),
    //             cursorPosition: lastBlurInformationDTO[LastBlurInformationDTO_Props.cursorPosition],
    //             snippetMessageInformation: snippetMessageInformationDTO
    //                 ? {
    //                     fieldType: _nullToVoid0(snippetMessageInformationDTO[LastBlurSnippetMessageInformationDTO_Props.fieldType]),
    //                     blockType: _nullToVoid0(snippetMessageInformationDTO[LastBlurSnippetMessageInformationDTO_Props.blockType]),
    //                 }
    //                 : void 0,
    //             insertedVariablesVersion: lastBlurInformationDTO[LastBlurInformationDTO_Props.insertedVariablesVersion],
    //         },
    //     };
    // }

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
        return (path ? path: '') as IMessageTemplate.KeyIfThenElseBlock;
    }

    public static checkMaxNestedIfThenElse(countNested: number) {
        if (countNested > MAX_RECURSION_OF_NESTED_BLOCKS) {
            const textError = 'Превышен порог максимальной вложенности ifThenElse друг в друга, программа зациклилась!';

            // todo: я бы сделал так, нужно поставить фиксатор на ограничение рекурсивной вложенности,
            //  но поскольку этого в ТЗ нет, ограничусь console.error.
            // throw new Error(textError);

            console.error(textError);
        }
    }
}

function _checkIsIfThenElseBlock(
    ifThenElseBlock: IMessageTemplate.IfThenElseBlock | any,
): ifThenElseBlock is IMessageTemplate.IfThenElseBlock  {
    if (typeof ifThenElseBlock !== 'object') {
        return false;
    }

    const {
        conditionalIf,
        messageSnippets_THEN,
        messageSnippets_ELSE,
    } = (ifThenElseBlock || {}) as IMessageTemplate.IfThenElseBlock;

    return !(conditionalIf === void 0
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

function _variablesInfoListDTOToJSON(variablesInfoListDTO: VariableInfoDTO[]): VariableInfoJSON[] {
    return variablesInfoListDTO;
}

function _variablesInfoListJSONToDTO(variablesInfoListJSON: VariableInfoJSON[]): VariableInfoDTO[] {
    return variablesInfoListJSON;
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

function insertSubstringInString(text: string, subText: string, position: number): string {
    const splitTextArray = text.split('');

    splitTextArray.splice(position, 0, subText);

    return splitTextArray.join('');
}

/**
 * Отображаемую переменную конвертировать в ключ от переменной
 *
 * @param variable
 */
function _variableToKey(variable: string) {

}

/**
 * Ключ переменной конвертировать в отображаемую переменную
 *
 * @param key
 */
function _keyToVariable(key: string) {
    const variable = key
        // на всякий случай избавляемся от скобочек, что бы их не задублировать случайно
        .replace('{', '')
        .replace('}', '')
    ;

    return `{${variable}}`
}