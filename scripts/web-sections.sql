-- =====================================================================
-- Secciones del sistema y permisos iniciales
--
-- Las secciones son estructura de la aplicación, no datos de operación:
-- se cargan aquí y no desde la interfaz. Cada una corresponde a una
-- pantalla real del front; si `path` no coincide con la ruta, el permiso
-- existe pero no protege nada.
--
-- El script es idempotente: se puede volver a correr sin duplicar, y se
-- puede correr sobre una tabla que ya tenga algunas secciones cargadas.
--
-- Motor: MySQL / MariaDB. `key` va entre acentos graves por ser palabra
-- reservada.
--
-- ORDEN DE EJECUCIÓN
--   1. Bloque A: crea las secciones que falten.
--   2. Bloque B: le asigna TODAS al Super usuario.
--      Córrelo siempre: si no, al guardar la primera matriz el Super
--      usuario se puede dejar fuera de la pantalla de permisos.
--   3. Los demás roles se configuran desde Configuraciones → Permisos.
-- =====================================================================


-- ---------------------------------------------------------------------
-- BLOQUE A · Secciones
--
-- Una sola sentencia: la lista va en una tabla derivada y el NOT EXISTS
-- descarta las que ya existan por su clave.
-- ---------------------------------------------------------------------

INSERT INTO web_sections (id, `key`, name, description, path, is_active, created_at, updated_at)
SELECT UUID(), s.clave, s.nombre, s.descripcion, s.ruta, 1, NOW(), NOW()
FROM (
            SELECT 'home'                  AS clave, 'Inicio'                     AS nombre, 'Pantalla de bienvenida'                     AS descripcion, '/'                                AS ruta
  UNION ALL SELECT 'settings-users',              'Usuarios',                  'Alta y administración de usuarios',          '/configuraciones/usuarios'
  UNION ALL SELECT 'settings-companies',          'Empresas',                  'Ranchos y unidades de producción',           '/configuraciones/empresas'
  UNION ALL SELECT 'settings-ranchers',           'Rancheros',                 'Catálogo de rancheros',                      '/configuraciones/rancheros'
  UNION ALL SELECT 'settings-parameters',         'Parámetros generales',      'Valores globales del sistema',               '/configuraciones/parametros'
  UNION ALL SELECT 'settings-permits',            'Permisos',                  'Asignación de secciones por rol',            '/configuraciones/permisos'
  UNION ALL SELECT 'accounting-operations',       'Ingresos y egresos',        'Registro de operaciones contables',          '/administracion/ingresos-egresos'
  UNION ALL SELECT 'reports',                     'Reportes',                  'Centro de reportes operativos',              '/reportes'
  UNION ALL SELECT 'inventory-manage',            'Inventarios · Administrar', 'Existencias y movimientos',                  '/inventarios/administrar'
  UNION ALL SELECT 'inventory-catalogs',          'Inventarios · Catálogos',   'Productos y subcategorías',                  '/inventarios/catalogos'
  UNION ALL SELECT 'livestock-bovines',           'Bovinos',                   'Inventario del hato',                        '/ganaderia/bovinos'
  UNION ALL SELECT 'livestock-catalogs',          'Catálogos Ganado',          'Razas, causas de muerte y demás catálogos',  '/ganaderia/catalogos'
  UNION ALL SELECT 'livestock-feedlot',           'Módulo de Engorda',         'Lotes de engorda',                           '/ganaderia/engorda'
  UNION ALL SELECT 'livestock-milk',              'Producción de Leche',       'Lotes lecheros y producción',                '/ganaderia/leche'
  UNION ALL SELECT 'livestock-vaccination',       'Vacunación',                'Campañas de vacunación',                     '/ganaderia/vacunacion'
  UNION ALL SELECT 'livestock-sales',             'Venta de Ganado',           'Órdenes de venta de ganado',                 '/ganaderia/venta'
  UNION ALL SELECT 'machinery',                   'Maquinaria',                'Equipos y mantenimientos',                   '/maquinaria'
  UNION ALL SELECT 'staff-manage',                'Personal · Administrar',    'Plantilla de personal',                      '/personal/administrar'
  UNION ALL SELECT 'staff-positions',             'Personal · Puestos',        'Catálogo de puestos',                        '/personal/puestos'
) AS s
WHERE NOT EXISTS (
  SELECT 1 FROM web_sections w WHERE w.`key` = s.clave
);


-- ---------------------------------------------------------------------
-- BLOQUE B · Todas las secciones para el Super usuario
--
-- Evita que al guardar la primera matriz el Super usuario quede sin
-- acceso a la pantalla de permisos y ya no pueda corregirlo.
-- ---------------------------------------------------------------------

INSERT INTO permits (id, id_role, id_web_section, created_at, updated_at)
SELECT UUID(), r.id, s.id, NOW(), NOW()
FROM role r
CROSS JOIN web_sections s
WHERE r.id = '09f145c3-9bcc-4573-aa43-7f72f033a28f'   -- Super usuario
  AND NOT EXISTS (
    SELECT 1 FROM permits p
    WHERE p.id_role = r.id AND p.id_web_section = s.id
  );


-- ---------------------------------------------------------------------
-- VERIFICACIÓN
-- ---------------------------------------------------------------------

-- Deben salir 19 secciones activas
-- SELECT COUNT(*) AS secciones FROM web_sections WHERE is_active = 1;

-- Y 19 permisos para el Super usuario
-- SELECT r.name AS rol, COUNT(*) AS secciones
-- FROM permits p
-- JOIN role r ON r.id = p.id_role
-- GROUP BY r.name;
