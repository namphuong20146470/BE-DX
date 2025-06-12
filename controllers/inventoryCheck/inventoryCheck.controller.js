import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Get all inventory checks with pagination and filtering
// Update the getAllInventoryChecks function
export const getAllInventoryChecks = async (req, res) => {
    try {
        const {
            sortBy = 'ngay_thuc_hien_kiem_ke',
            sortDir = 'desc',
            product = '',
            warehouse = '',
            user = '',
            startDate = '',
            endDate = '',
            year = new Date().getFullYear(),
            search = ''
        } = req.query;

        // Convert to numbers
        const yearNum = parseInt(year);

        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();

        // Build filter object
        const where = {
            nam: yearNum
        };

        if (product) where.ma_hang = product;
        if (warehouse) where.ten_kho = warehouse;
        if (user) where.nguoi_kiem_ke = user;

        // Date filter
        if (startDate || endDate) {
            where.ngay_thuc_hien_kiem_ke = {};
            if (startDate) where.ngay_thuc_hien_kiem_ke.gte = new Date(startDate);
            if (endDate) where.ngay_thuc_hien_kiem_ke.lte = new Date(endDate);
        }

        // Search filter
        if (search) {
            where.OR = [
                { ma_kiem_ke: { contains: search, mode: 'insensitive' } },
                { ma_hang: { contains: search, mode: 'insensitive' } },
                { ten_kho: { contains: search, mode: 'insensitive' } },
                { ghi_chu: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get total count for metadata
        const totalCount = await prisma.inventory_check.count({ where });

        // Fetch inventory checks - REMOVED pagination limits (skip/take)
        const inventoryChecks = await prisma.inventory_check.findMany({
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
                inventory: true,
                warehouse: {
                    select: {
                        ma_kho: true,
                        ten_kho: true,
                        vi_tri_kho: true
                    }
                }
            }
        });

        // Fetch product details for each inventory check
        const checksWithProductDetails = await Promise.all(
            inventoryChecks.map(async (check) => {
                let product = null;

                if (check.ma_hang) {
                    product = await prisma.products.findFirst({
                        where: { ma_hang: check.ma_hang },
                        select: {
                            ma_hang: true,
                            ten_hang: true,
                            don_vi_ban_hang: true,
                            gia_thuc: true
                        }
                    });
                }

                return {
                    ...check,
                    product
                };
            })
        );

        res.json({
            success: true,
            message: "Lấy danh sách kiểm kê kho hàng thành công",
            data: checksWithProductDetails,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách kiểm kê kho hàng",
            error: error.message
        });
    }
};

// Get inventory check by ID
export const getInventoryCheckById = async (req, res) => {
    try {
        const { id } = req.params;

        const inventoryCheck = await prisma.inventory_check.findUnique({
            where: { ma_kiem_ke: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                inventory: true,
                warehouse: {
                    select: {
                        ma_kho: true,
                        ten_kho: true,
                        vi_tri_kho: true
                    }
                }
            }
        });

        if (!inventoryCheck) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin kiểm kê kho hàng"
            });
        }

        // Get product details
        let product = null;
        if (inventoryCheck.ma_hang) {
            product = await prisma.products.findFirst({
                where: { ma_hang: inventoryCheck.ma_hang },
                select: {
                    ma_hang: true,
                    ten_hang: true,
                    don_vi_ban_hang: true,
                    gia_thuc: true
                }
            });
        }

        res.json({
            success: true,
            message: "Lấy thông tin kiểm kê kho hàng thành công",
            data: {
                ...inventoryCheck,
                product
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin kiểm kê kho hàng",
            error: error.message
        });
    }
};

