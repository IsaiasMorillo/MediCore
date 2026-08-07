# MediCore HMS — Memoria de Sesión

> Archivo para preservar contexto entre sesiones. Última actualización: **Phase 7 (Filters + SMTP real + rol Enfermero/triaje) completada** (123/123 tests).

## 1. Objetivo del proyecto

Construir **MediCore HMS**, sistema de gestión hospitalaria (ASP.NET Core 9 + MongoDB, Clean Architecture, Minimal APIs, CQRS/MediatR) según `Documento Técnico_ MediCore HMS - Documentos de Google.md`.

Fases del documento: Fase 1 Foundation, Fase 2 Core Domain, Fase 3 Clinical Ops, Fase 4 Finanzas & QA.

## 2. Estado actual (sesión previa)

- **Phase 1 (completa):** Setup de solución, MongoDB, JWT + roles, auth completo. Tests: 16 unit + 3 integración.
- **Phase 2 (completa):** Pacientes, Médicos, Citas con validación de disponibilidad, repostos con búsqueda regex. Tests: 23 unit + 4 integración.
- **Phase 3 (completa):** Historia Clínica inmutable, Laboratorio (Factory Pattern), Farmacia (inventario + recetas). Tests: **52 unit + 6 integración = 58/58**.
- **Phase 4 (completa):** Facturación (Strategy Pattern + ITBIS 18%), pagos, reportes con aggregation pipelines, dockerización final con healthchecks. Tests: **71 unit + 11 integración = 82/82**.
- **Phase 5 (completa):** Cierre de huecos HU-01/HU-02 (búsqueda de historial clínico por nombre/doc/ID y calendario global de disponibilidad). Tests: **80 unit + 13 integración = 93/93**.
- **Phase 6 (completa):** Portal de paciente HU-04 (rol Paciente + cuenta vinculada, próximas citas y recetas vigentes con ownership por claims) + recordatorios automáticos de citas (hosted service). Tests: **93 unit + 17 integración = 110/110**.
- **Phase 7 (completa):** Capa **Filters** (ModelValidationFilter + PerformanceLoggingFilter, IEndpointFilter en Minimal APIs), **SMTP real con MailKit** (`SmtpEmailSender` con fallback a log si no configurado) y **uso del rol Enfermero = triaje** (registro/consulta de signos vitales `/api/nursing/vitals`, políticas `NurseOnly` y `NurseOrDoctor`). Tests: **101 unit + 22 integración = 123/123**. Suite anterior 110 → nueva cobertura (vitals handler + smtp + nursing flow + endpoint filters).
- **Build actual:** `0 errores` (warning preexistente CS0618 MongoDbBuilder obsoleto en MediCoreApiFactory.cs:14 + CS8604 preexistentes).
- Docker daemon arriba. `docker compose down` tras smoke tests (se relanza con `docker compose up --build`; ambos servicios quedan **healthy**).

## 3. Decisiones y restricciones técnicas claves

- **Solución:** `MediCore.slnx` (NO es `.sln`). Solución de 7 proyectos.
- **Target:** `net9.0`. SDK instalados: 10.0.400-preview, 9.0.119 / 9.0.316.
- **MediatR 12.4.1 OBLIGATORIO** (14.x requiere `Microsoft.Extensions.DependencyInjection.Abstractions >= 10.0.0` → NU1605). NO actualizar.
- **Versionado de paquetes:** `Microsoft.Extensions.*` y JwtBearer fijados en **9.0.18**; MongoDB.Driver **3.10.0**; BCrypt.Net-Next **4.2.0**; Testcontainers.MongoDb **4.13.0**; Moq **4.20.72**; FluentAssertions; **MailKit 4.17.0** (SMTP, nuevo en Phase 7).
- **Registro de MediatR:** `RegisterServicesFromAssembly(Assembly.GetExecutingAssembly())` en `Application/DependencyInjection.cs`.
- **Frontend: NO** (solo API, decisión del cliente).
- **MongoDB:** local vía Docker (`mongo:latest`, puerto 27017). Tests de integración con **Testcontainers** (MongoDB real, no mocks).
- **Auth:** JWT HMAC-SHA256. Passwords con BCrypt. Emails con `SmtpEmailSender` (MailKit): si `SmtpSettings.Enabled=false` o falta Host/FromEmail → fallback a log (no envía, no lanza).
- **Result Pattern:** `Result<T>` (IsSuccess/IsFailure/Error/ErrorType). `ErrorType`: None, Validation, NotFound, Conflict, Unauthorized, Forbidden, Internal (`Hospital.Domain.Common`).

