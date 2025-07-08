FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --timeout=120 --disable-pip-version-check --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org --trusted-host mirrors.aliyun.com -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt

# Добавляем wait-for-it.sh для ожидания базы данных
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY . .

# Централизованный запуск миграций и инициализации
CMD ["/wait-for-it.sh", "postgres:5432", "--", "/bin/bash", "/app/run.sh"] 