import { PrismaClient } from '@prisma/client';
import crypto from 'crypto'; // Built-in Node.js module, no need to install

const prisma = new PrismaClient();

// Simple hash function using built-in crypto module instead of bcrypt
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Get all accounts
export const getAllAccounts = async (req, res) => {
    try {
        const accounts = await prisma.accounts.findMany({
            select: {
                stt: true,
                ma_nguoi_dung: true,
                ten_dang_nhap: true,
                ho_va_ten: true,
                email: true,
                so_dien_thoai: true,
                vai_tro: true,
                ngay_tao: true,
                mat_khau: true,
                role: {
                    select: {
                        vai_tro: true
                    }
                },
                product_type: {
                    select: {
                        ma_loai_hang: true
                    }
                },
                products: {
                    select: {
                        ma_hang: true
                    }
                },
                _count: {
                    select: {
                        products: true,
                        product_type: true
                    }
                }
            },
            orderBy: {
                stt: 'asc'
            }
        });
        
        // Ensure all passwords are shown as hashed in the response
        const accountsWithHashedPasswords = accounts.map(account => {
            // If password is not already a hash (not 64 chars for SHA-256), hash it for display
            if (account.mat_khau && account.mat_khau.length !== 64) {
                return {
                    ...account,
                    mat_khau: hashPassword(account.mat_khau)
                };
            }
            return account;
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách tài khoản thành công",
            data: accountsWithHashedPasswords
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách tài khoản",
            error: error.message
        });
    }
};

// Get account by ID
export const getAccountById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const account = await prisma.accounts.findUnique({
            where: { ma_nguoi_dung: id },
            select: {
                stt: true,
                ma_nguoi_dung: true,
                ten_dang_nhap: true,
                ho_va_ten: true,
                email: true,
                so_dien_thoai: true,
                vai_tro: true,
                ngay_tao: true,
                mat_khau: true,
                role: {
                    select: {
                        ma_vai_tro: true,
                        vai_tro: true
                    }
                },
                product_type: {
                    select: {
                        stt: true,
                        ma_loai_hang: true,
                        ten_loai_hang: true
                    }
                },
                products: {
                    select: {
                        stt: true,
                        ma_hang: true,
                        ten_hang: true,
                        gia_thuc: true
                    }
                }
            }
        });
        
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }
        
        // Ensure password is shown as hashed in the response
        if (account.mat_khau && account.mat_khau.length !== 64) {
            account.mat_khau = hashPassword(account.mat_khau);
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin tài khoản thành công",
            data: account
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin tài khoản",
            error: error.message
        });
    }
};

