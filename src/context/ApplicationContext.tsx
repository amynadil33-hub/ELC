import React, { createContext, useContext, useState } from 'react';
import { Application, Course } from '@/types';

interface ApplicationContextType {
  selectedCourse: Course | null;
  applicationData: Application | null;
  setSelectedCourse: (course: Course | null) => void;
  setApplicationData: (data: Application | null) => void;
  clearApplication: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [applicationData, setApplicationData] = useState<Application | null>(null);

  const clearApplication = () => {
    setSelectedCourse(null);
    setApplicationData(null);
  };

  return (
    <ApplicationContext.Provider value={{
      selectedCourse,
      applicationData,
      setSelectedCourse,
      setApplicationData,
      clearApplication,
    }}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
}