### Roles y políticas
- Roles: `Admin, Medico, Enfermero, Recepcion, Laboratorio, Farmacia, Paciente` (`Enums/UserRole.cs`).
- Políticas en `src/Hospital.API/Program.cs`:
  - `AdminOnly` → Admin
  - `DoctorOnly` → Medico, Admin
  - `PharmacyOnly` → Farmacia, Admin
  - `ReceptionOrAdmin` → Recepcion, Admin
  - `LaboratoryOnly` → Laboratorio, Admin
  - `PatientOnly` → Paciente
  - `NurseOnly` → Enfermero, Admin (crear signos vitales)
  - `NurseOrDoctor` → Enfermero, Medico, Admin (leer signos vitales)
- **Seeder admin:** `admin@medicore.do` / `Admin123!` (idempotente, roles Admin).

### Hacks/fixes críticos (no revertir)
- `UseHttpsRedirection` se omite cuando env = `"Testing"` (el redirect perdía el header `Authorization` → 401 en tests).
- JWT configurado con `IPostConfigureOptions<JwtBearerOptions>` (`ConfigureJwtBearerOptions`) para que el factory de tests pueda sobreescribir el issuer.
- `Appointment.EndDateTime` es **campo persistido** (MongoDB no filtra propiedades calculadas).
- **`Dictionary<string, object?>` en resultados de laboratorio deserializa como `JsonElement` → MongoDB no lo serializa (BsonSerializationException). Solución:** normalizador estático `ToBson`/`FromJsonElement` en `LaboratoryCommandHandlers.cs` (línea ~66) que convierte a tipos BSON-compatibles.
- Enums JSON como strings vía `JsonStringEnumConverter` en `ConfigureHttpJsonOptions`.
- `Pharmacy.cs` requiere `using Hospital.Domain.Enums;` (usa `PrescriptionStatus`).

## 4. Estructura del proyecto (convenciones)

```
MediCore.slnx
src/
  Hospital.Domain/          # Entidades (Entity base con Id/CreatedAt/UpdatedAt), enums, interfaces de repos, Result
  Hospital.Application/     # CQRS MediatR por feature: Features/<Modulo>/Commands|Queries|DTOs|Services
  Hospital.Infrastructure/  # MongoDb/ (MongoDbContext, Repositories/Base/MongoRepository<T>, Repositories/), Security/, Authentication/, Services/, DependencyInjection.cs
  Hospital.API/             # Program.cs, Middleware/ExceptionHandlingMiddleware.cs, Endpoints/*, Extensions/EndpointExtensions.cs (registro de endpoints), Dockerfile
tests/
  Hospital.UnitTests/       # xUnit + FluentAssertions + Moq (clean de infra/mongo)
  Hospital.IntegrationTests/# Testcontainers MongoDB; colección "MediCore"
```

