import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Get all stock entries with pagination and filtering
export const getAllStockIn = async (req, res) => {
    try {
        const { 
            page, 
            limit, 
            sortBy = 'ngay_nhap_hang', 
            sortDir = 'desc',
            product = '',
            warehouse = '',
            supplier = '',
            contract = '',
            bill = '',
            startDate = '',
            endDate = '',
            all = 'false'
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (product) where.ma_hang = product;
        if (warehouse) where.ten_kho = warehouse;
        if (supplier) where.ten_nha_cung_cap = supplier;
        if (contract) where.ma_hop_dong = contract;
        if (bill) where.ma_bill = bill;
        
        // Date filter
        if (startDate || endDate) {
            where.ngay_nhap_hang = {};
            if (startDate) where.ngay_nhap_hang.gte = new Date(startDate);
            if (endDate) where.ngay_nhap_hang.lte = new Date(endDate);
        }
        
        // Get total count for pagination
        const totalCount = await prisma.stock_in.count({ where });
        
        // Determine if we should return all records
        const returnAll = all === 'true';
        
        // Configure pagination if not returning all
        const paginationConfig = {};
        if (!returnAll) {
            const pageNum = parseInt(page || 1);
            const limitNum = parseInt(limit || 100);
            paginationConfig.skip = (pageNum - 1) * limitNum;
            paginationConfig.take = limitNum;
        }
        
        // Fetch stock entries
        const stockEntries = await prisma.stock_in.findMany({
            where,
            ...paginationConfig,
            orderBy,
            include: {
                bills: {
                    select: {
                        ma_bill: true,
                        ngay_cap_nhat: true
                    }
                },
                contracts: {
                    select: {
                        so_hop_dong: true,
                        ngay_ky_hop_dong: true,
                        gia_tri_hop_dong: true
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
        
        // Get unique product IDs from stock entries
        const productIds = [...new Set(stockEntries.map(entry => entry.ma_hang).filter(Boolean))];
        
        const products = await prisma.products.findMany({
            where: {
                ma_hang: {
                    in: productIds
                }
            },
            select: {
                ma_hang: true,
                ten_hang: true,
                don_vi_ban_hang: true,
                gia_thuc: true,
                // Include product_type relation
                product_type: {
                    select: {
                        ma_loai_hang: true,
                        ten_loai_hang: true,
                        mo_ta: true,
                        trang_thai: true
                    }
                },
                // Add supplier information inside the product
                suppliers: {
                    select: {
                        ma_nha_cung_cap: true,
                        ten_nha_cung_cap: true,
                        dia_chi: true,
                        so_dien_thoai: true
                    }
                }
            }
        });    
        // Create a lookup map for quick access to product data
        const productMap = {};
        products.forEach(product => {
            productMap[product.ma_hang] = product;
        });
        
        // Add product data to stock entries
        const stockEntriesWithProducts = stockEntries.map(entry => {
            return {
                ...entry,
                product: entry.ma_hang ? productMap[entry.ma_hang] || null : null
            };
        });
        
        // Prepare response
        const response = {
            success: true,
            message: "Lấy danh sách nhập kho thành công",
            data: stockEntriesWithProducts
        };
        
        // Add pagination data if not returning all
        if (!returnAll) {
            const pageNum = parseInt(page || 1);
            const limitNum = parseInt(limit || 100);
            response.pagination = {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalCount / limitNum)
            };
        } else {
            response.total = totalCount;
        }
        
        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách nhập kho",
            error: error.message
        });
    }
};
// Update getStockInById to include product with suppliers
export const getStockInById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const stockEntry = await prisma.stock_in.findUnique({
            where: { ma_stock_in: id },
            include: {
                bills: true,
                contracts: true,
                warehouse: true,
                suppliers: true
            }
        });
        
        if (!stockEntry) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu nhập kho"
            });
        }
        
        // Fetch product details if ma_hang exists
        let productData = null;
        if (stockEntry.ma_hang) {
            productData = await prisma.products.findFirst({
                where: { ma_hang: stockEntry.ma_hang },
                select: {
                    ma_hang: true,
                    ten_hang: true,
                    don_vi_ban_hang: true,
                    gia_thuc: true,
                    product_type: {
                        select: {
                            ma_loai_hang: true,
                            ten_loai_hang: true,
                            mo_ta: true,
                            trang_thai: true
                        }
                    },
                    suppliers: {
                        select: {
                            ma_nha_cung_cap: true,
                            ten_nha_cung_cap: true,
                            dia_chi: true,
                            so_dien_thoai: true
                        }
                    }
                }
            });
        }
        
        // Add product data to response
        const stockEntryWithProduct = {
            ...stockEntry,
            product: productData
        };
        
        res.json({
            success: true,
            message: "Lấy thông tin phiếu nhập kho thành công",
            data: stockEntryWithProduct
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin phiếu nhập kho",
            error: error.message
        });
    }
};
// Create new stock entry
export const createStockIn = async (req, res) => {
    try {
        const {
            ma_stock_in,
            ma_hang,
            ngay_nhap_hang,
            so_luong_nhap,
            ten_nha_cung_cap,
            ten_kho,
            ma_bill,
            ma_hop_dong
        } = req.body;
        
        // Validate required fields
        if (!ma_stock_in || !ngay_nhap_hang || !so_luong_nhap) {
            return res.status(400).json({
                success: false,
                message: "Mã nhập kho, ngày nhập hàng và số lượng nhập là bắt buộc"
            });
        }
        
        // Check if stock entry with this ID already exists
        const existingStockIn = await prisma.stock_in.findUnique({
            where: { ma_stock_in }
        });
        
        if (existingStockIn) {
            return res.status(400).json({
                success: false,
                message: `Phiếu nhập kho với mã ${ma_stock_in} đã tồn tại`
            });
        }
        
        // Validate references
        if (ten_nha_cung_cap) {
            const supplier = await prisma.suppliers.findUnique({
                where: { ma_nha_cung_cap: ten_nha_cung_cap }
            });
            
            if (!supplier) {
                return res.status(400).json({
                    success: false,
                    message: `Nhà cung cấp với mã ${ten_nha_cung_cap} không tồn tại`
                });
            }
        }
        
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
        
        if (ma_bill) {
            const bill = await prisma.bills.findUnique({
                where: { ma_bill }
            });
            
            if (!bill) {
                return res.status(400).json({
                    success: false,
                    message: `Bill với mã ${ma_bill} không tồn tại`
                });
            }
        }
        
        if (ma_hop_dong) {
            const contract = await prisma.contracts.findUnique({
                where: { so_hop_dong: ma_hop_dong }
            });
            
            if (!contract) {
                return res.status(400).json({
                    success: false,
                    message: `Hợp đồng với mã ${ma_hop_dong} không tồn tại`
                });
            }
        }
        
        // Get the highest stt value
        const maxSttResult = await prisma.stock_in.aggregate({
            _max: {
                stt: true
            }
        });
        
        const nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Create stock entry
        const stockEntry = await prisma.stock_in.create({
            data: {
                stt: nextStt,
                ma_stock_in,
                ma_hang,
                ngay_nhap_hang: new Date(ngay_nhap_hang),
                so_luong_nhap: parseInt(so_luong_nhap),
                ten_nha_cung_cap,
                ten_kho,
                ma_bill,
                ma_hop_dong
            }
        });
        
        // Update inventory if warehouse is specified
        if (ten_kho && ma_hang) {
            try {
                // Check if inventory record exists for this product and warehouse
                const existingInventory = await prisma.inventory.findFirst({
                    where: {
                        ma_hang,
                        ten_kho
                    }
                });
                
                const currentYear = new Date().getFullYear();
                
                if (existingInventory) {
                    // Update existing inventory
                    await prisma.inventory.update({
                        where: {
                            ma_inventory: existingInventory.ma_inventory
                        },
                        data: {
                            tong_nhap: existingInventory.tong_nhap + parseInt(so_luong_nhap),
                            ton_hien_tai: existingInventory.ton_hien_tai + parseInt(so_luong_nhap)
                        }
                    });
                } else {
                    // Create new inventory entry
                    const newInventoryId = `INV-${ma_hang}-${ten_kho}-${currentYear}`;
                    
                    await prisma.inventory.create({
                        data: {
                            ma_inventory: newInventoryId,
                            nam: currentYear,
                            ma_hang,
                            ten_kho,
                            ton_truoc_do: 0,
                            tong_nhap: parseInt(so_luong_nhap),
                            tong_xuat: 0,
                            ton_hien_tai: parseInt(so_luong_nhap),
                            muc_ton_toi_thieu: 0
                        }
                    });
                }
                
                console.log(`Inventory updated for product ${ma_hang} in warehouse ${ten_kho}`);
            } catch (inventoryError) {
                console.error('Error updating inventory:', inventoryError);
                // Continue with the response even if inventory update fails
            }
        }
        
        res.status(201).json({
            success: true,
            message: "Tạo phiếu nhập kho thành công",
            data: stockEntry
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo phiếu nhập kho",
            error: error.message
        });
    }
};

