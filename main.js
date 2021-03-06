/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

// imports
const readline = require('readline');
const fs = require('fs');

// variables
let workingSystem;
let inputSystem;
let consoleInputType;
let keyInputType;
let consoleOutputType;

let savingToBinaryFile = false;

let message = '';
let messagePath;

let key;

let encryptedValue = '';
let decryptedValue = '';

// utils
const chunkString = (str, len) => str.match(new RegExp(`.{1,${len}}`, 'g'));

const removePadding = str => {
    const chunked = chunkString(str, 64);
    let lastElement = chunked[chunked.length - 1];
    while (lastElement.charAt(lastElement.length - 1) !== '1') {
        lastElement = lastElement.substring(0, lastElement.length - 1);
    }
    lastElement = lastElement.substring(0, lastElement.length - 1);
    chunked[chunked.length - 1] = lastElement;
    return chunked.join('');
};

const createArrayWithPadding = arr => {
    const tempArr = arr;
    if (tempArr[tempArr.length - 1].length === 64) {
        let newItem = '';
        newItem = newItem.padStart(64, '0');
        newItem = `1${newItem.slice(1)}`;
        tempArr.push(newItem);
    } else {
        let addition = '';
        const remains = 64 - tempArr[tempArr.length - 1].length;
        addition = addition.padStart(remains, '0');
        addition = `1${addition.slice(1)}`;
        tempArr[tempArr.length - 1] += addition;
    }
    return tempArr;
};

const binToString = str => {
    let binString = '';
    chunkString(str, 8).map(bin => {
        binString += String.fromCharCode(parseInt(bin, 2));
        return binString;
    });
    return binString;
};

const stringToBinary = (str, spaceSeparatedOctets) => {
    const zeroPad = num => '00000000'.slice(String(num).length) + num;

    return str.replace(/[\s\S]/g, _str => {
        const temp = zeroPad(_str.charCodeAt().toString(2));
        return !1 === spaceSeparatedOctets ? temp : `${temp} `;
    });
};

const deleteSpaces = str => str.replace(/ /g, '');

const hexToBin = hex => `00000000${parseInt(hex, 16).toString(2)}`.substr(-8);

const decToBin = dec => `0000${parseInt(dec, 10).toString(2)}`.substr(-4);

// eslint-disable-next-line no-bitwise
const decToBin8bytes = dec => (dec >>> 0).toString(2);

const binToHex = bin => parseInt(bin, 2).toString(16);

const bin = _key =>
    chunkString(_key, 2)
        .map(hex => hexToBin(hex))
        .join('');

const shiftString = (str, shift) => str.slice(shift, str.length) + str.slice(0, shift);

const transformBinToHex = value =>
    chunkString(value, 4)
        .map(binToHex)
        .join('')
        .toUpperCase();

// question interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// questions

const askAboutSavingToBinaryFile = () =>
    new Promise((resolve, reject) => {
        rl.question('Do you want to create binary file?(yes/no) \n', answer => {
            switch (answer) {
                case 'yes':
                    savingToBinaryFile = true;
                    resolve();
                    break;
                case 'no':
                    savingToBinaryFile = false;
                    resolve();
                    break;
                default:
                    console.log('wrong input.');
                    process.exit(1);
            }
        });
    });

const askAboutConsoleOutputType = () =>
    new Promise((resolve, reject) => {
        rl.question('Enter type of console output(text/bin/hex) \n', answer => {
            switch (answer) {
                case 'text':
                case 'hex':
                case 'bin':
                    consoleOutputType = answer;
                    resolve();
                    break;
                default:
                    console.log('wrong input.');
                    process.exit(1);
            }
        });
    });

const askAboutKeyInputType = () =>
    new Promise((resolve, reject) => {
        rl.question('Enter key type(bin/hex)\n', answer => {
            switch (answer) {
                case 'hex':
                case 'bin':
                    keyInputType = answer;
                    resolve();
                    break;
                default:
                    console.log('wrong input.');
                    process.exit(1);
            }
        });
    });

const askAboutConsoleInputType = () =>
    new Promise((resolve, reject) => {
        rl.question('Enter input type(text/bin/hex)\n', answer => {
            switch (answer) {
                case 'text':
                case 'bin':
                case 'hex':
                    consoleInputType = answer;
                    resolve();
                    break;
                default:
                    console.log('wrong input.');
                    process.exit(1);
            }
        });
    });

const askAboutInputSystem = () =>
    new Promise((resolve, reject) => {
        rl.question(
            'Do you prefer to enter the message and key via the console or using binary files? (type file/console)\n',
            answer => {
                switch (answer) {
                    case 'file':
                        inputSystem = answer;
                        resolve();
                        break;
                    case 'console':
                        inputSystem = answer;
                        resolve();
                        break;
                    default:
                        console.log('wrong input.');
                        process.exit(1);
                        break;
                }
            }
        );
    });