- **Reposity pattern:** `IRepository<T>` con `GetById/GetAll/Find/FirstOrDefault/Add/Update/Delete/Exists` (`Domain/Interfaces/IRepository.cs`). Repos concretos heredan `MongoRepository<T>(database, collectionName)` y usan `Collection` protegido.
- **MongoDbContext** (`Hospital.Infrastructure/MongoDb/MongoDbContext.cs`): `IMongoCollection<T>` por entidad (Users, Patients, Doctors, Appointments, MedicalRecords, LaboratoryOrders, Medications, Prescriptions, **Invoices**) + creación de índices en constructor. Options Pattern: `MongoDbSettings` (ConnectionString, DatabaseName), registrado con `AddOptions<>().Bind()`. Índice único en `Invoices.Number` y compuesto `PatientId + CreatedAt(desc)`.
- **DI Infrastructure** (`Hospital.Infrastructure/DependencyInjection.cs`): `IRepository<>` → `GenericRepository<>` scoped; repos específicos scoped; `IPasswordHasher` scoped, `ITokenGenerator`/`IEmailSender` singleton, `IReminderProcessor` scoped, `AppointmentReminderHostedService` (`AddHostedService`), `UserSeeder` scoped, `ILaboratoryOrderFactory` scoped.
- **Result → HTTP:** helper `ResultToHttp(Result)` en `PatientsEndpoints.cs` (NotFound/Conflict/Unauthorized/BadRequest).
- **Endpoints:** patrón `MapGroup("/api/...")` + `.RequireAuthorization()`; acciones protegidas con `.RequireAuthorization("<Policy>")`. Registrados en `EndpointExtensions.MapApiEndpoints()`.

## 4b. Dockerización final

- `docker-compose.yml` mejorado: red propia `medicore-net`, `depends_on` con `condition: service_healthy`, `restart: unless-stopped`, healthchecks (mongo vía `mongosh ping`, API vía `curl /health`), volumen persistente `mongodb_data` (ya existía).
- `Dockerfile` de API: instala `curl` en la imagen final (la imagen `aspnet:9.0` NO trae curl/wget → sin esto el healthcheck falla con `exec: "curl": not found`).
- CI GitHub Actions: `.github/workflows/ci.yml` (restore → build Release → unit tests → integration tests con Testcontainers en runner ubuntu).
- Smoke test verificado: `docker compose up -d --build` → ambos contenedores healthy, `GET /health` → `{"status":"healthy"}`, login admin y `/api/reports/invoices-summary` OK.

## 5. Módulos implementados (endpoints)

- **Auth:** `POST /api/auth/register` (AdminOnly), `login`, `forgot-password`, `reset-password` (públicos). Token en `user.token`, roles en `user.roles`.
- **Pacientes** `/api/patients`: GET list (search), GET {id}, POST (ReceptionOrAdmin; ahora acepta `ClinicalHistory` opcional en creación — RF-02), PUT (ReceptionOrAdmin), DELETE (AdminOnly). `PatientRepository` con regex sobre FirstName/LastName/DocumentId.
- **Médicos** `/api/doctors`: GET list (specialty/search), GET {id}, POST/PUT/DELETE (AdminOnly). `Doctor` con `Schedule` = `List<AvailabilityShift>` (Day, StartTime, EndTime).
- **Citas** `/api/appointments`: POST, GET {id}, GET `availability/{doctorId}?date=yyyy-MM-dd`, **GET `availability?date=yyyy-MM-dd`** (HU-02: calendario global de todos los médicos activos con sus slots libres; una sola query de citas del día agrupada por DoctorId, ordenados por nombre; policy ReceptionOrAdmin), PUT {id}/reschedule, POST {id}/confirm, POST {id}/cancel. Lógica en `Application/Services/AppointmentScheduler.cs` (`ComputeFreeSlots`, `IsAvailable`, `DefaultSlotMinutes=30`; filtran status Cancelled/Completed). `AppointmentStatus`: Scheduled, Confirmed, Rescheduled, Cancelled, Completed.
- **Historias Clínicas** `/api/medical-records` (DoctorOnly): POST create (valida paciente/médico/diagnóstico obligatorio; `ExistsForAppointmentAsync` → Conflict si ya existe para la cita), GET {id}, GET patient/{patientId}, **GET search?term=** (HU-01: busca por ID exacto o por nombre/documento vía `PatientRepository.SearchAsync`; devuelve paciente + `ClinicalHistory` (alergias/enfermedades/medicación) + historial de registros ordenado por fecha desc). `MedicalRecord.IsImmutable = true`, incluye `VitalSigns`, `PrescriptionIds`, `LaboratoryOrderIds`.
- **Laboratorio** `/api/laboratory`: GET `test-types` (factory), POST `orders` (DoctorOnly; TestType: Hemograma, Orina, Radiografia, Resonancia, Tac, Ecografia), GET orders/{id}, GET orders/patient/{patientId}, POST orders/{id}/results (LaboratoryOnly; cuerpo `Dictionary<string,object?>`; → 409 si ya cargados). `LaboratoryOrderStatus`: SolicitudPendiente, ResultadoCargado.
  - **Factory Pattern** (`Application/Features/Laboratory/LaboratoryOrderFactory.cs`): `ILaboratoryOrderFactory` con `SupportedTestTypes`, `BuildResultTemplate(TestType)` (campos por tipo: hemoglobina/leucocitos/plaquetas, ph/densidad/glucosa, region/hallazgos/impresion, etc.), `Validate(TestType)`.
