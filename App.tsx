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
  Upload
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
  Legend 
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

const METODOS_PAGO_LIQUIDOS = [
  'Yape / Plin', 'BCP Débito', 'BBVA Débito', 'Interbank Débito', 'Scotiabank Débito', 'Efectivo'
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

// Lee y parsea JSON de localStorage sin romper la app si el dato es inválido o ajeno
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

  // Tipos de cambio personalizados por usuario
  const [tiposCambio, setTiposCambio] = useState(() => {
    if (!user) return { USD_PEN: 3.75, EUR_PEN: 4.10 };
    return loadUserData(user.username, 'tipos_cambio', { USD_PEN: 3.75, EUR_PEN: 4.10 });
  });

  // Formularios Auth
  const [modoAuth, setModoAuth] = useState('login'); // 'login' | 'register'
  const [usernameForm, setUsernameForm] = useState('');
  const [passwordForm, setPasswordForm] = useState('');
  const [errorAuth, setErrorAuth] = useState('');
  const [procesandoAuth, setProcesandoAuth] = useState(false);

  // --- NAVEGACIÓN Y FILTROS ---
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroMetodo, setFiltroMetodo] = useState('todos');

  // --- DATOS DEL USUARIO ---
  const [transacciones, setTransacciones] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [metas, setMetas] = useState([]);

  // Cargar datos al iniciar sesión
  useEffect(() => {
    if (!user) {
      setTransacciones([]);
      setTarjetas([]);
      setPrestamos([]);
      setMetas([]);
      setDarkMode(false);
      return;
    }

    const username = user.username;
    setTransacciones(loadUserData(username, 'transacciones', []));
    setTarjetas(loadUserData(username, 'tarjetas', []));
    setPrestamos(loadUserData(username, 'prestamos', []));
    setMetas(loadUserData(username, 'metas', []));
    setDarkMode(loadUserData(username, 'dark_mode', false));
    setMoneda(loadUserData(username, 'moneda', 'PEN'));
    setTiposCambio(loadUserData(username, 'tipos_cambio', { USD_PEN: 3.75, EUR_PEN: 4.10 }));
  }, [user]);

  // Guardar datos automáticamente
  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'transacciones', transacciones);
  }, [transacciones, user]);

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
    if (user?.username) saveUserData(user.username, 'dark_mode', darkMode);
  }, [darkMode, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'moneda', moneda);
  }, [moneda, user]);

  useEffect(() => {
    if (user?.username) saveUserData(user.username, 'tipos_cambio', tiposCambio);
  }, [tiposCambio, user]);

  // Sincroniza la clase "dark" de <html> con el modo noche de la app
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
  const [metodoLiquidoForm, setMetodoLiquidoForm] = useState(METODOS_PAGO_LIQUIDOS[0]);

  // Modales Tarjetas
  const [mostrarModalTarjeta, setMostrarModalTarjeta] = useState(false);
  const [nombreTarjetaForm, setNombreTarjetaForm] = useState('');
  const [limiteTarjetaForm, setLimiteTarjetaForm] = useState('');
  const [monedaTarjetaForm, setMonedaTarjetaForm] = useState('PEN');
  const [deudaInicialTarjetaForm, setDeudaInicialTarjetaForm] = useState('');
  const [tarjetaEditandoId, setTarjetaEditandoId] = useState(null);

  // Modales Préstamos
  const [mostrarModalPrestamo, setMostrarModalPrestamo] = useState(false);
  const [tipoPrestamoForm, setTipoPrestamoForm] = useState('tomado');
  const [nombrePrestamoForm, setNombrePrestamoForm] = useState('');
  const [prestamistaForm, setPrestamistaForm] = useState('');
  const [montoTotalPrestamoForm, setMontoTotalPrestamoForm] = useState('');
  const [montoPendientePrestamoForm, setMontoPendientePrestamoForm] = useState('');
  const [monedaPrestamoForm, setMonedaPrestamoForm] = useState('PEN');

  // Modales Abono Préstamo
  const [mostrarModalAbonoPrestamo, setMostrarModalAbonoPrestamo] = useState(false);
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState('');
  const [montoAbonoPrestamo, setMontoAbonoPrestamo] = useState('');
  const [monedaAbonoForm, setMonedaAbonoForm] = useState('PEN');
  const [metodoAbonoPrestamo, setMetodoAbonoPrestamo] = useState(METODOS_PAGO_LIQUIDOS[0]);

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
        setErrorAuth('No se pudo guardar la cuenta: tu navegador bloquea el almacenamiento local (¿modo privado o cookies bloqueadas?).');
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
    } catch (err) {
      // Sin almacenamiento: la sesión vale solo mientras la pestaña esté abierta
    }
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

    const pagosTarjetaLiquido = transaccionesDelMes
      .filter(t => t.tipo === 'pago_tarjeta')
      .reduce((acc, t) => acc + convertirMoneda(Number(t.monto || 0), t.moneda || 'PEN', moneda), 0);

    const totalGastosDelMes = gastosLiquidos + gastosCredito;
    const flujoLiquidoBolsillo = ingresos - gastosLiquidos - pagosTarjetaLiquido;

    return {
      ingresos,
      gastosLiquidos,
      gastosCredito,
      totalGastosDelMes,
      flujoLiquidoBolsillo,
      pagosTarjetaLiquido
    };
  }, [transaccionesDelMes, moneda, tiposCambio]);

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
        'Gastos Líquidos': resumen.gastosLiquidos,
        'Gastos Crédito': resumen.gastosCredito
      }
    ];
  }, [resumen, mesSeleccionado]);

  const todosLosMetodosDisponibles = useMemo(() => {
    const nombresTarjetas = tarjetas.map(t => `Tarjeta: ${t.nombre}`);
    return [...METODOS_PAGO_LIQUIDOS, ...nombresTarjetas];
  }, [tarjetas]);

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

  const agregarTransaccion = (e) => {
    e.preventDefault();
    if (!user || !montoForm || Number(montoForm) <= 0) return;

    const montoNum = parseFloat(montoForm);
    let nombreMetodo = metodoLiquidoForm;

    if (tipoForm === 'gasto' && esCreditoForm) {
      const tarjetaObj = tarjetas.find(t => t.id === tarjetaSeleccionadaId);
      nombreMetodo = tarjetaObj ? `Tarjeta: ${tarjetaObj.nombre}` : 'Tarjeta de Crédito';
    }

    // --- Modo edición: reemplaza la transacción y ajusta la deuda de la tarjeta ---
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
        moneda: monedaTarjetaForm,
        deudaActual: parseFloat(deudaInicialTarjetaForm) || 0,
        createdAt: new Date().toISOString()
      };
      setTarjetas(prev => [...prev, nuevaTarjeta]);
      if (!tarjetaSeleccionadaId) setTarjetaSeleccionadaId(nuevaTarjeta.id);
    }

    setNombreTarjetaForm('');
    setLimiteTarjetaForm('');
    setDeudaInicialTarjetaForm('');
    setTarjetaEditandoId(null);
    setMostrarModalTarjeta(false);
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
      moneda: monedaPrestamoForm,
      createdAt: new Date().toISOString()
    };

    setPrestamos(prev => [...prev, nuevoPrestamo]);
    setNombrePrestamoForm('');
    setPrestamistaForm('');
    setMontoTotalPrestamoForm('');
    setMontoPendientePrestamoForm('');
    setMostrarModalPrestamo(false);
  };

  const registrarAbonoPrestamo = (e) => {
    e.preventDefault();
    if (!user || !montoAbonoPrestamo || !prestamoSeleccionadoId || Number(montoAbonoPrestamo) <= 0) return;

    const montoNum = parseFloat(montoAbonoPrestamo);
    const prestamoObj = prestamos.find(p => p.id === prestamoSeleccionadoId);
    if (!prestamoObj) return;

    const esPagoDeDeuda = prestamoObj.tipo === 'tomado';

    const nuevaTrans = {
      id: Date.now().toString(),
      tipo: esPagoDeDeuda ? 'gasto' : 'ingreso',
      monto: montoNum,
      moneda: monedaAbonoForm,
      categoria: 'Pago de Préstamo',
      esCredito: false,
      metodo: metodoAbonoPrestamo,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: esPagoDeDeuda 
        ? `Pago a cuota préstamo: ${prestamoObj.nombre}` 
        : `Cobro de préstamo: ${prestamoObj.nombre}`,
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
      // Venimos de una edición cancelada: formulario limpio
      setTransaccionEditandoId(null);
      setTipoForm('gasto');
      setCategoriaForm(CATEGORIAS_GASTOS[0]);
      setEsCreditoForm(false);
      setMonedaTransForm('PEN');
      setMontoForm('');
      setDescForm('');
      setFechaForm(new Date().toISOString().split('T')[0]);
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
    if (!t.esCredito && METODOS_PAGO_LIQUIDOS.includes(t.metodo)) setMetodoLiquidoForm(t.metodo);
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
      version: 1,
      exportadoEn: new Date().toISOString(),
      moneda,
      tiposCambio,
      darkMode,
      transacciones,
      tarjetas,
      prestamos,
      metas
    };
    const hoy = new Date().toISOString().split('T')[0];
    descargarArchivo(JSON.stringify(respaldo, null, 2), `finanzas-respaldo-${hoy}.json`, 'application/json');
    setMensajeRespaldo({ tipo: 'ok', texto: 'Copia de respaldo descargada.' });
  };

  const exportarCSV = () => {
    // Comillas dobles escapadas; se neutralizan celdas que empiecen como fórmula de Excel
    const esc = (v) => {
      let txt = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(txt)) txt = "'" + txt;
      return '"' + txt.replace(/"/g, '""') + '"';
    };
    const filas = [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Método', 'Moneda', 'Monto']];
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
        setTarjetas(lista(datos.tarjetas));
        setPrestamos(lista(datos.prestamos));
        setMetas(lista(datos.metas));
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

  const formatoMoneda = (valor, monedaPersonalizada = moneda) => {
    return new Intl.NumberFormat(monedaPersonalizada === 'PEN' ? 'es-PE' : 'en-US', { 
      style: 'currency', 
      currency: monedaPersonalizada 
    }).format(valor || 0);
  };

  // PANTALLA DE AUTENTICACIÓN
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
                Multi-moneda (S/, $, €) activada
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

        {/* HEADER PRINCIPAL */}
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Wallet className="w-8 h-8 text-indigo-600" />
              Gestor Multi-Moneda de Finanzas
            </h1>
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} text-sm mt-1`}>Registra ingresos, gastos, tarjetas y préstamos en Soles, Dólares o Euros.</p>
          </div>

          {/* SELECTOR DE MES */}
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
                setTarjetaEditandoId(null);
                setNombreTarjetaForm('');
                setLimiteTarjetaForm('');
                setDeudaInicialTarjetaForm('');
                setMonedaTarjetaForm('PEN');
                setMostrarModalTarjeta(true);
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all text-sm"
            >
              <CreditCard className="w-4 h-4" /> + Tarjeta
            </button>
            <button
              onClick={() => setMostrarModalPrestamo(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all text-sm"
            >
              <HandCoins className="w-4 h-4" /> + Préstamo
            </button>
          </div>
        </header>

        {/* RESUMEN FINANCIERO */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                Líquido: {formatoMoneda(resumen.gastosLiquidos)} | Tarjeta: {formatoMoneda(resumen.gastosCredito)}
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

          <div className={`p-5 rounded-2xl shadow-sm border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-amber-500/20' : 'bg-slate-900'} text-white`}>
            <div>
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Deudas por Préstamos</p>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">{formatoMoneda(resumenPrestamos.deudasPorPrestamos)}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Por cobrar: {formatoMoneda(resumenPrestamos.cobranzasPorPrestamos)}</p>
            </div>
            <div className="w-10 h-10 bg-amber-500/20 text-amber-300 rounded-xl flex items-center justify-center">
              <HandCoins className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* PRÉSTAMOS PERSONALES */}
        <section className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                <HandCoins className="w-5 h-5 text-amber-500" />
                Mis Préstamos y Deudas ({prestamos.length})
              </h3>
              <p className="text-xs text-slate-400">Registra deudas con diferentes monedas y realiza abonos.</p>
            </div>
            <div className="flex gap-2">
              {prestamos.length > 0 && (
                <button
                  onClick={() => setMostrarModalAbonoPrestamo(true)}
                  className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 border border-amber-500/30 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Registrar Abono / Pago
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
            <div className={`p-6 text-center border-2 border-dashed rounded-xl text-slate-400 text-sm ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              No tienes préstamos ni deudas registradas. ¡Haz clic en <strong>+ Nuevo Préstamo</strong> para registrar uno!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prestamos.map(p => {
                const porcentajePago = Math.min(100, Math.round((((p.montoTotal || 0) - (p.montoPendiente || 0)) / (p.montoTotal || 1)) * 100));
                const esTomado = p.tipo === 'tomado';

                return (
                  <div key={p.id} className={`p-4 rounded-2xl relative group shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                      onClick={() => eliminarPrestamo(p.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar préstamo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${esTomado ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {esTomado ? 'Deuda' : 'Por Cobrar'}
                      </span>
                      <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono font-bold">
                        {p.moneda || 'PEN'}
                      </span>
                    </div>

                    <h4 className={`font-bold text-base ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{p.nombre}</h4>
                    <p className="text-xs text-slate-400 mb-3">Entidad: <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{p.entidad}</span></p>

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
                    <Tooltip formatter={(val) => formatoMoneda(val, moneda)} />
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
                  <Tooltip formatter={(val) => formatoMoneda(val, moneda)} />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gastos Líquidos" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gastos Crédito" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
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
                <option value="todos">Todos los métodos</option>
                {todosLosMetodosDisponibles.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TOTAL FILTRADO POR CATEGORÍA SELECCIONADA */}
          {filtroCategoria !== 'todas' && (
            <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${darkMode ? 'bg-indigo-950/30 border-indigo-900/50 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
              <div className="font-medium">
                Total en categoría <span className="font-bold underline">{filtroCategoria}</span> ({NOMBRES_MESES[mesSeleccionado]} {anioSeleccionado}):
              </div>
              <div className="font-black text-lg">
                {formatoMoneda(
                  transaccionesFiltradas.reduce((acc, t) => acc + convertirMoneda(t.monto, t.moneda || 'PEN', moneda), 0),
                  moneda
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wider ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Concepto</th>
                  <th className="py-3 px-4 font-semibold">Categoría</th>
                  <th className="py-3 px-4 font-semibold">Método</th>
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
                      <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${t.tipo === 'ingreso' ? 'text-emerald-500' : t.tipo === 'gasto' ? 'text-rose-500' : 'text-purple-500'}`}>
                        {t.tipo === 'ingreso' ? '+' : '-'} {formatoMoneda(t.monto, t.moneda || 'PEN')}
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

      {/* MODAL CONFIGURACIÓN Y MODO NOCHE */}
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
                      <span>Dinero Líquido / Débito</span>
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
                  {tipoForm === 'gasto' && esCreditoForm ? 'Seleccionar Tarjeta' : 'Método de Pago'}
                </label>
                {tipoForm === 'gasto' && esCreditoForm ? (
                  tarjetas.length === 0 ? (
                    <div className="text-xs text-rose-500 font-medium p-2 bg-rose-50 rounded-xl border border-rose-200">
                      No tienes tarjetas registradas. Crea una primero con el botón "+ Tarjeta".
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
                    value={metodoLiquidoForm}
                    onChange={(e) => setMetodoLiquidoForm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    {METODOS_PAGO_LIQUIDOS.map(m => (
                      <option key={m} value={m} className="bg-slate-800 text-white">{m}</option>
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
              Abonar / Cobrar Cuota
            </h3>
            
            <form onSubmit={registrarAbonoPrestamo} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Seleccionar Préstamo</label>
                <select
                  value={prestamoSeleccionadoId}
                  onChange={(e) => setPrestamoSeleccionadoId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {prestamos.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                      {p.nombre} ({p.moneda || 'PEN'} - {formatoMoneda(p.montoPendiente, p.moneda || 'PEN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monto de la Cuota</label>
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

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cuenta de Origen / Destino</label>
                <select
                  value={metodoAbonoPrestamo}
                  onChange={(e) => setMetodoAbonoPrestamo(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {METODOS_PAGO_LIQUIDOS.map(m => (
                    <option key={m} value={m} className="bg-slate-800 text-white">{m}</option>
                  ))}
                </select>
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
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 text-sm shadow-sm"
                >
                  Registrar Cuota
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
                  <h4 className="font-bold">Almacenamiento Local Seguro Multi-Moneda</h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    Tus transacciones en Soles (PEN), Dólares (USD) y Euros (EUR) se guardan asociadas a tu cuenta y se unifican automáticamente en tiempo real usando tus tasas de cambio configuradas.
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
                    Tus datos viven solo en este navegador. Descarga una copia para no perderlos si borras los datos del navegador o cambias de equipo.
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