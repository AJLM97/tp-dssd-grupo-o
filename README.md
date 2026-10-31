# Rentar - Sistema de Gestión de Alquiler de Vehículos

Este repositorio contiene la solución monorepo para el proyecto **API Rentar**, desarrollada para la materia *Desarrollo de Software en Sistemas Distribuidos* (Cátedra: Amaro - Aguirre, 2º Cuatrimestre 2026).

El sistema administra la gestión de clientes, flota de vehículos y reservas mediante una arquitectura desacoplada con API REST, soporte para GraphQL y una interfaz web.

## Equipo

- **Grupo:** O
- **Integrantes:**
  - Ledesma Miño, Alejandro Javier — [@AJLM97](https://github.com/AJLM97)
  - Vogt, Thomas Gebhard — [@Thomy98](https://github.com/Thomy98)
  - Ponzo, Valentina — [@valentinaponzo](https://github.com/valentinaponzo)
  - Soncini, Valentino Marco — [@valensoncini](https://github.com/valensoncini)
  - Retamar, Alan Franco — [@AlanRetamar](https://github.com/AlanRetamar)

## Tecnologías Utilizadas

- **Frontend**
  - Framework: [Next.js](https://nextjs.org/) (React con TypeScript)
  - Cliente GraphQL: [Apollo Client](https://www.apollographql.com/docs/react/)
  - Peticiones HTTP: Fetch API nativa
  - Estilos: [Tailwind CSS](https://tailwindcss.com/)

- **Api-Gateway (Backend)**
  - Framework: [NestJS](https://nestjs.com/) (Node.js con TypeScript)
  - Cliente gRPC: `@grpc/grpc-js` y `@grpc/proto-loader`
  - Persistencia / ORM: [TypeORM](https://typeorm.io/)
  - Base de Datos: [MySQL](https://www.mysql.com/)
  - Consultas Flexibles: [GraphQL](https://graphql.org/) (`@nestjs/graphql` y Apollo Server)
  - Documentación API REST: Swagger UI (`@nestjs/swagger`)

- **Microservicios (Backend)**
  - Lenguaje / Framework: Java con Spring Boot y Maven
  - Servidor / Cliente gRPC: gRPC Java y Protocol Buffers (`.proto`)
  - Mensajería Asíncrona: Apache Kafka (`spring-kafka`)
  - Serialización de Eventos: JSON / Protobuf
  - Persistencia / ORM: Spring Data JPA (Hibernate)
  - Base de Datos: MySQL (Bases de datos independientes)

- **Infraestructura y Herramientas**
  - Contenedorización: Docker & Docker Compose
  - Brokering & Monitoreo: Apache Kafka (KRaft mode) y Kafka-UI

## Contenedores

- **El ecosistema se encuentra completamente contenedorizado mediante Docker, aislando la infraestructura y las capas lógicas en servicios independientes:**
  - kafka: Clúster de mensajería (KRaft mode) encargado de procesar tópicos asíncronos como reserva.confirmada y mantenimiento.resultado. incluye Kafka-UI en el puerto 8080.
  - customer-service: Microservicio y base de datos para la gestión de usuarios y clientes.
  - vehicle-service: Microservicio para el control del parque automotor, patentes y disponibilidad.
  - rental-service: Microservicio encargado del negocio de alquileres y reservas de vehículos.
  - maintenance-service: Microservicio independiente asignado al control del mantenimiento preventivo.

## Instalación y Despliegue

Sigue este orden estricto para inicializar la infraestructura distribuida y las interfaces del sistema:

- **Requisitos Previos**
  - Docker Desktop: instalado y en ejecución.
  - Java JDK: versión 21 o superior junto con `Maven` configurados localmente.
  - Node.js: versión 18 o superior.

### Paso 1: Levantar la Infraestructura y Microservicios (Docker)
Cada módulo cuenta con su propio entorno de base de datos y aislamiento. Ejecuta los contenedores en segundo plano (`-d`) ingresando a cada carpeta:

```bash
# 1. Clúster de Mensajería Kafka y Kafka-UI
docker compose -f ./kafka/docker-compose.yml up -d 
# 2. Infraestructura de Microservicios individuales
docker compose -f ./vehicle-service/docker-compose.yml up -d
docker compose -f ./customer-service/docker-compose.yml up -d 
docker compose -f ./rental-service/docker-compose.yml up -d 
docker compose -f ./maintenance-service/docker-compose.yml up -d 
```

### Paso 2: Compilar y Ejecutar los Microservicios (Java / Maven)
Como los contenedores de Docker solo gestionan la persistencia, debes compilar el código Java y levantar los servidores gRPC y HTTP de forma nativa en tu entorno local. 

Abre una terminal independiente por cada microservicio y ejecuta:

```bash
# 1. Ingresar al directorio del microservicio (Ejemplo: rental-service)
cd rental-service
# 2. Compilar el empaquetado de Maven
./mvnw clean package -DskipTests
# 3. Iniciar la aplicación
./mvnw spring-boot:run
```

#### Mapeo de Puertos Locales
  - Apache Kafka Bootstrap: `localhost:29092`
  - vehicle-service (MySQL): `MySQL: 3307`, `HTTP: 8081` y `gRPC: 9091`
  - customer-service (MySQL): `MySQL: 3308`, `HTTP: 8082` y `gRPC: 9092`
  - rental-service (MySQL): `MySQL: 3309`, `HTTP: 8083` y `gRPC: 9093`
  - verification-service: `HTTP: 8084`
  - maintenance-service (MySQL): `MySQL: 3310`y `HTTP: 8085`

### Paso 3: Iniciar el API Gateway (NestJS)
El Gateway actúa como intermediario unificando las llamadas sincrónicas gRPC hacia el backend.

```bash
# 1. Ingresar al directorio del api-gateway
cd api-gateway
# 2. Instalar las dependencias
npm install
# 3. Iniciar la aplicación
npm run start:dev
```
  - Host Local: `http://localhost:3000`
  - Playground interactivo de GraphQL: `http://localhost:3000/graphql`
  - Documentación REST de Swagger UI: `http://localhost:3000/api/docs`

### Paso 4: Iniciar el Frontend (Next.js)
Interfaz del cliente web integrada al API Gateway.

```bash
# 1. Ingresar al directorio del frontend
cd frontend
# 2. Instalar las dependencias
npm install
# 3. Iniciar la aplicación
npm run dev
```
  - Aplicación Web: `http://localhost:3001`