- **Farmacia** `/api/pharmacy`:
  - Medicamentos: GET?search, POST (PharmacyOnly; código unique → Conflict, se normaliza a MAYÚSCULAS), PUT {id} (PharmacyOnly), PATCH {id}/stock (PharmacyOnly; negativo → Conflict).
  - Recetas: POST (DoctorOnly; valida paciente/médico/medicamento, quantity > 0; vincula `MedicalRecordId` si aplica), GET patient/{patientId}, POST {id}/dispense (PharmacyOnly; solo `Emitida`, stock insuficiente → Conflict, decrementa stock, set `DispensedAt/DispensedBy`). `PrescriptionStatus`: Emitida, Despachada, Cancelada.
- **Facturación** `/api/invoices` (ReceptionOrAdmin para crear/pagar/anular):
  - POST `/` (items con Type: Consulta/Examen/Medicamento, descripción, cantidad, precio, refs opcionales AppointmentId/LaboratoryOrderId/PrescriptionId), GET `{id}`, GET `patient/{patientId}`, POST `{id}/pay` (método EFTPOS/Efectivo/Transferencia; pagos parciales acumulables; sobrepago o pagar pagada/anulada → Conflict), POST `{id}/cancel` (solo Pendiente; pagada → Conflict).
  - **Strategy Pattern** (`Application/Features/Billing/BillingStrategies.cs`): `IBillingStrategy` + `WithoutInsuranceStrategy` (100% + ITBIS 18%) y `ArsCoverageStrategy` (Básica 60% / Premium 90% de cobertura sobre items Consulta+Examen; medicamentos NO cubiertos; ITBIS 18% solo sobre la parte del paciente; redondeo 2 decimales con `MidpointRounding.AwayFromZero` en `BillingMath.Round2`). `BillingStrategyFactory` registrado singleton en Application DI; la cobertura se deriva de `Patient.MedicalInsurance.CoverageType` (string) vía `CoverageTypeParser` (fallback SinSeguro).
  - `Invoice`: Number (`FAC-yyyyMMdd-XXXXXX` aleatorio, unique), Items, Subtotal, InsuranceCoverage, Discount, Taxes, Total, Status (Pendiente/Pagada/Anulada), Payments. `CoverageType` enum: SinSeguro/Basica/Premium.
- **Reportes** `/api/reports` (aggregation pipelines de MongoDB en `ReportRepository`):
  - `GET invoices-summary?from&to` (AdminOnly): ingresos facturados por mes (solo Pagada, `$match` + group por Year/Month vía LINQ Aggregate).
  - `GET medications-dispensed?limit` (PharmacyOnly): recetas Despachadas agrupadas por medicamento (count + cantidad total, top N).
  - `GET laboratory-most-requested?limit` (LaboratoryOnly): órdenes agrupadas por TestType.
  - `GET patients-most-frequent?limit` (AdminOnly): citas no canceladas por paciente (top N, resuelve nombres).
  - `GET low-stock` (PharmacyOnly): `StockQuantity <= ReorderLevel`.
  - `IReportRepository` (Application/Interfaces) devuelve DTOs de Application; implementación en Infrastructure (Application NO referencia MongoDB).
