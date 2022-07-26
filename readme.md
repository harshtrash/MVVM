## 理解并实现MVVM框架

[TOC]
                                                南京大学 秦予唯
                                                    2022年7月

### 项目主要结构

![mvvm][mvvm]



**以上为核心代码部分，依赖与配置等文件未列出**

### 实现效果

#### 实现代码整体（基于vue)

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>vue-demo</title>
</head>
<body>
	<div id="vue-app">
		<input type="text" v-model="word">
		<p>{{word}}</p>
		<button v-on:click="sayHi">change model</button>
	</div>

	<script src="http://cdn.bootcss.com/vue/1.0.25/vue.js"></script>
	<script>
		var vm = new Vue({
			el: '#vue-app',
			data: {
				word: 'Hello World!'
			},

			methods: {
				sayHi: function() {
					this.word = 'Hi, everybody!';
				}
			}
		});
	</script>
</body>
</html>
```

具体实现结果详见文件内：

**./vue-demo/index.html**



#### 实现代码整体（MVVM)

```javascript
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MVVM</title>
</head>
<body>

<div id="mvvm-app">
    <input type="text" v-model="someStr">
    <input type="text" v-model="child.someStr">
    <p>{{ getHelloWord }}</p>
    <p v-html="htmlStr"></p>
    <button v-on:click="clickBtn">change model</button>
</div>

<script src="http://cdn.bootcss.com/vue/1.0.25/vue.js"></script>
<script src="./js/observer.js"></script>
<script src="./js/watcher.js"></script>
<script src="./js/compile.js"></script>
<script src="./js/mvvm.js"></script>
<script>
    var vm = new MVVM({
        el: '#mvvm-app',
        data: {
            someStr: 'hello ',
            className: 'btn',
            htmlStr: '<span style="color: #f00;">red</span>',
            child: {
                someStr: 'World !'
            }
        },

        computed: {
            getHelloWord: function() {
                return this.someStr + this.child.someStr;
            }
        },

        methods: {
            clickBtn: function(e) {
                var randomStrArr = ['Tom', 'Mike', 'Angela','Eden'];
                this.child.someStr = randomStrArr[parseInt(Math.random() * 4)];
                window.alert("变更成功！")
            }
        }
    });

    vm.$watch('child.someStr', function() {
        console.log(arguments);
    });
</script>

</body>
</html>
```

具体实现结果详见文件内：

**./mvvm.html**

**两个页面对比来看，成功的实现了用mvvm低层实现了vue的基础双向绑定、发布订阅模式、数据劫持等思想与功能**。




### 几种实现数据绑定的做法与思考
目前几种主流的mvc(vm)框架都实现了单向数据绑定，而我所理解的双向数据绑定是在单向绑定的基础上给可输入元素（input、textarea等）添加了change(input)事件，来动态修改model和 view。所以无需太过介怀是实现的单向或双向绑定。

实现数据绑定的做法有大致如下几种：

> 发布者-订阅者模式（backbone.js）

> 数据劫持（vue.js）

> 单向绑定

#### 发布者-订阅者模式: 

一般通过sub, pub的方式实现数据和视图的绑定监听，更新数据方式通常做法是 `vm.set('property', value)`

**在Watcher、Observer中体现**

#### 数据劫持：

vue.js 则是采用数据劫持结合发布者-订阅者模式的方式，通过`Object.defineProperty()`来劫持各个属性的`setter`，`getter`，在数据变动时发布消息给订阅者，触发相应的监听回调。

#### 单向绑定：

单向数据绑定的实现思路： ①所有数据只有一份 ②一旦数据变化，就去更新页面(只有data-->DOM，没有DOM-->data) ③ 若用户在页面上做了更新，就手动收集(双向绑定是自动收集)，合并到原有的数据中。

```html
<body>
<h2>单向绑定</h2>
<div id="app">
    姓名：{{names}}
    <br> 年龄：{{age}}
</div>
<script>
    let el1 = document.getElementById('app');
    let template = el1.innerHTML;
    let _data = {
        names: '_BuzzLy',
        age: 25
    };

    let data = new Proxy(_data, {
        set(obj, names, value) {
            obj[names] = value;
            render();
        }
    });

    render();

    function render() {
        el1.innerHTML = template.replace(/\{\{\w+\}\}/g, str => {
            str = str.substring(2, str.length - 2);
            return _data[str];
        });
    }

</script>
    </body>