// Update stock entry
export const updateStockIn = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ma_hang,
            ngay_nhap_hang,
            so_luong_nhap,
            ten_nha_cung_cap,
            ten_kho,
            ma_bill,
            ma_hop_dong
        } = req.body;
        
        // Check if stock entry exists
        const existingStockIn = await prisma.stock_in.findUnique({
            where: { ma_stock_in: id }
        });
        
        if (!existingStockIn) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu nhập kho"
            });
        }
        
        // Calculate the difference in quantity to update inventory
        const quantityDifference = so_luong_nhap ? parseInt(so_luong_nhap) - existingStockIn.so_luong_nhap : 0;
        
        // Validate references
        if (ten_nha_cung_cap) {
            const supplier = await prisma.suppliers.findUnique({
                where: { ma_nha_cung_cap: ten_nha_cung_cap }
            });
            
            if (!supplier) {
                return res.status(400).json({
                    success: false,
                    message: `Nhà cung cấp với mã ${ten_nha_cung_cap} không tồn tại`
                });
            }
        }
        
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
        
        if (ma_bill) {
            const bill = await prisma.bills.findUnique({
                where: { ma_bill }
            });
            
            if (!bill) {
                return res.status(400).json({
                    success: false,
                    message: `Bill với mã ${ma_bill} không tồn tại`
                });
            }
        }
        
        if (ma_hop_dong) {
            const contract = await prisma.contracts.findUnique({
                where: { so_hop_dong: ma_hop_dong }
            });
            
            if (!contract) {
                return res.status(400).json({
                    success: false,
                    message: `Hợp đồng với mã ${ma_hop_dong} không tồn tại`
                });
            }
        }
        
        // Update stock entry
        const updatedStockIn = await prisma.stock_in.update({
            where: { ma_stock_in: id },
            data: {
                ma_hang,
                ngay_nhap_hang: ngay_nhap_hang ? new Date(ngay_nhap_hang) : undefined,
                so_luong_nhap: so_luong_nhap ? parseInt(so_luong_nhap) : undefined,
                ten_nha_cung_cap,
                ten_kho,
                ma_bill,
                ma_hop_dong
            }
        });
        
        // Update inventory if quantity changed
        if (quantityDifference !== 0 && (ten_kho || existingStockIn.ten_kho) && (ma_hang || existingStockIn.ma_hang)) {
            const warehouseId = ten_kho || existingStockIn.ten_kho;
            const productId = ma_hang || existingStockIn.ma_hang;
            
            try {
                // If warehouse or product changed, we need to update both old and new inventory
                if ((ten_kho && ten_kho !== existingStockIn.ten_kho) || 
                    (ma_hang && ma_hang !== existingStockIn.ma_hang)) {
                    
                    // Update old inventory (reduce quantity)
                    const oldInventory = await prisma.inventory.findFirst({
                        where: {
                            ma_hang: existingStockIn.ma_hang,
                            ten_kho: existingStockIn.ten_kho
                        }
                    });
                    
                    if (oldInventory) {
                        await prisma.inventory.update({
                            where: {
                                ma_inventory: oldInventory.ma_inventory
                            },
                            data: {
                                tong_nhap: oldInventory.tong_nhap - existingStockIn.so_luong_nhap,
                                ton_hien_tai: oldInventory.ton_hien_tai - existingStockIn.so_luong_nhap
                            }
                        });
                    }
                    
                    // Update new inventory (add quantity)
                    const newInventory = await prisma.inventory.findFirst({
                        where: {
                            ma_hang: productId,
                            ten_kho: warehouseId
                        }
                    });
                    
                    const currentYear = new Date().getFullYear();
                    
                    if (newInventory) {
                        await prisma.inventory.update({
                            where: {
                                ma_inventory: newInventory.ma_inventory
                            },
                            data: {
                                tong_nhap: newInventory.tong_nhap + parseInt(so_luong_nhap),
                                ton_hien_tai: newInventory.ton_hien_tai + parseInt(so_luong_nhap)
                            }
                        });
                    } else {
                        // Create new inventory entry
                        const newInventoryId = `INV-${productId}-${warehouseId}-${currentYear}`;
                        
                        await prisma.inventory.create({
                            data: {
                                ma_inventory: newInventoryId,
                                nam: currentYear,
                                ma_hang: productId,
                                ten_kho: warehouseId,
                                ton_truoc_do: 0,
                                tong_nhap: parseInt(so_luong_nhap),
                                tong_xuat: 0,
                                ton_hien_tai: parseInt(so_luong_nhap),
                                muc_ton_toi_thieu: 0
                            }
                        });
                    }
                } else {
                    // Only quantity changed, update the inventory
                    const inventory = await prisma.inventory.findFirst({
                        where: {
                            ma_hang: productId,
                            ten_kho: warehouseId
                        }
                    });
                    
                    if (inventory) {
                        await prisma.inventory.update({
                            where: {
                                ma_inventory: inventory.ma_inventory
                            },
                            data: {
                                tong_nhap: inventory.tong_nhap + quantityDifference,
                                ton_hien_tai: inventory.ton_hien_tai + quantityDifference
                            }
                        });
                    }
                }
                
                console.log(`Inventory updated for product ${productId} in warehouse ${warehouseId}`);
            } catch (inventoryError) {
                console.error('Error updating inventory:', inventoryError);
                // Continue with the response even if inventory update fails
            }
        }
        
        res.json({
            success: true,
            message: "Cập nhật phiếu nhập kho thành công",
            data: updatedStockIn
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật phiếu nhập kho",
            error: error.message
        });
    }
};

