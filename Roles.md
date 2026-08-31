# Asignar o quitar administrador

Reemplaza `UUID_DEL_USUARIO` por el UUID real de la cuenta, visible en **Supabase > Authentication > Users**.

## Asignar administrador

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_DEL_USUARIO';
```

## Quitar administrador

```sql
update public.profiles
set role = 'user'
where id = 'UUID_DEL_USUARIO';
```