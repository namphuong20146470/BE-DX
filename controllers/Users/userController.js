import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                Stt: true,
                MaNguoiDung: true,
                TenDangNhap: true,
                TenDayDu: true,
                Email: true,
                SoDienThoai: true,
                VaiTro: true,
                NguoiTao: true,
                NgayTao: true
                // Excluding MatKhau for security
            },
            orderBy: {
                Stt: 'asc'
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách người dùng thành công",
            data: users
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách người dùng",
            error: error.message
        });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { Stt: parseInt(id) },
            select: {
                Stt: true,
                MaNguoiDung: true,
                TenDangNhap: true,
                TenDayDu: true,
                Email: true,
                SoDienThoai: true,
                VaiTro: true,
                NguoiTao: true,
                NgayTao: true
                // Excluding MatKhau for security
            }
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin người dùng thành công",
            data: user
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin người dùng",
            error: error.message
        });
    }
};

// Create new user
export const createUser = async (req, res) => {
    try {
        const { MaNguoiDung, TenDangNhap, MatKhau, TenDayDu, Email, SoDienThoai, VaiTro, NguoiTao } = req.body;
        
        // Validate required fields
        if (!MaNguoiDung || !TenDangNhap || !MatKhau || !TenDayDu || !Email || !SoDienThoai || !VaiTro) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin bắt buộc"
            });
        }
        
        // Check if username already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { MaNguoiDung },
                    { TenDangNhap }
                ]
            }
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Mã người dùng hoặc tên đăng nhập đã tồn tại"
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(MatKhau, 10);
        
        // Create user
        const user = await prisma.user.create({
            data: {
                MaNguoiDung,
                TenDangNhap,
                MatKhau: hashedPassword,
                TenDayDu,
                Email,
                SoDienThoai,
                VaiTro,
                NguoiTao
            }
        });
        
        // Return user without password
        const { MatKhau: _, ...userWithoutPassword } = user;
        
        res.status(201).json({
            success: true,
            message: "Tạo người dùng thành công",
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo người dùng",
            error: error.message
        });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { MaNguoiDung, TenDangNhap, MatKhau, TenDayDu, Email, SoDienThoai, VaiTro, NguoiTao } = req.body;
        
        // Prepare update data
        const updateData = {
            MaNguoiDung,
            TenDangNhap,
            TenDayDu,
            Email,
            SoDienThoai,
            VaiTro,
            NguoiTao
        };
        
        // If password is provided, hash it
        if (MatKhau) {
            updateData.MatKhau = await bcrypt.hash(MatKhau, 10);
        }
        
        // Update user
        const user = await prisma.user.update({
            where: { Stt: parseInt(id) },
            data: updateData
        });
        
        // Return user without password
        const { MatKhau: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            message: "Cập nhật người dùng thành công",
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật người dùng",
            error: error.message
        });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.user.delete({
            where: { Stt: parseInt(id) }
        });
        
        res.json({
            success: true,
            message: "Xóa người dùng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa người dùng",
            error: error.message
        });
    }
};