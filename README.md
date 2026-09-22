# Sistema Web para Rentar

Proyecto desarrollado para la asignatura [Desarrollo de Software en Sistemas Distribuidos] - [2026 - Segundo Cuatrimestre]. Este sistema web permite administrar la flota de vehículos, los clientes y los alquileres realizados.

## 👥 Equipo de Trabajo
- **Ledesma Miño, Alejandro Javier** (@AJLM97)
- **Vogt, Thomas Gebhard** (@Thomy98)
- **Ponzo, Valentina** (@valentinaponzo)
- **Soncini, Valentino Marco** (@valensoncini)
- **Retamar, Alan Franco** (@AlanRetamar)

# Rentar - Sistema de Gestión de Alquiler de Vehículos

Este repositorio contiene la solución monorepo para el proyecto **API Rentar**, desarrollada para la materia *Desarrollo de Software en Sistemas Distribuidos* (Cátedra: Amaro - Aguirre, 2º Cuatrimestre 2026).

El sistema administra la gestión de clientes, flota de vehículos y reservas mediante una arquitectura desacoplada con API REST, soporte para GraphQL y una interfaz web.

---

## Tecnologías Utilizadas

### **Backend**
* **Framework:** [NestJS](https://nestjs.com/) (Node.js con TypeScript)
* **Persistencia / ORM:** [TypeORM](https://typeorm.io/)
* **Base de Datos:** [MySQL](https://www.mysql.com/)
* **Consultas Flexibles:** [GraphQL](https://graphql.org/) (`@nestjs/graphql` y Apollo Server)
* **Documentación API REST:** Swagger UI (`@nestjs/swagger`)

### **Frontend**
* **Framework:** [Next.js](https://nextjs.org/) (React con TypeScript)
* **Cliente GraphQL:** [Apollo Client](https://www.apollographql.com/docs/react/)
* **Peticiones HTTP:** Fetch API nativa
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)

---

## Estructura del Proyecto

El repositorio está organizado como un **Monorepo**:

```text
tp-dssd-grupo-o/
├── backend/          # Servidor NestJS (API REST, GraphQL, TypeORM)
├── frontend/         # Cliente Next.js (Interfaz de usuario y Admin)
└── README.md

## ⚙️ Configuración del Entorno (`.env`)

Antes de iniciar cada aplicación, se deben crear y configurar los archivos de variables de entorno en cada módulo.

### **1. Backend (`backend/.env`)**
Creá el archivo `.env` dentro de la carpeta `backend/` tomando como referencia las siguientes variables:

```env
# Puerto del servidor Backend
PORT=3000

# Configuración de Base de Datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=rentar_db

# Entorno
NODE_ENV=development

### **2. Frontend (`frontend/.env.local`)**
Creá el archivo `.env.local` dentro de la carpeta `frontend/`:

```env
# URL base para conectar con el Backend
NEXT_PUBLIC_API_REST_URL=http://localhost:3000/api
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql

## 🚀 Instrucciones de Instalación y Ejecución

Asegurate de tener instalado **Node.js** (v18 o superior) y una instancia de **MySQL** ejecutándose en tu equipo.

### **Paso 1: Clonar el repositorio**
```bash
git clone [https://github.com/AJLM97/tp-dssd-grupo-o.git](https://github.com/AJLM97/tp-dssd-grupo-o.git)
cd tp-dssd-grupo-o

### **Paso 2: Iniciar el Backend**

1. Ingresá a la carpeta del backend e instalá las dependencias:
   ```bash
   cd backend
   npm install

2. Ejecutá el servidor en modo desarrollo:

```bash
npm run start:dev

3. **Endpoints y Herramientas del Backend:**

* **API REST Base:** `http://localhost:3000/api`
* **Documentación Swagger UI:** `http://localhost:3000/api/docs`
* **Playground / GraphiQL:** `http://localhost:3000/graphql`

### **Paso 3: Iniciar el Frontend**

1. Abrí una nueva terminal, ingresá a la carpeta del frontend e instalá las dependencias:
   ```bash
   cd frontend
   npm install

2. Ejecutá la aplicación Next.js en modo desarrollo:
   ```bash
   npm run dev

3. Acceso al Frontend:
   Aplicación Web: http://localhost:3001 (o http://localhost:3000 según disponibilidad de puertos)

Funcionalidades Destacadas
Clientes: ABM completo, consulta por ID y validación de documentos únicos.

Vehículos: Gestión de flota, control de patentes duplicadas y seguimiento de disponibilidad.

Reservas: Alta de reservas con cálculo automático de días e importeTotal, validación de fechas pasadas, control de solapamientos de fechas y cancelación lógica.

GraphQL: Consultas avanzadas de disponibilidad (vehiculosDisponibles) con filtros por rango de fechas, tipo de vehículo y marca.