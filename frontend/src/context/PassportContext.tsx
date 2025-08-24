/* eslint-disable no-undef */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ProductData {
  code_1c: string;
  name: string;
  article: string;
  matrix: string;
  drilling_depth: string;
  height: string;
  thread: string;
}

export interface GeneratedPassport {
  id: string;
  passport_number: string;
  product_data: ProductData;
  quantity: number;
  created_at: string;
  status: 'active' | 'archived';
}

interface PassportContextType {
  passports: GeneratedPassport[];
  addPassports: (newPassports: GeneratedPassport[]) => void;
  updatePassportStatus: (id: string, status: 'active' | 'archived') => void;
  deletePassport: (id: string) => void;
  getNextSequenceNumber: () => number;
  resetSequenceCounter: () => void;
}

const PassportContext = createContext<PassportContextType | undefined>(undefined);

export const usePassports = () => {
  const context = useContext(PassportContext);
  if (context === undefined) {
    throw new Error('usePassports must be used within a PassportProvider');
  }
  return context;
};

interface PassportProviderProps {
  children: ReactNode;
}

export const PassportProvider: React.FC<PassportProviderProps> = ({ children }) => {
  const [passports, setPassports] = useState<GeneratedPassport[]>([]);
  const [sequenceCounter, setSequenceCounter] = useState(1);

  // Загружаем паспорта из localStorage при инициализации
  useEffect(() => {
    const savedPassports = localStorage.getItem('passports');
    const savedCounter = localStorage.getItem('passportSequenceCounter');
    
    if (savedPassports) {
      try {
        const parsedPassports = JSON.parse(savedPassports);
        setPassports(parsedPassports);
        
        // Находим максимальный номер среди существующих паспортов
        let maxNumber = 0;
        parsedPassports.forEach((passport: GeneratedPassport) => {
          const match = passport.passport_number.match(/(\d{7})\d{2}$/);
          if (match) {
            const number = parseInt(match[1], 10);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        });
        
        // Устанавливаем счетчик на следующий номер после максимального
        setSequenceCounter(maxNumber + 1);
      } catch (error) {
        console.error('Ошибка загрузки паспортов из localStorage:', error);
      }
    }
    
    if (savedCounter) {
      try {
        const counter = parseInt(savedCounter, 10);
        // Используем максимальное значение между сохраненным счетчиком и вычисленным
        setSequenceCounter(prev => Math.max(prev, counter));
      } catch (error) {
        console.error('Ошибка загрузки счетчика из localStorage:', error);
      }
    }
  }, []);

  // Сохраняем паспорта в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('passports', JSON.stringify(passports));
  }, [passports]);

  // Сохраняем счетчик в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('passportSequenceCounter', sequenceCounter.toString());
  }, [sequenceCounter]);

  const addPassports = (newPassports: GeneratedPassport[]) => {
    // Проверяем, что новые паспорта не дублируют существующие номера
    const existingNumbers = new Set(passports.map(p => p.passport_number));
    const duplicates = newPassports.filter(p => existingNumbers.has(p.passport_number));
    
    if (duplicates.length > 0) {
      console.warn('Обнаружены дублирующиеся номера паспортов:', duplicates.map(p => p.passport_number));
      // Можно добавить логику для автоматического исправления дублирующихся номеров
    }
    
    setPassports(prev => [...prev, ...newPassports]);
  };

  const updatePassportStatus = (id: string, status: 'active' | 'archived') => {
    setPassports(prev => 
      prev.map(passport => 
        passport.id === id ? { ...passport, status } : passport
      )
    );
  };

  const deletePassport = (id: string) => {
    setPassports(prev => prev.filter(passport => passport.id !== id));
  };

  const getNextSequenceNumber = () => {
    // Получаем текущий номер и увеличиваем счетчик
    let currentNumber = sequenceCounter;
    
    // Проверяем, что номер действительно уникален среди существующих паспортов
    let isUnique = false;
    let attempts = 0;
    let finalNumber = currentNumber;
    
    while (!isUnique && attempts < 1000) {
      const exists = passports.some(passport => {
        const match = passport.passport_number.match(/(\d{7})\d{2}$/);
        return match && parseInt(match[1], 10) === finalNumber;
      });
      
      if (!exists) {
        isUnique = true;
      } else {
        finalNumber++;
        attempts++;
      }
    }
    
    // Устанавливаем следующий номер для будущего использования
    setSequenceCounter(finalNumber + 1);
    
    return finalNumber;
  };

  const resetSequenceCounter = () => {
    setSequenceCounter(1);
  };

  const value: PassportContextType = {
    passports,
    addPassports,
    updatePassportStatus,
    deletePassport,
    getNextSequenceNumber,
    resetSequenceCounter
  };

  return (
    <PassportContext.Provider value={value}>
      {children}
    </PassportContext.Provider>
  );
};
