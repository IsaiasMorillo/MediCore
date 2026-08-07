## D ocumento Técnico y Arquitectónico: MediCore HMS

## Hospital Management System

A utor: Isaias Morillo

I nstitución: Instituto Tecnológico de Las Américas (ITLA)

F echa: Agosto 2026

## 1. Introducción y Objetivos

M ediCore HMS es una aplicación web empresarial concebida para centralizar, automatizar y o ptimizar la gestión integral de centros de salud, clínicas y hospitales. El ecosistema unifica la a dministración de pacientes, personal médico, programación de citas, expedientes clínicos, g estión de farmacia, laboratorio y facturación bajo una única plataforma de alto rendimiento b asada en ASP.NET Core 9 y MongoDB.

E l objetivo principal del sistema es reducir drásticamente los procesos manuales, mitigar e rrores humanos en la transcripción de datos médicos y mejorar la disponibilidad de la i nformación clínica para optimizar la atención al paciente. Se busca lograr una alta e scalabilidad mediante el uso de una arquitectura moderna (Clean Architecture), endpoints l igeros (Minimal APIs) y una base de datos documental que soporte la naturaleza evolutiva de l os registros médicos.

## 2. Levantamiento de Requisitos

## 2.1 Requisitos Funcionales

| I D | M ódulo | D escripción |
| --- | --- | --- |
| R F-01 | G estión de Usuarios | E l sistema debe permitir el |
|   |   | r egistro, inicio de sesión, |
|   |   | r ecuperación de contraseña |
|   |   | y asignación de roles |
|   |   | ( Administrador, Médico, |
|   |   | E nfermero, Recepción, |


| I D | M ódulo | D escripción |
| --- | --- | --- |
|   |   | L aboratorio, Farmacia). |
| R F-02 | G estión de Pacientes | E l sistema debe centralizar |
|   |   | d atos personales, contactos, |
|   |   | s eguro médico, historial |
|   |   | c línico progresivo, alergias, |
|   |   | e nfermedades y citas de |
|   |   | c ada paciente. |
| R F-03 | G estión de Médicos | E l sistema debe gestionar la |
|   |   | e specialidad, horario, |
|   |   | c onsultorio, experiencia y |
|   |   | l icencia médica del personal |
|   |   | d e salud. |
| R F-04 | G estión de Citas | E l sistema debe permitir |
|   |   | c rear, reprogramar, cancelar |
|   |   | y confirmar citas, validando |
|   |   | l a disponibilidad de la |
|   |   | a genda médica en tiempo |
|   |   | r eal. |
| R F-05 | H istoria Clínica | C ada consulta generará un |
|   |   | r egistro inmutable con |
|   |   | d iagnóstico, signos vitales, |
|   |   | o bservaciones, tratamiento, |
|   |   | r eceta y exámenes |
|   |   | s olicitados. |
| R F-06 | L aboratorio | S e procesarán solicitudes y |
|   |   | r esultados de Hemograma, |
|   |   | O rina, Radiografía, |
|   |   | R esonancia, TAC y |
|   |   | E cografía, asociados |
|   |   | d inámicamente al paciente. |


| I D | M ódulo | D escripción |
| --- | --- | --- |
| R F-07 | F armacia | C ontrol estricto de inventario |
|   |   | d e medicamentos y registro |
|   |   | d e recetas despachadas. |
| R F-08 | F acturación | G eneración de facturas |
|   |   | d etallando consultas, |
|   |   | e xámenes, medicamentos y |
|   |   | p rocesamiento de pagos. |

## 2.2 Requisitos No Funcionales

- Rendimiento: La API debe responder a consultas complejas de historiales médicos en m enos de 200 ms, apalancándose en índices optimizados de MongoDB y Minimal APIs d e .NET 9.

- Seguridad: Autenticación JWT sin estado, cifrado BCrypt para contraseñas, y control de a cceso basado en roles (RBAC) estricto.

- Persistencia Dinámica: Capacidad de almacenar esquemas de datos heterogéneos sin r equerir migraciones de base de datos (ventaja de MongoDB para laboratorios e historias c línicas).

- Despliegue: Arquitectura basada en contenedores (Docker y Docker Compose) para f acilitar la portabilidad e integración continua en GitHub.

## 3. Casos de Uso e Historias de Usuario

## 3.1 Historias de Usuario Principales

- HU-01 (Médico): Como Médico, quiero acceder al historial clínico completo de un p aciente buscando por su ID o nombre, para evaluar sus alergias y diagnósticos previos a ntes de emitir una nueva receta.

- HU-02 (Recepción): Como personal de Recepción, quiero ver un calendario centralizado c on la disponibilidad de todos los especialistas, para agendar citas rápidamente y evitar c ruces de horarios.

- HU-03 (Laboratorio): Como Técnico de Laboratorio, quiero cargar los resultados de p ruebas (ej. TAC, Hemograma) a la orden generada por el médico, para que este reciba


- l os datos en tiempo real en la historia clínica del paciente.

