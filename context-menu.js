(function (global) {
    "use strict";

    if (!global.jQuery) {
        throw new Error("ContextMenu.js requires jQuery to be loaded first.");
    }

    var $ = global.jQuery;
    var fallbackIdCounter = 0;
    var instanceCounter = 0;

    /*
     * A empresa já pode fornecer uma função global getUniqueID(prefix).
     * Quando ela existe e retorna um ID válido, a biblioteca respeita esse contrato.
     * O fallback abaixo existe apenas para que ContextMenu.js continue funcional em
     * projetos que não possuam esse helper global.
     */
    function createUniqueID(prefix) {
        if (typeof global.getUniqueID === "function") {
            var externalId = global.getUniqueID(prefix);
            if (externalId != null && String(externalId).length > 0 && !document.getElementById(String(externalId))) {
                return String(externalId);
            }
        }

        var id;
        do {
            fallbackIdCounter += 1;
            id = prefix + "-" + Date.now().toString(36) + "-" + fallbackIdCounter.toString(36);
        } while (document.getElementById(id));

        return id;
    }

    class ContextMenu {
        /*
         * selector define onde o menu pode abrir. exclude é opcional e serve para
         * retirar subconjuntos desse selector sem obrigar o consumidor a criar uma
         * expressão CSS mais difícil de entender.
         */
        constructor(selector, exclude = "") {
            if (typeof selector !== "string" || selector.trim().length === 0) {
                throw new Error("ContextMenu requires a non-empty CSS selector.");
            }

            this._name = createUniqueID("context-menu");
            this._selector = selector;
            this._exclude = exclude || "";
            this._items = [];
            this._menu = null;
            this._menuList = null;
            this._itemInContext = null;
            this._initiated = false;
            instanceCounter += 1;
            this._eventNamespace = ".contextMenu" + instanceCounter;
        }

        get name() {
            return this._name;
        }

        get selector() {
            return this._selector;
        }

        set selector(selector) {
            if (typeof selector === "string" && selector.trim().length > 0) {
                this._selector = selector;
            }
        }

        get exclude() {
            return this._exclude;
        }

        set exclude(exclude) {
            this._exclude = typeof exclude === "string" ? exclude : "";
        }

        /*
         * Retorna uma cópia dos itens em vez de expor o array interno.
         * Assim, alterações feitas no resultado não modificam o estado do menu.
         */
        get items() {
            return this._items.map(function (item) {
                return {
                    name: item.name,
                    action: item.action,
                    class: item.className
                };
            });
        }

        /*
         * action funciona como identificador público do item e também é exposta em
         * data-action. Por isso, duas ações iguais no mesmo menu seriam ambíguas.
         */
        addItem(name, action, textClass = "") {
            if (this._items.some(function (item) { return item.action === action; })) {
                throw new Error("There is already one '" + action + "' in the action list.");
            }

            this._items.push({
                name: name,
                action: action,
                className: textClass || ""
            });

            if (this._initiated) {
                this._renderItems();
            }

            return this;
        }

        /* Remove pelo identificador público e mantém o DOM sincronizado se já iniciado. */
        removeItem(action) {
            var index = this._items.findIndex(function (item) {
                return item.action === action;
            });

            if (index >= 0) {
                this._items.splice(index, 1);
                if (this._initiated) {
                    this._renderItems();
                }
            }

            return this;
        }

        /*
         * initiate() pode ser chamado novamente com segurança.
         * Na primeira chamada o menu é montado e os eventos são registrados; nas
         * chamadas seguintes apenas os itens são sincronizados com o DOM.
         */
        initiate() {
            if (!this._initiated) {
                this._buildMenu();
                this._bindEvents();
                this._initiated = true;
            } else {
                this._renderItems();
            }

            return this;
        }

        /*
         * Remove tudo que pertence exclusivamente a esta instância.
         * O namespace de eventos evita remover listeners da aplicação ou de outros
         * ContextMenu existentes na mesma página.
         */
        destroy() {
            $(document).off(this._eventNamespace);
            $(global).off(this._eventNamespace);

            if (this._menu) {
                this._menu.off(this._eventNamespace);
                this._menu.remove();
            }

            this._menu = null;
            this._menuList = null;
            this._itemInContext = null;
            this._initiated = false;

            return this;
        }

        /*
         * O container é criado uma única vez. Os itens ficam em uma lista separada
         * para que addItem/removeItem consigam redesenhar apenas o conteúdo.
         */
        _buildMenu() {
            this._menu = $("<div></div>")
                .attr("id", this._name)
                .attr("aria-hidden", "true")
                .addClass("context-menu");

            this._menuList = $("<ul></ul>")
                .attr("role", "menu")
                .addClass("context-menu__items");

            this._menu.append(this._menuList);
            $("body").append(this._menu);
            this._renderItems();
        }

        /*
         * Reconstrói apenas os itens, nunca os listeners globais. O texto entra via
         * .text(), evitando interpretar o nome do item como HTML fornecido pelo usuário.
         */
        _renderItems() {
            var self = this;
            this._menuList.empty();

            this._items.forEach(function (item) {
                var $menuItem = $("<li></li>")
                    .attr("role", "none")
                    .addClass("context-menu__item");

                var $menuButton = $("<button></button>")
                    .attr("type", "button")
                    .attr("role", "menuitem")
                    .attr("tabindex", "-1")
                    .attr("data-action", item.action)
                    .addClass("context-menu__link")
                    .text(item.name);

                if (item.className) {
                    $menuButton.addClass(item.className);
                }

                $menuItem.append($menuButton);
                self._menuList.append($menuItem);
            });

            if (this._items.length === 0) {
                this._hide();
            }
        }

        /*
         * Eventos de document/window são registrados com namespace próprio.
         * Isso evita sobrescrever handlers globais de resize/keyup e permite que
         * destroy() desfaça exatamente o que esta instância registrou.
         */
        _bindEvents() {
            var self = this;
            var namespace = this._eventNamespace;

            $(document)
                .on("contextmenu" + namespace, function (event) {
                    self._handleContextMenu(event);
                })
                .on("click" + namespace, function (event) {
                    if (!self._menu || self._menu.has(event.target).length > 0 || self._menu[0] === event.target) {
                        return;
                    }
                    self._hide();
                })
                .on("keydown" + namespace, function (event) {
                    self._handleKeydown(event);
                });

            $(global).on("resize" + namespace + " scroll" + namespace + " blur" + namespace, function () {
                self._hide();
            });

            this._menu.on("click" + namespace, ".context-menu__link", function () {
                self._hide();
            });
        }

        /*
         * Decide se o clique pertence a esta instância. Só bloqueamos o menu nativo
         * quando encontramos um elemento válido; fora do selector o browser continua
         * com seu comportamento normal.
         */
        _handleContextMenu(event) {
            if (this._menu && (this._menu[0] === event.target || this._menu.has(event.target).length > 0)) {
                event.preventDefault();
                return;
            }

            var item = this._findContextItem(event.target);
            if (!item || this._items.length === 0) {
                this._hide();
                return;
            }

            event.preventDefault();
            this._itemInContext = item;
            this._syncContextDataId();
            this._show();
            this._position(event, item);
        }

        /*
         * Caminha do elemento clicado até os ancestrais. O exclude tem prioridade:
         * se qualquer ponto do caminho atender ao selector excluído, este menu não
         * deve ser aberto para aquele contexto.
         */
        _findContextItem(target) {
            var element = target;

            while (element && element !== document) {
                if (this._exclude && $(element).is(this._exclude)) {
                    return null;
                }
                if ($(element).is(this._selector)) {
                    return element;
                }
                element = element.parentNode;
            }

            return null;
        }

        /*
         * Quando o elemento em contexto possui data-id, o valor é copiado para cada
         * ação do menu. Também atualizamos o cache do .data() do jQuery, pois mudar
         * apenas o atributo depois de uma leitura anterior pode devolver valor antigo.
         */
        _syncContextDataId() {
            var $contextItem = $(this._itemInContext);
            var dataId = $contextItem.find("[data-id]").first().attr("data-id");

            if (dataId == null) {
                dataId = $contextItem.attr("data-id");
            }

            dataId = dataId == null ? "" : String(dataId).trim();
            this._menu.find(".context-menu__link")
                .attr("data-id", dataId)
                .data("id", dataId);
        }

        /*
         * Apenas um context menu deve permanecer aberto por vez, mesmo quando existem
         * várias instâncias atendendo seletores diferentes na mesma página.
         */
        _show() {
            $(".context-menu.context-menu--active")
                .not(this._menu)
                .removeClass("context-menu--active")
                .attr("aria-hidden", "true")
                .css({ left: "", top: "" });

            this._menu
                .addClass("context-menu--active")
                .attr("aria-hidden", "false");
        }

        /* Fecha visualmente o menu e descarta a referência ao elemento em contexto. */
        _hide() {
            if (!this._menu) {
                return;
            }

            this._menu
                .removeClass("context-menu--active")
                .attr("aria-hidden", "true")
                .css({ left: "", top: "" });

            this._itemInContext = null;
        }

        /*
         * clientX/clientY e innerWidth/innerHeight usam o mesmo sistema de coordenadas
         * (viewport). Isso mantém o menu dentro da tela inclusive após scroll.
         * O fallback baseado no elemento também permite posicionar corretamente quando
         * o evento não fornecer coordenadas úteis.
         */
        _position(event, item) {
            var margin = 4;
            var x = typeof event.clientX === "number" ? event.clientX : 0;
            var y = typeof event.clientY === "number" ? event.clientY : 0;

            if (x === 0 && y === 0 && item && item.getBoundingClientRect) {
                var rect = item.getBoundingClientRect();
                x = rect.left;
                y = rect.bottom;
            }

            var menuWidth = this._menu.outerWidth();
            var menuHeight = this._menu.outerHeight();
            var maxLeft = Math.max(margin, global.innerWidth - menuWidth - margin);
            var maxTop = Math.max(margin, global.innerHeight - menuHeight - margin);

            this._menu.css({
                left: Math.min(Math.max(x, margin), maxLeft) + "px",
                top: Math.min(Math.max(y, margin), maxTop) + "px"
            });
        }

        /*
         * Interações básicas de teclado: Escape fecha o menu e as setas percorrem
         * os itens. Mantemos o comportamento pequeno e previsível sem criar um sistema
         * de navegação mais complexo do que a biblioteca precisa.
         */
        _handleKeydown(event) {
            if (!this._menu || !this._menu.hasClass("context-menu--active")) {
                return;
            }

            if (event.key === "Escape" || event.keyCode === 27) {
                event.preventDefault();
                this._hide();
                return;
            }

            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                return;
            }

            var $items = this._menu.find(".context-menu__link");
            if ($items.length === 0) {
                return;
            }

            event.preventDefault();
            var currentIndex = $items.index(document.activeElement);
            var nextIndex;

            if (event.key === "ArrowUp") {
                nextIndex = currentIndex <= 0 ? $items.length - 1 : currentIndex - 1;
            } else {
                nextIndex = currentIndex >= $items.length - 1 ? 0 : currentIndex + 1;
            }

            $items.eq(nextIndex).trigger("focus");
        }
    }

    global.ContextMenu = ContextMenu;
})(window);
