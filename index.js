import express from 'express';
import { PrismaClient } from '@prisma/client';
import https from 'https';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import warehouseRoutes from './routes/warehouseRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import { configureSSL } from './config/ssl.js';
import activityLogRoutes from './routes/actLog.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const httpPort = process.env.HTTP_PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Replace the existing test route with this HTML version that includes auto-redirect
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BE-DX API - Chuyển hướng</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
                text-align: center;
            }
            .container {
                background-color: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 500px;
                width: 90%;
            }
            h1 {
                color: #333;
                margin-bottom: 1rem;
            }
            p {
                color: #666;
                margin-bottom: 2rem;
            }
            .redirect-button {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            .redirect-button:hover {
                background-color: #45a049;
            }
            .countdown {
                margin-top: 1rem;
                font-size: 14px;
                color: #757575;
            }
            .api-status {
                margin-top: 1.5rem;
                padding: 0.5rem;
                background-color: #e8f5e9;
                border-radius: 4px;
                font-size: 14px;
                color: #2e7d32;
            }
        </style>
        <script>
            let seconds = 5;
            
            function updateCountdown() {
                document.getElementById('countdown').innerText = seconds;
                if (seconds <= 0) {
                    window.location.href = 'https://dx.hoangphucthanh.vn/';
                } else {
                    seconds--;
                    setTimeout(updateCountdown, 1000);
                }
            }
            
            window.onload = function() {
                updateCountdown();
            };
        </script>
    </head>
    <body>
        <div class="container">
            <h1>BE-DX API Service</h1>
            <p>Chào mừng đến với dịch vụ API của Hoàng Phúc Thanh.</p>
            <button class="redirect-button" onclick="window.location.href='https://dx.hoangphucthanh.vn/'">
                Truy cập Trang DX ngay
            </button>
            <div class="countdown">
                Tự động chuyển hướng sau <span id="countdown">5</span> giây...
            </div>
            <div class="api-status">
                ✅ API đang hoạt động!
            </div>
        </div>
    </body>
    </html>
    `;
    
    res.send(html);
});

// Routes
app.use('/warehouse', warehouseRoutes);
app.use('/crm', crmRoutes);
app.use('/admin', activityLogRoutes); // Add this line for admin routes

// SSL Configuration
const { options, useHttps } = configureSSL();

// Start server
if (useHttps) {
    https.createServer(options, app).listen(port, "0.0.0.0", () => {
        console.log(`🔒 Server HTTPS chạy tại: https://192.168.0.252:${port}`);
    });

    try {
        http.createServer((req, res) => {
            res.writeHead(301, { "Location": `https://${req.headers.host}${req.url}` });
            res.end();
        }).listen(httpPort, () => {
            console.log(`🌍 HTTP Server chạy trên cổng ${httpPort} và tự động chuyển sang HTTPS`);
        });
    } catch (error) {
        console.error("❌ Không thể khởi động HTTP server:", error.message);
    }
} else {
    app.listen(port, () => {
        console.log(`Server đang chạy tại http://localhost:${port}`);
    });
}