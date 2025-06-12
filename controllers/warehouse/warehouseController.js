import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all warehouses
export const getAllWarehouses = async (req, res) => {
    try {
        const warehouses = await prisma.warehouse.findMany({
            include: {
                accounts_warehouse_nguoi_taoToaccounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                accounts_warehouse_quan_ly_khoToaccounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                _count: {
                    select: {
                        inventory: true,
                        stock_in: true,
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
            message: "Lấy danh sách kho thành công",
            data: warehouses
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách kho",
            error: error.message
        });
    }
};

// Get warehouse by ID
export const getWarehouseById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const warehouse = await prisma.warehouse.findUnique({
            where: { ma_kho: id },
            include: {
                accounts_warehouse_nguoi_taoToaccounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true,
                        so_dien_thoai: true
                    }
                },
                accounts_warehouse_quan_ly_khoToaccounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true,
                        so_dien_thoai: true
                    }
                },
                inventory: {
                    include: {
                        products: {
                            select: {
                                ma_hang: true,
                                ten_hang: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        inventory: true,
                        stock_in: true,
                        stock_out: true,
                        inventory_check: true
                    }
                }
            }
        });
        
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kho"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin kho thành công",
            data: warehouse
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin kho",
            error: error.message
        });
    }
};

// Create new warehouse
export const createWarehouse = async (req, res) => {
    try {
        const { 
            ma_kho, 
            ten_kho, 
            vi_tri_kho, 
            tinh_trang, 
            nguoi_tao, 
            quan_ly_kho, 
            ngay_kiem_ke_gan_nhat, 
            ghi_chu 
        } = req.body;
        
        // Validate required fields
        if (!ma_kho || !ten_kho || !vi_tri_kho) {
            return res.status(400).json({
                success: false,
                message: "Mã kho, tên kho và vị trí kho là bắt buộc"
            });
        }
        
        // Check if warehouse code already exists
        const existingWarehouse = await prisma.warehouse.findUnique({
            where: { ma_kho }
        });
        
        if (existingWarehouse) {
            return res.status(400).json({
                success: false,
                message: `Mã kho ${ma_kho} đã tồn tại`
            });
        }
        
        // Check if creator user exists
        if (nguoi_tao) {
            const creator = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_tao }
            });
            
            if (!creator) {
                return res.status(400).json({
                    success: false,
                    message: `Người tạo với mã ${nguoi_tao} không tồn tại`
                });
            }
        }
        
        // Check if manager user exists
        if (quan_ly_kho) {
            const manager = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: quan_ly_kho }
            });
            
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: `Người quản lý kho với mã ${quan_ly_kho} không tồn tại`
                });
            }
        }
        
        // Create warehouse
        const warehouse = await prisma.warehouse.create({
            data: {
                ma_kho,
                ten_kho,
                vi_tri_kho,
                tinh_trang,
                nguoi_tao,
                quan_ly_kho,
                ngay_kiem_ke_gan_nhat: ngay_kiem_ke_gan_nhat ? new Date(ngay_kiem_ke_gan_nhat) : null,
                tong_gia_tri_nhap: 0,
                tong_gia_tri_xuat: 0,
                tong_gia_tri_ton_kho: 0,
                ghi_chu
            },
            include: {
                accounts_warehouse_nguoi_taoToaccounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                accounts_warehouse_quan_ly_khoToaccounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo kho thành công",
            data: warehouse
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo kho",
            error: error.message
        });
    }
};

// Update warehouse
export const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ten_kho, 
            vi_tri_kho, 
            tinh_trang, 
            nguoi_tao, 
            quan_ly_kho, 
            ngay_kiem_ke_gan_nhat, 
            tong_gia_tri_nhap, 
            tong_gia_tri_xuat, 
            tong_gia_tri_ton_kho, 
            ghi_chu 
        } = req.body;
        
        // Check if warehouse exists
        const existingWarehouse = await prisma.warehouse.findUnique({
            where: { ma_kho: id }
        });
        
        if (!existingWarehouse) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kho"
            });
        }
        
        // Check if creator user exists if provided
        if (nguoi_tao) {
            const creator = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_tao }
            });
            
            if (!creator) {
                return res.status(400).json({
                    success: false,
                    message: `Người tạo với mã ${nguoi_tao} không tồn tại`
                });
            }
        }
        
        // Check if manager user exists if provided
        if (quan_ly_kho) {
            const manager = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: quan_ly_kho }
            });
            
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: `Người quản lý kho với mã ${quan_ly_kho} không tồn tại`
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (ten_kho !== undefined) updateData.ten_kho = ten_kho;
        if (vi_tri_kho !== undefined) updateData.vi_tri_kho = vi_tri_kho;
        if (tinh_trang !== undefined) updateData.tinh_trang = tinh_trang;
        if (nguoi_tao !== undefined) updateData.nguoi_tao = nguoi_tao;
        if (quan_ly_kho !== undefined) updateData.quan_ly_kho = quan_ly_kho;
        if (ngay_kiem_ke_gan_nhat !== undefined) updateData.ngay_kiem_ke_gan_nhat = ngay_kiem_ke_gan_nhat ? new Date(ngay_kiem_ke_gan_nhat) : null;
        if (tong_gia_tri_nhap !== undefined) updateData.tong_gia_tri_nhap = tong_gia_tri_nhap;
        if (tong_gia_tri_xuat !== undefined) updateData.tong_gia_tri_xuat = tong_gia_tri_xuat;
        if (tong_gia_tri_ton_kho !== undefined) updateData.tong_gia_tri_ton_kho = tong_gia_tri_ton_kho;
        if (ghi_chu !== undefined) updateData.ghi_chu = ghi_chu;
        
        // Update warehouse
        const warehouse = await prisma.warehouse.update({
            where: { ma_kho: id },
            data: updateData,
            include: {
                accounts_warehouse_nguoi_taoToaccounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                accounts_warehouse_quan_ly_khoToaccounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật kho thành công",
            data: warehouse
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật kho",
            error: error.message
        });
    }
};

