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
  Building2
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

const CATEGORIAS_GASTOS = [
  'Alimentación', 'Vivienda', 'Transporte', 'Servicios', 
  'Entretenimiento', 'Salud', 'Educación', 'Compras', 'Pago de Tarjeta', 'Otros Gastos'
];

const CATEGORIAS_INGRESOS = [
  'Sueldo / Salario', 'Ventas', 'Freelance', 'Inversiones', 'Regalo', 'Otros Ingresos'
];

const METODOS_PAGO_LIQUIDOS_DEFECTO = [
  'Yape', 'Plin', 'BCP Débito', 'BBVA Débito', 'Interbank Débito', 'Scotiabank Débito', 'Efectivo'
];

const COLORES_CATEGORIAS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B', 
  '#8B5CF6', '#14B8A6', '#EF4444', '#06B6D4', '#3B82F6', '#64748B'
];

// Helper para guardar/cargar en LocalStorage por Usuario
const loadUserData = (username, key, defaultValue) => {
  try {
    const saved = localStorage.getItem(`finanzas_app_${username}_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
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
    return raw ? JSON.parse(raw) : porDefecto;
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
    if (!user) return 'PEN';
    return loadUserData(user.username, 'moneda', 'PEN');
  });

  const [tiposCambio, setTiposCambio] = useState(() => {
    if (!user) return { USD_PEN: 3.75, EUR_PEN: 4.10 };
    return loadUserData(user.username, 'tipos_cambio', { USD_PEN: 3.75, EUR_PEN: 4.10 });
  });

  // Formularios Auth
  const [modoAuth, setModoAuth] = useState('login');
  const [usernameForm, setUsernameForm] = useState('');
  const [passwordForm, setPasswordForm] = useState('');
  const [errorAuth, setErrorAuth] = useState('');
  const [procesandoAuth, setProcesandoAuth] = useState(false);

  // --- NAVEGACIÓN Y FILTROS ---
  const [seccionActiva, setSeccionActiva] = useState('general'); // 'general' | 'cuentas' | 'tarjetas' | 'prestamos'
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroMetodo, setFiltroMetodo] = useState('todos');

  // --- DATOS DEL USUARIO ---
  const [transacciones, setTransacciones] = useState([]);
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [metas, setMetas] = useState([]);
  const [presupuestos, setPresupuestos] = useState({});
  const [recurrentes, setRecurrentes] = useState([]);

  // Conversor de divisas
  const convertirMoneda = (monto, monedaOrigen, monedaDestino = moneda) => {
    if (!monto) return 0;
    if (monedaOrigen === monedaDestino) return Number(monto);

    let enPen = Number(monto);
    if (monedaOrigen === 'USD') enPen = Number(monto) * (tiposCambio.USD_PEN || 3.75);
    if (monedaOrigen === 'EUR') enPen = Number(monto) * (tiposCambio.EUR_PEN || 4.10);

    if (monedaDestino === 'PEN') return enPen;
    if (monedaDestino === 'USD') return enPen / (tiposCambio.USD_PEN || 3.75);
    if (monedaDestino === 'EUR') return enPen / (tiposCambio.EUR_PEN || 4.10);

    return enPen;
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
      usersDb[cleanUsername] = { password: passwordForm };
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

    const newUser = {
      username: cleanUsername,
      uid: `user_${cleanUsername}`
    };

    try {
      localStorage.setItem('finanzas_active_user', JSON.stringify(newUser));
    } catch (err) {}
    setUser(newUser);
    setUsernameForm('');
    setPasswordForm('');
    setProcesandoAuth(false);
  };

  const handleCerrarSesion = () => {
    try {
      localStorage.removeItem('finanzas_active_user');
    } catch (err) {}
    setModoAuth('login');
    setErrorAuth('');
    setUser(null);
  };

  useEffect(() => {
    if (!user) {
      setTransacciones([]);
      setCuentasBancarias([]);
      setTarjetas([]);
      setPrestamos([]);
      setMetas([]);
      setPresupuestos({});
      setRecurrentes([]);
      setDarkMode(false);
      return;
    }

    const username = user.username;
    setTransacciones(loadUserData(username, 'transacciones', []));

    const cuentasGuardadas = loadUserData(username, 'cuentas_bancarias', null);
    if (!cuentasGuardadas) {
      const cuentasDefecto = [
        { id: 'cta_bcp', nombre: 'BCP Débito', tipo: 'Bancaria', moneda: 'PEN', saldoInicial: 1000, color: '#3B82F6' },
        { id: 'cta_yape', nombre: 'Yape', tipo: 'Billetera Digital', moneda: 'PEN', saldoInicial: 150, color: '#8B5CF6' },
        { id: 'cta_plin', nombre: 'Plin', tipo: 'Billetera Digital', moneda: 'PEN', saldoInicial: 100, color: '#06B6D4' },
        { id: 'cta_efectivo', nombre: 'Efectivo', tipo: 'Efectivo', moneda: 'PEN', saldoInicial: 100, color: '#10B981' }
      ];
      setCuentasBancarias(cuentasDefecto);
    } else {
      setCuentasBancarias(cuentasGuardadas);
    }

    setTarjetas(loadUserData(username, 'tarjetas', []));
    setPrestamos(loadUserData(username, 'prestamos', []));
    setMetas(loadUserData(username, 'metas', []));
    setPresupuestos(loadUserData(username, 'presupuestos', {}));
    setRecurrentes(loadUserData(username, 'recurrentes', []));
    setDarkMode(loadUserData(username, 'dark_mode', false));
    setMoneda(loadUserData(username, 'moneda', 'PEN'));
    setTiposCambio(loadUserData(username, 'tipos_cambio', { USD_PEN: 3.75, EUR_PEN: 4.10 }));
  }, [user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'transacciones', transacciones);
  }, [transacciones, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'cuentas_bancarias', cuentasBancarias);
  }, [cuentasBancarias, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'tarjetas', tarjetas);
  }, [tarjetas, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'prestamos', prestamos);
  }, [prestamos, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'metas', metas);
  }, [metas, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'presupuestos', presupuestos);
  }, [presupuestos, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'recurrentes', recurrentes);
  }, [recurrentes, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'dark_mode', darkMode);
  }, [darkMode, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'moneda', moneda);
  }, [moneda, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'tipos_cambio', tiposCambio);
  }, [tiposCambio, user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // --- MODALES Y FORMULARIOS ---
  const [mostrarModalTransaccion, setMostrarModalTransaccion] = useState(false);
  const [tipoForm, setTipoForm] = useState('gasto');
  const [montoForm, setMontoForm] = useState('');
  const [monedaTransForm, setMonedaTransForm] = useState('PEN');
  const [descForm, setDescForm] = useState('');
  const [categoriaForm, setCategoriaForm] = useState(CATEGORIAS_GASTOS[0]);
  const [fechaForm, setFechaForm] = useState(new Date().toISOString().split('T')[0]);
  const [esCreditoForm, setEsCreditoForm] = useState(false);
  const [tarjetaSeleccionadaId, setTarjetaSeleccionadaId] = useState('');
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState('');

  // Modales Cuentas Bancarias / Billeteras
  const [mostrarModalCuenta, setMostrarModalCuenta] = useState(false);
  const [nombreCuentaForm, setNombreCuentaForm] = useState('');
  const [tipoCuentaForm, setTipoCuentaForm] = useState('Bancaria');
  const [monedaCuentaForm, setMonedaCuentaForm] = useState('PEN');
  const [saldoInicialCuentaForm, setSaldoInicialCuentaForm] = useState('');
  const [colorCuentaForm, setColorCuentaForm] = useState('#6366F1');
  const [cuentaEditandoId, setCuentaEditandoId] = useState(null);

  // Modal Transferencia Entre Cuentas
  const [mostrarModalTransferencia, setMostrarModalTransferencia] = useState(false);
  const [cuentaOrigenId, setCuentaOrigenId] = useState('');
  const [cuentaDestinoId, setCuentaDestinoId] = useState('');
  const [montoTransferenciaForm, setMontoTransferenciaForm] = useState('');

  // Modales Tarjetas
  const [mostrarModalTarjeta, setMostrarModalTarjeta] = useState(false);
  const [nombreTarjetaForm, setNombreTarjetaForm] = useState('');
  const [limiteTarjetaForm, setLimiteTarjetaForm] = useState('');
  const [diaVencimientoTarjetaForm, setDiaVencimientoTarjetaForm] = useState('');
  const [monedaTarjetaForm, setMonedaTarjetaForm] = useState('PEN');
  const [deudaInicialTarjetaForm, setDeudaInicialTarjetaForm] = useState('');
  const [tarjetaEditandoId, setTarjetaEditandoId] = useState(null);

  // Modal Pago Tarjeta
  const [mostrarModalPagoTarjeta, setMostrarModalPagoTarjeta] = useState(false);
  const [tarjetaAPagarId, setTarjetaAPagarId] = useState('');
  const [montoPagoTarjetaForm, setMontoPagoTarjetaForm] = useState('');
  const [cuentaOrigenPagoTarjetaId, setCuentaOrigenPagoTarjetaId] = useState('');

  // Modales Préstamos
  const [mostrarModalPrestamo, setMostrarModalPrestamo] = useState(false);
  const [tipoPrestamoForm, setTipoPrestamoForm] = useState('tomado');
  const [nombrePrestamoForm, setNombrePrestamoForm] = useState('');
  const [prestamistaForm, setPrestamistaForm] = useState('');
  const [montoTotalPrestamoForm, setMontoTotalPrestamoForm] = useState('');
  const [montoPendientePrestamoForm, setMontoPendientePrestamoForm] = useState('');
  const [diaVencimientoPrestamoForm, setDiaVencimientoPrestamoForm] = useState('');
  const [monedaPrestamoForm, setMonedaPrestamoForm] = useState('PEN');

  // Modales Abono Préstamo
  const [mostrarModalAbonoPrestamo, setMostrarModalAbonoPrestamo] = useState(false);
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState('');
  const [montoAbonoPrestamo, setMontoAbonoPrestamo] = useState('');
  const [monedaAbonoForm, setMonedaAbonoForm] = useState('PEN');
  const [cuentaOrigenAbonoPrestamoId, setCuentaOrigenAbonoPrestamoId] = useState('');

  // Modal Presupuestos
  const [mostrarModalPresupuesto, setMostrarModalPresupuesto] = useState(false);
  const [categoriaPresupuesto, setCategoriaPresupuesto] = useState(CATEGORIAS_GASTOS[0]);
  const [limitePresupuestoForm, setLimitePresupuestoForm] = useState('');

  // Modal Recurrentes
  const [mostrarModalRecurrente, setMostrarModalRecurrente] = useState(false);
  const [tipoRecurrenteForm, setTipoRecurrenteForm] = useState('gasto');
  const [montoRecurrenteForm, setMontoRecurrenteForm] = useState('');
  const [monedaRecurrenteForm, setMonedaRecurrenteForm] = useState('PEN');
  const [descRecurrenteForm, setDescRecurrenteForm] = useState('');
  const [categoriaRecurrenteForm, setCategoriaRecurrenteForm] = useState(CATEGORIAS_GASTOS[0]);
  const [diaPagoRecurrenteForm, setDiaPagoRecurrenteForm] = useState('1');
  const [cuentaRecurrenteId, setCuentaRecurrenteId] = useState('');

  // Modales Metas e Info
  const [mostrarModalMeta, setMostrarModalMeta] = useState(false);
  const [nombreMetaForm, setNombreMetaForm] = useState('');
  const [objetivoMetaForm, setObjetivoMetaForm] = useState('');
  const [actualMetaForm, setActualMetaForm] = useState('');
  const [fechaLimiteMetaForm, setFechaLimiteMetaForm] = useState('');
  const [mostrarModalInfoData, setMostrarModalInfoData] = useState(false);
  const [transaccionEditandoId, setTransaccionEditandoId] = useState(null);
  const [mensajeRespaldo, setMensajeRespaldo] = useState(null);
  const [mostrarModalConfig, setMostrarModalConfig] = useState(false);

  // --- CÁLCULO DE SALDOS ACTUALES DE CUENTAS LÍQUIDAS ---
  const cuentasConSaldosActuales = useMemo(() => {
    return cuentasBancarias.map(cta => {
      let saldo = Number(cta.saldoInicial || 0);

      transacciones.forEach(t => {
        const montoEnMonedaCta = convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', cta.moneda || 'PEN');

        if (t.cuentaId === cta.id) {
          if (t.tipo === 'ingreso') {
            saldo += montoEnMonedaCta;
          } else if (t.tipo === 'gasto' || t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo' || t.tipo === 'transferencia_salida') {
            saldo -= montoEnMonedaCta;
          }
        } else if (t.cuentaDestinoId === cta.id && t.tipo === 'transferencia_salida') {
          saldo += montoEnMonedaCta;
        }
      });

      return {
        ...cta,
        saldoActual: saldo
      };
    });
  }, [cuentasBancarias, transacciones, tiposCambio, moneda]);

  // Saldo Líquido Total en la Moneda Principal Elegida
  const saldoLiquidoTotal = useMemo(() => {
    return cuentasConSaldosActuales.reduce((acc, cta) => {
      return acc + convertirMoneda(cta.saldoActual, cta.moneda || 'PEN', moneda);
    }, 0);
  }, [cuentasConSaldosActuales, moneda, tiposCambio]);

  // Nombres de métodos para los selectores
  const todosLosMetodosDisponibles = useMemo(() => {
    const nombresCuentas = cuentasBancarias.map(c => `Cuenta: ${c.nombre}`);
    const nombresTarjetas = tarjetas.map(t => `Tarjeta: ${t.nombre}`);
    return [...nombresCuentas, ...nombresTarjetas];
  }, [cuentasBancarias, tarjetas]);

  const transaccionesDelMes = useMemo(() => {
    return transacciones.filter(t => {
      if (!t.fecha) return false;
      const fecha = new Date(t.fecha + 'T00:00:00');
      return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
    });
  }, [transacciones, mesSeleccionado, anioSeleccionado]);

  const resumen = useMemo(() => {
    const ingresos = transaccionesDelMes
      .filter(t => t.tipo === 'ingreso')
      .reduce((acc, t) => acc + convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda), 0);

    const gastosLiquidos = transaccionesDelMes
      .filter(t => t.tipo === 'gasto' && !t.esCredito)
      .reduce((acc, t) => acc + convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda), 0);

    const gastosCredito = transaccionesDelMes
      .filter(t => t.tipo === 'gasto' && t.esCredito)
      .reduce((acc, t) => acc + convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda), 0);

    const pagosLiquidosEspeciales = transaccionesDelMes
      .filter(t => t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo')
      .reduce((acc, t) => acc + convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda), 0);

    const totalGastosDelMes = gastosLiquidos + gastosCredito + pagosLiquidosEspeciales;
    const flujoLiquidoBolsillo = ingresos - gastosLiquidos - pagosLiquidosEspeciales;

    return {
      ingresos,
      gastosLiquidos,
      gastosCredito,
      pagosLiquidosEspeciales,
      totalGastosDelMes,
      flujoLiquidoBolsillo
    };
  }, [transaccionesDelMes, moneda, tiposCambio]);

  const datosAnuales = useMemo(() => {
    const mapa = Array.from({ length: 12 }, (_, index) => ({
      mes: NOMBRES_MESES[index].substring(0, 3),
      Ingresos: 0,
      Gastos: 0
    }));

    transacciones.forEach(t => {
      if (!t.fecha) return;
      const fecha = new Date(t.fecha + 'T00:00:00');
      if (fecha.getFullYear() === anioSeleccionado) {
        const m = fecha.getMonth();
        const montoConv = convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda);
        if (t.tipo === 'ingreso') {
          mapa[m].Ingresos += montoConv;
        } else if (t.tipo === 'gasto' || t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo') {
          mapa[m].Gastos += montoConv;
        }
      }
    });

    return mapa;
  }, [transacciones, anioSeleccionado, moneda, tiposCambio]);

  const tendenciaPatrimonioHistorico = useMemo(() => {
    const historia = [];
    const anioActual = anioSeleccionado;

    let saldoLiquidoAcumulado = cuentasBancarias.reduce((acc, c) => acc + convertirMoneda(Number(c.saldoInicial || 0), c.moneda || 'PEN', moneda), 0);

    for (let m = 0; m < 12; m++) {
      const movsDelMes = transacciones.filter(t => {
        if (!t.fecha) return false;
        const f = new Date(t.fecha + 'T00:00:00');
        return f.getFullYear() === anioActual && f.getMonth() === m;
      });

      const ingresosMes = movsDelMes
        .filter(t => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda), 0);

      const gastosLiquidosMes = movsDelMes
        .filter(t => (t.tipo === 'gasto' && !t.esCredito) || t.tipo === 'pago_tarjeta' || t.tipo === 'pago_prestamo')
        .reduce((acc, t) => acc + convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda), 0);

      saldoLiquidoAcumulado += (ingresosMes - gastosLiquidosMes);

      const deudaTarjetas = tarjetas.reduce((acc, t) => acc + convertirMoneda(Number(t.deudaActual || 0), t.moneda || 'PEN', moneda), 0);
      const deudaPrestamos = prestamos
        .filter(p => p.tipo === 'tomado')
        .reduce((acc, p) => acc + convertirMoneda(Number(p.montoPendiente || 0), p.moneda || 'PEN', moneda), 0);

      const patrimonioNeto = saldoLiquidoAcumulado - deudaTarjetas - deudaPrestamos;

      historia.push({
        mes: NOMBRES_MESES[m].substring(0, 3),
        'Patrimonio Neto': Math.round(patrimonioNeto * 100) / 100,
        'Liquidez': Math.round(saldoLiquidoAcumulado * 100) / 100,
        'Deuda Total': Math.round((deudaTarjetas + deudaPrestamos) * 100) / 100
      });
    }

    return historia;
  }, [transacciones, cuentasBancarias, tarjetas, prestamos, anioSeleccionado, moneda, tiposCambio]);

  const gastosMesPorCategoria = useMemo(() => {
    const mapa = {};
    transaccionesDelMes
      .filter(t => t.tipo === 'gasto')
      .forEach(t => {
        const montoConv = convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda);
        mapa[t.categoria] = (mapa[t.categoria] || 0) + montoConv;
      });
    return mapa;
  }, [transaccionesDelMes, moneda, tiposCambio]);

  const formatoMoneda = (valor, monedaPersonalizada = moneda) => {
    return new Intl.NumberFormat(monedaPersonalizada === 'PEN' ? 'es-PE' : 'en-US', { 
      style: 'currency', 
      currency: monedaPersonalizada 
    }).format(valor || 0);
  };

  const proximosVencimientos = useMemo(() => {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const alertas = [];

    tarjetas.forEach(t => {
      if (t.diaVencimiento && Number(t.deudaActual) > 0) {
        const diaVenc = Number(t.diaVencimiento);
        let diasFaltantes = diaVenc - diaActual;
        if (diasFaltantes < 0) diasFaltantes += 30;

        if (diasFaltantes <= 7) {
          alertas.push({
            id: `tarjeta_${t.id}`,
            nombre: t.nombre,
            tipo: 'Tarjeta',
            montoTexto: formatoMoneda(t.deudaActual, t.moneda || 'PEN'),
            dias: diasFaltantes,
            diaPago: diaVenc
          });
        }
      }
    });

    prestamos.forEach(p => {
      if (p.diaVencimiento && p.tipo === 'tomado' && Number(p.montoPendiente) > 0) {
        const diaVenc = Number(p.diaVencimiento);
        let diasFaltantes = diaVenc - diaActual;
        if (diasFaltantes < 0) diasFaltantes += 30;

        if (diasFaltantes <= 7) {
          alertas.push({
            id: `prestamo_${p.id}`,
            nombre: p.nombre,
            tipo: 'Préstamo',
            montoTexto: formatoMoneda(p.montoPendiente, p.moneda || 'PEN'),
            dias: diasFaltantes,
            diaPago: diaVenc
          });
        }
      }
    });

    return alertas.sort((a, b) => a.dias - b.dias);
  }, [tarjetas, prestamos, moneda, tiposCambio]);

  const resumenTarjetas = useMemo(() => {
    const limiteTotal = tarjetas.reduce((acc, t) => acc + convertirMoneda(Number(t.limite || 0), t.moneda || 'PEN', moneda), 0);
    const deudaTotal = tarjetas.reduce((acc, t) => acc + convertirMoneda(Number(t.deudaActual || 0), t.moneda || 'PEN', moneda), 0);
    const disponibleTotal = Math.max(0, limiteTotal - deudaTotal);

    return { limiteTotal, deudaTotal, disponibleTotal };
  }, [tarjetas, moneda, tiposCambio]);

  const resumenPrestamos = useMemo(() => {
    const deudasPorPrestamos = prestamos
      .filter(p => p.tipo === 'tomado')
      .reduce((acc, p) => acc + convertirMoneda(Number(p.montoPendiente || 0), p.moneda || 'PEN', moneda), 0);

    const cobranzasPorPrestamos = prestamos
      .filter(p => p.tipo === 'otorgado')
      .reduce((acc, p) => acc + convertirMoneda(Number(p.montoPendiente || 0), p.moneda || 'PEN', moneda), 0);

    return { deudasPorPrestamos, cobranzasPorPrestamos };
  }, [prestamos, moneda, tiposCambio]);

  const datosGastosPorCategoria = useMemo(() => {
    const mapa = {};
    transaccionesDelMes
      .filter(t => t.tipo === 'gasto')
      .forEach(t => {
        const montoConvertido = convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda);
        mapa[t.categoria] = (mapa[t.categoria] || 0) + montoConvertido;
      });

    return Object.keys(mapa).map(cat => ({
      name: cat,
      value: mapa[cat]
    }));
  }, [transaccionesDelMes, moneda, tiposCambio]);

  const datosComparativos = useMemo(() => {
    return [
      { 
        nombre: `${NOMBRES_MESES[mesSeleccionado]}`, 
        Ingresos: resumen.ingresos, 
        'Gastos Líquidos': resumen.gastosLiquidos + resumen.pagosLiquidosEspeciales,
        'Gastos Crédito': resumen.gastosCredito
      }
    ];
  }, [resumen, mesSeleccionado]);

  const transaccionesFiltradas = useMemo(() => {
    return transaccionesDelMes.filter(t => {
      const desc = t.descripcion || '';
      const cat = t.categoria || '';
      const coincideBusqueda = desc.toLowerCase().includes(busqueda.toLowerCase()) ||
                                cat.toLowerCase().includes(busqueda.toLowerCase());
      const coincideTipo = filtroTipo === 'todos' || t.tipo === filtroTipo;
      const coincideCategoria = filtroCategoria === 'todas' || t.categoria === filtroCategoria;
      const coincideMetodo = filtroMetodo === 'todos' || t.metodo === filtroMetodo;

      return coincideBusqueda && coincideTipo && coincideCategoria && coincideMetodo;
    });
  }, [transaccionesDelMes, busqueda, filtroTipo, filtroCategoria, filtroMetodo]);

  // --- ACCIONES DE CUENTAS BANCARIAS ---
  const guardarCuenta = (e) => {
    e.preventDefault();
    if (!user || !nombreCuentaForm) return;

    if (cuentaEditandoId) {
      setCuentasBancarias(prev => prev.map(c => {
        if (c.id === cuentaEditandoId) {
          return {
            ...c,
            nombre: nombreCuentaForm,
            tipo: tipoCuentaForm,
            moneda: monedaCuentaForm,
            saldoInicial: parseFloat(saldoInicialCuentaForm) || 0,
            color: colorCuentaForm
          };
        }
        return c;
      }));
    } else {
      const nuevaCuenta = {
        id: `cta_${Date.now()}`,
        nombre: nombreCuentaForm,
        tipo: tipoCuentaForm,
        moneda: monedaCuentaForm,
        saldoInicial: parseFloat(saldoInicialCuentaForm) || 0,
        color: colorCuentaForm,
        createdAt: new Date().toISOString()
      };
      setCuentasBancarias(prev => [...prev, nuevaCuenta]);
    }

    setNombreCuentaForm('');
    setSaldoInicialCuentaForm('');
    setCuentaEditandoId(null);
    setMostrarModalCuenta(false);
  };

  const eliminarCuenta = (id) => {
    if (cuentasBancarias.length <= 1) {
      alert('Debes mantener al menos una cuenta o billetera.');
      return;
    }
    setCuentasBancarias(prev => prev.filter(c => c.id !== id));
  };

  const realizarTransferencia = (e) => {
    e.preventDefault();
    if (!cuentaOrigenId || !cuentaDestinoId || !montoTransferenciaForm || Number(montoTransferenciaForm) <= 0) return;
    if (cuentaOrigenId === cuentaDestinoId) return;

    const orig = cuentasBancarias.find(c => c.id === cuentaOrigenId);
    const dest = cuentasBancarias.find(c => c.id === cuentaDestinoId);
    if (!orig || !dest) return;

    const montoNum = parseFloat(montoTransferenciaForm);

    const nuevaTrans = {
      id: Date.now().toString(),
      tipo: 'transferencia_salida',
      monto: montoNum,
      moneda: orig.moneda || 'PEN',
      categoria: 'Transferencia',
      esCredito: false,
      cuentaId: orig.id,
      cuentaDestinoId: dest.id,
      metodo: `Cuenta: ${orig.nombre}`,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: `Transferencia de ${orig.nombre} a ${dest.nombre}`,
      createdAt: new Date().toISOString()
    };

    setTransacciones(prev => [nuevaTrans, ...prev]);
    setMontoTransferenciaForm('');
    setMostrarModalTransferencia(false);
  };

  const agregarTransaccion = (e) => {
    e.preventDefault();
    if (!user || !montoForm || Number(montoForm) <= 0) return;

    const montoNum = parseFloat(montoForm);
    let nombreMetodo = '';
    let cuentaAsignadaId = null;

    if (tipoForm === 'gasto' && esCreditoForm) {
      const tarjetaObj = tarjetas.find(t => t.id === tarjetaSeleccionadaId);
      nombreMetodo = tarjetaObj ? `Tarjeta: ${tarjetaObj.nombre}` : 'Tarjeta de Crédito';
    } else {
      const ctaObj = cuentasBancarias.find(c => c.id === cuentaSeleccionadaId);
      nombreMetodo = ctaObj ? `Cuenta: ${ctaObj.nombre}` : 'Cuenta Líquida';
      cuentaAsignadaId = cuentaSeleccionadaId || (cuentasBancarias[0] ? cuentasBancarias[0].id : null);
    }

    if (transaccionEditandoId) {
      const vieja = transacciones.find(t => t.id === transaccionEditandoId);
      if (vieja) {
        const esCreditoNueva = tipoForm === 'gasto' && esCreditoForm;
        const editada = {
          ...vieja,
          tipo: tipoForm,
          monto: montoNum,
          moneda: monedaTransForm,
          categoria: categoriaForm,
          esCredito: esCreditoNueva,
          tarjetaId: esCreditoNueva ? tarjetaSeleccionadaId : null,
          cuentaId: !esCreditoNueva ? cuentaAsignadaId : null,
          metodo: nombreMetodo,
          fecha: fechaForm,
          descripcion: descForm || (tipoForm === 'gasto' ? 'Gasto registrado' : 'Ingreso registrado'),
          editadoEn: new Date().toISOString()
        };
        setTransacciones(prev => prev.map(t => (t.id === vieja.id ? editada : t)));

        const afectabaTarjeta = vieja.tipo === 'gasto' && vieja.esCredito && vieja.tarjetaId;
        const afectaTarjeta = editada.tipo === 'gasto' && editada.esCredito && editada.tarjetaId;
        if (afectabaTarjeta || afectaTarjeta) {
          setTarjetas(prev => prev.map(tar => {
            let deuda = tar.deudaActual || 0;
            if (afectabaTarjeta && tar.id === vieja.tarjetaId) {
              deuda = Math.max(0, deuda - convertirMoneda(Number(vieja.monto), vieja.moneda || 'PEN', tar.moneda || 'PEN'));
            }
            if (afectaTarjeta && tar.id === editada.tarjetaId) {
              deuda += convertirMoneda(editada.monto, editada.moneda, tar.moneda || 'PEN');
            }
            return deuda === (tar.deudaActual || 0) ? tar : { ...tar, deudaActual: deuda };
          }));
        }
      }
      setTransaccionEditandoId(null);
      setMontoForm('');
      setDescForm('');
      setMostrarModalTransaccion(false);
      return;
    }

    const nuevaTrans = {
      id: Date.now().toString(),
      tipo: tipoForm,
      monto: montoNum,
      moneda: monedaTransForm,
      categoria: categoriaForm,
      esCredito: tipoForm === 'gasto' ? esCreditoForm : false,
      tarjetaId: (tipoForm === 'gasto' && esCreditoForm) ? tarjetaSeleccionadaId : null,
      cuentaId: (tipoForm === 'ingreso' || !esCreditoForm) ? cuentaAsignadaId : null,
      metodo: nombreMetodo,
      fecha: fechaForm,
      descripcion: descForm || (tipoForm === 'gasto' ? 'Gasto registrado' : 'Ingreso registrado'),
      createdAt: new Date().toISOString()
    };

    setTransacciones(prev => [nuevaTrans, ...prev]);

    if (tipoForm === 'gasto' && esCreditoForm && tarjetaSeleccionadaId) {
      setTarjetas(prev => prev.map(t => {
        if (t.id === tarjetaSeleccionadaId) {
          const montoEnMonedaTarjeta = convertirMoneda(montoNum, monedaTransForm, t.moneda || 'PEN');
          return { ...t, deudaActual: (t.deudaActual || 0) + montoEnMonedaTarjeta };
        }
        return t;
      }));
    }

    setMontoForm('');
    setDescForm('');
    setMostrarModalTransaccion(false);
  };

  const guardarTarjeta = (e) => {
    e.preventDefault();
    if (!user || !nombreTarjetaForm || !limiteTarjetaForm) return;

    if (tarjetaEditandoId) {
      setTarjetas(prev => prev.map(t => {
        if (t.id === tarjetaEditandoId) {
          return {
            ...t,
            nombre: nombreTarjetaForm,
            limite: parseFloat(limiteTarjetaForm),
            diaVencimiento: diaVencimientoTarjetaForm || null,
            moneda: monedaTarjetaForm,
            deudaActual: parseFloat(deudaInicialTarjetaForm) || 0
          };
        }
        return t;
      }));
    } else {
      const nuevaTarjeta = {
        id: Date.now().toString(),
        nombre: nombreTarjetaForm,
        limite: parseFloat(limiteTarjetaForm),
        diaVencimiento: diaVencimientoTarjetaForm || null,
        moneda: monedaTarjetaForm,
        deudaActual: parseFloat(deudaInicialTarjetaForm) || 0,
        createdAt: new Date().toISOString()
      };
      setTarjetas(prev => [...prev, nuevaTarjeta]);
      if (!tarjetaSeleccionadaId) setTarjetaSeleccionadaId(nuevaTarjeta.id);
    }

    setNombreTarjetaForm('');
    setLimiteTarjetaForm('');
    setDiaVencimientoTarjetaForm('');
    setDeudaInicialTarjetaForm('');
    setTarjetaEditandoId(null);
    setMostrarModalTarjeta(false);
  };

  const eliminarTarjeta = (id) => {
    setTarjetas(prev => prev.filter(t => t.id !== id));
  };

  const registrarPagoTarjeta = (e) => {
    e.preventDefault();
    if (!montoPagoTarjetaForm || !tarjetaAPagarId || !cuentaOrigenPagoTarjetaId || Number(montoPagoTarjetaForm) <= 0) return;

    const montoNum = parseFloat(montoPagoTarjetaForm);
    const tarObj = tarjetas.find(t => t.id === tarjetaAPagarId);
    const ctaObj = cuentasBancarias.find(c => c.id === cuentaOrigenPagoTarjetaId);
    if (!tarObj || !ctaObj) return;

    const nuevaTrans = {
      id: Date.now().toString(),
      tipo: 'pago_tarjeta',
      monto: montoNum,
      moneda: tarObj.moneda || 'PEN',
      categoria: 'Pago de Tarjeta',
      esCredito: false,
      cuentaId: ctaObj.id,
      metodo: `Cuenta: ${ctaObj.nombre}`,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: `Pago líquido a tarjeta ${tarObj.nombre} desde ${ctaObj.nombre}`,
      createdAt: new Date().toISOString()
    };

    setTransacciones(prev => [nuevaTrans, ...prev]);

    setTarjetas(prev => prev.map(t => {
      if (t.id === tarjetaAPagarId) {
        return { ...t, deudaActual: Math.max(0, (t.deudaActual || 0) - montoNum) };
      }
      return t;
    }));

    setMontoPagoTarjetaForm('');
    setMostrarModalPagoTarjeta(false);
  };

  const guardarPrestamo = (e) => {
    e.preventDefault();
    if (!user || !nombrePrestamoForm || !montoTotalPrestamoForm) return;

    const montoTotal = parseFloat(montoTotalPrestamoForm);
    const montoPendiente = montoPendientePrestamoForm ? parseFloat(montoPendientePrestamoForm) : montoTotal;

    const nuevoPrestamo = {
      id: Date.now().toString(),
      tipo: tipoPrestamoForm,
      nombre: nombrePrestamoForm,
      entidad: prestamistaForm || 'Sin especificar',
      montoTotal: montoTotal,
      montoPendiente: montoPendiente,
      diaVencimiento: diaVencimientoPrestamoForm || null,
      moneda: monedaPrestamoForm,
      createdAt: new Date().toISOString()
    };

    setPrestamos(prev => [...prev, nuevoPrestamo]);
    setNombrePrestamoForm('');
    setPrestamistaForm('');
    setMontoTotalPrestamoForm('');
    setMontoPendientePrestamoForm('');
    setDiaVencimientoPrestamoForm('');
    setMostrarModalPrestamo(false);
  };

  const guardarPresupuesto = (e) => {
    e.preventDefault();
    if (!categoriaPresupuesto || !limitePresupuestoForm) return;

    setPresupuestos(prev => ({
      ...prev,
      [categoriaPresupuesto]: parseFloat(limitePresupuestoForm)
    }));

    setLimitePresupuestoForm('');
    setMostrarModalPresupuesto(false);
  };

  const eliminarPresupuesto = (cat) => {
    setPresupuestos(prev => {
      const copy = { ...prev };
      delete copy[cat];
      return copy;
    });
  };

  const guardarRecurrente = (e) => {
    e.preventDefault();
    if (!montoRecurrenteForm || !descRecurrenteForm) return;

    const ctaObj = cuentasBancarias.find(c => c.id === cuentaRecurrenteId);

    const nuevo = {
      id: Date.now().toString(),
      tipo: tipoRecurrenteForm,
      monto: parseFloat(montoRecurrenteForm),
      moneda: monedaRecurrenteForm,
      categoria: categoriaRecurrenteForm,
      descripcion: descRecurrenteForm,
      diaPago: parseInt(diaPagoRecurrenteForm, 10) || 1,
      cuentaId: cuentaRecurrenteId || (cuentasBancarias[0] ? cuentasBancarias[0].id : null),
      metodo: ctaObj ? `Cuenta: ${ctaObj.nombre}` : 'Cuenta Líquida'
    };

    setRecurrentes(prev => [...prev, nuevo]);
    setMontoRecurrenteForm('');
    setDescRecurrenteForm('');
    setMostrarModalRecurrente(false);
  };

  const procesarRecurrente = (rec) => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const nuevaTrans = {
      id: Date.now().toString(),
      tipo: rec.tipo,
      monto: rec.monto,
      moneda: rec.moneda,
      categoria: rec.categoria,
      esCredito: false,
      cuentaId: rec.cuentaId,
      metodo: rec.metodo,
      fecha: hoyStr,
      descripcion: `[Recurrente] ${rec.descripcion}`,
      createdAt: new Date().toISOString()
    };

    setTransacciones(prev => [nuevaTrans, ...prev]);
  };

  const eliminarRecurrente = (id) => {
    setRecurrentes(prev => prev.filter(r => r.id !== id));
  };

  const registrarAbonoPrestamo = (e) => {
    e.preventDefault();
    if (!user || !montoAbonoPrestamo || !prestamoSeleccionadoId || !cuentaOrigenAbonoPrestamoId || Number(montoAbonoPrestamo) <= 0) return;

    const montoNum = parseFloat(montoAbonoPrestamo);
    const prestamoObj = prestamos.find(p => p.id === prestamoSeleccionadoId);
    const ctaObj = cuentasBancarias.find(c => c.id === cuentaOrigenAbonoPrestamoId);
    if (!prestamoObj || !ctaObj) return;

    const esPagoDeDeuda = prestamoObj.tipo === 'tomado';

    const nuevaTrans = {
      id: Date.now().toString(),
      tipo: esPagoDeDeuda ? 'pago_prestamo' : 'ingreso',
      monto: montoNum,
      moneda: monedaAbonoForm,
      categoria: 'Pago de Préstamo',
      esCredito: false,
      cuentaId: ctaObj.id,
      metodo: `Cuenta: ${ctaObj.nombre}`,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: esPagoDeDeuda 
        ? `Pago líquido cuota préstamo: ${prestamoObj.nombre} desde ${ctaObj.nombre}` 
        : `Cobro líquido de préstamo: ${prestamoObj.nombre} a ${ctaObj.nombre}`,
      createdAt: new Date().toISOString()
    };

    setTransacciones(prev => [nuevaTrans, ...prev]);

    setPrestamos(prev => prev.map(p => {
      if (p.id === prestamoSeleccionadoId) {
        const montoEnMonedaPrestamo = convertirMoneda(montoNum, monedaAbonoForm, p.moneda || 'PEN');
        return { ...p, montoPendiente: Math.max(0, (p.montoPendiente || 0) - montoEnMonedaPrestamo) };
      }
      return p;
    }));

    setMontoAbonoPrestamo('');
    setMostrarModalAbonoPrestamo(false);
  };

  const eliminarPrestamo = (id) => {
    setPrestamos(prev => prev.filter(p => p.id !== id));
  };

  const abrirNuevaTransaccion = () => {
    if (transaccionEditandoId) {
      setTransaccionEditandoId(null);
      setTipoForm('gasto');
      setCategoriaForm(CATEGORIAS_GASTOS[0]);
      setEsCreditoForm(false);
      setMonedaTransForm('PEN');
      setMontoForm('');
      setDescForm('');
      setFechaForm(new Date().toISOString().split('T')[0]);
    }
    if (cuentasBancarias.length > 0 && !cuentaSeleccionadaId) {
      setCuentaSeleccionadaId(cuentasBancarias[0].id);
    }
    setMostrarModalTransaccion(true);
  };

  const abrirEdicionTransaccion = (t) => {
    setTransaccionEditandoId(t.id);
    setTipoForm(t.tipo);
    setMontoForm(String(t.monto));
    setMonedaTransForm(t.moneda || 'PEN');
    setDescForm(t.descripcion || '');
    setCategoriaForm(t.categoria);
    setFechaForm(t.fecha);
    setEsCreditoForm(!!t.esCredito);
    if (t.esCredito && t.tarjetaId) setTarjetaSeleccionadaId(t.tarjetaId);
    if (!t.esCredito && t.cuentaId) setCuentaSeleccionadaId(t.cuentaId);
    setMostrarModalTransaccion(true);
  };

  const descargarArchivo = (contenido, nombre, tipoMime) => {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportarRespaldo = () => {
    const respaldo = {
      app: 'gestor-finanzas',
      version: 3,
      exportadoEn: new Date().toISOString(),
      moneda,
      tiposCambio,
      darkMode,
      transacciones,
      cuentasBancarias,
      tarjetas,
      prestamos,
      metas,
      presupuestos,
      recurrentes
    };
    const hoy = new Date().toISOString().split('T')[0];
    descargarArchivo(JSON.stringify(respaldo, null, 2), `finanzas-respaldo-${hoy}.json`, 'application/json');
    setMensajeRespaldo({ tipo: 'ok', texto: 'Copia de respaldo descargada.' });
  };

  const exportarCSV = () => {
    const esc = (v) => {
      let txt = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(txt)) txt = "'" + txt;
      return '"' + txt.replace(/"/g, '""') + '"';
    };
    const filas = [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Método / Cuenta', 'Moneda', 'Monto']];
    [...transacciones]
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
      .forEach(t => {
        filas.push([t.fecha, t.tipo, t.categoria, t.descripcion, t.metodo, t.moneda || 'PEN', Number(t.monto || 0).toFixed(2)]);
      });
    const csv = '\uFEFF' + filas.map(f => f.map(esc).join(',')).join('\r\n');
    const hoy = new Date().toISOString().split('T')[0];
    descargarArchivo(csv, `finanzas-movimientos-${hoy}.csv`, 'text/csv;charset=utf-8');
    setMensajeRespaldo({ tipo: 'ok', texto: `Se exportaron ${transacciones.length} movimientos.` });
  };

  const importarRespaldo = (e) => {
    const archivo = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => {
      try {
        const datos = JSON.parse(String(lector.result));
        if (!datos || datos.app !== 'gestor-finanzas' || !Array.isArray(datos.transacciones)) {
          throw new Error('formato');
        }
        const lista = (v) => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object' && x.id != null) : []);
        const nuevasTrans = lista(datos.transacciones);
        const confirmar = window.confirm(
          `Se reemplazarán tus datos actuales por la copia de respaldo (${nuevasTrans.length} transacciones). ¿Continuar?`
        );
        if (!confirmar) return;

        setTransacciones(nuevasTrans);
        if (Array.isArray(datos.cuentasBancarias)) setCuentasBancarias(lista(datos.cuentasBancarias));
        setTarjetas(lista(datos.tarjetas));
        setPrestamos(lista(datos.prestamos));
        setMetas(lista(datos.metas));
        if (datos.presupuestos && typeof datos.presupuestos === 'object') setPresupuestos(datos.presupuestos);
        if (Array.isArray(datos.recurrentes)) setRecurrentes(lista(datos.recurrentes));
        if (['PEN', 'USD', 'EUR'].includes(datos.moneda)) setMoneda(datos.moneda);
        if (datos.tiposCambio && Number(datos.tiposCambio.USD_PEN) > 0 && Number(datos.tiposCambio.EUR_PEN) > 0) {
          setTiposCambio({
            USD_PEN: Number(datos.tiposCambio.USD_PEN),
            EUR_PEN: Number(datos.tiposCambio.EUR_PEN)
          });
        }
        if (typeof datos.darkMode === 'boolean') setDarkMode(datos.darkMode);
        setMensajeRespaldo({ tipo: 'ok', texto: 'Copia restaurada correctamente.' });
      } catch (err) {
        setMensajeRespaldo({
          tipo: 'error',
          texto: 'No se pudo leer el archivo. Usa una copia descargada desde esta app (.json).'
        });
      }
    };
    lector.readAsText(archivo);
  };

  const eliminarTransaccion = (t) => {
    setTransacciones(prev => prev.filter(item => item.id !== t.id));

    if (t.tipo === 'gasto' && t.esCredito && t.tarjetaId) {
      setTarjetas(prev => prev.map(tar => {
        if (tar.id === t.tarjetaId) {
          const montoEnTarjeta = convertirMoneda(Number(t.monto), t.moneda || 'PEN', tar.moneda || 'PEN');
          return { ...tar, deudaActual: Math.max(0, (tar.deudaActual || 0) - montoEnTarjeta) };
        }
        return tar;
      }));
    }
  };

  const agregarMeta = (e) => {
    e.preventDefault();
    if (!user || !nombreMetaForm || !objetivoMetaForm) return;

    const nuevaMeta = {
      id: Date.now().toString(),
      nombre: nombreMetaForm,
      objetivo: parseFloat(objetivoMetaForm),
      actual: parseFloat(actualMetaForm) || 0,
      fechaLimite: fechaLimiteMetaForm || 'Sin fecha',
      createdAt: new Date().toISOString()
    };

    setMetas(prev => [...prev, nuevaMeta]);
    setNombreMetaForm('');
    setObjetivoMetaForm('');
    setActualMetaForm('');
    setFechaLimiteMetaForm('');
    setMostrarModalMeta(false);
  };

  const actualizarProgresoMeta = (id, actualActual, delta) => {
    setMetas(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, actual: Math.max(0, (m.actual || 0) + delta) };
      }
      return m;
    }));
  };

  const eliminarMeta = (id) => {
    setMetas(prev => prev.filter(m => m.id !== id));
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
                  placeholder="Ej: juanperez"
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

            <button
              type="submit"
              disabled={procesandoAuth}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {procesandoAuth ? 'Procesando...' : (modoAuth === 'login' ? 'Entrar a la App' : 'Registrar Cuenta')}
            </button>
          </form>

          <div className="text-center pt-2">
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
          </div>
        </div>
      </div>
    );
  }

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

        {/* BANNERS DE ALERTAS DE VENCIMIENTO */}
        {proximosVencimientos.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-slate-900 rounded-xl">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-500">
                  Próximos Vencimientos ({proximosVencimientos.length})
                </h4>
                <p className="text-xs text-slate-400">
                  Tienes compromisos de pago cercanos para evitar moras e intereses:
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {proximosVencimientos.map(v => (
                <div key={v.id} className="bg-slate-900 border border-amber-500/30 text-xs px-3 py-1.5 rounded-xl text-amber-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span><strong>{v.tipo} {v.nombre}:</strong> en {v.dias} días (Día {v.diaPago}) - {v.montoTexto}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HEADER PRINCIPAL */}
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Wallet className="w-8 h-8 text-indigo-600" />
              Gestor Multi-Moneda & Billeteras
            </h1>
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} text-sm mt-1`}>Control de cuentas bancarias independientes, billeteras digitales, tarjetas y préstamos.</p>
          </div>

          <div className={`flex items-center p-1.5 rounded-2xl border shadow-inner w-full md:w-auto justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
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
                setSaldoInicialCuentaForm('');
                setTipoCuentaForm('Bancaria');
                setMonedaCuentaForm('PEN');
                setColorCuentaForm('#6366F1');
                setMostrarModalCuenta(true);
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all text-sm"
            >
              <Building2 className="w-4 h-4" /> + Cuenta / Billetera
            </button>
          </div>
        </header>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <nav className={`flex p-1.5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/60 border-slate-200'}`}>
          <button
            onClick={() => setSeccionActiva('general')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'general' ? (darkMode ? 'bg-slate-800 text-indigo-400 shadow' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="w-4 h-4" />
            Vista General
          </button>
          <button
            onClick={() => setSeccionActiva('cuentas')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'cuentas' ? (darkMode ? 'bg-slate-800 text-blue-400 shadow' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Building2 className="w-4 h-4" />
            Mis Cuentas ({cuentasBancarias.length})
          </button>
          <button
            onClick={() => setSeccionActiva('tarjetas')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'tarjetas' ? (darkMode ? 'bg-slate-800 text-purple-400 shadow' : 'bg-white text-purple-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <CreditCard className="w-4 h-4" />
            Tarjetas ({tarjetas.length})
          </button>
          <button
            onClick={() => setSeccionActiva('prestamos')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${seccionActiva === 'prestamos' ? (darkMode ? 'bg-slate-800 text-amber-400 shadow' : 'bg-white text-amber-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
          >
            <HandCoins className="w-4 h-4" />
            Préstamos ({prestamos.length})
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
                    if (cuentasBancarias.length < 2) {
                      alert('Necesitas al menos 2 cuentas para realizar una transferencia.');
                      return;
                    }
                    setCuentaOrigenId(cuentasBancarias[0].id);
                    setCuentaDestinoId(cuentasBancarias[1].id);
                    setMostrarModalTransferencia(true);
                  }}
                  className="flex-1 sm:flex-initial bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-indigo-500/30 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Transferir entre cuentas
                </button>
                <button
                  onClick={() => {
                    setCuentaEditandoId(null);
                    setNombreCuentaForm('');
                    setSaldoInicialCuentaForm('');
                    setTipoCuentaForm('Bancaria');
                    setMonedaCuentaForm('PEN');
                    setColorCuentaForm('#6366F1');
                    setMostrarModalCuenta(true);
                  }}
                  className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> + Nueva Cuenta
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cuentasConSaldosActuales.map(cta => (
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
              ))}
            </div>
          </section>
        )}

        {/* VISTA DEDICADA TARJETAS */}
        {seccionActiva === 'tarjetas' && (
          <section className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  Gestión de Tarjetas de Crédito ({tarjetas.length})
                </h3>
                <p className="text-xs text-slate-400">Consulta el uso porcentual, estado de sobregiro y realiza pagos líquidos instantáneos.</p>
              </div>
              <div className="flex gap-2">
                {tarjetas.length > 0 && (
                  <button
                    onClick={() => {
                      if (cuentasBancarias.length > 0) setCuentaOrigenPagoTarjetaId(cuentasBancarias[0].id);
                      setMostrarModalPagoTarjeta(true);
                    }}
                    className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 border border-purple-500/30 transition-colors"
                  >
                    <ArrowRightLeft className="w-4 h-4" /> Pagar Tarjeta (Gasto Líquido)
                  </button>
                )}
                <button
                  onClick={() => {
                    setTarjetaEditandoId(null);
                    setNombreTarjetaForm('');
                    setLimiteTarjetaForm('');
                    setDiaVencimientoTarjetaForm('');
                    setDeudaInicialTarjetaForm('');
                    setMonedaTarjetaForm('PEN');
                    setMostrarModalTarjeta(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> + Nueva Tarjeta
                </button>
              </div>
            </div>

            {tarjetas.length === 0 ? (
              <div className={`p-8 text-center border-2 border-dashed rounded-xl text-slate-400 text-sm ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                No tienes tarjetas registradas. ¡Haz clic en <strong>+ Nueva Tarjeta</strong> para agregar una!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tarjetas.map(t => {
                  const limiteNum = Number(t.limite || 1);
                  const deudaNum = Number(t.deudaActual || 0);
                  const porcentajeUso = Math.round((deudaNum / limiteNum) * 100);
                  const disponible = Math.max(0, limiteNum - deudaNum);
                  
                  const sobregirada = porcentajeUso > 100;
                  const precaucion = porcentajeUso >= 50 && porcentajeUso <= 100;
                  const cuidado = porcentajeUso >= 25 && porcentajeUso < 50;
                  const excelente = porcentajeUso < 25;

                  return (
                    <div key={t.id} className={`p-5 rounded-2xl relative group shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        <button
                          onClick={() => eliminarTarjeta(t.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                          title="Eliminar tarjeta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold uppercase">
                          {t.moneda || 'PEN'}
                        </span>
                        {sobregirada ? (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Sobregiro (&gt;100%)
                          </span>
                        ) : precaucion ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            ⚠️ Precaución (50-100%)
                          </span>
                        ) : cuidado ? (
                          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            ⚡ Cuidado (25-50%)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Excelente (&lt;25%)
                          </span>
                        )}
                      </div>

                      <h4 className={`font-bold text-lg mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.nombre}</h4>
                      {t.diaVencimiento && (
                        <p className="text-xs text-slate-400 mb-3">Vence el día: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{t.diaVencimiento}</strong> de cada mes</p>
                      )}

                      <div className="space-y-1 text-xs mb-3">
                        <div className="flex justify-between text-slate-400">
                          <span>Deuda actual:</span>
                          <span className="font-bold text-rose-500 text-sm">{formatoMoneda(deudaNum, t.moneda || 'PEN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Límite asignado:</span>
                          <span>{formatoMoneda(limiteNum, t.moneda || 'PEN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Disponible:</span>
                          <span className="font-bold text-emerald-400">{formatoMoneda(disponible, t.moneda || 'PEN')}</span>
                        </div>
                      </div>

                      <div className={`w-full h-2.5 rounded-full overflow-hidden mb-1.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full transition-all ${sobregirada ? 'bg-rose-500' : precaucion ? 'bg-amber-500' : cuidado ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, porcentajeUso)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Utilización:</span>
                        <span className={sobregirada ? 'text-rose-400' : precaucion ? 'text-amber-400' : cuidado ? 'text-yellow-400' : 'text-emerald-400'}>
                          {porcentajeUso}% usado
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VISTA DEDICADA PRÉSTAMOS */}
        {seccionActiva === 'prestamos' && (
          <section className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <HandCoins className="w-5 h-5 text-amber-500" />
                  Gestión de Préstamos y Deudas ({prestamos.length})
                </h3>
                <p className="text-xs text-slate-400">Lleva el control de tus deudas pendientes y realiza abonos líquidos con un clic.</p>
              </div>
              <div className="flex gap-2">
                {prestamos.length > 0 && (
                  <button
                    onClick={() => {
                      if (cuentasBancarias.length > 0) setCuentaOrigenAbonoPrestamoId(cuentasBancarias[0].id);
                      setMostrarModalAbonoPrestamo(true);
                    }}
                    className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 border border-amber-500/30 transition-colors"
                  >
                    <ArrowRightLeft className="w-4 h-4" /> Registrar Abono / Cuota
                  </button>
                )}
                <button
                  onClick={() => setMostrarModalPrestamo(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> + Nuevo Préstamo
                </button>
              </div>
            </div>

            {prestamos.length === 0 ? (
              <div className={`p-8 text-center border-2 border-dashed rounded-xl text-slate-400 text-sm ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                No tienes préstamos registrados. ¡Haz clic en <strong>+ Nuevo Préstamo</strong> para agregar uno!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {prestamos.map(p => {
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
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${esTomado ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {esTomado ? 'Deuda' : 'Por Cobrar'}
                        </span>
                        <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono font-bold">
                          {p.moneda || 'PEN'}
                        </span>
                      </div>

                      <h4 className={`font-bold text-base ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{p.nombre}</h4>
                      <p className="text-xs text-slate-400 mb-2">Entidad: <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{p.entidad}</span></p>
                      {p.diaVencimiento && (
                        <p className="text-xs text-slate-400 mb-3">Vence el día: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{p.diaVencimiento}</strong></p>
                      )}

                      <div className="space-y-1 text-xs mb-3">
                        <div className="flex justify-between text-slate-400">
                          <span>Pendiente:</span>
                          <span className={`font-bold text-sm ${esTomado ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {formatoMoneda(p.montoPendiente, p.moneda || 'PEN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Original:</span>
                          <span>{formatoMoneda(p.montoTotal, p.moneda || 'PEN')}</span>
                        </div>
                      </div>

                      <div className={`w-full h-2 rounded-full overflow-hidden mb-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full transition-all ${esTomado ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${porcentajePago}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-right font-medium text-slate-400">
                        {porcentajePago}% Amortizado
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* PRESUPUESTOS POR CATEGORÍA */}
        <section className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                <Sliders className="w-5 h-5 text-indigo-500" />
                Presupuestos por Categoría ({NOMBRES_MESES[mesSeleccionado]})
              </h3>
              <p className="text-xs text-slate-400">Fija límites mensuales de gasto para controlar tu presupuesto en tiempo real.</p>
            </div>
            <button
              onClick={() => setMostrarModalPresupuesto(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Definir Presupuesto
            </button>
          </div>

          {Object.keys(presupuestos).length === 0 ? (
            <p className="text-slate-400 text-sm">No has configurado ningún presupuesto mensual aún.</p>
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
              <p className="text-xs text-slate-400">Registra gastos o ingresos fijos mensuales con un solo clic cada mes.</p>
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
              {recurrentes.map(rec => (
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Registrar ahora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* GRÁFICOS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              <PieChartIcon className="w-5 h-5 text-indigo-500" />
              Gastos por Categoría ({moneda}) - {NOMBRES_MESES[mesSeleccionado]}
            </h3>
            {datosGastosPorCategoria.length > 0 ? (
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosGastosPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {datosGastosPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatoMoneda(Number(value), moneda), 'Monto']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                No hay registro de gastos en {NOMBRES_MESES[mesSeleccionado]} {anioSeleccionado}.
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Comparativa General ({moneda})
            </h3>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosComparativos}>
                  <XAxis dataKey="nombre" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip formatter={(value) => [formatoMoneda(Number(value), moneda), '']} />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gastos Líquidos" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gastos Crédito" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* VISTA ANUAL COMPLETA Y TENDENCIA PATRIMONIAL */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Resumen Anual Mes a Mes ({anioSeleccionado})
                </h3>
                <p className="text-xs text-slate-400">Audita tus ingresos y gastos globales a lo largo de todo el año.</p>
              </div>
            </div>

            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosAnuales}>
                  <XAxis dataKey="mes" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip formatter={(value) => [formatoMoneda(Number(value), moneda), '']} />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Evolución Histórica del Patrimonio Neto ({anioSeleccionado})
                </h3>
                <p className="text-xs text-slate-400">Evolución del balance real: Fondos líquidos acumulados menos pasivos totales (tarjetas y préstamos).</p>
              </div>
            </div>

            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendenciaPatrimonioHistorico}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="mes" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip formatter={(value) => [formatoMoneda(Number(value), moneda), '']} />
                  <Legend />
                  <Line type="monotone" dataKey="Patrimonio Neto" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="Liquidez" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="Deuda Total" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* METAS DE AHORRO GLOBALES */}
        <section className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                <PiggyBank className="w-5 h-5 text-emerald-500" />
                Metas de Ahorro
              </h3>
              <p className="text-xs text-slate-400">Tus ahorros acumulados permanecen continuos sin importar el mes.</p>
            </div>
            <button 
              onClick={() => setMostrarModalMeta(true)}
              className="text-sm font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Agregar Meta
            </button>
          </div>

          {metas.length === 0 ? (
            <p className="text-slate-400 text-sm py-2">No tienes metas fijadas actualmente.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metas.map(meta => {
                const porcentaje = Math.min(100, Math.round(((meta.actual || 0) / (meta.objetivo || 1)) * 100));
                return (
                  <div key={meta.id} className={`p-4 rounded-xl border relative group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button 
                      onClick={() => eliminarMeta(meta.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h4 className={`font-semibold pr-6 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{meta.nombre}</h4>
                    <p className="text-xs text-slate-400 mb-2">Límite: {meta.fechaLimite}</p>
                    
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{formatoMoneda(meta.actual, moneda)}</span>
                      <span className="text-slate-400">{formatoMoneda(meta.objetivo, moneda)}</span>
                    </div>

                    <div className={`w-full h-2.5 rounded-full overflow-hidden mb-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div 
                        className={`h-full transition-all duration-300 ${porcentaje >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-indigo-400">{porcentaje}% alcanzado</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => actualizarProgresoMeta(meta.id, meta.actual || 0, 50)}
                          className={`px-2 py-1 border rounded font-medium shadow-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                        >
                          +50
                        </button>
                        <button 
                          onClick={() => actualizarProgresoMeta(meta.id, meta.actual || 0, 100)}
                          className={`px-2 py-1 border rounded font-medium shadow-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                        >
                          +100
                        </button>
                      </div>
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
                Historial y Totales por Categoría de {NOMBRES_MESES[mesSeleccionado]} {anioSeleccionado}
              </h3>
              <p className="text-xs text-slate-400">Listado de movimientos y resumen gastado por cada categoría hasta el momento.</p>
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
                  {CATEGORIAS_GASTOS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
                <optgroup label="Ingresos">
                  {CATEGORIAS_INGRESOS.map(cat => (
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
                      <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.descripcion}</td>
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

      {/* MODAL CREAR / EDITAR CUENTA BANCARIA */}
      {mostrarModalCuenta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Building2 className="w-5 h-5 text-blue-500" />
              {cuentaEditandoId ? 'Editar Cuenta / Billetera' : 'Nueva Cuenta o Billetera'}
            </h3>
            
            <form onSubmit={guardarCuenta} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Nombre de la Cuenta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BCP Débito, Yape, Plin, Efectivo..."
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
                    <option value="Bancaria">Bancaria / Débito</option>
                    <option value="Billetera Digital">Billetera Digital (Yape / Plin)</option>
                    <option value="Ahorros">Cuenta de Ahorros</option>
                    <option value="Efectivo">Efectivo Físico</option>
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

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Saldo Inicial de Apertura</label>
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
                  {cuentaEditandoId ? 'Guardar Cambios' : 'Crear Cuenta'}
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
              Transferir Entre Cuentas
            </h3>
            
            <form onSubmit={realizarTransferencia} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta Origen (Sale el dinero)</label>
                <select
                  value={cuentaOrigenId}
                  onChange={(e) => setCuentaOrigenId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {cuentasConSaldosActuales.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                      {c.nombre} (Saldo: {formatoMoneda(c.saldoActual, c.moneda)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta Destino (Recibe el dinero)</label>
                <select
                  value={cuentaDestinoId}
                  onChange={(e) => setCuentaDestinoId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {cuentasConSaldosActuales.map(c => (
                    <option key={c.id} value={c.id} disabled={c.id === cuentaOrigenId} className="bg-slate-800 text-white">
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
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 text-sm shadow-sm disabled:opacity-50"
                >
                  Transferir Ahora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN */}
      {mostrarModalConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-500" />
                Configuración
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
                    <h4 className="font-semibold text-sm">Moneda de Resumen</h4>
                    <p className="text-xs text-slate-400">Convierte todos los totales a esta divisa.</p>
                  </div>
                </div>

                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  <option value="PEN" className="bg-slate-800 text-white">PEN (S/)</option>
                  <option value="USD" className="bg-slate-800 text-white">USD ($)</option>
                  <option value="EUR" className="bg-slate-800 text-white">EUR (€)</option>
                </select>
              </div>

              <div className={`p-4 rounded-xl border space-y-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-semibold text-sm">Tipos de Cambio Personalizados</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">1 USD a PEN</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tiposCambio.USD_PEN}
                      onChange={(e) => setTiposCambio(prev => ({ ...prev, USD_PEN: parseFloat(e.target.value) || 3.75 }))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">1 EUR a PEN</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tiposCambio.EUR_PEN}
                      onChange={(e) => setTiposCambio(prev => ({ ...prev, EUR_PEN: parseFloat(e.target.value) || 4.10 }))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                    />
                  </div>
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

      {/* MODAL NUEVA TRANSACCIÓN */}
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
                  onClick={() => { if (tipoForm !== 'gasto') { setTipoForm('gasto'); setCategoriaForm(CATEGORIAS_GASTOS[0]); } }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoForm === 'gasto' ? (darkMode ? 'bg-slate-700 text-rose-400 shadow' : 'bg-white shadow text-rose-600') : 'text-slate-400'}`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => { if (tipoForm !== 'ingreso') { setTipoForm('ingreso'); setCategoriaForm(CATEGORIAS_INGRESOS[0]); } }}
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
                    {(tipoForm === 'gasto' ? CATEGORIAS_GASTOS : CATEGORIAS_INGRESOS).map(cat => (
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

      {/* MODAL CREAR TARJETA */}
      {mostrarModalTarjeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <CreditCard className="w-5 h-5 text-purple-600" />
              Nueva Tarjeta Multi-Moneda
            </h3>
            
            <form onSubmit={guardarTarjeta} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Nombre Personalizado</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BCP USD, Interbank Cashback..."
                  value={nombreTarjetaForm}
                  onChange={(e) => setNombreTarjetaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
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
                    <option value="PEN" className="bg-slate-800 text-white">PEN</option>
                    <option value="USD" className="bg-slate-800 text-white">USD</option>
                    <option value="EUR" className="bg-slate-800 text-white">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Día de Vencimiento de Pago (1 - 31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ej: 15"
                  value={diaVencimientoTarjetaForm}
                  onChange={(e) => setDiaVencimientoTarjetaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Deuda Consumida Actual</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={deudaInicialTarjetaForm}
                  onChange={(e) => setDeudaInicialTarjetaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

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
                  Crear Tarjeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAGO TARJETA */}
      {mostrarModalPagoTarjeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <CreditCard className="w-5 h-5 text-purple-600" />
              Pagar Tarjeta (Gasto Líquido)
            </h3>
            
            <form onSubmit={registrarPagoTarjeta} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Seleccionar Tarjeta a Pagar</label>
                <select
                  value={tarjetaAPagarId}
                  onChange={(e) => setTarjetaAPagarId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  <option value="">Selecciona una tarjeta...</option>
                  {tarjetas.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-800 text-white">
                      {t.nombre} (Deuda: {formatoMoneda(t.deudaActual, t.moneda || 'PEN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta Origen de Pago</label>
                <select
                  value={cuentaOrigenPagoTarjetaId}
                  onChange={(e) => setCuentaOrigenPagoTarjetaId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
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
                  disabled={!tarjetaAPagarId || !cuentaOrigenPagoTarjetaId}
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 text-sm shadow-sm disabled:opacity-50"
                >
                  Registrar Pago Líquido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR PRÉSTAMO */}
      {mostrarModalPrestamo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <HandCoins className="w-5 h-5 text-amber-600" />
              Nuevo Préstamo Multi-Moneda
            </h3>
            
            <form onSubmit={guardarPrestamo} className="space-y-4">
              <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setTipoPrestamoForm('tomado')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoPrestamoForm === 'tomado' ? (darkMode ? 'bg-slate-700 text-rose-400 shadow' : 'bg-white shadow text-rose-600') : 'text-slate-400'}`}
                >
                  Pedí prestado (Deuda)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPrestamoForm('otorgado')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoPrestamoForm === 'otorgado' ? (darkMode ? 'bg-slate-700 text-emerald-400 shadow' : 'bg-white shadow text-emerald-600') : 'text-slate-400'}`}
                >
                  Presté a alguien (Por cobrar)
                </button>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Nombre o Concepto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Préstamo USD Banco, etc..."
                  value={nombrePrestamoForm}
                  onChange={(e) => setNombrePrestamoForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Entidad / Persona</label>
                <input
                  type="text"
                  placeholder="Ej: BCP USD, Familiar..."
                  value={prestamistaForm}
                  onChange={(e) => setPrestamistaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monto Original</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1000.00"
                    value={montoTotalPrestamoForm}
                    onChange={(e) => setMontoTotalPrestamoForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Moneda</label>
                  <select
                    value={monedaPrestamoForm}
                    onChange={(e) => setMonedaPrestamoForm(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    <option value="PEN" className="bg-slate-800 text-white">PEN</option>
                    <option value="USD" className="bg-slate-800 text-white">USD</option>
                    <option value="EUR" className="bg-slate-800 text-white">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Día de Vencimiento de Cuota (1 - 31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ej: 28"
                  value={diaVencimientoPrestamoForm}
                  onChange={(e) => setDiaVencimientoPrestamoForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Saldo Pendiente (Opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Dejar vacío si es igual al original"
                  value={montoPendientePrestamoForm}
                  onChange={(e) => setMontoPendientePrestamoForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalPrestamo(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 text-sm shadow-sm"
                >
                  Guardar Préstamo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ABONO PRÉSTAMO */}
      {mostrarModalAbonoPrestamo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <ArrowRightLeft className="w-5 h-5 text-amber-600" />
              Abonar Cuota (Gasto Líquido)
            </h3>
            
            <form onSubmit={registrarAbonoPrestamo} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Seleccionar Préstamo</label>
                <select
                  value={prestamoSeleccionadoId}
                  onChange={(e) => setPrestamoSeleccionadoId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  <option value="">Selecciona un préstamo...</option>
                  {prestamos.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                      {p.nombre} ({p.moneda || 'PEN'} - Pend: {formatoMoneda(p.montoPendiente, p.moneda || 'PEN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta Origen de Pago</label>
                <select
                  value={cuentaOrigenAbonoPrestamoId}
                  onChange={(e) => setCuentaOrigenAbonoPrestamoId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {cuentasConSaldosActuales.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                      {c.nombre} (Saldo: {formatoMoneda(c.saldoActual, c.moneda)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monto del Abono</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={montoAbonoPrestamo}
                    onChange={(e) => setMontoAbonoPrestamo(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Moneda</label>
                  <select
                    value={monedaAbonoForm}
                    onChange={(e) => setMonedaAbonoForm(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    <option value="PEN" className="bg-slate-800 text-white">PEN</option>
                    <option value="USD" className="bg-slate-800 text-white">USD</option>
                    <option value="EUR" className="bg-slate-800 text-white">EUR</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalAbonoPrestamo(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!prestamoSeleccionadoId || !cuentaOrigenAbonoPrestamoId}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 text-sm shadow-sm disabled:opacity-50"
                >
                  Registrar Abono Líquido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEFINIR PRESUPUESTO */}
      {mostrarModalPresupuesto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Definir Presupuesto por Categoría</h3>
            
            <form onSubmit={guardarPresupuesto} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Categoría de Gasto</label>
                <select
                  value={categoriaPresupuesto}
                  onChange={(e) => setCategoriaPresupuesto(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {CATEGORIAS_GASTOS.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-800 text-white">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Límite Mensual ({moneda})</label>
                <input
                  type="number"
                  step="0.01"
                  required
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

      {/* MODAL RECURRENTE */}
      {mostrarModalRecurrente && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Nuevo Movimiento Recurrente</h3>
            
            <form onSubmit={guardarRecurrente} className="space-y-4">
              <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setTipoRecurrenteForm('gasto')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoRecurrenteForm === 'gasto' ? 'bg-rose-500 text-white shadow' : 'text-slate-400'}`}
                >
                  Gasto Fijo
                </button>
                <button
                  type="button"
                  onClick={() => setTipoRecurrenteForm('ingreso')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tipoRecurrenteForm === 'ingreso' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400'}`}
                >
                  Ingreso Fijo
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
                    value={montoRecurrenteForm}
                    onChange={(e) => setMontoRecurrenteForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Moneda</label>
                  <select
                    value={monedaRecurrenteForm}
                    onChange={(e) => setMonedaRecurrenteForm(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl outline-none text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Concepto / Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Alquiler de departamento, Netflix..."
                  value={descRecurrenteForm}
                  onChange={(e) => setDescRecurrenteForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Categoría</label>
                  <select
                    value={categoriaRecurrenteForm}
                    onChange={(e) => setCategoriaRecurrenteForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    {CATEGORIAS_GASTOS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Día del Mes</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={diaPagoRecurrenteForm}
                    onChange={(e) => setDiaPagoRecurrenteForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta Asignada</label>
                <select
                  value={cuentaRecurrenteId}
                  onChange={(e) => setCuentaRecurrenteId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {cuentasConSaldosActuales.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalRecurrente(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                >
                  Guardar Recurrencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL METAS */}
      {mostrarModalMeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Agregar Meta de Ahorro</h3>
            
            <form onSubmit={agregarMeta} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Nombre de la meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fondo de emergencia, Viaje..."
                  value={nombreMetaForm}
                  onChange={(e) => setNombreMetaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monto Objetivo ({moneda})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3000"
                    value={objetivoMetaForm}
                    onChange={(e) => setObjetivoMetaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Ahorro Inicial ({moneda})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={actualMetaForm}
                    onChange={(e) => setActualMetaForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Fecha Límite</label>
                <input
                  type="date"
                  value={fechaLimiteMetaForm}
                  onChange={(e) => setFechaLimiteMetaForm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalMeta(false)}
                  className={`flex-1 py-2.5 border rounded-xl font-semibold transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
                >
                  Crear Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INFORMACIÓN DE DATOS */}
      {mostrarModalInfoData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <Database className="w-6 h-6 text-indigo-600" />
                Almacenamiento y Seguridad
              </h3>
              <button
                onClick={() => setMostrarModalInfoData(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-400">
              <div className={`p-3 border rounded-xl flex items-start gap-3 ${darkMode ? 'bg-indigo-950/40 border-indigo-900/50 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-950'}`}>
                <Cloud className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Almacenamiento Local Seguro Multi-Moneda y Multi-Cuenta</h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    Tus cuentas de ahorro, billeteras, transacciones, presupuestos y pasivos se guardan de forma privada en tu equipo.
                  </p>
                </div>
              </div>

              <div className={`p-3 border rounded-xl text-xs font-mono space-y-1 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-slate-400 font-semibold uppercase">Credenciales del usuario</div>
                <div className={darkMode ? 'text-slate-200' : 'text-slate-700'}><strong>Nombre de usuario:</strong> {user.username}</div>
                <div className={`truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}><strong>ID Cuenta:</strong> {user.uid}</div>
              </div>

              <div className={`p-3 border rounded-xl space-y-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <h4 className={`font-bold text-sm ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Copia de respaldo</h4>
                  <p className="text-xs mt-0.5">
                    Descarga una copia de respaldo para no perder tus datos o exporta tus movimientos a Excel (CSV).
                  </p>
                </div>
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
                {mensajeRespaldo && (
                  <p role="status" className={`text-xs font-medium ${mensajeRespaldo.tipo === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {mensajeRespaldo.texto}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setMostrarModalInfoData(false)}
              className={`w-full py-2.5 font-semibold rounded-xl text-sm transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}