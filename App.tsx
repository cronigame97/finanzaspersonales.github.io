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
  Users
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

export default function App() {
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
    if (!user) return 'CLP';
    return loadUserData(user.username, 'moneda', 'CLP');
  });

  const [tiposCambio, setTiposCambio] = useState(() => {
    if (!user) return { USD_PEN: 3.75, EUR_PEN: 4.10, CLP_PEN: 0.0041, USD_CLP: 920, EUR_CLP: 1000 };
    return loadUserData(user.username, 'tipos_cambio', { USD_PEN: 3.75, EUR_PEN: 4.10, CLP_PEN: 0.0041, USD_CLP: 920, EUR_CLP: 1000 });
  });

  // Categorías personalizadas por usuario
  const [catGastosPers, setCatGastosPers] = useState([]);
  const [catIngresosPers, setCatIngresosPers] = useState([]);
  const [nuevaCatGasto, setNuevaCatGasto] = useState('');
  const [nuevaCatIngreso, setNuevaCatIngreso] = useState('');

  // Formularios Auth
  const [modoAuth, setModoAuth] = useState('login');
  const [usernameForm, setUsernameForm] = useState('');
  const [passwordForm, setPasswordForm] = useState('');
  const [preguntaForm, setPreguntaForm] = useState('¿Cuál es el nombre de tu primera mascota?');
  const [respuestaForm, setRespuestaForm] = useState('');
  const [errorAuth, setErrorAuth] = useState('');
  const [procesandoAuth, setProcesandoAuth] = useState(false);

  // Modal Recuperar Contraseña
  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState(false);
  const [userRecuperar, setUserRecuperar] = useState('');
  const [respuestaRecuperar, setRespuestaRecuperar] = useState('');
  const [nuevaPasswordForm, setNuevaPasswordForm] = useState('');
  const [preguntaUsuario, setPreguntaUsuario] = useState('');
  const [pasoRecuperacion, setPasoRecuperacion] = useState(1);
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState(null);

  // Modal Borrar Caché / Datos
  const [mostrarModalBorrarCache, setMostrarModalBorrarCache] = useState(false);
  const [confirmarTextoBorrar, setConfirmarTextoBorrar] = useState('');

  // Navegación y Secciones
  const [seccionActiva, setSeccionActiva] = useState('general');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // Datos principales por usuario
  const [transacciones, setTransacciones] = useState([]);
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [cuotasTarjetas, setCuotasTarjetas] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [presupuestos, setPresupuestos] = useState({});
  const [presupuestoGlobal, setPresupuestoGlobal] = useState(0);
  const [recurrentes, setRecurrentes] = useState([]);
  const [metas, setMetas] = useState([]);
  const [cierresHistoricos, setCierresHistoricos] = useState([]);

  // Modal Cierre de Mes
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);

  // Cargar datos al iniciar sesión o cambiar usuario
  useEffect(() => {
    if (!user) return;
    setTransacciones(loadUserData(user.username, 'transacciones', TRANSACCIONES_DEFECTO));
    setCuentasBancarias(loadUserData(user.username, 'cuentas_bancarias', CUENTAS_DEFECTO));
    setTarjetas(loadUserData(user.username, 'tarjetas', TARJETAS_DEFECTO));
    setCuotasTarjetas(loadUserData(user.username, 'cuotas_tarjetas', []));
    setPrestamos(loadUserData(user.username, 'prestamos', PRESTAMOS_DEFECTO));
    setPresupuestos(loadUserData(user.username, 'presupuestos', {}));
    setPresupuestoGlobal(loadUserData(user.username, 'presupuesto_global', 0));
    setRecurrentes(loadUserData(user.username, 'recurrentes', []));
    setMetas(loadUserData(user.username, 'metas', []));
    setCatGastosPers(loadUserData(user.username, 'cat_gastos_pers', CATEGORIAS_GASTOS_DEFECTO));
    setCatIngresosPers(loadUserData(user.username, 'cat_ingresos_pers', CATEGORIAS_INGRESOS_DEFECTO));
    setCierresHistoricos(loadUserData(user.username, 'cierres_historicos', []));
  }, [user]);

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
  const handleAuthSubmit = (e) => {
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
      usersDb[cleanUsername] = { 
        password: passwordForm,
        preguntaSeguridad: preguntaForm,
        respuestaSeguridad: respuestaForm.trim().toLowerCase()
      };
      try {
        localStorage.setItem('finanzas_users_registry', JSON.stringify(usersDb));
      } catch (err) {
        setErrorAuth('No se pudo guardar la cuenta: almacenamiento no disponible.');
        setProcesandoAuth(false);
        return;
      }
    } else {
      if (!usersDb[cleanUsername] || usersDb[cleanUsername].password !== passwordForm) {
        setErrorAuth('Usuario o contraseña incorrectos.');
        setProcesandoAuth(false);
        return;
      }
    }

    const newActiveUser = { username: cleanUsername, uid: `usr_${cleanUsername}_${Date.now()}` };
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

  const handleRestablecerPassword = (e) => {
    e.preventDefault();
    setMensajeRecuperacion(null);
    const cleanUsername = userRecuperar.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const registro = leerJSON('finanzas_users_registry', {});
    const userData = registro[cleanUsername];

    if (!userData) {
      setMensajeRecuperacion({ tipo: 'error', texto: 'Ocurrió un error al verificar los datos.' });
      return;
    }

    const respGuardada = userData.respuestaSeguridad || '';
    if (respGuardada && respuestaRecuperar.trim().toLowerCase() !== respGuardada) {
      setMensajeRecuperacion({ tipo: 'error', texto: 'La respuesta de seguridad es incorrecta.' });
      return;
    }

    if (!nuevaPasswordForm) {
      setMensajeRecuperacion({ tipo: 'error', texto: 'Ingresa una nueva contraseña.' });
      return;
    }

    registro[cleanUsername].password = nuevaPasswordForm;
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
                   (t.tipo === 'pago_prestamo' && asignadaEstaCuenta)) {
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
    return cuentasConSaldosActuales.reduce((acc, cta) => {
      return acc + convertirMoneda(cta.saldoActual, cta.moneda || 'PEN', moneda);
    }, 0);
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
        } else if (t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo') {
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
        const esSalida = (t.tipo === 'gasto' && !t.esCredito) || t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo' || t.tipo === 'transferencia_salida';
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
      setTransacciones(prev => prev.map(t => t.id === transaccionEditandoId ? nuevaTrans : t));
    } else {
      setTransacciones(prev => [nuevaTrans, ...prev]);
    }

    if (esCreditoForm && targetTarjetaId) {
      setTarjetas(prev => prev.map(t => {
        if (t.id === targetTarjetaId) {
          const delta = transaccionEditandoId ? 0 : parseFloat(montoForm);
          return { ...t, deudaActual: (t.deudaActual || 0) + delta };
        }
        return t;
      }));
    }

    setMostrarModalTransaccion(false);
  };

  const eliminarTransaccion = (t) => {
    setTransacciones(prev => prev.filter(item => item.id !== t.id));
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
      return;
    }
    setCuentasBancarias(prev => prev.filter(c => c.id !== id));
  };

  const realizarTransferencia = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoTransferenciaForm);
    if (!monto || monto <= 0 || cuentaOrigenId === cuentaDestinoId) return;

    const ctaOrigen = cuentasConSaldosActuales.find(c => c.id === cuentaOrigenId);
    const ctaDestino = cuentasConSaldosActuales.find(c => c.id === cuentaDestinoId);
    if (!ctaOrigen || !ctaDestino) return;

    const fecha = getFechaLocalHoy();
    const transSalida = {
      id: `trans_out_${Date.now()}`,
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

    const nuevaCompraCuotas = {
      id: `cuota_${Date.now()}`,
      tarjetaId: tarj.id,
      tarjetaNombre: tarj.nombre,
      concepto: conceptoCuotaForm.trim(),
      montoTotal,
      valorCuotaMensual,
      totalCuotas,
      cuotaActual: Math.min(cuotaActual, totalCuotas),
      moneda: tarj.moneda || 'PEN',
      fechaRegistro: getFechaLocalHoy()
    };

    setCuotasTarjetas(prev => [...prev, nuevaCompraCuotas]);

    setTarjetas(prev => prev.map(t => {
      if (t.id === tarj.id) {
        return { ...t, deudaActual: (t.deudaActual || 0) + valorCuotaMensual };
      }
      return t;
    }));

    setMostrarModalCuotaTarjeta(false);
    setConceptoCuotaForm('');
    setMontoTotalCuotaForm('');
  };

  const eliminarCompraCuotas = (id) => {
    const cuotaItem = cuotasTarjetas.find(c => c.id === id);
    if (cuotaItem) {
      setTarjetas(prev => prev.map(t => {
        if (t.id === cuotaItem.tarjetaId) {
          return { ...t, deudaActual: Math.max(0, (t.deudaActual || 0) - cuotaItem.valorCuotaMensual) };
        }
        return t;
      }));
    }
    setCuotasTarjetas(prev => prev.filter(c => c.id !== id));
  };

  const eliminarTarjeta = (id) => {
    setTarjetas(prev => prev.filter(t => t.id !== id));
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
      metodo: cta.nombre
    };

    setTransacciones(prev => [pagoMov, ...prev]);
    setTarjetas(prev => prev.map(t => {
      if (t.id === tarj.id) {
        const montoEnMonedaTarjeta = convertirMoneda(monto, cta.moneda || 'PEN', t.moneda || 'PEN');
        return { ...t, deudaActual: Math.max(0, (t.deudaActual || 0) - montoEnMonedaTarjeta) };
      }
      return t;
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
    setPrestamos(prev => prev.filter(p => p.id !== id));
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
    setRecurrentes(prev => prev.filter(r => r.id !== id));
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
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.transacciones) setTransacciones(imported.transacciones);
        if (imported.cuentasBancarias) setCuentasBancarias(imported.cuentasBancarias);
        if (imported.tarjetas) setTarjetas(imported.tarjetas);
        if (imported.cuotasTarjetas) setCuotasTarjetas(imported.cuotasTarjetas);
        if (imported.prestamos) setPrestamos(imported.prestamos);
        if (imported.presupuestos) setPresupuestos(imported.presupuestos);
        if (imported.presupuestoGlobal) setPresupuestoGlobal(imported.presupuestoGlobal);
        if (imported.recurrentes) setRecurrentes(imported.recurrentes);
        if (imported.metas) setMetas(imported.metas);
        if (imported.catGastosPers) setCatGastosPers(imported.catGastosPers);
        if (imported.catIngresosPers) setCatIngresosPers(imported.catIngresosPers);
        if (imported.cierresHistoricos) setCierresHistoricos(imported.cierresHistoricos);
        setMensajeRespaldo({ tipo: 'ok', texto: '¡Respaldo importado con éxito!' });
      } catch (err) {
        setMensajeRespaldo({ tipo: 'error', texto: 'Archivo de respaldo no válido.' });
      }
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
                localStorage.setItem('finanzas_active_user', JSON.stringify(demoUser));
                setUser(demoUser);
              }}
              className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-xl text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" /> Probar con Usuario Demo
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
      </div>
    );
  }

  // Comprobar alertas de presupuesto global
  const sobrepasoPresupuestoGlobal = presupuestoGlobal > 0 && resumen.totalGastosDelMes > presupuestoGlobal;
  const cercaPresupuestoGlobal = presupuestoGlobal > 0 && !sobrepasoPresupuestoGlobal && resumen.totalGastosDelMes >= (presupuestoGlobal * 0.8);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans p-4 sm:p-6 lg:p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* BARRA SUPERIOR DE USUARIO */}
        <div className={`${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-900'} text-white px-6 py-3 rounded-2xl flex flex-wrap justify-between items-center gap-4 shadow-md`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {user.username}
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3" /> Sesión Activa
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-tight mt-0.5">
                Multi-Cuenta & Multi-Moneda Activas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className={`p-2 rounded-xl border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700'}`}
              title={darkMode ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMostrarModalConfig(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl font-medium text-slate-200 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" /> Configuración
            </button>
            <button
              onClick={() => { setMensajeRespaldo(null); setMostrarModalInfoData(true); }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl font-medium text-slate-200 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" /> Datos
            </button>
            <button 
              onClick={handleCerrarSesion}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-rose-400 font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>

        {/* ALERTAS DE PRESUPUESTO GLOBAL */}
        {sobrepasoPresupuestoGlobal && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3 text-rose-500">
            <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
            <div>
              <h4 className="font-bold text-sm">¡Presupuesto Global Excedido!</h4>
              <p className="text-xs text-rose-400">
                Has gastado {formatoMoneda(resumen.totalGastosDelMes)} en {NOMBRES_MESES[mesSeleccionado]}, superando el límite mensual de {formatoMoneda(presupuestoGlobal)}.
              </p>
            </div>
          </div>
        )}

        {cercaPresupuestoGlobal && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-amber-500">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Atención: Cerca del Límite Global de Gastos</h4>
              <p className="text-xs text-amber-400">
                Has consumido más del 80% de tu presupuesto mensual ({formatoMoneda(resumen.totalGastosDelMes)} de {formatoMoneda(presupuestoGlobal)}).
              </p>
            </div>
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
              <h4 className={`font-bold text-sm flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                <Clock className="w-4 h-4 text-indigo-400" />
                Consumos Fraccionados en Cuotas ({cuotasTarjetas.length})
              </h4>

              {cuotasTarjetas.length === 0 ? (
                <p className="text-xs text-slate-400">No tienes compras en cuotas registradas actualmente.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cuotasTarjetas.map(c => (
                    <div key={c.id} className={`p-4 rounded-xl border relative group ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <button
                        onClick={() => eliminarCompraCuotas(c.id)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar registro de cuotas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded">
                          {c.tarjetaNombre}
                        </span>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                          Cuota {c.cuotaActual} de {c.totalCuotas}
                        </span>
                      </div>

                      <h5 className={`font-bold text-sm mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{c.concepto}</h5>

                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-700/40 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Valor Cuota Mensual:</span>
                          <strong className="text-indigo-400 text-sm font-black">{formatoMoneda(c.valorCuotaMensual, c.moneda)}</strong>
                        </div>
                        <span className="text-slate-400 text-[10px] font-mono">
                          Total: {formatoMoneda(c.montoTotal, c.moneda)}
                        </span>
                      </div>
                    </div>
                  ))}
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
                  <div key={cat} className={`p-4 rounded-xl border relative group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                      onClick={() => eliminarPresupuesto(cat)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar presupuesto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex justify-between items-center mb-1">
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
                  <div key={rec.id} className={`p-4 rounded-xl border relative group flex flex-col justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                      onClick={() => eliminarRecurrente(rec.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar recurrencia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wider ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Concepto</th>
                  <th className="py-3 px-4 font-semibold">Categoría</th>
                  <th className="py-3 px-4 font-semibold">Cuenta / Método</th>
                  <th className="py-3 px-4 font-semibold text-right">Monto</th>
                  <th className="py-3 px-4 font-semibold text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {transaccionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No hay transacciones registradas para este periodo y filtro.
                    </td>
                  </tr>
                ) : (
                  transaccionesFiltradas.map((t) => (
                    <tr key={t.id} className={`transition-colors ${darkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-50 hover:bg-slate-50'}`}>
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">{t.fecha}</td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        <div className="font-medium">{t.descripcion}</div>
                        {t.nota && (
                          <div className="text-[11px] text-slate-400 font-normal italic mt-0.5">
                            📝 {t.nota}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-500/10 text-indigo-500">
                          {t.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">{t.metodo}</td>
                      <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${t.tipo === 'ingreso' ? 'text-emerald-500' : t.tipo === 'transferencia_salida' ? 'text-blue-400' : 'text-rose-500'}`}>
                        {t.tipo === 'ingreso' ? '+' : t.tipo === 'transferencia_salida' ? '↔' : '-'} {formatoMoneda(t.monto, t.moneda || 'PEN')}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {(t.tipo === 'ingreso' || t.tipo === 'gasto') && t.categoria !== 'Pago de Préstamo' && (
                          <button
                            onClick={() => abrirEdicionTransaccion(t)}
                            className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-500/10"
                            title="Editar transacción"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => eliminarTransaccion(t)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-500/10"
                          title="Eliminar transacción"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

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
                  onChange={(e) => setMoneda(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  <option value="CLP" className="bg-slate-800 text-white">CLP ($ Pesos Chilenos)</option>
                  <option value="PEN" className="bg-slate-800 text-white">PEN (S/ Soles)</option>
                  <option value="USD" className="bg-slate-800 text-white">USD ($ Dólares)</option>
                  <option value="EUR" className="bg-slate-800 text-white">EUR (€ Euros)</option>
                </select>
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
                Confirmar Corte de Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INFORMACIÓN Y HISTORIAL DE CIERRES */}
      {mostrarModalInfoData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Database className="w-6 h-6 text-indigo-600" />
                Almacenamiento y Histórico de Cierres
              </h3>
              <button
                onClick={() => setMostrarModalInfoData(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {mensajeRespaldo && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${mensajeRespaldo.tipo === 'ok' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                {mensajeRespaldo.texto}
              </div>
            )}

            <div className="space-y-4 text-sm text-slate-400">
              <div className={`p-3 border rounded-xl flex items-start gap-3 ${darkMode ? 'bg-indigo-950/40 border-indigo-900/50 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-950'}`}>
                <Cloud className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Respaldo y Auditoría</h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    Descarga tus movimientos o restaura datos desde cualquier dispositivo.
                  </p>
                </div>
              </div>

              {cierresHistoricos.length > 0 && (
                <div className={`p-3 border rounded-xl space-y-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className={`font-bold text-xs uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Bitácora de Cortes de Caja Archivados</h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {cierresHistoricos.map(c => (
                      <div key={c.id} className="text-xs p-2 rounded bg-slate-900/50 flex justify-between items-center">
                        <div>
                          <strong>{c.periodo}</strong> <span className="text-[10px] text-slate-500">({c.fechaCierre})</span>
                        </div>
                        <span className={`font-bold ${c.balanceNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatoMoneda(c.balanceNeto, c.moneda)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`p-3 border rounded-xl space-y-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={exportarRespaldo}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Download className="w-4 h-4" /> Descargar respaldo
                  </button>
                  <label
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <Upload className="w-4 h-4" /> Restaurar respaldo
                    <input type="file" accept=".json,application/json" onChange={importarRespaldo} className="hidden" />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={exportarCSV}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-colors ${darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  <Download className="w-4 h-4" /> Exportar movimientos a CSV (Excel)
                </button>
              </div>
            </div>

            <button
              onClick={() => setMostrarModalInfoData(false)}
              className={`w-full py-2.5 font-semibold rounded-xl text-sm transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL NUEVA/EDITAR CUENTA */}
      {mostrarModalCuenta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Building2 className="w-5 h-5 text-blue-500" />
              {cuentaEditandoId ? 'Editar Cuenta o Billetera' : 'Nueva Cuenta / Billetera Digital'}
            </h3>
            
            <form onSubmit={guardarCuenta} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Nombre de la Cuenta / Billetera</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BCP Débito, Yape, BBVA..."
                  value={nombreCuentaForm}
                  onChange={(e) => setNombreCuentaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Tipo</label>
                  <select
                    value={tipoCuentaForm}
                    onChange={(e) => setTipoCuentaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    <option value="Bancaria">Bancaria</option>
                    <option value="Billetera Digital">Billetera Digital</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Ahorros">Ahorros</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Moneda</label>
                  <select
                    value={monedaCuentaForm}
                    onChange={(e) => setMonedaCuentaForm(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    <option value="PEN">PEN (S/)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={saldoInicialCuentaForm}
                    onChange={(e) => setSaldoInicialCuentaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Color Indicador</label>
                  <input
                    type="color"
                    value={colorCuentaForm}
                    onChange={(e) => setColorCuentaForm(e.target.value)}
                    className="w-full h-10 px-1 py-1 border rounded-xl cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Vincular con otra Cuenta (Bolsa de fondos compartida)</label>
                <select
                  value={cuentaVinculadaIdForm}
                  onChange={(e) => setCuentaVinculadaIdForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  <option value="">-- Sin vinculación (Independiente) --</option>
                  {cuentasBancarias
                    .filter(c => c.id !== cuentaEditandoId)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        Vincular a: {c.nombre} ({c.tipo})
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Al vincular por ejemplo Yape a BCP, ambos compartirán exactamente el mismo saldo y bolsa de fondos.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalCuenta(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 text-sm shadow-sm"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}