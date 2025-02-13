import { chunk, get } from 'lodash';
import { IFixture, IParser } from '../interface';

export class ParameterParser implements IParser {
    /**
     * @type {number}
     */
    public priority = 60;

    private static get regExp(): RegExp {
        return /<\{(.+?)\}>/gm;
    }

    isSupport(value: string): boolean {
        return ParameterParser.regExp.test(value);
    }

    parse(value: string, fixture: IFixture): any {
        const chunks: string[][] = chunk(value.split(ParameterParser.regExp), 2);
        const result = [];

        for (const [str, parameter] of chunks) {
            result.push(str);

            if (parameter) {
                let parameterValue = undefined;
                if (/\.\*/.test(parameter)) {
                    const splittedPaths = parameter.split('.');
                    let obj = {...fixture.parameters};
                    for (let i = 0; i < splittedPaths.length; i++) {
                        const path = splittedPaths[i];
                        if (path === '*') {
                            const values = Object.values(obj);
                            const randomIndex = Math.floor(Math.random() * values.length);
                            obj = values[Math.floor(randomIndex)];
                        } else {
                            if (!obj[path]) {
                                break;
                            }
                            obj = obj[path];
                        }
                        if (i == splittedPaths.length - 1) {
                            parameterValue = obj;
                        }
                    }

                } else {
                    parameterValue = get(fixture.parameters, parameter);
                }

                if (parameterValue === undefined) {
                    if (parameter.startsWith('process.env')) {
                        const key = parameter.replace('process.env.', '');
                        if (key in process.env) {
                            result.push(process.env[key]);
                        } else {
                            throw new Error(`Unkown environment variable "${parameter}" in ${fixture.name}`);
                        }
                    } else {
                        throw new Error(`Unknown parameter "${parameter}" in ${fixture.name}`);
                    }
                }

                result.push(parameterValue);
            }
        }

        return result.join('');
    }
}