const askAboutWorkingSystem = () =>
    new Promise((resolve, reject) => {
        rl.question('Do you want to encrypt or decrypt? (type encrypt/decrypt)\n', answer => {
            switch (answer) {
                case 'encrypt':
                case 'decrypt':
                    workingSystem = answer;
                    resolve();
                    break;
                default:
                    console.log('wrong input.');
                    process.exit(1);
                    break;
            }
        });
    });

const askAboutMessage = () =>
    new Promise((resolve, reject) => {
        rl.question(`Enter the message\n`, answer => {
            const trimmedAnswer = deleteSpaces(answer);
            if (inputSystem === 'console') {
                switch (consoleInputType) {
                    case 'text':
                        message = stringToBinary(trimmedAnswer, false);
                        break;
                    case 'hex':
                        message = bin(trimmedAnswer);
                        break;
                    default:
                        message = trimmedAnswer;
                        break;
                }
            }
            resolve();
        });
    });

const askAboutMessagePath = () =>
    new Promise((resolve, reject) => {
        rl.question(`Enter the message path\n`, answer => {
            const trimmedAnswer = deleteSpaces(answer);
            messagePath = trimmedAnswer;
            resolve();
        });
    });

const askAboutKey = () =>
    new Promise((resolve, reject) => {
        rl.question(`Enter the key\n`, answer => {
            const trimmedAnswer = deleteSpaces(answer);
            switch (keyInputType) {
                case 'bin':
                    if (trimmedAnswer.length !== 64) {
                        console.log('wrong input.');
                        askAboutKey();
                    }
                    break;
                default:
                    if (trimmedAnswer.length !== 16) {
                        console.log('wrong input.');
                        askAboutKey();
                    }
                    break;
            }
            if (keyInputType === 'hex') {
                key = bin(trimmedAnswer);
            } else {
                key = trimmedAnswer;
            }
            resolve();
        });
    });