- HU-04 (Paciente - Portal): Como Paciente, quiero recibir recordatorios automáticos y p oder visualizar mis próximas citas y recetas vigentes desde un portal web amigable.

## 4. Arquitectura Clean Architecture

E l sistema está estructurado bajo Clean Architecture , separando las responsabilidades en c apas concéntricas para garantizar que la lógica de negocio (Dominio) sea independiente de la i nfraestructura, base de datos (MongoDB) y la interfaz (API).

## Estructura del Proyecto


│

├── Controllers / Minimal APIs (Endpoints)

│

├── Middleware (Exception Handling)

│

├── Filters

│

├── Extensions

│ └── Configurations (Program.cs)

│

└ ── tests

├ ── Hospital.UnitTests

└ ── Hospital.IntegrationTests

## 5. Justificación de Patrones de Diseño

M ediCore HMS implementa patrones de diseño estratégicos para mantener el código robusto, e scalable y mantenible:

- Repository Pattern: Desacopla la lógica de acceso a datos del Driver de MongoDB. P ermite a la capa de Aplicación solicitar datos a través de interfaces sin conocer la i mplementación de la base de datos NoSQL.

- Dependency Injection: Proveído por ASP.NET Core nativo, gestiona el ciclo de vida de l os servicios (Scoped, Singleton, Transient), facilitando las pruebas unitarias mediante la i nyección de mocks.

- CQRS (Command Query Responsibility Segregation) y Mediator (MediatR): Separa l as operaciones de lectura (Queries) de las de escritura (Commands). Esto optimiza el r endimiento y mantiene los casos de uso extremadamente enfocados y limpios.

- Factory Pattern: Utilizado para instanciar objetos complejos, como los distintos tipos de r eportes analíticos (ingresos, inventario, médicos más consultados) o tipos de órdenes de l aboratorio.

- Strategy Pattern: Se aplica en el módulo de Facturación para calcular descuentos, i mpuestos y coberturas dinámicamente dependiendo del tipo de Seguro Médico del p aciente.

- Result Pattern: Estandariza la respuesta de los comandos y consultas (Success, F ailure) evitando el lanzamiento innecesario de excepciones (Exception for Control Flow).

- Options Pattern: Configura y valida parámetros fuertemente tipados desde el a ppsettings.json (ej. JWT Settings, MongoDB Settings).

## 6. Diseño de las Colecciones MongoDB

¿ Por qué MongoDB?


E l dominio médico es altamente polimórfico. El historial clínico crece de forma progresiva; los p acientes tienen variaciones en alergias e historial familiar; los exámenes de laboratorio tienen e squemas completamente distintos (un Hemograma no tiene los mismos campos que una R esonancia). MongoDB permite almacenar esta información en documentos JSON flexibles sin n ecesidad de costosas migraciones ni tablas relacionales dispersas.

## Colecciones y Ejemplos JSON

## C olección: Patients

```
{
" _id": ObjectId("64a8b..."),
" personalData": {
" firstName": "Juan",
" lastName": "Pérez",
" documentId": "402-1234567-8",
" dateOfBirth": ISODate("1985-05-15T00:00:00Z"),
" gender": "Masculino"
} ,
" contacts": [
{ "type": "Phone", "value": "809-555-1234" },
{ "type": "Emergency", "name": "Maria Pérez", "phone": "809-555-9999" }
] ,
" medicalInsurance": {
" provider": "Senasa",
" policyNumber": "SEN-987654321",
" coverageType": "Premium"
} ,
" clinicalHistory": {
" allergies": ["Penicilina", "Polvo"],
" chronicDiseases": ["Hipertensión"],
" currentMedications": ["Losartán 50mg"]
} ,
" createdAt": ISODate("2026-08-01T10:00:00Z")
}
```

## C olección: MedicalRecords (Consultas Dinámicas)

```
{
" _id": ObjectId("64b1c..."),
" patientId": ObjectId("64a8b..."),
```


```
" doctorId": ObjectId("64c2d..."),
" appointmentId": ObjectId("64d3e..."),
" consultationDate": ISODate("2026-08-03T14:30:00Z"),
" vitalSigns": {
" bloodPressure": "125/80",
" heartRate": 72,
" temperature": 37.2,
" weightKg": 85.5
} ,
" diagnosis": "Infección respiratoria alta",
" observations": "Paciente presenta congestión nasal y tos seca de 3 días de evolución.",
" treatmentPlan": "Hidratación abundante y medicación sintomática.",
" prescriptions": [ ObjectId("64e4f...") ],
" laboratoryOrders": [ ObjectId("64f5g...") ]
}
```

## 7. Arquitectura de la API REST y Definición de Endpoints

E l proyecto utiliza Minimal APIs en ASP.NET Core 9, proporcionando un rendimiento superior y u na sintaxis fluida. Los endpoints están agrupados lógicamente y protegidos mediante políticas d e autorización.

## Definición de Endpoints de Ejemplo (Citas)