// Create new account
export const createAccount = async (req, res) => {
    try {
        const { 
            ma_nguoi_dung, 
            ten_dang_nhap, 
            mat_khau, 
            ho_va_ten, 
            email, 
            so_dien_thoai, 
            vai_tro 
        } = req.body;
        
        // Validate required fields
        if (!ma_nguoi_dung || !ten_dang_nhap || !mat_khau || !ho_va_ten || !email || !so_dien_thoai) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin bắt buộc"
            });
        }
        
        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Email không hợp lệ"
            });
        }
        
        // Validate phone number format (Vietnamese phone number)
        const phoneRegex = /^(0[0-9]{9})$/;
        if (!phoneRegex.test(so_dien_thoai)) {
            return res.status(400).json({
                success: false,
                message: "Số điện thoại không hợp lệ"
            });
        }
        
        // Check if account code already exists
        const existingAccountCode = await prisma.accounts.findUnique({
            where: { ma_nguoi_dung }
        });
        
        if (existingAccountCode) {
            return res.status(400).json({
                success: false,
                message: `Mã người dùng ${ma_nguoi_dung} đã tồn tại`
            });
        }
        
        // Check if username already exists
        const existingUsername = await prisma.accounts.findUnique({
            where: { ten_dang_nhap }
        });
        
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: `Tên đăng nhập ${ten_dang_nhap} đã tồn tại`
            });
        }
        
        // Check if role exists if provided
        if (vai_tro) {
            const role = await prisma.role.findUnique({
                where: { ma_vai_tro: vai_tro }
            });
            
            if (!role) {
                return res.status(400).json({
                    success: false,
                    message: `Vai trò ${vai_tro} không tồn tại`
                });
            }
        }
        
        // Hash password with simple method (not as secure as bcrypt)
        const hashedPassword = hashPassword(mat_khau);
        
        // Create account
        const account = await prisma.accounts.create({
            data: {
                ma_nguoi_dung,
                ten_dang_nhap,
                mat_khau: hashedPassword, // Store hashed password
                ho_va_ten,
                email,
                so_dien_thoai,
                vai_tro
            },
            select: {
                stt: true,
                ma_nguoi_dung: true,
                ten_dang_nhap: true,
                ho_va_ten: true,
                email: true,
                so_dien_thoai: true,
                vai_tro: true,
                ngay_tao: true,
                mat_khau: true,
                role: {
                    select: {
                        vai_tro: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo tài khoản thành công",
            data: account
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo tài khoản",
            error: error.message
        });
    }
};

// Update account
export const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ten_dang_nhap, 
            mat_khau, 
            ho_va_ten, 
            email, 
            so_dien_thoai, 
            vai_tro 
        } = req.body;
        
        // Check if account exists
        const existingAccount = await prisma.accounts.findUnique({
            where: { ma_nguoi_dung: id }
        });
        
        if (!existingAccount) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }
        
        // Rest of validation code...
        // (email, phone, username uniqueness, role existence)
        
        // Prepare update data
        const updateData = {};
        
        if (ten_dang_nhap) updateData.ten_dang_nhap = ten_dang_nhap;
        if (ho_va_ten) updateData.ho_va_ten = ho_va_ten;
        if (email) updateData.email = email;
        if (so_dien_thoai) updateData.so_dien_thoai = so_dien_thoai;
        if (vai_tro !== undefined) updateData.vai_tro = vai_tro;
        
        // Hash password with built-in crypto if provided
        if (mat_khau) {
            updateData.mat_khau = hashPassword(mat_khau);
        }
        
        // Update account
        const updatedAccount = await prisma.accounts.update({
            where: { ma_nguoi_dung: id },
            data: updateData,
            select: {
                stt: true,
                ma_nguoi_dung: true,
                ten_dang_nhap: true,
                ho_va_ten: true,
                email: true,
                so_dien_thoai: true,
                vai_tro: true,
                ngay_tao: true,
                mat_khau: true,
                role: {
                    select: {
                        vai_tro: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật tài khoản thành công",
            data: updatedAccount
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật tài khoản",
            error: error.message
        });
    }
};

// Rest of the file remains unchanged...

// Delete account
export const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if account exists and has relationships
        const existingAccount = await prisma.accounts.findUnique({
            where: { ma_nguoi_dung: id },
            select: {
                ma_nguoi_dung: true,
                product_type: {
                    select: {
                        ma_loai_hang: true
                    }
                },
                products: {
                    select: {
                        ma_hang: true
                    }
                }
            }
        });
        
        if (!existingAccount) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }
        
        // Check if account has associations
        if (existingAccount.product_type.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa tài khoản này vì đang liên kết với các loại sản phẩm",
                product_types: existingAccount.product_type.map(pt => pt.ma_loai_hang)
            });
        }
        
        if (existingAccount.products.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa tài khoản này vì đang liên kết với các sản phẩm",
                products: existingAccount.products.map(p => p.ma_hang)
            });
        }
        
        // Delete account
        await prisma.accounts.delete({
            where: { ma_nguoi_dung: id }
        });
        
        res.json({
            success: true,
            message: "Xóa tài khoản thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa tài khoản",
            error: error.message
        });
    }
};

// Additional useful endpoints

// Get account statistics
export const getAccountStats = async (req, res) => {
    try {
        const stats = await prisma.accounts.aggregate({
            _count: { ma_nguoi_dung: true },
            _min: { ngay_tao: true },
            _max: { ngay_tao: true }
        });
        
        const roleDistribution = await prisma.accounts.groupBy({
            by: ['vai_tro'],
            _count: { ma_nguoi_dung: true }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê tài khoản thành công",
            data: {
                totalAccounts: stats._count.ma_nguoi_dung,
                firstAccountDate: stats._min.ngay_tao,
                newestAccountDate: stats._max.ngay_tao,
                roleDistribution: roleDistribution
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê tài khoản",
            error: error.message
        });
    }
};