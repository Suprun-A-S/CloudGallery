// src/pages/Work.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Stack,
    Card,
    CardMedia,
    CardActionArea,
    CardActions,
    Checkbox,
    Divider,
    Tooltip,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputLabel,
    Select,
    FormControl,
    MenuItem as SelectItem,
    Breadcrumbs,
    Link,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import LogoutIcon from '@mui/icons-material/Logout';
import FolderIcon from '@mui/icons-material/Folder';
import ListIcon from '@mui/icons-material/ViewList';
import GridOnIcon from '@mui/icons-material/GridOn';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { Folder, Image } from '../types';

const fetchFolders = async () => (await api.get<Folder[]>('/folders')).data;
const fetchImages = async (folderId: string | null, search: string) => {
    const q = search.trim();
    if (q || folderId === 'ALL') {
        return (await api.get<Image[]>('/images/all')).data;
    }
    if (folderId) {
        return (await api.get<Image[]>(`/images?folderId=${folderId}`)).data;
    }
    return (await api.get<Image[]>('/images')).data;
};

const useFolders = () => useQuery({ queryKey: ['folders'], queryFn: fetchFolders });
const useImages = (folderId: string | null, search: string) =>
    useQuery({ queryKey: ['images', folderId, search], queryFn: () => fetchImages(folderId, search) });
