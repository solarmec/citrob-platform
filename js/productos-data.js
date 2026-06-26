const productos = [
    {
        nombre: "mBot2",
        categoria: "robots",
        descripcion: "Robot educativo programable ideal para colegios.",
        detalle: "Robot educativo avanzado para trabajar programación, sensores, movimiento y proyectos STEM en aula.",
        especificaciones: [
            "Programación por bloques y Python",
            "Ideal para enseñanza básica y media",
            "Compatible con actividades de robótica educativa",
            "Recomendado para clases, talleres y proyectos STEM"
        ],
        video: "https://www.youtube.com/watch?v=uxpoP175mOU",
        precio: 189900,
        stock: true,
        destacado: true,
        imagen: "imagenes/robots/mbot2.jpg"
    },
    {
        nombre: "mTiny",
        categoria: "robots",
        descripcion: "Robot educativo para primeras edades.",
        detalle: "Robot educativo para iniciar a niños y niñas en pensamiento computacional sin necesidad de pantallas.",
        especificaciones: [
            "Pensado para educación inicial y primer ciclo básico",
            "Actividades de lógica, secuencia y orientación espacial",
            "Uso intuitivo para docentes y estudiantes",
            "Ideal para comenzar en robótica educativa"
        ],
        video: "https://www.youtube.com/watch?v=QMYs1cfVTqI",
        precio: 269990,
        stock: true,
        destacado: true,
        imagen: "imagenes/robots/mtiny.jpg"
    },
    {
        nombre: "Kit Starter MakeX 2026",
        categoria: "makex",
        descripcion: "Kit oficial para categoría MakeX Starter con cámara IA.",
        detalle: "Kit oficial orientado a la categoría MakeX Starter 2026, pensado para equipos que comienzan en competencia.",
        especificaciones: [
            "Categoría MakeX Starter",
            "Incluye componentes para robot de competencia",
            "Compatible con desafíos educativos y torneos",
            "Recomendado para colegios y academias de robótica"
        ],
        video: "",
        precio: 639900,
        stock: true,
        destacado: true,
        imagen: "imagenes/kitmakex/kit_starter2026.png"
    },
    {
        nombre: "Kit Starter MakeX 2025",
        categoria: "makex",
        descripcion: "Kit oficial para categoría MakeX Starter.",
        detalle: "Kit oficial MakeX Starter 2025 para equipos que trabajan desafíos de iniciación competitiva.",
        especificaciones: [
            "Categoría MakeX Starter",
            "Formato recomendado para colegios",
            "Permite trabajar estrategia, programación y mecánica básica",
            "Producto orientado a competencias educativas"
        ],
        video: "",
        precio: 499990,
        stock: true,
        destacado: true,
        imagen: "imagenes/kitmakex/kit_starter2025.png"
    },
    {
        nombre: "Kit Explorer MakeX 2025",
        categoria: "makex",
        descripcion: "Kit oficial para categoría MakeX Explorer.",
        detalle: "Kit oficial para equipos que buscan avanzar a desafíos MakeX de mayor complejidad.",
        especificaciones: [
            "Categoría MakeX Explorer",
            "Diseñado para robots con mecanismos más avanzados",
            "Ideal para estudiantes con experiencia previa",
            "Compatible con trabajo en equipo y estrategia de competencia"
        ],
        video: "",
        precio: 699990,
        stock: true,
        destacado: false,
        imagen: "imagenes/kitmakex/kit_explorer2025.png"
    },
    {
        nombre: "Kit Explorer MakeX 2026",
        categoria: "makex",
        descripcion: "Kit oficial para categoría MakeX Explorer.",
        detalle: "Kit oficial MakeX Explorer 2026 para equipos que desarrollan robots de competencia con mayor nivel técnico.",
        especificaciones: [
            "Categoría MakeX Explorer",
            "Enfocado en construcción, programación y estrategia",
            "Recomendado para enseñanza media y talleres avanzados",
            "Producto oficial para preparación de torneos"
        ],
        video: "",
        precio: 924990,
        stock: true,
        destacado: false,
        imagen: "imagenes/kitmakex/kit_explorer2026.jpg"
    },
    {
        nombre: "Kit Upgrade Explorer MakeX 2026",
        categoria: "makex",
        descripcion: "Kit de actualización Explorer 2026.",
        detalle: "Kit de actualización para adaptar equipos y recursos Explorer a la temporada MakeX 2026.",
        especificaciones: [
            "Actualización para categoría Explorer",
            "Pensado para equipos que ya cuentan con base previa",
            "Permite ajustar el robot a nuevos desafíos",
            "Solución útil para colegios que ya compiten"
        ],
        video: "",
        precio: 399990,
        stock: true,
        destacado: false,
        imagen: "imagenes/kitmakex/kit_upgrade_explorer2026.jpg"
    },
    {
        nombre: "Kit Challenge MakeX 2025",
        categoria: "makex",
        descripcion: "Kit oficial para categoría MakeX Challenge.",
        detalle: "Kit oficial orientado a la categoría MakeX Challenge, para equipos de alto nivel competitivo.",
        especificaciones: [
            "Categoría MakeX Challenge",
            "Nivel avanzado de construcción y programación",
            "Recomendado para equipos con experiencia",
            "Orientado a competencias de mayor exigencia técnica"
        ],
        video: "",
        precio: 2290000,
        stock: true,
        destacado: false,
        imagen: "imagenes/kitmakex/kit_challenge2025.png"
    },
    {
        nombre: "Arena MakeX Starter 2026",
        categoria: "arenas",
        descripcion: "Arena oficial para categoría MakeX Starter.",
        detalle: "Arena oficial para entrenamiento y preparación de equipos en la categoría MakeX Starter 2026.",
        especificaciones: [
            "Categoría MakeX Starter",
            "Permite practicar misiones y estrategias de competencia",
            "Recomendada para colegios participantes",
            "Uso en clases, talleres y preparación de torneos"
        ],
        video: "",
        precio: 719990,
        stock: true,
        destacado: false,
        imagen: "imagenes/arenamakex/arena_starter2026.png"
    },
    {
        nombre: "Arena MakeX Explorer 2026",
        categoria: "arenas",
        descripcion: "Arena oficial para categoría MakeX Explorer.",
        detalle: "Arena oficial para preparar equipos de categoría MakeX Explorer 2026 en condiciones similares a competencia.",
        especificaciones: [
            "Categoría MakeX Explorer",
            "Diseñada para entrenamiento de misiones oficiales",
            "Ideal para colegios con equipos de competencia",
            "Facilita práctica, estrategia y mejora del robot"
        ],
        video: "",
        precio: 859990,
        stock: true,
        destacado: false,
        imagen: "imagenes/arenamakex/arena_explorer2026.png"
    },
    {
        nombre: "Arena Upgrade MakeX Explorer 2026",
        categoria: "arenas",
        descripcion: "Actualización Explorer 2026 para tu arena Explorer 2025.",
        detalle: "Actualización para adaptar una arena Explorer anterior a los desafíos de la temporada 2026.",
        especificaciones: [
            "Actualización para arena Explorer",
            "Pensada para instituciones que ya poseen arena previa",
            "Permite renovar el entrenamiento para temporada 2026",
            "Opción práctica para optimizar recursos existentes"
        ],
        video: "",
        precio: 579990,
        stock: true,
        destacado: false,
        imagen: "imagenes/arenamakex/arena_upgrade_explorer2026.png"
    },
    {
        nombre: "Arena Challenge MakeX 2026",
        categoria: "arenas",
        descripcion: "Arena de competición MakeX 2026.",
        detalle: "Arena para preparación de equipos en categoría MakeX Challenge, orientada a competencias avanzadas.",
        especificaciones: [
            "Categoría MakeX Challenge",
            "Entrenamiento de alto nivel competitivo",
            "Recomendada para equipos avanzados",
            "Permite desarrollar estrategia y pruebas de robot"
        ],
        video: "",
        precio: 1699990,
        stock: true,
        destacado: false,
        imagen: "imagenes/arenamakex/arena_challenge2026.png"
    },
    {
        nombre: "Servo MS1.5A",
        categoria: "motores",
        descripcion: "Servomotor con gran torque y engranajes de metal, ideal para competencias MakeX.",
        detalle: "Servomotor para mecanismos de robots educativos y de competencia que requieren precisión y resistencia.",
        especificaciones: [
            "Uso en mecanismos robóticos",
            "Adecuado para garras, brazos y actuadores",
            "Recomendado para proyectos MakeX",
            "Formato compacto para integración en robots"
        ],
        video: "",
        precio: 36990,
        stock: true,
        destacado: false,
        imagen: "imagenes/motores/servoms15.jpg"
    },
    {
        nombre: "Servomotor MEDS15",
        categoria: "motores",
        descripcion: "Servomotor con mayor torque y potencia, para competencias MakeX.",
        detalle: "Servomotor de mayor potencia para mecanismos que requieren más fuerza dentro de robots de competencia.",
        especificaciones: [
            "Uso en mecanismos de mayor exigencia",
            "Recomendado para robots MakeX",
            "Aplicable en brazos, elevadores y sistemas de agarre",
            "Pensado para equipos con diseños más robustos"
        ],
        video: "",
        precio: 89990,
        stock: true,
        destacado: false,
        imagen: "imagenes/motores/servomeds15.jpg"
    },
    {
        nombre: "Motor Encoder para mbot2",
        categoria: "motores",
        descripcion: "Motor encoder óptico 180 para mbot2.",
        detalle: "Motor encoder para control de movimiento en robots educativos, especialmente útil para precisión y desplazamiento.",
        especificaciones: [
            "Compatible con mBot2",
            "Útil para control de velocidad y movimiento",
            "Recomendado como repuesto o componente adicional",
            "Ideal para proyectos que requieren precisión"
        ],
        video: "",
        precio: 45990,
        stock: true,
        destacado: false,
        imagen: "imagenes/motores/motorencoder.png"
    },
    {
        nombre: "Smart World Add-On Pack para mbot2",
        categoria: "componentes",
        descripcion: "Kit complementario para mBot2 con servos, piezas y herramientas para armar garras.",
        detalle: "Pack complementario para ampliar las posibilidades de construcción y mecanismos del mBot2.",
        especificaciones: [
            "Compatible con mBot2",
            "Permite armar mecanismos y garras",
            "Incluye piezas para proyectos educativos",
            "Recomendado para ampliar actividades de aula"
        ],
        video: "https://www.youtube.com/watch?v=P3UrC2tlFOA",
        precio: 99900,
        stock: true,
        destacado: false,
        imagen: "imagenes/componentes/smart_world_addonpack.jpg"
    },
    {
        nombre: "Placa programable Halocode",
        categoria: "componentes",
        descripcion: "Placa programable para distintos proyectos de electrónica.",
        detalle: "Placa programable para aprender electrónica, programación y creación de proyectos interactivos.",
        especificaciones: [
            "Uso en proyectos de electrónica educativa",
            "Ideal para programación y prototipado",
            "Recomendada para talleres STEM",
            "Formato práctico para estudiantes y docentes"
        ],
        video: "",
        precio: 29990,
        stock: true,
        destacado: false,
        imagen: "imagenes/componentes/halocode.jpg"
    },
    {
        nombre: "Ruedas Mecanum 60mm",
        categoria: "componentes",
        descripcion: "Ruedas mecanum con rodillos en 45º para agilizar el movimiento de robots.",
        detalle: "Ruedas mecanum para crear robots con desplazamiento omnidireccional y mayor maniobrabilidad.",
        especificaciones: [
            "Diámetro 60 mm",
            "Rodillos en ángulo para movimiento lateral",
            "Útiles en robots de competencia y proyectos avanzados",
            "Con acople para motores encoder de mBot2"
        ],
        video: "",
        precio: 46990,
        stock: true,
        destacado: false,
        imagen: "imagenes/componentes/ruedasmecanum60.jpg"
    }
];
