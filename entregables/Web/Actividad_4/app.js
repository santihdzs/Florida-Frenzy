const express = require('express');
const cors = require('cors');
// const bodyParser = require('body-parser'); // No es necesario si ya usamos express.json() y express.urlencoded()
const mysql = require('mysql2/promise'); // Usar la versión con promesas para async/await
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Middleware para parsear JSON y URL-encoded

app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos desde la carpeta 'public'

const pool = mysql.createPool({ // Configuración de la conexión a MySQL usando variables de entorno
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // No hardcodear contraseñas en producción
    database: process.env.DB_NAME || 'catcafe_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/api/menu/:dayName', async (req, res) => {
    try {
        const { dayName } = req.params;

        const [rows] = await pool.query(`
            SELECT d.day_name, m.item_id, m.item_name, m.item_description, m.image_url, m.category, dm.display_order
            FROM day_menu dm
            INNER JOIN days d ON dm.day_id = d.day_id
            INNER JOIN menu_items m ON dm.item_id = m.item_id
            WHERE d.day_name = ? 
            ORDER BY dm.display_order ASC
            `, [dayName]); // Consulta SQL para obtener el menú del día específico (el '?' se reemplaza por el valor de dayName de forma segura)

        res.json(rows); // Enviar los resultados como JSON al cliente
    } 
    
    catch (error) {
        console.error("Error al obtener el menú del día:", error);
        res.status(500).json({ error: "Error al obtener el menú del día" }); // Enviar un error 500 si ocurre un problema
    }

});

app.get('/api/cats', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT cat_id, cat_name, age_label, personality, story, image_url, instagram_post_url, adoption_status
            FROM cats
            ORDER BY cat_name ASC
            `); // Consulta SQL para obtener la lista de gatos ordenada por nombre

        res.json(rows); // Enviar los resultados como JSON al cliente
    }

    catch (error) {
        console.error("Error al obtener la lista de gatos:", error);
        res.status(500).json({ error: "Error al obtener la lista de gatos" }); // Enviar un error 500 si ocurre un problema
    }
});

app.get('/api/days', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT day_id, day_name
            FROM days
            ORDER BY day_id ASC
            `); // Consulta SQL para obtener la lista de días ordenada por ID
        
        res.json(rows); // Enviar los resultados como JSON al cliente
    }

    catch (error) {
        console.error("Error al obtener la lista de días:", error);
        res.status(500).json({ error: "Error al obtener la lista de días" }); // Enviar un error 500 si ocurre un problema
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});