- **Health endpoint:** `GET /health` público (usado por el healthcheck del compose).
- **Portal Paciente** `/api/patient-portal` (policy `PatientOnly`):
  - `POST /api/auth/patient-account` (AdminOnly): crea cuenta de rol `Paciente` vinculada a un paciente existente (`User.PatientId`); valida email/password ≥8, paciente existe, email único.
  - `GET upcoming-appointments`: citas futuras del paciente autenticado (status Scheduled/Confirmed/Rescheduled, orden asc por fecha) con nombre/especialidad del médico.
  - `GET active-prescriptions`: recetas `Emitida` del paciente autenticado con nombre del medicamento y médico (orden desc por creación).
  - **Ownership:** el `patientId` se lee del claim JWT (`FindFirstValue("patientId")`, añadido en `JwtTokenGenerator` cuando `User.PatientId != null`); sin claim → 403. Un paciente solo ve sus propios datos.
- **Recordatorios de citas:** `Appointment.ReminderSentAt` (DateTime?); `IAppointmentRepository.GetPendingReminderAppointmentsAsync(from, to)` filtra citas activas en ventana [from,to) con `ReminderSentAt == null`. `AppointmentReminderProcessor` (Infrastructure) resuelve la cuenta portal del paciente (`User.PatientId`) y envía email vía `IEmailSender`; marca `ReminderSentAt` e `UpdateAsync`. `AppointmentReminderHostedService` (`BackgroundService`, cada 15 min, usa `IServiceScopeFactory` para resolver el processor scoped). Añade paquete `Microsoft.Extensions.Hosting.Abstractions 9.0.18` a Infrastructure.
- **Enfermería (triaje)** `/api/nursing` (rol Enfermero, policy `NurseOnly`/`NurseOrDoctor`):
  - `POST /vitals` (NurseOnly): `CreateVitalsRecordCommand` (PatientId, AppointmentId?, VitalSigns, Notes); `RecordedBy` se toma del claim `ClaimTypes.NameIdentifier` (OJO: el claim JWT "sub" se mapea a NameIdentifier, `FindFirstValue("sub")` devuelve null — ver `NursingEndpoints.cs`); valida paciente existe (NotFound) y al menos un signo vital (Validation); persiste `VitalsRecord` (PatientId, VitalSigns, Notes, RecordedBy, RecordedAt=UtcNow).
  - `GET /vitals/patient/{patientId}` (NurseOrDoctor): historial de signos ordenado desc (índice compuesto `PatientId + RecordedAt desc` en MongoDbContext).
  - Entidad `VitalsRecord` (Domain/Entities), `IVitalsRepository` + `VitalsRepository` (Infrastructure). No toca la inmutabilidad de `MedicalRecord`.
- **Filters (capa Filters del doc técnico, sección 4):** `src/Hospital.API/Filters/`: `ModelValidationFilter` (IEndpointFilter: si la request trae `application/json` y algún argumento quedó null → 400 "cuerpo inválido/vacío") y `PerformanceLoggingFilter` (loguea método, path, status code y ms). Se aplican a TODOS los grupos en `EndpointExtensions.MapApiEndpoints` vía `RouteGroupBuilder.AddEndpointFilter<T>()` (helper `AddCommonFilters`).

## 6. Tests — patrones

