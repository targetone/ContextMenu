function getUniqueID(prefix) {
    // From Bootstrap
    do {
        // eslint-disable-next-line no-bitwise
        prefix += ~~(Math.random() * 1000000); // "~~" acts like a faster Math.floor() here
    } while (document.getElementById(prefix));
    return prefix;
}

class ContextMenu {

    constructor(selector, exclude = "") {
        this._name = getUniqueID("context-menu");
        this._selector = selector;
        this._exclude = exclude;
        this._itemName = [];
        this._itemAction = [];
        this._itemClass = [];
    }

    get name() {
        return this._name;
    }

    get selector() {
        return this._selector;
    }

    set selector(selector) {
        if (selector.length != 0) {
            this._selector = selector;
        }
    }

    get exclude() {
        return this._exclude;
    }

    set exclude(exclude) {
        if (exclude.length != 0) {
            this._exclude = exclude;
        }
    }

    get items() {
        let key = ['name', 'action', 'class'],
            names = this._itemName,
            actions = this._itemAction,
            classes = this._itemClass,
            items = [],
            item = {};

        this._itemAction.forEach(function (k, i) {
            item[key[0]] = names[i];
            item[key[1]] = actions[i];
            item[key[2]] = classes[i];
            items.push(item);
            item = {};
        });

        return items;
    }

    addItem(name, action, textClass = "") {
        if (this._itemAction.indexOf(action) >= 0) {
            throw new Error("There is already one '" + action + "' in the action list.");
        }

        this._itemName.push(name);
        this._itemAction.push(action);
        this._itemClass.push(textClass);
    }

    removeItem(action) {
        let index = this._itemAction.indexOf(action);
        if (index >= 0) {
            this._itemName.splice(index, 1);
            this._itemAction.splice(index, 1);
            this._itemClass.splice(index, 1);
        }
    }

    initiate() {
        /**
         * Variables (PART ONE).
         */
        var contextMenuClassName = "context-menu";
        var contextMenuItemClassName = "context-menu__item";
        var contextMenuLinkClassName = "context-menu__link";
        var contextMenuActive = "context-menu--active";

        // Build the HTML

        let $menuNav = $("<nav></nav>"),
            $menuUl = $("<ul></ul>"),
            idMenu = this._name,
            elMenu = $("*[id*='" + idMenu + "']");

        if (elMenu.length > 0) {
            idMenu += "-" + (elMenu.length + 1);
        }

        for (var i = 0; i < this._itemAction.length; i++) {
            let $menuLi = $("<li></li>"),
                $menuA = $("<span></p>");

            $menuLi.addClass(contextMenuItemClassName);
            $menuA.addClass(contextMenuLinkClassName);
            $menuA.addClass(this._itemClass[i]);
            $menuA.attr("data-action", this._itemAction[i]);
            //$menuA.attr("href", "#");
            $menuA.text(this._itemName[i]);
            $menuLi.append($menuA);
            $menuUl.append($menuLi);
        }

        $menuNav.attr("id", idMenu);
        $menuNav.addClass(contextMenuClassName);

        $menuUl.addClass("context-menu__items");

        $menuNav.append($menuUl);

        if (this._itemAction.length > 0) {
            $("body").append($menuNav);
        }
        else {
            $("body").append($("<div class='d-none'></div>"));
        }

        // HTML built

        function clickInsideElement(e, selectorF) {
            var el = e.srcElement || e.target;
            if ($(el).is(exclude)) {
                return false;
            }
            else if ($(el).is(selectorF)) {
                return el;
            } else {
                while (el = el.parentNode) {
                    if ($(el).is(exclude)) {
                        return false;
                    }
                    else if ($(el).is(selectorF)) {
                        return el;
                    }
                }
            }

            return false;
        }

        function getPosition(e) {
            var posx = 0;
            var posy = 0;

            if (!e) var e = window.event;

            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            } else if (e.clientX || e.clientY) {
                posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }


            return {
                x: posx,
                y: posy
            };
        }

        var itemInContext;
        var selector = this._selector;
        var exclude = this._exclude;

        var clickCoords;
        var clickCoordsX;
        var clickCoordsY;

