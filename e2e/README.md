# Pruebas E2E

Manejan el navegador real contra la app (`localhost:3000`), así que cada clic
dispara la petición real a la API. Cada prueba valida **dos cosas a la vez**:

1. El flujo de la interfaz (que el formulario abra, valide y guarde).
2. El contrato de la API (request y response de la llamada que ese flujo dispara).

## Antes de correrlas

1. Copia el archivo de credenciales y llénalo:

   ```
   cp e2e/.env.e2e.example e2e/.env.e2e
   ```

   `e2e/.env.e2e` está en `.gitignore`: no se sube al repo.

2. Deja corriendo la app:

   ```
   npm run dev
   ```

## Cómo correrlas

```bash
npx playwright test                  # todo
npx playwright test --headed         # viendo el navegador
npx playwright test e2e/specs/bovinos.spec.ts
npx playwright show-report           # reporte HTML del último run
```

## Reglas de los datos de prueba

Las pruebas **escriben en la base de producción**, acotadas a la empresa de
pruebas (`E2E_COMPANY_CODE`). Para que se distingan y se puedan limpiar:

- Todo registro que crean lleva el prefijo `E2E-` y una marca de tiempo.
- Cada prueba borra lo que creó cuando la API lo permite.

### Operaciones irreversibles

Hay tres cosas que **no** se pueden deshacer por API y están desactivadas por
omisión. Se habilitan con `E2E_ALLOW_IRREVERSIBLE=1`:

| Operación | Por qué |
|---|---|
| Realizar una venta de ganado | No existe endpoint para cancelarla y marca al bovino como vendido |
| Registrar una defunción | `PATCH /bovine/{id}/kill` no tiene reverso |
| Editar parámetros generales | Son globales, **no** por empresa: afectan a toda la operación real mientras dura la prueba |

El reporte *Consolidado agroindustrias* suma todas las empresas, así que las
operaciones contables de prueba también aparecen ahí.
