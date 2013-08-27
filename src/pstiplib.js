/**
 * @file  提示层控件，
 *        把control和tip两个文件合并为一个，
 *        供大搜环境使用  by wanglei23
 * @author  chris(wfsr@foxmail.com)
 */
define(function (require) {

    var baidu = T;
    var EVENT = T.event;

    var DOM = T.dom;
    var PAGE = T.page;

    /**
     * 获取目标元素指定元素className最近的祖先元素
     * @name baidu.dom.getAncestorByClass
     * @function
     * @grammar baidu.dom.getAncestorByClass(element, className)
     * @param {(HTMLElement | string)} element 目标元素或目标元素的id
     * @param {string} className 祖先元素的class，只支持单个class
     * @remark 使用者应保证提供的className合法性，不应包含不合法字符，
     * className合法字符参考：http://www.w3.org/TR/CSS2/syndata.html。
     * @see baidu.dom.getAncestorBy,baidu.dom.getAncestorByTag
     *
     * @returns {(HTMLElement | null)} 指定元素className最近的祖先元素，
     * 查找不到时返回null
     */
    DOM.getAncestorByClass = DOM.getAncestorByClass
        || function (element, className) {
        // from Tangram 1.5.2.2
        element = baidu.dom.g(element);
        className = new RegExp(
                        '(^|\\s)'
                        + baidu.string.trim(className)
                        + '(\\s|\x24)'
                    );

        while ((element = element.parentNode) && element.nodeType === 1) {
            if (className.test(element.className)) {
                return element;
            }
        }

        return null;
    };

    var eventFilter = EVENT._eventFilter = EVENT._eventFilter || {};



    /**
     * 事件仅在鼠标进入/离开元素区域触发一次，当鼠标在元素区域内部移动的时候不会触发，
     * 用于为非IE浏览器添加mouseleave/mouseenter支持。
     *
     * @name baidu.event._eventFilter._crossElementBoundary
     * @function
     * @param {Function} listener   要触发的函数
     * @param {DOMEvent} e          DOM事件
     */
    eventFilter._crossElementBoundary = eventFilter._crossElementBoundary
        || function (listener, e) {
        var related = e.relatedTarget,
            current = e.currentTarget;
        if (related === false
            // 如果current和related都是body，contains函数会返回false
            || current === related
            // Firefox有时会把XUL元素作为relatedTarget
            // 这些元素不能访问parentNode属性
            // thanks jquery & mootools
            || (related && (related.prefix === 'xul'
            //如果current包含related，说明没有经过current的边界
            || baidu.dom.contains(current, related)))
          ) {
            return;
        }
        return listener.call(current, e);
    };


    /**
     * 为对象绑定方法和作用域
     *
     * @name baidu.fn.bind
     * @function
     * @param {(Function | string)} handler 要绑定的函数，或者一个在作用域下可用的函数名
     * @param {Object} obj 执行运行时this，如果不传入则运行时this为函数本身
     * @param {...*} args 函数执行时附加到执行时函数前面的参数
     * @version 1.3
     *
     * @returns {Function} 封装后的函数
     */
    T.fn.bind = T.fn.bind
        || function (func, scope) {
            var xargs = arguments.length > 2
                ? [].slice.call(arguments, 2) : null;

            return function () {
                var fn = baidu.lang.isString(func) ? scope[func] : func;
                var args = (xargs)
                    ? xargs.concat([].slice.call(arguments, 0))
                    : arguments;
                return fn.apply(scope || fn, args);
            };
        };



    /**
     * 用于为非IE浏览器添加mouseenter的支持;
     * mouseenter事件仅在鼠标进入元素区域触发一次,
     * 当鼠标在元素内部移动的时候不会多次触发.
     */
    eventFilter.mouseenter = window.attachEvent
        ? null
        : eventFilter.mouseenter
            || function (element, type, listener) {
                return {
                    type: 'mouseover',
                    listener: baidu.fn.bind(
                        eventFilter._crossElementBoundary,
                        this,
                        listener
                    )
                };
            };



    /**
     * 用于为非IE浏览器添加mouseleave的支持;
     * mouseleave事件仅在鼠标移出元素区域触发一次,
     * 当鼠标在元素区域内部移动的时候不会触发.
     */
    eventFilter.mouseleave = window.attachEvent
        ? null
        : eventFilter.mouseleave || function (element, type, listener) {
            return {
                type: 'mouseout',
                listener: baidu.fn.bind(
                    EVENT._eventFilter._crossElementBoundary,
                    this,
                    listener
                )
            };
        };


    /**
     * 获取横向滚动量
     *
     * @return {number} 横向滚动量
     */
    PAGE.getScrollLeft = PAGE.getScrollLeft || function () {
        var d = document;
        return (window.pageXOffset
                || d.documentElement.scrollLeft
                || d.body.scrollLeft);
    };
    /**
     * 查询数组中指定元素的索引位置
     *
     * @private
     * @param {Array} source 需要查询的数组
     * @param {*} match 查询项
     * @returns {number} 指定元素的索引位置，查询不到时返回-1
     */
    var indexOf = function (source, target) {
        var index = -1;

        for (var i = 0, l = source.length; i < l; i++) {
            if (source[i] === target) {
                index = i;
                break;
            }
        }

        return index;
    };

    if (!T.array.indexOf) {
        T.array.indexOf = indexOf;
    }

    /**
     * 控件基类
     *
     * 只可继承，不可实例化
     * @constructor
     * @exports Control
     * @fires module:Control#beforeinit
     * @fires module:Control#afterinit
     */
    var Control = function () {

        this.children = [];
        this._listners = {};

        /**
         * @event module:Control#beforeinit
         */
        this.fire('beforeinit');

        this.bindEvents(this.binds);
        this.init.apply(this, arguments);

        /**
         * @event module:Control#beforeinit
         */
        this.fire('afterinit');

    };

    Control.prototype = {

        constructor: Control,

        /**
         * 控件类型标识
         *
         * @private
         * @type {string}
         */
        type: 'Control',

        /**
         * 控件可用状态
         *
         * @type {boolean}
         */
        disabled: false,

        /**
         * 设置可配置项
         *
         * @protected
         * @param {Object} options 配置项
         * @return {Object} 合并更新后的配置项
         */
        setOptions: function (options) {
            if (!options) {
                return this.options;
            }

            var TO           = T.object;
            var thisOptions  = this.options = TO.clone(this.options);
            var eventNameReg = /^on[A-Z]/;
            var me           = this;
            var extend       = TO.extend;

            this.srcOptions = options;

            TO.each(options, function (val, name) {

                // 处理配置项中的事件
                if (eventNameReg.test(name) && typeof val === 'function') {

                    // 移除on前缀，并转换第3个字符为小写，得到事件类型
                    var type = name.charAt(2).toLowerCase() + name.substr(3);
                    me.on(type, val);

                    delete options[name];
                }
                else if (name in thisOptions) {

                    // 只处理一层，非递归处理
                    thisOptions[name] = TO.isPlain(val)
                        ? extend(thisOptions[name] || {}, val)
                        : val;
                }
            });

            return thisOptions;
        },

        /**
         * 将实例方法绑定 this
         *
         * @protected
         * @param {Array.<string>} events 类方法名数组
         */
        bindEvents: function (events) {
            var me = this;

            if (!events || !events.length) {
                return;
            }

            if (typeof events === 'string') {
                events = events.split(/\s*,\s*/);
            }

            T.each(events, function (name, fn) {
                fn = name && me[name];
                if (fn) {
                    me[name] = function () {
                        return fn.apply(me, arguments);
                    };
                }
            });
        },


        /**
         * 控件初始化
         *
         * @abstract
         * @protected
         */
        init: function () {
            throw new Error('not implement init');
        },


        /**
         * 渲染控件
         *
         * @abstract
         * @protected
         * @return {module:Control} 当前实例
         */
        render: function () {
            throw new Error('not implement render');
        },

        /**
         * 将控件添加到页面的某个元素中
         *
         * @public
         * @param {HTMLElement} wrap 被添加到的页面元素
         */
        appendTo: function (wrap) {
            this.main = wrap || this.main;
            this.render();
        },

        /**
         * 设置控件状态为禁用
         *
         * @public
         * @fires module:Control#disable
         */
        disable: function () {
            this.disabled = true;

            /**
             * @event module:Control#disable
             */
            this.fireEvent('disable');
        },

        /**
         * 设置控件状态为启用
         *
         * @public
         * @fires module:Control#enable
         */
        enable: function () {
            this.disabled = false;

            /**
             * @event module:Control#enable
             */
            this.fireEvent('enable');
        },

        /**
         * 获取控件可用状态
         *
         * @public
         * @return {boolean} 控件的可用状态值
         */
        isDisabled: function () {
            return this.disabled;
        },


        /**
         * 添加子控件
         *
         * @public
         * @param {module:Control} control 控件实例
         * @param {string} name 子控件名
         */
        addChild: function (control, name) {
            var children = this.children;

            name = name || control.childName;

            if (name) {
                children[nane] = control;
            }

            children.push(control);
        },

        /**
         * 移除子控件
         *
         * @public
         * @param {module:Control} control 子控件实例
         */
        removeChild: function (control) {
            T.object.each(
                this.children,
                function (child, name) {
                    if (child === control) {
                        delete this[name];
                    }
                }
            );
        },

        /**
         * 获取子控件
         *
         * @public
         * @param {string} name 子控件名
         * @return {module:Control} 获取到的子控件
         */
        getChild: function (name) {
            return this.children[name];
        },

        /**
         * 批量初始化子控件
         *
         * @public
         * @param {HTMLElement} wrap 容器DOM元素
         */
        initChildren: function (/* wrap */) {
            throw new Error('not implement initChildren');
        },

        /**
         * 添加事件绑定
         *
         * @public
         * @param {string=} type 事件类型
         * @param {Function} listner 要添加绑定的监听器
         */
        on: function (type, listner) {
            if (!T.isString(type)) {
                listner = type;
                type = '*';
            }

            var listners = this._listners[type] || [];

            if (indexOf(listners, listner) < 0) {
                listner.$type = type;
                listners.push(listner);
            }

            this._listners[type] = listners;

            return this;
        },

        /**
         * 解除事件绑定
         *
         * @public
         * @param {string=} type 事件类型
         * @param {Function=} listner 要解除绑定的监听器
         */
        un: function (type, listner) {
            if (!T.isString(type)) {
                listner = type;
                type = '*';
            }

            var listners = this._listners[type];

            if (listners) {
                if (listner) {
                    var index = indexOf(listners, listner);

                    if (~index) {
                        delete listners[index];
                    }
                }
                else {
                    listners.length = 0;
                    delete this._listners[type];
                }
            }

            return this;
        },

        /**
         * 触发指定事件
         *
         * @public
         * @param {string} type 事件类型
         * @param {Object} args 透传的事件数据对象
         */
        fire: function (type, args) {
            var listners = this._listners[type];

            if (listners) {
                T.array.each(
                    listners,
                    function (listner) {

                        args = args || {};
                        args.type = type;

                        listner.call(this, args);

                    },
                    this
                );
            }

            if (type !== '*') {
                this.fire('*', args);
            }

            return this;
        },

        /**
         * 销毁控件
         *
         * @public
         * @fires module:Control#dispose
         */
        dispose: function () {

            /**
             * @event module:Control#dispose
             */
            this.fire('dispose');

            var child;
            while ((child = this.children.pop())) {
                child.dispose();
            }

            for (var type in this._listners) {
                this.un(type);
            }
        }

    };


    /**
     * 从事件源查找目标DOM节点
     *
     * @param {DOMEvent} e DOM事件对象
     * @param {string} className 目标的className
     * @return {?HTMLElement} 找到的目标对象
     */
    var getTarget = function (e, className) {
        var target = T.event.getTarget(e);

        if (!DOM.hasClass(target, className)) {
            target = DOM.getAncestorByClass(target, className);

            if (!target) {
                return null;
            }
        }

        return target;
    };

    /**
     * 提示层控件
     *
     * @constructor
     * @extends module:Control
     * @requires Control
     * @exports Tip
     * @example
     * new Tip({
     *     mode: 'over',
     *     arrow: "1",
     *     offset: { x: 5, y: 5},
     *     onBeforeShow: function () {
     *       this.title = Math.random();
     *     }
     * }).render();
     *
     */
    var Tip = function () {
        this.constructor.superClass.constructor.apply(this, arguments);
    };

    /**
     * 提示框消失的延迟时间，单位毫秒
     *
     * @public
     * @const
     * @type {number}
     */
    Tip.HIDE_DELAY = 500;


    Tip.prototype = {

        /**
         * 控件类型标识
         *
         * @private
         * @type {string}
         */
        type: 'Tip',

        /**
         * 控件配置项
         *
         * @private
         * @name module:Tip#options
         * @type {Object}
         * @property {boolean} disabled 控件的不可用状态
         * @property {(string | HTMLElement)} main 控件渲染容器
         * @property {boolean|string=} arrow 提示框的箭头参数，默认为false，不带箭头
         * 可以初始化时通过指定arrow属性为“1”开启箭头模式，也可以手动指定箭头方向：
         * tr | rt | rb | br | bl | lb | lt | tl | tc | rc | bc | lc
         * 也可通过在 triggers 上设置 data-tooltips来指定
         * @property {number=} hideDelay 提示框消失的延迟时间，默认值为Tip.HIDE_DELAY
         * @property {string=} mode 提示的显示模式，over|click|auto。默认为over
         * @property {string=} title 提示的标题信息，默认为null
         * @property {string} content 提示的内容信息
         * @property {string} prefix 控件class前缀，同时将作为main的class之一
         * @property {string} triggers 自动绑定本控件功能的class
         * @property {string} flag 标识作为trigger的class
         * @property {Object.<string, number>} offset 浮层显示的偏移量
         * @property {number} offset.x x 轴方向偏移量
         * @property {number} offset.y y轴方向偏移量
         * @property {string} tpl 浮层内部HTML模板
         */
        options: {

            // 提示框的不可用状态，默认为false。处于不可用状态的提示框不会出现。
            disabled: false,

            // 控件渲染主容器
            main: '',

            // 提示框的箭头参数，默认为false，不带箭头
            // 可以初始化时通过指定arrow属性为“1”开启箭头模式
            // 也可以手动指定箭头方向：
            // tr | rt | rb | br | bl | lb | lt | tl | tc | rc | bc | lc。
            // 也可通过在 triggers 上设置 data-tooltips来指定
            arrow: false,

            // 提示框消失的延迟时间，默认值为Tip.HIDE_DELAY
            hideDelay: 0,

            // 提示的显示模式，over|click|auto。默认为over
            mode: 'over',

            // 提示的标题信息，默认为null
            title: null,

            // 提示的内容信息
            content: '',

            // 控件class前缀，同时将作为main的class之一
            prefix: 'ecl-ui-tip',

            // 自动绑定本控件功能的class
            triggers: 'tooltips',

            // 标识作为trigger的class
            flag: '_ecui_tips',

            // 浮层显示的偏移量
            offset: {

                // x 轴方向偏移量
                x: 0,

                // y 轴方向偏移量
                y: 0
            },

            // 控件模板
            tpl: ''
            + '<div class="{prefix}-arrow {prefix}-arrow-top">'
            +   '<em></em>'
            +   '<ins></ins>'
            + '</div>'
            + '<div class="{prefix}-title"></div>'
            + '<div class="{prefix}-body"></div>'
        },

        /**
         * 需要绑定 this 的方法名，多个方法以半角逗号分开
         *
         * @private
         * @type {string}
         */
        binds: 'onResize, onDocClick, onShow, onHide, hide',

        /**
         * 控件初始化
         *
         * @private
         * @param {Object} options 控件配置项
         * @see module:Tip#options
         */
        init: function (options) {
            options = this.setOptions(options);
            options.hideDelay = options.hideDelay < 0
                ? Tip.HIDE_DELAY : options.hideDelay;

            this.disabled  = options.disabled;
            this.title     = options.title;
            this.content   = options.content;

            var prefix = options.prefix;
            var main   = this.main = document.createElement('div');

            main.className  = prefix;
            main.innerHTML  = options.tpl.replace(/{prefix}/g, prefix);
            main.style.left = '-2000px';

            this.events = {
                over: {
                    on: 'mouseenter',
                    un: 'mouseleave'
                },
                click: {
                    on: 'click',
                    un: 'click'
                }
            }[options.mode];
        },


        /**
         * 绘制控件
         *
         * @public
         * @fires module:Tip#click
         * @return {module:Tip} 当前实例
         */
        render: function () {

            var me      = this;
            var main    = this.main;
            var options = this.options;
            var events  = this.events;

            if (!this.rendered) {
                this.rendered = true;

                document.body.appendChild(main);

                T.on(
                    main,
                    'click',
                    function (e) {

                        /**
                         * @event module:Tip#click
                         * @type {Object}
                         * @property {DOMEvent} event 事件源对象
                         */
                        me.fire('click', {event: e});
                    }
                );

                if (this.options.mode === 'over') {
                    T.on(
                        main,
                        'mouseenter',
                        function () {
                            me.clear();
                        }
                    );

                    T.on(
                        main,
                        'mouseleave',
                        function () {
                            me.clear();
                            me.timer = setTimeout(me.hide, options.hideDelay);
                        }
                    );
                }

                var elements = this.elements = {};
                var prefix = options.prefix + '-';

                T.each(
                    'arrow,title,body'.split(','),
                    function (name) {
                        elements[name] = T.q(prefix + name, main)[0];
                    }
                );

                this.addTriggers(options.triggers);

            }

            if (!events && this.triggers) {
                this.show(this.triggers[0]);
            }

            return this;
        },

        /**
         * 增加触发tips的DOM
         *
         * @public
         * @param {(string | HTMLElement | HTMLCollection | Array)} triggers
         * className/dom节点/dom集合或dom节点数组
         */
        addTriggers: function (triggers) {
            var me      = this;
            var options = this.options;
            var events  = this.events;
            var flag    = options.flag;

            this.triggers = typeof triggers === 'string'
                ? T.q(options.triggers)
                : (triggers.length ? triggers : [triggers]);

            if (events) {
                T.each(
                    this.triggers,
                    function (trigger) {
                        T.addClass(trigger, flag);
                        T.on(trigger, events.on, me.onShow);
                        // T.on(trigger, events.un, me.onHide);
                    }
                );
            }
        },

        refresh: function () {

        },

        /**
         * 清除各种定时器
         *
         * @private
         */
        clear: function () {
            clearTimeout(this.timer);
            clearTimeout(this.resizeTimer);
        },

        /**
         * 浏览器可视尺寸改变时处理
         *
         * @private
         */
        onResize: function () {
            clearTimeout(this.resizeTimer);

            var me = this;
            this.resizeTimer = setTimeout(
                function () {
                    me.show(me.current);
                },
                100
            );
        },

        onDocClick: function (e) {
            var main = this.main;
            var target = T.event.getTarget(e);

            if (
                main === target
                    || ~T.array.indexOf(this.triggers, target)
                    || DOM.contains(main, target)
            ) {
                return;
            }

            this.hide();

        },


        /**
         * 显示浮层前处理
         *
         * @private
         * @param {DOMEvent} e DOM 事件对象
         * @fires module:Tip#beforeShow 显示前事件
         */
        onShow: function (e) {
            var target = getTarget(e, this.options.flag);

            this.clear();

            if (!target || this.current === target) {
                return;
            }

            var events = this.events;
            if (events) {
                T.on(target, events.un, this.onHide);
                T.un(target, events.on, this.onShow);

                if (this.current) {
                    T.on(this.current, events.on, this.onShow);
                    T.un(this.current, events.un, this.onHide);
                }

                if (this.options.mode === 'click') {
                    T.on(document, 'click', this.onDocClick);
                }
            }

            this.current = target;

            /**
             * @event module:Tip#beforeShow
             * @type {Object}
             * @property {HTMLElement} target 事件源 DOM 对象
             * @property {DOMEvent} e 事件源对象
             */
            this.fire('beforeShow', { target: target, event: e});

            this.show(target);
        },


        /**
         * 隐藏浮层前处理
         *
         * @private
         */
        onHide: function () {
            var options = this.options;

            this.clear();

            if (options.hideDelay) {
                this.timer = setTimeout(this.hide, options.hideDelay);
            }
            else {
                this.hide();
            }
        },

        /**
         * 显示浮层
         *
         * @public
         * @param {?HTMLElement=} target 触发显示浮层的节点
         * @fires module:Tip#show 显示事件
         */
        show: function (target) {
            var options  = this.options;
            var events   = this.events;
            var elements = this.elements;

            this.clear();

            this.current = target;

            // if (events && target) {
            //     T.on(target, events.un, this.onHide);
            // }

            T.on(window, 'resize', this.onResize);

            elements.title.innerHTML = this.title || '';
            elements.body.innerHTML  = this.content;

            T[this.title ? 'show' : 'hide'](elements.title);

            if (!options.arrow) {
                T.hide(elements.arrow);
            }

            this.computePosition();

            /**
             * @event module:Tip#show
             * @type {Object}
             * @property {HTMLElement} target 事件源 DOM 对象
             */
            this.fire('show', {target: target});

        },

        /**
         * 隐藏浮层
         *
         * @public
         * @fires module:Tip#hide 隐藏事件
         */
        hide: function () {
            var main    = this.main;

            var events = this.events;
            var target = this.current;
            if (events && target) {
                T.on(target, events.on, this.onShow);
                T.un(target, events.un, this.onHide);

                if (this.options.mode === 'click') {
                    T.un(document, 'click', this.onDocClick);
                }
            }

            this.clear();

            var arrow = this.elements.arrow;
            DOM.setStyle(main, 'left', - main.offsetWidth - arrow.offsetWidth);

            this.current = null;
            T.un(window, 'resize', this.onResize);

            /**
             * @event module:Tip#hide
             */
            this.fire('hide');
        },

        /**
         * 判断提示层是否可见
         *
         * @public
         * @return {boolean} 可见的状态
         */
        isVisible: function () {

            return !!this.current;

        },

        /**
         * 设置提示层的标题部分内容
         *
         * 如果参数为空，则隐藏提示层的标题部分
         *
         * @public
         * @param {string} html
         */
        setTitle: function (html) {
            this.title = html || '';

            var elements = this.elements;
            elements.title.innerHTML = this.title;
            T[this.title ? 'show' : 'hide'](elements.title);
        },

        /**
         * 设置提示层显示的内容
         *
         * @public
         * @param {string} html 要提示的内容的HTML
         */
        setContent: function (html) {
            this.content = html || '';
            this.elements.body.innerHTML = this.content;
        },

        /**
         * 计算浮层及箭头显示位置
         *
         * @private
         */
        computePosition: function () {
            var options      = this.options;
            var target       = this.current;
            var main         = this.main;
            var arrow        = this.elements.arrow;
            var dir          = options.arrow;
            var position     = DOM.getPosition(target);
            var prefix       = options.prefix + '-arrow';

            // 目标的8个关键坐标点
            var top          = position.top;
            var left         = position.left;
            var width        = target.offsetWidth;
            var height       = target.offsetHeight;
            var right        = left + width;
            var bottom       = top + height;
            var center       = left + (width / 2);
            var middle       = top + (height / 2);

            // 提示层宽高
            var mainWidth    = main.offsetWidth;
            var mainHeight   = main.offsetHeight;

            // 箭头宽高
            // XXX: 如果通过 tpl 修改了控件模板，
            // 或者针对箭头部分改了样式，此处得到结果不对或者报错
            var arrowWidth   = arrow.firstChild.offsetWidth;
            var arrowHeight  = arrow.firstChild.offsetHeight;

            // 视窗范围
            var scrollTop    = PAGE.getScrollTop();
            var scrollLeft   = PAGE.getScrollLeft();
            var scrollRight  = scrollLeft + PAGE.getViewWidth();
            var scrollBottom = scrollTop + PAGE.getViewHeight();

            // 属性配置优于实例配置
            var dirFromAttr = target.getAttribute('data-tooltips');
            if (dirFromAttr) {
                dir = /[trblc]{2}/.test(dirFromAttr) ? dirFromAttr : '1';
            }

            var second, first;

            // 未指定方向时自动按下右上左顺序计算可用方向（以不超出视窗为原则）
            if (!dir || dir === '1') {

                // 目标宽度大于提示层宽度时优先考虑水平居中
                var horiz = width > mainWidth
                        || left - (mainWidth - width) / 2 > 0
                        && right + (mainWidth - width) / 2 <= scrollRight
                        ? 'c'
                        : left + mainWidth > scrollRight
                            ? 'r'
                            : 'l';

                // 目标高度大于提示层高度时优先考虑垂直居中
                var vertical = height > mainHeight
                        || top - (mainHeight - height) / 2 > 0
                        && bottom + (mainHeight - height) / 2 <= scrollBottom
                        ? 'c'
                        : top + mainHeight > scrollBottom
                            ? 'b'
                            : 't';

                // 如果提示层在目标下边未超出视窗
                if (bottom + arrowHeight + mainHeight <= scrollBottom) {
                    first = 'b';
                    second = horiz;
                }

                // 如果提示层在目标右侧未超出视窗
                else if (right + mainWidth + arrowWidth <= scrollRight) {
                    first = 'r';
                    second = vertical;
                }

                // 如果提示层在目标上边未超出视窗
                else if (top - mainHeight - arrowHeight >= scrollTop) {
                    first = 't';
                    second = horiz;
                }

                // 如果提示层在目标左侧未超出视窗
                else if (left - mainWidth - arrowWidth >= scrollLeft) {
                    first = 'l';
                    second = vertical;
                }

                dir = first + second;
            }
            else {

                // 从 dir 中分拆水平和垂直方向值，方便后续计算
                first = dir.charAt(0);
                second = dir.charAt(1);
            }

            var lrtb   = { l: 'left', r: 'right', t: 'top', b: 'bottom' };
            var offset = options.offset;

            arrow.className = prefix + ' ' + prefix + '-' + lrtb[first];

            // 改变箭头方向后需要校准箭头宽高
            // XXX: 如果通过 tpl 修改了控件模板，
            // 或者针对箭头部分改了样式，此处得到结果不对或者报错
            arrowWidth  = arrow.firstChild.offsetWidth;
            arrowHeight = arrow.firstChild.offsetHeight;

            var middleLeft = (mainWidth - arrowWidth) / 2;
            var middleTop  = (mainHeight - arrowHeight) / 2;

            // 提示层在目标上部或下部显示时的定位处理
            if ({t: 1, b: 1}[first]) {
                left = {
                    l: left,
                    c: center - (mainWidth / 2),
                    r: right - mainWidth
                }[second];

                top = {
                    t: top - arrowHeight - mainHeight - offset.y,
                    b: bottom + arrowHeight + offset.y
                }[first];

                DOM.setStyle(
                    arrow,
                    'left',

                    // 在目标宽于提示层或 dir 为 tc 或 bc 时，箭头相对提示层水平居中
                    {
                        c: middleLeft,
                        l: (width - arrowWidth) / 2,
                        //r: (mainWidth - (width - arrowWidth) / 2)
                        r: (mainWidth - Math.max( (width - arrowWidth) / 2, arrowWidth ) )
                    }[width > mainWidth ? 'c' : second]
                );
                DOM.setStyle(arrow, 'top', '');

            }

            // 提示层在目标左边或右边显示时的定位处理
            else if ({l: 1, r: 1}[first]) {
                top = {
                    t: top,
                    c: middle - (mainHeight / 2),
                    b: bottom - mainHeight
                }[second];

                left = {
                    l: left - arrowWidth - mainWidth - offset.x,
                    r: right + arrowWidth + offset.x
                }[first];

                DOM.setStyle(
                    arrow,
                    'top',

                    // 在目标高于提示层或 dir 为 lc 或 rc 时，箭头相对提示层垂直居中
                    {
                        c: middleTop,
                        t: (height - arrowHeight) / 2,
                        b: (mainHeight - (height - arrowHeight) / 2)
                    }[height > mainHeight ? 'c' : second]
                );
                DOM.setStyle(arrow, 'left', '');

            }

            DOM.setStyles(main, {left: left, top: top});

        }

    };
    T.inherits(Tip, Control);

    return Tip;
});