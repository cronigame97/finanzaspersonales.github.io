import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  Plus, 
  Trash2, 
  Search, 
  PieChart as PieChartIcon, 
  DollarSign, 
  Calendar,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  HandCoins,
  ArrowRightLeft,
  Database,
  Lock,
  Cloud,
  Settings,
  Moon,
  Sun,
  Pencil,
  Download,
  Upload,
  Repeat,
  BellRing,
  BarChart3,
  Sliders,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  Building2,
  Archive,
  History,
  MessageCircle,
  Send,
  Users,
  FileText,
  Printer
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

// Constantes
const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CATEGORIAS_GASTOS_DEFECTO = [
  'Alimentación', 'Vivienda', 'Transporte', 'Servicios', 
  'Entretenimiento', 'Salud', 'Educación', 'Compras', 'Pago de Tarjeta', 'Otros Gastos'
];

const CATEGORIAS_INGRESOS_DEFECTO = [
  'Sueldo / Salario', 'Ventas', 'Freelance', 'Inversiones', 'Regalo', 'Otros Ingresos'
];

// Valores por defecto completamente limpios (sin datos iniciales ni saldos ficticios)
const CUENTAS_DEFECTO = [];
const TARJETAS_DEFECTO = [];
const PRESTAMOS_DEFECTO = [];
const TRANSACCIONES_DEFECTO = [];

const COLORES_CATEGORIAS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B', 
  '#8B5CF6', '#14B8A6', '#EF4444', '#06B6D4', '#3B82F6', '#64748B'
];