- Unit: xUnit `[Fact]`/`[Theory]`, FluentAssertions, Moq para repos. Ej. `RegisterUserCommandHandlerTests`, `AppointmentSchedulerTests`.
- Integración: `[Collection("MediCore")]`, constructor recibe `MediCoreApiFactory`. Flujo: login admin → token → `client.DefaultRequestHeaders.Authorization = new("Bearer", token)`. Verificación directa con `factory.Database.GetCollection<T>("X").Find(...)`.
- `MediCoreApiFactory`: `WebApplicationFactory<Program>`, `UseEnvironment("Testing")`, `MongoDbContainer` de Testcontainers, sobreescribe `MongoDbSettings` y `JwtSettings` vía `ConfigureServices`.
- Comandos: `dotnet build MediCore.slnx` / `dotnet test MediCore.slnx`. Suites: `dotnet test tests\Hospital.UnitTests` y `tests\Hospital.IntegrationTests` (requiere Docker daemon).

## 7. Reintalentos útiles / smoke test manual

- `docker compose up --build` (api en 8080, mongo en 27017). `docker compose down`.
- Smoke flow probado: login admin → crear paciente (201) → crear doctor (201) → disponibilidad (X slots) → crear cita (201) → reserva solapada (409).

## 8. FASE 4: Finanzas & QA (COMPLETA — 82/82 tests)

Alcance del doc: **Módulo de Facturación, Reportes dinámicos, Pruebas de Integración con Testcontainers, y Dockerización final.**

### Decisiones confirmadas en esta fase (antes pendientes)
- Roles de facturación: **ReceptionOrAdmin** (crear/pagar/anular facturas).
- Impuesto: **ITBIS 18%**, moneda **RD$** (montos decimales).
- Coberturas: **Sin seguro / Básica (60%) / Premium (90%)** sobre items Consulta + Examen; medicamentos no cubiertos; ITBIS solo sobre la porción del paciente.

### Implementado
- **Facturación:** `Invoice`/`InvoiceItem`/`Payment` + enums (`InvoiceStatus`, `PaymentMethod`, `InvoiceItemType`, `CoverageType`). Strategy Pattern con `WithoutInsuranceStrategy` y `ArsCoverageStrategy` (Básica/Premium) + `BillingStrategyFactory` + `CoverageTypeParser`. Commands: Create/Pay/Cancel; Queries: Get/GetByPatient. Endpoints `/api/invoices`. Índices únicos/compuestos en MongoDbContext.
- **Reportes:** `IReportRepository` con aggregation pipelines (invoices-summary por mes, medicamentos despachados, exámenes más solicitados, pacientes más frecuentes, stock bajo). Endpoints `/api/reports` con políticas por rol.
- **QA:** Unit tests de estrategias (redondeo de impuestos) y handlers (19 nuevos); integration tests de flujo facturación completo y reportes (5 nuevos). Suite: 82/82.
- **Docker/CI:** compose con healthchecks, red propia, curl en Dockerfile; `.github/workflows/ci.yml`.

### Orden de trabajo ejecutado
1. Dominio Facturación + enums + repositorio + índices. ✔
2. Estrategias de precio (Strategy Pattern) + command handlers + endpoints. ✔
3. Integration test de facturación. ✔
4. Reportes con aggregation. ✔
5. Unit tests de estrategias y reportes; suite completa (82/82). ✔
6. Dockerización final + CI. ✔

---
## 9. Notas pendientes de confirmar con el cliente
- ~~Rol que autoriza facturación~~ → **Resuelto: ReceptionOrAdmin**.
- ~~Impuesto predeterminado y moneda~~ → **Resuelto: ITBIS 18%, montos en RD$**.
- ~~HU-01 (historial por nombre) y HU-02 (calendario global)~~ → **Resueltos en Phase 5**.
- ~~Portal de paciente HU-04~~ → **Resuelto en Phase 6** (rol Paciente, cuenta vinculada por Admin, próximas citas y recetas vigentes, recordatorios automáticos por email; `IEmailSender` sigue dummy hasta integrar un proveedor real de correo).
- ~~Email dummy~~ → **Resuelto en Phase 7**: `SmtpEmailSender` real (MailKit) configurable vía `SmtpSettings` (appsettings.json + env vars `SMTP_*` en docker-compose); fallback a log si no configurado.
- ~~Rol Enfermero sin uso~~ → **Resuelto en Phase 7**: triaje de signos vitales (`/api/nursing/vitals`).
- ~~Capa Filters del doc~~ → **Resuelto en Phase 7**: `Filters/ModelValidationFilter` + `PerformanceLoggingFilter` globales.
- Precios de consultas/exámenes: no existen en el dominio; la factura acepta items con precio explícito en el request. Confirmar si más adelante se requiere catálogo de tarifas.

