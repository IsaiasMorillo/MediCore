# https://aka.ms/customizecontainer
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["src/Hospital.Domain/Hospital.Domain.csproj", "src/Hospital.Domain/"]
COPY ["src/Hospital.Application/Hospital.Application.csproj", "src/Hospital.Application/"]
COPY ["src/Hospital.Infrastructure/Hospital.Infrastructure.csproj", "src/Hospital.Infrastructure/"]
COPY ["src/Hospital.API/Hospital.API.csproj", "src/Hospital.API/"]
RUN dotnet restore "src/Hospital.API/Hospital.API.csproj"

COPY src/ .
WORKDIR /src/Hospital.API
RUN dotnet publish "Hospital.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Hospital.API.dll"]