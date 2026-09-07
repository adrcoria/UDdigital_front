# Historias de Usuario — UDdigital Frontend

> Proyecto: Sistema de gestión ganadera y administrativa (SPA Vue 3 + TypeScript + Vuetify 3)
> Estado: En desarrollo activo | Última revisión: 2026-06-05

---

## MÓDULO 1 — AUTENTICACIÓN Y CUENTA

### HU-001 · Inicio de sesión
**Como** usuario registrado,  
**quiero** ingresar con mis credenciales (correo y contraseña),  
**para** acceder al sistema de forma segura.  
**Componentes:** `SignIn.vue`, `auth/signIn/Form.vue`, `accountService.ts`

### HU-002 · Restablecer contraseña
**Como** usuario que olvidó su contraseña,  
**quiero** solicitar un enlace de restablecimiento vía correo electrónico,  
**para** recuperar el acceso a mi cuenta.  
**Componentes:** `ResetPassword.vue`, `auth/resetPassword/Form.vue`

### HU-003 · Cambiar contraseña
**Como** usuario autenticado,  
**quiero** cambiar mi contraseña desde mi perfil,  
**para** mantener la seguridad de mi cuenta.  
**Componentes:** `ChangePassword.vue`

### HU-004 · Cerrar sesión
**Como** usuario autenticado,  
**quiero** cerrar sesión de forma segura,  
**para** proteger mi información al terminar de usar el sistema.  
**Componentes:** `auth/logout/Form.vue`, router guard en `index.ts`

---

## MÓDULO 2 — CONFIGURACIÓN DEL SISTEMA

### HU-005 · Gestión de usuarios del sistema
**Como** administrador,  
**quiero** crear, editar y eliminar usuarios del sistema,  
**para** controlar quién tiene acceso y con qué permisos.  
**Componentes:** `UsuariosModule/usuarios/`, `CreateEditUserDialog.vue`, `DeleteDialog.vue`, `usuariosService.ts`

### HU-006 · Gestión de empresas
**Como** administrador,  
**quiero** registrar y administrar las empresas del sistema,  
**para** organizar la información por unidad de negocio.  
**Componentes:** `EmpresasModule/empresas/`, `CreateEditCompanyDialog.vue`, `companyService.ts`

### HU-007 · Gestión de rancheros
**Como** administrador,  
**quiero** registrar y administrar los rancheros vinculados al sistema,  
**para** tener un directorio actualizado de propietarios o encargados de ranchos.  
**Componentes:** `RancherosModule/rancheros/`, `CreateEditRancherDialog.vue`, `ranchersService.ts`

### HU-008 · Cambio de rancho activo
**Como** usuario con acceso a múltiples ranchos,  
**quiero** cambiar el rancho activo desde la barra superior,  
**para** operar en el contexto del rancho correcto sin cerrar sesión.  
**Componentes:** `layouts/topBar/SwitchRanchDialog.vue`

---

## MÓDULO 3 — GANADERÍA / BOVINOS

### HU-009 · Catálogos de ganadería
**Como** encargado de ganadería,  
**quiero** administrar los catálogos base (razas, tipos, propietarios),  
**para** tener datos de referencia estandarizados al registrar animales.  
**Componentes:** `LivestockModule/catalogs/`, `CreateEditLivestockDialog.vue`, `CreateEditLivestockOwnerDialog.vue`, `LivestockService.ts`

### HU-010 · Registro y administración de bovinos
**Como** encargado de ganadería,  
**quiero** registrar y editar la información completa de cada bovino (arete, raza, sexo, peso, etc.),  
**para** tener un inventario actualizado del hato ganadero.  
**Componentes:** `bovines/`, `CreateEditBovineDialog.vue`, `BovineService.ts`

### HU-011 · Galería fotográfica de bovinos
**Como** encargado de ganadería,  
**quiero** subir y visualizar fotografías de cada bovino,  
**para** identificarlos visualmente en el sistema.  
**Componentes:** `BovinePhotosDialog.vue`, `bovinePhotoService.ts`

### HU-012 · Cambio de arete
**Como** encargado de ganadería,  
**quiero** registrar el cambio de arete de un bovino,  
**para** mantener la trazabilidad del animal cuando se remplaza su identificador.  
**Componentes:** `ChangeEarTagDialog.vue`

### HU-013 · Gestión de nacimientos
**Como** encargado de ganadería,  
**quiero** registrar los nacimientos de nuevas crías vinculadas a una madre,  
**para** dar de alta automáticamente los bovinos recién nacidos en el inventario.  
**Componentes:** `BirthManagementDialog.vue`, `BirthService.ts`

### HU-014 · Gestión de gestación / preñez
**Como** encargado de ganadería,  
**quiero** registrar y dar seguimiento al estado de gestación de las vacas,  
**para** planificar partos y optimizar la reproducción del hato.  
**Componentes:** `PregnancyManagementDialog.vue`, `PregnancyService.ts`