## 10. Phase 5 — Cierre de huecos (HU-01 / HU-02)

- **HU-01 (Médico):** `GET /api/medical-records/search?term=` devuelve el historial clínico completo por ID exacto o por nombre/documento (alineado con RF-02: pacientes centralizan alergias/enfermedades). Se añadió `ClinicalHistory` opcional al `CreatePatientCommand`. Handler: `SearchPatientClinicalHistoryQueryHandler` (first consulta por ID, luego regex). Tests: `SearchPatientClinicalHistoryQueryHandlerTests` + `ClinicalHistorySearchFlowTests`.
- **HU-02 (Recepción):** `GET /api/appointments/availability?date=` devuelve la disponibilidad de TODOS los médicos activos (una sola query de citas del día + `AppointmentScheduler.ComputeFreeSlots`, ordenados por nombre). Handler: `GetGlobalAvailabilityQueryHandler`. Tests: `GetGlobalAvailabilityQueryHandlerTests` + `GlobalAvailabilityFlowTests`.
- Suite final: **80 unit + 13 integración = 93/93**. `dotnet test MediCore.slnx`.

## 11. Phase 6 — HU-04 Portal de Paciente

- **Modelo auth:** nuevo rol `UserRole.Paciente`; `User.PatientId` vincula la cuenta al paciente. `RegisterPatientAccountCommand` (`POST /api/auth/patient-account`, AdminOnly) valida email/contraseña (≥8), existencia del paciente y email único; la cuenta nace con rol Paciente. `JwtTokenGenerator` añade el claim `patientId` cuando `User.PatientId` existe.
- **Portal (`/api/patient-portal`, policy `PatientOnly`):** `GetUpcomingAppointmentsQuery` (citas futuras con status activo, orden asc, con nombre/especialidad del médico vía diccionario) y `GetActivePrescriptionsQuery` (solo `Emitida`, con nombre de medicamento/médico). Ownership por claims: el `patientId` viene del JWT; sin claim → 403. Los nombres desconocidos usan fallback "Profesional de salud".
- **Recordatorios:** `Appointment.ReminderSentAt` + `GetPendingReminderAppointmentsAsync` (ventana 24 h, sin recordatorio previo, status activos). `AppointmentReminderProcessor` envía el email por paciente con cuenta portal y marca el recordatorio (idempotente: una segunda pasada devuelve 0). `AppointmentReminderHostedService` (BackgroundService cada 15 min) resuelve el processor scoped con `IServiceScopeFactory`. Requirió `Microsoft.Extensions.Hosting.Abstractions 9.0.18` en Infrastructure.
- Tests nuevos: `RegisterPatientAccountCommandHandlerTests` (5), `PatientPortalQueryHandlerTests` (5), `AppointmentReminderProcessorTests` (3), `PatientPortalFlowTests` (4: upcoming con aislamiento entre dos pacientes, recetas vigentes con despacho de la otra, nombres + 401 sin token, recordatorios idempotentes).
- Suite final: **93 unit + 17 integración = 110/110**. `dotnet test MediCore.slnx`.

## 12. Phase 7 — Filters + SMTP real + rol Enfermero (triaje)

