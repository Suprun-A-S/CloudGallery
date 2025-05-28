// src/pages/EditImage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
    AppBar,
    Toolbar,
    IconButton,
    Button,
    Box,
    TextField,
    Stack,
    Typography,
    CircularProgress,
    Card,
    CardContent,
    Divider,
    Paper,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

interface Image {
    id: string;
    folder_id?: string; 
    author: string;
    title: string;
    subject: string;
    theme: string;
    description: string;
    original_name: string;
    tags: string[];
    url: string;
    mime_type: string;
    size_bytes: number;
    created_at: string;
    updated_at: string;
}

async function fetchImage(id: string): Promise<Image> {
    const { data } = await api.get(`/images/${id}`);
    return data;
}

const EditImage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        author: '',
        title: '',
        subject: '',
        theme: '',
        description: '',
        tags: '',
    });

    const { data: img, isLoading, isError, error } = useQuery<Image, Error, Image, [string, string]>({
        queryKey: ['image', id!],
        queryFn: async () => {
            const data = await fetchImage(id!);
            setForm({
                author: data.author,
                title: data.title,
                subject: data.subject,
                theme: data.theme,
                description: data.description,
                tags: (data.tags || []).join(', '),
            });
            return data;
        },
        retry: false,
    });

    const exportMutation = useMutation({
        mutationFn: () =>
            api
                .get(`/images/${id}/download`, { responseType: 'blob' })
                .then((resp) => {
                    const url = URL.createObjectURL(new Blob([resp.data]));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = img!.original_name;
                    a.click();
                    URL.revokeObjectURL(url);
                }),
    });

    const rotateLeftMutation = useMutation({
        mutationFn: () =>
            api
                .post(`/images/${id}/rotate`, null, { params: { direction: 'right' } })
                .then((r) => r.data)
                .then((updated) => {
                    queryClient.setQueryData(['image', id], updated);
                }),
    });

    const rotateRightMutation = useMutation({
        mutationFn: () =>
            api
                .post(`/images/${id}/rotate`, null, { params: { direction: 'left' } })
                .then((r) => r.data)
                .then((updated) => {
                    queryClient.setQueryData(['image', id], updated);
                }),
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/images/${id}`),
        onSuccess: () => navigate(`/work?folderId=${img?.folder_id ?? 'ALL'}`),
    });

    const saveMutation = useMutation({
        mutationFn: () =>
            api.patch<Image>(`/images/${id}`, {
                author: form.author,
                title: form.title,
                subject: form.subject,
                theme: form.theme,
                description: form.description,
                tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
            }).then((r) => r.data),
        onSuccess: (updated) => {
            queryClient.setQueryData(['image', id], updated);
        },
    });

    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    if (isError) return (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
            <Typography color="error">Error: {error!.message}</Typography>
        </Box>
    );

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="h6">Редагувати зображення</Typography>
                    <Box>
                        <IconButton onClick={() => exportMutation.mutate()}><DownloadIcon /></IconButton>
                        <IconButton onClick={() => rotateLeftMutation.mutate()}><RotateLeftIcon /></IconButton>
                        <IconButton onClick={() => rotateRightMutation.mutate()}><RotateRightIcon /></IconButton>
                        <IconButton onClick={() => deleteMutation.mutate()}><DeleteIcon /></IconButton>
                        <Button disabled={false} onClick={() => saveMutation.mutate()} startIcon={<SaveIcon />} variant="contained" sx={{ ml: 2 }}>
                            Зберігти
                        </Button>
                        <IconButton onClick={() => navigate(`/work?folderId=${img?.folder_id ?? 'ALL'}`)} sx={{ ml: 1 }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box sx={{ flex: 1, display: 'flex' }}>

                <Box sx={{ flex: '0 0 70%', p: 1, height: '100%', overflowY: 'auto' }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3, borderRadius: 2 }}>
                        <Box component="img" src={img!.url} alt={img!.original_name} sx={{ width: '100%', maxHeight: 450, objectFit: 'contain', borderRadius: '8px 8px 0 0' }} />
                        <CardContent sx={{ flex: '0 0 auto' }}>
                            <Typography variant="subtitle1" gutterBottom>Дані файлу</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={1}>
                                {[
                                    ['Назва', img!.original_name.replace(/\.[^/.]+$/, '')],
                                    ['Тип', img!.mime_type],
                                    ['Розмір', `${img!.size_bytes.toLocaleString()} байтів`],
                                    ['Створено', new Date(img!.created_at).toLocaleString()],
                                    ['Оновлено', new Date(img!.updated_at).toLocaleString()],
                                ].map(([label, value]) => (
                                    <Paper key={label} variant="outlined" sx={{ mb: 1, p: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="textSecondary">{label}:</Typography>
                                            <Typography>{value}</Typography>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: '0 0 30%', p: 1, height: '100%', overflowY: 'auto' }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3, borderRadius: 2 }}>
                        <CardContent sx={{ flex: '1 1 auto' }}>
                            <Typography variant="h6" gutterBottom>Редагування даних</Typography>
                            <Divider sx={{ mb: 2.5 }} />
                            <Stack spacing={2.5}>
                                <TextField label="Автор" variant="outlined" fullWidth value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
                                <TextField label="Назва" variant="outlined" fullWidth value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                <TextField label="Предмет" variant="outlined" fullWidth value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                                <TextField label="Тема" variant="outlined" fullWidth value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} />
                                <TextField label="Опис" variant="outlined" multiline rows={6} fullWidth value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                <TextField label="Теги (через кому)" variant="outlined" multiline rows={6} fullWidth value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};

export default EditImage;
