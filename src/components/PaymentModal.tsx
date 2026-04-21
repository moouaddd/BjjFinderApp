import { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  amount: number;
  type: 'class' | 'seminar' | 'camp';
}

type Step = 'form' | 'processing' | 'success' | 'error';

export default function PaymentModal({ isOpen, onClose, title, description, amount, type }: PaymentModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({
    name: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nombre requerido';
    if (!form.email.includes('@')) e.email = 'Email inválido';
    if (form.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Número de tarjeta inválido';
    if (form.expiry.length < 5) e.expiry = 'Fecha inválida';
    if (form.cvv.length < 3) e.cvv = 'CVV inválido';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep('processing');
    setTimeout(() => setStep('success'), 2000);
  };

  const handleClose = () => {
    setStep('form');
    setForm({ name: '', email: '', cardNumber: '', expiry: '', cvv: '' });
    setErrors({});
    onClose();
  };

  const typeLabel = type === 'class' ? 'clase' : type === 'seminar' ? 'seminario' : 'campamento';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-dark-700 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-800">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-gold-400" />
            <span className="text-white font-semibold">Pago seguro</span>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {step === 'form' && (
            <>
              {/* Order summary */}
              <div className="bg-dark-800 rounded-xl p-4 mb-5 border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Reservando {typeLabel}</p>
                <p className="text-white font-semibold text-sm leading-snug">{title}</p>
                <p className="text-gray-400 text-xs mt-1">{description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="text-gray-400 text-sm">Total</span>
                  <span className="text-gold-400 font-bold text-xl">{amount} €</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Nombre completo</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Juan García López"
                      className={`w-full bg-dark-900 border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-gold-500 transition-colors ${errors.name ? 'border-red-500' : 'border-white/10'}`}
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="juan@email.com"
                      className={`w-full bg-dark-900 border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-gold-500 transition-colors ${errors.email ? 'border-red-500' : 'border-white/10'}`}
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Número de tarjeta</label>
                    <input
                      type="text"
                      value={form.cardNumber}
                      onChange={(e) => setForm({ ...form, cardNumber: formatCard(e.target.value) })}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className={`w-full bg-dark-900 border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-gold-500 transition-colors font-mono ${errors.cardNumber ? 'border-red-500' : 'border-white/10'}`}
                    />
                    {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Vencimiento</label>
                    <input
                      type="text"
                      value={form.expiry}
                      onChange={(e) => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                      placeholder="MM/AA"
                      maxLength={5}
                      className={`w-full bg-dark-900 border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-gold-500 transition-colors font-mono ${errors.expiry ? 'border-red-500' : 'border-white/10'}`}
                    />
                    {errors.expiry && <p className="text-red-400 text-xs mt-1">{errors.expiry}</p>}
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">CVV</label>
                    <input
                      type="text"
                      value={form.cvv}
                      onChange={(e) => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      placeholder="123"
                      maxLength={4}
                      className={`w-full bg-dark-900 border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-gold-500 transition-colors font-mono ${errors.cvv ? 'border-red-500' : 'border-white/10'}`}
                    />
                    {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Lock size={16} />
                  Pagar {amount} €
                </button>

                <p className="text-center text-gray-600 text-xs flex items-center justify-center gap-1">
                  <Lock size={11} />
                  Pago seguro con cifrado SSL de 256 bits
                </p>
              </form>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-gold-500/30 border-t-gold-500 animate-spin" />
              <p className="text-white font-semibold">Procesando pago...</p>
              <p className="text-gray-500 text-sm">Por favor, no cierres esta ventana</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <CheckCircle size={36} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">¡Reserva confirmada!</p>
                <p className="text-gray-400 text-sm mt-1">Recibirás un email de confirmación en breve</p>
              </div>
              <div className="bg-dark-800 rounded-xl p-4 w-full text-left border border-white/5">
                <p className="text-xs text-gray-500 mb-1">Resumen</p>
                <p className="text-white font-medium text-sm">{title}</p>
                <p className="text-gold-400 font-bold mt-1">{amount} € pagados</p>
              </div>
              <button
                onClick={handleClose}
                className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <AlertCircle size={36} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Error en el pago</p>
                <p className="text-gray-400 text-sm mt-1">Por favor, comprueba tus datos e inténtalo de nuevo</p>
              </div>
              <button
                onClick={() => setStep('form')}
                className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