// Create inventory check
export const createInventoryCheck = async (req, res) => {
    try {
        const {
            ma_kiem_ke,
            nam,
            ma_hang,
            ten_kho,
            so_luong_he_thong_ghi_nhan,
            so_luong_thuc_te,
            ngay_thuc_hien_kiem_ke,
            nguoi_kiem_ke,
            ghi_chu
        } = req.body;

        // Validate required fields
        if (!ma_kiem_ke || !nam || !so_luong_thuc_te || !ngay_thuc_hien_kiem_ke) {
            return res.status(400).json({
                success: false,
                message: "Mã kiểm kê, năm, số lượng thực tế, và ngày thực hiện kiểm kê là bắt buộc"
            });
        }

        // Check if inventory check with this ID already exists
        const existingCheck = await prisma.inventory_check.findUnique({
            where: { ma_kiem_ke }
        });

        if (existingCheck) {
            return res.status(400).json({
                success: false,
                message: `Kiểm kê kho hàng với mã ${ma_kiem_ke} đã tồn tại`
            });
        }

        // Validate product reference if provided
        if (ma_hang) {
            const product = await prisma.products.findFirst({
                where: { ma_hang }
            });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm với mã ${ma_hang} không tồn tại`
                });
            }
        }

        // Validate warehouse reference if provided
        if (ten_kho) {
            const warehouse = await prisma.warehouse.findUnique({
                where: { ma_kho: ten_kho }
            });

            if (!warehouse) {
                return res.status(400).json({
                    success: false,
                    message: `Kho với mã ${ten_kho} không tồn tại`
                });
            }
        }

        // Validate inventory reference if provided
        if (so_luong_he_thong_ghi_nhan) {
            const inventory = await prisma.inventory.findUnique({
                where: { ma_inventory: so_luong_he_thong_ghi_nhan }
            });

            if (!inventory) {
                return res.status(400).json({
                    success: false,
                    message: `Dữ liệu kho hàng với mã ${so_luong_he_thong_ghi_nhan} không tồn tại`
                });
            }
        }

        // Validate user reference if provided
        if (nguoi_kiem_ke) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_kiem_ke }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người dùng với mã ${nguoi_kiem_ke} không tồn tại`
                });
            }
        }

        // Get system quantity from inventory if provided
        let systemQuantity = 0;
        if (so_luong_he_thong_ghi_nhan) {
            const inventory = await prisma.inventory.findUnique({
                where: { ma_inventory: so_luong_he_thong_ghi_nhan }
            });
            systemQuantity = inventory ? inventory.ton_hien_tai : 0;
        }

        // Calculate difference
        const actualQuantity = parseInt(so_luong_thuc_te);
        const difference = actualQuantity - systemQuantity;

        // Get the highest stt value
        const maxSttResult = await prisma.inventory_check.aggregate({
            _max: {
                stt: true
            }
        });

        const nextStt = (maxSttResult._max.stt || 0) + 1;

        // Create inventory check
        const inventoryCheck = await prisma.inventory_check.create({
            data: {
                stt: nextStt,
                ma_kiem_ke,
                nam: parseInt(nam),
                ma_hang,
                ten_kho,
                so_luong_he_thong_ghi_nhan,
                so_luong_thuc_te: actualQuantity,
                chenh_lech: difference,
                ngay_thuc_hien_kiem_ke: new Date(ngay_thuc_hien_kiem_ke),
                nguoi_kiem_ke,
                ghi_chu
            }
        });

        // Update warehouse last check date
        if (ten_kho) {
            await prisma.warehouse.update({
                where: { ma_kho: ten_kho },
                data: {
                    ngay_kiem_ke_gan_nhat: new Date(ngay_thuc_hien_kiem_ke)
                }
            });
        }

        res.status(201).json({
            success: true,
            message: "Tạo thông tin kiểm kê kho hàng thành công",
            data: inventoryCheck
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo thông tin kiểm kê kho hàng",
            error: error.message
        });
    }
};