### HU-015 · Gestión de calores / celo
**Como** encargado de ganadería,  
**quiero** registrar los eventos de celo de las vacas,  
**para** planificar la inseminación o monta en el momento óptimo.  
**Componentes:** `HeatManagementDialog.vue`, `HeatService.ts`

### HU-016 · Baja / sacrificio de bovino
**Como** encargado de ganadería,  
**quiero** registrar la baja o sacrificio de un bovino con su causa,  
**para** mantener el inventario actualizado y tener historial de bajas.  
**Componentes:** `KillBovineDialog.vue`

### HU-017 · Traslado de bovinos
**Como** encargado de ganadería,  
**quiero** registrar el traslado de bovinos entre ranchos o lotes,  
**para** mantener la trazabilidad de ubicación de cada animal.  
**Componentes:** `TransferBovineDialog.vue`, `TransferLogService.ts`

### HU-018 · Detalle completo de bovino
**Como** encargado de ganadería,  
**quiero** ver toda la información histórica de un bovino (pesos, eventos, fotos, traslados),  
**para** tomar decisiones informadas sobre cada animal.  
**Componentes:** `BovineDetailsDialog.vue`

---

## MÓDULO 4 — LOTES DE ENGORDA

### HU-019 · Crear lote de engorda
**Como** encargado de engorda,  
**quiero** crear un lote de engorda y asignarle bovinos,  
**para** gestionar grupos de animales en proceso de engorde como unidad.  
**Componentes:** `loteEngorda/`, `CreateBatchDialog.vue`, `AddBovinesToBatchDialog.vue`, `BatchService.ts`

### HU-020 · Seguimiento de lote de engorda
**Como** encargado de engorda,  
**quiero** ver el detalle completo de un lote (bovinos, pesos, progreso),  
**para** monitorear el avance y rendimiento del lote.  
**Componentes:** `BatchDetailFullscreenDialog.vue`, `BatchBovineService.ts`

---

## MÓDULO 5 — LOTES DE PRODUCCIÓN DE LECHE

### HU-021 · Crear lote de leche
**Como** encargado de producción,  
**quiero** crear lotes de vacas lecheras y registrar su producción diaria,  
**para** llevar control de la producción por grupo de animales.  
**Componentes:** `loteLeche/`, `CreateBatchDialog.vue`, `MilkProductionService.ts`

### HU-022 · Seguimiento de producción de leche
**Como** encargado de producción,  
**quiero** visualizar el detalle y el historial de producción de un lote lechero,  
**para** identificar tendencias y tomar decisiones de manejo.  
**Componentes:** `loteLeche/BatchDetailFullscreenDialog.vue`

---

## MÓDULO 6 — LOTES DE VACUNACIÓN

### HU-023 · Crear lote de vacunación
**Como** médico veterinario o encargado sanitario,  
**quiero** crear lotes de vacunación y agregar bovinos a vacunar,  
**para** organizar campañas sanitarias de forma eficiente.  
**Componentes:** `loteVacunacion/`, `CreateBatchDialog.vue`, `AddBovinesToBatchDialog.vue`

### HU-024 · Aplicar vacuna a lote
**Como** médico veterinario,  
**quiero** registrar la aplicación de una vacuna a todos los bovinos de un lote,  
**para** tener el historial sanitario completo del hato.  
**Componentes:** `ApplyVaccineDialog.vue`

### HU-025 · Seguimiento de lote de vacunación
**Como** médico veterinario,  
**quiero** ver el detalle de un lote de vacunación (bovinos incluidos, vacunas aplicadas, fechas),  
**para** verificar el cumplimiento del programa sanitario.  
**Componentes:** `loteVacunacion/BatchDetailFullscreenDialog.vue`

---

## MÓDULO 7 — VENTA DE GANADO

### HU-026 · Gestionar venta de bovinos
**Como** encargado comercial,  
**quiero** seleccionar bovinos disponibles y generar una orden de venta,  
**para** registrar transacciones de venta de ganado con su detalle completo.  
**Componentes:** `ventaGanado/`, `AvailableBovinesPanel.vue`, `SaleOrderPanel.vue`, `VentaGanadoService.ts`

---

## MÓDULO 8 — PERSONAL

### HU-027 · Gestión de personal
**Como** administrador de recursos humanos,  
**quiero** registrar y administrar el personal (empleados, jornaleros, etc.) del rancho,  
**para** llevar control de la plantilla laboral y sus datos.  
**Componentes:** `personal/`, `CreateEditPersonalDialog.vue`, `PersonalPhotoDialog.vue`, `PersonalService.ts`

### HU-028 · Catálogo de puestos
**Como** administrador de recursos humanos,  
**quiero** definir y gestionar los puestos de trabajo disponibles,  
**para** asignarlos al personal de forma estandarizada.  
**Componentes:** `personal/positions/`, `CreateEditPositionDialog.vue`, `PositionService.ts`

---

## MÓDULO 9 — MAQUINARIA