// Delete stock entry
export const deleteStockIn = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if stock entry exists
        const stockEntry = await prisma.stock_in.findUnique({
            where: { ma_stock_in: id }
        });
        
        if (!stockEntry) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu nhập kho"
            });
        }
        
        // Delete stock entry
        await prisma.stock_in.delete({
            where: { ma_stock_in: id }
        });
        
        // Update inventory
        if (stockEntry.ten_kho && stockEntry.ma_hang) {
            try {
                const inventory = await prisma.inventory.findFirst({
                    where: {
                        ma_hang: stockEntry.ma_hang,
                        ten_kho: stockEntry.ten_kho
                    }
                });
                
                if (inventory) {
                    await prisma.inventory.update({
                        where: {
                            ma_inventory: inventory.ma_inventory
                        },
                        data: {
                            tong_nhap: inventory.tong_nhap - stockEntry.so_luong_nhap,
                            ton_hien_tai: inventory.ton_hien_tai - stockEntry.so_luong_nhap
                        }
                    });
                    console.log(`Inventory updated for product ${stockEntry.ma_hang} in warehouse ${stockEntry.ten_kho}`);
                }
            } catch (inventoryError) {
                console.error('Error updating inventory:', inventoryError);
                // Continue with the response even if inventory update fails
            }
        }
        
        res.json({
            success: true,
            message: "Xóa phiếu nhập kho thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa phiếu nhập kho",
            error: error.message
        });
    }
};