// Update inventory check
export const updateInventoryCheck = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nam,
            ma_hang,
            ten_kho,
            so_luong_he_thong_ghi_nhan,
            so_luong_thuc_te,
            ngay_thuc_hien_kiem_ke,
            nguoi_kiem_ke,
            ghi_chu
        } = req.body;

        // Check if inventory check exists
        const existingCheck = await prisma.inventory_check.findUnique({
            where: { ma_kiem_ke: id }
        });

        if (!existingCheck) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin kiểm kê kho hàng"
            });
        }

        // Validate product reference if changing
        if (ma_hang && ma_hang !== existingCheck.ma_hang) {
            const product = await prisma.products.findFirst({
                where: { ma_hang }
            });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm với mã ${ma_hang} không tồn tại`
                });
            }
        }

        // Validate warehouse reference if changing
        if (ten_kho && ten_kho !== existingCheck.ten_kho) {
            const warehouse = await prisma.warehouse.findUnique({
                where: { ma_kho: ten_kho }
            });

            if (!warehouse) {
                return res.status(400).json({
                    success: false,
                    message: `Kho với mã ${ten_kho} không tồn tại`
                });
            }
        }

        // Validate inventory reference if changing
        if (so_luong_he_thong_ghi_nhan && so_luong_he_thong_ghi_nhan !== existingCheck.so_luong_he_thong_ghi_nhan) {
            const inventory = await prisma.inventory.findUnique({
                where: { ma_inventory: so_luong_he_thong_ghi_nhan }
            });

            if (!inventory) {
                return res.status(400).json({
                    success: false,
                    message: `Dữ liệu kho hàng với mã ${so_luong_he_thong_ghi_nhan} không tồn tại`
                });
            }
        }

        // Validate user reference if changing
        if (nguoi_kiem_ke && nguoi_kiem_ke !== existingCheck.nguoi_kiem_ke) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_kiem_ke }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người dùng với mã ${nguoi_kiem_ke} không tồn tại`
                });
            }
        }

        // Get system quantity from inventory
        let systemQuantity = 0;
        const inventoryId = so_luong_he_thong_ghi_nhan || existingCheck.so_luong_he_thong_ghi_nhan;
        
        if (inventoryId) {
            const inventory = await prisma.inventory.findUnique({
                where: { ma_inventory: inventoryId }
            });
            systemQuantity = inventory ? inventory.ton_hien_tai : 0;
        }

        // Calculate difference if actual quantity is provided
        const actualQuantity = so_luong_thuc_te !== undefined ? parseInt(so_luong_thuc_te) : existingCheck.so_luong_thuc_te;
        const difference = actualQuantity - systemQuantity;

        // Update inventory check
        const updatedCheck = await prisma.inventory_check.update({
            where: { ma_kiem_ke: id },
            data: {
                nam: nam !== undefined ? parseInt(nam) : undefined,
                ma_hang,
                ten_kho,
                so_luong_he_thong_ghi_nhan,
                so_luong_thuc_te: so_luong_thuc_te !== undefined ? parseInt(so_luong_thuc_te) : undefined,
                chenh_lech: difference,
                ngay_thuc_hien_kiem_ke: ngay_thuc_hien_kiem_ke ? new Date(ngay_thuc_hien_kiem_ke) : undefined,
                nguoi_kiem_ke,
                ghi_chu
            }
        });

        // Update warehouse last check date if date changed
        if (ngay_thuc_hien_kiem_ke && (ten_kho || existingCheck.ten_kho)) {
            const warehouseId = ten_kho || existingCheck.ten_kho;
            await prisma.warehouse.update({
                where: { ma_kho: warehouseId },
                data: {
                    ngay_kiem_ke_gan_nhat: new Date(ngay_thuc_hien_kiem_ke)
                }
            });
        }

        res.json({
            success: true,
            message: "Cập nhật thông tin kiểm kê kho hàng thành công",
            data: updatedCheck
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật thông tin kiểm kê kho hàng",
            error: error.message
        });
    }
};

// Delete inventory check
export const deleteInventoryCheck = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if inventory check exists
        const inventoryCheck = await prisma.inventory_check.findUnique({
            where: { ma_kiem_ke: id }
        });

        if (!inventoryCheck) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin kiểm kê kho hàng"
            });
        }

        // Delete inventory check
        await prisma.inventory_check.delete({
            where: { ma_kiem_ke: id }
        });

        res.json({
            success: true,
            message: "Xóa thông tin kiểm kê kho hàng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa thông tin kiểm kê kho hàng",
            error: error.message
        });
    }
};