// Helper para guardar/cargar en LocalStorage por Usuario
const loadUserData = (username, key, defaultValue) => {
  try {
    const saved = localStorage.getItem(`finanzas_app_${username}_${key}`);
    return saved !== null ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const saveUserData = (username, key, value) => {
  try {
    localStorage.setItem(`finanzas_app_${username}_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error("Error guardando datos en localStorage:", e);
  }
};

const leerJSON = (clave, porDefecto) => {
  try {
    const raw = localStorage.getItem(clave);
    return raw !== null ? JSON.parse(raw) : porDefecto;
  } catch (e) {
    return porDefecto;
  }
};

// Helpers de validación y saneamiento para evitar corrupción de estado o pantallas en blanco
const MONEDAS_VALIDAS = ['PEN', 'USD', 'EUR', 'CLP'];
const TIPOS_CAMBIO_DEFECTO = { USD_PEN: 3.75, EUR_PEN: 4.10, CLP_PEN: 0.0041, USD_CLP: 920, EUR_CLP: 1000 };

const esObjetoPlano = (val) => val !== null && typeof val === 'object' && !Array.isArray(val);

const sanearArrayObjetos = (arr, mapearItem) => {
  if (!Array.isArray(arr)) return null;
  return arr
    .filter((item) => esObjetoPlano(item))
    .map((item, idx) => mapearItem(item, idx));
};

const sanearArrayStrings = (arr) => {
  if (!Array.isArray(arr)) return null;
  return arr.filter((item) => typeof item === 'string' && item.trim().length > 0).map((s) => s.trim());
};

const sanearTransaccion = (t, idx) => ({
  ...t,
  id: typeof t.id === 'string' && t.id ? t.id : `trans_imp_${Date.now()}_${idx}`,
  tipo: ['ingreso', 'gasto', 'pago_tarjeta', 'pago_prestamo', 'transferencia_salida', 'transferencia_entrada'].includes(t.tipo) ? t.tipo : 'gasto',
  monto: Number.isFinite(Number(t.monto)) ? Number(t.monto) : 0,
  descripcion: typeof t.descripcion === 'string' ? t.descripcion : 'Movimiento',
  nota: typeof t.nota === 'string' ? t.nota : '',
  categoria: typeof t.categoria === 'string' && t.categoria ? t.categoria : 'Otros Gastos',
  fecha: typeof t.fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.fecha) ? t.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
  moneda: MONEDAS_VALIDAS.includes(t.moneda) ? t.moneda : 'PEN',
  esCredito: Boolean(t.esCredito),
  metodo: typeof t.metodo === 'string' ? t.metodo : 'General'
});

const sanearCuenta = (c, idx) => ({
  ...c,
  id: typeof c.id === 'string' && c.id ? c.id : `cta_imp_${Date.now()}_${idx}`,
  nombre: typeof c.nombre === 'string' && c.nombre ? c.nombre : `Cuenta ${idx + 1}`,
  tipo: typeof c.tipo === 'string' && c.tipo ? c.tipo : 'Bancaria',
  moneda: MONEDAS_VALIDAS.includes(c.moneda) ? c.moneda : 'PEN',
  saldoInicial: Number.isFinite(Number(c.saldoInicial)) ? Number(c.saldoInicial) : 0,
  color: typeof c.color === 'string' ? c.color : '#6366F1',
  cuentaVinculadaId: typeof c.cuentaVinculadaId === 'string' ? c.cuentaVinculadaId : null
});

const sanearTarjeta = (t, idx) => ({
  ...t,
  id: typeof t.id === 'string' && t.id ? t.id : `tarj_imp_${Date.now()}_${idx}`,
  nombre: typeof t.nombre === 'string' && t.nombre ? t.nombre : `Tarjeta ${idx + 1}`,
  limite: Number.isFinite(Number(t.limite)) ? Math.max(0, Number(t.limite)) : 0,
  deudaActual: Number.isFinite(Number(t.deudaActual)) ? Math.max(0, Number(t.deudaActual)) : 0,
  diaCorte: Number.isFinite(Number(t.diaCorte)) ? Number(t.diaCorte) : null,
  diaVencimiento: Number.isFinite(Number(t.diaVencimiento)) ? Number(t.diaVencimiento) : null,
  moneda: MONEDAS_VALIDAS.includes(t.moneda) ? t.moneda : 'PEN'
});

const sanearCuotaTarjeta = (c, idx) => {
  const totalCuotas = Math.max(1, parseInt(c.totalCuotas, 10) || 1);
  const cuotaActual = Math.min(totalCuotas, Math.max(1, parseInt(c.cuotaActual, 10) || 1));
  const montoTotal = Number.isFinite(Number(c.montoTotal)) ? Math.max(0, Number(c.montoTotal)) : 0;
  const valorCuotaMensual = Number.isFinite(Number(c.valorCuotaMensual)) ? Number(c.valorCuotaMensual) : montoTotal / totalCuotas;
  return {
    ...c,
    id: typeof c.id === 'string' && c.id ? c.id : `cuota_imp_${Date.now()}_${idx}`,
    tarjetaId: typeof c.tarjetaId === 'string' ? c.tarjetaId : '',
    tarjetaNombre: typeof c.tarjetaNombre === 'string' ? c.tarjetaNombre : 'Tarjeta',
    concepto: typeof c.concepto === 'string' && c.concepto ? c.concepto : 'Compra en cuotas',
    categoria: typeof c.categoria === 'string' && c.categoria ? c.categoria : 'Compras',
    montoTotal,
    valorCuotaMensual,
    saldoPendiente: Number.isFinite(Number(c.saldoPendiente)) ? Math.max(0, Number(c.saldoPendiente)) : 0,
    montoPagado: Number.isFinite(Number(c.montoPagado)) ? Math.max(0, Number(c.montoPagado)) : 0,
    cuotasPagadas: Number.isFinite(Number(c.cuotasPagadas)) ? Math.max(0, Number(c.cuotasPagadas)) : 0,
    totalCuotas,
    cuotaInicial: Math.min(totalCuotas, Math.max(1, parseInt(c.cuotaInicial, 10) || cuotaActual)),
    cuotaActual,
    cuotasGeneradas: Array.isArray(c.cuotasGeneradas) ? c.cuotasGeneradas : [cuotaActual],
    moneda: MONEDAS_VALIDAS.includes(c.moneda) ? c.moneda : 'PEN',
    fechaRegistro: typeof c.fechaRegistro === 'string' ? c.fechaRegistro : new Date().toISOString().slice(0, 10),
    completada: Boolean(c.completada)
  };
};

const sanearPrestamo = (p, idx) => ({
  ...p,
  id: typeof p.id === 'string' && p.id ? p.id : `prest_imp_${Date.now()}_${idx}`,
  tipo: p.tipo === 'otorgado' ? 'otorgado' : 'tomado',
  nombre: typeof p.nombre === 'string' && p.nombre ? p.nombre : `Préstamo ${idx + 1}`,
  entidad: typeof p.entidad === 'string' ? p.entidad : 'Contacto',
  telefono: typeof p.telefono === 'string' ? p.telefono : '',
  esInformal: Boolean(p.esInformal),
  montoTotal: Number.isFinite(Number(p.montoTotal)) ? Math.max(0, Number(p.montoTotal)) : 0,
  montoPendiente: Number.isFinite(Number(p.montoPendiente)) ? Math.max(0, Number(p.montoPendiente)) : 0,
  diaVencimiento: Number.isFinite(Number(p.diaVencimiento)) ? Number(p.diaVencimiento) : null,
  moneda: MONEDAS_VALIDAS.includes(p.moneda) ? p.moneda : 'PEN'
});

const sanearRecurrente = (r, idx) => ({
  ...r,
  id: typeof r.id === 'string' && r.id ? r.id : `rec_imp_${Date.now()}_${idx}`,
  tipo: r.tipo === 'ingreso' ? 'ingreso' : 'gasto',
  monto: Number.isFinite(Number(r.monto)) ? Math.max(0, Number(r.monto)) : 0,
  descripcion: typeof r.descripcion === 'string' && r.descripcion ? r.descripcion : 'Movimiento recurrente',
  categoria: typeof r.categoria === 'string' && r.categoria ? r.categoria : 'Otros Gastos',
  diaPago: Math.min(31, Math.max(1, parseInt(r.diaPago, 10) || 1)),
  moneda: MONEDAS_VALIDAS.includes(r.moneda) ? r.moneda : 'PEN',
  cuentaId: typeof r.cuentaId === 'string' ? r.cuentaId : null,
  metodo: typeof r.metodo === 'string' ? r.metodo : 'Cuenta',
  ultimoMesRegistrado: typeof r.ultimoMesRegistrado === 'string' ? r.ultimoMesRegistrado : null
});

const sanearCierre = (c, idx) => ({
  ...c,
  id: typeof c.id === 'string' && c.id ? c.id : `cierre_imp_${Date.now()}_${idx}`,
  periodo: typeof c.periodo === 'string' ? c.periodo : 'Periodo',
  fechaCierre: typeof c.fechaCierre === 'string' ? c.fechaCierre : '',
  ingresos: Number.isFinite(Number(c.ingresos)) ? Number(c.ingresos) : 0,
  gastos: Number.isFinite(Number(c.gastos)) ? Number(c.gastos) : 0,
  balanceNeto: Number.isFinite(Number(c.balanceNeto)) ? Number(c.balanceNeto) : 0,
  saldoLiquidoFinal: Number.isFinite(Number(c.saldoLiquidoFinal)) ? Number(c.saldoLiquidoFinal) : 0,
  moneda: MONEDAS_VALIDAS.includes(c.moneda) ? c.moneda : 'PEN'
});

const sanearMeta = (m, idx) => ({
  ...m,
  id: typeof m.id === 'string' && m.id ? m.id : `meta_imp_${Date.now()}_${idx}`,
  nombre: typeof m.nombre === 'string' && m.nombre ? m.nombre : `Meta ${idx + 1}`,
  montoObjetivo: Number.isFinite(Number(m.montoObjetivo)) ? Math.max(0, Number(m.montoObjetivo)) : 0,
  montoActual: Number.isFinite(Number(m.montoActual)) ? Math.max(0, Number(m.montoActual)) : 0,
  fechaLimite: typeof m.fechaLimite === 'string' ? m.fechaLimite : '',
  moneda: MONEDAS_VALIDAS.includes(m.moneda) ? m.moneda : 'PEN',
  color: typeof m.color === 'string' ? m.color : '#10B981'
});

// Función asíncrona de hash SHA-256 con fallback determinista para contraseñas y respuestas de seguridad
const hashTextoSeguro = async (texto) => {
  const normalizado = String(texto || '');
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`finanzas_salt_${normalizado}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return 'sha256_' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // Fallback si WebCrypto no está disponible en contexto no seguro
  }
  let h1 = 0xdeadbeef ^ normalizado.length;
  let h2 = 0x41c6ce57 ^ normalizado.length;
  for (let i = 0; i < normalizado.length; i++) {
    const ch = normalizado.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'h64_' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
};

const verificarSecreta = async (entrada, almacenada) => {
  if (!almacenada) return false;
  if (almacenada.startsWith('sha256_') || almacenada.startsWith('h64_')) {
    const hashedInput = await hashTextoSeguro(entrada);
    return hashedInput === almacenada;
  }
  // Compatibilidad con registros antiguos en texto plano
  return entrada === almacenada;
};

// ErrorBoundary para evitar que cualquier dato corrupto deje la aplicación en blanco
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Error inesperado de datos' };
  }

  handleRecuperar = () => {
    try {
      const activeUser = leerJSON('finanzas_active_user', null);
      if (activeUser && activeUser.username) {
        const prefix = `finanzas_app_${activeUser.username}_`;
        const keysConArrays = ['transacciones', 'cuentas_bancarias', 'tarjetas', 'cuotas_tarjetas', 'prestamos', 'recurrentes', 'metas', 'cierres_historicos'];
        keysConArrays.forEach((k) => {
          const val = leerJSON(`${prefix}${k}`, []);
          if (!Array.isArray(val)) {
            localStorage.setItem(`${prefix}${k}`, JSON.stringify([]));
          }
        });
        const pres = leerJSON(`${prefix}presupuestos`, {});
        if (!esObjetoPlano(pres)) {
          localStorage.setItem(`${prefix}presupuestos`, JSON.stringify({}));
        }
      }
    } catch (e) {
      // Ignorar errores de almacenamiento al recuperar
    }
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Se detectó un problema con los datos cargados</h2>
            <p className="text-xs text-slate-400">
              Un archivo de respaldo o registro malformado intentó cargarse en la vista. Tus datos válidos están protegidos y puedes restaurar la interfaz de inmediato.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleRecuperar}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Restaurar Aplicación
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('finanzas_active_user');
                  window.location.reload();
                }}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function FinanzasDashboard() {
  // --- ESTADO DE AUTENTICACIÓN ---
  const [user, setUser] = useState(() => {
    const activeUser = leerJSON('finanzas_active_user', null);
    return activeUser && typeof activeUser === 'object' && typeof activeUser.username === 'string'
      ? activeUser
      : null;
  });

  // --- CONFIGURACIÓN & MODO NOCHE ---
  const [darkMode, setDarkMode] = useState(() => {
    if (!user) return false;
    return loadUserData(user.username, 'dark_mode', false);
  });
  const [moneda, setMoneda] = useState(() => {
    if (!user) return 'PEN';
    return loadUserData(user.username, 'moneda', 'PEN');
  });
  const [monedaInicioForm, setMonedaInicioForm] = useState('PEN');

  const [tiposCambio, setTiposCambio] = useState(() => {
    if (!user) return { USD_PEN: 3.75, EUR_PEN: 4.10, CLP_PEN: 0.0041, USD_CLP: 920, EUR_CLP: 1000 };
    return loadUserData(user.username, 'tipos_cambio', { USD_PEN: 3.75, EUR_PEN: 4.10, CLP_PEN: 0.0041, USD_CLP: 920, EUR_CLP: 1000 });
  });

  // --- ESTADOS DE DATOS PRINCIPALES ---
  const [transacciones, setTransacciones] = useState(() => {
    if (!user) return TRANSACCIONES_DEFECTO;
    return sanearArrayObjetos(loadUserData(user.username, 'transacciones', TRANSACCIONES_DEFECTO), sanearTransaccion) || TRANSACCIONES_DEFECTO;
  });
  const [cuentasBancarias, setCuentasBancarias] = useState(() => {
    if (!user) return CUENTAS_DEFECTO;
    return sanearArrayObjetos(loadUserData(user.username, 'cuentas_bancarias', CUENTAS_DEFECTO), sanearCuenta) || CUENTAS_DEFECTO;
  });
  const [tarjetas, setTarjetas] = useState(() => {
    if (!user) return TARJETAS_DEFECTO;
    return sanearArrayObjetos(loadUserData(user.username, 'tarjetas', TARJETAS_DEFECTO), sanearTarjeta) || TARJETAS_DEFECTO;
  });
  const [cuotasTarjetas, setCuotasTarjetas] = useState(() => {
    if (!user) return [];
    return sanearArrayObjetos(loadUserData(user.username, 'cuotas_tarjetas', []), sanearCuotaTarjeta) || [];
  });
  const [prestamos, setPrestamos] = useState(() => {
    if (!user) return PRESTAMOS_DEFECTO;
    return sanearArrayObjetos(loadUserData(user.username, 'prestamos', PRESTAMOS_DEFECTO), sanearPrestamo) || PRESTAMOS_DEFECTO;
  });
  const [presupuestos, setPresupuestos] = useState(() => {
    if (!user) return {};
    const saved = loadUserData(user.username, 'presupuestos', {});
    return esObjetoPlano(saved) ? saved : {};
  });
  const [presupuestoGlobal, setPresupuestoGlobal] = useState(() => {
    if (!user) return 0;
    const val = Number(loadUserData(user.username, 'presupuesto_global', 0));
    return Number.isFinite(val) && val >= 0 ? val : 0;
  });
  const [recurrentes, setRecurrentes] = useState(() => {
    if (!user) return [];
    return sanearArrayObjetos(loadUserData(user.username, 'recurrentes', []), sanearRecurrente) || [];
  });
  const [metas, setMetas] = useState(() => {
    if (!user) return [];
    return sanearArrayObjetos(loadUserData(user.username, 'metas', []), sanearMeta) || [];
  });
  const [catGastosPers, setCatGastosPers] = useState(() => {
    if (!user) return CATEGORIAS_GASTOS_DEFECTO;
    const saved = sanearArrayStrings(loadUserData(user.username, 'cat_gastos_pers', CATEGORIAS_GASTOS_DEFECTO));
    return saved && saved.length > 0 ? saved : CATEGORIAS_GASTOS_DEFECTO;
  });
  const [catIngresosPers, setCatIngresosPers] = useState(() => {
    if (!user) return CATEGORIAS_INGRESOS_DEFECTO;
    const saved = sanearArrayStrings(loadUserData(user.username, 'cat_ingresos_pers', CATEGORIAS_INGRESOS_DEFECTO));
    return saved && saved.length > 0 ? saved : CATEGORIAS_INGRESOS_DEFECTO;
  });
  const [cierresHistoricos, setCierresHistoricos] = useState(() => {
    if (!user) return [];
    return sanearArrayObjetos(loadUserData(user.username, 'cierres_historicos', []), sanearCierre) || [];
  });

  // --- ESTADOS DE NAVEGACIÓN, FECHA Y AUTENTICACIÓN ---
  const [seccionActiva, setSeccionActiva] = useState('general');
  const [mesSeleccionado, setMesSeleccionado] = useState(() => new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(() => new Date().getFullYear());

  const [modoAuth, setModoAuth] = useState('login');
  const [usernameForm, setUsernameForm] = useState('');
  const [passwordForm, setPasswordForm] = useState('');
  const [preguntaForm, setPreguntaForm] = useState('¿Cuál es el nombre de tu primera mascota?');
  const [respuestaForm, setRespuestaForm] = useState('');
  const [errorAuth, setErrorAuth] = useState('');
  const [procesandoAuth, setProcesandoAuth] = useState(false);

  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState(false);
  const [pasoRecuperacion, setPasoRecuperacion] = useState(1);
  const [userRecuperar, setUserRecuperar] = useState('');
  const [preguntaUsuario, setPreguntaUsuario] = useState('');
  const [respuestaRecuperar, setRespuestaRecuperar] = useState('');
  const [nuevaPasswordForm, setNuevaPasswordForm] = useState('');
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState(null);

  const [mostrarModalBorrarCache, setMostrarModalBorrarCache] = useState(false);
  const [confirmarTextoBorrar, setConfirmarTextoBorrar] = useState('');
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);

  const [nuevaCatGasto, setNuevaCatGasto] = useState('');
  const [nuevaCatIngreso, setNuevaCatIngreso] = useState('');

  // Cargar datos al iniciar sesión o cambiar usuario (con saneamiento estricto)
  useEffect(() => {
    if (!user) return;
    setDarkMode(Boolean(loadUserData(user.username, 'dark_mode', false)));

    const monGuardada = loadUserData(user.username, 'moneda', 'PEN');
    setMoneda(MONEDAS_VALIDAS.includes(monGuardada) ? monGuardada : 'PEN');

    const tcGuardado = loadUserData(user.username, 'tipos_cambio', TIPOS_CAMBIO_DEFECTO);
    if (esObjetoPlano(tcGuardado)) {
      const tcLimpio = { ...TIPOS_CAMBIO_DEFECTO };
      Object.keys(TIPOS_CAMBIO_DEFECTO).forEach((k) => {
        const val = Number(tcGuardado[k]);
        if (Number.isFinite(val) && val > 0) tcLimpio[k] = val;
      });
      setTiposCambio(tcLimpio);
    } else {
      setTiposCambio(TIPOS_CAMBIO_DEFECTO);
    }

    const transGuardadas = sanearArrayObjetos(loadUserData(user.username, 'transacciones', TRANSACCIONES_DEFECTO), sanearTransaccion);
    setTransacciones(transGuardadas || TRANSACCIONES_DEFECTO);

    const cuentasGuardadas = sanearArrayObjetos(loadUserData(user.username, 'cuentas_bancarias', CUENTAS_DEFECTO), sanearCuenta);
    setCuentasBancarias(cuentasGuardadas || CUENTAS_DEFECTO);

    const tarjetasGuardadas = sanearArrayObjetos(loadUserData(user.username, 'tarjetas', TARJETAS_DEFECTO), sanearTarjeta);
    setTarjetas(tarjetasGuardadas || TARJETAS_DEFECTO);

    const cuotasGuardadas = sanearArrayObjetos(loadUserData(user.username, 'cuotas_tarjetas', []), sanearCuotaTarjeta);
    setCuotasTarjetas(cuotasGuardadas || []);

    const prestamosGuardados = sanearArrayObjetos(loadUserData(user.username, 'prestamos', PRESTAMOS_DEFECTO), sanearPrestamo);
    setPrestamos(prestamosGuardados || PRESTAMOS_DEFECTO);

    const presGuardados = loadUserData(user.username, 'presupuestos', {});
    if (esObjetoPlano(presGuardados)) {
      const presLimpios = {};
      Object.entries(presGuardados).forEach(([cat, lim]) => {
        const num = Number(lim);
        if (typeof cat === 'string' && cat.trim() && Number.isFinite(num) && num > 0) {
          presLimpios[cat] = num;
        }
      });
      setPresupuestos(presLimpios);
    } else {
      setPresupuestos({});
    }

    const pgGuardado = Number(loadUserData(user.username, 'presupuesto_global', 0));
    setPresupuestoGlobal(Number.isFinite(pgGuardado) && pgGuardado >= 0 ? pgGuardado : 0);

    const recGuardados = sanearArrayObjetos(loadUserData(user.username, 'recurrentes', []), sanearRecurrente);
    setRecurrentes(recGuardados || []);

    const metasGuardadas = sanearArrayObjetos(loadUserData(user.username, 'metas', []), sanearMeta);
    setMetas(metasGuardadas || []);

    const catGastosGuardadas = sanearArrayStrings(loadUserData(user.username, 'cat_gastos_pers', CATEGORIAS_GASTOS_DEFECTO));
    setCatGastosPers(catGastosGuardadas && catGastosGuardadas.length > 0 ? catGastosGuardadas : CATEGORIAS_GASTOS_DEFECTO);

    const catIngresosGuardadas = sanearArrayStrings(loadUserData(user.username, 'cat_ingresos_pers', CATEGORIAS_INGRESOS_DEFECTO));
    setCatIngresosPers(catIngresosGuardadas && catIngresosGuardadas.length > 0 ? catIngresosGuardadas : CATEGORIAS_INGRESOS_DEFECTO);

    const cierresGuardados = sanearArrayObjetos(loadUserData(user.username, 'cierres_historicos', []), sanearCierre);
    setCierresHistoricos(cierresGuardados || []);
  }, [user]);

  // Sincronización automática mes a mes de las compras en cuotas según la fecha de registro y el mes actual
  useEffect(() => {
    if (!user || cuotasTarjetas.length === 0) return;

    const hoy = new Date();
    const indiceMesActual = hoy.getFullYear() * 12 + hoy.getMonth();

    let huboCambios = false;
    const nuevosMovimientosGenerados = [];

    const cuotasActualizadas = cuotasTarjetas.map(c => {
      if (c.completada) return c;

      const fechaBaseStr = c.fechaRegistro || getFechaLocalHoy();
      const [yStr, mStr, dStr] = fechaBaseStr.split('-');
      const anioReg = parseInt(yStr, 10);
      const mesReg = parseInt(mStr, 10) - 1;
      const diaReg = parseInt(dStr, 10) || 1;
      if (isNaN(anioReg) || isNaN(mesReg)) return c;

      const indiceMesRegistro = anioReg * 12 + mesReg;
      const mesesTranscurridos = Math.max(0, indiceMesActual - indiceMesRegistro);
      const cuotaInicial = c.cuotaInicial || c.cuotaActual || 1;
      const cuotaCalculada = Math.min(c.totalCuotas, cuotaInicial + mesesTranscurridos);

      // Solo avanzar automáticamente si el cálculo por calendario supera la cuota actual
      if (cuotaCalculada > c.cuotaActual) {
        huboCambios = true;
        const generadas = Array.isArray(c.cuotasGeneradas) ? [...c.cuotasGeneradas] : [c.cuotaActual];

        for (let numCuota = c.cuotaActual + 1; numCuota <= cuotaCalculada; numCuota++) {
          if (!generadas.includes(numCuota)) {
            generadas.push(numCuota);
            const offsetMeses = numCuota - cuotaInicial;
            const fechaCuotaObj = new Date(anioReg, mesReg + offsetMeses, 1);
            const diasEnMesCuota = new Date(fechaCuotaObj.getFullYear(), fechaCuotaObj.getMonth() + 1, 0).getDate();
            const diaValido = Math.min(c.diaFacturacion || diaReg, diasEnMesCuota);
            const fechaFormateada = `${fechaCuotaObj.getFullYear()}-${String(fechaCuotaObj.getMonth() + 1).padStart(2, '0')}-${String(diaValido).padStart(2, '0')}`;

            nuevosMovimientosGenerados.push({
              id: `trans_cuota_${c.id}_${numCuota}_${Date.now()}`,
              tipo: 'gasto',
              monto: c.valorCuotaMensual,
              descripcion: `${c.concepto} (Cuota ${numCuota}/${c.totalCuotas})`,
              nota: `Compra en cuotas • Total: ${formatoMoneda(c.montoTotal, c.moneda || 'PEN')}`,
              categoria: c.categoria || 'Compras',
              fecha: fechaFormateada,
              moneda: c.moneda || 'PEN',
              esCredito: true,
              tarjetaId: c.tarjetaId,
              metodo: c.tarjetaNombre,
              cuotaId: c.id,
              numeroCuota: numCuota
            });
          }
        }

        return {
          ...c,
          cuotaInicial,
          cuotaActual: cuotaCalculada,
          cuotasGeneradas: generadas,
          ultimoMesSincronizado: `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
        };
      }
      return c;
    });

    if (huboCambios) {
      if (nuevosMovimientosGenerados.length > 0) {
        setTransacciones(prev => [...nuevosMovimientosGenerados, ...prev]);
      }
      setCuotasTarjetas(cuotasActualizadas);
    }
  }, [user, cuotasTarjetas]);

  // Guardar datos ante cambios
  useEffect(() => {
    if (!user) return;
    saveUserData(user.username, 'dark_mode', darkMode);
    saveUserData(user.username, 'moneda', moneda);
    saveUserData(user.username, 'tipos_cambio', tiposCambio);
    saveUserData(user.username, 'cat_gastos_pers', catGastosPers);
    saveUserData(user.username, 'cat_ingresos_pers', catIngresosPers);
    saveUserData(user.username, 'presupuestos', presupuestos);
    saveUserData(user.username, 'presupuesto_global', presupuestoGlobal);
    saveUserData(user.username, 'transacciones', transacciones);
    saveUserData(user.username, 'cuentas_bancarias', cuentasBancarias);
    saveUserData(user.username, 'tarjetas', tarjetas);
    saveUserData(user.username, 'cuotas_tarjetas', cuotasTarjetas);
    saveUserData(user.username, 'prestamos', prestamos);
    saveUserData(user.username, 'recurrentes', recurrentes);
    saveUserData(user.username, 'metas', metas);
    saveUserData(user.username, 'cierres_historicos', cierresHistoricos);
  }, [user, darkMode, moneda, tiposCambio, catGastosPers, catIngresosPers, presupuestos, presupuestoGlobal, transacciones, cuentasBancarias, tarjetas, cuotasTarjetas, prestamos, recurrentes, metas, cierresHistoricos]);

  // Helper para formato de fecha local en formato YYYY-MM-DD
  const getFechaLocalHoy = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Modales y Formularios UI
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroMetodo, setFiltroMetodo] = useState('todos');

  const [mostrarModalTransaccion, setMostrarModalTransaccion] = useState(false);
  const [transaccionEditandoId, setTransaccionEditandoId] = useState(null);
  const [tipoForm, setTipoForm] = useState('gasto');
  const [montoForm, setMontoForm] = useState('');
  const [descForm, setDescForm] = useState('');
  const [categoriaForm, setCategoriaForm] = useState(CATEGORIAS_GASTOS_DEFECTO[0]);
  const [fechaForm, setFechaForm] = useState(getFechaLocalHoy());
  const [monedaTransForm, setMonedaTransForm] = useState('PEN');
  const [esCreditoForm, setEsCreditoForm] = useState(false);
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState('');
  const [tarjetaSeleccionadaId, setTarjetaSeleccionadaId] = useState('');
  const [notaForm, setNotaForm] = useState('');

  const [mostrarModalCuenta, setMostrarModalCuenta] = useState(false);
  const [cuentaEditandoId, setCuentaEditandoId] = useState(null);
  const [nombreCuentaForm, setNombreCuentaForm] = useState('');
  const [tipoCuentaForm, setTipoCuentaForm] = useState('Bancaria');
  const [monedaCuentaForm, setMonedaCuentaForm] = useState('PEN');
  const [saldoInicialCuentaForm, setSaldoInicialCuentaForm] = useState('0');
  const [colorCuentaForm, setColorCuentaForm] = useState('#6366F1');
  const [cuentaVinculadaIdForm, setCuentaVinculadaIdForm] = useState('');

  const [mostrarModalTransferencia, setMostrarModalTransferencia] = useState(false);
  const [cuentaOrigenId, setCuentaOrigenId] = useState('');
  const [cuentaDestinoId, setCuentaDestinoId] = useState('');
  const [montoTransferenciaForm, setMontoTransferenciaForm] = useState('');

  const [mostrarModalTarjeta, setMostrarModalTarjeta] = useState(false);
  const [tarjetaEditandoId, setTarjetaEditandoId] = useState(null);
  const [nombreTarjetaForm, setNombreTarjetaForm] = useState('');
  const [limiteTarjetaForm, setLimiteTarjetaForm] = useState('');
  const [diaCorteTarjetaForm, setDiaCorteTarjetaForm] = useState('');
  const [diaVencimientoTarjetaForm, setDiaVencimientoTarjetaForm] = useState('');
  const [deudaInicialTarjetaForm, setDeudaInicialTarjetaForm] = useState('');
  const [monedaTarjetaForm, setMonedaTarjetaForm] = useState('PEN');

  const [mostrarModalCuotaTarjeta, setMostrarModalCuotaTarjeta] = useState(false);
  const [tarjetaCuotaId, setTarjetaCuotaId] = useState('');
  const [conceptoCuotaForm, setConceptoCuotaForm] = useState('');
  const [montoTotalCuotaForm, setMontoTotalCuotaForm] = useState('');
  const [numCuotasForm, setNumCuotasForm] = useState('3');
  const [cuotaActualForm, setCuotaActualForm] = useState('1');
  const [categoriaCuotaForm, setCategoriaCuotaForm] = useState('Compras');
  const [fechaCuotaForm, setFechaCuotaForm] = useState(getFechaLocalHoy());

  const [mostrarModalPagoTarjeta, setMostrarModalPagoTarjeta] = useState(false);
  const [tarjetaAPagarId, setTarjetaAPagarId] = useState('');
  const [cuentaOrigenPagoTarjetaId, setCuentaOrigenPagoTarjetaId] = useState('');
  const [montoPagoTarjetaForm, setMontoPagoTarjetaForm] = useState('');

  const [mostrarModalPrestamo, setMostrarModalPrestamo] = useState(false);
  const [tipoPrestamoForm, setTipoPrestamoForm] = useState('tomado');
  const [nombrePrestamoForm, setNombrePrestamoForm] = useState('');
  const [prestamistaForm, setPrestamistaForm] = useState('');
  const [telefonoContactoForm, setTelefonoContactoForm] = useState('');
  const [esInformalForm, setEsInformalForm] = useState(false);
  const [montoTotalPrestamoForm, setMontoTotalPrestamoForm] = useState('');
  const [montoPendientePrestamoForm, setMontoPendientePrestamoForm] = useState('');
  const [diaVencimientoPrestamoForm, setDiaVencimientoPrestamoForm] = useState('');
  const [monedaPrestamoForm, setMonedaPrestamoForm] = useState('PEN');
  const [filtroTipoPrestamo, setFiltroTipoPrestamo] = useState('todos');

  const [mostrarModalAbonoPrestamo, setMostrarModalAbonoPrestamo] = useState(false);
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState('');
  const [cuentaOrigenAbonoPrestamoId, setCuentaOrigenAbonoPrestamoId] = useState('');
  const [montoAbonoPrestamo, setMontoAbonoPrestamo] = useState('');

  const [mostrarModalPresupuesto, setMostrarModalPresupuesto] = useState(false);
  const [categoriaPresupuesto, setCategoriaPresupuesto] = useState(CATEGORIAS_GASTOS_DEFECTO[0]);
  const [limitePresupuestoForm, setLimitePresupuestoForm] = useState('');

  const [mostrarModalRecurrente, setMostrarModalRecurrente] = useState(false);
  const [tipoRecurrenteForm, setTipoRecurrenteForm] = useState('gasto');
  const [montoRecurrenteForm, setMontoRecurrenteForm] = useState('');
  const [descRecurrenteForm, setDescRecurrenteForm] = useState('');
  const [categoriaRecurrenteForm, setCategoriaRecurrenteForm] = useState(CATEGORIAS_GASTOS_DEFECTO[0]);
  const [diaPagoRecurrenteForm, setDiaPagoRecurrenteForm] = useState('1');
  const [monedaRecurrenteForm, setMonedaRecurrenteForm] = useState('PEN');
  const [cuentaRecurrenteId, setCuentaRecurrenteId] = useState('');

  const [mostrarModalConfig, setMostrarModalConfig] = useState(false);
  const [mostrarModalInfoData, setMostrarModalInfoData] = useState(false);
  const [mensajeRespaldo, setMensajeRespaldo] = useState(null);

  // Estados para Generador de Reporte PDF
  const [mostrarModalPdf, setMostrarModalPdf] = useState(false);
  const [pdfTipoPeriodo, setPdfTipoPeriodo] = useState('mes'); // 'mes' | 'anio' | 'rango'
  const [pdfFechaInicio, setPdfFechaInicio] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [pdfFechaFin, setPdfFechaFin] = useState(() => getFechaLocalHoy());
  const [pdfCompararAnterior, setPdfCompararAnterior] = useState(true);
  const [pdfIncluirCuentasDeudas, setPdfIncluirCuentasDeudas] = useState(true);
  const [pdfIncluirResumenAnual, setPdfIncluirResumenAnual] = useState(false);
  const [pdfIncluirMetas, setPdfIncluirMetas] = useState(true);

  // Estados para Metas de Ahorro
  const [mostrarModalMeta, setMostrarModalMeta] = useState(false);
  const [nombreMetaForm, setNombreMetaForm] = useState('');
  const [montoObjetivoMetaForm, setMontoObjetivoMetaForm] = useState('');
  const [montoInicialMetaForm, setMontoInicialMetaForm] = useState('');
  const [fechaLimiteMetaForm, setFechaLimiteMetaForm] = useState('');
  const [monedaMetaForm, setMonedaMetaForm] = useState('PEN');
  const [colorMetaForm, setColorMetaForm] = useState('#10B981');

  const [mostrarModalAporteMeta, setMostrarModalAporteMeta] = useState(false);
  const [metaSeleccionadaId, setMetaSeleccionadaId] = useState('');
  const [cuentaAporteMetaId, setCuentaAporteMetaId] = useState('');
  const [montoAporteMetaForm, setMontoAporteMetaForm] = useState('');
  const [descontarCuentaMeta, setDescontarCuentaMeta] = useState(true);

  // Estados para Diálogos Propios (confirmación y avisos sin window.confirm/alert)
  const [dialogoConfirmacion, setDialogoConfirmacion] = useState(null);
  const [notificacionToast, setNotificacionToast] = useState(null);

  const mostrarAviso = (texto, tipo = 'info') => {
    setNotificacionToast({ texto, tipo, id: Date.now() });
  };

  useEffect(() => {
    if (!notificacionToast) return;
    const timer = setTimeout(() => setNotificacionToast(null), 4200);
    return () => clearTimeout(timer);
  }, [notificacionToast]);

  const abrirConfirmacion = ({ titulo, mensaje, textoConfirmar = 'Confirmar', variante = 'danger', onConfirm }) => {
    setDialogoConfirmacion({ titulo, mensaje, textoConfirmar, variante, onConfirm });
  };

  // Conversor de divisas ampliado con soporte para CLP
  const convertirMoneda = (monto, monedaOrigen, monedaDestino = moneda) => {
    if (!monto) return 0;
    if (monedaOrigen === monedaDestino) return Number(monto);

    let enPen = Number(monto);
    if (monedaOrigen === 'USD') enPen = Number(monto) * (tiposCambio.USD_PEN || 3.75);
    if (monedaOrigen === 'EUR') enPen = Number(monto) * (tiposCambio.EUR_PEN || 4.10);
    if (monedaOrigen === 'CLP') enPen = Number(monto) * (tiposCambio.CLP_PEN || 0.0041);

    if (monedaDestino === 'PEN') return enPen;
    if (monedaDestino === 'USD') return enPen / (tiposCambio.USD_PEN || 3.75);
    if (monedaDestino === 'EUR') return enPen / (tiposCambio.EUR_PEN || 4.10);
    if (monedaDestino === 'CLP') return enPen / (tiposCambio.CLP_PEN || 0.0041);

    return enPen;
  };

  const formatoMoneda = (monto, codMoneda = moneda) => {
    const sim = codMoneda === 'PEN' ? 'S/' : codMoneda === 'USD' ? '$' : codMoneda === 'CLP' ? '$' : '€';
    return `${sim} ${Number(monto || 0).toLocaleString('es-CL', { minimumFractionDigits: codMoneda === 'CLP' ? 0 : 2, maximumFractionDigits: codMoneda === 'CLP' ? 0 : 2 })}`;
  };

  const cambiarMesSiguiente = () => {
    if (mesSeleccionado === 11) {
      setMesSeleccionado(0);
      setAnioSeleccionado(prev => prev + 1);
    } else {
      setMesSeleccionado(prev => prev + 1);
    }
  };

  const cambiarMesAnterior = () => {
    if (mesSeleccionado === 0) {
      setMesSeleccionado(11);
      setAnioSeleccionado(prev => prev - 1);
    } else {
      setMesSeleccionado(prev => prev - 1);
    }
  };

  // Auth Submit Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorAuth('');
    setProcesandoAuth(true);

    const cleanUsername = usernameForm.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!cleanUsername || !passwordForm) {
      setErrorAuth('Por favor ingresa usuario y contraseña válidos.');
      setProcesandoAuth(false);
      return;
    }

    const registro = leerJSON('finanzas_users_registry', {});
    const usersDb = registro && typeof registro === 'object' && !Array.isArray(registro) ? registro : {};

    if (modoAuth === 'register') {
      if (usersDb[cleanUsername]) {
        setErrorAuth('El nombre de usuario ya está registrado.');
        setProcesandoAuth(false);
        return;
      }
      if (!respuestaForm.trim()) {
        setErrorAuth('Por favor responde a la pregunta de seguridad.');
        setProcesandoAuth(false);
        return;
      }
      const passwordHash = await hashTextoSeguro(passwordForm);
      const respuestaHash = await hashTextoSeguro(respuestaForm.trim().toLowerCase());
      usersDb[cleanUsername] = { 
        passwordHash,
        preguntaSeguridad: preguntaForm,
        respuestaHash
      };
      try {
        localStorage.setItem('finanzas_users_registry', JSON.stringify(usersDb));
      } catch (err) {
        setErrorAuth('No se pudo guardar la cuenta: almacenamiento no disponible.');
        setProcesandoAuth(false);
        return;
      }
    } else {
      const userRecord = usersDb[cleanUsername];
      const claveAlmacenada = userRecord ? (userRecord.passwordHash || userRecord.password) : null;
      const esValida = userRecord && await verificarSecreta(passwordForm, claveAlmacenada);
      if (!esValida) {
        setErrorAuth('Usuario o contraseña incorrectos.');
        setProcesandoAuth(false);
        return;
      }
      // Migrar automáticamente cuentas antiguas a hash seguro
      if (userRecord && !userRecord.passwordHash && userRecord.password) {
        userRecord.passwordHash = await hashTextoSeguro(passwordForm);
        delete userRecord.password;
        try {
          localStorage.setItem('finanzas_users_registry', JSON.stringify(usersDb));
        } catch (err) {
          // Ignorar fallo silencioso de migración
        }
      }
    }

    const newActiveUser = { username: cleanUsername, uid: `usr_${cleanUsername}_${Date.now()}` };
    saveUserData(cleanUsername, 'moneda', monedaInicioForm);
    setMoneda(monedaInicioForm);
    localStorage.setItem('finanzas_active_user', JSON.stringify(newActiveUser));
    setUser(newActiveUser);
    setProcesandoAuth(false);
  };

  const handleBorrarCachePagina = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('finanzas_')) {
        localStorage.removeItem(key);
      }
    });

    setMostrarModalBorrarCache(false);
    setConfirmarTextoBorrar('');
    setUser(null);
    setErrorAuth('Se ha limpiado la caché y datos locales de la aplicación correctamente.');
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('finanzas_active_user');
    setUser(null);
  };

  const handleBuscarUsuarioRecuperacion = (e) => {
    e.preventDefault();
    setMensajeRecuperacion(null);
    const cleanUsername = userRecuperar.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const registro = leerJSON('finanzas_users_registry', {});
    const userData = registro[cleanUsername];

    if (!userData) {
      setMensajeRecuperacion({ tipo: 'error', texto: 'Nombre de usuario no encontrado.' });
      return;
    }

    setPreguntaUsuario(userData.preguntaSeguridad || '¿Cuál es el nombre de tu primera mascota?');
    setPasoRecuperacion(2);
  };

  const handleRestablecerPassword = async (e) => {
    e.preventDefault();
    setMensajeRecuperacion(null);
    const cleanUsername = userRecuperar.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const registro = leerJSON('finanzas_users_registry', {});
    const userData = registro[cleanUsername];

    if (!userData) {
      setMensajeRecuperacion({ tipo: 'error', texto: 'Ocurrió un error al verificar los datos.' });
      return;
    }

    const respGuardada = userData.respuestaHash || userData.respuestaSeguridad || '';
    const respuestaValida = !respGuardada || await verificarSecreta(respuestaRecuperar.trim().toLowerCase(), respGuardada);
    if (!respuestaValida) {
      setMensajeRecuperacion({ tipo: 'error', texto: 'La respuesta de seguridad es incorrecta.' });
      return;
    }

    if (!nuevaPasswordForm) {
      setMensajeRecuperacion({ tipo: 'error', texto: 'Ingresa una nueva contraseña.' });
      return;
    }

    registro[cleanUsername].passwordHash = await hashTextoSeguro(nuevaPasswordForm);
    delete registro[cleanUsername].password;
    try {
      localStorage.setItem('finanzas_users_registry', JSON.stringify(registro));
      setMensajeRecuperacion({ tipo: 'ok', texto: '¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.' });
      setTimeout(() => {
        setMostrarModalRecuperar(false);
        setPasoRecuperacion(1);
        setUserRecuperar('');
        setRespuestaRecuperar('');
        setNuevaPasswordForm('');
        setMensajeRecuperacion(null);
      }, 2000);
    } catch (err) {
      setMensajeRecuperacion({ tipo: 'error', texto: 'Error al actualizar la contraseña.' });
    }
  };

  // Cálculo de saldos actuales por cuenta con soporte de vinculación
  const cuentasConSaldosActuales = useMemo(() => {
    const baseCuentas = cuentasBancarias.map((cta, index) => {
      let saldo = Number(cta.saldoInicial || 0);

      transacciones.forEach(t => {
        const montoVal = Number(t.monto || 0);
        const asignadaEstaCuenta = t.cuentaId === cta.id || (!t.cuentaId && index === 0);

        if (t.tipo === 'ingreso' && asignadaEstaCuenta) {
          saldo += convertirMoneda(montoVal, t.moneda || 'PEN', cta.moneda || 'PEN');
        } else if ((t.tipo === 'gasto' && !t.esCredito && asignadaEstaCuenta) ||
                   (t.tipo === 'pago_tarjeta' && asignadaEstaCuenta) ||
                   (t.tipo === 'pago_prestamo' && asignadaEstaCuenta) ||
                   (t.tipo === 'aporte_meta' && asignadaEstaCuenta)) {
          saldo -= convertirMoneda(montoVal, t.moneda || 'PEN', cta.moneda || 'PEN');
        } else if (t.tipo === 'transferencia_salida' && asignadaEstaCuenta) {
          saldo -= convertirMoneda(montoVal, t.moneda || 'PEN', cta.moneda || 'PEN');
        } else if (t.tipo === 'transferencia_entrada' && asignadaEstaCuenta) {
          saldo += convertirMoneda(montoVal, t.moneda || 'PEN', cta.moneda || 'PEN');
        }
      });

      return {
        ...cta,
        saldoBase: saldo
      };
    });

    return baseCuentas.map(cta => {
      let saldoFinal = cta.saldoBase;
      if (cta.cuentaVinculadaId) {
        const principal = baseCuentas.find(c => c.id === cta.cuentaVinculadaId);
        if (principal) {
          saldoFinal = principal.saldoBase;
        }
      }
      return {
        ...cta,
        saldoActual: saldoFinal
      };
    });
  }, [cuentasBancarias, transacciones, tiposCambio]);

  const saldoLiquidoTotal = useMemo(() => {
    const idsProcesados = new Set();
    let total = 0;

    cuentasConSaldosActuales.forEach(cta => {
      const idAContabilizar = cta.cuentaVinculadaId || cta.id;
      if (!idsProcesados.has(idAContabilizar)) {
        idsProcesados.add(idAContabilizar);
        total += convertirMoneda(cta.saldoActual, cta.moneda || 'PEN', moneda);
      }
    });

    return total;
  }, [cuentasConSaldosActuales, moneda, tiposCambio]);

  // Resumen del Mes Seleccionado
  const resumen = useMemo(() => {
    let ingresos = 0;
    let gastosLiquidos = 0;
    let gastosCredito = 0;
    let pagosLiquidosEspeciales = 0;

    transacciones.forEach(t => {
      const [yearStr, monthStr] = (t.fecha || '').split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;

      if (y === anioSeleccionado && m === mesSeleccionado) {
        const montoConvertido = convertirMoneda(t.monto, t.moneda || 'PEN', moneda);
        if (t.tipo === 'ingreso') {
          ingresos += montoConvertido;
        } else if (t.tipo === 'gasto') {
          if (t.esCredito) {
            gastosCredito += montoConvertido;
          } else {
            gastosLiquidos += montoConvertido;
          }
        } else if (t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo' || t.tipo === 'aporte_meta') {
          pagosLiquidosEspeciales += montoConvertido;
        }
      }
    });

    const totalGastosDelMes = gastosLiquidos + gastosCredito;
    const balanceNetoMes = ingresos - totalGastosDelMes;

    return {
      ingresos,
      gastosLiquidos,
      gastosCredito,
      pagosLiquidosEspeciales,
      totalGastosDelMes,
      balanceNetoMes
    };
  }, [transacciones, mesSeleccionado, anioSeleccionado, moneda, tiposCambio]);

  // Resumen Tarjetas
  const resumenTarjetas = useMemo(() => {
    let deudaTotal = 0;
    let limiteTotal = 0;

    tarjetas.forEach(t => {
      deudaTotal += convertirMoneda(t.deudaActual || 0, t.moneda || 'PEN', moneda);
      limiteTotal += convertirMoneda(t.limite || 0, t.moneda || 'PEN', moneda);
    });

    return {
      deudaTotal,
      limiteTotal,
      disponibleTotal: Math.max(0, limiteTotal - deudaTotal)
    };
  }, [tarjetas, moneda, tiposCambio]);

  // HISTORIAL CUMULATIVO REAL DE PATRIMONIO NETO DE LOS ÚLTIMOS 12 MESES
  const historialPatrimonioNeto = useMemo(() => {
    const meses = [];
    const fechaActual = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      meses.push({
        label: `${NOMBRES_MESES[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(-2)}`,
        anio: d.getFullYear(),
        mes: d.getMonth(),
        patrimonio: 0
      });
    }

    return meses.map(mInfo => {
      let liquidoAcumulado = 0;

      let deudasTarjetasAcumuladas = tarjetas.reduce((acc, t) => {
        return acc + convertirMoneda(t.deudaActual || 0, t.moneda || 'PEN', moneda);
      }, 0);

      let deudasPrestamosAcumuladas = prestamos.reduce((acc, p) => {
        if (p.tipo === 'tomado') {
          return acc + convertirMoneda(p.montoPendiente || 0, p.moneda || 'PEN', moneda);
        }
        return acc;
      }, 0);

      transacciones.forEach(t => {
        const [yStr, mStr] = (t.fecha || '').split('-');
        const transY = parseInt(yStr, 10);
        const transM = parseInt(mStr, 10) - 1;

        if (transY < mInfo.anio || (transY === mInfo.anio && transM <= mInfo.mes)) {
          const montoConv = convertirMoneda(t.monto, t.moneda || 'PEN', moneda);

          if (t.tipo === 'ingreso') {
            liquidoAcumulado += montoConv;
          } else if (t.tipo === 'gasto' && !t.esCredito) {
            liquidoAcumulado -= montoConv;
          } else if (t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo') {
            liquidoAcumulado -= montoConv;
          }
        }
      });

      const patrimonioNeto = liquidoAcumulado - (deudasTarjetasAcumuladas + deudasPrestamosAcumuladas);

      return {
        mes: mInfo.label,
        Patrimonio: Math.round((patrimonioNeto || 0) * 100) / 100
      };
    });
  }, [transacciones, tarjetas, prestamos, moneda, tiposCambio]);

  // Vencimientos Próximos
  const proximosVencimientos = useMemo(() => {
    const list = [];
    const hoy = new Date();
    const hoyTimestamp = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();

    const calcularDiasRestantes = (diaVenc) => {
      const anioActual = hoy.getFullYear();
      const mesActual = hoy.getMonth();
      
      const numDiasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
      const diaAjustado = Math.min(diaVenc, numDiasEnMes);
      let fechaVenc = new Date(anioActual, mesActual, diaAjustado);

      let diffTiempo = fechaVenc.getTime() - hoyTimestamp;
      let diffDias = Math.round(diffTiempo / (1000 * 3600 * 24));

      if (diffDias < -7) {
        const sigMes = mesActual + 1;
        const numDiasSigMes = new Date(anioActual, sigMes + 1, 0).getDate();
        const diaSigAjustado = Math.min(diaVenc, numDiasSigMes);
        fechaVenc = new Date(anioActual, sigMes, diaSigAjustado);
        diffTiempo = fechaVenc.getTime() - hoyTimestamp;
        diffDias = Math.round(diffTiempo / (1000 * 3600 * 24));
      }

      return { diffDias, diaReal: diaAjustado };
    };

    tarjetas.forEach(t => {
      if (t.diaVencimiento && (t.deudaActual || 0) > 0) {
        const dVenc = Number(t.diaVencimiento);
        const { diffDias, diaReal } = calcularDiasRestantes(dVenc);
        
        if (diffDias >= -7 && diffDias <= 7) {
          list.push({
            id: `tarj_${t.id}`,
            tipo: 'Tarjeta',
            nombre: t.nombre,
            diaPago: diaReal,
            dias: diffDias,
            vencido: diffDias < 0,
            montoTexto: formatoMoneda(t.deudaActual || 0, t.moneda || 'PEN')
          });
        }
      }
    });

    prestamos.forEach(p => {
      if (p.diaVencimiento && p.tipo === 'tomado' && (p.montoPendiente || 0) > 0) {
        const dVenc = Number(p.diaVencimiento);
        const { diffDias, diaReal } = calcularDiasRestantes(dVenc);

        if (diffDias >= -7 && diffDias <= 7) {
          list.push({
            id: `prest_${p.id}`,
            tipo: 'Préstamo',
            nombre: p.nombre,
            diaPago: diaReal,
            dias: diffDias,
            vencido: diffDias < 0,
            montoTexto: formatoMoneda(p.montoPendiente || 0, p.moneda || 'PEN')
          });
        }
      }
    });

    return list.sort((a, b) => a.dias - b.dias);
  }, [tarjetas, prestamos, moneda, tiposCambio]);

  // Gastos por categoría para presupuestos del mes
  const gastosMesPorCategoria = useMemo(() => {
    const map = {};
    transacciones.forEach(t => {
      const [yearStr, monthStr] = (t.fecha || '').split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;

      if (y === anioSeleccionado && m === mesSeleccionado && t.tipo === 'gasto') {
        const montoConv = convertirMoneda(t.monto, t.moneda || 'PEN', moneda);
        map[t.categoria] = (map[t.categoria] || 0) + montoConv;
      }
    });
    return map;
  }, [transacciones, mesSeleccionado, anioSeleccionado, moneda, tiposCambio]);

  // Salidas de Dinero por Cuenta en el Mes
  const salidasPorCuentaMes = useMemo(() => {
    if (!transacciones || transacciones.length === 0) return [];
    const map = {};
    transacciones.forEach(t => {
      const [yearStr, monthStr] = (t.fecha || '').split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;

      if (y === anioSeleccionado && m === mesSeleccionado) {
        const esSalida = (t.tipo === 'gasto' && !t.esCredito) || t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo' || t.tipo === 'aporte_meta' || t.tipo === 'transferencia_salida';
        if (esSalida) {
          const ctaNombre = t.metodo || 'General';
          const montoConv = convertirMoneda(t.monto, t.moneda || 'PEN', moneda);
          map[ctaNombre] = (map[ctaNombre] || 0) + montoConv;
        }
      }
    });

    return Object.keys(map).map((nombre, i) => ({
      name: nombre,
      value: Math.round((map[nombre] || 0) * 100) / 100,
      color: COLORES_CATEGORIAS[i % COLORES_CATEGORIAS.length]
    })).filter(item => item.value > 0);
  }, [transacciones, mesSeleccionado, anioSeleccionado, moneda, tiposCambio]);

  // Distribución de Activos por Tipo de Cuenta
  const distribucionActivos = useMemo(() => {
    if (!cuentasConSaldosActuales || cuentasConSaldosActuales.length === 0) return [];
    const map = {};
    cuentasConSaldosActuales.forEach(cta => {
      const tipo = cta.tipo || 'Bancaria';
      const saldoConv = convertirMoneda(cta.saldoActual || 0, cta.moneda || 'PEN', moneda);
      map[tipo] = (map[tipo] || 0) + Math.max(0, saldoConv);
    });

    return Object.keys(map).map((tipo, i) => ({
      name: tipo,
      value: Math.round((map[tipo] || 0) * 100) / 100,
      color: COLORES_CATEGORIAS[(i + 3) % COLORES_CATEGORIAS.length]
    })).filter(item => item.value > 0);
  }, [cuentasConSaldosActuales, moneda, tiposCambio]);

  // Categorías de Gastos del Mes para PieChart
  const categoriasGastosPie = useMemo(() => {
    if (!transacciones || transacciones.length === 0) return [];
    const map = {};
    transacciones.forEach(t => {
      const [yearStr, monthStr] = (t.fecha || '').split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;

      if (y === anioSeleccionado && m === mesSeleccionado && t.tipo === 'gasto') {
        const cat = t.categoria || 'Otros Gastos';
        const montoConv = convertirMoneda(t.monto, t.moneda || 'PEN', moneda);
        map[cat] = (map[cat] || 0) + montoConv;
      }
    });

    return Object.keys(map).map((cat, i) => ({
      name: cat,
      value: Math.round((map[cat] || 0) * 100) / 100,
      color: COLORES_CATEGORIAS[i % COLORES_CATEGORIAS.length]
    })).filter(item => item.value > 0);
  }, [transacciones, mesSeleccionado, anioSeleccionado, moneda, tiposCambio]);

  // Transacciones Filtradas
  const transaccionesFiltradas = useMemo(() => {
    if (!transacciones || !Array.isArray(transacciones)) return [];
    return transacciones.filter(t => {
      const [yearStr, monthStr] = (t.fecha || '').split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;

      if (y !== anioSeleccionado || m !== mesSeleccionado) return false;

      if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false;
      if (filtroCategoria !== 'todas' && t.categoria !== filtroCategoria) return false;
      if (filtroMetodo !== 'todos' && t.metodo !== filtroMetodo) return false;

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const descMatch = (t.descripcion || '').toLowerCase().includes(q);
        const catMatch = (t.categoria || '').toLowerCase().includes(q);
        const metMatch = (t.metodo || '').toLowerCase().includes(q);
        const notaMatch = (t.nota || '').toLowerCase().includes(q);
        return descMatch || catMatch || metMatch || notaMatch;
      }

      return true;
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [transacciones, mesSeleccionado, anioSeleccionado, filtroTipo, filtroCategoria, filtroMetodo, busqueda]);

  // Historial de Pagos Auditoría
  const historialPagosEspeciales = useMemo(() => {
    if (!transacciones || !Array.isArray(transacciones)) return [];
    return transacciones.filter(t => t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo')
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [transacciones]);

  // Resumen Anual consolidado por mes (Enero - Diciembre del año seleccionado)
  const resumenAnual = useMemo(() => {
    const mesesData = NOMBRES_MESES.map((nombre, idx) => ({
      mesIndex: idx,
      mes: nombre,
      mesCorto: nombre.slice(0, 3),
      ingresos: 0,
      gastosLiquidos: 0,
      gastosCredito: 0,
      gastosTotales: 0,
      balance: 0,
      cerrado: cierresHistoricos.some((c) => c.periodo === `${nombre} ${anioSeleccionado}`)
    }));

    transacciones.forEach((t) => {
      const [yStr, mStr] = (t.fecha || '').split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10) - 1;
      if (y !== anioSeleccionado || m < 0 || m > 11) return;

      const montoConv = convertirMoneda(t.monto, t.moneda || 'PEN', moneda);
      if (t.tipo === 'ingreso') {
        mesesData[m].ingresos += montoConv;
      } else if (t.tipo === 'gasto') {
        if (t.esCredito) {
          mesesData[m].gastosCredito += montoConv;
        } else {
          mesesData[m].gastosLiquidos += montoConv;
        }
      } else if (t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo' || t.tipo === 'aporte_meta') {
        mesesData[m].gastosLiquidos += montoConv;
      }
    });

    let totalIngresosAnio = 0;
    let totalGastosAnio = 0;
    let totalLiquidoAnio = 0;
    let totalCreditoAnio = 0;

    mesesData.forEach((item) => {
      item.gastosTotales = item.gastosLiquidos + item.gastosCredito;
      item.balance = item.ingresos - item.gastosTotales;
      item.Ingresos = Math.round(item.ingresos * 100) / 100;
      item.Gastos = Math.round(item.gastosTotales * 100) / 100;
      item.Balance = Math.round(item.balance * 100) / 100;

      totalIngresosAnio += item.ingresos;
      totalGastosAnio += item.gastosTotales;
      totalLiquidoAnio += item.gastosLiquidos;
      totalCreditoAnio += item.gastosCredito;
    });

    const ahorroNetoAnio = totalIngresosAnio - totalGastosAnio;
    const tasaAhorroAnio = totalIngresosAnio > 0 ? Math.round((ahorroNetoAnio / totalIngresosAnio) * 100) : 0;

    return {
      meses: mesesData,
      totalIngresosAnio,
      totalGastosAnio,
      totalLiquidoAnio,
      totalCreditoAnio,
      ahorroNetoAnio,
      tasaAhorroAnio
    };
  }, [transacciones, anioSeleccionado, moneda, tiposCambio, cierresHistoricos]);

  // Verificar si el mes actualmente visualizado ya fue cerrado
  const cierreMesActual = useMemo(() => {
    const periodoBuscado = `${NOMBRES_MESES[mesSeleccionado]} ${anioSeleccionado}`;
    return cierresHistoricos.find((c) => c.periodo === periodoBuscado) || null;
  }, [cierresHistoricos, mesSeleccionado, anioSeleccionado]);

  const todosLosMetodosDisponibles = useMemo(() => {
    const list = (cuentasBancarias || []).map(c => c.nombre);
    (tarjetas || []).forEach(t => list.push(t.nombre));
    return Array.from(new Set(list));
  }, [cuentasBancarias, tarjetas]);

  // Categorías personalizadas handlers
  const agregarCategoriaGasto = () => {
    if (!nuevaCatGasto.trim()) return;
    const catClean = nuevaCatGasto.trim();
    if (!catGastosPers.includes(catClean)) {
      setCatGastosPers(prev => [...prev, catClean]);
    }
    setNuevaCatGasto('');
  };

  const eliminarCategoriaGasto = (cat) => {
    setCatGastosPers(prev => prev.filter(c => c !== cat));
  };

  const agregarCategoriaIngreso = () => {
    if (!nuevaCatIngreso.trim()) return;
    const catClean = nuevaCatIngreso.trim();
    if (!catIngresosPers.includes(catClean)) {
      setCatIngresosPers(prev => [...prev, catClean]);
    }
    setNuevaCatIngreso('');
  };

  const eliminarCategoriaIngreso = (cat) => {
    setCatIngresosPers(prev => prev.filter(c => c !== cat));
  };

  // Handlers CRUD Transacciones
  const abrirNuevaTransaccion = () => {
    setTransaccionEditandoId(null);
    setTipoForm('gasto');
    setMontoForm('');
    setDescForm('');
    setNotaForm('');
    setCategoriaForm(catGastosPers[0] || CATEGORIAS_GASTOS_DEFECTO[0]);
    setFechaForm(getFechaLocalHoy());
    setMonedaTransForm(moneda);
    setEsCreditoForm(false);
    if (cuentasBancarias.length > 0) setCuentaSeleccionadaId(cuentasBancarias[0].id);
    if (tarjetas.length > 0) setTarjetaSeleccionadaId(tarjetas[0].id);
    setMostrarModalTransaccion(true);
  };

  const abrirEdicionTransaccion = (t) => {
    setTransaccionEditandoId(t.id);
    setTipoForm(t.tipo);
    setMontoForm(String(t.monto));
    setDescForm(t.descripcion);
    setNotaForm(t.nota || '');
    setCategoriaForm(t.categoria);
    setFechaForm(t.fecha);
    setMonedaTransForm(t.moneda || 'PEN');
    setEsCreditoForm(!!t.esCredito);
    setCuentaSeleccionadaId(t.cuentaId || '');
    setTarjetaSeleccionadaId(t.tarjetaId || '');
    setMostrarModalTransaccion(true);
  };

  const agregarTransaccion = (e) => {
    e.preventDefault();
    if (!montoForm || parseFloat(montoForm) <= 0) return;

    let nombreMetodo = '';
    let targetCuentaId = null;
    let targetTarjetaId = null;

    if (tipoForm === 'gasto' && esCreditoForm) {
      const tarj = tarjetas.find(t => t.id === tarjetaSeleccionadaId);
      if (!tarj) return;
      nombreMetodo = tarj.nombre;
      targetTarjetaId = tarj.id;
    } else {
      const cta = cuentasConSaldosActuales.find(c => c.id === cuentaSeleccionadaId) || cuentasConSaldosActuales[0];
      if (!cta) return;
      nombreMetodo = cta.nombre;
      targetCuentaId = cta.id;
    }

    const nuevaTrans = {
      id: transaccionEditandoId || `trans_${Date.now()}`,
      tipo: tipoForm,
      monto: parseFloat(montoForm),
      descripcion: descForm || (tipoForm === 'ingreso' ? 'Ingreso' : 'Gasto'),
      nota: notaForm.trim(),
      categoria: categoriaForm,
      fecha: fechaForm,
      moneda: monedaTransForm,
      esCredito: esCreditoForm,
      cuentaId: targetCuentaId,
      tarjetaId: targetTarjetaId,
      metodo: nombreMetodo
    };

    if (transaccionEditandoId) {
      const transAnterior = transacciones.find(t => t.id === transaccionEditandoId);
      setTransacciones(prev => prev.map(t => t.id === transaccionEditandoId ? nuevaTrans : t));

      // Reconciliar deuda de tarjeta al editar un gasto (si cambió monto, tarjeta o modalidad líquido/crédito)
      setTarjetas(prev => prev.map(tarj => {
        let ajuste = 0;
        if (transAnterior && transAnterior.tipo === 'gasto' && transAnterior.esCredito && transAnterior.tarjetaId === tarj.id) {
          ajuste -= convertirMoneda(transAnterior.monto, transAnterior.moneda || 'PEN', tarj.moneda || 'PEN');
        }
        if (nuevaTrans.tipo === 'gasto' && nuevaTrans.esCredito && nuevaTrans.tarjetaId === tarj.id) {
          ajuste += convertirMoneda(nuevaTrans.monto, nuevaTrans.moneda || 'PEN', tarj.moneda || 'PEN');
        }
        if (ajuste !== 0) {
          return { ...tarj, deudaActual: Math.max(0, (tarj.deudaActual || 0) + ajuste) };
        }
        return tarj;
      }));
    } else {
      setTransacciones(prev => [nuevaTrans, ...prev]);

      if (esCreditoForm && targetTarjetaId) {
        setTarjetas(prev => prev.map(t => {
          if (t.id === targetTarjetaId) {
            const montoEnTarjeta = convertirMoneda(parseFloat(montoForm), monedaTransForm, t.moneda || 'PEN');
            return { ...t, deudaActual: (t.deudaActual || 0) + montoEnTarjeta };
          }
          return t;
        }));
      }
    }

    setMostrarModalTransaccion(false);
  };

  const ejecutarEliminacionTransaccion = (t) => {
    // 1. Si era un gasto a crédito en tarjeta, restar su importe de la deuda de la tarjeta
    if (t.tipo === 'gasto' && t.esCredito) {
      const targetTarjetaId = t.tarjetaId || tarjetas.find(tarj => tarj.nombre === t.metodo)?.id;
      if (targetTarjetaId) {
        setTarjetas(prev => prev.map(tarj => {
          if (tarj.id === targetTarjetaId) {
            const montoEnMonedaTarjeta = convertirMoneda(t.monto, t.moneda || 'PEN', tarj.moneda || 'PEN');
            return { ...tarj, deudaActual: Math.max(0, (tarj.deudaActual || 0) - montoEnMonedaTarjeta) };
          }
          return tarj;
        }));
      }
      // Si pertenecía a una compra en cuotas, descontar también su saldo pendiente
      if (t.cuotaId) {
        setCuotasTarjetas(prev => prev.map(c => {
          if (c.id === t.cuotaId) {
            const nuevoSaldo = Math.max(0, Number(c.saldoPendiente || 0) - Number(t.monto || 0));
            return {
              ...c,
              saldoPendiente: nuevoSaldo,
              completada: nuevoSaldo <= 0.01
            };
          }
          return c;
        }));
      }
    }

    // 2. Si era un pago a tarjeta, restaurar la deuda que había sido amortizada en la tarjeta
    if (t.tipo === 'pago_tarjeta') {
      const targetTarjeta = (t.tarjetaId && tarjetas.find(tarj => tarj.id === t.tarjetaId)) ||
        tarjetas.find(tarj => (t.descripcion || '').includes(tarj.nombre));
      if (targetTarjeta) {
        const montoEnMonedaTarjeta = convertirMoneda(t.monto, t.moneda || 'PEN', targetTarjeta.moneda || 'PEN');
        setTarjetas(prev => prev.map(tarj => {
          if (tarj.id === targetTarjeta.id) {
            return { ...tarj, deudaActual: (tarj.deudaActual || 0) + montoEnMonedaTarjeta };
          }
          return tarj;
        }));
      }
    }

    // 3. Si era un abono de préstamo, restaurar el monto pendiente del préstamo
    if (t.tipo === 'pago_prestamo') {
      const targetPrestamo = (t.prestamoId && prestamos.find(p => p.id === t.prestamoId)) ||
        prestamos.find(p => (t.descripcion || '').includes(p.nombre));
      if (targetPrestamo) {
        const montoEnMonedaPrestamo = convertirMoneda(t.monto, t.moneda || 'PEN', targetPrestamo.moneda || 'PEN');
        setPrestamos(prev => prev.map(p => {
          if (p.id === targetPrestamo.id) {
            return { ...p, montoPendiente: Math.min(p.montoTotal || Infinity, (p.montoPendiente || 0) + montoEnMonedaPrestamo) };
          }
          return p;
        }));
      }
    }

    // 4. Si era un aporte a una meta de ahorro, descontar ese monto acumulado de la meta
    if (t.tipo === 'aporte_meta' && t.metaId) {
      setMetas(prev => prev.map(m => {
        if (m.id === t.metaId) {
          const montoEnMonedaMeta = convertirMoneda(t.monto, t.moneda || 'PEN', m.moneda || 'PEN');
          return { ...m, montoActual: Math.max(0, (m.montoActual || 0) - montoEnMonedaMeta) };
        }
        return m;
      }));
    }

    // 5. Eliminar el movimiento (y su contraparte si es transferencia entre cuentas)
    if (t.transferenciaGrupoId) {
      setTransacciones(prev => prev.filter(item => item.transferenciaGrupoId !== t.transferenciaGrupoId));
    } else {
      setTransacciones(prev => prev.filter(item => item.id !== t.id));
    }
    mostrarAviso('Movimiento eliminado y saldos/deudas ajustados.', 'ok');
  };

  const eliminarTransaccion = (t) => {
    abrirConfirmacion({
      titulo: 'Eliminar movimiento',
      mensaje: `¿Deseas eliminar "${t.descripcion}" (${formatoMoneda(t.monto, t.moneda || 'PEN')})? Se revertirá automáticamente su impacto en saldos y deudas.`,
      textoConfirmar: 'Sí, eliminar',
      variante: 'danger',
      onConfirm: () => ejecutarEliminacionTransaccion(t)
    });
  };

  // Cuentas Handlers
  const guardarCuenta = (e) => {
    e.preventDefault();
    if (!nombreCuentaForm.trim()) return;

    const nuevaCta = {
      id: cuentaEditandoId || `cta_${Date.now()}`,
      nombre: nombreCuentaForm.trim(),
      tipo: tipoCuentaForm,
      moneda: monedaCuentaForm,
      saldoInicial: parseFloat(saldoInicialCuentaForm) || 0,
      color: colorCuentaForm,
      cuentaVinculadaId: cuentaVinculadaIdForm || null
    };

    if (cuentaEditandoId) {
      setCuentasBancarias(prev => prev.map(c => c.id === cuentaEditandoId ? nuevaCta : c));
    } else {
      setCuentasBancarias(prev => [...prev, nuevaCta]);
    }

    setMostrarModalCuenta(false);
  };

  const eliminarCuenta = (id) => {
    if (cuentasBancarias.length <= 1) {
      mostrarAviso('Debes mantener al menos una cuenta o billetera activa.', 'error');
      return;
    }
    const cta = cuentasBancarias.find(c => c.id === id);
    abrirConfirmacion({
      titulo: 'Eliminar cuenta o billetera',
      mensaje: `¿Seguro que deseas eliminar "${cta?.nombre || 'esta cuenta'}"? Sus movimientos históricos conservarán el nombre de referencia.`,
      textoConfirmar: 'Eliminar cuenta',
      variante: 'danger',
      onConfirm: () => {
        setCuentasBancarias(prev => prev.filter(c => c.id !== id));
        mostrarAviso('Cuenta eliminada correctamente.', 'ok');
      }
    });
  };

  const realizarTransferencia = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoTransferenciaForm);
    if (!monto || monto <= 0 || cuentaOrigenId === cuentaDestinoId) return;

    const ctaOrigen = cuentasConSaldosActuales.find(c => c.id === cuentaOrigenId);
    const ctaDestino = cuentasConSaldosActuales.find(c => c.id === cuentaDestinoId);
    if (!ctaOrigen || !ctaDestino) return;

    const fecha = getFechaLocalHoy();
    const grupoId = `transf_grp_${Date.now()}`;
    const transSalida = {
      id: `trans_out_${Date.now()}`,
      transferenciaGrupoId: grupoId,
      tipo: 'transferencia_salida',
      monto: monto,
      descripcion: `Transferencia hacia ${ctaDestino.nombre}`,
      categoria: 'Otros Gastos',
      fecha,
      moneda: ctaOrigen.moneda || 'PEN',
      cuentaId: ctaOrigen.id,
      metodo: ctaOrigen.nombre
    };

    const transEntrada = {
      id: `trans_in_${Date.now()}`,
      transferenciaGrupoId: grupoId,
      tipo: 'transferencia_entrada',
      monto: convertirMoneda(monto, ctaOrigen.moneda || 'PEN', ctaDestino.moneda || 'PEN'),
      descripcion: `Transferencia desde ${ctaOrigen.nombre}`,
      categoria: 'Otros Ingresos',
      fecha,
      moneda: ctaDestino.moneda || 'PEN',
      cuentaId: ctaDestino.id,
      metodo: ctaDestino.nombre
    };

    setTransacciones(prev => [transSalida, transEntrada, ...prev]);
    setMostrarModalTransferencia(false);
    setMontoTransferenciaForm('');
    mostrarAviso('Transferencia entre cuentas registrada.', 'ok');
  };

  // Tarjetas Handlers
  const guardarTarjeta = (e) => {
    e.preventDefault();
    if (!nombreTarjetaForm.trim() || !limiteTarjetaForm) return;

    const tarjetaData = {
      id: tarjetaEditandoId || `tarj_${Date.now()}`,
      nombre: nombreTarjetaForm.trim(),
      limite: parseFloat(limiteTarjetaForm),
      diaCorte: diaCorteTarjetaForm ? parseInt(diaCorteTarjetaForm, 10) : null,
      diaVencimiento: diaVencimientoTarjetaForm ? parseInt(diaVencimientoTarjetaForm, 10) : null,
      moneda: monedaTarjetaForm
    };

    if (tarjetaEditandoId) {
      setTarjetas(prev => prev.map(t => {
        if (t.id === tarjetaEditandoId) {
          return {
            ...t,
            ...tarjetaData
          };
        }
        return t;
      }));
    } else {
      setTarjetas(prev => [...prev, { ...tarjetaData, deudaActual: parseFloat(deudaInicialTarjetaForm) || 0 }]);
    }

    setMostrarModalTarjeta(false);
  };

  const guardarCompraCuotas = (e) => {
    e.preventDefault();
    const montoTotal = parseFloat(montoTotalCuotaForm);
    const totalCuotas = parseInt(numCuotasForm, 10);
    const cuotaActual = parseInt(cuotaActualForm, 10);

    if (!montoTotal || montoTotal <= 0 || !tarjetaCuotaId || !conceptoCuotaForm.trim()) return;

    const tarj = tarjetas.find(t => t.id === tarjetaCuotaId);
    if (!tarj) return;

    const valorCuotaMensual = montoTotal / totalCuotas;
    const cuotaActualValida = Math.max(1, Math.min(cuotaActual, totalCuotas));
    const cuotasRestantes = totalCuotas - cuotaActualValida + 1;
    const saldoInicialDeuda = cuotasRestantes * valorCuotaMensual;
    const fechaInicio = fechaCuotaForm || getFechaLocalHoy();
    const [yStr, mStr, dStr] = fechaInicio.split('-');
    const anioReg = parseInt(yStr, 10);
    const mesReg = parseInt(mStr, 10) - 1;
    const diaFacturacion = parseInt(dStr, 10) || 1;
    const categoriaSeleccionada = categoriaCuotaForm || catGastosPers[0] || 'Compras';
    const nuevoCuotaId = `cuota_${Date.now()}`;

    const hoy = new Date();
    const indiceMesActual = hoy.getFullYear() * 12 + hoy.getMonth();
    const indiceMesRegistro = !isNaN(anioReg) && !isNaN(mesReg) ? (anioReg * 12 + mesReg) : indiceMesActual;
    const mesesTranscurridos = Math.max(0, indiceMesActual - indiceMesRegistro);
    const cuotaHastaHoy = Math.min(totalCuotas, cuotaActualValida + mesesTranscurridos);

    const cuotasGeneradas = [];
    const movimientosGenerados = [];

    for (let numCuota = cuotaActualValida; numCuota <= cuotaHastaHoy; numCuota++) {
      cuotasGeneradas.push(numCuota);
      const offsetMeses = numCuota - cuotaActualValida;
      const baseAnio = !isNaN(anioReg) ? anioReg : hoy.getFullYear();
      const baseMes = !isNaN(mesReg) ? mesReg : hoy.getMonth();
      const fechaCuotaObj = new Date(baseAnio, baseMes + offsetMeses, 1);
      const diasEnMesCuota = new Date(fechaCuotaObj.getFullYear(), fechaCuotaObj.getMonth() + 1, 0).getDate();
      const diaValido = Math.min(diaFacturacion, diasEnMesCuota);
      const fechaFormateada = `${fechaCuotaObj.getFullYear()}-${String(fechaCuotaObj.getMonth() + 1).padStart(2, '0')}-${String(diaValido).padStart(2, '0')}`;

      movimientosGenerados.push({
        id: `trans_cuota_${nuevoCuotaId}_${numCuota}_${Date.now()}`,
        tipo: 'gasto',
        monto: valorCuotaMensual,
        descripcion: `${conceptoCuotaForm.trim()} (Cuota ${numCuota}/${totalCuotas})`,
        nota: `Compra en cuotas • Total: ${formatoMoneda(montoTotal, tarj.moneda || 'PEN')}`,
        categoria: categoriaSeleccionada,
        fecha: fechaFormateada,
        moneda: tarj.moneda || 'PEN',
        esCredito: true,
        tarjetaId: tarj.id,
        metodo: tarj.nombre,
        cuotaId: nuevoCuotaId,
        numeroCuota: numCuota
      });
    }

    const nuevaCompraCuotas = {
      id: nuevoCuotaId,
      tarjetaId: tarj.id,
      tarjetaNombre: tarj.nombre,
      concepto: conceptoCuotaForm.trim(),
      categoria: categoriaSeleccionada,
      montoTotal,
      valorCuotaMensual,
      saldoInicialDeuda,
      saldoPendiente: saldoInicialDeuda,
      montoPagado: 0,
      cuotasPagadas: 0,
      totalCuotas,
      cuotaInicial: cuotaActualValida,
      cuotaActual: cuotaHastaHoy,
      cuotasGeneradas,
      diaFacturacion,
      moneda: tarj.moneda || 'PEN',
      fechaRegistro: fechaInicio,
      completada: false
    };

    setCuotasTarjetas(prev => [...prev, nuevaCompraCuotas]);
    setTransacciones(prev => [...movimientosGenerados.reverse(), ...prev]);

    setTarjetas(prev => prev.map(t => {
      if (t.id === tarj.id) {
        return { ...t, deudaActual: (t.deudaActual || 0) + saldoInicialDeuda };
      }
      return t;
    }));

    setMostrarModalCuotaTarjeta(false);
    setConceptoCuotaForm('');
    setMontoTotalCuotaForm('');
  };

  const avanzarCuotaTarjeta = (id) => {
    const cuotaItem = cuotasTarjetas.find(c => c.id === id);
    if (!cuotaItem || cuotaItem.completada) return;

    const saldoActualCuota = Math.max(0, Number(cuotaItem.saldoPendiente ?? 0));
    if (saldoActualCuota <= 0.01) return;

    const montoAmortizado = Math.min(cuotaItem.valorCuotaMensual, saldoActualCuota);
    const nuevoSaldo = Math.max(0, saldoActualCuota - montoAmortizado);
    const esUltimaCuota = cuotaItem.cuotaActual >= cuotaItem.totalCuotas || nuevoSaldo <= 0.01;
    const generadas = Array.isArray(cuotaItem.cuotasGeneradas) ? [...cuotaItem.cuotasGeneradas] : [cuotaItem.cuotaActual];

    // Si aún quedan cuotas por facturar, generar el movimiento de gasto de la siguiente cuota
    if (cuotaItem.cuotaActual < cuotaItem.totalCuotas) {
      const siguienteCuota = cuotaItem.cuotaActual + 1;
      if (!generadas.includes(siguienteCuota)) {
        generadas.push(siguienteCuota);
        const nuevoMovCuota = {
          id: `trans_cuota_${cuotaItem.id}_${siguienteCuota}_${Date.now()}`,
          tipo: 'gasto',
          monto: cuotaItem.valorCuotaMensual,
          descripcion: `${cuotaItem.concepto} (Cuota ${siguienteCuota}/${cuotaItem.totalCuotas})`,
          nota: `Compra en cuotas • Total: ${formatoMoneda(cuotaItem.montoTotal, cuotaItem.moneda || 'PEN')}`,
          categoria: cuotaItem.categoria || 'Compras',
          fecha: getFechaLocalHoy(),
          moneda: cuotaItem.moneda || 'PEN',
          esCredito: true,
          tarjetaId: cuotaItem.tarjetaId,
          metodo: cuotaItem.tarjetaNombre,
          cuotaId: cuotaItem.id,
          numeroCuota: siguienteCuota
        };
        setTransacciones(prev => [nuevoMovCuota, ...prev]);
      }
    }

    setTarjetas(prev => prev.map(t => {
      if (t.id === cuotaItem.tarjetaId) {
        return { ...t, deudaActual: Math.max(0, (t.deudaActual || 0) - montoAmortizado) };
      }
      return t;
    }));

    setCuotasTarjetas(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          cuotaActual: esUltimaCuota ? c.totalCuotas : c.cuotaActual + 1,
          cuotasGeneradas: generadas,
          saldoPendiente: esUltimaCuota ? 0 : nuevoSaldo,
          montoPagado: Number(c.montoPagado || 0) + montoAmortizado,
          cuotasPagadas: Number(c.cuotasPagadas || 0) + 1,
          completada: esUltimaCuota
        };
      }
      return c;
    }));
  };

  const eliminarCompraCuotas = (id) => {
    const cuotaItem = cuotasTarjetas.find(c => c.id === id);
    if (!cuotaItem) return;

    abrirConfirmacion({
      titulo: 'Eliminar compra en cuotas',
      mensaje: `¿Deseas eliminar "${cuotaItem.concepto}"? Si tiene saldo pendiente sin pagar, se descontará únicamente ese saldo de la tarjeta.`,
      textoConfirmar: 'Eliminar registro',
      variante: 'danger',
      onConfirm: () => {
        const saldoPendienteReal = cuotaItem.completada
          ? 0
          : Math.max(0, Number(cuotaItem.saldoPendiente ?? 0));

        if (saldoPendienteReal > 0.01) {
          setTarjetas(prev => prev.map(t => {
            if (t.id === cuotaItem.tarjetaId) {
              return { ...t, deudaActual: Math.max(0, (t.deudaActual || 0) - saldoPendienteReal) };
            }
            return t;
          }));
        }
        setTransacciones(prev => prev.filter(t => t.cuotaId !== id));
        setCuotasTarjetas(prev => prev.filter(c => c.id !== id));
        mostrarAviso('Registro de cuotas eliminado.', 'ok');
      }
    });
  };

  const eliminarTarjeta = (id) => {
    const tarj = tarjetas.find(t => t.id === id);
    abrirConfirmacion({
      titulo: 'Eliminar tarjeta de crédito',
      mensaje: `¿Seguro que deseas eliminar la tarjeta "${tarj?.nombre || 'seleccionada'}"?`,
      textoConfirmar: 'Eliminar tarjeta',
      variante: 'danger',
      onConfirm: () => {
        setTarjetas(prev => prev.filter(t => t.id !== id));
        mostrarAviso('Tarjeta eliminada.', 'ok');
      }
    });
  };

  const registrarPagoTarjeta = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoPagoTarjetaForm);
    if (!monto || monto <= 0 || !tarjetaAPagarId || !cuentaOrigenPagoTarjetaId) return;

    const tarj = tarjetas.find(t => t.id === tarjetaAPagarId);
    const cta = cuentasConSaldosActuales.find(c => c.id === cuentaOrigenPagoTarjetaId);
    if (!tarj || !cta) return;

    const fecha = getFechaLocalHoy();
    const pagoMov = {
      id: `pago_tarj_${Date.now()}`,
      tipo: 'pago_tarjeta',
      monto: monto,
      descripcion: `Pago de Tarjeta: ${tarj.nombre}`,
      categoria: 'Pago de Tarjeta',
      fecha,
      moneda: cta.moneda || 'PEN',
      cuentaId: cta.id,
      tarjetaId: tarj.id,
      metodo: cta.nombre
    };

    setTransacciones(prev => [pagoMov, ...prev]);

    const montoEnMonedaTarjeta = convertirMoneda(monto, cta.moneda || 'PEN', tarj.moneda || 'PEN');

    setTarjetas(prev => prev.map(t => {
      if (t.id === tarj.id) {
        return { ...t, deudaActual: Math.max(0, (t.deudaActual || 0) - montoEnMonedaTarjeta) };
      }
      return t;
    }));

    // Aplicar el pago de la tarjeta también a las compras en cuotas pendientes de esa tarjeta
    let remanentePago = montoEnMonedaTarjeta;
    setCuotasTarjetas(prev => prev.map(c => {
      if (c.tarjetaId !== tarj.id || c.completada || remanentePago <= 0.01) return c;

      const saldoActualCuota = Math.max(0, Number(c.saldoPendiente ?? 0));
      if (saldoActualCuota <= 0.01) return c;

      const abonoAplicado = Math.min(remanentePago, saldoActualCuota);
      remanentePago -= abonoAplicado;

      const nuevoSaldo = Math.max(0, saldoActualCuota - abonoAplicado);
      const nuevoMontoPagado = Number(c.montoPagado || 0) + abonoAplicado;
      const nuevasCuotasPagadas = Math.floor((nuevoMontoPagado + 0.01) / c.valorCuotaMensual);
      const esCompletada = nuevoSaldo <= 0.01;
      const nuevaCuotaActual = esCompletada
        ? c.totalCuotas
        : Math.min(c.totalCuotas, (c.cuotaInicial || 1) + nuevasCuotasPagadas);

      return {
        ...c,
        cuotaActual: nuevaCuotaActual,
        saldoPendiente: esCompletada ? 0 : nuevoSaldo,
        montoPagado: nuevoMontoPagado,
        cuotasPagadas: nuevasCuotasPagadas,
        completada: esCompletada
      };
    }));

    setMostrarModalPagoTarjeta(false);
    setMontoPagoTarjetaForm('');
  };

  // Préstamos Handlers
  const guardarPrestamo = (e) => {
    e.preventDefault();
    if (!nombrePrestamoForm.trim() || !montoTotalPrestamoForm) return;

    const mTotal = parseFloat(montoTotalPrestamoForm);
    const mPend = montoPendientePrestamoForm ? parseFloat(montoPendientePrestamoForm) : mTotal;

    const nuevoP = {
      id: `prest_${Date.now()}`,
      tipo: tipoPrestamoForm,
      nombre: nombrePrestamoForm.trim(),
      entidad: prestamistaForm.trim() || 'Amigo / Familiar',
      telefono: telefonoContactoForm.trim(),
      esInformal: esInformalForm,
      montoTotal: mTotal,
      montoPendiente: mPend,
      diaVencimiento: diaVencimientoPrestamoForm ? parseInt(diaVencimientoPrestamoForm, 10) : null,
      moneda: monedaPrestamoForm
    };

    setPrestamos(prev => [...prev, nuevoP]);
    setMostrarModalPrestamo(false);
  };

  const enviarRecordatorioWhatsApp = (p) => {
    const textoMensaje = p.tipo === 'otorgado'
      ? `¡Hola ${p.entidad}! 👋 Te escribo para recordarte amablemente del monto pendiente por "${p.nombre}" de ${formatoMoneda(p.montoPendiente, p.moneda)}. Puedes yapearme o plinearme cuando gustes. ¡Muchas gracias! 🙏`
      : `¡Hola ${p.entidad}! 👋 Te escribo para indicarte que tengo pendiente hacerte el pago de ${formatoMoneda(p.montoPendiente, p.moneda)} por "${p.nombre}". Avísame porfa a qué Yape/Plin o cuenta te lo transfiero. 🙌`;
    
    const numTel = p.telefono ? p.telefono.replace(/[^0-9]/g, '') : '';
    const linkWa = numTel 
      ? `https://wa.me/${numTel}?text=${encodeURIComponent(textoMensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(textoMensaje)}`;

    window.open(linkWa, '_blank');
  };

  const eliminarPrestamo = (id) => {
    const prest = prestamos.find(p => p.id === id);
    abrirConfirmacion({
      titulo: 'Eliminar préstamo',
      mensaje: `¿Seguro que deseas eliminar "${prest?.nombre || 'este préstamo'}"?`,
      textoConfirmar: 'Eliminar préstamo',
      variante: 'danger',
      onConfirm: () => {
        setPrestamos(prev => prev.filter(p => p.id !== id));
        mostrarAviso('Préstamo eliminado.', 'ok');
      }
    });
  };

  const registrarAbonoPrestamo = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoAbonoPrestamo);
    if (!monto || monto <= 0 || !prestamoSeleccionadoId || !cuentaOrigenAbonoPrestamoId) return;

    const prest = prestamos.find(p => p.id === prestamoSeleccionadoId);
    const cta = cuentasConSaldosActuales.find(c => c.id === cuentaOrigenAbonoPrestamoId);
    if (!prest || !cta) return;

    const fecha = getFechaLocalHoy();
    const abonoMov = {
      id: `abono_prest_${Date.now()}`,
      tipo: 'pago_prestamo',
      monto: monto,
      descripcion: `Cuota / Abono Préstamo: ${prest.nombre}`,
      categoria: 'Pago de Préstamo',
      fecha,
      moneda: cta.moneda || 'PEN',
      cuentaId: cta.id,
      prestamoId: prest.id,
      metodo: cta.nombre
    };

    setTransacciones(prev => [abonoMov, ...prev]);
    setPrestamos(prev => prev.map(p => {
      if (p.id === prest.id) {
        const montoEnMonedaPrestamo = convertirMoneda(monto, cta.moneda || 'PEN', p.moneda || 'PEN');
        return { ...p, montoPendiente: Math.max(0, (p.montoPendiente || 0) - montoEnMonedaPrestamo) };
      }
      return p;
    }));

    setMostrarModalAbonoPrestamo(false);
    setMontoAbonoPrestamo('');
  };

  // Presupuestos Handlers
  const guardarPresupuesto = (e) => {
    e.preventDefault();
    const limite = parseFloat(limitePresupuestoForm);
    if (!limite || limite <= 0) return;

    setPresupuestos(prev => ({ ...prev, [categoriaPresupuesto]: limite }));
    setMostrarModalPresupuesto(false);
    setLimitePresupuestoForm('');
  };

  const eliminarPresupuesto = (cat) => {
    setPresupuestos(prev => {
      const copy = { ...prev };
      delete copy[cat];
      return copy;
    });
  };

  // Recurrentes Handlers
  const guardarRecurrente = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoRecurrenteForm);
    if (!monto || monto <= 0 || !descRecurrenteForm.trim()) return;

    const ctaId = cuentaRecurrenteId || (cuentasBancarias.length > 0 ? cuentasBancarias[0].id : null);
    const ctaObj = cuentasBancarias.find(c => c.id === ctaId);

    const nuevoRec = {
      id: `rec_${Date.now()}`,
      tipo: tipoRecurrenteForm,
      monto,
      descripcion: descRecurrenteForm.trim(),
      categoria: categoriaRecurrenteForm,
      diaPago: parseInt(diaPagoRecurrenteForm, 10) || 1,
      moneda: monedaRecurrenteForm,
      cuentaId: ctaId,
      metodo: ctaObj ? ctaObj.nombre : 'Cuenta Básica',
      ultimoMesRegistrado: null
    };

    setRecurrentes(prev => [...prev, nuevoRec]);
    setMostrarModalRecurrente(false);
  };

  const eliminarRecurrente = (id) => {
    const rec = recurrentes.find(r => r.id === id);
    abrirConfirmacion({
      titulo: 'Eliminar movimiento recurrente',
      mensaje: `¿Deseas eliminar la recurrencia "${rec?.descripcion || ''}"?`,
      textoConfirmar: 'Eliminar',
      variante: 'danger',
      onConfirm: () => {
        setRecurrentes(prev => prev.filter(r => r.id !== id));
        mostrarAviso('Recurrencia eliminada.', 'ok');
      }
    });
  };

  // Metas de Ahorro Handlers
  const guardarMeta = (e) => {
    e.preventDefault();
    const objetivo = parseFloat(montoObjetivoMetaForm);
    const inicial = parseFloat(montoInicialMetaForm) || 0;
    if (!nombreMetaForm.trim() || !objetivo || objetivo <= 0) return;

    const nuevaMeta = {
      id: `meta_${Date.now()}`,
      nombre: nombreMetaForm.trim(),
      montoObjetivo: objetivo,
      montoActual: Math.max(0, inicial),
      fechaLimite: fechaLimiteMetaForm || '',
      moneda: monedaMetaForm,
      color: colorMetaForm
    };

    setMetas(prev => [...prev, nuevaMeta]);
    setMostrarModalMeta(false);
    setNombreMetaForm('');
    setMontoObjetivoMetaForm('');
    setMontoInicialMetaForm('');
    setFechaLimiteMetaForm('');
    mostrarAviso('Meta de ahorro creada.', 'ok');
  };

  const registrarAporteMeta = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoAporteMetaForm);
    if (!monto || monto <= 0 || !metaSeleccionadaId) return;

    const meta = metas.find(m => m.id === metaSeleccionadaId);
    if (!meta) return;

    const cta = descontarCuentaMeta ? cuentasConSaldosActuales.find(c => c.id === cuentaAporteMetaId) : null;
    const monedaAporte = cta ? (cta.moneda || 'PEN') : (meta.moneda || moneda);
    const montoEnMonedaMeta = convertirMoneda(monto, monedaAporte, meta.moneda || 'PEN');

    setMetas(prev => prev.map(m => {
      if (m.id === meta.id) {
        return { ...m, montoActual: (m.montoActual || 0) + montoEnMonedaMeta };
      }
      return m;
    }));

    if (cta) {
      const movAporte = {
        id: `meta_mov_${Date.now()}`,
        tipo: 'aporte_meta',
        monto,
        descripcion: `Aporte a Meta: ${meta.nombre}`,
        categoria: 'Otros Gastos',
        fecha: getFechaLocalHoy(),
        moneda: monedaAporte,
        cuentaId: cta.id,
        metaId: meta.id,
        metodo: cta.nombre
      };
      setTransacciones(prev => [movAporte, ...prev]);
    }

    setMostrarModalAporteMeta(false);
    setMontoAporteMetaForm('');
    mostrarAviso(`Aporte registrado en "${meta.nombre}".`, 'ok');
  };

  const eliminarMeta = (id) => {
    const meta = metas.find(m => m.id === id);
    abrirConfirmacion({
      titulo: 'Eliminar meta de ahorro',
      mensaje: `¿Seguro que deseas eliminar la meta "${meta?.nombre || ''}"?`,
      textoConfirmar: 'Eliminar meta',
      variante: 'danger',
      onConfirm: () => {
        setMetas(prev => prev.filter(m => m.id !== id));
        mostrarAviso('Meta de ahorro eliminada.', 'ok');
      }
    });
  };

  // Cambio de Moneda Principal con opción de convertir importes o solo visualización
  const handleCambiarMonedaPrincipal = (nuevaMoneda) => {
    if (nuevaMoneda === moneda) return;
    const monedaAnterior = moneda;

    abrirConfirmacion({
      titulo: `Cambiar moneda principal a ${nuevaMoneda}`,
      mensaje: `¿Deseas convertir también tus presupuestos y metas de ${monedaAnterior} a ${nuevaMoneda} usando el tipo de cambio configurado, o solo cambiar la moneda de visualización de los reportes?`,
      textoConfirmar: `Convertir a ${nuevaMoneda}`,
      variante: 'primary',
      onConfirm: () => {
        if (presupuestoGlobal > 0) {
          setPresupuestoGlobal(Math.round(convertirMoneda(presupuestoGlobal, monedaAnterior, nuevaMoneda) * 100) / 100);
        }
        if (Object.keys(presupuestos).length > 0) {
          const convertidos = {};
          Object.entries(presupuestos).forEach(([cat, lim]) => {
            convertidos[cat] = Math.round(convertirMoneda(lim, monedaAnterior, nuevaMoneda) * 100) / 100;
          });
          setPresupuestos(convertidos);
        }
        setMoneda(nuevaMoneda);
        mostrarAviso(`Moneda principal actualizada y presupuestos convertidos a ${nuevaMoneda}.`, 'ok');
      }
    });
    // Cambiar inmediatamente la visualización; si el usuario confirma, además convierte presupuestos
    setMoneda(nuevaMoneda);
  };

  const procesarRecurrente = (rec) => {
    const claveMesAnio = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`;
    if (rec.ultimoMesRegistrado === claveMesAnio) return;

    const numDiasEnMes = new Date(anioSeleccionado, mesSeleccionado + 1, 0).getDate();
    const diaValido = Math.min(rec.diaPago || 1, numDiasEnMes);
    const fechaProgramada = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}-${String(diaValido).padStart(2, '0')}`;

    const nuevaTrans = {
      id: `trans_rec_${Date.now()}`,
      tipo: rec.tipo,
      monto: rec.monto,
      descripcion: rec.descripcion,
      categoria: rec.categoria,
      fecha: fechaProgramada,
      moneda: rec.moneda || 'PEN',
      esCredito: false,
      cuentaId: rec.cuentaId,
      metodo: rec.metodo || 'Cuenta'
    };

    setTransacciones(prev => [nuevaTrans, ...prev]);
    setRecurrentes(prev => prev.map(r => r.id === rec.id ? { ...r, ultimoMesRegistrado: claveMesAnio } : r));
  };

  // Cierre de Mes Manual
  const ejecutarCierreMes = () => {
    const clavePeriodo = `${NOMBRES_MESES[mesSeleccionado]} ${anioSeleccionado}`;
    const nuevoCierre = {
      id: `cierre_${Date.now()}`,
      periodo: clavePeriodo,
      fechaCierre: getFechaLocalHoy(),
      ingresos: resumen.ingresos,
      gastos: resumen.totalGastosDelMes,
      balanceNeto: resumen.balanceNetoMes,
      saldoLiquidoFinal: saldoLiquidoTotal,
      moneda
    };

    const nuevosMovsCierre = [];
    const mesSiguienteObj = new Date(anioSeleccionado, mesSeleccionado + 1, 1);
    const diasEnMesSig = new Date(mesSiguienteObj.getFullYear(), mesSiguienteObj.getMonth() + 1, 0).getDate();

    // Avanzar al siguiente período las compras en cuotas activas al cerrar el mes y generar su gasto
    setCuotasTarjetas(prev => prev.map(c => {
      if (c.completada || c.ultimoCierreAplicado === clavePeriodo) return c;
      if (c.cuotaActual >= c.totalCuotas) return c;

      const siguienteCuota = c.cuotaActual + 1;
      const generadas = Array.isArray(c.cuotasGeneradas) ? [...c.cuotasGeneradas] : [c.cuotaActual];

      if (!generadas.includes(siguienteCuota)) {
        generadas.push(siguienteCuota);
        const diaValido = Math.min(c.diaFacturacion || 1, diasEnMesSig);
        const fechaSigMes = `${mesSiguienteObj.getFullYear()}-${String(mesSiguienteObj.getMonth() + 1).padStart(2, '0')}-${String(diaValido).padStart(2, '0')}`;

        nuevosMovsCierre.push({
          id: `trans_cuota_${c.id}_${siguienteCuota}_${Date.now()}`,
          tipo: 'gasto',
          monto: c.valorCuotaMensual,
          descripcion: `${c.concepto} (Cuota ${siguienteCuota}/${c.totalCuotas})`,
          nota: `Compra en cuotas • Total: ${formatoMoneda(c.montoTotal, c.moneda || 'PEN')}`,
          categoria: c.categoria || 'Compras',
          fecha: fechaSigMes,
          moneda: c.moneda || 'PEN',
          esCredito: true,
          tarjetaId: c.tarjetaId,
          metodo: c.tarjetaNombre,
          cuotaId: c.id,
          numeroCuota: siguienteCuota
        });
      }

      return {
        ...c,
        cuotaActual: siguienteCuota,
        cuotasGeneradas: generadas,
        ultimoCierreAplicado: clavePeriodo
      };
    }));

    if (nuevosMovsCierre.length > 0) {
      setTransacciones(prev => [...nuevosMovsCierre, ...prev]);
    }

    setCierresHistoricos(prev => [nuevoCierre, ...prev.filter(c => c.periodo !== clavePeriodo)]);
    setMostrarModalCierre(false);
  };

  // Respaldo JSON / CSV
  const exportarRespaldo = () => {
    const data = {
      transacciones,
      cuentasBancarias,
      tarjetas,
      cuotasTarjetas,
      prestamos,
      presupuestos,
      presupuestoGlobal,
      recurrentes,
      metas,
      moneda,
      tiposCambio,
      catGastosPers,
      catIngresosPers,
      cierresHistoricos
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_finanzas_${user.username}_${getFechaLocalHoy()}.json`;
    a.click();
  };

  const importarRespaldo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = event.target?.result;
        if (typeof rawText !== 'string' || !rawText.trim()) {
          throw new Error('Archivo vacío');
        }

        const imported = JSON.parse(rawText);

        // Validar que sea un objeto JSON plano (no null, primitivo ni arreglo)
        if (!esObjetoPlano(imported)) {
          throw new Error('El contenido del archivo no corresponde a un objeto de respaldo válido.');
        }

        // Comprobar que incluya al menos una clave esperada de respaldo de la aplicación
        const clavesEsperadas = [
          'transacciones',
          'cuentasBancarias',
          'tarjetas',
          'cuotasTarjetas',
          'prestamos',
          'presupuestos',
          'presupuestoGlobal',
          'recurrentes',
          'metas',
          'moneda',
          'tiposCambio',
          'catGastosPers',
          'catIngresosPers',
          'cierresHistoricos'
        ];
        const tieneClaveValida = clavesEsperadas.some((clave) => Object.prototype.hasOwnProperty.call(imported, clave));
        if (!tieneClaveValida) {
          throw new Error('El archivo JSON no contiene datos reconocibles de esta aplicación.');
        }

        // Validar y sanear cada sección antes de mutar el estado
        const nuevasTrans = imported.transacciones !== undefined ? sanearArrayObjetos(imported.transacciones, sanearTransaccion) : null;
        if (imported.transacciones !== undefined && nuevasTrans === null) {
          throw new Error('Formato inválido en la lista de transacciones.');
        }

        const nuevasCuentas = imported.cuentasBancarias !== undefined ? sanearArrayObjetos(imported.cuentasBancarias, sanearCuenta) : null;
        if (imported.cuentasBancarias !== undefined && nuevasCuentas === null) {
          throw new Error('Formato inválido en las cuentas bancarias.');
        }

        const nuevasTarjetas = imported.tarjetas !== undefined ? sanearArrayObjetos(imported.tarjetas, sanearTarjeta) : null;
        if (imported.tarjetas !== undefined && nuevasTarjetas === null) {
          throw new Error('Formato inválido en las tarjetas.');
        }

        const nuevasCuotas = imported.cuotasTarjetas !== undefined ? sanearArrayObjetos(imported.cuotasTarjetas, sanearCuotaTarjeta) : null;
        if (imported.cuotasTarjetas !== undefined && nuevasCuotas === null) {
          throw new Error('Formato inválido en las compras en cuotas.');
        }

        const nuevosPrestamos = imported.prestamos !== undefined ? sanearArrayObjetos(imported.prestamos, sanearPrestamo) : null;
        if (imported.prestamos !== undefined && nuevosPrestamos === null) {
          throw new Error('Formato inválido en los préstamos.');
        }

        const nuevosRecurrentes = imported.recurrentes !== undefined ? sanearArrayObjetos(imported.recurrentes, sanearRecurrente) : null;
        if (imported.recurrentes !== undefined && nuevosRecurrentes === null) {
          throw new Error('Formato inválido en los movimientos recurrentes.');
        }

        const nuevosCierres = imported.cierresHistoricos !== undefined ? sanearArrayObjetos(imported.cierresHistoricos, sanearCierre) : null;
        if (imported.cierresHistoricos !== undefined && nuevosCierres === null) {
          throw new Error('Formato inválido en el historial de cierres.');
        }

        let nuevosPresupuestos = null;
        if (imported.presupuestos !== undefined) {
          if (!esObjetoPlano(imported.presupuestos)) {
            throw new Error('Formato inválido en los presupuestos.');
          }
          nuevosPresupuestos = {};
          Object.entries(imported.presupuestos).forEach(([cat, limite]) => {
            const num = Number(limite);
            if (typeof cat === 'string' && cat.trim() && Number.isFinite(num) && num > 0) {
              nuevosPresupuestos[cat] = num;
            }
          });
        }

        let nuevoPresupuestoGlobal = null;
        if (imported.presupuestoGlobal !== undefined) {
          const pgNum = Number(imported.presupuestoGlobal);
          if (!Number.isFinite(pgNum) || pgNum < 0) {
            throw new Error('Formato inválido en el presupuesto global.');
          }
          nuevoPresupuestoGlobal = pgNum;
        }

        let nuevosTiposCambio = null;
        if (imported.tiposCambio !== undefined) {
          if (!esObjetoPlano(imported.tiposCambio)) {
            throw new Error('Formato inválido en los tipos de cambio.');
          }
          nuevosTiposCambio = { ...TIPOS_CAMBIO_DEFECTO };
          Object.keys(TIPOS_CAMBIO_DEFECTO).forEach((k) => {
            const val = Number(imported.tiposCambio[k]);
            if (Number.isFinite(val) && val > 0) nuevosTiposCambio[k] = val;
          });
        }

        const nuevasCatGastos = imported.catGastosPers !== undefined ? sanearArrayStrings(imported.catGastosPers) : null;
        const nuevasCatIngresos = imported.catIngresosPers !== undefined ? sanearArrayStrings(imported.catIngresosPers) : null;

        // Aplicar cambios ya validados
        if (nuevasTrans) setTransacciones(nuevasTrans);
        if (nuevasCuentas) setCuentasBancarias(nuevasCuentas);
        if (nuevasTarjetas) setTarjetas(nuevasTarjetas);
        if (nuevasCuotas) setCuotasTarjetas(nuevasCuotas);
        if (nuevosPrestamos) setPrestamos(nuevosPrestamos);
        if (nuevosPresupuestos) setPresupuestos(nuevosPresupuestos);
        if (nuevoPresupuestoGlobal !== null) setPresupuestoGlobal(nuevoPresupuestoGlobal);
        if (nuevosRecurrentes) setRecurrentes(nuevosRecurrentes);
        if (imported.metas !== undefined) {
          const nuevasMetas = sanearArrayObjetos(imported.metas, sanearMeta);
          if (nuevasMetas) setMetas(nuevasMetas);
        }
        if (nuevasCatGastos && nuevasCatGastos.length > 0) setCatGastosPers(nuevasCatGastos);
        if (nuevasCatIngresos && nuevasCatIngresos.length > 0) setCatIngresosPers(nuevasCatIngresos);
        if (nuevosCierres) setCierresHistoricos(nuevosCierres);
        if (MONEDAS_VALIDAS.includes(imported.moneda)) setMoneda(imported.moneda);
        if (nuevosTiposCambio) setTiposCambio(nuevosTiposCambio);

        setMensajeRespaldo({ tipo: 'ok', texto: '¡Respaldo importado y verificado con éxito!' });
      } catch (err) {
        setMensajeRespaldo({
          tipo: 'error',
          texto: `Archivo de respaldo no válido: ${err?.message || 'formato JSON incorrecto'}. No se modificaron tus datos actuales.`
        });
      } finally {
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      setMensajeRespaldo({ tipo: 'error', texto: 'No se pudo leer el archivo seleccionado.' });
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const exportarCSV = () => {
    let csv = 'Fecha,Tipo,Concepto,Nota/Detalle,Categoria,Metodo/Cuenta,Monto,Moneda\n';
    transacciones.forEach(t => {
      csv += `"${t.fecha}","${t.tipo}","${t.descripcion}","${t.nota || ''}","${t.categoria}","${t.metodo}",${t.monto},"${t.moneda || 'PEN'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos_${user.username}_${getFechaLocalHoy()}.csv`;
    a.click();
  };

  // Generación de Reporte PDF limpio e imprimible con todos los apartados configurables
  const generarReportePDF = () => {
    const escaparHtml = (str) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const fechaGeneracion = new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 1. Determinar rango de fechas y etiqueta del período
    let etiquetaPeriodo = '';
    let fechaDesde = '';
    let fechaHasta = '';

    if (pdfTipoPeriodo === 'mes') {
      etiquetaPeriodo = `${NOMBRES_MESES[mesSeleccionado]} ${anioSeleccionado}`;
      const ultimoDia = new Date(anioSeleccionado, mesSeleccionado + 1, 0).getDate();
      fechaDesde = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}-01`;
      fechaHasta = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    } else if (pdfTipoPeriodo === 'anio') {
      etiquetaPeriodo = `Año Completo ${anioSeleccionado}`;
      fechaDesde = `${anioSeleccionado}-01-01`;
      fechaHasta = `${anioSeleccionado}-12-31`;
    } else {
      fechaDesde = pdfFechaInicio || getFechaLocalHoy();
      fechaHasta = pdfFechaFin || fechaDesde;
      if (fechaDesde > fechaHasta) {
        const tmp = fechaDesde;
        fechaDesde = fechaHasta;
        fechaHasta = tmp;
      }
      etiquetaPeriodo = `Del ${fechaDesde} al ${fechaHasta}`;
    }

    // Filtrar transacciones dentro del período
    const movsPeriodo = transacciones
      .filter((t) => {
        const f = (t.fecha || '').slice(0, 10);
        return f >= fechaDesde && f <= fechaHasta;
      })
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

    // 2. Calcular Resumen del período
    let ingresosP = 0;
    let gastosLiquidosP = 0;
    let gastosCreditoP = 0;
    let otrosEgresosLiquidosP = 0;
    const gastosPorCatMap = {};

    movsPeriodo.forEach((t) => {
      const montoConv = convertirMoneda(t.monto, t.moneda || 'PEN', moneda);
      if (t.tipo === 'ingreso') {
        ingresosP += montoConv;
      } else if (t.tipo === 'gasto') {
        if (t.esCredito) {
          gastosCreditoP += montoConv;
        } else {
          gastosLiquidosP += montoConv;
        }
        const cat = t.categoria || 'Otros Gastos';
        gastosPorCatMap[cat] = (gastosPorCatMap[cat] || 0) + montoConv;
      } else if (t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo' || t.tipo === 'aporte_meta') {
        otrosEgresosLiquidosP += montoConv;
      }
    });

    const gastosTotalesP = gastosLiquidosP + gastosCreditoP;
    const balanceP = ingresosP - gastosTotalesP;
    const pctAhorroP = ingresosP > 0 ? Math.round((balanceP / ingresosP) * 1000) / 10 : 0;

    // Comparativa con el mes anterior (cuando aplica)
    let bloqueComparativaHtml = '';
    if (pdfCompararAnterior && pdfTipoPeriodo === 'mes') {
      const mesAnt = mesSeleccionado === 0 ? 11 : mesSeleccionado - 1;
      const anioAnt = mesSeleccionado === 0 ? anioSeleccionado - 1 : anioSeleccionado;
      let ingAnt = 0;
      let gasAnt = 0;

      transacciones.forEach((t) => {
        const [yS, mS] = (t.fecha || '').split('-');
        if (parseInt(yS, 10) === anioAnt && parseInt(mS, 10) - 1 === mesAnt) {
          const mc = convertirMoneda(t.monto, t.moneda || 'PEN', moneda);
          if (t.tipo === 'ingreso') ingAnt += mc;
          else if (t.tipo === 'gasto') gasAnt += mc;
        }
      });

      const balAnt = ingAnt - gasAnt;
      const diffIng = ingresosP - ingAnt;
      const diffGas = gastosTotalesP - gasAnt;
      const diffBal = balanceP - balAnt;
      const fmtDelta = (val, invertirColor = false) => {
        const signo = val > 0 ? '+' : '';
        const positivo = invertirColor ? val <= 0 : val >= 0;
        const color = positivo ? '#059669' : '#dc2626';
        return `<span style="color:${color};font-weight:700;">${signo}${escaparHtml(formatoMoneda(val, moneda))}</span>`;
      };

      bloqueComparativaHtml = `
        <div class="compare-box">
          <div class="compare-title">Comparativa frente al mes anterior (${escaparHtml(NOMBRES_MESES[mesAnt])} ${anioAnt})</div>
          <div class="compare-grid">
            <div>Ingresos mes anterior: <strong>${escaparHtml(formatoMoneda(ingAnt, moneda))}</strong> (${fmtDelta(diffIng)})</div>
            <div>Gastos mes anterior: <strong>${escaparHtml(formatoMoneda(gasAnt, moneda))}</strong> (${fmtDelta(diffGas, true)})</div>
            <div>Balance mes anterior: <strong>${escaparHtml(formatoMoneda(balAnt, moneda))}</strong> (${fmtDelta(diffBal)})</div>
          </div>
        </div>
      `;
    }

    // 3. Tabla de Gastos por Categoría y Presupuestos
    const categoriasOrdenadas = Object.entries(gastosPorCatMap).sort((a, b) => b[1] - a[1]);
    // Incluir categorías que tengan presupuesto definido aunque el gasto sea 0 en el período
    Object.keys(presupuestos).forEach((catPres) => {
      if (!Object.prototype.hasOwnProperty.call(gastosPorCatMap, catPres)) {
        categoriasOrdenadas.push([catPres, 0]);
      }
    });

    const multiplicadorPresupuesto = pdfTipoPeriodo === 'anio' ? 12 : 1;
    const filasCategoriasHtml =
      categoriasOrdenadas.length === 0
        ? `<tr><td colspan="5" class="empty">No se registraron gastos por categoría en este período.</td></tr>`
        : categoriasOrdenadas
            .map(([cat, montoCat]) => {
              const pctTotal = gastosTotalesP > 0 ? ((montoCat / gastosTotalesP) * 100).toFixed(1) : '0.0';
              const limiteBase = Number(presupuestos[cat] || 0);
              const limiteAplicable = limiteBase * multiplicadorPresupuesto;
              let colPresupuesto = '<span class="muted">Sin límite</span>';
              let colEstado = '<span class="muted">—</span>';

              if (limiteAplicable > 0) {
                const pctUso = Math.round((montoCat / limiteAplicable) * 100);
                const excedido = montoCat > limiteAplicable;
                colPresupuesto = `${escaparHtml(formatoMoneda(montoCat, moneda))} / ${escaparHtml(formatoMoneda(limiteAplicable, moneda))}`;
                colEstado = `<span class="badge ${excedido ? 'badge-danger' : pctUso >= 80 ? 'badge-warn' : 'badge-ok'}">${pctUso}% ${excedido ? '(Excedido)' : ''}</span>`;
              }

              return `
                <tr>
                  <td><strong>${escaparHtml(cat)}</strong></td>
                  <td class="num">${escaparHtml(formatoMoneda(montoCat, moneda))}</td>
                  <td class="num">${pctTotal}%</td>
                  <td class="num">${colPresupuesto}</td>
                  <td class="center">${colEstado}</td>
                </tr>
              `;
            })
            .join('');

    // 4. Detalle de Movimientos ordenados por fecha con totales al final
    let totalEntradasDetalle = 0;
    let totalSalidasDetalle = 0;

    const filasMovimientosHtml =
      movsPeriodo.length === 0
        ? `<tr><td colspan="5" class="empty">No hay movimientos registrados en el período seleccionado.</td></tr>`
        : movsPeriodo
            .map((t) => {
              const esEntrada = t.tipo === 'ingreso' || t.tipo === 'transferencia_entrada';
              const esTransferencia = t.tipo === 'transferencia_salida' || t.tipo === 'transferencia_entrada';
              const montoConv = convertirMoneda(t.monto, t.moneda || 'PEN', moneda);

              if (!esTransferencia) {
                if (esEntrada) totalEntradasDetalle += montoConv;
                else totalSalidasDetalle += montoConv;
              }

              const etiquetaExtra = t.esCredito
                ? ' [Crédito]'
                : esTransferencia
                  ? ' [Transferencia]'
                  : '';
              const textoMontoOriginal =
                (t.moneda || 'PEN') !== moneda
                  ? ` <span class="muted">(${escaparHtml(formatoMoneda(t.monto, t.moneda))})</span>`
                  : '';

              return `
                <tr>
                  <td class="nowrap">${escaparHtml(t.fecha)}</td>
                  <td>
                    ${escaparHtml(t.descripcion || 'Movimiento')}${etiquetaExtra}
                    ${t.nota ? `<div class="subnote">${escaparHtml(t.nota)}</div>` : ''}
                  </td>
                  <td>${escaparHtml(t.categoria || '—')}</td>
                  <td>${escaparHtml(t.metodo || '—')}</td>
                  <td class="num ${esTransferencia ? 'txt-blue' : esEntrada ? 'txt-green' : 'txt-red'}">
                    ${esEntrada ? '+' : '-'}${escaparHtml(formatoMoneda(montoConv, moneda))}${textoMontoOriginal}
                  </td>
                </tr>
              `;
            })
            .join('');

    // OPCIONAL A: Saldos por Cuenta, Deudas y Próximos Vencimientos
    let seccionCuentasDeudasHtml = '';
    if (pdfIncluirCuentasDeudas) {
      const filasCuentas =
        cuentasConSaldosActuales.length === 0
          ? `<tr><td colspan="4" class="empty">Sin cuentas registradas.</td></tr>`
          : cuentasConSaldosActuales
              .map((c) => {
                const conv = convertirMoneda(c.saldoActual, c.moneda || 'PEN', moneda);
                return `
                  <tr>
                    <td><strong>${escaparHtml(c.nombre)}</strong></td>
                    <td>${escaparHtml(c.tipo || 'Bancaria')}</td>
                    <td>${escaparHtml(c.moneda || 'PEN')}</td>
                    <td class="num ${c.saldoActual < 0 ? 'txt-red' : 'txt-green'}">
                      ${escaparHtml(formatoMoneda(c.saldoActual, c.moneda || 'PEN'))}
                      ${(c.moneda || 'PEN') !== moneda ? `<span class="muted"> (≈ ${escaparHtml(formatoMoneda(conv, moneda))})</span>` : ''}
                    </td>
                  </tr>
                `;
              })
              .join('');

      const deudasLista = [
        ...tarjetas.map((t) => ({
          tipo: 'Tarjeta de Crédito',
          nombre: t.nombre,
          vencimiento: t.diaVencimiento ? `Día ${t.diaVencimiento} de cada mes` : 'Sin fecha definida',
          saldo: t.deudaActual || 0,
          monedaItem: t.moneda || 'PEN',
          detalle: `Límite: ${formatoMoneda(t.limite || 0, t.moneda || 'PEN')}`
        })),
        ...prestamos
          .filter((p) => (p.montoPendiente || 0) > 0)
          .map((p) => ({
            tipo: p.tipo === 'otorgado' ? 'Préstamo por Cobrar' : 'Préstamo por Pagar',
            nombre: `${p.nombre} (${p.entidad})`,
            vencimiento: p.diaVencimiento ? `Día ${p.diaVencimiento}` : 'Sin fecha fija',
            saldo: p.montoPendiente || 0,
            monedaItem: p.moneda || 'PEN',
            detalle: `Total: ${formatoMoneda(p.montoTotal || 0, p.moneda || 'PEN')}`
          }))
      ];

      const filasDeudas =
        deudasLista.length === 0
          ? `<tr><td colspan="4" class="empty">Sin deudas de tarjetas ni préstamos activos.</td></tr>`
          : deudasLista
              .map(
                (d) => `
                  <tr>
                    <td><strong>${escaparHtml(d.nombre)}</strong><div class="subnote">${escaparHtml(d.tipo)} • ${escaparHtml(d.detalle)}</div></td>
                    <td>${escaparHtml(d.vencimiento)}</td>
                    <td>${escaparHtml(d.monedaItem)}</td>
                    <td class="num ${d.tipo === 'Préstamo por Cobrar' ? 'txt-green' : 'txt-red'}">${escaparHtml(formatoMoneda(d.saldo, d.monedaItem))}</td>
                  </tr>
                `
              )
              .join('');

      const vencimientosHtml =
        proximosVencimientos.length > 0
          ? `<div class="alert-box"><strong>Próximos vencimientos detectados:</strong> ${proximosVencimientos
              .map(
                (v) =>
                  `${escaparHtml(v.tipo)} ${escaparHtml(v.nombre)} (${
                    v.vencido ? `Vencido hace ${Math.abs(v.dias)}d` : v.dias === 0 ? 'Vence hoy' : `en ${v.dias}d - Día ${v.diaPago}`
                  }: ${escaparHtml(v.montoTexto)})`
              )
              .join(' • ')}</div>`
          : '';

      seccionCuentasDeudasHtml = `
        <section class="section">
          <h2>5. Saldos por Cuenta, Deudas y Vencimientos</h2>
          <p class="section-desc">Liquidez total consolidada: <strong>${escaparHtml(formatoMoneda(saldoLiquidoTotal, moneda))}</strong> • Deuda total en tarjetas: <strong>${escaparHtml(formatoMoneda(resumenTarjetas.deudaTotal, moneda))}</strong></p>
          <table>
            <thead>
              <tr>
                <th>Cuenta / Billetera</th>
                <th>Tipo</th>
                <th>Moneda</th>
                <th class="num">Saldo Actual</th>
              </tr>
            </thead>
            <tbody>${filasCuentas}</tbody>
          </table>
          <div style="height:10px;"></div>
          <table>
            <thead>
              <tr>
                <th>Tarjeta / Préstamo</th>
                <th>Vencimiento</th>
                <th>Moneda</th>
                <th class="num">Saldo Pendiente</th>
              </tr>
            </thead>
            <tbody>${filasDeudas}</tbody>
          </table>
          ${vencimientosHtml}
        </section>
      `;
    }

    // OPCIONAL B: Resumen Anual mes a mes
    let seccionAnualHtml = '';
    if (pdfIncluirResumenAnual) {
      const filasAnual = resumenAnual.meses
        .map(
          (m) => `
            <tr>
              <td><strong>${escaparHtml(m.mes)}</strong></td>
              <td class="num txt-green">${escaparHtml(formatoMoneda(m.ingresos, moneda))}</td>
              <td class="num">${escaparHtml(formatoMoneda(m.gastosLiquidos, moneda))}</td>
              <td class="num">${escaparHtml(formatoMoneda(m.gastosCredito, moneda))}</td>
              <td class="num txt-red">${escaparHtml(formatoMoneda(m.gastosTotales, moneda))}</td>
              <td class="num ${m.balance >= 0 ? 'txt-green' : 'txt-red'}">${escaparHtml(formatoMoneda(m.balance, moneda))}</td>
            </tr>
          `
        )
        .join('');

      seccionAnualHtml = `
        <section class="section">
          <h2>${pdfIncluirCuentasDeudas ? '6' : '5'}. Evolución Anual (${anioSeleccionado})</h2>
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th class="num">Ingresos</th>
                <th class="num">Gastos Líquidos</th>
                <th class="num">Crédito</th>
                <th class="num">Total Gastos</th>
                <th class="num">Balance Neto</th>
              </tr>
            </thead>
            <tbody>${filasAnual}</tbody>
            <tfoot>
              <tr>
                <td><strong>TOTAL ${anioSeleccionado}</strong></td>
                <td class="num txt-green"><strong>${escaparHtml(formatoMoneda(resumenAnual.totalIngresosAnio, moneda))}</strong></td>
                <td class="num"><strong>${escaparHtml(formatoMoneda(resumenAnual.totalLiquidoAnio, moneda))}</strong></td>
                <td class="num"><strong>${escaparHtml(formatoMoneda(resumenAnual.totalCreditoAnio, moneda))}</strong></td>
                <td class="num txt-red"><strong>${escaparHtml(formatoMoneda(resumenAnual.totalGastosAnio, moneda))}</strong></td>
                <td class="num ${resumenAnual.ahorroNetoAnio >= 0 ? 'txt-green' : 'txt-red'}"><strong>${escaparHtml(formatoMoneda(resumenAnual.ahorroNetoAnio, moneda))} (${resumenAnual.tasaAhorroAnio}%)</strong></td>
              </tr>
            </tfoot>
          </table>
        </section>
      `;
    }

    // OPCIONAL C: Metas de Ahorro
    let seccionMetasHtml = '';
    if (pdfIncluirMetas) {
      const numSec = 5 + (pdfIncluirCuentasDeudas ? 1 : 0) + (pdfIncluirResumenAnual ? 1 : 0);
      const filasMetas =
        metas.length === 0
          ? `<tr><td colspan="5" class="empty">No hay metas de ahorro registradas.</td></tr>`
          : metas
              .map((m) => {
                const pct = m.montoObjetivo > 0 ? Math.min(100, Math.round(((m.montoActual || 0) / m.montoObjetivo) * 100)) : 0;
                const faltante = Math.max(0, (m.montoObjetivo || 0) - (m.montoActual || 0));
                return `
                  <tr>
                    <td><strong>${escaparHtml(m.nombre)}</strong>${m.fechaLimite ? `<div class="subnote">Fecha límite: ${escaparHtml(m.fechaLimite)}</div>` : ''}</td>
                    <td class="num txt-green">${escaparHtml(formatoMoneda(m.montoActual || 0, m.moneda || 'PEN'))}</td>
                    <td class="num">${escaparHtml(formatoMoneda(m.montoObjetivo || 0, m.moneda || 'PEN'))}</td>
                    <td class="num">${escaparHtml(formatoMoneda(faltante, m.moneda || 'PEN'))}</td>
                    <td class="center"><strong>${pct}%</strong></td>
                  </tr>
                `;
              })
              .join('');

      seccionMetasHtml = `
        <section class="section">
          <h2>${numSec}. Metas de Ahorro</h2>
          <table>
            <thead>
              <tr>
                <th>Meta / Objetivo</th>
                <th class="num">Ahorrado</th>
                <th class="num">Objetivo</th>
                <th class="num">Faltante</th>
                <th class="center">Avance</th>
              </tr>
            </thead>
            <tbody>${filasMetas}</tbody>
          </table>
        </section>
      `;
    }

    const htmlDocumento = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte Financiero - ${escaparHtml(etiquetaPeriodo)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 24px 32px;
      font-size: 11px;
      line-height: 1.45;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .header h1 {
      margin: 0 0 4px 0;
      font-size: 20px;
      color: #0f172a;
    }
    .header .subtitle {
      color: #475569;
      font-size: 12px;
      font-weight: 600;
    }
    .meta-box {
      text-align: right;
      font-size: 10.5px;
      color: #475569;
    }
    .meta-box strong { color: #0f172a; }
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-break {
      margin-bottom: 20px;
    }
    h2 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #312e81;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 0 0 10px 0;
    }
    .section-desc {
      margin: 0 0 8px 0;
      color: #475569;
      font-size: 11px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 10px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 9.5px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }
    .kpi-value {
      font-size: 15px;
      font-weight: 800;
      margin-top: 3px;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .compare-box {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 10.5px;
    }
    .compare-title {
      font-weight: 700;
      color: #3730a3;
      margin-bottom: 4px;
    }
    .compare-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    th, td {
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9.5px;
    }
    tfoot td {
      background: #f8fafc;
      border-top: 2px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
    }
    .num { text-align: right; white-space: nowrap; }
    .center { text-align: center; }
    .nowrap { white-space: nowrap; }
    .empty { text-align: center; color: #94a3b8; padding: 14px; font-style: italic; }
    .muted { color: #64748b; font-size: 9.5px; }
    .subnote { color: #64748b; font-size: 9.5px; margin-top: 1px; }
    .txt-green { color: #059669; font-weight: 700; }
    .txt-red { color: #dc2626; font-weight: 700; }
    .txt-blue { color: #2563eb; font-weight: 700; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 999px;
      font-size: 9px;
      font-weight: 700;
    }
    .badge-ok { background: #d1fae5; color: #065f46; }
    .badge-warn { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .alert-box {
      margin-top: 8px;
      padding: 8px 10px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      font-size: 10px;
      color: #92400e;
    }
    .no-print-bar {
      background: #1e293b;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 10px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    .no-print-bar button {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      body { padding: 0; }
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span>Vista previa lista para guardar como PDF (en el cuadro de impresión elige <strong>"Guardar como PDF"</strong>).</span>
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>

  <!-- 1. ENCABEZADO -->
  <header class="header">
    <div>
      <h1>Reporte Financiero Personal</h1>
      <div class="subtitle">Período: ${escaparHtml(etiquetaPeriodo)}</div>
    </div>
    <div class="meta-box">
      <div>Usuario: <strong>@${escaparHtml(user.username)}</strong></div>
      <div>Moneda del reporte: <strong>${escaparHtml(moneda)}</strong></div>
      <div>Generado el: <strong>${escaparHtml(fechaGeneracion)}</strong></div>
    </div>
  </header>

  <!-- 2. RESUMEN DEL PERÍODO -->
  <section class="section">
    <h2>2. Resumen del Período</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Ingresos Totales</div>
        <div class="kpi-value txt-green">${escaparHtml(formatoMoneda(ingresosP, moneda))}</div>
        <div class="kpi-sub">${movsPeriodo.filter((m) => m.tipo === 'ingreso').length} ingresos registrados</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Gastos Totales</div>
        <div class="kpi-value txt-red">${escaparHtml(formatoMoneda(gastosTotalesP, moneda))}</div>
        <div class="kpi-sub">Líquido: ${escaparHtml(formatoMoneda(gastosLiquidosP, moneda))} | Crédito: ${escaparHtml(formatoMoneda(gastosCreditoP, moneda))}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Balance Neto</div>
        <div class="kpi-value ${balanceP >= 0 ? 'txt-green' : 'txt-red'}">${escaparHtml(formatoMoneda(balanceP, moneda))}</div>
        <div class="kpi-sub">Pagos deuda/metas: ${escaparHtml(formatoMoneda(otrosEgresosLiquidosP, moneda))}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Porcentaje Ahorrado</div>
        <div class="kpi-value ${pctAhorroP >= 0 ? 'txt-green' : 'txt-red'}">${pctAhorroP}%</div>
        <div class="kpi-sub">${ingresosP > 0 ? 'Respecto a tus ingresos' : 'Sin ingresos en el período'}</div>
      </div>
    </div>
    ${bloqueComparativaHtml}
  </section>

  <!-- 3. GASTOS POR CATEGORÍA Y PRESUPUESTOS -->
  <section class="section">
    <h2>3. Gastos por Categoría y Presupuestos</h2>
    <table>
      <thead>
        <tr>
          <th>Categoría</th>
          <th class="num">Gastado</th>
          <th class="num">% del Total</th>
          <th class="num">Gastado / Límite</th>
          <th class="center">Estado Presupuesto</th>
        </tr>
      </thead>
      <tbody>${filasCategoriasHtml}</tbody>
      <tfoot>
        <tr>
          <td><strong>TOTAL GASTOS POR CATEGORÍA</strong></td>
          <td class="num txt-red"><strong>${escaparHtml(formatoMoneda(gastosTotalesP, moneda))}</strong></td>
          <td class="num"><strong>100%</strong></td>
          <td class="num" colspan="2">${presupuestoGlobal > 0 ? `Límite global mensual: ${escaparHtml(formatoMoneda(presupuestoGlobal * multiplicadorPresupuesto, moneda))}` : ''}</td>
        </tr>
      </tfoot>
    </table>
  </section>

  <!-- 4. DETALLE DE MOVIMIENTOS -->
  <section class="section-break">
    <h2>4. Detalle de Movimientos (${movsPeriodo.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Concepto</th>
          <th>Categoría</th>
          <th>Cuenta / Tarjeta</th>
          <th class="num">Monto (${escaparHtml(moneda)})</th>
        </tr>
      </thead>
      <tbody>${filasMovimientosHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="4"><strong>TOTALES DEL PERÍODO (Entradas: ${escaparHtml(formatoMoneda(totalEntradasDetalle, moneda))} | Salidas: ${escaparHtml(formatoMoneda(totalSalidasDetalle, moneda))})</strong></td>
          <td class="num ${totalEntradasDetalle - totalSalidasDetalle >= 0 ? 'txt-green' : 'txt-red'}">
            <strong>Neto: ${escaparHtml(formatoMoneda(totalEntradasDetalle - totalSalidasDetalle, moneda))}</strong>
          </td>
        </tr>
      </tfoot>
    </table>
  </section>

  ${seccionCuentasDeudasHtml}
  ${seccionAnualHtml}
  ${seccionMetasHtml}
</body>
</html>`;

    const ventanaImpresion = window.open('', '_blank', 'width=980,height=780');
    if (!ventanaImpresion) {
      mostrarAviso('Tu navegador bloqueó la ventana emergente del PDF. Permite ventanas emergentes e inténtalo de nuevo.', 'error');
      return;
    }

    ventanaImpresion.document.open();
    ventanaImpresion.document.write(htmlDocumento);
    ventanaImpresion.document.close();

    setTimeout(() => {
      try {
        ventanaImpresion.focus();
        ventanaImpresion.print();
      } catch (e) {
        // El usuario puede pulsar el botón manual dentro de la ventana
      }
    }, 350);

    setMostrarModalPdf(false);
    mostrarAviso('Reporte PDF generado. Elige "Guardar como PDF" en la ventana de impresión.', 'ok');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {modoAuth === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p className="text-xs text-slate-500">
              Ingresa con tu nombre de usuario para gestionar tus finanzas multi-moneda.
            </p>
          </div>

          {errorAuth && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorAuth}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de Usuario</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej: demo"
                  value={usernameForm}
                  onChange={(e) => setUsernameForm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm}
                  onChange={(e) => setPasswordForm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            {modoAuth === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pregunta de Seguridad</label>
                  <select
                    value={preguntaForm}
                    onChange={(e) => setPreguntaForm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
                    <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
                    <option value="¿Cuál es tu comida favorita?">¿Cuál es tu comida favorita?</option>
                    <option value="¿Nombre de tu colegio de primaria?">¿Nombre de tu colegio de primaria?</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Respuesta Secreta</label>
                  <input
                    type="text"
                    required
                    placeholder="Tu respuesta para recuperar cuenta..."
                    value={respuestaForm}
                    onChange={(e) => setRespuestaForm(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </>
            )}

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
              <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Moneda Principal con la que deseas iniciar
              </label>
              <select
                value={monedaInicioForm}
                onChange={(e) => setMonedaInicioForm(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PEN">PEN — Soles Peruanos (S/)</option>
                <option value="USD">USD — Dólares Americanos ($)</option>
                <option value="EUR">EUR — Euros (€)</option>
                <option value="CLP">CLP — Pesos Chilenos ($)</option>
              </select>
              <p className="text-[10px] text-indigo-700/80">
                Todos tus totales y reportes se mostrarán en esta moneda (puedes cambiarla luego en Configuración).
              </p>
            </div>

            {modoAuth === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setMensajeRecuperacion(null);
                    setPasoRecuperacion(1);
                    setMostrarModalRecuperar(true);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={procesandoAuth}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {procesandoAuth ? 'Procesando...' : modoAuth === 'login' ? 'Ingresar a la App' : 'Registrar Cuenta'}
            </button>
          </form>

          {/* ACCESO RÁPIDO DEMO */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                const demoUser = { username: 'demo', uid: 'usr_demo_guest' };
                saveUserData('demo', 'moneda', monedaInicioForm);
                setMoneda(monedaInicioForm);
                localStorage.setItem('finanzas_active_user', JSON.stringify(demoUser));
                setUser(demoUser);
              }}
              className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-xl text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" /> Probar con Usuario Demo ({monedaInicioForm})
            </button>
          </div>

          <div className="text-center pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setModoAuth(modoAuth === 'login' ? 'register' : 'login');
                setErrorAuth('');
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              {modoAuth === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmarTextoBorrar('');
                setMostrarModalBorrarCache(true);
              }}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center justify-center gap-1 mt-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Borrar caché y datos guardados de la app
            </button>
          </div>
        </div>

        {/* MODAL RECUPERAR CONTRASEÑA */}
        {mostrarModalRecuperar && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900">Recuperar Contraseña</h3>
                <button onClick={() => setMostrarModalRecuperar(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>
              {mensajeRecuperacion && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${mensajeRecuperacion.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                  {mensajeRecuperacion.texto}
                </div>
              )}
              {pasoRecuperacion === 1 ? (
                <form onSubmit={handleBuscarUsuarioRecuperacion} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ingresa tu nombre de usuario</label>
                    <input
                      type="text"
                      required
                      value={userRecuperar}
                      onChange={(e) => setUserRecuperar(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm">Buscar Usuario</button>
                </form>
              ) : (
                <form onSubmit={handleRestablecerPassword} className="space-y-4">
                  <p className="text-xs font-semibold text-slate-700">{preguntaUsuario}</p>
                  <input
                    type="text"
                    required
                    placeholder="Tu respuesta secreta..."
                    value={respuestaRecuperar}
                    onChange={(e) => setRespuestaRecuperar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Nueva contraseña..."
                    value={nuevaPasswordForm}
                    onChange={(e) => setNuevaPasswordForm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                  <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm">Restablecer Contraseña</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODAL BORRAR CACHÉ DESDE LOGIN */}
        {mostrarModalBorrarCache && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 text-slate-800">
              <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Borrar Caché y Datos Locales
              </h3>
              <p className="text-xs text-slate-600">
                Esta acción eliminará todos los usuarios y movimientos guardados en este navegador. Escribe <strong>BORRAR</strong> para confirmar:
              </p>
              <input
                type="text"
                placeholder="BORRAR"
                value={confirmarTextoBorrar}
                onChange={(e) => setConfirmarTextoBorrar(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalBorrarCache(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={confirmarTextoBorrar !== 'BORRAR'}
                  onClick={handleBorrarCachePagina}
                  className="flex-1 py-2 bg-rose-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
                >
                  Eliminar Todo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 sm:p-6 transition-colors ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* BARRA SUPERIOR DE USUARIO, RESPALDOS Y CONFIGURACIÓN */}
        <div className={`px-4 py-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
              {user.username.slice(0, 2)}
            </div>
            <div>
              <span className="text-xs font-bold block">@{user.username}</span>
              <span className="text-[10px] text-slate-400">Moneda base: {moneda}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportarRespaldo}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              title="Exportar respaldo JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" /> Respaldo
            </button>

            <label
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              title="Importar respaldo JSON"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" /> Importar
              <input type="file" accept=".json,application/json" onChange={importarRespaldo} className="hidden" />
            </label>

            <button
              type="button"
              onClick={exportarCSV}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
            >
              <Database className="w-3.5 h-3.5 text-blue-500" /> CSV
            </button>

            <button
              type="button"
              onClick={() => {
                setPdfTipoPeriodo('mes');
                const ultimoDia = new Date(anioSeleccionado, mesSeleccionado + 1, 0).getDate();
                setPdfFechaInicio(`${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}-01`);
                setPdfFechaFin(`${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`);
                setMostrarModalPdf(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              title="Generar Reporte PDF personalizable"
            >
              <FileText className="w-3.5 h-3.5" /> Reporte PDF
            </button>

            <button
              type="button"
              onClick={() => setMostrarModalConfig(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-500" /> Config
            </button>

            <button
              type="button"
              onClick={handleCerrarSesion}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>

        {mensajeRespaldo && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            mensajeRespaldo.tipo === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <span>{mensajeRespaldo.texto}</span>
            <button type="button" onClick={() => setMensajeRespaldo(null)} className="font-bold ml-3">✕</button>
          </div>
        )}

        {/* AVISO DE MES CERRADO */}
        {cierreMesActual && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-emerald-400">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-300">
                  Mes Cerrado ({cierreMesActual.periodo})
                </h4>
                <p className="text-xs text-slate-400">
                  Corte realizado el <strong className="text-slate-300">{cierreMesActual.fechaCierre}</strong> • Balance archivado: <strong className={cierreMesActual.balanceNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatoMoneda(cierreMesActual.balanceNeto, cierreMesActual.moneda)}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMostrarModalInfoData(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 self-start sm:self-center transition-colors"
            >
              Ver Bitácora de Cierres
            </button>
          </div>
        )}

        {/* BANNERS DE ALERTAS DE VENCIMIENTO */}
        {proximosVencimientos.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-slate-900 rounded-xl">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-500">
                  Alertas de Vencimiento ({proximosVencimientos.length})
                </h4>
                <p className="text-xs text-slate-400">
                  Revisa tus obligaciones vencidas y próximas a vencer para evitar moras o recargos:
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {proximosVencimientos.map(v => (
                <div 
                  key={v.id} 
                  className={`text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 border font-medium ${
                    v.vencido 
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' 
                      : 'bg-slate-900 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <strong>{String(v.tipo)} {String(v.nombre)}:</strong>{' '}
                    {v.vencido ? (
                      <span className="font-extrabold text-rose-400">⚠️ VENCIDO (hace {Math.abs(v.dias)} {Math.abs(v.dias) === 1 ? 'día' : 'días'})</span>
                    ) : v.dias === 0 ? (
                      <span className="font-bold text-amber-400">¡VENCE HOY!</span>
                    ) : (
                      <span>en {v.dias} días (Día {v.diaPago})</span>
                    )}
                    {' '}— {String(v.montoTexto)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HEADER PRINCIPAL Y NAVEGACIÓN DE MES */}
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Wallet className="w-8 h-8 text-indigo-600" />
              Gestor Multi-Moneda & Billeteras
            </h1>
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} text-sm mt-1`}>Control de cuentas bancarias independientes, billeteras digitales, tarjetas y préstamos.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between">
            <div className={`flex items-center p-1.5 rounded-2xl border shadow-inner flex-1 md:flex-initial justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <button 
                onClick={cambiarMesAnterior}
                className={`p-2 rounded-xl shadow-sm transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                title="Mes Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className={`flex items-center gap-2 px-4 font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{NOMBRES_MESES[mesSeleccionado]} {anioSeleccionado}</span>
              </div>

              <button 
                onClick={cambiarMesSiguiente}
                className={`p-2 rounded-xl shadow-sm transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                title="Mes Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setMostrarModalCierre(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all shrink-0"
              title="Realizar Corte de Caja y Cierre de Mes"
            >
              <Archive className="w-4 h-4" /> Cierre de Mes
            </button>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={abrirNuevaTransaccion}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Transacción
            </button>
            <button
              onClick={() => {
                setCuentaEditandoId(null);
                setNombreCuentaForm('');
                setSaldoInicialCuentaForm('0');
                setTipoCuentaForm('Bancaria');
                setMonedaCuentaForm('PEN');
                setColorCuentaForm('#6366F1');
                setCuentaVinculadaIdForm('');
                setMostrarModalCuenta(true);
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all text-sm"
            >
              <Building2 className="w-4 h-4" /> + Cuenta / Billetera
            </button>
          </div>
        </header>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <nav className={`flex flex-wrap p-1.5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/60 border-slate-200'}`}>
          <button
            onClick={() => setSeccionActiva('general')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'general' ? (darkMode ? 'bg-slate-800 text-indigo-400 shadow' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="w-4 h-4" />
            Vista General
          </button>
          <button
            onClick={() => setSeccionActiva('cuentas')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'cuentas' ? (darkMode ? 'bg-slate-800 text-blue-400 shadow' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Building2 className="w-4 h-4" />
            Cuentas ({cuentasBancarias.length})
          </button>
          <button
            onClick={() => setSeccionActiva('tarjetas')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'tarjetas' ? (darkMode ? 'bg-slate-800 text-purple-400 shadow' : 'bg-white text-purple-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <CreditCard className="w-4 h-4" />
            Tarjetas ({tarjetas.length})
          </button>
          <button
            onClick={() => setSeccionActiva('prestamos')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'prestamos' ? (darkMode ? 'bg-slate-800 text-amber-400 shadow' : 'bg-white text-amber-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <HandCoins className="w-4 h-4" />
            Préstamos ({prestamos.length})
          </button>
          <button
            onClick={() => setSeccionActiva('metas')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'metas' ? (darkMode ? 'bg-slate-800 text-emerald-400 shadow' : 'bg-white text-emerald-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <PiggyBank className="w-4 h-4" />
            Metas ({metas.length})
          </button>
          <button
            onClick={() => setSeccionActiva('anual')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'anual' ? (darkMode ? 'bg-slate-800 text-indigo-400 shadow' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Resumen Anual
          </button>
          <button
            onClick={() => setSeccionActiva('auditoria')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'auditoria' ? (darkMode ? 'bg-slate-800 text-emerald-400 shadow' : 'bg-white text-emerald-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <History className="w-4 h-4" />
            Historial Pagos ({historialPagosEspeciales.length})
          </button>
        </nav>

        {/* RESUMEN FINANCIERO */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl shadow-sm border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Líquido Disponible</p>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-400 mt-1">{formatoMoneda(saldoLiquidoTotal)}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">En {cuentasBancarias.length} cuentas/billeteras</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className={`p-5 rounded-2xl shadow-sm border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingresos ({NOMBRES_MESES[mesSeleccionado]})</p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-500 mt-1">{formatoMoneda(resumen.ingresos)}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Expresado en {moneda}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
          </div>

          <div className={`p-5 rounded-2xl shadow-sm border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gastos ({NOMBRES_MESES[mesSeleccionado]})</p>
              <h3 className="text-xl sm:text-2xl font-bold text-rose-500 mt-1">{formatoMoneda(resumen.totalGastosDelMes)}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Líquidos: {formatoMoneda(resumen.gastosLiquidos + resumen.pagosLiquidosEspeciales)} | Crédito: {formatoMoneda(resumen.gastosCredito)}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
          </div>

          <div className={`p-5 rounded-2xl shadow-sm border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deuda en Tarjetas</p>
              <h3 className="text-xl sm:text-2xl font-bold text-purple-400 mt-1">{formatoMoneda(resumenTarjetas.deudaTotal)}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Disponible: {formatoMoneda(resumenTarjetas.disponibleTotal)}</p>
            </div>
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* VISTA GENERAL CON GRÁFICOS */}
        {seccionActiva === 'general' && (
          <div className="space-y-6">
            {/* GRÁFICO HISTÓRICO DE PATRIMONIO NETO */}
            <section className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <div>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Evolución Histórica de Patrimonio Neto (Últimos 12 meses)
                  </h3>
                  <p className="text-xs text-slate-400">Calculado acumulativamente mes a mes (Activos Líquidos − Deudas en Tarjetas y Préstamos).</p>
                </div>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-3 py-1 rounded-full border border-indigo-500/20">
                  Histórico Real en {moneda}
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historialPatrimonioNeto} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
                    <XAxis dataKey="mes" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} tickLine={false} />
                    <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} tickLine={false} />
                    <Tooltip 
                      formatter={(val) => String(formatoMoneda(val, moneda))}
                      labelFormatter={(label) => String(label)}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0F172A' : '#FFFFFF', 
                        borderColor: darkMode ? '#334155' : '#CBD5E1', 
                        borderRadius: '12px',
                        color: darkMode ? '#F8FAFC' : '#0F172A',
                        fontSize: '12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Patrimonio" 
                      stroke="#6366F1" 
                      strokeWidth={3} 
                      dot={{ fill: '#6366F1', r: 4 }}
                      activeDot={{ r: 6, fill: '#4F46E5' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* GRÁFICO COMPARATIVO INGRESOS VS GASTOS DEL MES */}
            <section className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Flujo del Mes: Ingresos vs Gastos ({NOMBRES_MESES[mesSeleccionado]})
                  </h3>
                  <p className="text-xs text-slate-400">Comparativa directa entre total de entradas y salidas registradas en este mes.</p>
                </div>
                <span className={`text-sm font-bold ${resumen.balanceNetoMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Balance: {formatoMoneda(resumen.balanceNetoMes)}
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: 'Ingresos', Monto: resumen.ingresos, fill: '#10B981' },
                      { name: 'Gastos Totales', Monto: resumen.totalGastosDelMes, fill: '#EF4444' },
                      { name: 'Gastos Líquidos', Monto: resumen.gastosLiquidos + resumen.pagosLiquidosEspeciales, fill: '#F59E0B' },
                      { name: 'Gastos a Crédito', Monto: resumen.gastosCredito, fill: '#8B5CF6' }
                    ]}
                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} />
                    <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} />
                    <Tooltip 
                      formatter={(val) => String(formatoMoneda(val, moneda))}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0F172A' : '#FFFFFF', 
                        borderColor: darkMode ? '#334155' : '#CBD5E1', 
                        borderRadius: '12px',
                        color: darkMode ? '#F8FAFC' : '#0F172A',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="Monto" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* TRES GRÁFICOS CIRCULARES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PieChart 1: Categorías de Gasto */}
              <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h4 className={`font-bold text-sm mb-1 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <PieChartIcon className="w-4 h-4 text-indigo-500" />
                  Gastos por Categoría
                </h4>
                <p className="text-[11px] text-slate-400 mb-4">Desglose del gasto del mes actual</p>
                {categoriasGastosPie.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-400">Sin gastos registrados este mes</div>
                ) : (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoriasGastosPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoriasGastosPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => String(formatoMoneda(val, moneda))} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* PieChart 2: Salidas por Cuenta/Billetera */}
              <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h4 className={`font-bold text-sm mb-1 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <PieChartIcon className="w-4 h-4 text-blue-500" />
                  Salidas por Cuenta / Billetera
                </h4>
                <p className="text-[11px] text-slate-400 mb-4">Origen de los pagos realizados en el mes</p>
                {salidasPorCuentaMes.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-400">Sin salidas registradas este mes</div>
                ) : (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salidasPorCuentaMes}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {salidasPorCuentaMes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => String(formatoMoneda(val, moneda))} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* PieChart 3: Distribución de Activos */}
              <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h4 className={`font-bold text-sm mb-1 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <PieChartIcon className="w-4 h-4 text-emerald-500" />
                  Distribución de Activos Líquidos
                </h4>
                <p className="text-[11px] text-slate-400 mb-4">Concentración de tu dinero según tipo de cuenta</p>
                {distribucionActivos.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-400">Sin saldos líquidos disponibles</div>
                ) : (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribucionActivos}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {distribucionActivos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => String(formatoMoneda(val, moneda))} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VISTA DEDICADA CUENTAS Y BILLETERAS */}
        {seccionActiva === 'cuentas' && (
          <section className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Cuentas Bancarias y Billeteras Digitales ({cuentasConSaldosActuales.length})
                </h3>
                <p className="text-xs text-slate-400">Administra tus saldos reales por entidad y realiza transferencias de dinero entre ellas.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (cuentasBancarias.length < 2) return;
                    setCuentaOrigenId(cuentasBancarias[0].id);
                    setCuentaDestinoId(cuentasBancarias[1].id);
                    setMostrarModalTransferencia(true);
                  }}
                  disabled={cuentasBancarias.length < 2}
                  className="flex-1 sm:flex-initial bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-40 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-indigo-500/30 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Transferir entre cuentas
                </button>
                <button
                  onClick={() => {
                    setCuentaEditandoId(null);
                    setNombreCuentaForm('');
                    setSaldoInicialCuentaForm('0');
                    setTipoCuentaForm('Bancaria');
                    setMonedaCuentaForm('PEN');
                    setColorCuentaForm('#6366F1');
                    setCuentaVinculadaIdForm('');
                    setMostrarModalCuenta(true);
                  }}
                  className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> + Nueva Cuenta
                </button>
              </div>
            </div>

            {cuentasConSaldosActuales.length === 0 ? (
              <div className={`p-8 text-center border-2 border-dashed rounded-xl text-slate-400 text-sm ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                No tienes cuentas o billeteras agregadas. Haz clic en <strong>+ Nueva Cuenta</strong> para empezar a registrar tus saldos.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cuentasConSaldosActuales.map(cta => {
                  const ctaVinculada = cuentasBancarias.find(c => c.id === cta.cuentaVinculadaId);

                  return (
                    <div key={cta.id} className={`p-5 rounded-2xl relative group shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCuentaEditandoId(cta.id);
                            setNombreCuentaForm(cta.nombre);
                            setTipoCuentaForm(cta.tipo || 'Bancaria');
                            setMonedaCuentaForm(cta.moneda || 'PEN');
                            setSaldoInicialCuentaForm(String(cta.saldoInicial || 0));
                            setColorCuentaForm(cta.color || '#6366F1');
                            setCuentaVinculadaIdForm(cta.cuentaVinculadaId || '');
                            setMostrarModalCuenta(true);
                          }}
                          className="text-slate-400 hover:text-indigo-400 transition-colors"
                          title="Editar cuenta"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarCuenta(cta.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cta.color || '#6366F1' }}></div>
                        <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono font-bold">
                          {cta.tipo || 'Bancaria'}
                        </span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                          {cta.moneda || 'PEN'}
                        </span>
                      </div>

                      <h4 className={`font-bold text-lg mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{cta.nombre}</h4>
                      
                      {ctaVinculada && (
                        <div className="mb-2">
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                            🔗 Vinculado a {ctaVinculada.nombre}
                          </span>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-end">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Saldo Actual Disponible:</span>
                          <span className={`text-xl font-black ${cta.saldoActual < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                            {formatoMoneda(cta.saldoActual, cta.moneda || 'PEN')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Inicial: {formatoMoneda(cta.saldoInicial, cta.moneda || 'PEN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VISTA DEDICADA TARJETAS DE CRÉDITO Y CUOTAS */}
        {seccionActiva === 'tarjetas' && (
          <section className={`p-6 rounded-2xl shadow-sm border space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  Tarjetas de Crédito y Compras en Cuotas ({tarjetas.length})
                </h3>
                <p className="text-xs text-slate-400">Controla tus líneas de crédito, fecha de corte, fecha de pago y tus consumos fraccionados.</p>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {tarjetas.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        setTarjetaAPagarId(tarjetas[0].id);
                        if (cuentasBancarias.length > 0) setCuentaOrigenPagoTarjetaId(cuentasBancarias[0].id);
                        setMostrarModalPagoTarjeta(true);
                      }}
                      className="flex-1 sm:flex-initial bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-purple-500/30 transition-colors"
                    >
                      <ArrowRightLeft className="w-4 h-4" /> Pagar Tarjeta
                    </button>
                    <button
                      onClick={() => {
                        setTarjetaCuotaId(tarjetas[0].id);
                        setConceptoCuotaForm('');
                        setMontoTotalCuotaForm('');
                        setNumCuotasForm('3');
                        setCuotaActualForm('1');
                        setCategoriaCuotaForm(catGastosPers.includes('Compras') ? 'Compras' : (catGastosPers[0] || 'Compras'));
                        setFechaCuotaForm(getFechaLocalHoy());
                        setMostrarModalCuotaTarjeta(true);
                      }}
                      className="flex-1 sm:flex-initial bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-indigo-500/30 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> + Nueva Compra en Cuotas
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setTarjetaEditandoId(null);
                    setNombreTarjetaForm('');
                    setLimiteTarjetaForm('');
                    setDiaCorteTarjetaForm('');
                    setDiaVencimientoTarjetaForm('');
                    setDeudaInicialTarjetaForm('');
                    setMonedaTarjetaForm('PEN');
                    setMostrarModalTarjeta(true);
                  }}
                  className="flex-1 sm:flex-initial bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> + Nueva Tarjeta
                </button>
              </div>
            </div>

            {/* LISTADO DE TARJETAS */}
            {tarjetas.length === 0 ? (
              <div className={`p-8 text-center border-2 border-dashed rounded-xl text-slate-400 text-sm ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                No tienes tarjetas de crédito registradas. Haz clic en <strong>+ Nueva Tarjeta</strong> para agregar una.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tarjetas.map(t => {
                  const disponible = Math.max(0, (t.limite || 0) - (t.deudaActual || 0));
                  const porcentajeUso = Math.min(100, Math.round(((t.deudaActual || 0) / (t.limite || 1)) * 100));

                  return (
                    <div key={t.id} className={`p-5 rounded-2xl relative group shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTarjetaEditandoId(t.id);
                            setNombreTarjetaForm(t.nombre);
                            setLimiteTarjetaForm(String(t.limite));
                            setDiaCorteTarjetaForm(t.diaCorte ? String(t.diaCorte) : '');
                            setDiaVencimientoTarjetaForm(t.diaVencimiento ? String(t.diaVencimiento) : '');
                            setMonedaTarjetaForm(t.moneda || 'PEN');
                            setDeudaInicialTarjetaForm(String(t.deudaActual || 0));
                            setMostrarModalTarjeta(true);
                          }}
                          className="text-slate-400 hover:text-purple-400 transition-colors"
                          title="Editar tarjeta"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarTarjeta(t.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                          title="Eliminar tarjeta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                          {t.moneda || 'PEN'}
                        </span>
                        {t.diaCorte && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                            Corte: Día {t.diaCorte}
                          </span>
                        )}
                        {t.diaVencimiento && (
                          <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded">
                            Vence: Día {t.diaVencimiento}
                          </span>
                        )}
                      </div>

                      <h4 className={`font-bold text-lg mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.nombre}</h4>

                      <div className="space-y-1 text-xs my-3">
                        <div className="flex justify-between text-slate-400">
                          <span>Deuda Actual:</span>
                          <span className="font-bold text-rose-500">{formatoMoneda(t.deudaActual || 0, t.moneda || 'PEN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Límite Total:</span>
                          <span>{formatoMoneda(t.limite || 0, t.moneda || 'PEN')}</span>
                        </div>
                      </div>

                      <div className={`w-full h-2 rounded-full overflow-hidden mb-1.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full transition-all ${porcentajeUso > 80 ? 'bg-rose-500' : 'bg-purple-500'}`}
                          style={{ width: `${porcentajeUso}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Disponible: <strong className="text-emerald-400">{formatoMoneda(disponible, t.moneda || 'PEN')}</strong></span>
                        <span className="font-semibold text-slate-400">{porcentajeUso}% usado</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LISTADO DE COMPRAS EN CUOTAS */}
            <div className="pt-4 border-t border-slate-700/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className={`font-bold text-sm flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Consumos Fraccionados en Cuotas ({cuotasTarjetas.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Se actualizan automáticamente cada mes calendario y al pagar tu tarjeta.
                </span>
              </div>

              {cuotasTarjetas.length === 0 ? (
                <p className="text-xs text-slate-400">No tienes compras en cuotas registradas actualmente.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cuotasTarjetas.map(c => {
                    const saldoPendienteItem = c.saldoPendiente ?? ((c.totalCuotas - c.cuotaActual + 1) * c.valorCuotaMensual);
                    const estaPagada = c.completada || saldoPendienteItem <= 0.01;
                    // Proyección de la cuota según el mes y año seleccionados en el navegador superior
                    const [yReg, mReg] = (c.fechaRegistro || getFechaLocalHoy()).split('-').map(Number);
                    const diffMesesVista = !isNaN(yReg) && !isNaN(mReg)
                      ? (anioSeleccionado * 12 + mesSeleccionado) - (yReg * 12 + (mReg - 1))
                      : 0;
                    const cuotaEnMesSeleccionado = Math.min(
                      c.totalCuotas,
                      Math.max(1, (c.cuotaInicial || c.cuotaActual) + diffMesesVista)
                    );

                    return (
                      <div key={c.id} className={`p-4 rounded-xl border relative flex flex-col justify-between ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                          type="button"
                          onClick={() => eliminarCompraCuotas(c.id)}
                          className="absolute top-2.5 right-2.5 p-2 rounded-lg text-slate-400 hover:text-rose-500 active:text-rose-500 hover:bg-rose-500/10 active:bg-rose-500/15 transition-colors touch-manipulation"
                          title="Eliminar registro de cuotas"
                          aria-label="Eliminar registro de cuotas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap pr-9">
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded">
                              {c.tarjetaNombre}
                            </span>
                            {c.categoria && (
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-medium px-2 py-0.5 rounded">
                                {c.categoria}
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${estaPagada ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-700 text-slate-300'}`}>
                              {estaPagada ? '✓ Completada' : `Cuota ${c.cuotaActual} de ${c.totalCuotas}`}
                            </span>
                            {!estaPagada && diffMesesVista > 0 && cuotaEnMesSeleccionado > c.cuotaActual && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                                En {NOMBRES_MESES[mesSeleccionado]}: {cuotaEnMesSeleccionado}/{c.totalCuotas}
                              </span>
                            )}
                          </div>

                          <h5 className={`font-bold text-sm mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{c.concepto}</h5>

                          <div className="space-y-1 text-xs bg-slate-900/30 p-2.5 rounded-lg border border-slate-700/30">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Cuota Mensual:</span>
                              <strong className="text-indigo-400 font-bold">{formatoMoneda(c.valorCuotaMensual, c.moneda)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Saldo en Línea:</span>
                              <strong className={estaPagada ? 'text-emerald-400' : 'text-rose-400'}>
                                {formatoMoneda(saldoPendienteItem, c.moneda)}
                              </strong>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/30">
                              <span>Monto Total Compra:</span>
                              <span className="font-mono">{formatoMoneda(c.montoTotal, c.moneda)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-700/40 flex justify-end">
                          {estaPagada ? (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pagada en su totalidad
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => avanzarCuotaTarjeta(c.id)}
                              className="w-full py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Avanzar / Pagar 1 cuota
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* VISTA DEDICADA PRÉSTAMOS E INFORMALES */}
        {seccionActiva === 'prestamos' && (
          <section className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <HandCoins className="w-5 h-5 text-amber-500" />
                  Préstamos y Cuentas por Cobrar / Pagar ({prestamos.length})
                </h3>
                <p className="text-xs text-slate-400">Administra deudas bancarias e informales entre amigos/familiares (Yape, Plin, efectivo).</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={filtroTipoPrestamo}
                  onChange={(e) => setFiltroTipoPrestamo(e.target.value)}
                  className={`border rounded-xl text-xs px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <option value="todos">Todos los préstamos</option>
                  <option value="informales">Solo entre Personas (Yape/Plin)</option>
                  <option value="bancarios">Solo Entidades / Bancos</option>
                </select>

                {prestamos.length > 0 && (
                  <button
                    onClick={() => {
                      if (cuentasBancarias.length > 0) setCuentaOrigenAbonoPrestamoId(cuentasBancarias[0].id);
                      setPrestamoSeleccionadoId(prestamos[0].id);
                      setMostrarModalAbonoPrestamo(true);
                    }}
                    className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 border border-amber-500/30 transition-colors"
                  >
                    <ArrowRightLeft className="w-4 h-4" /> Registrar Abono / Cuota
                  </button>
                )}
                <button
                  onClick={() => {
                    setNombrePrestamoForm('');
                    setPrestamistaForm('');
                    setTelefonoContactoForm('');
                    setMontoTotalPrestamoForm('');
                    setMontoPendientePrestamoForm('');
                    setDiaVencimientoPrestamoForm('');
                    setEsInformalForm(true);
                    setMostrarModalPrestamo(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> + Nuevo Préstamo
                </button>
              </div>
            </div>

            {prestamos.length === 0 ? (
              <div className={`p-8 text-center border-2 border-dashed rounded-xl text-slate-400 text-sm ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                No tienes préstamos o deudas entre personas registradas. ¡Haz clic en <strong>+ Nuevo Préstamo</strong> para agregar uno!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {prestamos
                  .filter(p => {
                    if (filtroTipoPrestamo === 'informales') return p.esInformal;
                    if (filtroTipoPrestamo === 'bancarios') return !p.esInformal;
                    return true;
                  })
                  .map(p => {
                  const porcentajePago = Math.min(100, Math.round((((p.montoTotal || 0) - (p.montoPendiente || 0)) / (p.montoTotal || 1)) * 100));
                  const esTomado = p.tipo === 'tomado';

                  return (
                    <div key={p.id} className={`p-5 rounded-2xl relative group shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <button
                        onClick={() => eliminarPrestamo(p.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Eliminar préstamo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${esTomado ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {esTomado ? 'Debo pagar' : 'Por cobrar'}
                          </span>
                          {p.esInformal && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Amigo / Yape
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono font-bold">
                          {p.moneda || 'PEN'}
                        </span>
                      </div>

                      <h4 className={`font-bold text-base ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{p.nombre}</h4>
                      <p className="text-xs text-slate-400 mb-1">
                        Persona / Entidad: <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{p.entidad}</span>
                      </p>

                      {p.diaVencimiento && (
                        <p className="text-xs text-slate-400 mb-2">Vence el día: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{p.diaVencimiento}</strong></p>
                      )}

                      <div className="space-y-1 text-xs mb-3 mt-2">
                        <div className="flex justify-between text-slate-400">
                          <span>Pendiente:</span>
                          <span className={`font-bold text-sm ${esTomado ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {formatoMoneda(p.montoPendiente, p.moneda || 'PEN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Monto Total:</span>
                          <span>{formatoMoneda(p.montoTotal, p.moneda || 'PEN')}</span>
                        </div>
                      </div>

                      <div className={`w-full h-2 rounded-full overflow-hidden mb-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full transition-all ${esTomado ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${porcentajePago}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {porcentajePago}% Amortizado
                        </span>

                        {p.montoPendiente > 0 && (
                          <button
                            type="button"
                            onClick={() => enviarRecordatorioWhatsApp(p)}
                            className="flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-colors"
                            title="Enviar recordatorio por WhatsApp"
                          >
                            <Send className="w-3 h-3" /> Recordar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VISTA HISTORIAL PAGOS AUDITORÍA */}
        {seccionActiva === 'auditoria' && (
          <section className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                <History className="w-5 h-5 text-emerald-500" />
                Historial de Amortizaciones de Tarjetas y Préstamos ({historialPagosEspeciales.length})
              </h3>
              <p className="text-xs text-slate-400">Auditoría completa de pagos efectuados hacia tus líneas de crédito y préstamos.</p>
            </div>
            {historialPagosEspeciales.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">Aún no has registrado abonos a tarjetas o préstamos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className={`border-b text-xs uppercase ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Concepto</th>
                      <th className="py-3 px-4">Cuenta Origen</th>
                      <th className="py-3 px-4 text-right">Monto Abonado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historialPagosEspeciales.map(p => (
                      <tr key={p.id} className={darkMode ? 'border-slate-800' : 'border-slate-50'}>
                        <td className="py-3 px-4 text-xs text-slate-400">{p.fecha}</td>
                        <td className="py-3 px-4 font-semibold">{p.descripcion}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">{p.metodo}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatoMoneda(p.monto, p.moneda || 'PEN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* VISTA DEDICADA METAS DE AHORRO */}
        {seccionActiva === 'metas' && (
          <section className={`p-6 rounded-2xl shadow-sm border space-y-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <PiggyBank className="w-5 h-5 text-emerald-500" />
                  Metas de Ahorro y Objetivos Financieros ({metas.length})
                </h3>
                <p className="text-xs text-slate-400">Define tus objetivos de ahorro, registra aportes periódicos y visualiza tu progreso.</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {metas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMetaSeleccionadaId(metas[0].id);
                      if (cuentasBancarias.length > 0) setCuentaAporteMetaId(cuentasBancarias[0].id);
                      setMontoAporteMetaForm('');
                      setDescontarCuentaMeta(cuentasBancarias.length > 0);
                      setMostrarModalAporteMeta(true);
                    }}
                    className="flex-1 sm:flex-initial bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-emerald-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Registrar Aporte
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNombreMetaForm('');
                    setMontoObjetivoMetaForm('');
                    setMontoInicialMetaForm('');
                    setFechaLimiteMetaForm('');
                    setMonedaMetaForm(moneda);
                    setColorMetaForm('#10B981');
                    setMostrarModalMeta(true);
                  }}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> + Nueva Meta
                </button>
              </div>
            </div>

            {metas.length === 0 ? (
              <div className={`p-8 text-center border-2 border-dashed rounded-xl text-slate-400 text-sm ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                Aún no tienes metas de ahorro creadas (ej. Fondo de emergencia, Viaje, Inicial de auto). Haz clic en <strong>+ Nueva Meta</strong> para comenzar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metas.map((m) => {
                  const pct = m.montoObjetivo > 0 ? Math.min(100, Math.round(((m.montoActual || 0) / m.montoObjetivo) * 100)) : 0;
                  const completada = (m.montoActual || 0) >= m.montoObjetivo && m.montoObjetivo > 0;
                  const faltante = Math.max(0, (m.montoObjetivo || 0) - (m.montoActual || 0));

                  return (
                    <div key={m.id} className={`p-5 rounded-2xl border relative flex flex-col justify-between shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={() => eliminarMeta(m.id)}
                        className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar meta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2 mb-2 pr-8 flex-wrap">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color || '#10B981' }}></span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                            {m.moneda || 'PEN'}
                          </span>
                          {completada && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                              🎉 ¡Meta Lograda!
                            </span>
                          )}
                          {m.fechaLimite && (
                            <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                              Límite: {m.fechaLimite}
                            </span>
                          )}
                        </div>

                        <h4 className={`font-bold text-base mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{m.nombre}</h4>

                        <div className="space-y-1 text-xs mb-3">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ahorrado:</span>
                            <strong className="text-emerald-400 text-sm">{formatoMoneda(m.montoActual || 0, m.moneda || 'PEN')}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Objetivo:</span>
                            <span className="font-semibold">{formatoMoneda(m.montoObjetivo || 0, m.moneda || 'PEN')}</span>
                          </div>
                          {!completada && (
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>Faltante:</span>
                              <span>{formatoMoneda(faltante, m.moneda || 'PEN')}</span>
                            </div>
                          )}
                        </div>

                        <div className={`w-full h-2.5 rounded-full overflow-hidden mb-1.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                          <div
                            className="h-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: m.color || '#10B981' }}
                          ></div>
                        </div>
                        <div className="text-[11px] text-right font-bold text-slate-400">{pct}% completado</div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-700/40">
                        <button
                          type="button"
                          onClick={() => {
                            setMetaSeleccionadaId(m.id);
                            if (cuentasBancarias.length > 0) setCuentaAporteMetaId(cuentasBancarias[0].id);
                            setMontoAporteMetaForm('');
                            setDescontarCuentaMeta(cuentasBancarias.length > 0);
                            setMostrarModalAporteMeta(true);
                          }}
                          className="w-full py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Abonar a esta meta
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VISTA DEDICADA RESUMEN ANUAL */}
        {seccionActiva === 'anual' && (
          <section className={`p-6 rounded-2xl shadow-sm border space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Resumen Financiero Anual — {anioSeleccionado}
                </h3>
                <p className="text-xs text-slate-400">Consolidado de ingresos, gastos líquidos, consumo a crédito y ahorro neto mes a mes en {moneda}.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAnioSeleccionado(prev => prev - 1)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
                >
                  ← {anioSeleccionado - 1}
                </button>
                <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">{anioSeleccionado}</span>
                <button
                  type="button"
                  onClick={() => setAnioSeleccionado(prev => prev + 1)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
                >
                  {anioSeleccionado + 1} →
                </button>
              </div>
            </div>

            {/* Tarjetas KPI Anuales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Ingresos Totales {anioSeleccionado}</span>
                <p className="text-xl font-black text-emerald-500 mt-1">{formatoMoneda(resumenAnual.totalIngresosAnio)}</p>
              </div>
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Gastos Totales {anioSeleccionado}</span>
                <p className="text-xl font-black text-rose-500 mt-1">{formatoMoneda(resumenAnual.totalGastosAnio)}</p>
                <span className="text-[10px] text-slate-400">Líquido: {formatoMoneda(resumenAnual.totalLiquidoAnio)} | Crédito: {formatoMoneda(resumenAnual.totalCreditoAnio)}</span>
              </div>
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Balance Neto Anual</span>
                <p className={`text-xl font-black mt-1 ${resumenAnual.ahorroNetoAnio >= 0 ? 'text-indigo-400' : 'text-rose-500'}`}>
                  {formatoMoneda(resumenAnual.ahorroNetoAnio)}
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Tasa de Ahorro Anual</span>
                <p className={`text-xl font-black mt-1 ${resumenAnual.tasaAhorroAnio >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {resumenAnual.tasaAhorroAnio}%
                </p>
              </div>
            </div>

            {/* Gráfico Barras Comparativo 12 Meses */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumenAnual.meses} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
                  <XAxis dataKey="mesCorto" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} />
                  <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={11} />
                  <Tooltip
                    formatter={(val) => String(formatoMoneda(val, moneda))}
                    contentStyle={{
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor: darkMode ? '#334155' : '#CBD5E1',
                      borderRadius: '12px',
                      color: darkMode ? '#F8FAFC' : '#0F172A',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Ingresos" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gastos" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla Detallada Mes a Mes */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-3 px-3">Mes</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3 text-right">Ingresos</th>
                    <th className="py-3 px-3 text-right">Gastos Líquidos</th>
                    <th className="py-3 px-3 text-right">Crédito</th>
                    <th className="py-3 px-3 text-right">Total Gastos</th>
                    <th className="py-3 px-3 text-right">Balance Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resumenAnual.meses.map((m) => (
                    <tr
                      key={m.mesIndex}
                      onClick={() => { setMesSeleccionado(m.mesIndex); setSeccionActiva('general'); }}
                      className={`cursor-pointer transition-colors ${darkMode ? 'border-slate-800 hover:bg-slate-800/60' : 'border-slate-100 hover:bg-slate-50'}`}
                      title="Clic para abrir el detalle de este mes"
                    >
                      <td className="py-2.5 px-3 font-bold">{m.mes}</td>
                      <td className="py-2.5 px-3">
                        {m.cerrado ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Cerrado</span>
                        ) : (
                          <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">Abierto</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-500 font-semibold">{formatoMoneda(m.ingresos)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{formatoMoneda(m.gastosLiquidos)}</td>
                      <td className="py-2.5 px-3 text-right text-purple-400">{formatoMoneda(m.gastosCredito)}</td>
                      <td className="py-2.5 px-3 text-right text-rose-500 font-semibold">{formatoMoneda(m.gastosTotales)}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${m.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatoMoneda(m.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PRESUPUESTOS POR CATEGORÍA Y PRESUPUESTO GLOBAL */}
        <section className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                <Sliders className="w-5 h-5 text-indigo-500" />
                Presupuestos ({NOMBRES_MESES[mesSeleccionado]})
              </h3>
              <p className="text-xs text-slate-400">Fija un límite global o límites por categoría para controlar tu nivel de gastos.</p>
            </div>
            <button
              onClick={() => setMostrarModalPresupuesto(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Definir Presupuesto
            </button>
          </div>

          {/* PRESUPUESTO GLOBAL CONTAINER */}
          {presupuestoGlobal > 0 && (
            <div className={`p-4 rounded-xl border mb-4 ${darkMode ? 'bg-slate-800/80 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'}`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-sm text-indigo-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Presupuesto Global Mensual
                </span>
                <button
                  onClick={() => setPresupuestoGlobal(0)}
                  className="text-xs text-slate-400 hover:text-rose-500"
                >
                  Eliminar Límite Global
                </button>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Total Gastado: <strong className={resumen.totalGastosDelMes > presupuestoGlobal ? 'text-rose-500' : 'text-emerald-400'}>{formatoMoneda(resumen.totalGastosDelMes)}</strong></span>
                <span>Límite Global: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{formatoMoneda(presupuestoGlobal)}</strong></span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden mb-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <div 
                  className={`h-full transition-all ${resumen.totalGastosDelMes > presupuestoGlobal ? 'bg-rose-500' : resumen.totalGastosDelMes >= presupuestoGlobal * 0.8 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                  style={{ width: `${Math.min(100, Math.round((resumen.totalGastosDelMes / presupuestoGlobal) * 100))}%` }}
                ></div>
              </div>
            </div>
          )}

          {Object.keys(presupuestos).length === 0 ? (
            <p className="text-slate-400 text-sm">No has configurado ningún presupuesto por categoría aún.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(presupuestos).map(cat => {
                const limite = presupuestos[cat];
                const gastado = gastosMesPorCategoria[cat] || 0;
                const porcentaje = Math.min(100, Math.round((gastado / limite) * 100));
                const sobrepasado = gastado > limite;
                const alertaCerca = porcentaje >= 80 && !sobrepasado;

                return (
                  <div key={cat} className={`p-4 rounded-xl border relative ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => eliminarPresupuesto(cat)}
                      className="absolute top-2.5 right-2.5 p-2 rounded-lg text-slate-400 hover:text-rose-500 active:text-rose-500 hover:bg-rose-500/10 active:bg-rose-500/15 transition-colors touch-manipulation"
                      title="Eliminar presupuesto"
                      aria-label="Eliminar presupuesto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex justify-between items-center mb-1 pr-8">
                      <span className={`font-bold text-sm ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{cat}</span>
                      {sobrepasado ? (
                        <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">¡Excedido!</span>
                      ) : alertaCerca ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">Cerca del límite</span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">En orden</span>
                      )}
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Gastado: <strong className={sobrepasado ? 'text-rose-500' : darkMode ? 'text-slate-200' : 'text-slate-700'}>{formatoMoneda(gastado, moneda)}</strong></span>
                      <span>Límite: {formatoMoneda(limite, moneda)}</span>
                    </div>

                    <div className={`w-full h-2 rounded-full overflow-hidden mb-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div 
                        className={`h-full transition-all ${sobrepasado ? 'bg-rose-500' : alertaCerca ? 'bg-amber-500' : 'bg-indigo-600'}`}
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-right font-semibold text-slate-400">
                      {porcentaje}% consumido
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* MOVIMIENTOS RECURRENTES */}
        <section className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                <Repeat className="w-5 h-5 text-purple-500" />
                Movimientos Recurrentes (Alquileres, Suscripciones, etc.)
              </h3>
              <p className="text-xs text-slate-400">Registra gastos o ingresos fijos del mes correspondiente con la fecha programada.</p>
            </div>
            <button
              onClick={() => {
                if (cuentasBancarias.length > 0 && !cuentaRecurrenteId) setCuentaRecurrenteId(cuentasBancarias[0].id);
                setMostrarModalRecurrente(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> + Nueva Recurrencia
            </button>
          </div>

          {recurrentes.length === 0 ? (
            <p className="text-slate-400 text-sm">No tienes movimientos recurrentes guardados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recurrentes.map(rec => {
                const claveMesAnio = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`;
                const yaRegistradoEsteMes = rec.ultimoMesRegistrado === claveMesAnio;

                return (
                  <div key={rec.id} className={`p-4 rounded-xl border relative flex flex-col justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => eliminarRecurrente(rec.id)}
                      className="absolute top-2.5 right-2.5 p-2 rounded-lg text-slate-400 hover:text-rose-500 active:text-rose-500 hover:bg-rose-500/10 active:bg-rose-500/15 transition-colors touch-manipulation"
                      title="Eliminar recurrencia"
                      aria-label="Eliminar recurrencia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-1 pr-8">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${rec.tipo === 'ingreso' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {rec.tipo}
                        </span>
                        <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded">Día {rec.diaPago}</span>
                      </div>
                      <h4 className={`font-bold text-sm mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{rec.descripcion}</h4>
                      <p className="text-xs text-slate-400 mb-3">Categoría: {rec.categoria}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                      <span className={`font-bold text-base ${rec.tipo === 'ingreso' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatoMoneda(rec.monto, rec.moneda || 'PEN')}
                      </span>
                      <button
                        onClick={() => procesarRecurrente(rec)}
                        disabled={yaRegistradoEsteMes}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 ${
                          yaRegistradoEsteMes 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {yaRegistradoEsteMes ? '✓ Registrado este mes' : 'Registrar ahora'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* TABLA DE TRANSACCIONES */}
        <section className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                Historial y Movimientos de {NOMBRES_MESES[mesSeleccionado]} {anioSeleccionado}
              </h3>
              <p className="text-xs text-slate-400">Listado completo de movimientos en este periodo.</p>
            </div>
            
            <div className="w-full sm:w-auto flex flex-wrap gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className={`border rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <option value="todos">Todos los tipos</option>
                <option value="ingreso">Ingresos</option>
                <option value="gasto">Gastos</option>
                <option value="pago_tarjeta">Pagos a Tarjeta</option>
                <option value="pago_prestamo">Pagos de Préstamo</option>
                <option value="transferencia_salida">Transferencias</option>
              </select>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className={`border rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <option value="todas">Todas las categorías</option>
                <optgroup label="Gastos">
                  {catGastosPers.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
                <optgroup label="Ingresos">
                  {catIngresosPers.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              </select>

              <select
                value={filtroMetodo}
                onChange={(e) => setFiltroMetodo(e.target.value)}
                className={`border rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <option value="todos">Todos los métodos / cuentas</option>
                {todosLosMetodosDisponibles.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {transaccionesFiltradas.length === 0 ? (
            <div className={`p-8 text-center border-2 border-dashed rounded-xl text-slate-400 text-sm ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              No hay movimientos registrados con los filtros actuales en {NOMBRES_MESES[mesSeleccionado]} {anioSeleccionado}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Concepto</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3">Cuenta / Tarjeta</th>
                    <th className="py-3 px-3 text-right">Monto</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transaccionesFiltradas.map((t) => {
                    const esEntrada = t.tipo === 'ingreso' || t.tipo === 'transferencia_entrada';
                    const esTransferencia = t.tipo === 'transferencia_salida' || t.tipo === 'transferencia_entrada';
                    const esEditable = t.tipo === 'ingreso' || t.tipo === 'gasto';

                    return (
                      <tr key={t.id} className={darkMode ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-50 hover:bg-slate-50/70'}>
                        <td className="py-3 px-3 text-xs text-slate-400 whitespace-nowrap">{t.fecha}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold flex items-center gap-1.5 flex-wrap">
                            <span>{t.descripcion}</span>
                            {t.esCredito && (
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                                Crédito
                              </span>
                            )}
                            {esTransferencia && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                                Transferencia
                              </span>
                            )}
                          </div>
                          {t.nota && <p className="text-[11px] text-slate-400 mt-0.5">{t.nota}</p>}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-400">{t.categoria}</td>
                        <td className="py-3 px-3 text-xs text-slate-400">{t.metodo}</td>
                        <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${
                          esTransferencia
                            ? 'text-blue-400'
                            : esEntrada
                              ? 'text-emerald-500'
                              : 'text-rose-500'
                        }`}>
                          {esEntrada ? '+' : '-'}{formatoMoneda(t.monto, t.moneda || 'PEN')}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {esEditable && (
                              <button
                                type="button"
                                onClick={() => abrirEdicionTransaccion(t)}
                                className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                title="Editar movimiento"
                                aria-label="Editar movimiento"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => eliminarTransaccion(t)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Eliminar movimiento"
                              aria-label="Eliminar movimiento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* MODAL NUEVA / EDITAR CUENTA O BILLETERA */}
      {mostrarModalCuenta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              {cuentaEditandoId ? 'Editar Cuenta / Billetera' : 'Nueva Cuenta o Billetera'}
            </h3>
            <form onSubmit={guardarCuenta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre de la Cuenta o Billetera</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BCP Ahorros, Yape, Efectivo..."
                  value={nombreCuentaForm}
                  onChange={(e) => setNombreCuentaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Tipo</label>
                  <select
                    value={tipoCuentaForm}
                    onChange={(e) => setTipoCuentaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  >
                    <option value="Bancaria">Bancaria</option>
                    <option value="Billetera Digital">Billetera Digital</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Inversión / Ahorro">Inversión / Ahorro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Moneda</label>
                  <select
                    value={monedaCuentaForm}
                    onChange={(e) => setMonedaCuentaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  >
                    <option value="PEN">PEN (S/)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CLP">CLP ($)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1">Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saldoInicialCuentaForm}
                    onChange={(e) => setSaldoInicialCuentaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Color</label>
                  <input
                    type="color"
                    value={colorCuentaForm}
                    onChange={(e) => setColorCuentaForm(e.target.value)}
                    className="w-full h-9 px-1 py-1 border rounded-xl cursor-pointer bg-transparent"
                  />
                </div>
              </div>
              {cuentasBancarias.filter(c => c.id !== cuentaEditandoId).length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Vincular saldo a cuenta principal (Opcional, ej: Yape → BCP)</label>
                  <select
                    value={cuentaVinculadaIdForm}
                    onChange={(e) => setCuentaVinculadaIdForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  >
                    <option value="">Cuenta independiente</option>
                    {cuentasBancarias.filter(c => c.id !== cuentaEditandoId).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModalCuenta(false)} className="flex-1 py-2.5 border rounded-xl font-semibold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm">Guardar Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PRÉSTAMO */}
      {mostrarModalPrestamo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-amber-500" />
              Nuevo Préstamo o Cuenta por Cobrar
            </h3>
            <form onSubmit={guardarPrestamo} className="space-y-4">
              <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setTipoPrestamoForm('tomado')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoPrestamoForm === 'tomado' ? (darkMode ? 'bg-slate-700 text-rose-400 shadow' : 'bg-white shadow text-rose-600') : 'text-slate-400'}`}
                >
                  Debo Pagar
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPrestamoForm('otorgado')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoPrestamoForm === 'otorgado' ? (darkMode ? 'bg-slate-700 text-emerald-400 shadow' : 'bg-white shadow text-emerald-600') : 'text-slate-400'}`}
                >
                  Me Deben (Por Cobrar)
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Concepto del préstamo (Ej: Cena grupal, Préstamo coche...)"
                value={nombrePrestamoForm}
                onChange={(e) => setNombrePrestamoForm(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Persona o Entidad"
                  value={prestamistaForm}
                  onChange={(e) => setPrestamistaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
                <input
                  type="text"
                  placeholder="Teléfono WhatsApp (Ej: 51999...)"
                  value={telefonoContactoForm}
                  onChange={(e) => setTelefonoContactoForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Monto Total"
                  value={montoTotalPrestamoForm}
                  onChange={(e) => setMontoTotalPrestamoForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Pendiente (Opcional)"
                  value={montoPendientePrestamoForm}
                  onChange={(e) => setMontoPendientePrestamoForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={monedaPrestamoForm}
                  onChange={(e) => setMonedaPrestamoForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                >
                  <option value="PEN">PEN (S/)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="CLP">CLP ($)</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Día vencimiento (Opcional)"
                  value={diaVencimientoPrestamoForm}
                  onChange={(e) => setDiaVencimientoPrestamoForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={esInformalForm}
                  onChange={(e) => setEsInformalForm(e.target.checked)}
                />
                <span>Préstamo informal entre personas / amigos (Yape / Plin / Efectivo)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModalPrestamo(false)} className="flex-1 py-2.5 border rounded-xl font-semibold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-semibold text-sm">Guardar Préstamo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ABONO PRÉSTAMO */}
      {mostrarModalAbonoPrestamo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-amber-500" />
              Registrar Abono / Cuota de Préstamo
            </h3>
            <form onSubmit={registrarAbonoPrestamo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Préstamo</label>
                <select
                  value={prestamoSeleccionadoId}
                  onChange={(e) => setPrestamoSeleccionadoId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                >
                  {prestamos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Pend: {formatoMoneda(p.montoPendiente, p.moneda)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Cuenta Imputada</label>
                <select
                  value={cuentaOrigenAbonoPrestamoId}
                  onChange={(e) => setCuentaOrigenAbonoPrestamoId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                >
                  {cuentasConSaldosActuales.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} (Saldo: {formatoMoneda(c.saldoActual, c.moneda)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Monto del Abono</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={montoAbonoPrestamo}
                  onChange={(e) => setMontoAbonoPrestamo(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModalAbonoPrestamo(false)} className="flex-1 py-2.5 border rounded-xl font-semibold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-semibold text-sm">Confirmar Abono</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN CON GESTIÓN DE CATEGORÍAS */}
      {mostrarModalConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-6 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-500" />
                Configuración y Categorías
              </h3>
              <button
                onClick={() => setMostrarModalConfig(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Modo Noche / Tema Oscuro</h4>
                    <p className="text-xs text-slate-400">Ajusta los colores para reducir el cansancio visual.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-500 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Moneda Principal</h4>
                    <p className="text-xs text-slate-400">Convierte todos los totales a esta divisa.</p>
                  </div>
                </div>

                <select
                  value={moneda}
                  onChange={(e) => handleCambiarMonedaPrincipal(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  <option value="CLP" className="bg-slate-800 text-white">CLP ($ Pesos Chilenos)</option>
                  <option value="PEN" className="bg-slate-800 text-white">PEN (S/ Soles)</option>
                  <option value="USD" className="bg-slate-800 text-white">USD ($ Dólares)</option>
                  <option value="EUR" className="bg-slate-800 text-white">EUR (€ Euros)</option>
                </select>
              </div>

              {/* SECCIÓN TIPOS DE CAMBIO / TASAS DE CONVERSIÓN */}
              <div className={`p-4 rounded-xl border space-y-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                    Tipos de Cambio / Tasas de Conversión
                  </h4>
                  <button
                    type="button"
                    onClick={() => setTiposCambio({ USD_PEN: 3.75, EUR_PEN: 4.10, CLP_PEN: 0.0041, USD_CLP: 920, EUR_CLP: 1000 })}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Restablecer por defecto
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Define el valor equivalente en Soles Peruanos (PEN) para cada moneda extranjera.
                </p>

                <div className="space-y-2.5">
                  {/* CLP a PEN */}
                  <div className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div>
                      <span className="text-xs font-bold block">1 CLP → PEN (S/)</span>
                      <span className="text-[10px] text-slate-400">
                        Inversa: 1 PEN ≈ {tiposCambio.CLP_PEN > 0 ? Math.round((1 / tiposCambio.CLP_PEN) * 100) / 100 : 0} CLP
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.00001"
                      value={tiposCambio.CLP_PEN ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTiposCambio(prev => ({ ...prev, CLP_PEN: isNaN(val) ? 0 : val }));
                      }}
                      className={`w-full sm:w-28 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold text-right ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
                    />
                  </div>

                  {/* USD a PEN */}
                  <div className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div>
                      <span className="text-xs font-bold block">1 USD → PEN (S/)</span>
                      <span className="text-[10px] text-slate-400">
                        Inversa: 1 PEN ≈ {tiposCambio.USD_PEN > 0 ? (1 / tiposCambio.USD_PEN).toFixed(4) : 0} USD
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={tiposCambio.USD_PEN ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTiposCambio(prev => ({ ...prev, USD_PEN: isNaN(val) ? 0 : val }));
                      }}
                      className={`w-full sm:w-28 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold text-right ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
                    />
                  </div>

                  {/* EUR a PEN */}
                  <div className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div>
                      <span className="text-xs font-bold block">1 EUR → PEN (S/)</span>
                      <span className="text-[10px] text-slate-400">
                        Inversa: 1 PEN ≈ {tiposCambio.EUR_PEN > 0 ? (1 / tiposCambio.EUR_PEN).toFixed(4) : 0} EUR
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={tiposCambio.EUR_PEN ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTiposCambio(prev => ({ ...prev, EUR_PEN: isNaN(val) ? 0 : val }));
                      }}
                      className={`w-full sm:w-28 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold text-right ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN CATEGORÍAS PERSONALIZADAS */}
              <div className={`p-4 rounded-xl border space-y-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" /> Categorías Personalizadas de Gasto
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nueva categoría de gasto..."
                    value={nuevaCatGasto}
                    onChange={(e) => setNuevaCatGasto(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                  />
                  <button
                    onClick={agregarCategoriaGasto}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
                  >
                    + Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {catGastosPers.map(cat => (
                    <span key={cat} className="text-xs px-2.5 py-1 bg-slate-700 text-slate-200 rounded-full flex items-center gap-1">
                      {cat}
                      {!CATEGORIAS_GASTOS_DEFECTO.includes(cat) && (
                        <button onClick={() => eliminarCategoriaGasto(cat)} className="hover:text-rose-400 font-bold ml-1">✕</button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border space-y-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" /> Categorías Personalizadas de Ingreso
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nueva categoría de ingreso..."
                    value={nuevaCatIngreso}
                    onChange={(e) => setNuevaCatIngreso(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                  />
                  <button
                    onClick={agregarCategoriaIngreso}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                  >
                    + Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {catIngresosPers.map(cat => (
                    <span key={cat} className="text-xs px-2.5 py-1 bg-slate-700 text-slate-200 rounded-full flex items-center gap-1">
                      {cat}
                      {!CATEGORIAS_INGRESOS_DEFECTO.includes(cat) && (
                        <button onClick={() => eliminarCategoriaIngreso(cat)} className="hover:text-rose-400 font-bold ml-1">✕</button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setMostrarModalConfig(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
            >
              Guardar Preferencias
            </button>
          </div>
        </div>
      )}

      {/* MODAL DEFINIR PRESUPUESTOS (CATEGORÍA Y GLOBAL) */}
      {mostrarModalPresupuesto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Definir Presupuestos Mensuales</h3>
            
            <form onSubmit={guardarPresupuesto} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Presupuesto Global del Mes ({moneda})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Límite máximo de gasto global..."
                  value={presupuestoGlobal || ''}
                  onChange={(e) => setPresupuestoGlobal(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="border-t pt-3 border-slate-700">
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Presupuesto por Categoría Específica</label>
                <select
                  value={categoriaPresupuesto}
                  onChange={(e) => setCategoriaPresupuesto(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {catGastosPers.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-800 text-white">{cat}</option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 1000.00"
                  value={limitePresupuestoForm}
                  onChange={(e) => setLimitePresupuestoForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalPresupuesto(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                >
                  Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TRANSACCIÓN CON CONVERSIÓN EN TIEMPO REAL */}
      {mostrarModalTransaccion && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Wallet className="w-5 h-5 text-indigo-600" />
              {transaccionEditandoId ? 'Editar Transacción' : 'Nueva Transacción Multi-Moneda'}
            </h3>
            
            <form onSubmit={agregarTransaccion} className="space-y-4">
              <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => { if (tipoForm !== 'gasto') { setTipoForm('gasto'); setCategoriaForm(catGastosPers[0] || CATEGORIAS_GASTOS_DEFECTO[0]); } }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoForm === 'gasto' ? (darkMode ? 'bg-slate-700 text-rose-400 shadow' : 'bg-white shadow text-rose-600') : 'text-slate-400'}`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => { if (tipoForm !== 'ingreso') { setTipoForm('ingreso'); setCategoriaForm(catIngresosPers[0] || CATEGORIAS_INGRESOS_DEFECTO[0]); } }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoForm === 'ingreso' ? (darkMode ? 'bg-slate-700 text-emerald-400 shadow' : 'bg-white shadow text-emerald-600') : 'text-slate-400'}`}
                >
                  Ingreso
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={montoForm}
                    onChange={(e) => setMontoForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Moneda</label>
                  <select
                    value={monedaTransForm}
                    onChange={(e) => setMonedaTransForm(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    <option value="PEN" className="bg-slate-800 text-white">PEN (S/)</option>
                    <option value="USD" className="bg-slate-800 text-white">USD ($)</option>
                    <option value="EUR" className="bg-slate-800 text-white">EUR (€)</option>
                    <option value="CLP" className="bg-slate-800 text-white">CLP ($)</option>
                  </select>
                </div>
              </div>

              {/* MUESTRA LA CONVERSIÓN EN TIEMPO REAL SI LA MONEDA DIFIERE */}
              {(() => {
                const ctaSelec = cuentasConSaldosActuales.find(c => c.id === cuentaSeleccionadaId);
                const monCuenta = esCreditoForm 
                  ? (tarjetas.find(t => t.id === tarjetaSeleccionadaId)?.moneda || 'PEN')
                  : (ctaSelec?.moneda || 'PEN');

                if (montoForm && parseFloat(montoForm) > 0 && monedaTransForm !== monCuenta) {
                  const equivalente = convertirMoneda(parseFloat(montoForm), monedaTransForm, monCuenta);
                  return (
                    <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-400 flex items-center justify-between">
                      <span>Equivalente a descontar en {monCuenta}:</span>
                      <strong className="font-bold">{formatoMoneda(equivalente, monCuenta)}</strong>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Descripción / Concepto</label>
                <input
                  type="text"
                  placeholder="Ej: Suscripción en dólares, Almuerzo..."
                  value={descForm}
                  onChange={(e) => setDescForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Nota Opcional / Detalles Libres</label>
                <input
                  type="text"
                  placeholder="Ej: Cena con compañeros de trabajo, Mantenimiento PC..."
                  value={notaForm}
                  onChange={(e) => setNotaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              {tipoForm === 'gasto' && (
                <div className={`p-3 rounded-xl border space-y-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`block text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Origen del Dinero</span>
                  <div className="flex gap-4">
                    <label className={`flex items-center gap-1.5 text-sm cursor-pointer ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      <input 
                        type="radio" 
                        name="origenGasto" 
                        checked={!esCreditoForm} 
                        onChange={() => setEsCreditoForm(false)} 
                      />
                      <span>Cuenta / Billetera Líquida</span>
                    </label>
                    <label className={`flex items-center gap-1.5 text-sm cursor-pointer ${darkMode ? 'text-purple-300' : 'text-purple-700 font-medium'}`}>
                      <input 
                        type="radio" 
                        name="origenGasto" 
                        checked={esCreditoForm} 
                        onChange={() => setEsCreditoForm(true)} 
                      />
                      <span>Tarjeta de Crédito</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Categoría</label>
                  <select
                    value={categoriaForm}
                    onChange={(e) => setCategoriaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    {(tipoForm === 'gasto' ? catGastosPers : catIngresosPers).map(cat => (
                      <option key={cat} value={cat} className="bg-slate-800 text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Fecha</label>
                  <input
                    type="date"
                    required
                    value={fechaForm}
                    onChange={(e) => setFechaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {tipoForm === 'gasto' && esCreditoForm ? 'Seleccionar Tarjeta' : 'Seleccionar Cuenta o Billetera'}
                </label>
                {tipoForm === 'gasto' && esCreditoForm ? (
                  tarjetas.length === 0 ? (
                    <div className="text-xs text-rose-500 font-medium p-2 bg-rose-50 rounded-xl border border-rose-200">
                      No tienes tarjetas registradas. Crea una primero.
                    </div>
                  ) : (
                    <select
                      value={tarjetaSeleccionadaId}
                      onChange={(e) => setTarjetaSeleccionadaId(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium ${darkMode ? 'bg-slate-800 border-purple-500/40 text-white' : 'border-purple-200 bg-purple-50/50 text-purple-900'}`}
                    >
                      {tarjetas.map(t => (
                        <option key={t.id} value={t.id} className="bg-slate-800 text-white">
                          {t.nombre} ({t.moneda || 'PEN'} - Disp: {formatoMoneda(t.limite - t.deudaActual, t.moneda || 'PEN')})
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <select
                    value={cuentaSeleccionadaId}
                    onChange={(e) => setCuentaSeleccionadaId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    {cuentasConSaldosActuales.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                        {c.nombre} (Saldo: {formatoMoneda(c.saldoActual, c.moneda)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalTransaccion(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={tipoForm === 'gasto' && esCreditoForm && tarjetas.length === 0}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-sm"
                >
                  {transaccionEditandoId ? 'Guardar cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TRANSFERENCIA ENTRE CUENTAS */}
      {mostrarModalTransferencia && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
              Transferir entre Cuentas / Billeteras
            </h3>
            
            <form onSubmit={realizarTransferencia} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta Origen (Sale dinero)</label>
                <select
                  value={cuentaOrigenId}
                  onChange={(e) => setCuentaOrigenId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {cuentasConSaldosActuales.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                      {c.nombre} (Saldo: {formatoMoneda(c.saldoActual, c.moneda)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta Destino (Ingresa dinero)</label>
                <select
                  value={cuentaDestinoId}
                  onChange={(e) => setCuentaDestinoId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {cuentasConSaldosActuales.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                      {c.nombre} (Saldo: {formatoMoneda(c.saldoActual, c.moneda)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monto a Transferir</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={montoTransferenciaForm}
                  onChange={(e) => setMontoTransferenciaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalTransferencia(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cuentaOrigenId === cuentaDestinoId}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-sm"
                >
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAGO DE TARJETA */}
      {mostrarModalPagoTarjeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <CreditCard className="w-5 h-5 text-purple-500" />
              Pagar Tarjeta de Crédito
            </h3>
            
            <form onSubmit={registrarPagoTarjeta} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Tarjeta a Pagar</label>
                <select
                  value={tarjetaAPagarId}
                  onChange={(e) => setTarjetaAPagarId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {tarjetas.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-800 text-white">
                      {t.nombre} (Deuda: {formatoMoneda(t.deudaActual, t.moneda)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta Origen del Pago</label>
                <select
                  value={cuentaOrigenPagoTarjetaId}
                  onChange={(e) => setCuentaOrigenPagoTarjetaId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {cuentasConSaldosActuales.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                      {c.nombre} (Saldo: {formatoMoneda(c.saldoActual, c.moneda)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monto a Pagar</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={montoPagoTarjetaForm}
                  onChange={(e) => setMontoPagoTarjetaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalPagoTarjeta(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 text-sm shadow-sm"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA COMPRA EN CUOTAS */}
      {mostrarModalCuotaTarjeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <CreditCard className="w-5 h-5 text-indigo-500" />
              Registrar Compra en Cuotas
            </h3>
            
            <form onSubmit={guardarCompraCuotas} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Tarjeta de Crédito</label>
                <select
                  value={tarjetaCuotaId}
                  onChange={(e) => setTarjetaCuotaId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {tarjetas.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-800 text-white">
                      {t.nombre} ({t.moneda || 'PEN'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Concepto / Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laptop nueva, Electrodoméstico..."
                  value={conceptoCuotaForm}
                  onChange={(e) => setConceptoCuotaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Categoría de Gasto</label>
                  <select
                    value={categoriaCuotaForm}
                    onChange={(e) => setCategoriaCuotaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    {catGastosPers.map(cat => (
                      <option key={cat} value={cat} className="bg-slate-800 text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Fecha de Inicio / 1ra Cuota</label>
                  <input
                    type="date"
                    required
                    value={fechaCuotaForm}
                    onChange={(e) => setFechaCuotaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monto Total de la Compra</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={montoTotalCuotaForm}
                  onChange={(e) => setMontoTotalCuotaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Número Total de Cuotas</label>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    required
                    value={numCuotasForm}
                    onChange={(e) => setNumCuotasForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuota Actual</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    required
                    value={cuotaActualForm}
                    onChange={(e) => setCuotaActualForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              {montoTotalCuotaForm && numCuotasForm && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-400 flex justify-between items-center">
                  <span>Valor de cada cuota mensual:</span>
                  <strong className="font-bold text-sm">{formatoMoneda(parseFloat(montoTotalCuotaForm || 0) / parseInt(numCuotasForm || 1, 10))}</strong>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalCuotaTarjeta(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 text-sm shadow-sm"
                >
                  Guardar Cuotas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TARJETA NUEVA */}
      {mostrarModalTarjeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <CreditCard className="w-5 h-5 text-purple-500" />
              {tarjetaEditandoId ? 'Editar Tarjeta de Crédito' : 'Nueva Tarjeta de Crédito'}
            </h3>
            
            <form onSubmit={guardarTarjeta} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Nombre de la Tarjeta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BCP Visa Signature..."
                  value={nombreTarjetaForm}
                  onChange={(e) => setNombreTarjetaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Límite de Crédito</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej: 5000"
                    value={limiteTarjetaForm}
                    onChange={(e) => setLimiteTarjetaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Moneda</label>
                  <select
                    value={monedaTarjetaForm}
                    onChange={(e) => setMonedaTarjetaForm(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    <option value="PEN">PEN (S/)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CLP">CLP ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Día de Corte (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej: 20"
                    value={diaCorteTarjetaForm}
                    onChange={(e) => setDiaCorteTarjetaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Día de Vencimiento (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej: 5"
                    value={diaVencimientoTarjetaForm}
                    onChange={(e) => setDiaVencimientoTarjetaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              {!tarjetaEditandoId && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Deuda Inicial (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={deudaInicialTarjetaForm}
                    onChange={(e) => setDeudaInicialTarjetaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalTarjeta(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 text-sm shadow-sm"
                >
                  {tarjetaEditandoId ? 'Guardar Cambios' : 'Guardar Tarjeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECURRENTE NUEVO */}
      {mostrarModalRecurrente && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Repeat className="w-5 h-5 text-purple-500" />
              Nuevo Movimiento Recurrente
            </h3>
            
            <form onSubmit={guardarRecurrente} className="space-y-4">
              <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setTipoRecurrenteForm('gasto')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoRecurrenteForm === 'gasto' ? (darkMode ? 'bg-slate-700 text-rose-400 shadow' : 'bg-white shadow text-rose-600') : 'text-slate-400'}`}
                >
                  Gasto Fijo
                </button>
                <button
                  type="button"
                  onClick={() => setTipoRecurrenteForm('ingreso')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoRecurrenteForm === 'ingreso' ? (darkMode ? 'bg-slate-700 text-emerald-400 shadow' : 'bg-white shadow text-emerald-600') : 'text-slate-400'}`}
                >
                  Ingreso Fijo
                </button>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Alquiler, Netflix, Sueldo..."
                  value={descRecurrenteForm}
                  onChange={(e) => setDescRecurrenteForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monto Fijo</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={montoRecurrenteForm}
                    onChange={(e) => setMontoRecurrenteForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Moneda</label>
                  <select
                    value={monedaRecurrenteForm}
                    onChange={(e) => setMonedaRecurrenteForm(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="CLP">CLP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Día del Mes (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={diaPagoRecurrenteForm}
                    onChange={(e) => setDiaPagoRecurrenteForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Categoría</label>
                  <select
                    value={categoriaRecurrenteForm}
                    onChange={(e) => setCategoriaRecurrenteForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    {(tipoRecurrenteForm === 'gasto' ? catGastosPers : catIngresosPers).map(cat => (
                      <option key={cat} value={cat} className="bg-slate-800 text-white">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta Imputada</label>
                <select
                  value={cuentaRecurrenteId}
                  onChange={(e) => setCuentaRecurrenteId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {cuentasConSaldosActuales.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                      {c.nombre} ({c.moneda})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalRecurrente(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 text-sm shadow-sm"
                >
                  Guardar Recurrencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CIERRE DE MES */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-500" />
                Cierre de Mes ({NOMBRES_MESES[mesSeleccionado]} {anioSeleccionado})
              </h3>
              <button
                onClick={() => setMostrarModalCierre(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs text-slate-400">
                Al realizar el corte de caja, el balance neto del periodo se archivará formalmente en tu historial y tus saldos líquidos estarán listos para el mes siguiente.
              </p>

              <div className={`p-4 rounded-xl border space-y-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ingresos Totales:</span>
                  <strong className="text-emerald-400">{formatoMoneda(resumen.ingresos)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gastos Totales:</span>
                  <strong className="text-rose-400">{formatoMoneda(resumen.totalGastosDelMes)}</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="font-bold">Balance Neto:</span>
                  <strong className={`font-black text-base ${resumen.balanceNetoMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatoMoneda(resumen.balanceNetoMes)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalCierre(false)}
                className={`flex-1 py-2.5 border rounded-xl font-semibold text-xs transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarCierreMes}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm"
              >
                Confirmar Cierre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BITÁCORA DE CIERRES HISTÓRICOS */}
      {mostrarModalInfoData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-700/50">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-500" /> Bitácora de Cierres de Mes ({cierresHistoricos.length})
              </h3>
              <button type="button" onClick={() => setMostrarModalInfoData(false)} className="text-slate-400 hover:text-slate-200 font-bold">✕</button>
            </div>
            {cierresHistoricos.length === 0 ? (
              <p className="text-xs text-slate-400">No hay cierres archivados aún.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {cierresHistoricos.map((c) => (
                  <div key={c.id} className={`p-3 rounded-xl border text-xs flex justify-between items-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <p className="font-bold">{c.periodo}</p>
                      <p className="text-slate-400 text-[11px]">Cerrado el {c.fechaCierre}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold block ${c.balanceNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Balance: {formatoMoneda(c.balanceNeto, c.moneda)}
                      </span>
                      <span className="text-[10px] text-slate-400">Liquidez: {formatoMoneda(c.saldoLiquidoFinal, c.moneda)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL NUEVA META DE AHORRO */}
      {mostrarModalMeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-500" />
              Nueva Meta de Ahorro
            </h3>
            <form onSubmit={guardarMeta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre del Objetivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fondo de Emergencia, Viaje, Laptop..."
                  value={nombreMetaForm}
                  onChange={(e) => setNombreMetaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Monto Objetivo</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="5000.00"
                    value={montoObjetivoMetaForm}
                    onChange={(e) => setMontoObjetivoMetaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Ahorro Inicial (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={montoInicialMetaForm}
                    onChange={(e) => setMontoInicialMetaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Moneda</label>
                  <select
                    value={monedaMetaForm}
                    onChange={(e) => setMonedaMetaForm(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  >
                    <option value="PEN">PEN (S/)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CLP">CLP ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={fechaLimiteMetaForm}
                    onChange={(e) => setFechaLimiteMetaForm(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Color</label>
                  <input
                    type="color"
                    value={colorMetaForm}
                    onChange={(e) => setColorMetaForm(e.target.value)}
                    className="w-full h-9 px-1 py-1 border rounded-xl cursor-pointer bg-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModalMeta(false)} className="flex-1 py-2.5 border rounded-xl font-semibold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm">Crear Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL APORTE A META DE AHORRO */}
      {mostrarModalAporteMeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-500" />
              Registrar Aporte a Meta
            </h3>
            <form onSubmit={registrarAporteMeta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Meta Destino</label>
                <select
                  value={metaSeleccionadaId}
                  onChange={(e) => setMetaSeleccionadaId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                >
                  {metas.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} ({formatoMoneda(m.montoActual, m.moneda)} / {formatoMoneda(m.montoObjetivo, m.moneda)})
                    </option>
                  ))}
                </select>
              </div>

              {cuentasBancarias.length > 0 && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={descontarCuentaMeta}
                    onChange={(e) => setDescontarCuentaMeta(e.target.checked)}
                  />
                  <span>Descontar aporte desde una cuenta o billetera</span>
                </label>
              )}

              {descontarCuentaMeta && cuentasBancarias.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Cuenta Origen</label>
                  <select
                    value={cuentaAporteMetaId}
                    onChange={(e) => setCuentaAporteMetaId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  >
                    {cuentasConSaldosActuales.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (Saldo: {formatoMoneda(c.saldoActual, c.moneda)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">Monto del Aporte</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={montoAporteMetaForm}
                  onChange={(e) => setMontoAporteMetaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModalAporteMeta(false)} className="flex-1 py-2.5 border rounded-xl font-semibold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm">Confirmar Aporte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN Y GENERACIÓN DE REPORTE PDF */}
      {mostrarModalPdf && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/50">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Generar Reporte Financiero en PDF
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModalPdf(false)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Selección de período */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Período del Reporte (Moneda: {moneda})
                </label>
                <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <button
                    type="button"
                    onClick={() => setPdfTipoPeriodo('mes')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                      pdfTipoPeriodo === 'mes'
                        ? (darkMode ? 'bg-slate-700 text-indigo-400 shadow' : 'bg-white text-indigo-600 shadow')
                        : 'text-slate-400'
                    }`}
                  >
                    Mes ({NOMBRES_MESES[mesSeleccionado].slice(0, 3)} {anioSeleccionado})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfTipoPeriodo('anio')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                      pdfTipoPeriodo === 'anio'
                        ? (darkMode ? 'bg-slate-700 text-indigo-400 shadow' : 'bg-white text-indigo-600 shadow')
                        : 'text-slate-400'
                    }`}
                  >
                    Año ({anioSeleccionado})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfTipoPeriodo('rango')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                      pdfTipoPeriodo === 'rango'
                        ? (darkMode ? 'bg-slate-700 text-indigo-400 shadow' : 'bg-white text-indigo-600 shadow')
                        : 'text-slate-400'
                    }`}
                  >
                    Rango Fechas
                  </button>
                </div>

                {pdfTipoPeriodo === 'rango' && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Desde</label>
                      <input
                        type="date"
                        value={pdfFechaInicio}
                        onChange={(e) => setPdfFechaInicio(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hasta</label>
                      <input
                        type="date"
                        value={pdfFechaFin}
                        onChange={(e) => setPdfFechaFin(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Apartados fijos incluidos */}
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-bold text-indigo-400">Apartados principales incluidos automáticamente:</div>
                <ul className="space-y-1 text-slate-400 list-disc list-inside">
                  <li>Encabezado con período, moneda ({moneda}) y fecha de generación</li>
                  <li>Resumen del período (ingresos, gastos, balance y % ahorrado)</li>
                  <li>Tabla de gastos por categoría, % del total y límite de presupuesto</li>
                  <li>Detalle completo de movimientos ordenados por fecha con totales</li>
                </ul>
              </div>

              {/* Opciones adicionales */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Apartados Opcionales
                </label>

                {pdfTipoPeriodo === 'mes' && (
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-xs ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <input
                      type="checkbox"
                      checked={pdfCompararAnterior}
                      onChange={(e) => setPdfCompararAnterior(e.target.checked)}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold block">Comparativa con el mes anterior</span>
                      <span className="text-[11px] text-slate-400">Muestra variación de ingresos, gastos y balance respecto al mes previo.</span>
                    </div>
                  </label>
                )}

                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-xs ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={pdfIncluirCuentasDeudas}
                    onChange={(e) => setPdfIncluirCuentasDeudas(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold block">Saldos por cuenta, deudas y vencimientos</span>
                    <span className="text-[11px] text-slate-400">Detalle de saldo en cada cuenta/billetera, deuda de tarjetas, préstamos y próximos vencimientos.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-xs ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={pdfIncluirResumenAnual}
                    onChange={(e) => setPdfIncluirResumenAnual(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold block">Resumen anual ({anioSeleccionado})</span>
                    <span className="text-[11px] text-slate-400">Tabla comparativa de ingresos y gastos mes a mes de todo el año.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-xs ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={pdfIncluirMetas}
                    onChange={(e) => setPdfIncluirMetas(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold block">Metas de ahorro ({metas.length})</span>
                    <span className="text-[11px] text-slate-400">Monto ahorrado, objetivo, faltante y porcentaje de avance de cada meta.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalPdf(false)}
                className={`flex-1 py-2.5 border rounded-xl font-semibold text-xs transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={generarReportePDF}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" /> Generar y Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO PROPIO DE CONFIRMACIÓN */}
      {dialogoConfirmacion && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${dialogoConfirmacion.variante === 'danger' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">{dialogoConfirmacion.titulo}</h3>
                <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {dialogoConfirmacion.mensaje}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDialogoConfirmacion(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = dialogoConfirmacion.onConfirm;
                  setDialogoConfirmacion(null);
                  if (typeof fn === 'function') fn();
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-colors ${dialogoConfirmacion.variante === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {dialogoConfirmacion.textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN FLOTANTE PROPIA */}
      {notificacionToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 ${
            notificacionToast.tipo === 'error'
              ? 'bg-rose-950/95 border-rose-500/40 text-rose-200'
              : 'bg-slate-900/95 border-emerald-500/40 text-emerald-200'
          }`}>
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${notificacionToast.tipo === 'error' ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span>{notificacionToast.texto}</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <FinanzasDashboard />
    </AppErrorBoundary>
  );
}