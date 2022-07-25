const watcher= require('../js/watcher');
import MVVM from'../js/mvvm'
let vm = MVVM.constructor({
    el: '#mvvm-app',
    data: {
        someStr: 'hello ',
        className: 'btn',
        //htmlStr: '<span style="color: #f00;">red</span>',
        child: {
            someStr: 'World !'
        }
    },
});
let el = '#mvvm-app';
let object = {
    "0": "[",
    "1": "o",
    "2": "b",
    "3": "j",
    "4": "e",
    "5": "c",
    "6": "t",
    "7": " ",
    "8": "O",
    "9": "b",
    "10": "j",
    "11": "e",
    "12": "c",
    "13": "t",
    "14": "]"
};

test('watcher generator', () => {
    expect(watcher.constructor(vm,'function','look')).toMatchObject(object);
});