// Get inventory checks by product
export const getInventoryChecksByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { year = new Date().getFullYear() } = req.query;

        const yearNum = parseInt(year);

        const inventoryChecks = await prisma.inventory_check.findMany({
            where: {
                ma_hang: productId,
                nam: yearNum
            },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                inventory: true,
                warehouse: {
                    select: {
                        ma_kho: true,
                        ten_kho: true,
                        vi_tri_kho: true
                    }
                }
            },
            orderBy: { ngay_thuc_hien_kiem_ke: 'desc' }
        });

        if (inventoryChecks.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thông tin kiểm kê cho sản phẩm ${productId} trong năm ${yearNum}`
            });
        }

        // Get product details
        const product = await prisma.products.findFirst({
            where: { ma_hang: productId },
            select: {
                ma_hang: true,
                ten_hang: true,
                don_vi_ban_hang: true,
                gia_thuc: true
            }
        });

        res.json({
            success: true,
            message: `Lấy thông tin kiểm kê cho sản phẩm ${productId} thành công`,
            data: {
                product,
                inventoryChecks
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin kiểm kê theo sản phẩm",
            error: error.message
        });
    }
};

// Get inventory checks by warehouse
export const getInventoryChecksByWarehouse = async (req, res) => {
    try {
        const { warehouseId } = req.params;
        const { year = new Date().getFullYear() } = req.query;

        const yearNum = parseInt(year);

        const inventoryChecks = await prisma.inventory_check.findMany({
            where: {
                ten_kho: warehouseId,
                nam: yearNum
            },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                inventory: true
            },
            orderBy: { ngay_thuc_hien_kiem_ke: 'desc' }
        });

        if (inventoryChecks.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thông tin kiểm kê cho kho ${warehouseId} trong năm ${yearNum}`
            });
        }

        // Get warehouse details
        const warehouse = await prisma.warehouse.findUnique({
            where: { ma_kho: warehouseId },
            select: {
                ma_kho: true,
                ten_kho: true,
                vi_tri_kho: true,
                ngay_kiem_ke_gan_nhat: true
            }
        });

        // Get product details for each inventory check
        const checksWithProductDetails = await Promise.all(
            inventoryChecks.map(async (check) => {
                let product = null;

                if (check.ma_hang) {
                    product = await prisma.products.findFirst({
                        where: { ma_hang: check.ma_hang },
                        select: {
                            ma_hang: true,
                            ten_hang: true,
                            don_vi_ban_hang: true,
                            gia_thuc: true
                        }
                    });
                }

                return {
                    ...check,
                    product
                };
            })
        );

        res.json({
            success: true,
            message: `Lấy thông tin kiểm kê cho kho ${warehouseId} thành công`,
            data: {
                warehouse,
                inventoryChecks: checksWithProductDetails
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin kiểm kê theo kho",
            error: error.message
        });
    }
};

