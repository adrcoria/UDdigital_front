---
name: Módulo Venta de Ganado — pendiente automatización saleValue
description: El campo saleValue por animal es manual hoy; está planificado automatizarlo con una matriz de precios
type: project
---

El campo `saleValue` en la orden de venta se captura manualmente por animal.

**Why:** La matriz de precios (peso × raza × etapa de vida) aún no está disponible en el backend.

**How to apply:** Cuando el backend exponga la matriz de precios, reemplazar el valor inicial `saleValue: 0` en `AvailableBovinesPanel.vue` (método `onAdd`) por el valor calculado desde la matriz. El input manual en `SaleOrderPanel.vue` puede quedar como override editable.
