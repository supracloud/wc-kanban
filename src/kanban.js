import style from './style.css';

export class FrmdbKanbanList extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['name', 'list_id'];
    }

    get name() {
        return this.getAttribute('name');
    }

    set name(val) {
        this.setAttribute('name', val);
    }
}

export class FrmdbKanbanListItem extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['name'];
    }

    get name() {
        return this.getAttribute('name');
    }

    set name(val) {
        this.setAttribute('name', val);
    }
}



export class FrmdbKanban extends HTMLElement {
    constructor() {
        super();

        const template = document.createElement('template');
        template.innerHTML = `<style>${style}</style><div id = "board"></div><span id="total-cards"></span>`;

        this._sR = this.attachShadow({ mode: 'open' });
        this._sR.appendChild(template.content.cloneNode(true));

        this.UI = {
            elBoard: this._sR.querySelector('#board'),
            elTotalCardCount: this._sR.querySelector('#total-cards'),
            elCardPlaceholder: null,
        }

        this.lists = [];
        this.draggingEvent = null;

        this.populateBoard();
    }

    connectedCallback() {
        new MutationObserver(mutations => {
            if (mutations.some(m => {
                let kanbanChanged = false;
                m.addedNodes.forEach(n => {
                    if (!kanbanChanged && n.nodeName.toLowerCase().startsWith('frmdb-kanban')) {
                        kanbanChanged = true;
                    }
                });
                m.removedNodes.forEach(n => {
                    if (!kanbanChanged && n.nodeName.toLowerCase().startsWith('frmdb-kanban')) {
                        kanbanChanged = true;
                    }
                });
                return kanbanChanged;
            })) {
                this.populateBoard();
            }
        }).observe(this, { childList: true, subtree: true });
    }

    populateBoard() {
        this.clearBoard();
        this.querySelectorAll('frmdb-kanban-list').forEach(el => {
            let listIndex = this.addList(el.name);
            el.querySelectorAll('frmdb-kanban-list-item').forEach(li => {
                this.addTodo(li.name, listIndex, 0, true);
            });
        });
    }

    clearBoard() {
        this._sR.querySelectorAll('.list').forEach(e => e.remove());
        this.lists=[];
    }

    onBoardChanged(event) {
        this.dispatchEvent(new CustomEvent('frmdbKanbanBoardChanged', { detail: event }));
    }

    addTodo(text, listindex, index) {
        if (!text) return false;
        let list = this.lists[listindex];
        if (!text || text === '') return false;
        let cardEl = document.createElement("div");

        cardEl.draggable = true;
        cardEl.className = 'card';
        cardEl.innerHTML = text.trim();
        let card = {
            text: text,
            dom: cardEl,
            index: index || list.cards.length // Relative to list
        };
        list.cards.push(card);

        if (index) {
            list.dom.insertBefore(cardEl, list.children[index]);
        } else {
            list.dom.appendChild(cardEl);
        }
        cardEl.addEventListener('dragstart', e => {
            this.isDragging = true;
            this.draggingEvent = { source: { list: listindex, card: card.index } };
            e.dataTransfer.dropEffect = "copy";
            e.target.classList.add('dragging');
        });
        cardEl.addEventListener('dragover', e => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
            this.draggingEvent.target = { list: listindex, before: card.index };
            e.target.parentNode.insertBefore(this.getCardPlaceholder(), e.target);
        });
    }

    addList(name) {
        name = name.trim();
        if (!name || name === '') return false;
        var listEl = document.createElement("div");
        var heading = document.createElement("h3");

        listEl.dataset.id = this.lists.length;
        listEl.className = "list";
        listEl.appendChild(heading);

        heading.className = "listname";
        heading.innerHTML = name;

        this.lists.push({
            name: name,
            cards: [],
            dom: listEl
        });

        this.UI.elBoard.append(listEl);

        listEl.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            this.draggingEvent.target = { list: this.lists.length - 1 };
            listEl.appendChild(this.getCardPlaceholder());
        });

        return this.lists.length - 1;
    }

    getCardPlaceholder() {
        if (!this.UI.elCardPlaceholder) { // Create if not exists
            this.UI.elCardPlaceholder = document.createElement('div');
            this.UI.elCardPlaceholder.className = "card-placeholder";
            this.UI.elCardPlaceholder.addEventListener('dragover', e => {
                e.preventDefault();
                e.stopPropagation();
            });
            this.UI.elCardPlaceholder.addEventListener('drop', e => {
                e.preventDefault();
                if (!this.isDragging) return false;
                this.onBoardChanged({
                    ...this.draggingEvent,
                    type: 'moved'
                })
                e.target.remove();
                this._sR.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
                this.isDragging = false;
            });
        }
        return this.UI.elCardPlaceholder;
    }
}