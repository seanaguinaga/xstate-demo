import { actions, send, Machine, MachineConfig, MachineOptions } from "xstate"
import promptMachine from './prompt.machine';
const { assign } = actions

interface IFile {
    id: Number
    title: String
    owner: String
    updatedAt: Date
}

interface IAppStateSchema {
    states: {
        browsing: {};
        selecting: {};
        deleting: {};
        prompting: {};
    };
}

// The events that the machine handles
type IAppEvent =
    | { type: 'SELECT_ITEM', item: IFile }
    | { type: 'SELECT_ALL_ITEMS' }
    | { type: 'DESELECT_ITEM', item: IFile }
    | { type: 'DELETE_SELECTION' }
    | { type: 'SELECTION_DELETED' }
    | { type: 'RESET_SELECTION' }
    | { type: 'DISMISS_PROMPT' };

type IAppEventWithItem = { type: String, item: IFile }
type IAppEventWithMessage = { type: String, item: IFile }

// The context (extended state) of the machine
interface IAppContext {
    items: IFile[]
    selectedItems: IFile[]
}

const initialAppContextItems: IFile[] = [
    {
        id: 0,
        title: 'Summer Photos',
        owner: 'Anthony Stevens',
        updatedAt: new Date(Date.UTC(2017,6,12))
    },
    {
        id: 1,
        title: 'Surfing',
        owner: 'Scott Masterson',
        updatedAt: new Date(Date.UTC(2017,6,16))
    },
    {
        id: 2,
        title: 'Beach Concerts',
        owner: 'Jonathan Lee',
        updatedAt: new Date(Date.UTC(2017,1,16))
    },
    {
        id: 3,
        title: 'Sandcastles',
        owner: 'Aaron Bennett',
        updatedAt: new Date(Date.UTC(2017,5,5))
    },
    {
        id: 4,
        title: 'Boardwalk',
        owner: 'Mary Johnson',
        updatedAt: new Date(Date.UTC(2017,5,1))
    },
    {
        id: 5,
        title: 'Beach Picnics',
        owner: 'Janet Perkins',
        updatedAt: new Date(Date.UTC(2017,4,7))
    }
]

const initialAppContext: IAppContext = {
    items: initialAppContextItems,
    selectedItems: []
}

// Simulated API request
function deleteItems(items: IFile[]) {
    return new Promise((resolve, reject) =>
        setTimeout(() => resolve(`${items.length} items deleted succesfully`), 3000)
        // setTimeout(() => reject(`Error deleting the ${items.length} selected item(s). Please try again later.`), 3000)
    )
};

// App State Machine Config
const appMachineConfig: MachineConfig<IAppContext, IAppStateSchema, IAppEvent> = {
    key: 'app',
    initial: 'deleting',
    context: initialAppContext,
    states: {
        browsing: {
            on: {
                SELECT_ITEM: {
                    target: 'selecting',
                    actions: 'addItemToSelection'
                },
                SELECT_ALL_ITEMS: {
                    target: 'selecting',
                    actions: 'addAllItemsToSelection'
                }
            }
        },
        selecting: {
            on: {
                SELECT_ITEM: {
                    actions: 'addItemToSelection' // implicit transition
                },
                SELECT_ALL_ITEMS: {
                    actions: 'addAllItemsToSelection' // implicit transition
                },
                DESELECT_ITEM: [{
                    target: 'browsing',
                    actions: 'removeItemFromSelection',
                    cond: (ctx: IAppContext) =>( ctx.selectedItems.length === 1) // condition: last item in selection
                }, {
                    actions: 'removeItemFromSelection',
                    cond: (ctx: IAppContext) =>( ctx.selectedItems.length > 1) // condition: still more items selected
                }],
                RESET_SELECTION: {
                    target: 'browsing',
                    actions: 'resetSelection'
                },
                DELETE_SELECTION: {
                    target: 'deleting',
                }
            }
        },
        deleting: {
            invoke:{
                src: (ctx: IAppContext) => deleteItems(ctx.selectedItems),
                onDone: {
                    target: 'browsing',
                    actions: 'deleteSelection'
                },
                onError: {
                    target: 'prompting'
                }
            }
        },
        prompting: {
            invoke: {
                id: 'prompt',
                src: promptMachine,
                data: {
                    message: (ctx: IAppContext, event: IAppEvent) => { console.log(ctx, event) }
                },
                onDone: 'selecting' // The onDone transition will be taken when the promptMachine has reached its top-level final state.
            },
            on: {
                DISMISS_PROMPT: {
                    actions: send('DISMISS_PROMPT', { to: 'prompt' })
                },
                DELETE_SELECTION: {
                    target: 'deleting',
                }
            }
        }
    }
}

// App State Machine Options
const appMachineOptions = {  //: MachineOptions<IAppContext, IAppEvent>
    actions: {
        addItemToSelection: assign((ctx: IAppContext, event: IAppEvent) => ({
            selectedItems: ctx.selectedItems.concat((event as IAppEventWithItem).item)
        })),
        addAllItemsToSelection: assign((ctx: IAppContext) => ({
            selectedItems: ctx.items
        })),
        removeItemFromSelection: assign((ctx: IAppContext, event: IAppEvent) => ({
            selectedItems: ctx.selectedItems.filter((item: IFile) => item.id !== (event as IAppEventWithItem).item.id)
        })),
        resetSelection: assign((_) => ({
            selectedItems: []
        })),
        deleteSelection: assign((ctx: IAppContext) => ({
            items: ctx.items.filter((item: IFile) => ctx.selectedItems.findIndex((selectedItem: IFile) => selectedItem.id === item.id) < 0),
            selectedItems: []
        })),
    }
};

export default Machine(appMachineConfig, appMachineOptions);