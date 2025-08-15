#!/usr/bin/env python3
"""
Comprehensive Test Runner for Article Search Application
Runs backend and frontend tests and generates detailed reports
"""

import subprocess
import sys
import os
import time
from datetime import datetime
import json

class TestRunner:
    def __init__(self):
        self.backend_results = {}
        self.frontend_results = {}
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.skipped_tests = 0
        self.start_time = None
        self.end_time = None

    def run_backend_tests(self):
        """Run backend tests using pytest"""
        print("🔧 Запуск тестов бэкенда...")
        print("=" * 50)
        
        try:
            # Change to backend directory
            os.chdir('backend')
            
            # Install test dependencies if not present
            print("📦 Установка зависимостей для тестов...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements-test.txt'], 
                         check=True, capture_output=True)
            
            # Run tests with coverage
            print("🧪 Запуск тестов...")
            result = subprocess.run([
                sys.executable, '-m', 'pytest', 
                'tests/', 
                '--tb=short',
                '--cov=app',
                '--cov-report=term-missing',
                '--cov-report=html:coverage_html',
                '-v'
            ], capture_output=True, text=True)
            
            # Parse test results
            self.parse_pytest_output(result.stdout, result.stderr)
            
            # Generate coverage report
            if os.path.exists('coverage_html'):
                print(f"📊 Отчет о покрытии: file://{os.path.abspath('coverage_html/index.html')}")
            
            os.chdir('..')
            return result.returncode == 0
            
        except Exception as e:
            print(f"❌ Ошибка при запуске тестов бэкенда: {e}")
            os.chdir('..')
            return False

    def run_frontend_tests(self):
        """Run frontend tests using Jest"""
        print("\n🎨 Запуск тестов фронтенда...")
        print("=" * 50)
        
        try:
            # Change to frontend directory
            os.chdir('frontend')
            
            # Check if node_modules exists
            if not os.path.exists('node_modules'):
                print("📦 Установка зависимостей...")
                subprocess.run(['npm', 'install'], check=True, capture_output=True)
            
            # Install test dependencies
            print("📦 Установка зависимостей для тестов...")
            subprocess.run(['npm', 'install', '--save-dev'], check=True, capture_output=True)
            
            # Run tests
            print("🧪 Запуск тестов...")
            result = subprocess.run(['npm', 'test', '--', '--ci', '--coverage', '--watchAll=false'], 
                                 capture_output=True, text=True)
            
            # Parse test results
            self.parse_jest_output(result.stdout, result.stderr)
            
            os.chdir('..')
            return result.returncode == 0
            
        except Exception as e:
            print(f"❌ Ошибка при запуске тестов фронтенда: {e}")
            os.chdir('..')
            return False

    def parse_pytest_output(self, stdout, stderr):
        """Parse pytest output to extract test statistics"""
        lines = stdout.split('\n')
        
        for line in lines:
            if 'passed' in line and 'failed' in line and 'skipped' in line:
                # Extract numbers from line like "5 passed, 1 failed, 2 skipped in 2.34s"
                parts = line.split(',')
                for part in parts:
                    if 'passed' in part:
                        self.passed_tests += int(part.strip().split()[0])
                    elif 'failed' in part:
                        self.failed_tests += int(part.strip().split()[0])
                    elif 'skipped' in part:
                        self.skipped_tests += int(part.strip().split()[0])
                break
        
        self.total_tests = self.passed_tests + self.failed_tests + self.skipped_tests
        
        # Store detailed results
        self.backend_results = {
            'stdout': stdout,
            'stderr': stderr,
            'total': self.total_tests,
            'passed': self.passed_tests,
            'failed': self.failed_tests,
            'skipped': self.skipped_tests
        }

    def parse_jest_output(self, stdout, stderr):
        """Parse Jest output to extract test statistics"""
        lines = stdout.split('\n')
        
        for line in lines:
            if 'Tests:' in line and 'passed' in line and 'total' in line:
                # Extract numbers from line like "Tests: 15 passed, 15 total"
                parts = line.split(',')
                for part in parts:
                    if 'passed' in part:
                        self.passed_tests += int(part.strip().split()[0])
                    elif 'total' in part:
                        total = int(part.strip().split()[0])
                        self.total_tests += total
                        self.failed_tests += (total - self.passed_tests)
                break
        
        # Store detailed results
        self.frontend_results = {
            'stdout': stdout,
            'stderr': stderr,
            'total': self.total_tests,
            'passed': self.passed_tests,
            'failed': self.failed_tests,
            'skipped': self.skipped_tests
        }

    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("📋 ОТЧЕТ О ТЕСТИРОВАНИИ")
        print("=" * 80)
        
        # Test Summary
        print(f"\n📊 ОБЩАЯ СТАТИСТИКА:")
        print(f"   Всего тестов: {self.total_tests}")
        print(f"   Успешно: {self.passed_tests} ✅")
        print(f"   Провалено: {self.failed_tests} ❌")
        print(f"   Пропущено: {self.skipped_tests} ⏭️")
        
        if self.total_tests > 0:
            success_rate = (self.passed_tests / self.total_tests) * 100
            print(f"   Процент успеха: {success_rate:.1f}%")
        
        # Timing
        if self.start_time and self.end_time:
            duration = self.end_time - self.start_time
            print(f"\n⏱️  Время выполнения: {duration:.2f} секунд")
        
        # Backend Results
        if self.backend_results:
            print(f"\n🔧 РЕЗУЛЬТАТЫ ТЕСТОВ БЭКЕНДА:")
            print(f"   Тестов: {self.backend_results.get('total', 0)}")
            print(f"   Успешно: {self.backend_results.get('passed', 0)}")
            print(f"   Провалено: {self.backend_results.get('failed', 0)}")
            print(f"   Пропущено: {self.backend_results.get('skipped', 0)}")
        
        # Frontend Results
        if self.frontend_results:
            print(f"\n🎨 РЕЗУЛЬТАТЫ ТЕСТОВ ФРОНТЕНДА:")
            print(f"   Тестов: {self.frontend_results.get('total', 0)}")
            print(f"   Успешно: {self.frontend_results.get('passed', 0)}")
            print(f"   Провалено: {self.frontend_results.get('failed', 0)}")
            print(f"   Пропущено: {self.frontend_results.get('skipped', 0)}")
        
        # Recommendations
        print(f"\n💡 РЕКОМЕНДАЦИИ:")
        if self.failed_tests == 0 and self.total_tests > 0:
            print("   🎉 Все тесты прошли успешно! Код готов к продакшену.")
        elif self.failed_tests > 0:
            print(f"   ⚠️  Обнаружено {self.failed_tests} проваленных тестов. Требуется исправление.")
        if self.skipped_tests > 0:
            print(f"   ℹ️  {self.skipped_tests} тестов пропущено. Проверьте зависимости.")
        
        # Save detailed report
        self.save_detailed_report()

    def save_detailed_report(self):
        """Save detailed test report to file"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_tests': self.total_tests,
                'passed_tests': self.passed_tests,
                'failed_tests': self.failed_tests,
                'skipped_tests': self.skipped_tests,
                'success_rate': (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
            },
            'backend_results': self.backend_results,
            'frontend_results': self.frontend_results,
            'duration': (self.end_time - self.start_time) if self.start_time and self.end_time else 0
        }
        
        with open('test_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Подробный отчет сохранен в: test_report.json")

    def run_all_tests(self):
        """Run all tests and generate report"""
        self.start_time = time.time()
        
        print("🚀 ЗАПУСК КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ")
        print("=" * 80)
        print(f"Время начала: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run backend tests
        backend_success = self.run_backend_tests()
        
        # Run frontend tests
        frontend_success = self.run_frontend_tests()
        
        self.end_time = time.time()
        
        # Generate report
        self.generate_report()
        
        # Return overall success
        return backend_success and frontend_success

def main():
    """Main function"""
    runner = TestRunner()
    
    try:
        success = runner.run_all_tests()
        
        if success:
            print("\n🎉 Все тесты выполнены успешно!")
            sys.exit(0)
        else:
            print("\n❌ Некоторые тесты провалились!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️  Тестирование прервано пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()