### HU-029 · Gestión de maquinaria
**Como** encargado de activos,  
**quiero** registrar y administrar la maquinaria del rancho (tractores, equipos, vehículos),  
**para** tener un inventario de activos productivos actualizado.  
**Componentes:** `maquinaria/`, `CreateEditMachineryDialog.vue`, `MachineryMediaDialog.vue`, `MachineryService.ts`

### HU-030 · Registro de mantenimientos
**Como** encargado de activos,  
**quiero** registrar los mantenimientos realizados a la maquinaria y subir evidencias,  
**para** llevar el historial de mantenimiento preventivo y correctivo de cada equipo.  
**Componentes:** `CreateEditMaintenanceDialog.vue`, `MaintenanceDialog.vue`, `MaintenanceEvidenceDialog.vue`, `MachineryMaintenanceService.ts`

---

## MÓDULO 10 — INVENTARIOS

### HU-031 · Catálogo de inventario
**Como** encargado de almacén,  
**quiero** registrar y administrar los productos del catálogo (insumos, medicamentos, herramientas, etc.),  
**para** tener una base de artículos estandarizada para los movimientos de inventario.  
**Componentes:** `inventario/catalogs/`, `CreateEditInventoryDialog.vue`, `InventoryService.ts`

### HU-032 · Administración de stock e inventario
**Como** encargado de almacén,  
**quiero** registrar entradas y salidas de productos del inventario,  
**para** conocer en todo momento las existencias disponibles en el rancho.  
**Componentes:** `inventario/admin/`, `CreateEditStockDialog.vue`, `StockMovementDialog.vue`

---

## MÓDULO 11 — CONTABILIDAD / INGRESOS Y EGRESOS

### HU-033 · Gestión de cuentas contables
**Como** contador o administrador financiero,  
**quiero** crear y administrar el catálogo de cuentas contables,  
**para** clasificar correctamente las operaciones financieras.  
**Componentes:** `ContabilidadModule/`, `CreateEditLedgerAccountDialog.vue`, `ledgerAccountService.ts`

### HU-034 · Gestión de categorías y conceptos
**Como** contador,  
**quiero** definir categorías y conceptos de ingreso/egreso,  
**para** clasificar las operaciones de forma detallada y consistente.  
**Componentes:** `CreateEditConceptCategoryDialog.vue`, `CreateEditConceptDialog.vue`, `conceptService.ts`, `conceptCategoryService.ts`

### HU-035 · Registro de operaciones financieras
**Como** contador o administrador financiero,  
**quiero** registrar ingresos y egresos con su concepto, monto, fecha y comprobantes,  
**para** llevar la contabilidad del rancho y generar reportes financieros.  
**Componentes:** `CreateEditOperationDialog.vue`, `operationsService.ts`, `operationImageService.ts`

---

## MÓDULO 12 — REPORTES

### HU-036 · Centro de reportes
**Como** administrador o dueño del rancho,  
**quiero** consultar reportes del sistema (inventario, producción, finanzas, personal),  
**para** tomar decisiones estratégicas basadas en datos actualizados.  
**Componentes:** `reportesModule/reportes/`, `reportService.ts`

---

## MÓDULO 13 — LAYOUT Y NAVEGACIÓN

### HU-037 · Navegación lateral y menú principal
**Como** usuario del sistema,  
**quiero** navegar entre los módulos del sistema mediante un menú lateral intuitivo,  
**para** acceder rápidamente a cualquier sección sin perder el contexto actual.  
**Componentes:** `layouts/leftSideBar/`, `layouts/topBar/`

### HU-038 · Modo oscuro / claro
**Como** usuario del sistema,  
**quiero** alternar entre modo oscuro y claro,  
**para** adaptar la interfaz a mis preferencias visuales o condiciones de iluminación.  
**Componentes:** `layouts/topBar/SiteMode.vue`

### HU-039 · Notificaciones del sistema
**Como** usuario del sistema,  
**quiero** recibir notificaciones de eventos relevantes directamente en la barra superior,  
**para** estar informado sin necesidad de consultar cada módulo manualmente.  
**Componentes:** `layouts/topBar/Notifications.vue`, `layouts/topBar/Notification.vue`

---

## RESUMEN DE AVANCE

| Módulo | HUs | Estado |
|---|---|---|
| Autenticación y Cuenta | HU-001 a HU-004 | Completado |
| Configuración del Sistema | HU-005 a HU-008 | Completado |
| Ganadería / Bovinos | HU-009 a HU-018 | Completado |
| Lotes de Engorda | HU-019 a HU-020 | Completado |
| Lotes de Leche | HU-021 a HU-022 | Completado |
| Lotes de Vacunación | HU-023 a HU-025 | Completado |
| Venta de Ganado | HU-026 | Completado |
| Personal | HU-027 a HU-028 | Completado |
| Maquinaria | HU-029 a HU-030 | Completado |
| Inventarios | HU-031 a HU-032 | Completado |
| Contabilidad | HU-033 a HU-035 | Completado |
| Reportes | HU-036 | Completado |
| Layout y Navegación | HU-037 a HU-039 | Completado |

**Total: 39 Historias de Usuario implementadas**
