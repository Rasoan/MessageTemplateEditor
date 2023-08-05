'use strict';

/**
 * Генератор сообщений, заменяет в тексте названия переменных значениями переменных,
 * в случае, если таковы были переданы в map-у "values", если же в "values" переменная не найдена,
 * то она будет интерпретироваться как пустая строка.
 *
 * @param template - шаблон сообщения
 * @param values - значения переменных (объект вида {name : value}).
 * В объекте могут присутствовать, как лишние пары name & value - будут игнорироваться,
 * так и отсутствовать необходимые - будут интерпретироваться, как пустые значения.
 */
export function generatorMessage(template: string, values: Record<string, string>): string {
    let messageResult = template;

    for (const [key, value] of Object.entries(values)) {
        messageResult = messageResult
            .replaceAll(`{${key}}`, value)
        ;
    }

    return messageResult;
}