```

**在mvvm-demo.html文件中实现了单向绑定的功能**，可以修改_data中的数据对页面重新渲染以使得页面改变。


### 思路整理
已经了解到vue是通过数据劫持的方式来做数据绑定的。
在学习过后整理了一下，要实现MVVM的双向绑定和单向绑定，就必须要实现以下几点：
1、实现一个数据监听器Observer，能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者
2、实现一个指令解析器Compile，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定相应的更新函数
3、实现一个Watcher，作为连接Observer和Compile的桥梁，能够订阅并收到每个属性变动的通知，执行指令绑定的相应回调函数，从而更新视图
4、MVVM入口函数，整合以上三者

上述流程如图所示：
![img2][img2]

### 1、实现Observer
可以利用`Obeject.defineProperty()`来监听属性变动
那么将需要observe的数据对象进行递归遍历，包括子属性对象的属性，都加上	`setter`和`getter`
这样的话，给这个对象的某个值赋值，就会触发`setter`，那么就能监听到了数据变化。

相关代码可以是这样：

```javascript
let data = {name: 'kindeng'};
observe(data);
data.name = 'qyw'; // 监听到值变化了 kindeng --> qyw

function observe(data) {
    if (!data || typeof data !== 'object') {
        return;
    }
    // 取出所有属性遍历
    Object.keys(data).forEach(function(key) {
	    defineReactive(data, key, data[key]);
	});
};

function defineReactive(data, key, val) {
    observe(val); // 监听子属性
    Object.defineProperty(data, key, {
        enumerable: true, // 可枚举
        configurable: false, // 不能再define
        get: function() {
            return val;
        },
        set: function(newVal) {
            console.log('监听到值变化了 ', val, ' --> ', newVal);
            val = newVal;
        }
    });
}

```
这样已经可以监听每个数据的变化了，那么**监听到变化之后就是怎么通知订阅者了，所以接下来需要实现一个消息订阅器，很简单，维护一个数组，用来收集订阅者，数据变动触发notify，再调用订阅者的update方法**，代码是这样：
```javascript

function defineReactive(data, key, val) {
	let dep = new Dep();
    observe(val); // 监听子属性

    Object.defineProperty(data, key, {
        // ... 省略
        set: function(newVal) {
        	if (val === newVal) return;
            console.log('监听到值变化了 ', val, ' --> ', newVal);
            val = newVal;
            dep.notify(); // 通知所有订阅者
        }
    });
}

function Dep() {
    this.subs = [];
}
Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },
    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};
```

**思路整理中已经明确订阅者应该是Watcher**, 而且`var dep = new Dep();`是在 `defineReactive`方法内部定义的，所以想通过`dep`添加订阅者，就必须要在闭包内操作，所以可以在	`getter`里面动手脚：

```javascript
// Observer.js
// ...省略
Object.defineProperty(data, key, {
	get: function() {
		// 由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性，暂存watcher, 添加完移除
		Dep.target && dep.addDep(Dep.target);
		return val;
	}
    // ... 省略
});

