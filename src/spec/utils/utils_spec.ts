'use strict';

import { generatorMessage } from "../../utils/utils";

describe('generatorMessage', () => {
    it('Default case', () => {
        const message = generatorMessage(
            `Hello {firstname} {lastname}!`,
            {
                firstname: 'Victor',
                lastname: 'Kram',
            },
        );

        expect(message).toBe(`Hello Victor Kram!`);
    });

    it('Default case with \n', () => {
        const message = generatorMessage(
            `Hello {firstname}\n{lastname}!`,
            {
                firstname: 'Victor',
                lastname: 'Kram',
            },
        );

        expect(message).toBe(`Hello Victor\nKram!`);
    });

    it('empty message', () => {
        const message = generatorMessage(
            '',
            {
                firstname: 'Victor',
                lastname: 'Kram',
            },
        );

        expect(message).toBe('');
    });

    it('Only variables in template', () => {
        const message = generatorMessage(
            `{firstname}{lastname}`,
            {
                firstname: 'Victor',
                lastname: 'Kram',
            },
        );

        expect(message).toBe(`VictorKram`);
    });

    it('Empty map of variables', () => {
        const message = generatorMessage(
            'Hello {firstname} {lastname}!',
            {},
        );

        expect(message).toBe('Hello {firstname} {lastname}!');
    });

    it('Empty map of variables and not use variables', () => {
        const message = generatorMessage(
            'Hello world!',
            {},
        );

        expect(message).toBe('Hello world!');
    });

    it('Map of variables with empty variables values', () => {
        const message = generatorMessage(
            "Привет {firstname}{lastname}{company}{position}{company}{position} С уважением, Араик...",
            {
                firstname: "",
                lastname: "",
                company: "",
                position: "",
            },
        );

        expect(message).toBe("Привет {firstname}{lastname}{company}{position}{company}{position} С уважением, Араик...");
    });

    it('Empty map of variables with empty keys', () => {
        const message = generatorMessage(
            "Привет {firstname}{lastname}{company}{position}{company}{position} С уважением, Араик...",
            {
                "": "firstname",
                "": "lastname",
                "": "company",
                "": "position",
            },
        );

        expect(message).toBe("Привет {firstname}{lastname}{company}{position}{company}{position} С уважением, Араик...");
    });

    it('Two variables filled and two variables not filled', () => {
        const message = generatorMessage(
            "Привет {firstname}{lastname}{firstname}",
            {
                "firstname": "Araik",
                "lastname": "ого",
                "company": "",
                "position": ""
            },
        );

        expect(message).toBe("Привет AraikогоAraik");
    });

    it('Extra variables in map of values', () => {
        const message = generatorMessage(
            `Hello {firstname} {lastname} and 123`,
            {
                firstname: 'Victor',
                lastname: 'Kram',
                ignoredVariable: 'hello',
            },
        );

        expect(message).toBe(`Hello Victor Kram and 123`);
    });

    it('Empty template', () => {
        const message = generatorMessage(
            '',
            {
                firstname: 'firstname hello',
                lastname: 'lastname hello',
            },
        );

        expect(message).toBe('');
    });

    it('Template with only brackets', () => {
        const message = generatorMessage(
            '{}{}',
            {
                firstname: 'firstname hello',
                lastname: 'lastname hello',
            },
        );

        expect(message).toBe('{}{}');
    });

    it('Template with empty brackets', () => {
        const message = generatorMessage(
            'hello {},{}world',
            {
                firstname: 'firstname hello',
                lastname: 'lastname hello',
            },
        );

        expect(message).toBe('hello {},{}world');
    });

    it('Empty template and empty map of values', () => {
        const message = generatorMessage(
            '',
            {},
        );

        expect(message).toBe('');
    });

    it('Template with text and brackets with space', () => {
        const message = generatorMessage(
            '{ }Hello world!{ }',
            {},
        );

        expect(message).toBe('{ }Hello world!{ }');
    });

    it('Other variables', () => {
        const message = generatorMessage(
            "{otherVariable}.Hello world! {I'm is ignored variable}",
            {},
        );

        expect(message).toBe("{otherVariable}.Hello world! {I'm is ignored variable}");
    });

    /*
     * Этот describe содержит тесты с крайними значениями и проверками ситуаций,
     * в которых мы вводим ключ одной переменной вместо значения другой переменной.
     */
    describe('cases', () => {
        it('Insert key of variable in value of other variable', () => {
            const message = generatorMessage(
                `Hello {firstname}{lastname}!`,
                {
                    firstname: '{lastname}',
                    lastname: 'Ольга',
                },
            );

            expect(message).toBe(`Hello {lastname}Ольга!`);
        });

        it('Insert key of variable in value of other variable 2', () => {
            const message = generatorMessage(
                `Hello {firstname} {lastname}!`,
                {
                    firstname: '{lastname}',
                    lastname: 'Ольга',
                },
            );

            expect(message).toBe(`Hello {lastname} Ольга!`);
        });

        it('Insert key of variable in value of other variable 3', () => {
            const message = generatorMessage(
                `Hello {firstname} 12 3 {lastname}!`,
                {
                    firstname: '{lastname}',
                    lastname: 'Ольга',
                },
            );

            expect(message).toBe(`Hello {lastname} 12 3 Ольга!`);
        });

        it('Insert key of variable in value of other variable 4', () => {
            const message = generatorMessage(
                `Hello {firstname} {lastname}`,
                {
                    firstname: 'Ольга',
                    lastname: '{lastname}',
                },
            );

            expect(message).toBe(`Hello Ольга {lastname}`);
        });

        it('Insert key of variable in value of other variable 5', () => {
            const message = generatorMessage(
                `{firstname}{lastname}))`,
                {
                    firstname: '{lastname}',
                    lastname: '{firstname}',
                },
            );

            expect(message).toBe(`{lastname}{firstname}))`);
        });

        it('Insert key of variable in value of other variable 6', () => {
            const message = generatorMessage(
                `{firstname}{lastname}`,
                {
                    firstname: '{lastname}',
                    lastname: '{firstname}',
                },
            );

            expect(message).toBe(`{lastname}{firstname}`);
        });

        it('Insert key of variable in value of other variable 7', () => {
            const message = generatorMessage(
                `.{firstname}{lastname}`,
                {
                    firstname: '{lastname}',
                    lastname: '{firstname}',
                },
            );

            expect(message).toBe(`.{lastname}{firstname}`);
        });

        it('Insert key of variable in value of other variable 8', () => {
            const message = generatorMessage(
                `{firstname}lastname}`,
                {
                    firstname: '{lastname}',
                    lastname: '{firstname}',
                },
            );

            expect(message).toBe(`{lastname}lastname}`);
        });

        it('Insert key of variable in value of other variable 9', () => {
            const message = generatorMessage(
                `{firstname}{lastname`,
                {
                    firstname: '{lastname}',
                    lastname: '{firstname}',
                },
            );

            expect(message).toBe(`{lastname}{lastname`);
        });

        it('Insert key of variable in value of other variable 10', () => {
            const message = generatorMessage(
                `{k}{l}`,
                {
                    k: '{l}',
                    l: '{k}',
                },
            );

            expect(message).toBe(`{l}{k}`);
        });

        it('Variable in variable', () => {
            const message = generatorMessage(
                `{first{lastname}name}`,
                {
                    lastname: 'Rasayan',
                },
            );

            expect(message).toBe(`{firstRasayanname}`);
        });

        it('Variable in variable 2', () => {
            const message = generatorMessage(
                `Привет, как дела? есть такие {интересные скобки, {firstname}, которые} тебе всё сломают)`,
                {
                    firstname: 'Araik',
                },
            );

            expect(message).toBe(`Привет, как дела? есть такие {интересные скобки, Araik, которые} тебе всё сломают)`);
        });

        it('Variable in variable with space', () => {
            const message = generatorMessage(
                `Привет, как дела? есть такие {интересные скобки, {firstname }, которые} тебе всё сломают)`,
                {
                    firstname: 'Araik',
                },
            );

            expect(message).toBe(`Привет, как дела? есть такие {интересные скобки, {firstname }, которые} тебе всё сломают)`);
        });
    });
});
