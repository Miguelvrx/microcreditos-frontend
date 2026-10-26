# Frontend - Sistema de Gestión de Microcréditos

Interfaz web del sistema de gestión de microcréditos, hecha con React,
TypeScript y Vite.

> **Proyecto privado y propietario.** Todos los derechos reservados.
> Prohibido copiar, distribuir o usar este código sin autorización escrita
> del titular. Ver [LICENSE](LICENSE).

## Tecnologías

- React + TypeScript (Vite)
- React Router
- Axios
- React Hook Form + Zod
- Tailwind CSS

## Requisitos

- Node.js 22
- El backend en ejecución en `http://localhost:8080`
  (repositorio `microcreditos-backend`)

## Ejecutar

```powershell
npm install
npm run dev
```

La interfaz queda en http://localhost:5173.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción en `dist/` |
| `npm run lint` | Revisa el código con ESLint |

## Funcionalidades

- Inicio de sesión con JWT y control de acceso por rol
- Gestión de clientes con búsqueda y paginación
- Créditos, aprobación, tabla de amortización y abonos
- Dashboard de cartera, mora, PAR y aging
- Reportes de cartera y de pagos en PDF y Excel
- Recibos de pago en formato ticket
- Gestión de usuarios y auditoría (solo ADMIN)

## Seguridad

- No subir secretos ni archivos `.env` al repositorio.
- El token de sesión se guarda en el navegador y se envía en cada petición.

## Licencia

Software propietario. Todos los derechos reservados. Ver [LICENSE](LICENSE).