// Update getStockInByProduct to include supplier information
export const getStockInByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const stockEntries = await prisma.stock_in.findMany({
            where: { ma_hang: productId },
            include: {
                bills: true,
                contracts: true,
                warehouse: true,
                suppliers: true
            },
            orderBy: { ngay_nhap_hang: 'desc' }
        });
        
        // Get product details with product_type and supplier
        const productData = await prisma.products.findFirst({
            where: { ma_hang: productId },
            select: {
                ma_hang: true,
                ten_hang: true,
                don_vi_ban_hang: true,
                gia_thuc: true,
                product_type: {
                    select: {
                        ma_loai_hang: true,
                        ten_loai_hang: true,
                        mo_ta: true,
                        trang_thai: true
                    }
                },
                suppliers: {
                    select: {
                        ma_nha_cung_cap: true,
                        ten_nha_cung_cap: true,
                        dia_chi: true,
                        so_dien_thoai: true
                    }
                }
            }
        });
        
        // Add product data to each stock entry
        const stockEntriesWithProduct = stockEntries.map(entry => ({
            ...entry,
            product: productData
        }));
        
        res.json({
            success: true,
            message: `Lấy danh sách nhập kho cho sản phẩm ${productId} thành công`,
            data: stockEntriesWithProduct
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách nhập kho theo sản phẩm",
            error: error.message
        });
    }
};
// Get all stock entries for a specific warehouse
export const getStockInByWarehouse = async (req, res) => {
    try {
        const { warehouseId } = req.params;
        
        const stockEntries = await prisma.stock_in.findMany({
            where: { ten_kho: warehouseId },
            include: {
                bills: true,
                contracts: true,
                suppliers: true
            },
            orderBy: { ngay_nhap_hang: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách nhập kho cho kho ${warehouseId} thành công`,
            data: stockEntries
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách nhập kho theo kho",
            error: error.message
        });
    }
};

// Get all stock entries for a specific supplier
export const getStockInBySupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        
        const stockEntries = await prisma.stock_in.findMany({
            where: { ten_nha_cung_cap: supplierId },
            include: {
                bills: true,
                contracts: true,
                warehouse: true
            },
            orderBy: { ngay_nhap_hang: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách nhập kho từ nhà cung cấp ${supplierId} thành công`,
            data: stockEntries
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách nhập kho theo nhà cung cấp",
            error: error.message
        });
    }
};

// Get all stock entries for a specific bill
export const getStockInByBill = async (req, res) => {
    try {
        const { billId } = req.params;
        
        const stockEntries = await prisma.stock_in.findMany({
            where: { ma_bill: billId },
            include: {
                contracts: true,
                warehouse: true,
                suppliers: true
            },
            orderBy: { ngay_nhap_hang: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách nhập kho cho bill ${billId} thành công`,
            data: stockEntries
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách nhập kho theo bill",
            error: error.message
        });
    }
};

// Get all stock entries for a specific contract
export const getStockInByContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        
        const stockEntries = await prisma.stock_in.findMany({
            where: { ma_hop_dong: contractId },
            include: {
                bills: true,
                warehouse: true,
                suppliers: true
            },
            orderBy: { ngay_nhap_hang: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách nhập kho cho hợp đồng ${contractId} thành công`,
            data: stockEntries
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách nhập kho theo hợp đồng",
            error: error.message
        });
    }
};

// Get stock-in statistics
export const getStockInStats = async (req, res) => {
    try {
        // Count total stock entries
        const totalStockIn = await prisma.stock_in.count();
        
        // Count entries in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentStockIn = await prisma.stock_in.count({
            where: {
                ngay_nhap_hang: {
                    gte: thirtyDaysAgo
                }
            }
        });
        
        // Get total quantity received
        const totalQuantity = await prisma.stock_in.aggregate({
            _sum: {
                so_luong_nhap: true
            }
        });
        
        // Get top 5 suppliers by quantity
        const topSuppliers = await prisma.stock_in.groupBy({
            by: ['ten_nha_cung_cap'],
            _sum: {
                so_luong_nhap: true
            },
            orderBy: {
                _sum: {
                    so_luong_nhap: 'desc'
                }
            },
            take: 5
        });
        
        // Get top 5 warehouses by quantity
        const topWarehouses = await prisma.stock_in.groupBy({
            by: ['ten_kho'],
            _sum: {
                so_luong_nhap: true
            },
            orderBy: {
                _sum: {
                    so_luong_nhap: 'desc'
                }
            },
            take: 5
        });
        
        // Get monthly statistics for the current year
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);
        
        const monthlyStats = await prisma.stock_in.groupBy({
            by: [
                {
                    ngay_nhap_hang: {
                        month: true
                    }
                }
            ],
            where: {
                ngay_nhap_hang: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            },
            _sum: {
                so_luong_nhap: true
            },
            _count: {
                ma_stock_in: true
            }
        });
        
        // Get supplier names for top suppliers
        const supplierDetails = await Promise.all(
            topSuppliers.map(async (item) => {
                if (!item.ten_nha_cung_cap) {
                    return {
                        ten_nha_cung_cap: null,
                        ten_nha_cung_cap_day_du: 'Không xác định',
                        quantity: item._sum.so_luong_nhap
                    };
                }
                
                const supplier = await prisma.suppliers.findUnique({
                    where: { ma_nha_cung_cap: item.ten_nha_cung_cap },
                    select: { ten_nha_cung_cap: true }
                });
                
                return {
                    ten_nha_cung_cap: item.ten_nha_cung_cap,
                    ten_nha_cung_cap_day_du: supplier?.ten_nha_cung_cap || 'Không xác định',
                    quantity: item._sum.so_luong_nhap
                };
            })
        );
        
        // Get warehouse names for top warehouses
        const warehouseDetails = await Promise.all(
            topWarehouses.map(async (item) => {
                if (!item.ten_kho) {
                    return {
                        ten_kho: null,
                        ten_kho_day_du: 'Không xác định',
                        quantity: item._sum.so_luong_nhap
                    };
                }
                
                const warehouse = await prisma.warehouse.findUnique({
                    where: { ma_kho: item.ten_kho },
                    select: { ten_kho: true }
                });
                
                return {
                    ten_kho: item.ten_kho,
                    ten_kho_day_du: warehouse?.ten_kho || 'Không xác định',
                    quantity: item._sum.so_luong_nhap
                };
            })
        );
        
        // Format monthly data
        const monthlyData = Array(12).fill(0).map((_, i) => {
            const month = i + 1;
            const monthData = monthlyStats.find(stat => stat.ngay_nhap_hang.month === month);
            return {
                month,
                quantity: monthData?._sum.so_luong_nhap || 0,
                count: monthData?._count.ma_stock_in || 0
            };
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê nhập kho thành công",
            data: {
                totalStockIn,
                recentStockIn,
                totalQuantity: totalQuantity._sum.so_luong_nhap || 0,
                topSuppliers: supplierDetails,
                topWarehouses: warehouseDetails,
                monthlyData
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê nhập kho",
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

// Import stock-in entries from Excel
export const importStockInFromExcel = async (req, res) => {
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
        const maxSttResult = await prisma.stock_in.aggregate({
            _max: {
                stt: true
            }
        });
        
        let nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Process each record in Excel file
        for (const [index, item] of data.entries()) {
            try {
                // Check required fields
                if (!item['Mã nhập kho'] || !item['Ngày nhập hàng'] || !item['Số lượng nhập']) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: "Thiếu thông tin bắt buộc: Mã nhập kho, Ngày nhập hàng, Số lượng nhập"
                    });
                    continue;
                }
                
                // Check if stock entry already exists
                const existingStockIn = await prisma.stock_in.findUnique({
                    where: { ma_stock_in: item['Mã nhập kho'] }
                });
                
                if (existingStockIn) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: `Phiếu nhập kho với mã ${item['Mã nhập kho']} đã tồn tại`
                    });
                    continue;
                }
                
                // Validate references
                if (item['Nhà cung cấp']) {
                    const supplier = await prisma.suppliers.findUnique({
                        where: { ma_nha_cung_cap: item['Nhà cung cấp'] }
                    });
                    
                    if (!supplier) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Nhà cung cấp với mã ${item['Nhà cung cấp']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                if (item['Kho']) {
                    const warehouse = await prisma.warehouse.findUnique({
                        where: { ma_kho: item['Kho'] }
                    });
                    
                    if (!warehouse) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Kho với mã ${item['Kho']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                if (item['Bill']) {
                    const bill = await prisma.bills.findUnique({
                        where: { ma_bill: item['Bill'] }
                    });
                    
                    if (!bill) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Bill với mã ${item['Bill']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                if (item['Hợp đồng']) {
                    const contract = await prisma.contracts.findUnique({
                        where: { so_hop_dong: item['Hợp đồng'] }
                    });
                    
                    if (!contract) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Hợp đồng với mã ${item['Hợp đồng']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                // Create stock entry
                const stockEntry = await prisma.stock_in.create({
                    data: {
                        stt: nextStt++,
                        ma_stock_in: item['Mã nhập kho'],
                        ma_hang: item['Mã hàng'] || null,
                        ngay_nhap_hang: new Date(item['Ngày nhập hàng']),
                        so_luong_nhap: parseInt(item['Số lượng nhập']),
                        ten_nha_cung_cap: item['Nhà cung cấp'] || null,
                        ten_kho: item['Kho'] || null,
                        ma_bill: item['Bill'] || null,
                        ma_hop_dong: item['Hợp đồng'] || null
                    }
                });
                
                // Update inventory if warehouse and product are specified
                if (item['Kho'] && item['Mã hàng']) {
                    try {
                        // Check if inventory record exists for this product and warehouse
                        const existingInventory = await prisma.inventory.findFirst({
                            where: {
                                ma_hang: item['Mã hàng'],
                                ten_kho: item['Kho']
                            }
                        });
                        
                        const currentYear = new Date().getFullYear();
                        
                        if (existingInventory) {
                            // Update existing inventory
                            await prisma.inventory.update({
                                where: {
                                    ma_inventory: existingInventory.ma_inventory
                                },
                                data: {
                                    tong_nhap: existingInventory.tong_nhap + parseInt(item['Số lượng nhập']),
                                    ton_hien_tai: existingInventory.ton_hien_tai + parseInt(item['Số lượng nhập'])
                                }
                            });
                        } else {
                            // Create new inventory entry
                            const newInventoryId = `INV-${item['Mã hàng']}-${item['Kho']}-${currentYear}`;
                            
                            await prisma.inventory.create({
                                data: {
                                    ma_inventory: newInventoryId,
                                    nam: currentYear,
                                    ma_hang: item['Mã hàng'],
                                    ten_kho: item['Kho'],
                                    ton_truoc_do: 0,
                                    tong_nhap: parseInt(item['Số lượng nhập']),
                                    tong_xuat: 0,
                                    ton_hien_tai: parseInt(item['Số lượng nhập']),
                                    muc_ton_toi_thieu: 0
                                }
                            });
                        }
                    } catch (inventoryError) {
                        console.error('Error updating inventory:', inventoryError);
                    }
                }
                
                results.success.push(stockEntry);
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
            message: `Import thành công ${results.success.length} phiếu nhập kho, thất bại ${results.errors.length} phiếu nhập kho`,
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
            message: "Lỗi khi import phiếu nhập kho từ Excel",
            error: error.message
        });
    }
};

// Generate template Excel file for stock-in
export const generateStockInTemplate = (req, res) => {
    try {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        
        // Define columns
        const headers = [
            'Mã nhập kho',
            'Mã hàng',
            'Ngày nhập hàng',
            'Số lượng nhập',
            'Nhà cung cấp',
            'Kho',
            'Bill',
            'Hợp đồng'
        ];
        
        // Create a sample row
        const sampleData = [{
            'Mã nhập kho': 'SI001',
            'Mã hàng': 'SP001',
            'Ngày nhập hàng': '2025-04-22',
            'Số lượng nhập': 100,
            'Nhà cung cấp': 'NCC001',
            'Kho': 'K001',
            'Bill': 'BILL001',
            'Hợp đồng': 'HD001'
        }];
        
        // Create worksheet with data
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        
        // Add column widths
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Nhập kho');
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=stock_in_template.xlsx');
        
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