// Get inventory checks by user
export const getInventoryChecksByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { year = new Date().getFullYear() } = req.query;

        const yearNum = parseInt(year);

        const inventoryChecks = await prisma.inventory_check.findMany({
            where: {
                nguoi_kiem_ke: userId,
                nam: yearNum
            },
            include: {
                inventory: true,
                warehouse: {
                    select: {
                        ma_kho: true,
                        ten_kho: true,
                        vi_tri_kho: true
                    }
                }
            },
            orderBy: { ngay_thuc_hien_kiem_ke: 'desc' }
        });

        if (inventoryChecks.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thông tin kiểm kê được thực hiện bởi người dùng ${userId} trong năm ${yearNum}`
            });
        }

        // Get user details
        const user = await prisma.accounts.findUnique({
            where: { ma_nguoi_dung: userId },
            select: {
                ma_nguoi_dung: true,
                ho_va_ten: true,
                email: true
            }
        });

        // Get product details for each inventory check
        const checksWithProductDetails = await Promise.all(
            inventoryChecks.map(async (check) => {
                let product = null;

                if (check.ma_hang) {
                    product = await prisma.products.findFirst({
                        where: { ma_hang: check.ma_hang },
                        select: {
                            ma_hang: true,
                            ten_hang: true,
                            don_vi_ban_hang: true,
                            gia_thuc: true
                        }
                    });
                }

                return {
                    ...check,
                    product
                };
            })
        );

        res.json({
            success: true,
            message: `Lấy thông tin kiểm kê của người dùng ${userId} thành công`,
            data: {
                user,
                inventoryChecks: checksWithProductDetails
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin kiểm kê theo người dùng",
            error: error.message
        });
    }
};

// Get inventory check statistics
export const getInventoryCheckStats = async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        
        const yearNum = parseInt(year);
        
        // Count total inventory checks for the year
        const totalChecks = await prisma.inventory_check.count({
            where: { nam: yearNum }
        });
        
        // Count checks with discrepancies (where chenh_lech ≠ 0)
        const discrepancyChecks = await prisma.inventory_check.count({
            where: {
                nam: yearNum,
                NOT: { chenh_lech: 0 }
            }
        });
        
        // Calculate discrepancy percentage
        const discrepancyPercentage = totalChecks > 0 
            ? (discrepancyChecks / totalChecks) * 100 
            : 0;
        
        // Get sum of absolute discrepancies
        const discrepancySum = await prisma.inventory_check.aggregate({
            where: { nam: yearNum },
            _sum: {
                chenh_lech: true
            }
        });
        
        // Get checks by month
        const monthlyChecks = await prisma.inventory_check.groupBy({
            by: [
                {
                    ngay_thuc_hien_kiem_ke: {
                        month: true
                    }
                }
            ],
            where: {
                nam: yearNum,
                ngay_thuc_hien_kiem_ke: {
                    gte: new Date(`${yearNum}-01-01`),
                    lte: new Date(`${yearNum}-12-31`)
                }
            },
            _count: {
                ma_kiem_ke: true
            }
        });
        
        // Get top 5 warehouses by number of checks
        const topWarehouses = await prisma.inventory_check.groupBy({
            by: ['ten_kho'],
            where: { nam: yearNum },
            _count: {
                ma_kiem_ke: true
            },
            orderBy: {
                _count: {
                    ma_kiem_ke: 'desc'
                }
            },
            take: 5
        });
        
        // Get top 5 users by number of checks
        const topUsers = await prisma.inventory_check.groupBy({
            by: ['nguoi_kiem_ke'],
            where: { nam: yearNum },
            _count: {
                ma_kiem_ke: true
            },
            orderBy: {
                _count: {
                    ma_kiem_ke: 'desc'
                }
            },
            take: 5
        });
        
        // Get recent 5 checks
        const recentChecks = await prisma.inventory_check.findMany({
            where: { nam: yearNum },
            orderBy: { ngay_thuc_hien_kiem_ke: 'desc' },
            take: 5,
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                },
                warehouse: {
                    select: {
                        ma_kho: true,
                        ten_kho: true
                    }
                }
            }
        });
        
        // Format monthly data
        const monthlyData = Array(12).fill(0).map((_, i) => {
            const month = i + 1;
            const monthData = monthlyChecks.find(stat => stat.ngay_thuc_hien_kiem_ke.month === month);
            return {
                month,
                count: monthData?._count.ma_kiem_ke || 0
            };
        });
        
        // Get warehouse names for top warehouses
        const warehouseDetails = await Promise.all(
            topWarehouses.map(async (item) => {
                if (!item.ten_kho) {
                    return {
                        ma_kho: null,
                        ten_kho: 'Không xác định',
                        count: item._count.ma_kiem_ke
                    };
                }
                
                const warehouse = await prisma.warehouse.findUnique({
                    where: { ma_kho: item.ten_kho },
                    select: { ma_kho: true, ten_kho: true }
                });
                
                return {
                    ma_kho: item.ten_kho,
                    ten_kho: warehouse?.ten_kho || 'Không xác định',
                    count: item._count.ma_kiem_ke
                };
            })
        );
        
        // Get user names for top users
        const userDetails = await Promise.all(
            topUsers.map(async (item) => {
                if (!item.nguoi_kiem_ke) {
                    return {
                        ma_nguoi_dung: null,
                        ho_va_ten: 'Không xác định',
                        count: item._count.ma_kiem_ke
                    };
                }
                
                const user = await prisma.accounts.findUnique({
                    where: { ma_nguoi_dung: item.nguoi_kiem_ke },
                    select: { ma_nguoi_dung: true, ho_va_ten: true }
                });
                
                return {
                    ma_nguoi_dung: item.nguoi_kiem_ke,
                    ho_va_ten: user?.ho_va_ten || 'Không xác định',
                    count: item._count.ma_kiem_ke
                };
            })
        );
        
        res.json({
            success: true,
            message: "Lấy thống kê kiểm kê kho hàng thành công",
            data: {
                totalChecks,
                discrepancyChecks,
                discrepancyPercentage: parseFloat(discrepancyPercentage.toFixed(2)),
                discrepancySum: discrepancySum._sum.chenh_lech || 0,
                monthlyData,
                topWarehouses: warehouseDetails,
                topUsers: userDetails,
                recentChecks
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê kiểm kê kho hàng",
            error: error.message
        });
    }
};

// Setup multer for file upload
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

// Import inventory checks from Excel
export const importInventoryChecksFromExcel = async (req, res) => {
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
        const maxSttResult = await prisma.inventory_check.aggregate({
            _max: {
                stt: true
            }
        });
        
        let nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Process each record in Excel file
        for (const [index, item] of data.entries()) {
            try {
                // Check required fields
                if (!item['Mã kiểm kê'] || !item['Năm'] || !item['Số lượng thực tế'] || !item['Ngày thực hiện kiểm kê']) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: "Thiếu thông tin bắt buộc: Mã kiểm kê, Năm, Số lượng thực tế, Ngày thực hiện kiểm kê"
                    });
                    continue;
                }
                
                // Check if inventory check already exists
                const existingCheck = await prisma.inventory_check.findUnique({
                    where: { ma_kiem_ke: item['Mã kiểm kê'] }
                });
                
                if (existingCheck) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: `Kiểm kê kho hàng với mã ${item['Mã kiểm kê']} đã tồn tại`
                    });
                    continue;
                }
                
                // Validate product reference if provided
                if (item['Mã hàng']) {
                    const product = await prisma.products.findFirst({
                        where: { ma_hang: item['Mã hàng'] }
                    });
                    
                    if (!product) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Sản phẩm với mã ${item['Mã hàng']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                // Validate warehouse reference if provided
                if (item['Mã kho']) {
                    const warehouse = await prisma.warehouse.findUnique({
                        where: { ma_kho: item['Mã kho'] }
                    });
                    
                    if (!warehouse) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Kho với mã ${item['Mã kho']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                // Validate inventory reference if provided
                if (item['Mã inventory']) {
                    const inventory = await prisma.inventory.findUnique({
                        where: { ma_inventory: item['Mã inventory'] }
                    });
                    
                    if (!inventory) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Dữ liệu kho hàng với mã ${item['Mã inventory']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                // Validate user reference if provided
                if (item['Người kiểm kê']) {
                    const user = await prisma.accounts.findUnique({
                        where: { ma_nguoi_dung: item['Người kiểm kê'] }
                    });
                    
                    if (!user) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Người dùng với mã ${item['Người kiểm kê']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                // Get system quantity from inventory if provided
                let systemQuantity = 0;
                if (item['Mã inventory']) {
                    const inventory = await prisma.inventory.findUnique({
                        where: { ma_inventory: item['Mã inventory'] }
                    });
                    systemQuantity = inventory ? inventory.ton_hien_tai : 0;
                }
                
                // Calculate difference
                const actualQuantity = parseInt(item['Số lượng thực tế']);
                const difference = actualQuantity - systemQuantity;
                
                // Create inventory check
                const inventoryCheck = await prisma.inventory_check.create({
                    data: {
                        stt: nextStt++,
                        ma_kiem_ke: item['Mã kiểm kê'],
                        nam: parseInt(item['Năm']),
                        ma_hang: item['Mã hàng'] || null,
                        ten_kho: item['Mã kho'] || null,
                        so_luong_he_thong_ghi_nhan: item['Mã inventory'] || null,
                        so_luong_thuc_te: actualQuantity,
                        chenh_lech: difference,
                        ngay_thuc_hien_kiem_ke: new Date(item['Ngày thực hiện kiểm kê']),
                        nguoi_kiem_ke: item['Người kiểm kê'] || null,
                        ghi_chu: item['Ghi chú'] || null
                    }
                });
                
                // Update warehouse last check date
                if (item['Mã kho']) {
                    await prisma.warehouse.update({
                        where: { ma_kho: item['Mã kho'] },
                        data: {
                            ngay_kiem_ke_gan_nhat: new Date(item['Ngày thực hiện kiểm kê'])
                        }
                    });
                }
                
                results.success.push(inventoryCheck);
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
            message: `Import thành công ${results.success.length} kiểm kê kho hàng, thất bại ${results.errors.length} kiểm kê kho hàng`,
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
            message: "Lỗi khi import kiểm kê kho hàng từ Excel",
            error: error.message
        });
    }
};

// Generate template Excel file for inventory checks
export const generateInventoryCheckTemplate = (req, res) => {
    try {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        
        // Define columns
        const headers = [
            'Mã kiểm kê',
            'Năm',
            'Mã hàng',
            'Mã kho',
            'Mã inventory',
            'Số lượng thực tế',
            'Ngày thực hiện kiểm kê',
            'Người kiểm kê',
            'Ghi chú'
        ];
        
        // Create a sample row
        const sampleData = [{
            'Mã kiểm kê': 'KK-SP001-K001-2025',
            'Năm': 2025,
            'Mã hàng': 'SP001',
            'Mã kho': 'K001',
            'Mã inventory': 'INV-SP001-K001-2025',
            'Số lượng thực tế': 75,
            'Ngày thực hiện kiểm kê': '2025-04-25',
            'Người kiểm kê': 'USER001',
            'Ghi chú': 'Kiểm kê định kỳ hàng quý'
        }];
        
        // Create worksheet with data
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        
        // Add column widths
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Kiểm kê kho hàng');
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory_check_template.xlsx');
        
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