/*eslint-disable */
// permutation arrays
const
    // permutacja wejsciowa klucza, klucz 64 bitowy, wyrzucamy co 8  bit ktory jest bitem parzystosci i 
    // taki klucz skladajacy sie z ${64-8} bitow cisniemy przez permutacje PC1, potem dzielimy na 2x28
    // i te poloweczki przesuwamy w lewo o jeden lub dwa bity zaleznie od numeru cyklu
    PC1 = [
        57, 49, 41, 33, 25, 17, 9,
        1, 58, 50, 42, 34, 26, 18,
        10, 2, 59, 51, 43, 35, 27,
        19, 11, 3, 60, 52, 44, 36,
        63, 55, 47, 39, 31, 23, 15,
        7, 62, 54, 46, 38, 30, 22,
        14, 6, 61, 53, 45, 37, 29,
        21, 13, 5, 28, 20, 12, 4
    ],

    // jak te 2x28 klucze przesuwamy, to je laczymy i permutacja z kompresja przez te cos na dole, dzieki czemu
    // mamy nowy klucz i-cyklu (1 z 16) ktory ma notabene 48 bitow a nie 56 bo to permutacja z kompresja
    PC2 = [
        14, 17, 11, 24, 1, 5,
        3, 28, 15, 6, 21, 10,
        23, 19, 12, 4, 26, 8,
        16, 7, 27, 20, 13, 2,
        41, 52, 31, 37, 47, 55,
        30, 40, 51, 45, 33, 48,
        44, 49, 39, 56, 34, 53,
        46, 42, 50, 36, 29, 32
    ],


    // Tekst jawny na początku poddawany jest permutacji wstępnej IP, potem dzielimy na 2x 32 bity, potem
    // cyk cyk jakieś 16 razy funkcyjki, potem to łączymy z powrotem i cisniemy na tym permutacje koncowa
    // ip-1
    IP = [ 
        58, 50, 42, 34, 26, 18, 10, 2,
        60, 52, 44, 36, 28, 20, 12, 4,
        62, 54, 46, 38, 30, 22, 14, 6,
        64, 56, 48, 40, 32, 24, 16, 8,
        57, 49, 41, 33, 25, 17, 9, 1,
        59, 51, 43, 35, 27, 19, 11, 3,
        61, 53, 45, 37, 29, 21, 13, 5,
        63, 55, 47, 39, 31, 23, 15, 7
    ],
    // to juz jestesmy w funkcji f, prawa polowa jest poddawana permutacji z rozszerzeniem 32 na 48 przez to cos
    // below xD i jak mamy ten elegancki 48 bit to chyba po kolei łączymy modulo 2 z kluczem przesuniety i sperm
    // utowanym ta suma modulo 2 to chyba xor jak sie nie myle
    E = [
        32, 1, 2, 3, 4, 5,
        4, 5, 6, 7, 8, 9,
        8, 9, 10, 11, 12, 13,
        12, 13, 14, 15, 16, 17,
        16, 17, 18, 19, 20, 21,
        20, 21, 22, 23, 24, 25,
        24, 25, 26, 27, 28, 29,
        28, 29, 30, 31, 32, 1
    ],
    // po tych xorach dzielimy na 8 czesci i wprowadzamy do tych skrzynek s-blokow, i z 6-bitowych podciagow 
    // otrzymujemy 4 bitowe podciagi i je laczymy ze soba, i te 32bity cisniemy przez permutacje P i mamy 
    // zaszyfrowane 32 bity. Jesli chodzi o te szuflady to b1b6 wiersz a b2b3b4b5 kolumna
    S = [
        [
            14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7,
            0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8,
            4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0,
            15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13
        ],
        [
            15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10,
            3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5,
            0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15,
            13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9
        ],
        [
            10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8,
            13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1,
            13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7,
            1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12
        ],
        [
            7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15,
            13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9,
            10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4,
            3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14
        ],
        [
            2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9,
            14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6,
            4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14,
            11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3
        ],
        [
            12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11,
            10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8,
            9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6,
            4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13
        ],
        [
            4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1,
            13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6,
            1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2,
            6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12
        ],
        [
            13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7,
            1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2,
            7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8,
            2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11
        ]
    ],
    // jak te podciagi 8x4 polaczymy to przez P cisniemy i funkcja f skonczona XD
    P = [
        16, 7, 20, 21,
        29, 12, 28, 17,
        1, 15, 23, 26,
        5, 18, 31, 10,
        2, 8, 24, 14,
        32, 27, 3, 9,
        19, 13, 30, 6,
        22, 11, 4, 25
    ],

    // Permutacja końcowa IP-1, uzywamy na kluczu po zlaczeniu i po 16 jakichs tma operacjach
    FINAL_IP = [ 
        40, 8, 48, 16, 56, 24, 64, 32,
        39, 7, 47, 15, 55, 23, 63, 31,
        38, 6, 46, 14, 54, 22, 62, 30,
        37, 5, 45, 13, 53, 21, 61, 29,
        36, 4, 44, 12, 52, 20, 60, 28,
        35, 3, 43, 11, 51, 19, 59, 27,
        34, 2, 42, 10, 50, 18, 58, 26,
        33, 1, 41, 9, 49, 17, 57, 25
    ],


    // klucz po permutacji i podzieleniu na 2x28 przesuwany w lewo o 1 lub 2 bity, zaleznie od cyklu i tutaj te
    // cykle
    NUM_OF_LEFT_SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
/* eslint-enable */

const keySchedule = _key => {
    // generujemy klucze!
    const subkeys = []; // pusta tablica xD
    const perm = PC1.map(index => _key[index - 1]).join(''); // permutacja wejsciowa, cisniemy 7 bajtow przez PC1
    let C0 = perm.substr(0, perm.length / 2); // dzielimy na 2x28
    let D0 = perm.substr(perm.length / 2); // dzielimy na 2x28
    let prevC0 = C0;
    let prevD0 = D0; // deklarujemy prevy
    NUM_OF_LEFT_SHIFTS.forEach(shift => {
        C0 = shiftString(prevC0, shift); // przesuwamy polowke na podstawie wartosci w NUM_OF_LEFT_SHIFTS w lewo
        D0 = shiftString(prevD0, shift); // przesuwamy polowke na podstawie wartosci w NUM_OF_LEFT_SHIFTS w lewo
        prevC0 = C0; // przypisujemy do prevow
        prevD0 = D0; // przypisujemy do prevow
        const pair = C0 + D0; // laczymy w pare
        subkeys.push(PC2.map(index => pair[index - 1]).join('')); // no i taka pare przez PC2 permutacja z kompresja
        // i mamy klucz ^^
    });

    return subkeys;
};

// permutacja z rozszerzeniem 32->48
const expandBlock = block => E.map(index => block[index - 1]).join('');

// xorujemy bity w stringach, trzeba podac dlugosc stringow
const stringXOR = (str1, str2, len) => {
    const xor = Array(len);
    for (let i = 0; i < len; i += 1) {
        xor[i] = str1[i] === str2[i] ? 0 : 1;
    }
    return xor.join('');
};

