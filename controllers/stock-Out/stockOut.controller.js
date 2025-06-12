import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Get all stock-out entries with pagination and filtering
// Get all stock-out entries without pagination limits
export const getAllStockOut = async (req, res) => {
    try {
        const { 
            sortBy = 'ngay_xuat_hang', 
            sortDir = 'desc',
            product = '',
            warehouse = '',
            customer = '',
            responsible = '',
            startDate = '',
            endDate = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (product) where.ma_hang = product;
        if (warehouse) where.ten_kho = warehouse;
        if (customer) where.ten_khach_hang = customer;
        if (responsible) where.nguoi_phu_trach = responsible;
        
        // Date filter
        if (startDate || endDate) {
            where.ngay_xuat_hang = {};
            if (startDate) where.ngay_xuat_hang.gte = new Date(startDate);
            if (endDate) where.ngay_xuat_hang.lte = new Date(endDate);
        }
        
        // Get total count for metadata
        const totalCount = await prisma.stock_out.count({ where });
        
        // Fetch ALL stock out entries without pagination limits
        const stockOutEntries = await prisma.stock_out.findMany({
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
                customers: {
                    select: {
                        ma_khach_hang: true,
                        ten_khach_hang: true,
                        email: true,
                        so_dien_thoai: true
                    }
                },
                warehouse: {
                    select: {
                        ma_kho: true,
                        ten_kho: true,
                        vi_tri_kho: true
                    }
                }
            }
        });
        
        // Get unique product IDs from stock entries
        const productIds = [...new Set(stockOutEntries.map(entry => entry.ma_hang).filter(Boolean))];
        
        // Fetch product details for all products in a single query
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
                }
            }
        });
        
        // Create a lookup map for quick access to product data
        const productMap = {};
        products.forEach(product => {
            productMap[product.ma_hang] = product;
        });
        
        // Add product data to stock entries
        const stockOutEntriesWithProducts = stockOutEntries.map(entry => {
            return {
                ...entry,
                product: entry.ma_hang ? productMap[entry.ma_hang] || null : null
            };
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách xuất kho thành công",
            data: stockOutEntriesWithProducts,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách xuất kho",
            error: error.message
        });
    }
};
// Get stock-out entry by ID
export const getStockOutById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const stockOutEntry = await prisma.stock_out.findUnique({
            where: { ma_stock_out: id },
            include: {
                accounts: true,
                customers: true,
                warehouse: true
            }
        });
        
        if (!stockOutEntry) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu xuất kho"
            });
        }
        
        // Fetch product details if ma_hang exists
        let productData = null;
        if (stockOutEntry.ma_hang) {
            const product = await prisma.products.findFirst({
                where: { ma_hang: stockOutEntry.ma_hang },
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
            
            productData = product || null;
        }
        
        // Add product data to response
        const stockOutWithProduct = {
            ...stockOutEntry,
            product: productData
        };
        
        res.json({
            success: true,
            message: "Lấy thông tin phiếu xuất kho thành công",
            data: stockOutWithProduct
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin phiếu xuất kho",
            error: error.message
        });
    }
};
// Create new stock-out entry
export const createStockOut = async (req, res) => {
    try {
        const {
            ma_stock_out,
            ma_hang,
            ngay_xuat_hang,
            so_luong_xuat,
            ten_kho,
            ten_khach_hang,
            nguoi_phu_trach
        } = req.body;
        
        // Validate required fields
        if (!ma_stock_out || !ngay_xuat_hang || !so_luong_xuat) {
            return res.status(400).json({
                success: false,
                message: "Mã xuất kho, ngày xuất hàng, và số lượng xuất là bắt buộc"
            });
        }
        
        // Check if stock-out entry with this ID already exists
        const existingStockOut = await prisma.stock_out.findUnique({
            where: { ma_stock_out }
        });
        
        if (existingStockOut) {
            return res.status(400).json({
                success: false,
                message: `Phiếu xuất kho với mã ${ma_stock_out} đã tồn tại`
            });
        }
        
        // Validate references
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
        
        if (ten_khach_hang) {
            const customer = await prisma.customers.findUnique({
                where: { ma_khach_hang: ten_khach_hang }
            });
            
            if (!customer) {
                return res.status(400).json({
                    success: false,
                    message: `Khách hàng với mã ${ten_khach_hang} không tồn tại`
                });
            }
        }
        
        if (nguoi_phu_trach) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: `Tài khoản với mã ${nguoi_phu_trach} không tồn tại`
                });
            }
        }
        
        // Check inventory availability - IMPROVED VERSION
        if (ten_kho && ma_hang) {
            // Find ALL inventory records for this product in this warehouse
            const inventoryRecords = await prisma.inventory.findMany({
                where: {
                    ma_hang,
                    ten_kho
                }
            });
            
            if (inventoryRecords.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Không tìm thấy hàng ${ma_hang} trong kho ${ten_kho}`
                });
            }
            
            // Calculate total inventory across all records
            // In the createStockOut function, replace the inventory check with this:
            // Calculate total inventory across all records
            const totalInventory = inventoryRecords.reduce((sum, record) => sum + record.ton_hien_tai, 0);
            console.log(`Total inventory for product ${ma_hang} in warehouse ${ten_kho}: ${totalInventory}`);

            // Remove the restriction, just log a warning
            if (totalInventory < parseInt(so_luong_xuat)) {
                console.log(`Warning: Stock out quantity (${so_luong_xuat}) exceeds available inventory (${totalInventory}) for product ${ma_hang}`);
                // Note: We're allowing the operation to proceed even with insufficient inventory
            }

            // Sort inventory records by year (newest first)
            inventoryRecords.sort((a, b) => b.nam);
            
            // Get the highest stt value for stock_out
            const maxSttResult = await prisma.stock_out.aggregate({
                _max: {
                    stt: true
                }
            });
            
            const nextStt = (maxSttResult._max.stt || 0) + 1;
            
            // Create stock-out entry
            const stockOutEntry = await prisma.stock_out.create({
                data: {
                    stt: nextStt,
                    ma_stock_out,
                    ma_hang,
                    ngay_xuat_hang: new Date(ngay_xuat_hang),
                    so_luong_xuat: parseInt(so_luong_xuat),
                    ten_kho,
                    ten_khach_hang,
                    nguoi_phu_trach
                }
            });
            
            // Distribute the outgoing quantity across inventory records
            let remainingQuantity = parseInt(so_luong_xuat);
            
            for (const inventory of inventoryRecords) {
                if (remainingQuantity <= 0) break;
                
                const quantityToDeduct = Math.min(remainingQuantity, inventory.ton_hien_tai);
                
                // Update this inventory record
                await prisma.inventory.update({
                    where: { ma_inventory: inventory.ma_inventory },
                    data: {
                        tong_xuat: {
                            increment: quantityToDeduct
                        },
                        ton_hien_tai: {
                            decrement: quantityToDeduct
                        }
                    }
                });
                
                remainingQuantity -= quantityToDeduct;
            }
            
            res.status(201).json({
                success: true,
                message: "Tạo phiếu xuất kho thành công",
                data: stockOutEntry
            });
            return;
        }
        
        // If no warehouse or product specified, just create the record without updating inventory
        // Get the highest stt value
        const maxSttResult = await prisma.stock_out.aggregate({
            _max: {
                stt: true
            }
        });
        
        const nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Create stock-out entry
        const stockOutEntry = await prisma.stock_out.create({
            data: {
                stt: nextStt,
                ma_stock_out,
                ma_hang,
                ngay_xuat_hang: new Date(ngay_xuat_hang),
                so_luong_xuat: parseInt(so_luong_xuat),
                ten_kho,
                ten_khach_hang,
                nguoi_phu_trach
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo phiếu xuất kho thành công",
            data: stockOutEntry
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo phiếu xuất kho",
            error: error.message
        });
    }
};
// Update stock-out entry
export const updateStockOut = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ma_hang,
            ngay_xuat_hang,
            so_luong_xuat,
            ten_kho,
            ten_khach_hang,
            nguoi_phu_trach
        } = req.body;
        
        // Check if stock-out entry exists
        const existingStockOut = await prisma.stock_out.findUnique({
            where: { ma_stock_out: id }
        });
        
        if (!existingStockOut) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu xuất kho"
            });
        }
        
        // Calculate quantity difference for inventory update
        const quantityDifference = so_luong_xuat ? parseInt(so_luong_xuat) - existingStockOut.so_luong_xuat : 0;
        
        // Validate references
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
        
        if (ten_khach_hang) {
            const customer = await prisma.customers.findUnique({
                where: { ma_khach_hang: ten_khach_hang }
            });
            
            if (!customer) {
                return res.status(400).json({
                    success: false,
                    message: `Khách hàng với mã ${ten_khach_hang} không tồn tại`
                });
            }
        }
        
        if (nguoi_phu_trach) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: `Tài khoản với mã ${nguoi_phu_trach} không tồn tại`
                });
            }
        }
        
        // Check inventory if quantity is increasing
        if (quantityDifference > 0 && (ten_kho || existingStockOut.ten_kho) && (ma_hang || existingStockOut.ma_hang)) {
            const warehouseId = ten_kho || existingStockOut.ten_kho;
            const productId = ma_hang || existingStockOut.ma_hang;
            
            const inventory = await prisma.inventory.findFirst({
                where: {
                    ma_hang: productId,
                    ten_kho: warehouseId
                }
            });
            
            if (!inventory) {
                return res.status(400).json({
                    success: false,
                    message: `Không tìm thấy hàng ${productId} trong kho ${warehouseId}`
                });
            }
            
            if (inventory.ton_hien_tai < quantityDifference) {
                console.log(`Warning: Updated stock out quantity (${quantityDifference}) exceeds available inventory (${inventory.ton_hien_tai})`);

            }
        }
        
        // Update stock-out entry
        const updatedStockOut = await prisma.stock_out.update({
            where: { ma_stock_out: id },
            data: {
                ma_hang,
                ngay_xuat_hang: ngay_xuat_hang ? new Date(ngay_xuat_hang) : undefined,
                so_luong_xuat: so_luong_xuat ? parseInt(so_luong_xuat) : undefined,
                ten_kho,
                ten_khach_hang,
                nguoi_phu_trach
            }
        });
        
        // Update inventory if quantity changed or warehouse/product changed
        if ((ten_kho || existingStockOut.ten_kho) && (ma_hang || existingStockOut.ma_hang)) {
            try {
                // If warehouse or product changed, update both old and new inventory
                if ((ten_kho && ten_kho !== existingStockOut.ten_kho) || 
                    (ma_hang && ma_hang !== existingStockOut.ma_hang)) {
                    
                    // Restore old inventory
                    if (existingStockOut.ten_kho && existingStockOut.ma_hang) {
                        await prisma.inventory.updateMany({
                            where: {
                                ma_hang: existingStockOut.ma_hang,
                                ten_kho: existingStockOut.ten_kho
                            },
                            data: {
                                tong_xuat: {
                                    decrement: existingStockOut.so_luong_xuat
                                },
                                ton_hien_tai: {
                                    increment: existingStockOut.so_luong_xuat
                                }
                            }
                        });
                    }
                    
                    // Update new inventory
                    const newProductId = ma_hang || existingStockOut.ma_hang;
                    const newWarehouseId = ten_kho || existingStockOut.ten_kho;
                    const newQuantity = so_luong_xuat ? parseInt(so_luong_xuat) : existingStockOut.so_luong_xuat;
                    
                    // Check if new inventory exists and has enough stock
                    const newInventory = await prisma.inventory.findFirst({
                        where: {
                            ma_hang: newProductId,
                            ten_kho: newWarehouseId
                        }
                    });
                    
                    if (!newInventory) {
                        console.warn(`No inventory found for product ${newProductId} in warehouse ${newWarehouseId}`);
                        // Proceed with the update anyway
                    } else if (newInventory.ton_hien_tai < newQuantity) {
                        // Revert the stock-out update
                        await prisma.stock_out.update({
                            where: { ma_stock_out: id },
                            data: {
                                ma_hang: existingStockOut.ma_hang,
                                ten_kho: existingStockOut.ten_kho,
                                so_luong_xuat: existingStockOut.so_luong_xuat
                            }
                        });
                        
                        return res.status(400).json({
                            success: false,
                            message: `Không đủ hàng trong kho mới. Tồn kho: ${newInventory.ton_hien_tai}, Yêu cầu xuất: ${newQuantity}`
                        });
                    } else {
                        // Update new inventory
                        await prisma.inventory.updateMany({
                            where: {
                                ma_hang: newProductId,
                                ten_kho: newWarehouseId
                            },
                            data: {
                                tong_xuat: {
                                    increment: newQuantity
                                },
                                ton_hien_tai: {
                                    decrement: newQuantity
                                }
                            }
                        });
                    }
                } else if (quantityDifference !== 0) {
                    // Only quantity changed, update inventory accordingly
                    await prisma.inventory.updateMany({
                        where: {
                            ma_hang: existingStockOut.ma_hang,
                            ten_kho: existingStockOut.ten_kho
                        },
                        data: {
                            tong_xuat: {
                                increment: quantityDifference
                            },
                            ton_hien_tai: {
                                decrement: quantityDifference
                            }
                        }
                    });
                }
                
                console.log('Inventory updated successfully');
            } catch (inventoryError) {
                console.error('Error updating inventory:', inventoryError);
                // Continue with the response even if inventory update fails
            }
        }
        
        res.json({
            success: true,
            message: "Cập nhật phiếu xuất kho thành công",
            data: updatedStockOut
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật phiếu xuất kho",
            error: error.message
        });
    }
};

// Delete stock-out entry
export const deleteStockOut = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if stock-out entry exists
        const stockOutEntry = await prisma.stock_out.findUnique({
            where: { ma_stock_out: id }
        });
        
        if (!stockOutEntry) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu xuất kho"
            });
        }
        
        // Delete stock-out entry
        await prisma.stock_out.delete({
            where: { ma_stock_out: id }
        });
        
        // Update inventory - restore quantities
        if (stockOutEntry.ten_kho && stockOutEntry.ma_hang) {
            try {
                await prisma.inventory.updateMany({
                    where: {
                        ma_hang: stockOutEntry.ma_hang,
                        ten_kho: stockOutEntry.ten_kho
                    },
                    data: {
                        tong_xuat: {
                            decrement: stockOutEntry.so_luong_xuat
                        },
                        ton_hien_tai: {
                            increment: stockOutEntry.so_luong_xuat
                        }
                    }
                });
                console.log(`Inventory restored for product ${stockOutEntry.ma_hang} in warehouse ${stockOutEntry.ten_kho}`);
            } catch (inventoryError) {
                console.error('Error restoring inventory:', inventoryError);
                // Continue with the response even if inventory update fails
            }
        }
        
        res.json({
            success: true,
            message: "Xóa phiếu xuất kho thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa phiếu xuất kho",
            error: error.message
        });
    }
};

// Get all stock-out entries for a specific product
export const getStockOutByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const stockOutEntries = await prisma.stock_out.findMany({
            where: { ma_hang: productId },
            include: {
                accounts: true,
                customers: true,
                warehouse: true
            },
            orderBy: { ngay_xuat_hang: 'desc' }
        });
        
        // Get unique product IDs (in this case, just the productId)
        const products = await prisma.products.findMany({
            where: {
                ma_hang: productId
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
                // Include supplier information
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
        
        // Create lookup map
        const productMap = {};
        if (products.length > 0) {
            productMap[products[0].ma_hang] = products[0];
        }
        
        // Add product data to stock entries
        const stockOutEntriesWithProducts = stockOutEntries.map(entry => {
            return {
                ...entry,
                product: entry.ma_hang ? productMap[entry.ma_hang] || null : null
            };
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách xuất kho cho sản phẩm ${productId} thành công`,
            data: stockOutEntriesWithProducts
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách xuất kho theo sản phẩm",
            error: error.message
        });
    }
};
// Get all stock-out entries for a specific warehouse
export const getStockOutByWarehouse = async (req, res) => {
    try {
        const { warehouseId } = req.params;
        
        const stockOutEntries = await prisma.stock_out.findMany({
            where: { ten_kho: warehouseId },
            include: {
                accounts: true,
                customers: true
            },
            orderBy: { ngay_xuat_hang: 'desc' }
        });
        
        // Get unique product IDs
        const productIds = [...new Set(stockOutEntries.map(entry => entry.ma_hang).filter(Boolean))];
        
        // Fetch product details for all products in a single query
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
                // Include supplier information
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
        const stockOutEntriesWithProducts = stockOutEntries.map(entry => {
            return {
                ...entry,
                product: entry.ma_hang ? productMap[entry.ma_hang] || null : null
            };
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách xuất kho từ kho ${warehouseId} thành công`,
            data: stockOutEntriesWithProducts
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách xuất kho theo kho",
            error: error.message
        });
    }
};
// Get all stock-out entries for a specific customer
export const getStockOutByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const stockOutEntries = await prisma.stock_out.findMany({
            where: { ten_khach_hang: customerId },
            include: {
                accounts: true,
                warehouse: true
            },
            orderBy: { ngay_xuat_hang: 'desc' }
        });
        
        // Get unique product IDs
        const productIds = [...new Set(stockOutEntries.map(entry => entry.ma_hang).filter(Boolean))];
        
        // Fetch product details for all products in a single query
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
                // Include supplier information
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
        const stockOutEntriesWithProducts = stockOutEntries.map(entry => {
            return {
                ...entry,
                product: entry.ma_hang ? productMap[entry.ma_hang] || null : null
            };
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách xuất kho cho khách hàng ${customerId} thành công`,
            data: stockOutEntriesWithProducts
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách xuất kho theo khách hàng",
            error: error.message
        });
    }
};
// Get all stock-out entries managed by a specific user
export const getStockOutByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const stockOutEntries = await prisma.stock_out.findMany({
            where: { nguoi_phu_trach: userId },
            include: {
                customers: true,
                warehouse: true
            },
            orderBy: { ngay_xuat_hang: 'desc' }
        });
        
        // Get unique product IDs
        const productIds = [...new Set(stockOutEntries.map(entry => entry.ma_hang).filter(Boolean))];
        
        // Fetch product details for all products in a single query
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
                // Include supplier information
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
        const stockOutEntriesWithProducts = stockOutEntries.map(entry => {
            return {
                ...entry,
                product: entry.ma_hang ? productMap[entry.ma_hang] || null : null
            };
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách xuất kho do người dùng ${userId} phụ trách thành công`,
            data: stockOutEntriesWithProducts
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách xuất kho theo người phụ trách",
            error: error.message
        });
    }
};
// Get stock-out statistics
export const getStockOutStats = async (req, res) => {
    try {
        // Count total stock-out entries
        const totalStockOut = await prisma.stock_out.count();
        
        // Count entries in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentStockOut = await prisma.stock_out.count({
            where: {
                ngay_xuat_hang: {
                    gte: thirtyDaysAgo
                }
            }
        });
        
        // Get total quantity sent out
        const totalQuantity = await prisma.stock_out.aggregate({
            _sum: {
                so_luong_xuat: true
            }
        });
        
        // Get top 5 customers by quantity
        const topCustomers = await prisma.stock_out.groupBy({
            by: ['ten_khach_hang'],
            _sum: {
                so_luong_xuat: true
            },
            orderBy: {
                _sum: {
                    so_luong_xuat: 'desc'
                }
            },
            take: 5
        });
        
        // Get top 5 warehouses by outbound quantity
        const topWarehouses = await prisma.stock_out.groupBy({
            by: ['ten_kho'],
            _sum: {
                so_luong_xuat: true
            },
            orderBy: {
                _sum: {
                    so_luong_xuat: 'desc'
                }
            },
            take: 5
        });
        
        // Get monthly statistics for the current year
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);
        
        const monthlyStats = await prisma.stock_out.groupBy({
            by: [
                {
                    ngay_xuat_hang: {
                        month: true
                    }
                }
            ],
            where: {
                ngay_xuat_hang: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            },
            _sum: {
                so_luong_xuat: true
            },
            _count: {
                ma_stock_out: true
            }
        });
        
        // Get customer names for top customers
        const customerDetails = await Promise.all(
            topCustomers.map(async (item) => {
                if (!item.ten_khach_hang) {
                    return {
                        ten_khach_hang: null,
                        ten_khach_hang_day_du: 'Không xác định',
                        quantity: item._sum.so_luong_xuat
                    };
                }
                
                const customer = await prisma.customers.findUnique({
                    where: { ma_khach_hang: item.ten_khach_hang },
                    select: { ten_khach_hang: true }
                });
                
                return {
                    ten_khach_hang: item.ten_khach_hang,
                    ten_khach_hang_day_du: customer?.ten_khach_hang || 'Không xác định',
                    quantity: item._sum.so_luong_xuat
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
                        quantity: item._sum.so_luong_xuat
                    };
                }
                
                const warehouse = await prisma.warehouse.findUnique({
                    where: { ma_kho: item.ten_kho },
                    select: { ten_kho: true }
                });
                
                return {
                    ten_kho: item.ten_kho,
                    ten_kho_day_du: warehouse?.ten_kho || 'Không xác định',
                    quantity: item._sum.so_luong_xuat
                };
            })
        );
        
        // Format monthly data
        const monthlyData = Array(12).fill(0).map((_, i) => {
            const month = i + 1;
            const monthData = monthlyStats.find(stat => stat.ngay_xuat_hang.month === month);
            return {
                month,
                quantity: monthData?._sum.so_luong_xuat || 0,
                count: monthData?._count.ma_stock_out || 0
            };
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê xuất kho thành công",
            data: {
                totalStockOut,
                recentStockOut,
                totalQuantity: totalQuantity._sum.so_luong_xuat || 0,
                topCustomers: customerDetails,
                topWarehouses: warehouseDetails,
                monthlyData
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê xuất kho",
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

// Import stock-out entries from Excel
export const importStockOutFromExcel = async (req, res) => {
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
        const maxSttResult = await prisma.stock_out.aggregate({
            _max: {
                stt: true
            }
        });
        
        let nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Process each record in Excel file
        for (const [index, item] of data.entries()) {
            try {
                // Check required fields
                if (!item['Mã xuất kho'] || !item['Ngày xuất hàng'] || !item['Số lượng xuất']) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: "Thiếu thông tin bắt buộc: Mã xuất kho, Ngày xuất hàng, Số lượng xuất"
                    });
                    continue;
                }
                
                // Check if stock-out entry already exists
                const existingStockOut = await prisma.stock_out.findUnique({
                    where: { ma_stock_out: item['Mã xuất kho'] }
                });
                
                if (existingStockOut) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: `Phiếu xuất kho với mã ${item['Mã xuất kho']} đã tồn tại`
                    });
                    continue;
                }
                
                // Validate references
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
                
                if (item['Khách hàng']) {
                    const customer = await prisma.customers.findUnique({
                        where: { ma_khach_hang: item['Khách hàng'] }
                    });
                    
                    if (!customer) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Khách hàng với mã ${item['Khách hàng']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                if (item['Người phụ trách']) {
                    const account = await prisma.accounts.findUnique({
                        where: { ma_nguoi_dung: item['Người phụ trách'] }
                    });
                    
                    if (!account) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Tài khoản với mã ${item['Người phụ trách']} không tồn tại`
                        });
                        continue;
                    }
                }
                
                // Check inventory
                if (item['Kho'] && item['Mã hàng']) {
                    const inventory = await prisma.inventory.findFirst({
                        where: {
                            ma_hang: item['Mã hàng'],
                            ten_kho: item['Kho']
                        }
                    });
                    
                    if (!inventory) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Không tìm thấy hàng ${item['Mã hàng']} trong kho ${item['Kho']}`
                        });
                        continue;
                    }
                    
                    if (inventory.ton_hien_tai < parseInt(item['Số lượng xuất'])) {
                        console.log(`Warning: Import row ${index + 1} - Stock out quantity (${item['Số lượng xuất']}) exceeds available inventory (${inventory.ton_hien_tai})`);

                    }
                }
                
                // Create stock-out entry
                const stockOutEntry = await prisma.stock_out.create({
                    data: {
                        stt: nextStt++,
                        ma_stock_out: item['Mã xuất kho'],
                        ma_hang: item['Mã hàng'] || null,
                        ngay_xuat_hang: new Date(item['Ngày xuất hàng']),
                        so_luong_xuat: parseInt(item['Số lượng xuất']),
                        ten_kho: item['Kho'] || null,
                        ten_khach_hang: item['Khách hàng'] || null,
                        nguoi_phu_trach: item['Người phụ trách'] || null
                    }
                });
                
                // Update inventory
                if (item['Kho'] && item['Mã hàng']) {
                    await prisma.inventory.updateMany({
                        where: {
                            ma_hang: item['Mã hàng'],
                            ten_kho: item['Kho']
                        },
                        data: {
                            tong_xuat: {
                                increment: parseInt(item['Số lượng xuất'])
                            },
                            ton_hien_tai: {
                                decrement: parseInt(item['Số lượng xuất'])
                            }
                        }
                    });
                }
                
                results.success.push(stockOutEntry);
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
            message: `Import thành công ${results.success.length} phiếu xuất kho, thất bại ${results.errors.length} phiếu xuất kho`,
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
            message: "Lỗi khi import phiếu xuất kho từ Excel",
            error: error.message
        });
    }
};

// Generate template Excel file for stock-out
export const generateStockOutTemplate = (req, res) => {
    try {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        
        // Define columns
        const headers = [
            'Mã xuất kho',
            'Mã hàng',
            'Ngày xuất hàng',
            'Số lượng xuất',
            'Kho',
            'Khách hàng',
            'Người phụ trách'
        ];
        
        // Create a sample row
        const sampleData = [{
            'Mã xuất kho': 'XK001',
            'Mã hàng': 'SP001',
            'Ngày xuất hàng': '2025-04-22',
            'Số lượng xuất': 50,
            'Kho': 'K001',
            'Khách hàng': 'KH001',
            'Người phụ trách': 'USER001'
        }];
        
        // Create worksheet with data
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        
        // Add column widths
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Xuất kho');
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=stock_out_template.xlsx');
        
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