const useUpload = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ files, folderId }: { files: FileList; folderId: string | null }) => {
            const fd = new FormData();
            Array.from(files).forEach(f => fd.append('file', f));
            if (folderId && folderId !== 'ALL') fd.append('folderId', folderId);
            await api.post('/images', fd);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['images'] }),
    });
};
const useDeleteImages = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => Promise.all(ids.map(id => api.delete(`/images/${id}`))),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['images'] }),
    });
};
const useCreateFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { name: string; parentId: string | null }) => api.post('/folders', payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
    });
};
const useDeleteFolderWithContents = () => {
    const qc = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async folderId => {
            const { data: imgs } = await api.get<Image[]>(`/images?folderId=${folderId}`);
            await Promise.all(imgs.map(i => api.delete(`/images/${i.id}`)));
            await api.delete(`/folders/${folderId}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['folders'] });
            qc.invalidateQueries({ queryKey: ['images'] });
        }
    });
};
const downloadSingle = async (id: string, filename: string) => {
    const resp = await api.get(`/images/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([resp.data]));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
};
const downloadMultiple = async (ids: string[], imagesList: Image[]) => {
    for (const id of ids) {
        const img = imagesList.find(i => i.id === id);
        if (img) await downloadSingle(id, img.original_name);
    }
};

const Work: React.FC = () => {
    const nav = useNavigate();
    useEffect(() => { if (!localStorage.getItem('token')) nav('/signin'); }, [nav]);

    const [mode, setMode] = useState<'files' | 'folders'>('files');
    const [folderAnchor, setFolderAnchor] = useState<null | HTMLElement>(null);
    const [currentFolder, setCurrentFolder] = useState<{ id: string | null; name: string }>({ id: null, name: 'Home' });
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [view, setView] = useState<'grid' | 'list'>(() => {
        return (localStorage.getItem('viewMode') as 'grid' | 'list') || 'grid';
    });
    useEffect(() => { localStorage.setItem('viewMode', view); }, [view]);
    const [subAnchor, setSubAnchor] = useState<null | HTMLElement>(null);

    const { data: folders, error: foldersErr } = useFolders();
    const { data: images, error: imagesErr, isLoading } = useImages(currentFolder.id, search);
    const upload = useUpload();
    const delImgs = useDeleteImages();
    const createFolder = useCreateFolder();
    const deleteFolder = useDeleteFolderWithContents();
    const [openDialog, setOpenDialog] = useState(false);
    const [newName, setNewName] = useState('');
    const [newParent, setNewParent] = useState<string | null>(null);

    const folderMap = useMemo(() => {
        const m: Record<string, Folder> = {};
        folders?.forEach(f => m[f.id] = f);
        return m;
    }, [folders]);
    const buildPath = (f: Folder) => {
        const parts = [f.name]; let cur = f;
        while (cur.parent_id) { const p = folderMap[cur.parent_id]; if (!p) break; parts.unshift(p.name); cur = p; }
        return parts.join(' > ');
    };

    const breadcrumbs = useMemo(() => {
        const list: { id: string | null; name: string }[] = [{ id: null, name: 'Home' }];
        if (mode === 'files' && currentFolder.id && folderMap[currentFolder.id]) {
            let chain: typeof list = [];
            let cur = folderMap[currentFolder.id];
            while (cur) {
                chain.unshift({ id: cur.id, name: cur.name });
                if (!cur.parent_id) break;
                cur = folderMap[cur.parent_id];
            }
            list.push(...chain);
        }
        return list;
    }, [currentFolder, folderMap, mode]);

    const subfolders = useMemo(() => {
        if (!folders) return [];
        return folders.filter(f => f.parent_id === currentFolder.id && f.name !== 'Home');
    }, [folders, currentFolder]);

    const visibleImages = useMemo(() => {
        if (!images) return [];
        const q = search.trim().toLowerCase();
        if (!q) return images;
        return images.filter(img => img.original_name.toLowerCase().includes(q) ||
            Array.isArray(img.tags) && img.tags.some(t => t.toLowerCase().includes(q)));
    }, [images, search]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        upload.mutate({ files: e.target.files, folderId: currentFolder.id });
    };
    const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const handleDelete = () => { delImgs.mutate(Array.from(selected)); setSelected(new Set()); };
    const handlePreview = () => { if (selected.size === 1) { nav(`/image/${[...selected][0]}`); } };
    const submitNewFolder = () => {
        createFolder.mutate({ name: newName, parentId: newParent }, {
            onSuccess() {
                setOpenDialog(false); setMode('folders'); setNewName(''); setNewParent(null);
            }
        });
    };

    return (
        <>
            <AppBar position="static" color="default">
                <Toolbar>
                    <Typography variant="h6" sx={{ cursor: 'pointer' }} onClick={() => {
                        setMode('files');
                        setCurrentFolder({ id: null, name: 'Home' });
                        nav('/work');
                    }}>
                        CloudGallery
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />

                    <Button onClick={() => {
                        setMode('files');
                        setCurrentFolder({ id: 'ALL', name: 'All files' });
                    }}>
                        Усі файли
                    </Button>

                    <Button startIcon={<FolderIcon />} onClick={e => setFolderAnchor(e.currentTarget)}>
                        Папки
                    </Button>
                    <Menu
                        anchorEl={folderAnchor}
                        open={Boolean(folderAnchor)}
                        onClose={() => setFolderAnchor(null)}
                    >
                        <MenuItem onClick={() => {
                            setMode('files');
                            setCurrentFolder({ id: null, name: 'Home' });
                            setFolderAnchor(null);
                        }}>
                            Home
                        </MenuItem>
                        <Divider />
                        {folders?.filter(f => f.name !== 'Home').slice(0, 3).map(f => (
                            <MenuItem key={f.id} onClick={() => {
                                setMode('files');
                                setCurrentFolder(f);
                                setFolderAnchor(null);
                            }}>
                                {f.name}
                            </MenuItem>
                        ))}
                        <Divider />
                        <MenuItem onClick={() => {
                            setMode('folders');
                            setFolderAnchor(null);
                        }}>
                            Інші папки
                        </MenuItem>
                        <MenuItem onClick={() => {
                            setOpenDialog(true);
                            setFolderAnchor(null);
                        }}>
                            Нова папка
                        </MenuItem>
                    </Menu>

                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<LogoutIcon />}
                        onClick={() => {
                            localStorage.removeItem('token');
                            nav('/');
                        }}
                    >
                        Вийти з акаунту
                    </Button>
                </Toolbar>
            </AppBar>

            {mode === 'files' && (
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                        <TextField
                            size="small"
                            placeholder="Пошук зображення…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ minWidth: 220 }}
                        />
                        <Button component="label" variant="contained" startIcon={<UploadIcon />}>
                            Імпортувати
                            <input type="file" hidden multiple onChange={handleUpload} />
                        </Button>
                        <Tooltip title="Grid">
                            <IconButton color={view === 'grid' ? 'primary' : undefined} onClick={() => setView('grid')}>
                                <GridOnIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="List">
                            <IconButton color={view === 'list' ? 'primary' : undefined} onClick={() => setView('list')}>
                                <ListIcon />
                            </IconButton>
                        </Tooltip>
                        <Button onClick={() => setSelected(new Set(images?.map(i => i.id) || []))}>Вибрати все</Button>
                        <Button onClick={() => setSelected(new Set())}>Очистити</Button>
                        <IconButton disabled={selected.size !== 1} onClick={handlePreview}>
                            <EditIcon />
                        </IconButton>
                        <IconButton disabled={!selected.size} onClick={handleDelete}>
                            <DeleteIcon />
                        </IconButton>
                        <Button
                            startIcon={<DownloadIcon />}
                            disabled={!selected.size}
                            onClick={() => downloadMultiple(Array.from(selected), images || [])}
                        >
                            Експортувати
                        </Button>
                    </Stack>
                </Box>
            )}

            <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                {mode === 'files' ? (
                    currentFolder.id === 'ALL' ? (
                        <Typography variant="subtitle1">Усі файли</Typography>
                    ) : (
                        <>
                            <Typography variant="subtitle1" sx={{ mr: 1 }}>Поточна папка:</Typography>
                            <Breadcrumbs separator=">" aria-label="breadcrumb" sx={{ flexWrap: 'wrap' }}>
                                {breadcrumbs.map((b, idx) => idx === breadcrumbs.length - 1 ? (
                                    <Typography key={b.id ?? 'home'} color="text.primary">{b.name}</Typography>
                                ) : (
                                    <Link key={b.id ?? 'home'} color="inherit" underline="hover" component="button" onClick={() => { setMode('files'); setCurrentFolder({ id: b.id, name: b.name }); }}>
                                        {b.name}
                                    </Link>
                                ))}
                            </Breadcrumbs>
                            {subfolders.length > 0 && (
                                <IconButton size="small" onClick={e => setSubAnchor(e.currentTarget)}>
                                    <ExpandMoreIcon />
                                </IconButton>
                            )}
                            <Menu anchorEl={subAnchor} open={Boolean(subAnchor)} onClose={() => setSubAnchor(null)}>
                                {subfolders.map(sf => (
                                    <MenuItem key={sf.id} onClick={() => { setCurrentFolder({ id: sf.id, name: sf.name }); setSubAnchor(null); }}>
                                        {sf.name}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </>
                    )
                ) : (
                    <Typography variant="subtitle1">Перегляд папок</Typography>
                )}
            </Box>

            <Box sx={{ p: 2 }}>
                {foldersErr && <Alert severity="error">Папки: {foldersErr.message}</Alert>}
                {imagesErr && <Alert severity="error">Зображення: {imagesErr.message}</Alert>}
                {upload.error && <Alert severity="error">Імпортування невдале</Alert>}
                {delImgs.error && <Alert severity="error">Видалення невдале</Alert>}
            </Box>

            <Box sx={{ p: 3 }}>
                {mode === 'files' && (
                    <>
                        {isLoading && <CircularProgress />}
                        {!isLoading && (!images || !images.length) && (
                            <Box textAlign="center" mt={10}>
                                <Typography variant="h4" gutterBottom>
                                    Імпортуйте перші зображення
                                </Typography>
                                <Button variant="contained" component="label" startIcon={<UploadIcon />}>
                                    Імпортувати
                                    <input type="file" hidden multiple onChange={handleUpload} />
                                </Button>
                                <Typography variant="body2" mt={2} color="text.secondary">
                                    Після імпортування ви можете перетягадити і редагувати дані зображень.
                                </Typography>
                            </Box>
                        )}
                        {!isLoading && view === 'grid' && (
                            <Box sx={{ mt: -5, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                                {visibleImages.map(img => (
                                    <Card key={img.id} variant="outlined" sx={{ width: { xs: 150, sm: 180, md: 300 } }}>
                                        <CardActionArea
                                            onClick={() => toggleSelect(img.id)}
                                            onDoubleClick={() => nav(`/image/${img.id}`)}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="150"
                                                image={img.url}
                                                alt={img.original_name}
                                            />
                                        </CardActionArea>
                                        <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                                {img.original_name}
                                            </Typography>
                                            <Checkbox
                                                checked={selected.has(img.id)}
                                                onChange={() => toggleSelect(img.id)}
                                                size="small"
                                            />
                                        </CardActions>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        {view === 'list' && (
                            <List dense sx={{ mt: -7 }}>
                                {visibleImages.map(img => (
                                    <ListItem
                                        key={img.id}
                                        divider
                                        onClick={() => toggleSelect(img.id)}
                                        onDoubleClick={() => nav(`/image/${img.id}`)}
                                        secondaryAction={
                                            <Checkbox
                                                edge="end"
                                                size="small"
                                                checked={selected.has(img.id)}
                                                onChange={() => toggleSelect(img.id)}
                                            />
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar variant="rounded" src={img.url} alt={img.original_name} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={img.original_name}
                                            secondary={
                                                <Box>
                                                    {img.description && (
                                                        <Typography variant="body2" gutterBottom>
                                                            {img.description}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="body2">
                                                        Розмір: {img.size_bytes.toLocaleString()} байтів
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Створено: {new Date(img.created_at).toLocaleString()}
                                                    </Typography>
                                                    {Array.isArray(img.tags) && img.tags.length > 0 && (
                                                        <Typography variant="body2">Теги: {img.tags.join(', ')}</Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </>
                )}

                {mode === 'folders' && (
                    <>
                        {(!folders || folders.filter(f => f.name !== 'Home').length === 0) ? (
                            <Box textAlign="center" mt={10}>
                                <Typography variant="h4" gutterBottom>Створіть першу папку</Typography>
                                <Button variant="contained" onClick={() => setOpenDialog(true)}>Створити</Button>
                            </Box>
                        ) : (
                            <List dense sx={{ mt: -7 }}>
                                {folders.filter(f => f.name !== 'Home').map(f => (
                                    <ListItem key={f.id} divider secondaryAction={
                                        <IconButton edge="end" onClick={() => deleteFolder.mutate(f.id)} disabled={deleteFolder.status === 'pending'}>
                                            <DeleteIcon />
                                        </IconButton>
                                    }>
                                        <ListItemAvatar><FolderIcon /></ListItemAvatar>
                                        <ListItemText
                                            primary={f.name}
                                            secondary={buildPath(f)}
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => { setMode('files'); setCurrentFolder({ id: f.id, name: f.name }); }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </>
                )}

                <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                    <DialogTitle>Створення нової папки</DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Назва папки"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Родова папка</InputLabel>
                            <Select
                                value={newParent ?? ''}
                                label="Родова папка"
                                onChange={e => setNewParent(e.target.value || null)}
                            >
                                <SelectItem value="">Home (root)</SelectItem>
                                {folders?.filter(f => f.name !== 'Home').map(f => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {buildPath(f)}
                                    </SelectItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Відмінити</Button>
                        <Button onClick={submitNewFolder} disabled={!newName.trim()}>Створити</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </>
    );
};

export default Work;