// funkcja ktora daje outputy z S-boxa, b1b6 wiersz a b2b3b4b5 kolumna
const sBoxOutput = bits => {
    return chunkString(bits, 6)
        .map((group, sBox) => {
            const row = parseInt(group[0] + group[5], 2);
            const col = parseInt(group.slice(1, 5), 2);
            return decToBin(S[sBox][16 * row + col]);
        })
        .join('');
};

const des = (msg, _key, subkeys) => {
    // funkcja, wiadomosc, klucz i wygeneraowane subklucze
    const perm = IP.map(index => msg[index - 1]).join(''); // jedziemy 1. permutacja msg przez ip1
    let L0 = perm.substr(0, perm.length / 2); // dzielimy na lewice
    let R0 = perm.substr(perm.length / 2); // i prawice

    let prevL0 = L0;
    let prevR0 = R0; // deklarujemy prevy, ktore na inicie rowne sa aktualynm
    for (let i = 0; i < 16; i += 1) {
        // jedziemy 16 razy
        // l0 rowne prevr0
        L0 = prevR0;
        // tutaj jest bardziej zlozona operacja. Zaczyna się od tego, że R0 permutujemy przez E, przez co mamy
        // rozszerzenie z 32 do 48 bitów, następnie xorujemy rozszerzony blok z kluczem wygenerowanym wczesniej dla
        // tej iteracji, następnie z 6 bitowych podciągów otrzymujemy za pomocą tablicy S 4-bitowe podciągi,
        // ktore laczymy ze soba
        const sBoxOut = sBoxOutput(stringXOR(subkeys[i], expandBlock(R0), 48));
        // 32 bity cisniemy przez permutacje P
        const finalPerm = P.map(index => sBoxOut[index - 1]).join('');
        // R0 otrzymujemy przez xorowanie finalPerm z prevL0
        R0 = stringXOR(prevL0, finalPerm, 32);
        // prevy rownaja sie terazniejszym
        prevL0 = L0;
        prevR0 = R0;
    }
    // po 16 iteracjach laczymy prawice i lewicy i cisniemy permutacje przez FINAL_IP otrzymujac zaszyfrowana wartosc
    const pair = R0 + L0;
    const enc = FINAL_IP.map(index => pair[index - 1]).join('');
    // i zwracamy zaszyfrowana binarke
    return enc;
};

const encode = (msg, _key) => des(msg, _key, keySchedule(_key));
const decode = (msg, _key) => des(msg, _key, keySchedule(_key).reverse());

const getMessageFromFile = async () =>
    new Promise(resolve => {
        const binary = fs.readFileSync(messagePath, null);
        const uint8array = new Uint8Array(binary);
        uint8array.forEach(item => {
            message += decToBin8bytes(item).padStart(8, '0');
        });
        resolve();
    });

const saveDataToFile = async (data, path) =>
    new Promise(resolve => {
        const resultAsBytes = chunkString(data, 8).map(v => parseInt(v, 2));
        fs.writeFileSync(path, Buffer.from(resultAsBytes));
        resolve();
    });

const handleOutput = value => {
    switch (consoleOutputType) {
        case 'text':
            // eslint-disable-next-line no-console
            console.log('Value:\n', binToString(value));
            break;
        case 'hex':
            // eslint-disable-next-line no-console
            console.log('Value:\n', transformBinToHex(value));
            break;
        default:
            // eslint-disable-next-line no-console
            console.log('Value:\n', value);
            break;
    }
};

const handleDes = async () => {
    const chunkedMessage = chunkString(message, 64);

    if (workingSystem === 'encrypt') {
        const paddingArray = createArrayWithPadding(chunkedMessage);
        paddingArray.forEach(item => {
            const encryptedItem = encode(item, key);
            encryptedValue += encryptedItem;
        });
        if (savingToBinaryFile) {
            await saveDataToFile(encryptedValue, './encrypted.bin');
        }
        handleOutput(encryptedValue);
    } else {
        chunkedMessage.forEach(item => {
            const decryptedItem = decode(item, key);
            decryptedValue += decryptedItem;
        });
        decryptedValue = removePadding(decryptedValue);
        if (savingToBinaryFile) {
            await saveDataToFile(decryptedValue, './decrypted.bin');
        }
        handleOutput(decryptedValue);
    }
};

const main = async () => {
    await askAboutWorkingSystem();
    await askAboutInputSystem();
    if (inputSystem === 'console') {
        await askAboutConsoleInputType();
        await askAboutMessage();
    } else {
        await askAboutMessagePath();
    }
    await askAboutSavingToBinaryFile();
    await askAboutKeyInputType();
    await askAboutKey();
    await askAboutConsoleOutputType();
    rl.close();

    if (inputSystem === 'file') {
        await getMessageFromFile();
    }

    await handleDes();
};

main();
