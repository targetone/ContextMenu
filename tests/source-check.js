const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const source = fs.readFileSync(require("path").join(__dirname, "..", "context-menu.js"), "utf8");

assert(!source.includes("window.onkeyup"), "must not overwrite window.onkeyup");
assert(!source.includes("window.onresize"), "must not overwrite window.onresize");
assert(!source.includes("taphold"), "must not depend on non-core jQuery taphold");
assert(!source.includes("<span></p>"), "must not create invalid HTML");
assert(source.includes("destroy()"), "must expose destroy lifecycle method");
assert(source.includes("global.getUniqueID"), "must prefer existing global getUniqueID");
assert(source.includes("fallbackIdCounter"), "must include internal ID fallback");
assert(source.includes('.data("id", dataId)'), "must keep jQuery data cache synchronized with data-id");

function makeContext(getUniqueID, withJQuery = true) {
    const document = {
        getElementById: () => null
    };

    function jquery() {
        return {
            off() { return this; },
            on() { return this; }
        };
    }

    const window = {
        innerWidth: 1024,
        innerHeight: 768
    };

    if (withJQuery) {
        window.jQuery = jquery;
    }

    if (getUniqueID) {
        window.getUniqueID = getUniqueID;
    }

    const context = { window, document, console, Date };
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
}

{
    let called = 0;
    const context = makeContext((prefix) => {
        called += 1;
        return prefix + "-external";
    });
    const menu = new context.window.ContextMenu(".card");
    assert.strictEqual(menu.name, "context-menu-external");
    assert.strictEqual(called, 1);
}

{
    const context = makeContext();
    const menu = new context.window.ContextMenu(".card", ".closed");
    assert(menu.name.startsWith("context-menu-"));
    assert.strictEqual(menu.selector, ".card");
    assert.strictEqual(menu.exclude, ".closed");

    menu.addItem("View", "view").addItem("Delete", "delete", "danger");
    assert.deepStrictEqual(JSON.parse(JSON.stringify(menu.items)), [
        { name: "View", action: "view", class: "" },
        { name: "Delete", action: "delete", class: "danger" }
    ]);

    assert.throws(() => menu.addItem("View again", "view"), /already one/);
    menu.removeItem("view");
    assert.deepStrictEqual(JSON.parse(JSON.stringify(menu.items)), [
        { name: "Delete", action: "delete", class: "danger" }
    ]);

    menu.exclude = "";
    assert.strictEqual(menu.exclude, "");
}

{
    assert.throws(() => makeContext(null, false), /requires jQuery/);
}

{
    const context = makeContext();
    const first = new context.window.ContextMenu(".first");
    const second = new context.window.ContextMenu(".second");
    assert.notStrictEqual(first.name, second.name);
    assert.throws(() => new context.window.ContextMenu(""), /non-empty CSS selector/);
    first.selector = "";
    assert.strictEqual(first.selector, ".first");
    assert.strictEqual(first.destroy(), first);
}

console.log("ContextMenu source checks passed.");
