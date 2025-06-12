import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const configureSSL = () => {
    let options = {};
    let useHttps = false;

    try {
        const keyPath = path.resolve("./private.key");
        const certPath = path.resolve("./certificate.crt");
        
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
            options = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath),
            };
            useHttps = true;
            console.log("✅ SSL Certificates Loaded");
        } else {
            console.warn("⚠️ SSL Certificates Not Found! Running in HTTP mode.");
        }
    } catch (error) {
        console.error("❌ Error loading SSL certificates:", error.message);
    }

    return { options, useHttps };
}; 