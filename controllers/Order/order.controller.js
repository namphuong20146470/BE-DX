import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Get all orders with pagination and filtering
// Get all orders without pagination limits
export const getAllOrders = async (req, res) => {
    try {
        const { 
            sortBy = 'ngay_tao_don', 
            sortDir = 'desc',
            user = '',
            startDate = '',
            endDate = '',
            search = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (user) where.nguoi_lap_don = user;
        
        // Date filter
        if (startDate || endDate) {
            where.ngay_tao_don = {};
            if (startDate) where.ngay_tao_don.gte = new Date(startDate);
            if (endDate) where.ngay_tao_don.lte = new Date(endDate);
        }
        
        // Search filter
        if (search) {
            where.OR = [
                { so_don_hang: { contains: search, mode: 'insensitive' } },
                { ghi_chu: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        // Get total count for metadata
        const totalCount = await prisma.orders.count({ where });
        
        // Get ALL orders without pagination limits
        const orders = await prisma.orders.findMany({
            where,
            orderBy,
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                order_details: {
                    select: {
                        ma_chi_tiet_don_hang: true,
                        ma_hang: true,
                        so_luong: true,
                        ten_khach_hang: true,
                        tinh_trang_don_hang: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách đơn hàng thành công",
            data: orders,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách đơn hàng",
            error: error.message
        });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await prisma.orders.findUnique({
            where: { so_don_hang: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                order_details: {
                    include: {
                        customers: true,
                        contracts: true
                    }
                }
            }
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin đơn hàng thành công",
            data: order
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin đơn hàng",
            error: error.message
        });
    }
};

// Create order
export const createOrder = async (req, res) => {
    try {
        const {
            so_don_hang,
            tong_gia_tri_don_hang,
            nguoi_lap_don,
            ngay_tao_don,
            ghi_chu
        } = req.body;
        
        // Validate required fields
        if (!so_don_hang) {
            return res.status(400).json({
                success: false,
                message: "Số đơn hàng là bắt buộc"
            });
        }
        
        // Check if order already exists
        const existingOrder = await prisma.orders.findUnique({
            where: { so_don_hang }
        });
        
        if (existingOrder) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng với số ${so_don_hang} đã tồn tại`
            });
        }
        
        // Check if the referenced account exists
        if (nguoi_lap_don) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_lap_don }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: `Tài khoản với mã ${nguoi_lap_don} không tồn tại`
                });
            }
        }
        
        // Get the highest stt value
        const maxSttResult = await prisma.orders.aggregate({
            _max: {
                stt: true
            }
        });
        
        const nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Create order
        const order = await prisma.orders.create({
            data: {
                stt: nextStt,
                so_don_hang,
                tong_gia_tri_don_hang: tong_gia_tri_don_hang !== undefined ? parseFloat(tong_gia_tri_don_hang) : 0,
                nguoi_lap_don,
                ngay_tao_don: ngay_tao_don ? new Date(ngay_tao_don) : new Date(),
                ghi_chu
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo đơn hàng thành công",
            data: order
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo đơn hàng",
            error: error.message
        });
    }
};

// Update order
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tong_gia_tri_don_hang,
            nguoi_lap_don,
            ngay_tao_don,
            ghi_chu
        } = req.body;
        
        // Check if order exists
        const existingOrder = await prisma.orders.findUnique({
            where: { so_don_hang: id }
        });
        
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng"
            });
        }
        
        // Check if the referenced account exists
        if (nguoi_lap_don) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_lap_don }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: `Tài khoản với mã ${nguoi_lap_don} không tồn tại`
                });
            }
        }
        
        // Update order
        const order = await prisma.orders.update({
            where: { so_don_hang: id },
            data: {
                tong_gia_tri_don_hang: tong_gia_tri_don_hang !== undefined ? parseFloat(tong_gia_tri_don_hang) : undefined,
                nguoi_lap_don,
                ngay_tao_don: ngay_tao_don ? new Date(ngay_tao_don) : undefined,
                ghi_chu
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật đơn hàng thành công",
            data: order
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật đơn hàng",
            error: error.message
        });
    }
};

// Delete order
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if order exists
        const existingOrder = await prisma.orders.findUnique({
            where: { so_don_hang: id }
        });
        
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng"
            });
        }
        
        // Check if there are any order details associated with this order
        const orderDetailsCount = await prisma.order_details.count({
            where: { so_xac_nhan_don_hang: id }
        });
        
        if (orderDetailsCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa đơn hàng này vì nó đang được tham chiếu trong chi tiết đơn hàng"
            });
        }
        
        // Delete order
        await prisma.orders.delete({
            where: { so_don_hang: id }
        });
        
        res.json({
            success: true,
            message: "Xóa đơn hàng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa đơn hàng",
            error: error.message
        });
    }
};

// Get order details
export const getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if order exists
        const existingOrder = await prisma.orders.findUnique({
            where: { so_don_hang: id }
        });
        
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng"
            });
        }
        
        // Get order details
        const orderDetails = await prisma.order_details.findMany({
            where: { so_xac_nhan_don_hang: id },
            include: {
                customers: true,
                contracts: true,
                accounts: true,
                bills_order_details_hawb_1Tobills: true,
                bills_order_details_hawb_2Tobills: true,
                bills_order_details_hawb_3Tobills: true,
                bills_order_details_hawb_4Tobills: true,
                bills_order_details_hawb_5Tobills: true
            }
        });
        
        res.json({
            success: true,
            message: "Lấy chi tiết đơn hàng thành công",
            data: orderDetails
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy chi tiết đơn hàng",
            error: error.message
        });
    }
};

// Get orders by user
export const getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists
        const user = await prisma.accounts.findUnique({
            where: { ma_nguoi_dung: userId }
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }
        
        // Get orders by user
        const orders = await prisma.orders.findMany({
            where: { nguoi_lap_don: userId },
            include: {
                order_details: {
                    select: {
                        ma_chi_tiet_don_hang: true,
                        ma_hang: true,
                        so_luong: true,
                        ten_khach_hang: true
                    }
                }
            },
            orderBy: { ngay_tao_don: 'desc' }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách đơn hàng theo người dùng thành công",
            data: orders
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách đơn hàng theo người dùng",
            error: error.message
        });
    }
};

// Calculate order total value
export const calculateOrderTotalValue = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if order exists
        const existingOrder = await prisma.orders.findUnique({
            where: { so_don_hang: id }
        });
        
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng"
            });
        }
        
        // Get order details
        const orderDetails = await prisma.order_details.findMany({
            where: { so_xac_nhan_don_hang: id },
            select: {
                ma_hang: true,
                so_luong: true
            }
        });
        
        // Calculate total value
        let totalValue = 0;
        
        await Promise.all(
            orderDetails.map(async (detail) => {
                if (detail.ma_hang) {
                    const product = await prisma.products.findFirst({
                        where: { ma_hang: detail.ma_hang },
                        select: { gia_thuc: true }
                    });
                    
                    if (product) {
                        totalValue += product.gia_thuc * detail.so_luong;
                    }
                }
            })
        );
        
        // Update order total value
        const updatedOrder = await prisma.orders.update({
            where: { so_don_hang: id },
            data: {
                tong_gia_tri_don_hang: totalValue
            }
        });
        
        res.json({
            success: true,
            message: "Tính toán giá trị đơn hàng thành công",
            data: {
                so_don_hang: id,
                tong_gia_tri_don_hang: totalValue
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tính toán giá trị đơn hàng",
            error: error.message
        });
    }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
    try {
        const { 
            startDate = new Date(new Date().getFullYear(), 0, 1).toISOString(), // Default to start of current year
            endDate = new Date().toISOString() // Default to current date
        } = req.query;
        
        // Count total orders
        const totalOrders = await prisma.orders.count();
        
        // Count orders in date range
        const ordersInRange = await prisma.orders.count({
            where: {
                ngay_tao_don: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            }
        });
        
        // Calculate total value of all orders
        const totalValueResult = await prisma.orders.aggregate({
            _sum: {
                tong_gia_tri_don_hang: true
            }
        });
        
        const totalValue = totalValueResult._sum.tong_gia_tri_don_hang || 0;
        
        // Calculate total value in date range
        const valueInRangeResult = await prisma.orders.aggregate({
            where: {
                ngay_tao_don: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            _sum: {
                tong_gia_tri_don_hang: true
            }
        });
        
        const valueInRange = valueInRangeResult._sum.tong_gia_tri_don_hang || 0;
        
        // Get monthly order counts
        const monthlyOrders = await prisma.$queryRaw`
            SELECT 
                EXTRACT(MONTH FROM ngay_tao_don) AS month,
                EXTRACT(YEAR FROM ngay_tao_don) AS year,
                COUNT(*) AS order_count,
                SUM(tong_gia_tri_don_hang) AS total_value
            FROM orders
            WHERE ngay_tao_don BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}
            GROUP BY EXTRACT(MONTH FROM ngay_tao_don), EXTRACT(YEAR FROM ngay_tao_don)
            ORDER BY year, month
        `;
        
        // Get top 5 users by order count
        const topUsers = await prisma.orders.groupBy({
            by: ['nguoi_lap_don'],
            where: {
                nguoi_lap_don: { not: null },
                ngay_tao_don: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            _count: {
                so_don_hang: true
            },
            _sum: {
                tong_gia_tri_don_hang: true
            },
            orderBy: {
                _count: {
                    so_don_hang: 'desc'
                }
            },
            take: 5
        });
        
        // Get users details
        const topUsersWithDetails = await Promise.all(
            topUsers.map(async (item) => {
                const user = await prisma.accounts.findUnique({
                    where: { ma_nguoi_dung: item.nguoi_lap_don },
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                });
                
                return {
                    ...user,
                    order_count: item._count.so_don_hang,
                    total_value: item._sum.tong_gia_tri_don_hang
                };
            })
        );
        
        // Get recent 5 orders
        const recentOrders = await prisma.orders.findMany({
            take: 5,
            orderBy: {
                ngay_tao_don: 'desc'
            },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                },
                order_details: {
                    select: {
                        ten_khach_hang: true,
                        ma_hang: true,
                        so_luong: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê đơn hàng thành công",
            data: {
                totalOrders,
                ordersInRange,
                totalValue,
                valueInRange,
                monthlyOrders,
                topUsers: topUsersWithDetails,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê đơn hàng",
            error: error.message
        });
    }
};

// Setup for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `import-${Date.now()}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /xlsx|xls/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed!'));
        }
    }
}).single('file');

// Import orders from Excel
export const importOrdersFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng tải lên tệp Excel"
            });
        }
        
        // Read Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Tệp Excel không có dữ liệu"
            });
        }
        
        // Process and validate data
        const results = {
            success: [],
            errors: []
        };
        
        // Get the current highest stt value
        const maxSttResult = await prisma.orders.aggregate({
            _max: {
                stt: true
            }
        });
        
        let nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Process each record in Excel file
        for (const [index, item] of data.entries()) {
            try {
                // Check required fields
                if (!item['Số đơn hàng']) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: "Số đơn hàng là bắt buộc"
                    });
                    continue;
                }
                
                // Check if order already exists
                const existingOrder = await prisma.orders.findUnique({
                    where: { so_don_hang: item['Số đơn hàng'] }
                });
                
                if (existingOrder) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: `Đơn hàng với số ${item['Số đơn hàng']} đã tồn tại`
                    });
                    continue;
                }
                
                // Check if the referenced account exists
                if (item['Người lập đơn']) {
                    const account = await prisma.accounts.findUnique({
                        where: { ma_nguoi_dung: item['Người lập đơn'] }
                    });
                    
                    if (!account) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Tài khoản với mã ${item['Người lập đơn']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                // Create order
                const order = await prisma.orders.create({
                    data: {
                        stt: nextStt++,
                        so_don_hang: item['Số đơn hàng'],
                        tong_gia_tri_don_hang: item['Tổng giá trị đơn hàng'] || 0,
                        nguoi_lap_don: item['Người lập đơn'] || null,
                        ngay_tao_don: item['Ngày tạo đơn'] ? new Date(item['Ngày tạo đơn']) : new Date(),
                        ghi_chu: item['Ghi chú'] || null
                    }
                });
                
                results.success.push(order);
            } catch (error) {
                console.error(`Error processing row ${index + 1}:`, error);
                results.errors.push({
                    row: index + 1,
                    data: item,
                    error: error.message
                });
            }
        }
        
        // Remove temporary file
        fs.unlinkSync(req.file.path);
        
        // Return results
        return res.json({
            success: true,
            message: `Import thành công ${results.success.length} đơn hàng, thất bại ${results.errors.length} đơn hàng`,
            data: {
                successCount: results.success.length,
                errorCount: results.errors.length,
                successItems: results.success,
                errorItems: results.errors
            }
        });
    } catch (error) {
        console.error('Import error:', error);
        
        // Remove temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({
            success: false,
            message: "Lỗi khi import đơn hàng từ Excel",
            error: error.message
        });
    }
};

// Generate template Excel file for orders
export const generateOrderTemplate = (req, res) => {
    try {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        
        // Define columns
        const headers = [
            'Số đơn hàng',
            'Tổng giá trị đơn hàng',
            'Người lập đơn',
            'Ngày tạo đơn',
            'Ghi chú'
        ];
        
        // Create a sample row
        const sampleData = [{
            'Số đơn hàng': 'DH001',
            'Tổng giá trị đơn hàng': 1000000,
            'Người lập đơn': 'user001',
            'Ngày tạo đơn': '2025-04-25',
            'Ghi chú': 'Đơn hàng mẫu'
        }];
        
        // Create worksheet with data
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        
        // Add column widths
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng');
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=order_template.xlsx');
        
        // Write workbook to response
        const buffer = XLSX.write(wb, { type: 'buffer' });
        res.send(buffer);
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo file mẫu',
            error: error.message
        });
    }
};