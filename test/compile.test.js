import {Compile} from'../js/compile'
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
let compiler = new Compile('#mvvm-app',vm);


test('compile isDirective1', () => {
    expect(compiler.isDirective('v-')).toBe(true);
});
test('compile isDirective2', () => {
    expect(compiler.isDirective('v')).toBe(false);
});

test('compile isEventDirective1', () => {
    expect(compiler.isEventDirective('f')).toBe(false);
});

test('compile isEventDirective2', () => {
    expect(compiler.isEventDirective('on')).toBe(true);
});

test('compile isElementNode2', () => {
    expect(compiler.isElementNode(vm)).toBe(false);
});

test('compile isTextNode1', () => {
    expect(compiler.isTextNode(vm)).toBe(false);
});

test('compile isTextNode2', () => {
    expect(compiler.isTextNode(el)).toBe(false);
});





