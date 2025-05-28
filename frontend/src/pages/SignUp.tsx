// src/pages/SignUp.tsx
import React, { useState } from 'react';
import {
    AppBar,
    Container,
    Box,
    Toolbar,
    TextField,
    Button,
    Typography,
    Alert,
    Card,
    CardHeader,
    CardContent,
    Stack,
    InputAdornment,
    IconButton,
    Link as MuiLink
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import api from '../api/client';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const validationSchema = Yup.object({
        email: Yup.string()
            .max(128, 'Email повинен бути не більше 128 символів')
            .email('Невірний формат email')
            .required('Email об\'язковий'),
        password: Yup.string()
            .min(4, 'Пароль повинен бути не менше 4 символів')
            .max(64, 'Пароль повинен бути не більше 64 символів')
            .matches(/^\S*$/, 'Пароль не повинен містити пробілів')
            .matches(
                /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
                'Пароль повинен містити латинські літери, цифри та спецсимволи'
            )
            .matches(/[A-Z]/, 'Пароль повинен містити хоча б одну велику літеру')
            .matches(/[0-9]/, 'Пароль повинен містити хоча б одну цифру')
            .required('Пароль об\'язковий'),
        passwordConfirm: Yup.string()
            .oneOf([Yup.ref('password')], 'Паролі не співпадають')
            .required('Підтвердження пароля об\'язкове'),
    });

    const handleClickShowPassword = () => setShowPassword(v => !v);
    const handleClickShowConfirm = () => setShowConfirm(v => !v);

    return (
        <>
            <AppBar position="static" color="primary" elevation={1}>
                <Toolbar>
                    <Typography
                        variant="h6"
                        sx={{ cursor: 'pointer', flexGrow: 1 }}
                        onClick={() => navigate('/')}
                    >
                        CloudGallery
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container maxWidth="sm">
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="80vh"
                >
                    <Card sx={{ width: '100%', boxShadow: 3, borderRadius: 2 }}>
                        <CardHeader
                            title={<Typography variant="h5">Реєстрація в CloudGallery</Typography>}
                            sx={{ textAlign: 'center', bgcolor: 'background.paper' }}
                        />
                        <CardContent>
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            <Formik
                                initialValues={{ email: '', password: '', passwordConfirm: '' }}
                                validationSchema={validationSchema}
                                onSubmit={async (values, { setSubmitting }) => {
                                    setError(null);
                                    try {
                                        const payload = {
                                            email: values.email,
                                            password: values.password,
                                            passwordConfirm: values.passwordConfirm,
                                        };
                                        const { data } = await api.post('/auth/register', payload);
                                        localStorage.setItem('token', data.token);
                                        navigate('/work');
                                    } catch (err: any) {
                                        setError(err.response?.data?.error || 'Невідома помилка');
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                            >
                                {({ values, errors, touched, handleChange, handleBlur, isValid, dirty, isSubmitting }) => (
                                    <Form>
                                        <Stack spacing={2}>
                                            <TextField
                                                fullWidth
                                                id="email"
                                                name="email"
                                                label="Email"
                                                value={values.email}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                error={touched.email && Boolean(errors.email)}
                                                helperText={touched.email && errors.email}
                                            />
                                            <TextField
                                                fullWidth
                                                id="password"
                                                name="password"
                                                label="Пароль"
                                                type={showPassword ? 'text' : 'password'}
                                                value={values.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                error={touched.password && Boolean(errors.password)}
                                                helperText={touched.password && errors.password}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={handleClickShowPassword} edge="end">
                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                            <TextField
                                                fullWidth
                                                id="passwordConfirm"
                                                name="passwordConfirm"
                                                label="Підтвердіть пароль"
                                                type={showConfirm ? 'text' : 'password'}
                                                value={values.passwordConfirm}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                error={touched.passwordConfirm && Boolean(errors.passwordConfirm)}
                                                helperText={touched.passwordConfirm && errors.passwordConfirm}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={handleClickShowConfirm} edge="end">
                                                                {showConfirm ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Stack>
                                        <Box textAlign="right" mt={2}>
                                            <Typography variant="body2">
                                                Вже є аккаунт?{' '}
                                                <MuiLink component={RouterLink} to="/signin">
                                                    Увійти
                                                </MuiLink>
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" mt={3}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                disabled={!isValid || !dirty || isSubmitting}
                                            >
                                                Продовжити
                                            </Button>
                                            <Button variant="outlined" color="inherit" onClick={() => navigate('/')}>Назад</Button>
                                        </Box>
                                    </Form>
                                )}
                            </Formik>
                        </CardContent>
                    </Card>
                </Box>
            </Container>
        </>
    );
};

export default SignUp;
