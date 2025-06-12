import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all customers
export const getAllCustomers = async (req, res) => {
    try {
        const customers = await prisma.customers.findMany({
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true,
                        email: true,
                        so_dien_thoai: true
                    }
                },
                _count: {
                    select: {
                        // customer_interactions: true,
                        order_details: true,
                        stock_out: true
                    }
                }
            },
            orderBy: {
                stt: 'asc'
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách khách hàng thành công",
            data: customers
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách khách hàng",
            error: error.message
        });
    }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const customer = await prisma.customers.findUnique({
            where: { ma_khach_hang: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true,
                        so_dien_thoai: true
                    }
                },
                customer_interactions: {
                    include: {
                        interaction_type: true
                    },
                    orderBy: {
                        thoi_gian: 'desc'
                    }
                },
                order_details: {
                    include: {
                        products: {
                            select: {
                                ma_hang: true,
                                ten_hang: true,
                                gia_thuc: true
                            }
                        }
                    },
                    orderBy: {
                        ngay_dat_hang: 'desc'
                    }
                },
                _count: {
                    select: {
                        customer_interactions: true,
                        order_details: true,
                        stock_out: true
                    }
                }
            }
        });
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin khách hàng thành công",
            data: customer
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin khách hàng",
            error: error.message
        });
    }
};

// Create new customer
export const createCustomer = async (req, res) => {
    try {
        const { 
            ma_khach_hang, 
            ten_khach_hang, 
            nguoi_phu_trach, 
            ma_so_thue, 
            dia_chi_cu_the, 
            tinh_thanh, 
            so_dien_thoai, 
            email, 
            nguoi_lien_he, 
            ngay_them_vao, 
            tong_no_phai_thu, 
            ghi_chu 
        } = req.body;
        
        // Validate required fields
        if (!ma_khach_hang || !ten_khach_hang) {
            return res.status(400).json({
                success: false,
                message: "Mã khách hàng và tên khách hàng là bắt buộc"
            });
        }
        
        // Check if customer ID already exists
        const existingCustomer = await prisma.customers.findUnique({
            where: { ma_khach_hang }
        });
        
        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: `Mã khách hàng ${ma_khach_hang} đã tồn tại`
            });
        }
        
        // Check if assigned user exists
        if (nguoi_phu_trach) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người phụ trách với mã ${nguoi_phu_trach} không tồn tại`
                });
            }
        }
        
        // Create customer
        const customer = await prisma.customers.create({
            data: {
                ma_khach_hang,
                ten_khach_hang,
                nguoi_phu_trach,
                ma_so_thue,
                dia_chi_cu_the,
                tinh_thanh,
                so_dien_thoai,
                email,
                nguoi_lien_he,
                ngay_them_vao: ngay_them_vao ? new Date(ngay_them_vao) : null,
                tong_no_phai_thu: tong_no_phai_thu || 0,
                ghi_chu
            },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo khách hàng thành công",
            data: customer
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo khách hàng",
            error: error.message
        });
    }
};

// Update customer
export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ten_khach_hang, 
            nguoi_phu_trach, 
            ma_so_thue, 
            dia_chi_cu_the, 
            tinh_thanh, 
            so_dien_thoai, 
            email, 
            nguoi_lien_he, 
            ngay_them_vao, 
            tong_no_phai_thu, 
            ghi_chu 
        } = req.body;
        
        // Check if customer exists
        const existingCustomer = await prisma.customers.findUnique({
            where: { ma_khach_hang: id }
        });
        
        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng"
            });
        }
        
        // Check if assigned user exists if provided
        if (nguoi_phu_trach) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người phụ trách với mã ${nguoi_phu_trach} không tồn tại`
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (ten_khach_hang !== undefined) updateData.ten_khach_hang = ten_khach_hang;
        if (nguoi_phu_trach !== undefined) updateData.nguoi_phu_trach = nguoi_phu_trach;
        if (ma_so_thue !== undefined) updateData.ma_so_thue = ma_so_thue;
        if (dia_chi_cu_the !== undefined) updateData.dia_chi_cu_the = dia_chi_cu_the;
        if (tinh_thanh !== undefined) updateData.tinh_thanh = tinh_thanh;
        if (so_dien_thoai !== undefined) updateData.so_dien_thoai = so_dien_thoai;
        if (email !== undefined) updateData.email = email;
        if (nguoi_lien_he !== undefined) updateData.nguoi_lien_he = nguoi_lien_he;
        if (ngay_them_vao !== undefined) updateData.ngay_them_vao = ngay_them_vao ? new Date(ngay_them_vao) : null;
        if (tong_no_phai_thu !== undefined) updateData.tong_no_phai_thu = tong_no_phai_thu;
        if (ghi_chu !== undefined) updateData.ghi_chu = ghi_chu;
        
        // Update customer
        const customer = await prisma.customers.update({
            where: { ma_khach_hang: id },
            data: updateData,
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật khách hàng thành công",
            data: customer
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật khách hàng",
            error: error.message
        });
    }
};

