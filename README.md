# ContextMenu.js

ContextMenu.js é uma biblioteca JavaScript simples e leve para criar menus de contexto personalizados em aplicações que já utilizam jQuery.

## Dependências

- jQuery deve ser carregado antes de `context-menu.js`.
- Nos sistemas da empresa, a função global `getUniqueID(prefix)` é a geradora de ID preferencial e será utilizada quando estiver disponível.
- Para não quebrar um consumidor que não exponha `getUniqueID`, a biblioteca possui um fallback interno simples e único para a página. O fallback não cria nem sobrescreve `window.getUniqueID`.

## Funcionalidades

- Criação de menus de contexto personalizados por seletor CSS.
- Exclusão de elementos por seletor CSS.
- Adição e remoção dinâmica de itens, inclusive depois de `initiate()`.
- Ações identificadas por `data-action`, mantendo integração simples com eventos delegados do jQuery.
- Propagação opcional de `data-id` do elemento em contexto para o item clicado.
- Fechamento por clique externo, `Escape`, resize, scroll e perda de foco da janela.
- Navegação entre opções com as setas para cima e para baixo quando o menu está aberto.
- Método `destroy()` para remover DOM e listeners registrados pela instância.

## Como usar

### Inclusão da biblioteca

```html
<link rel="stylesheet" href="context-menu.css">
<script src="jquery.min.js"></script>
<script src="context-menu.js"></script>
```

### Inicialização

```javascript
const menu = new ContextMenu(".card", ".closed");
```

- `selector`: seletor CSS dos elementos onde o menu será ativado.
- `exclude`: seletor CSS opcional para elementos que não devem ativar o menu.

### Adicionar itens

```javascript
menu.addItem("Visualizar", "view");
menu.addItem("Excluir", "delete", "text-danger");
menu.initiate();
```

O segundo argumento é armazenado em `data-action`. A biblioteca não executa regras de negócio diretamente; o projeto consumidor decide como tratar cada ação:

```javascript
$(document).on("click", "[data-action='view']", function (event) {
    const id = $(event.currentTarget).data("id");
    console.log("Visualizar", id);
});
```

Quando o elemento em contexto possui `data-id` — nele próprio ou em um descendente — o valor é copiado para o botão do menu.

### Adicionar e remover itens dinamicamente

Depois de `initiate()`, `addItem()` e `removeItem()` atualizam o menu já renderizado:

```javascript
menu.addItem("Compartilhar", "share");
menu.removeItem("delete");
```

### Propriedades

```javascript
menu.name;       // ID único do menu
menu.selector;   // seletor atual
menu.exclude;    // seletor de exclusão atual
menu.items;      // cópia da lista de itens
```

O seletor de exclusão pode ser limpo:

```javascript
menu.exclude = "";
```

### Destruir uma instância

Use `destroy()` quando a tela ou componente não precisar mais do menu:

```javascript
menu.destroy();
```

Isso remove o menu do DOM e os eventos registrados pela instância. A mesma instância pode ser iniciada novamente chamando `initiate()`.

## Observações

- O menu usa `position: fixed`, então o posicionamento é calculado em relação ao viewport e permanece correto em páginas com scroll.
- O código não depende de `taphold` ou jQuery Mobile. Em dispositivos que disparam o evento nativo `contextmenu`, ele será tratado normalmente.
- `getUniqueID` continua sendo respeitado quando já existe no sistema; o fallback interno serve apenas para tornar a biblioteca segura quando essa função não estiver disponível.

## Exemplo

Veja `example/index.html`.

## Licença

MIT.