// Delete warehouse
export const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if warehouse exists
        const warehouse = await prisma.warehouse.findUnique({
            where: { ma_kho: id },
            include: {
                inventory: true,
                stock_in: true,
                stock_out: true,
                inventory_check: true
            }
        });
        
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kho"
            });
        }
        
        // Check if warehouse has related records
        if (warehouse.inventory.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa kho vì đang có dữ liệu tồn kho liên quan",
                count: warehouse.inventory.length
            });
        }
        
        if (warehouse.stock_in.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa kho vì đang có dữ liệu nhập kho liên quan",
                count: warehouse.stock_in.length
            });
        }
        
        if (warehouse.stock_out.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa kho vì đang có dữ liệu xuất kho liên quan",
                count: warehouse.stock_out.length
            });
        }
        
        if (warehouse.inventory_check.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa kho vì đang có dữ liệu kiểm kê liên quan",
                count: warehouse.inventory_check.length
            });
        }
        
        // Delete warehouse
        await prisma.warehouse.delete({
            where: { ma_kho: id }
        });
        
        res.json({
            success: true,
            message: "Xóa kho thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa kho",
            error: error.message
        });
    }
};

// Get warehouse statistics
export const getWarehouseStats = async (req, res) => {
    try {
        // Get count of warehouses
        const warehouseCount = await prisma.warehouse.count();
        
        // Get total values
        const totals = await prisma.warehouse.aggregate({
            _sum: {
                tong_gia_tri_nhap: true,
                tong_gia_tri_xuat: true,
                tong_gia_tri_ton_kho: true
            }
        });
        
        // Get warehouses by status
        const warehousesByStatus = await prisma.warehouse.groupBy({
            by: ['tinh_trang'],
            _count: {
                ma_kho: true
            },
            where: {
                tinh_trang: {
                    not: null
                }
            }
        });
        
        // Get latest inventory check date
        const latestCheck = await prisma.warehouse.findFirst({
            select: {
                ngay_kiem_ke_gan_nhat: true
            },
            orderBy: {
                ngay_kiem_ke_gan_nhat: 'desc'
            },
            where: {
                ngay_kiem_ke_gan_nhat: {
                    not: null
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê kho thành công",
            data: {
                totalWarehouses: warehouseCount,
                totalValues: {
                    totalImport: totals._sum.tong_gia_tri_nhap || 0,
                    totalExport: totals._sum.tong_gia_tri_xuat || 0,
                    totalStock: totals._sum.tong_gia_tri_ton_kho || 0
                },
                warehousesByStatus,
                latestInventoryCheck: latestCheck?.ngay_kiem_ke_gan_nhat || null
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê kho",
            error: error.message
        });
    }
};

// Get warehouse inventory
export const getWarehouseInventory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if warehouse exists
        const warehouse = await prisma.warehouse.findUnique({
            where: { ma_kho: id }
        });
        
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kho"
            });
        }
        
        // Get inventory for this warehouse
        const inventory = await prisma.inventory.findMany({
            where: { ten_kho: id },
            include: {
                products: {
                    select: {
                        ma_hang: true,
                        ten_hang: true,
                        gia_thuc: true,
                        don_vi_ban_hang: true,
                        tinh_trang_hang_hoa: true,
                        product_type: {
                            select: {
                                ma_loai_hang: true,
                                ten_loai_hang: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                stt: 'asc'
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách tồn kho thành công",
            data: inventory
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách tồn kho",
            error: error.message
        });
    }
};