// Fix for deleteCustomer
export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if customer exists
        const customer = await prisma.customers.findUnique({
            where: { ma_khach_hang: id },
            include: {
                // Remove customer_interactions from here
                order_details: true,
                stock_out: true
            }
        });
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng"
            });
        }
        
        // Remove this check since we don't have the relationship defined
        // if (customer.customer_interactions.length > 0) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Không thể xóa khách hàng vì có tương tác khách hàng liên quan",
        //         count: customer.customer_interactions.length
        //     });
        // }
        
        if (customer.order_details.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa khách hàng vì có đơn hàng liên quan",
                count: customer.order_details.length
            });
        }
        
        if (customer.stock_out.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa khách hàng vì có dữ liệu xuất kho liên quan",
                count: customer.stock_out.length
            });
        }
        
        // Delete customer
        await prisma.customers.delete({
            where: { ma_khach_hang: id }
        });
        
        res.json({
            success: true,
            message: "Xóa khách hàng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa khách hàng",
            error: error.message
        });
    }
};
// Get customer statistics
export const getCustomerStats = async (req, res) => {
    try {
        // Get count of customers
        const customerCount = await prisma.customers.count();
        
        // Get total debt
        const totalDebt = await prisma.customers.aggregate({
            _sum: {
                tong_no_phai_thu: true
            }
        });
        
        // Get customers by city
        const customersByCity = await prisma.customers.groupBy({
            by: ['tinh_thanh'],
            _count: {
                ma_khach_hang: true
            },
            where: {
                tinh_thanh: {
                    not: null
                }
            }
        });
        
        // Get recent customers
        const recentCustomers = await prisma.customers.findMany({
            take: 5,
            orderBy: {
                ngay_them_vao: 'desc'
            },
            where: {
                ngay_them_vao: {
                    not: null
                }
            }
        });
        
        // Get customers with most orders
        const customersWithMostOrders = await prisma.customers.findMany({
            take: 5,
            include: {
                _count: {
                    select: {
                        order_details: true
                    }
                }
            },
            orderBy: {
                order_details: {
                    _count: 'desc'
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê khách hàng thành công",
            data: {
                totalCustomers: customerCount,
                totalDebt: totalDebt._sum.tong_no_phai_thu || 0,
                customersByCity,
                recentCustomers,
                topCustomers: customersWithMostOrders.map(c => ({
                    ma_khach_hang: c.ma_khach_hang,
                    ten_khach_hang: c.ten_khach_hang,
                    orderCount: c._count.order_details
                }))
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê khách hàng",
            error: error.message
        });
    }
};

// Get customer interactions
export const getCustomerInteractions = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if customer exists
        const customer = await prisma.customers.findUnique({
            where: { ma_khach_hang: id }
        });
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng"
            });
        }
        
        // Get interactions for this customer
        const interactions = await prisma.customer_interactions.findMany({
            where: { ten_khach_hang: id },
            include: {
                interaction_type: true,
                accounts: {
                    select: {
                        ho_va_ten: true,
                        email: true,
                        so_dien_thoai: true
                    }
                }
            },
            orderBy: {
                thoi_gian: 'desc'
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách tương tác khách hàng thành công",
            data: interactions
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách tương tác khách hàng",
            error: error.message
        });
    }
};