        var menu = $("#" + idMenu);
        var menuItems = menu.find($(".context-menu__item"));
        var menuState = 0;
        var menuWidth;
        var menuHeight;
        var menuPosition;
        var menuPositionX;
        var menuPositionY;

        var windowWidth;
        var windowHeight;

        /**
         * Initialise our application's code.
         */
        function init() {
            contextListener();
            clickListener();
            keyupListener();
            resizeListener();
        }

        function isTouchDevice() {
            var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
            var mq = function (query) {
                return window.matchMedia(query).matches;
            }

            if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
                return true;
            }

            // include the 'heartz' as a way to have a non matching MQ to help terminate the join
            // https://git.io/vznFH
            var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
            return mq(query);
        }

        /**
         * Listens for contextmenu events.
         */
        function contextListener() {
            $(document).on("scroll", function () { toggleMenuOff(); });
            $(document).on("contextmenu", function (e) {
                fireContext(e);
            });
            $(document).on("taphold", function (e) {
                if (isTouchDevice()) {
                    fireContext(e);
                }
            });
        }

        function fireContext(e) {
            itemInContext = clickInsideElement(e, selector);

            if ($.contains(menu[0], e.target) || menu[0] == e.target) {
                e.preventDefault();
            }

            if (itemInContext) {
                e.preventDefault();
                if (menu.length > 0) {
                    menuItems = menuItems.each(
                        function (i, j) {
                            var dataId = $(itemInContext).find("*[data-id]").attr("data-id");
                            dataId = !dataId ? $(itemInContext).attr("data-id") : dataId;

                            $(j).find("." + contextMenuLinkClassName).attr("data-id", (dataId == null ? "": dataId).trim());
                        }
                    );
                    toggleMenuOn();
                    positionMenu(e);
                }
            } else {
                itemInContext = null;
                toggleMenuOff();
            }
        }

        function clickListener() {
            $(document).on("click", function (e) {

                var clickeElIsLink = clickInsideElement(e, "." + contextMenuLinkClassName);

                if (clickeElIsLink && $(itemInContext).is(selector) && menu.find(clickeElIsLink).length > 0) {
                    e.preventDefault();
                    menuItemListener(clickeElIsLink);
                } else {
                    var button = e.which || e.button;
                    if (button === 1) {
                        toggleMenuOff();
                    }
                }
            });
        }

        $(document).on("lostFocus", function (event) {
            toggleMenuOff();
        });

        function keyupListener() {
            window.onkeyup = function (e) {
                if (e.keyCode === 27) {
                    toggleMenuOff();
                }
            };
        }

        function resizeListener() {
            window.onresize = function (e) {
                toggleMenuOff();
            };
        }

        function toggleMenuOn() {
            if (menu.length > 0) {
                if (menuState !== 1) {
                    menuState = 1;
                    menu.addClass(contextMenuActive);
                }
            }
        }

        function toggleMenuOff() {
            if (menuState !== 0) {
                menuState = 0;
                $(menu).removeClass(contextMenuActive);
                $(menu).attr("style", "");
            }
        }

        function positionMenu(e) {
            clickCoords = getPosition(e);
            clickCoordsX = clickCoords.x;
            clickCoordsY = clickCoords.y;

            menuWidth = menu.outerWidth() + 4;
            menuHeight = menu.outerHeight() + 4;

            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;

            if ((windowWidth - clickCoordsX) < menuWidth) {
                $(menu).css("left", windowWidth - menuWidth + "px");
            } else {
                $(menu).css("left", clickCoordsX + "px");
            }

            if ((windowHeight - clickCoordsY) < menuHeight) {
                $(menu).css("top", clickCoordsY - menuHeight + 4 + "px");
            } else {
                $(menu).css("top", clickCoordsY + "px");
            }
        }

        function menuItemListener(link) {
            //console.log(itemInContext);
            //console.log("ID - " + $(itemInContext).find("*[data-id]").attr("data-id").trim() + "\nAction - " + link.getAttribute("data-action"));

            //fireEvent($(itemInContext).find("*[data-id]").attr("data-id").trim(), link.getAttribute("data-action"));

            toggleMenuOff();
        }

        init();
    }
}