- **Filters (sección 4 del doc):** `src/Hospital.API/Filters/ModelValidationFilter.cs` y `PerformanceLoggingFilter.cs` (`IEndpointFilter`). Aplicados globalmente en `EndpointExtensions.AddCommonFilters()` a los 11 grupos vía `RouteGroupBuilder.AddEndpointFilter<T>()`. `ModelValidationFilter`: body `application/json` con argumento null → 400; no interfiere con auth (la autorización es middleware y corre antes). Tests: `EndpointFilterTests` (body vacío → 400; request válido → 201).
- **SMTP real:** paquete **MailKit 4.17.0** en Infrastructure. `Settings/SmtpSettings.cs` (Options Pattern, sección `SmtpSettings`, registro en Program.cs). `Services/SmtpEmailSender.cs`: envía con MailKit cuando `Enabled && Host && FromEmail`; si no, **fallback a log sin lanzar** (los tests de integración siguen verdes sin servidor de correo). El dummy antiguo quedó como `LoggingEmailSender` (ya no registrado). Variables `SMTP_*` en docker-compose. `SmtpEmailSenderTests` (3: disabled/host vacío/from vacío → no lanza).
- **Rol Enfermero = triaje:** entidad `VitalsRecord` + `IVitalsRepository`/`VitalsRepository` (colección `VitalsRecords`, índice `PatientId + RecordedAt desc`). Feature `Features/Nursing/` (command `CreateVitalsRecordCommand`, query `GetPatientVitalsQuery`). Endpoints `/api/nursing/vitals` (POST NurseOnly, GET patient NurseOrDoctor). Políticas nuevas: `NurseOnly`, `NurseOrDoctor`. `RecordedBy` desde `ClaimTypes.NameIdentifier` (el claim `sub` del JWT se mapea a NameIdentifier; `FindFirstValue("sub")` da null — trampa ya documentada). Tests: `VitalsRecordHandlerTests` (5) + `NursingFlowTests` (3: flujo completo con verificación en DB, validaciones 400/NotFound, 403 para rol no enfermero).
- Suite final: **101 unit + 22 integración = 123/123**. `dotnet test MediCore.slnx`.

## 13. Continuación de sesión — estado y próximos pasos

### Estado al cerrar la sesión (Phase 7 completa)
- Todo list Phase 7: **7/7 completado**. No hay trabajo a medio hacer.
- **Suite 123/123** (101 unit + 22 integración). Build `0 errores`, warnings preexistentes: CS0618 (`MediCoreApiFactory.cs:14`) y CS8604 (`GetGlobalAvailabilityQueryHandlerTests.cs:103`, `PatientPortalQueryHandlerTests.cs:60`).
- Comandos de verificación: `dotnet build MediCore.slnx` y `dotnet test MediCore.slnx` (integración requiere Docker daemon).
- Docker: daemon OK; tras smoke tests se hace `docker compose down` (relanzar con `docker compose up --build`).

### Siguiente sesión — orden recomendado
1. **Leer este .md** (secciones 2, 3, 4, 5, 9-13) y `Documento Técnico_ MediCore HMS - Documentos de Google.md` para detectar próximas HUs.
2. Preguntar al cliente qué HU sigue (candidatos del documento: restantes de portal/agenda; revisar sección 9 para pendientes confirmados).
3. Al terminar cada HU: suite completa + actualizar este archivo (secciones 2, 5, 9, y nueva sección de fase).

### Pendientes/oportunidades conocidas (para proponer al cliente)
- Configurar credenciales SMTP reales (`SMTP_*` / `SmtpSettings`) en el entorno de despliegue para que los recordatorios de HU-04 se envíen de verdad (por defecto `Enabled: false` → fallback log).
- Catálogo de tarifas para consultas/exámenes (hoy la factura acepta precios explícitos en el request).
- Confirmar resto de HUs del documento técnico (portal web con frontend quedó descartado; API-only).
- Benchmark del NFR de rendimiento (<200 ms en historiales) — los índices existen pero no hay evidencia medida.