'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
const NoticeContext = createContext<(message: string) => void>(() => {});
export const useNotice = () => useContext(NoticeContext);
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  return <NoticeContext.Provider value={setMessage}>
    {children}
    <Modal isOpen={Boolean(message)} onClose={() => setMessage('')} title="Aviso" maxWidth="sm">
      <p role="alert" className="text-sm text-slate-700 dark:text-slate-200">{message}</p>
      <div className="mt-4 flex justify-end"><Button onClick={() => setMessage('')}>Entendido</Button></div>
    </Modal>
  </NoticeContext.Provider>;
}
