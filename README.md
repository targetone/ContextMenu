# ContextMenu.js

ContextMenu.js é uma API JavaScript simples e leve para customizar o seu próprio Context Menu.

## Funcionalidades

- Criação de menus de contexto personalizados.
- Adição e remoção dinâmica de itens do menu.
- Suporte para eventos de clique em itens do menu.
- Personalização de estilos CSS.

## Como Usar

### Inclusão da Biblioteca

Primeiro, inclua a biblioteca ContextMenu.js no seu projeto.

```
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo ContextMenu.js</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Seu conteúdo aqui -->
    <script src="ContextMenu.js"></script>
</body>
</html>
```

### Inicialização

Para iniciar um novo menu de contexto, você precisa criar uma instância da classe `ContextMenu`:

```
const menu = new ContextMenu(selector, exclude);
```

- `selector`: Seletor CSS dos elementos onde o menu de contexto será ativado.
- `exclude`: (Opcional) Seletor CSS dos elementos que serão excluídos do menu de contexto.

### Adicionar Itens

Para adicionar itens ao menu de contexto, use o método `addItem`:

```
menu.addItem('Nome do Item', 'acaoDoItem', 'classeOpcional');
```

- `Nome do Item`: O nome que será exibido no menu.
- `acaoDoItem`: A ação que será associada ao item.
- `classeOpcional`: (Opcional) Classe CSS adicional para estilizar o item.

### Remover Itens

Para remover itens do menu de contexto, use o método `removeItem`:

```
menu.removeItem('acaoDoItem');
```

- `acaoDoItem`: A ação do item que você deseja remover.

### Métodos

#### `initiate()`

Este método deve ser chamado para construir e ativar o menu de contexto:

```
menu.initiate();
```

#### `get items()`

Retorna uma lista de objetos representando os itens do menu:

```
const items = menu.items;
```

#### `get name()`

Retorna o nome único do menu:

```
const name = menu.name;
```

#### `get selector()`

Retorna o seletor CSS atual:

```
const selector = menu.selector;
```

#### `set selector(selector)`

Define um novo seletor CSS:

```
menu.selector = 'novoSeletor';
```

#### `get exclude()`

Retorna o seletor CSS de exclusão atual:

```
const exclude = menu.exclude;
```

#### `set exclude(exclude)`

Define um novo seletor CSS de exclusão:

```
menu.exclude = 'novoExcluido';
```

## Licença

Este projeto está licenciado sob a licença MIT.
