import React from 'react';
import { useMachine } from '@xstate/react';
import {
    AppBar,
    Button,
    Checkbox,
    createStyles,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Theme,
    Toolbar,
    Tooltip,
    Typography,
    withStyles,
    WithStyles,
} from '@material-ui/core';
import { 
    Close,
    Delete,
    FolderShared,
    Menu,
    Search,
} from '@material-ui/icons';
import deepPurple from '@material-ui/core/colors/deepPurple';
import appStateMachine from './app.machine'

interface IFile {
    id: Number
    title: String
    owner: String
    updatedAt: Date
}

interface ISelecteableFile extends IFile{
    selected: Boolean
}

const styles = (theme: Theme) => createStyles({
    root: {
        flexGrow: 1,
    },
    bar: {
        backgroundColor: theme.palette.common.black,
    },
    selecting: {
        backgroundColor: deepPurple[500],
    },
    list: {
        width: '100%',
        backgroundColor: theme.palette.background.paper,
    },
    menuButton: {
        marginLeft: -18,
        marginRight: 10,
    },
    spacer: {
        flex: '1 1 100%',
    },
    actions: {
        // color: theme.palette.text.secondary,
    },
    title: {
        flex: '0 0 auto',
    },
});
interface IAppProps extends WithStyles<typeof styles> {}

const App = (props: IAppProps) => {
    const { classes } = props;
    const [current , send] = useMachine(appStateMachine, { devTools: true });
    
    const itemList: ISelecteableFile[] = current.context.items.map((item: IFile) => ({
        ...item,
        selected: current.context.selectedItems.findIndex((selectedItem: IFile) => selectedItem.id === item.id) >= 0
    }));
    
    const allItemsSelected: boolean = current.context.selectedItems.length === current.context.items.length;

    const toggleSelectItem = (item: ISelecteableFile) => item.selected ? send({ type: "DESELECT_ITEM", item }) : send({ type: "SELECT_ITEM", item });
    const toggleSelectAll = () => allItemsSelected ? send({ type: "RESET_SELECTION" }) : send({ type: "SELECT_ALL_ITEMS" });
    const resetSelection = () => send({ type: "RESET_SELECTION" });
    const deleteSelection = () => send({ type: "DELETE_SELECTION" });
    const dismissPrompt = () => send({ type: "DISMISS_PROMPT" });

    return (
        <div className={classes.root}>
            <AppBar 
                position="static" 
                className={current.matches('selecting') ? classes.selecting : classes.bar}
            >
                <Toolbar>
                    {
                        current.matches('selecting') ?
                        (<IconButton
                            onClick={resetSelection}
                            className={classes.menuButton}
                            color="inherit"
                            aria-label="Reset Selection">
                            <Close />
                        </IconButton>)
                        :
                        (<IconButton 
                            className={classes.menuButton} 
                            color="inherit" 
                            aria-label="Menu">
                            <Menu />
                        </IconButton>)
                    }
                    <div className={classes.title}>
                        {
                            current.context.selectedItems.length > 0 ? 
                            (<Typography color="inherit" variant="subtitle1">
                                {current.context.selectedItems.length} selected
                            </Typography>)
                            :
                            (<Typography variant="h6" id="tableTitle">
                                My files
                            </Typography>)
                        }
                    </div>
                    <div className={classes.spacer} />
                    <div className={classes.actions}>
                        {
                            current.context.selectedItems.length > 0 ? 
                            (<Tooltip title="Delete">
                                <IconButton color="inherit" aria-label="Delete" onClick={deleteSelection}>
                                    <Delete />
                                </IconButton>
                            </Tooltip>)
                            :
                            (<Tooltip title="Search">
                                <IconButton color="inherit" aria-label="Search">
                                    <Search />
                                </IconButton>
                            </Tooltip>)
                        }
                    </div>
                </Toolbar>
            </AppBar>
            <Table aria-labelledby="tableTitle">
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox 
                                checked={allItemsSelected} 
                                onChange={toggleSelectAll}
                            />
                        </TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Owner</TableCell>
                        <TableCell>Last Modified</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {itemList.map((item: ISelecteableFile) => (
                        <TableRow
                            hover
                            onClick={() => toggleSelectItem(item)}
                            role="checkbox"
                            tabIndex={-1}
                            key={item.id as number}
                            selected={item.selected as boolean}
                        >
                            <TableCell padding="checkbox">
                                {
                                    current.matches('browsing') ? 
                                    (<IconButton><FolderShared /></IconButton>)
                                    :
                                    (<Checkbox checked={item.selected as boolean}/>)
                                }
                            </TableCell>
                            <TableCell component="th" scope="row">{item.title}</TableCell>
                            <TableCell>{item.owner}</TableCell>
                            <TableCell>{item.updatedAt.toDateString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Dialog
                open={current.matches('prompting')}
                keepMounted
                onClose={dismissPrompt}
                aria-labelledby="alert-dialog-slide-title"
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle id="alert-dialog-slide-title">Error deleting selection</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        An error occured and we were not able to delete your selection.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={dismissPrompt} color="primary">
                        Ok
                    </Button>
                    <Button onClick={deleteSelection} color="primary">
                        Retry
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
};

export default withStyles(styles)(App);