FROM python:3.11

# Установить tesseract-ocr
RUN apt-get update && apt-get install -y tesseract-ocr

WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple/ -r requirements.txt
CMD ["python", "bot.py"] 