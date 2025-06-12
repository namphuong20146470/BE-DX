import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { logUserActivity } from '../loggerController/loggerController.controller.js';

const prisma = new PrismaClient();

// Improved hash function with debug logging
function hashPassword(password) {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    console.log(`Debug - Password hash generated: ${hash.substring(0, 10)}...`);
    return hash;
}

// User login with enhanced debugging
export const login = async (req, res) => {
    try {
        const { ten_dang_nhap, mat_khau } = req.body;
        console.log(`Login attempt for user: ${ten_dang_nhap}`);
        
        // Get IP and user-agent
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        // Validate required fields
        if (!ten_dang_nhap || !mat_khau) {
            // Log failed login attempt (missing credentials)
            await logUserActivity(
                'unknown', 
                'failed_login', 
                ipAddress, 
                userAgent, 
                'Missing username or password'
            );
            
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập tên đăng nhập và mật khẩu"
            });
        }
        
        // Find user by username - use case-insensitive search
        const user = await prisma.accounts.findFirst({
            where: {
                ten_dang_nhap: {
                    equals: ten_dang_nhap,
                    mode: 'insensitive' // Make search case-insensitive
                }
            },
            select: {
                ma_nguoi_dung: true,
                ten_dang_nhap: true,
                ho_va_ten: true,
                email: true,
                vai_tro: true,
                mat_khau: true
            }
        });
        
        if (!user) {
            console.log(`User not found: ${ten_dang_nhap}`);
            // Log failed login attempt (user not found)
            await logUserActivity(
                'unknown', 
                'failed_login', 
                ipAddress, 
                userAgent, 
                `Username not found: ${ten_dang_nhap}`
            );
            
            return res.status(401).json({
                success: false,
                message: "Tên đăng nhập hoặc mật khẩu không chính xác"
            });
        }
        
        // Check if password is already hashed or needs hashing
        const hashedPassword = hashPassword(mat_khau);
        console.log(`Debug - Comparing passwords:`);
        console.log(`Provided (hashed): ${hashedPassword.substring(0, 10)}...`);
        console.log(`Stored: ${user.mat_khau.substring(0, 10)}...`);
        
        // Try direct comparison first
        if (user.mat_khau !== hashedPassword) {
            // If direct comparison fails, try comparing with the plain password
            // This handles cases where the password might not be hashed in the database
            if (user.mat_khau !== mat_khau) {
                console.log(`Password mismatch for user: ${ten_dang_nhap}`);
                // Log failed login attempt (wrong password)
                await logUserActivity(
                    user.ma_nguoi_dung, 
                    'failed_login', 
                    ipAddress, 
                    userAgent, 
                    'Invalid password'
                );
                
                return res.status(401).json({
                    success: false,
                    message: "Tên đăng nhập hoặc mật khẩu không chính xác"
                });
            }
        }
        
        console.log(`Successful login for: ${ten_dang_nhap}`);
        // Log successful login
        await logUserActivity(
            user.ma_nguoi_dung, 
            'login', 
            ipAddress, 
            userAgent
        );
        
        // Success - Return user info (without password)
        const { mat_khau: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            message: "Đăng nhập thành công",
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi đăng nhập",
            error: error.message
        });
    }
};