// Watcher.js
Watcher.prototype = {
	get: function(key) {
		Dep.target = this;
		this.value = data[key];	// 这里会触发属性的getter，从而添加订阅者
		Dep.target = null;
	}
}
```
这里Observer已经具备了监听数据和数据变化通知订阅者的功能。那么接下来就是实现Compiler了。

### 2、实现Compiler
compiler主要做的事情是解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图，如图所示：
![img1][img1]  

因为遍历解析的过程有多次操作dom节点，为提高性能和效率，会先将vue实例根节点的`el`转换成文档碎片`fragment`进行解析编译操作，解析完成，再将`fragment`添加回原来的真实dom节点中
```javascript
function Compile(el) {
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if (this.$el) {
        this.$fragment = this.node2Fragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}
Compiler.prototype = {
	init: function() { this.compileElement(this.$fragment); },
    node2Fragment: function(el) {
        let fragment = document.createDocumentFragment(), child;
        // 将原生节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    }
};
```

compileElement方法将遍历所有节点及其子节点，进行扫描解析编译，调用对应的指令渲染函数进行数据渲染，并调用对应的指令更新函数进行绑定，详看代码及注释说明：

```javascript
Compiler.prototype = {
	// ... 省略
	compileElement: function(el) {
        let childNodes = el.childNodes, me = this;
        [].slice.call(childNodes).forEach(function(node) {
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/;	
            // 按元素节点方式编译
            if (me.isElementNode(node)) {
                me.compile(node);
            } else if (me.isTextNode(node) && reg.test(text)) {
                me.compileText(node, RegExp.$1);
            }
            // 遍历编译子节点
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    compiler: function(node) {
        let nodeAttrs = node.attributes, me = this;
        [].slice.call(nodeAttrs).forEach(function(attr) {
           
            let attrName = attr.name;	// v-text
            if (me.isDirective(attrName)) {
                let exp = attr.value; // content
                let dir = attrName.substring(2);	// text
                if (me.isEventDirective(dir)) {
                	// 事件指令, 如 v-on:click
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else {
                	// 普通指令
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }
            }
        });
    }
};

// 指令处理集合
let compileUtil = {
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },
    // ...省略
    bind: function(node, vm, exp, dir) {
        let updaterFn = updater[dir + 'Updater'];
        // 第一次初始化视图
        updaterFn && updaterFn(node, vm[exp]);
        new Watcher(vm, exp, function(value, oldValue) {
        	// 一旦属性值有变化，会收到通知执行此更新函数，更新视图
            updaterFn && updaterFn(node, value, oldValue);
        });
    }
};

// 更新函数
let updater = {
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    }
    // ...省略
};
```
这里通过递归遍历保证了每个节点及子节点都会解析编译到，包括了{{}}表达式声明的文本节点。
监听数据、绑定更新函数的处理是在`compileUtil.bind()`这个方法中，通过`new Watcher()`添加回调来接收数据变化的通知

至此，一个简单的Compiler就完成了。接下来要看看Watcher这个订阅者的具体实现了

### 3、实现Watcher
Watcher订阅者作为Observer和Compiler之间通信的桥梁，主要做的事情是:
1、在自身实例化时往属性订阅器(dep)里面添加自己
2、自身必须有一个update()方法
3、待属性变动dep.notice()通知时，能调用自身的update()方法，并触发Compile中绑定的回调。

```javascript
function Watcher(vm, exp, cb) {
    this.cb = cb;
    this.vm = vm;
    this.exp = exp;
    // 此处为了触发属性的getter，从而在dep添加自己，结合Observer更易理解
    this.value = this.get(); 
}
Watcher.prototype = {
    update: function() {
        this.run();	// 属性值变化收到通知
    },
    run: function() {
        var value = this.get(); // 取到最新值
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal); // 执行Compiler中绑定的回调，更新视图
        }
    },
    get: function() {
        Dep.target = this;	// 将当前订阅者指向自己
        var value = this.vm[exp];	// 触发getter，添加自己到属性订阅器中
        Dep.target = null;	// 添加完毕，重置
        return value;
    }
};
```
实例化`Watcher`的时候，调用`get()`方法，通过`Dep.target = watcherInstance`标记订阅者是当前watcher实例，强行触发属性定义的`getter`方法，`getter`方法执行的时候，就会在属性的订阅器`dep`添加当前watcher实例，从而在属性值有变化的时候，watcherInstance就能收到更新通知。

### 4、实现MVVM
MVVM作为数据绑定的入口，整合Observer、Compiler和Watcher三者，通过Observer来监听自己的model数据变化，通过Compiler来解析编译模板指令，最终利用Watcher搭起Observer和Compile之间的通信桥梁，达到数据变化 -> 视图更新；视图交互变化(input) -> 数据model变更的双向绑定效果。

这里需要给MVVM实例添加一个属性代理的方法，使访问vm的属性代理为访问vm._data的属性，代码如下：

```javascript
function MVVM(options) {
    this.$options = options;
    var data = this._data = this.$options.data, me = this;
    // 属性代理，实现 vm.xxx -> vm._data.xxx
    Object.keys(data).forEach(function(key) {
        me._proxy(key);
    });
    observe(data, this);
    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
	_proxy: function(key) {
		var me = this;
        Object.defineProperty(me, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter() {
                return me._data[key];
            },
            set: function proxySetter(newVal) {
                me._data[key] = newVal;
            }
        });
	}
};

```
这里主要还是利用了`Object.defineProperty()`这个方法来劫持了vm实例对象的属性的读写权，使读写vm实例的属性转成读写了`vm._data`的属性值。

### 测试

对于每一个js模块进行了基于jest的单元测试，以进行覆盖。

**在进行test测试运行时需要将'./js/compile.js'中第一行的export引入，在运行网页时需要将export注释。**

运行结果：

![test][test]

### 总结
此次项目主要围绕“几种实现双向绑定的做法”、“实现Observer”、“实现Compile”、“实现Watcher”、“实现MVVM”这几个模块来展现了双向绑定、发布订阅模式、单向绑定、数据劫持的原理和实现，并设计了单元测试，使得单侧覆盖率超过80%。根据思路流程渐进梳理实现了一些细节思路和比较关键的内容点。文中肯定会有一些不够严谨的思考和错误，欢迎指正。

最后感谢百度暑期训练营的老师和助教，在此期间给予的学习机会以及建议，能够帮助我从前端刚刚懂得语法一步一步慢慢的理解框架代码，并最后能够实现一个自己满意的初级项目，再次感谢！



​																																																		南京大学 秦予唯 

​																																																				2022年7月

[img2]: ./img/2.png
[img1]: ./img/1.png
[test]: ./img/test.png
[mvvm]: ./img/mvvm.png

