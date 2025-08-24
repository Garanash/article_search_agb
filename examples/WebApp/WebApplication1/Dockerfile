# Используем официальный образ .NET SDK для сборки
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копируем sln и все проекты
COPY ../WebApplication1.sln ./
COPY ../WebApplication1 ./WebApplication1
COPY ../DataAccess ./DataAccess

WORKDIR /src/WebApplication1

# Копируем CSPROJ и восстанавливаем зависимости
RUN dotnet restore

# Копируем остальные файлы и собираем приложение
RUN dotnet publish -c Release -o /app/out

# Используем рантайм-образ для запуска
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out ./

# Убеждаемся, что статические файлы доступны
RUN ls -la wwwroot/

EXPOSE 80
ENTRYPOINT ["dotnet", "WebApplication1.dll"]