```
/ / Módulo de Citas (Appointments)
v ar appointments = app.MapGroup("/api/appointments")
. WithTags("Appointments")
. RequireAuthorization();
/ / Crear Cita
a ppointments.MapPost("/", async (CreateAppointmentCommand command, IMediator
m ediator) => {
v ar result = await mediator.Send(command);
r eturn result.IsSuccess ? Results.Created($"/api/appointments/{result.Value}",
r esult.Value) : Results.BadRequest(result.Error);
} ).RequireAuthorization("ReceptionOrAdmin");
```


```
/ / Consultar Disponibilidad
a ppointments.MapGet("/availability/{doctorId}", async (string doctorId, [FromQuery]
D ateTime date, IMediator mediator) => {
v ar query = new GetDoctorAvailabilityQuery(doctorId, date);
v ar result = await mediator.Send(query);
r eturn Results.Ok(result);
} );
/ / Reprogramar Cita
a ppointments.MapPut("/{id}/reschedule", async (string id,
R escheduleAppointmentCommand command, IMediator mediator) => {
c ommand.Id = id;
v ar result = await mediator.Send(command);
r eturn result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
} );
```

## 8. Estrategia de Seguridad con JWT y Roles

M ediCore garantiza la seguridad de la información médica sensible utilizando autenticación sin e stado y control de acceso riguroso:

- 1 . Flujo de Autenticación: El cliente envía credenciales (POST /api/auth/login). La capa de a plicación valida el hash BCrypt contra la colección Users. Si es exitoso, genera un token J WT firmado asimétricamente o con una clave secreta fuerte (HMAC-SHA256).

- 2 . Estructura del JWT: El payload contiene el sub (userId), email y una matriz de roles (ej. [ "Doctor", "Admin"]).

- 3 . Autorización en Minimal APIs: Se configuran políticas en el Program.cs: b uilder.Services.AddAuthorization(options => { o ptions.AddPolicy("DoctorOnly", policy => policy.RequireRole("Médico", " Administrador")); o ptions.AddPolicy("PharmacyOnly", policy => policy.RequireRole("Farmacia", " Administrador")); } );

## 9. Estrategia de Pruebas Unitarias e


## Integración

P ara asegurar la calidad del código, se implementa una estrategia de pruebas exhaustiva:

- Pruebas Unitarias (Hospital.UnitTests): Utilizando xUnit , Moq y FluentAssertions . Se c entran en validar los Handlers de MediatR, asegurando que la lógica de negocio se e jecute correctamente sin dependencias externas.

- Pruebas de Integración (Hospital.IntegrationTests): Utilizan Testcontainers para l evantar instancias efímeras de MongoDB durante la ejecución de las pruebas. Validan la i nteracción real entre la API, los repositorios y la base de datos.

## 10. Docker y Despliegue

E l entorno de despliegue se orquesta mediante Docker Compose , facilitando la inicialización d el sistema completo con un solo comando.

## Archivo docker-compose.yml

```
v ersion: '3.8'
s ervices:
m edicore-api:
b uild:
c ontext: .
d ockerfile: src/Hospital.API/Dockerfile
p orts:
- "8080:80"
e nvironment:
- MongoDbSettings__ConnectionString=mongodb://medicore-db:27017
- MongoDbSettings__DatabaseName=MediCoreDb
- JwtSettings__Secret=SuperSecretKey123!
d epends_on:
- medicore-db
m edicore-frontend:
b uild:
c ontext: ./frontend
d ockerfile: Dockerfile
p orts:
- "3000:80"
d epends_on:
- medicore-api
```


```
m edicore-db:
i mage: mongo:latest
p orts:
- "27017:27017"
v olumes:
- mongodb_data:/data/db
v olumes:
m ongodb_data:
```

## 1 1. Plan de Desarrollo por Fases

| F ase | H itos Clave | D uración Est. |
| --- | --- | --- |
| F ase 1: Foundation | S etup Clean Architecture, | S emanas 1 - 2 |
|   | c onfiguración de MongoDB |   |
|   | D river, módulo de |   |
|   | A utenticación, JWT, y |   |
|   | G estión de Roles. |   |
| F ase 2: Core Domain | M ódulos de Gestión de | S emanas 3 - 4 |
|   | P acientes, Gestión de |   |
|   | M édicos y programación de |   |
|   | C itas con validación de |   |
|   | d isponibilidad. |   |
| F ase 3: Clinical Ops | M ódulo de Historia Clínica, | S emanas 5 - 6 |
|   | L aboratorios (solicitud y |   |
|   | c arga de resultados) y |   |
|   | F armacia (inventario y |   |
|   | r ecetas). |   |
| F ase 4: Finanzas & QA | M ódulo de Facturación, | S emanas 7 - 8 |
|   | R eportes dinámicos, |   |


| F ase | H itos Clave | D uración Est. |
| --- | --- | --- |
|   | P ruebas de Integración con |   |
|   | T estcontainers, y |   |
|   | D ockerización final. |   |
