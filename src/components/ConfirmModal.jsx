import { useState, useEffect } from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="glass" style={{ width: '400px', padding: '20px', textAlign: 'center', background: 'var(--bg-color)' }}>
        <h3 style={{ color: step === 2 ? 'var(--danger)' : 'white', marginBottom: '15px' }}>
          {step === 1 ? title : '⚠️ ADVERTENCIA'}
        </h3>
        <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
          {step === 1 ? message : '¿Estás 100% seguro de eliminar esto? Esta acción NO se puede deshacer.'}
        </p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            className="btn-primary" 
            style={{ background: 'transparent', border: '1px solid var(--glass-border)' }} 
            onClick={onClose}
          >
            Cancelar
          </button>
          
          <button 
            className="btn-primary" 
            style={{ background: 'var(--danger)' }}
            onClick={() => {
              if (step === 1) {
                setStep(2);
              } else {
                onConfirm();
                onClose();
              }
            }}
          >
            {step === 1 ? 'Sí, eliminar' : 'Sí, estoy seguro'}
          </button>
        </div>
      </div>
    </div>
  );
}
