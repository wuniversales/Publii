const { remote, shell } = require('electron');
const { Menu, MenuItem } = remote;

module.exports = class ContextMenuBuilder {
    constructor () {
        this.menu = null;
        this.translations = {
            cut: 'Cut',
            copy: 'Copy',
            paste: 'Paste',
            search: 'Search with Google'
        };
    }

    async showPopupMenu(context) {
        if (!context.misspelledWord || context.misspelledWord.length === 0) {
            return;
        }

        let menu = await this.buildMenuForElement(context);
        
        if (!menu) {
            return;
        }

        menu.popup({});
    }

    async buildMenuForElement(info) {
        if (info.isEditable || (info.inputFieldType && info.inputFieldType !== 'none')) {
        return await this.buildMenuForTextInput(info);
        }
    }

    async buildMenuForTextInput(menuInfo) {
        let menu = new Menu();

        await this.addSpellingItems(menu, menuInfo);
        this.addSearchItems(menu, menuInfo);
        this.addCut(menu, menuInfo);
        this.addCopy(menu, menuInfo);
        this.addPaste(menu, menuInfo);

        return menu;
    }

    async addSpellingItems(menu, menuInfo) {
        let target = remote.getCurrentWebContents();
        
        if (!menuInfo.misspelledWord || menuInfo.misspelledWord.length === 0) {
        return menu;
        }

        let corrections = menuInfo.dictionarySuggestions;

        if (corrections && corrections.length) {
        corrections.forEach((correction) => {
            let item = new MenuItem({
            label: correction,
            click: () => target.replaceMisspelling(correction)
            });

            menu.append(item);
        });

        this.addSeparator(menu);
        }

        return menu;
    }

    addSearchItems(menu, menuInfo) {
        if (!menuInfo.selectionText || menuInfo.selectionText.length < 1) {
        return menu;
        }

        let search = new MenuItem({
        label: this.translations.search,
        click: () => {
            let url = `https://www.google.com/#q=${encodeURIComponent(menuInfo.selectionText)}`;
            shell.openExternal(url);
        }
        });

        menu.append(search);
        this.addSeparator(menu);

        return menu;
    }

    addCut(menu, menuInfo) {
        let target = remote.getCurrentWebContents();
        
        menu.append(new MenuItem({
        label: this.translations.cut,
        accelerator: 'CommandOrControl+X',
        enabled: menuInfo.editFlags.canCut,
        click: () => target.cut()
        }));

        return menu;
    }

    addCopy(menu, menuInfo) {
        let target = remote.getCurrentWebContents();
        
        menu.append(new MenuItem({
        label: this.translations.copy,
        accelerator: 'CommandOrControl+C',
        enabled: menuInfo.editFlags.canCopy,
        click: () => target.copy()
        }));

        return menu;
    }

    addPaste(menu, menuInfo) {
        let target = remote.getCurrentWebContents();
        
        menu.append(new MenuItem({
        label: this.translations.paste,
        accelerator: 'CommandOrControl+V',
        enabled: menuInfo.editFlags.canPaste,
        click: () => target.paste()
        }));

        return menu;
    }

    addSeparator(menu) {
        menu.append(new MenuItem({type: 'separator'}));
        return menu;
    }
}
