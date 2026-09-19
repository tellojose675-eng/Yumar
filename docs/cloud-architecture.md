# Informe Técnico: Planificación de Solución en la Nube - Yumarweb

**Asignatura:** Planifica soluciones en la nube  
**Proyecto:** Yumarweb (Aplicación Web Full-Stack React + Express + PostgreSQL)  
**Fecha:** Septiembre 2026  

---

## 1. Resumen Ejecutivo
El objetivo de este informe es establecer la arquitectura, estrategia de despliegue y modelo operacional en la nube para la plataforma **Yumarweb**. 

Se adopta una arquitectura de micro-servicios modular contenerizada bajo el patrón **12-Factor App**, asegurando alta disponibilidad, escalabilidad horizontal, seguridad cibernética y optimización de costos.

---

## 2. Arquitectura de Solución Nube propuesta

### 2.1 Topología Multinivel (Multi-Tier Cloud Architecture)

```
[ Usuario Final / Cliente ]
           │
           ▼
[ Global CDN / Edge Layer ] (Cloudflare / Vercel Edge / AWS CloudFront)
     │                  │
     │ (Assets Estáticos)│ (Peticiones API)
     ▼                  ▼
[ Storage Layer ]   [ Compute Layer ] (AWS App Runner / Cloud Run / Render)
 (S3 / Static Site)     │ (Contenedores Docker Node.js / Express)
                        ▼
                 [ Managed Database Layer ]
                  (AWS RDS / Supabase / Neon PostgreSQL)
```

### 2.2 Componentes de la Solución

1. **Capa de Presentación (Frontend):**
   - **Tecnología:** React + Vite.
   - **Alojamiento Cloud:** CDN distribuida mundialmente para baja latencia (Vercel / Netlify / AWS S3 + CloudFront).
   - **Beneficios:** Caché en el Edge, compresión Brotli/Gzip automática y SSL/TLS gratuito.

2. **Capa de Lógica de Negocio (Backend):**
   - **Tecnología:** Node.js con Express (`server.js`).
   - **Modelo de Despliegue:** Contenedor Docker (`Dockerfile` multi-stage).
   - **Alojamiento Cloud:** Servicios PaaS/PaaS de contenedores sin servidor (Serverless Containers) como **AWS App Runner**, **Google Cloud Run** o **Render Web Service**.
   - **Escalabilidad:** Auto-scaling automático basado en carga de peticiones HTTP y CPU.

3. **Capa de Datos (Database):**
   - **Tecnología:** PostgreSQL 16.
   - **Alojamiento Cloud:** Plataformas de BD gestionadas (Managed DB) como **Neon Postgres**, **Supabase** o **AWS RDS PostgreSQL**.
   - **Características:** Connection pooling nativo, respaldos automatizados diarios (Point-in-Time Recovery - PITR) y réplicas de lectura opcionales.

---

## 3. Seguridad y Resiliencia en la Nube

### 3.1 Gestión de Secretos y Variables de Entorno
- Strict **Zero-Trust**: Ninguna credencial de producción ni cadena de conexión a la base de datos se guarda en el código fuente.
- Uso de administradores de secretos como **AWS Secrets Manager**, **Doppler** o las variables de entorno cifradas de la plataforma PaaS.

### 3.2 Monitoreo y Salud del Sistema (Health Checking)
- Implementación de la ruta `/api/health` en el backend para reportar el estado operativo y la conectividad a la base de datos PostgreSQL.
- Permite a los balanceadores de carga (Load Balancers) reiniciar contenedores con fallas automáticamente y evitar enrutar tráfico a instancias degradadas.

---

## 4. Estrategia de Integración y Despliegue Continuo (CI/CD)

Se utiliza **GitHub Actions** (`.github/workflows/cloud-ci.yml`) para automatizar el ciclo de vida de desarrollo:

1. **Integración Continua (CI):**
   - Validación sintáctica (`ESLint`).
   - Compilación estática del cliente web React.
   - Construcción y verificación de integridad de la imagen Docker.

2. **Despliegue Continuo (CD):**
   - Publicación de imágenes de contenedor en un registro seguro (Amazon ECR / GitHub Container Registry).
   - Despliegue automatizado sin tiempo de inactividad (Zero-Downtime Deployment / Blue-Green Deployment).

---

## 5. Estimación y Optimización de Costos (FinOps)

| Componente | Opción Recomendada (Tier Inicial/Gratuito) | Escalabilidad Futura (Producción a Escala) | Costo Estimado Inicial |
| :--- | :--- | :--- | :--- |
| **Frontend CDN** | Vercel / Netlify / Cloudflare Pages | AWS CloudFront + S3 | **\$0.00 / mes** |
| **Backend Compute** | Render / Google Cloud Run | AWS App Runner / ECS | **\$0.00 - \$7.00 / mes** |
| **Database** | Neon / Supabase Free Tier | AWS RDS Multi-AZ PostgreSQL | **\$0.00 / mes** |
| **DNS / SSL** | Cloudflare Free SSL | AWS Route53 + ACM | **\$0.00 / mes** |
| **Total Estimado** | | | **\$0 - \$7 USD / mes** |

---

## 6. Conclusiones y Próximos Pasos

La arquitectura planificada para **Yumarweb** cumple con los más altos estándares de diseño en la nube:
1. Es **altamente portable** gracias a la contenerización con Docker.
2. Es **resistente a fallas** gracias a los health checks y la capa de base de datos gestionada.
3. Garantiza **costos mínimos** al inicio y permite escalar a millones de usuarios sin reescribir código.
