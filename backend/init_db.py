import os
import sys
from app.database import engine, Base

if __name__ == "__main__":
    print("=== Создание всех таблиц в Postgres через SQLAlchemy ===")
    Base.metadata.create_all(bind=engine)
    print("✅ Все таблицы созданы/обновлены в Postgres!")

    # Запуск скриптов для наполнения начальными данными
    base_dir = os.path.dirname(os.path.abspath(__file__))
    def run(script):
        print(f"=== Запуск {script} ===")
        result = os.system(f"python {script}")
        if result != 0:
            print(f"❌ Ошибка при выполнении {script}")
        else:
            print(f"✅ {script} выполнен успешно")

    run(os.path.join(base_dir, "create_test_user.py"))
    run(os.path.join(base_dir, "create_manager_user.py"))
    run(os.path.join(base_dir, "create_new_user.py"))
    run(os.path.join(base_dir, "create_admin_user.py")) 