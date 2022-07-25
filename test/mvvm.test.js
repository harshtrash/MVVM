const MVVM = require('../js/mvvm');

test('MVVM isPrototypeOf', () => {
    expect(MVVM.isPrototypeOf(undefined)).toBe(false);
});

test('MVVM constructor', () => {
    expect(MVVM.constructor()).toBe("");
});




