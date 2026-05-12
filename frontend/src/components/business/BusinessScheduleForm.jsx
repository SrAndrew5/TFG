import { useState } from 'react';
import { HiOutlineCalendar, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';

const DIAS = [
  { id: 'lunes',     label: 'Lunes' },
  { id: 'martes',    label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves',    label: 'Jueves' },
  { id: 'viernes',   label: 'Viernes' },
  { id: 'sabado',    label: 'Sábado' },
  { id: 'domingo',   label: 'Domingo' },
];

export default function BusinessScheduleForm({ horario, festivos, onChangeHorario, onChangeFestivos }) {
  const [newFestivo, setNewFestivo] = useState('');

  const toggleDiaCerrado = (dia) => {
    const current = horario[dia] || {};
    const isClosed = !current.cerrado;
    
    onChangeHorario({
      ...horario,
      [dia]: isClosed
        ? { cerrado: true, franjas: [] }
        : { cerrado: false, franjas: [{ abre: '09:00', cierra: '14:00' }, { abre: '16:00', cierra: '20:00' }] },
    });
  };

  const updateFranja = (dia, index, field, value) => {
    const current = horario[dia] || {};
    const franjas = [...(current.franjas || [])];
    franjas[index] = { ...franjas[index], [field]: value };
    
    onChangeHorario({
      ...horario,
      [dia]: { ...current, franjas },
    });
  };

  const addFranja = (dia) => {
    const current = horario[dia] || {};
    const franjas = [...(current.franjas || []), { abre: '10:00', cierra: '14:00' }];
    onChangeHorario({
      ...horario,
      [dia]: { ...current, franjas },
    });
  };

  const removeFranja = (dia, index) => {
    const current = horario[dia] || {};
    const franjas = [...(current.franjas || [])];
    franjas.splice(index, 1);
    onChangeHorario({
      ...horario,
      [dia]: { ...current, franjas },
    });
  };

  const addFestivo = () => {
    if (!newFestivo) return;
    if (!festivos.includes(newFestivo)) {
      onChangeFestivos([...festivos, newFestivo]);
    }
    setNewFestivo('');
  };

  const removeFestivo = (f) => {
    onChangeFestivos(festivos.filter((x) => x !== f));
  };

  return (
    <div className="space-y-8">
      {/* Horario regular */}
      <div>
        <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
          <HiOutlineCalendar className="w-5 h-5 text-brand-500" />
          Horario Regular
        </h3>
        <div className="space-y-4">
          {DIAS.map((d) => {
            const dia = horario[d.id] || { cerrado: false, franjas: [{ abre: '09:00', cierra: '20:00' }] };
            const cerrado = !!dia.cerrado;
            // Migrar formato antiguo {abre, cierra} a franjas
            const franjas = dia.franjas || (dia.abre && dia.cierra ? [{ abre: dia.abre, cierra: dia.cierra }] : []);

            return (
              <div key={d.id} className="rounded-2xl bg-surface-subtle border border-border-base overflow-hidden">
                {/* Day header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-black text-brand-900 w-24 flex-shrink-0">{d.label}</span>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={cerrado}
                      onChange={() => toggleDiaCerrado(d.id)}
                      className="w-4 h-4 rounded border-border-strong text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-500"
                    />
                    <span className="text-xs font-bold text-text-muted">Cerrado</span>
                  </label>
                </div>

                {!cerrado && (
                  <div className="px-4 pb-3 space-y-2 border-t border-border-base pt-3">
                    {franjas.map((franja, idx) => (
                      <div key={idx} className="flex items-center gap-2 min-w-0">
                        <input
                          type="time"
                          value={franja.abre || ''}
                          onChange={(e) => updateFranja(d.id, idx, 'abre', e.target.value)}
                          className="flex-1 min-w-0 border border-border-base rounded-xl px-2 py-1.5 text-sm font-mono bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none"
                        />
                        <span className="text-text-muted font-bold text-xs flex-shrink-0">–</span>
                        <input
                          type="time"
                          value={franja.cierra || ''}
                          onChange={(e) => updateFranja(d.id, idx, 'cierra', e.target.value)}
                          className="flex-1 min-w-0 border border-border-base rounded-xl px-2 py-1.5 text-sm font-mono bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeFranja(d.id, idx)}
                          className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar franja"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addFranja(d.id)}
                      className="text-[11px] font-black text-brand-500 hover:text-brand-700 flex items-center gap-1 mt-1 uppercase tracking-widest"
                    >
                      <HiOutlinePlus className="w-3.5 h-3.5" /> Añadir franja
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Días Festivos / Cerrados */}
      <div className="pt-6 border-t border-border-base">
        <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
          Días Festivos o Cerrados
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Añade fechas específicas en las que el negocio estará cerrado excepcionalmente.
        </p>
        
        <div className="flex items-center gap-3 mb-4">
          <input
            type="date"
            value={newFestivo}
            onChange={(e) => setNewFestivo(e.target.value)}
            className="input-field py-2 max-w-xs"
          />
          <button
            type="button"
            onClick={addFestivo}
            disabled={!newFestivo}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-50"
          >
            Añadir Festivo
          </button>
        </div>

        {festivos.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {festivos.sort().map((f) => (
              <span key={f} className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 text-sm font-bold rounded-lg border border-brand-200">
                {new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                <button
                  type="button"
                  onClick={() => removeFestivo(f)}
                  className="hover:text-danger-text focus:outline-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">No hay días festivos configurados.</p>
        )}
      </div>
    </div>
  );
}
