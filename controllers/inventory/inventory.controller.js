import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Get all inventory records with pagination and filtering
// Get all inventory records without pagination limits
export const getAllInventory = async (req, res) => {
    try {
        const { 
            sortBy = 'ma_inventory', 
            sortDir = 'asc',
            product = '',
            warehouse = '',
            year = '', // Empty string as default to return all years
            lowStock = '',
            search = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        // Only filter by year if it's provided
        if (year) {
            where.nam = parseInt(year);
        }
        
        if (product) where.ma_hang = product;
        if (warehouse) where.ten_kho = warehouse;
        
        // Search filter
        if (search) {
            where.OR = [
                { ma_inventory: { contains: search } },
                { ma_hang: { contains: search } },
                { ten_kho: { contains: search } }
            ];
        }
        
        // Get total count for metadata
        const totalCount = await prisma.inventory.count({ where });
        
        // Get inventory records - REMOVED pagination limits (skip/take)
        const inventoryRecords = await prisma.inventory.findMany({
            where,
            orderBy,
            include: {
                warehouse: {
                    select: {
                        ma_kho: true,
                        ten_kho: true,
                        vi_tri_kho: true
                    }
                }
            }
        });
        
        // Filter low stock items after fetching (if needed)
        let filteredInventory = inventoryRecords;
        if (lowStock === 'true') {
            filteredInventory = inventoryRecords.filter(item => 
                item.ton_hien_tai <= item.muc_ton_toi_thieu
            );
        }
        
        // Get all unique product IDs
        const productIds = [...new Set(filteredInventory.map(inv => inv.ma_hang).filter(Boolean))];
        
        // Batch fetch products in a single query
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
        
        // Create product lookup map for faster access
        const productMap = {};
        products.forEach(product => {
            productMap[product.ma_hang] = product;
        });
        
        // Attach product data to inventory records
        const inventoryWithProducts = filteredInventory.map(inventory => {
            return {
                ...inventory,
                product: inventory.ma_hang ? productMap[inventory.ma_hang] || null : null
            };
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách kho hàng thành công",
            data: inventoryWithProducts,
            metadata: {
                total: totalCount,
                filtered: filteredInventory.length
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách kho hàng",
            error: error.message
        });
    }
};
// Get inventory by ID
export const getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const inventory = await prisma.inventory.findUnique({
            where: { ma_inventory: id },
            include: {
                warehouse: true,
                inventory_check: true
            }
        });
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin kho hàng"
            });
        }
        
        // Get product details
        let product = null;
        if (inventory.ma_hang) {
            product = await prisma.products.findFirst({
                where: { ma_hang: inventory.ma_hang }
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin kho hàng thành công",
            data: {
                ...inventory,
                product
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin kho hàng",
            error: error.message
        });
    }
};

// Get inventory by product
export const getInventoryByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { year = new Date().getFullYear() } = req.query;
        
        const yearNum = parseInt(year);
        
        const inventoryRecords = await prisma.inventory.findMany({
            where: { 
                ma_hang: productId,
                nam: yearNum
            },
            include: {
                warehouse: true,
                inventory_check: true
            },
            orderBy: { ma_inventory: 'asc' }
        });
        
        if (inventoryRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thông tin kho hàng cho sản phẩm ${productId} trong năm ${yearNum}`
            });
        }
        
        // Get product details
        const product = await prisma.products.findFirst({
            where: { ma_hang: productId }
        });
        
        res.json({
            success: true,
            message: `Lấy thông tin kho hàng cho sản phẩm ${productId} thành công`,
            data: {
                product,
                inventoryRecords
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin kho hàng theo sản phẩm",
            error: error.message
        });
    }
};

// Get inventory by warehouse
export const getInventoryByWarehouse = async (req, res) => {
    try {
        const { warehouseId } = req.params;
        const { year = new Date().getFullYear() } = req.query;
        
        const yearNum = parseInt(year);
        
        const inventoryRecords = await prisma.inventory.findMany({
            where: { 
                ten_kho: warehouseId,
                nam: yearNum
            },
            include: {
                inventory_check: true
            },
            orderBy: { ma_inventory: 'asc' }
        });
        
        if (inventoryRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thông tin kho hàng trong kho ${warehouseId} năm ${yearNum}`
            });
        }
        
        // Get warehouse details
        const warehouse = await prisma.warehouse.findUnique({
            where: { ma_kho: warehouseId }
        });
        
        // Get product details for each inventory record
        const inventoryWithProducts = await Promise.all(
            inventoryRecords.map(async (inventory) => {
                let product = null;
                
                if (inventory.ma_hang) {
                    product = await prisma.products.findFirst({
                        where: { ma_hang: inventory.ma_hang },
                        select: {
                            ma_hang: true,
                            ten_hang: true,
                            don_vi_ban_hang: true,
                            gia_thuc: true
                        }
                    });
                }
                
                return {
                    ...inventory,
                    product
                };
            })
        );
        
        res.json({
            success: true,
            message: `Lấy thông tin kho hàng cho kho ${warehouseId} thành công`,
            data: {
                warehouse,
                inventoryRecords: inventoryWithProducts
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin kho hàng theo kho",
            error: error.message
        });
    }
};

// Create inventory record
export const createInventory = async (req, res) => {
    try {
        const {
            stt: requestedStt,
            ma_inventory,
            nam,
            ma_hang,
            ten_kho,
            ton_truoc_do,
            tong_nhap,
            tong_xuat,
            ton_hien_tai,
            muc_ton_toi_thieu
        } = req.body;
        
        // Validate required fields
        if (!ma_inventory || !nam || !ma_hang || !ten_kho) {
            return res.status(400).json({
                success: false,
                message: "Mã kho hàng, năm, mã hàng, và mã kho là bắt buộc"
            });
        }
        
        // Validate product reference
        const product = await prisma.products.findFirst({
            where: { ma_hang }
        });
        
        if (!product) {
            return res.status(400).json({
                success: false,
                message: `Sản phẩm với mã ${ma_hang} không tồn tại`
            });
        }
        
        // Validate warehouse reference
        const warehouse = await prisma.warehouse.findUnique({
            where: { ma_kho: ten_kho }
        });
        
        if (!warehouse) {
            return res.status(400).json({
                success: false,
                message: `Kho với mã ${ten_kho} không tồn tại`
            });
        }
        
        // Process ma_inventory to ensure uniqueness
        let uniqueInventoryCode = ma_inventory;
        let counter = 1;
        
        // Create a record with a potentially modified ma_inventory
        const createRecord = async (inventoryCode) => {
            // Use manual stt override if provided
            const sttValue = requestedStt ? parseInt(requestedStt) : undefined;
            
            try {
                const inventoryRecord = await prisma.inventory.create({
                    data: {
                        stt: sttValue, // Let Prisma auto-increment if undefined
                        ma_inventory: inventoryCode,
                        nam: parseInt(nam),
                        ma_hang,
                        ten_kho,
                        ton_truoc_do: parseInt(ton_truoc_do || 0),
                        tong_nhap: parseInt(tong_nhap || 0),
                        tong_xuat: parseInt(tong_xuat || 0),
                        ton_hien_tai: parseInt(ton_hien_tai || 0),
                        muc_ton_toi_thieu: parseInt(muc_ton_toi_thieu || 0)
                    }
                });
                
                // Calculate inventory value and update warehouse total value
                const inventoryValue = product.gia_thuc * inventoryRecord.ton_hien_tai;
                
                await prisma.warehouse.update({
                    where: { ma_kho: ten_kho },
                    data: {
                        tong_gia_tri_ton_kho: {
                            increment: inventoryValue
                        }
                    }
                });
                
                return inventoryRecord;
            } catch (error) {
                // If the error is due to duplicate ma_inventory, return null to try again
                if (error.message.includes('Unique constraint failed on the fields: (`ma_inventory`)')) {
                    return null;
                }
                // For other errors, throw them to be caught by the outer catch
                throw error;
            }
        };
        
        // Try to create with original code, then with suffixes if needed
        let inventoryRecord = await createRecord(uniqueInventoryCode);
        
        while (!inventoryRecord) {
            uniqueInventoryCode = `${ma_inventory}_${counter}`;
            counter++;
            inventoryRecord = await createRecord(uniqueInventoryCode);
        }
        
        res.status(201).json({
            success: true,
            message: "Tạo thông tin kho hàng thành công",
            data: inventoryRecord,
            ...(uniqueInventoryCode !== ma_inventory && {
                notice: `Sử dụng mã kho hàng ${uniqueInventoryCode} vì ${ma_inventory} đã tồn tại`
            })
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo thông tin kho hàng",
            error: error.message
        });
    }
};
// Update inventory record
export const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ma_hang,
            ten_kho,
            ton_truoc_do,
            tong_nhap,
            tong_xuat,
            ton_hien_tai,
            muc_ton_toi_thieu
        } = req.body;
        
        // Check if inventory record exists
        const existingInventory = await prisma.inventory.findUnique({
            where: { ma_inventory: id }
        });
        
        if (!existingInventory) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin kho hàng"
            });
        }
        
        // Validate product reference if changing
        if (ma_hang && ma_hang !== existingInventory.ma_hang) {
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
        if (ten_kho && ten_kho !== existingInventory.ten_kho) {
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
        
        // Calculate old and new inventory values for warehouse update
        let oldProduct = null;
        let newProduct = null;
        
        if (existingInventory.ma_hang) {
            oldProduct = await prisma.products.findFirst({
                where: { ma_hang: existingInventory.ma_hang }
            });
        }
        
        if (ma_hang && ma_hang !== existingInventory.ma_hang) {
            newProduct = await prisma.products.findFirst({
                where: { ma_hang }
            });
        } else {
            newProduct = oldProduct;
        }
        
        const oldInventoryValue = oldProduct ? oldProduct.gia_thuc * existingInventory.ton_hien_tai : 0;
        const newInventoryValue = newProduct ? newProduct.gia_thuc * (ton_hien_tai !== undefined ? parseInt(ton_hien_tai) : existingInventory.ton_hien_tai) : 0;
        
        // Update inventory record
        const updatedInventory = await prisma.inventory.update({
            where: { ma_inventory: id },
            data: {
                ma_hang,
                ten_kho,
                ton_truoc_do: ton_truoc_do !== undefined ? parseInt(ton_truoc_do) : undefined,
                tong_nhap: tong_nhap !== undefined ? parseInt(tong_nhap) : undefined,
                tong_xuat: tong_xuat !== undefined ? parseInt(tong_xuat) : undefined,
                ton_hien_tai: ton_hien_tai !== undefined ? parseInt(ton_hien_tai) : undefined,
                muc_ton_toi_thieu: muc_ton_toi_thieu !== undefined ? parseInt(muc_ton_toi_thieu) : undefined
            }
        });
        
        // Update old warehouse total value
        if (existingInventory.ten_kho) {
            await prisma.warehouse.update({
                where: { ma_kho: existingInventory.ten_kho },
                data: {
                    tong_gia_tri_ton_kho: {
                        decrement: oldInventoryValue
                    }
                }
            });
        }
        
        // Update new warehouse total value
        if (updatedInventory.ten_kho) {
            await prisma.warehouse.update({
                where: { ma_kho: updatedInventory.ten_kho },
                data: {
                    tong_gia_tri_ton_kho: {
                        increment: newInventoryValue
                    }
                }
            });
        }
        
        res.json({
            success: true,
            message: "Cập nhật thông tin kho hàng thành công",
            data: updatedInventory
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật thông tin kho hàng",
            error: error.message
        });
    }
};

// Delete inventory record
export const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if inventory record exists
        const inventoryRecord = await prisma.inventory.findUnique({
            where: { ma_inventory: id }
        });
        
        if (!inventoryRecord) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin kho hàng"
            });
        }
        
        // Check if there are any inventory checks referencing this inventory
        const inventoryCheckCount = await prisma.inventory_check.count({
            where: { so_luong_he_thong_ghi_nhan: id }
        });
        
        if (inventoryCheckCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa kho hàng này vì nó đang được tham chiếu trong các phiếu kiểm kê"
            });
        }
        
        // Calculate inventory value for warehouse update
        let product = null;
        if (inventoryRecord.ma_hang) {
            product = await prisma.products.findFirst({
                where: { ma_hang: inventoryRecord.ma_hang }
            });
        }
        
        const inventoryValue = product ? product.gia_thuc * inventoryRecord.ton_hien_tai : 0;
        
        // Delete inventory record
        await prisma.inventory.delete({
            where: { ma_inventory: id }
        });
        
        // Update warehouse total value
        if (inventoryRecord.ten_kho) {
            await prisma.warehouse.update({
                where: { ma_kho: inventoryRecord.ten_kho },
                data: {
                    tong_gia_tri_ton_kho: {
                        decrement: inventoryValue
                    }
                }
            });
        }
        
        res.json({
            success: true,
            message: "Xóa thông tin kho hàng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa thông tin kho hàng",
            error: error.message
        });
    }
};

// Get low stock inventory
export const getLowStockInventory = async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        
        const yearNum = parseInt(year);
        
        // Find inventory records where current stock is below or equal to minimum stock level
        const lowStockInventory = await prisma.$queryRaw`
            SELECT * FROM inventory 
            WHERE nam = ${yearNum} AND ton_hien_tai <= muc_ton_toi_thieu
            ORDER BY ten_kho, ma_hang
        `;
        
        // Get product and warehouse details for each inventory record
        const lowStockWithDetails = await Promise.all(
            lowStockInventory.map(async (inventory) => {
                let product = null;
                let warehouse = null;
                
                if (inventory.ma_hang) {
                    product = await prisma.products.findFirst({
                        where: { ma_hang: inventory.ma_hang },
                        select: {
                            ma_hang: true,
                            ten_hang: true,
                            don_vi_ban_hang: true,
                            gia_thuc: true
                        }
                    });
                }
                
                if (inventory.ten_kho) {
                    warehouse = await prisma.warehouse.findUnique({
                        where: { ma_kho: inventory.ten_kho },
                        select: {
                            ma_kho: true,
                            ten_kho: true,
                            vi_tri_kho: true
                        }
                    });
                }
                
                return {
                    ...inventory,
                    product,
                    warehouse
                };
            })
        );
        
        res.json({
            success: true,
            message: "Lấy danh sách kho hàng sắp hết hàng thành công",
            data: lowStockWithDetails
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách kho hàng sắp hết hàng",
            error: error.message
        });
    }
};

// Get inventory statistics
export const getInventoryStats = async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        
        const yearNum = parseInt(year);
        
        // Count total inventory records
        const totalInventory = await prisma.inventory.count({
            where: { nam: yearNum }
        });
        
        // Count low stock items
        const lowStockCount = await prisma.$queryRaw`
            SELECT COUNT(*) FROM inventory 
            WHERE nam = ${yearNum} AND ton_hien_tai <= muc_ton_toi_thieu
        `;
        
        // Get total inventory value
        const inventoryRecords = await prisma.inventory.findMany({
            where: { nam: yearNum },
            select: {
                ma_hang: true,
                ton_hien_tai: true
            }
        });
        
        let totalValue = 0;
        
        await Promise.all(
            inventoryRecords.map(async (inventory) => {
                if (inventory.ma_hang) {
                    const product = await prisma.products.findFirst({
                        where: { ma_hang: inventory.ma_hang },
                        select: { gia_thuc: true }
                    });
                    
                    if (product) {
                        totalValue += product.gia_thuc * inventory.ton_hien_tai;
                    }
                }
            })
        );
        
        // Get top 5 products by quantity
        const topProducts = await prisma.inventory.groupBy({
            by: ['ma_hang'],
            where: { nam: yearNum },
            _sum: {
                ton_hien_tai: true
            },
            orderBy: {
                _sum: {
                    ton_hien_tai: 'desc'
                }
            },
            take: 5
        });
        
        // Get top 5 warehouses by value
        const warehouses = await prisma.warehouse.findMany({
            select: {
                ma_kho: true,
                ten_kho: true,
                tong_gia_tri_ton_kho: true
            },
            orderBy: {
                tong_gia_tri_ton_kho: 'desc'
            },
            take: 5
        });
        
        // Get product details for top products
        const topProductsWithDetails = await Promise.all(
            topProducts.map(async (item) => {
                let product = null;
                
                if (item.ma_hang) {
                    product = await prisma.products.findFirst({
                        where: { ma_hang: item.ma_hang },
                        select: {
                            ma_hang: true,
                            ten_hang: true,
                            don_vi_ban_hang: true,
                            gia_thuc: true
                        }
                    });
                }
                
                return {
                    ma_hang: item.ma_hang,
                    quantity: item._sum.ton_hien_tai,
                    product
                };
            })
        );
        
        res.json({
            success: true,
            message: "Lấy thống kê kho hàng thành công",
            data: {
                totalInventory,
                lowStockCount: parseInt(lowStockCount[0].count),
                totalValue,
                topProducts: topProductsWithDetails,
                topWarehouses: warehouses
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê kho hàng",
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

// Import inventory from Excel
export const importInventoryFromExcel = async (req, res) => {
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
        const maxSttResult = await prisma.inventory.aggregate({
            _max: {
                stt: true
            }
        });
        
        let nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Process each record in Excel file
        for (const [index, item] of data.entries()) {
            try {
                // Check required fields
                if (!item['Mã kho hàng'] || !item['Năm'] || !item['Mã hàng'] || !item['Mã kho']) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: "Thiếu thông tin bắt buộc: Mã kho hàng, Năm, Mã hàng, Mã kho"
                    });
                    continue;
                }
                
                // Check if inventory record already exists
                const existingInventory = await prisma.inventory.findUnique({
                    where: { ma_inventory: item['Mã kho hàng'] }
                });
                
                if (existingInventory) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: `Kho hàng với mã ${item['Mã kho hàng']} đã tồn tại`
                    });
                    continue;
                }
                
                // Validate product reference
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
                
                // Validate warehouse reference
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
                
                // Create inventory record
                const inventoryRecord = await prisma.inventory.create({
                    data: {
                        stt: nextStt++,
                        ma_inventory: item['Mã kho hàng'],
                        nam: parseInt(item['Năm']),
                        ma_hang: item['Mã hàng'],
                        ten_kho: item['Mã kho'],
                        ton_truoc_do: parseInt(item['Tồn trước đó'] || 0),
                        tong_nhap: parseInt(item['Tổng nhập'] || 0),
                        tong_xuat: parseInt(item['Tổng xuất'] || 0),
                        ton_hien_tai: parseInt(item['Tồn hiện tại'] || 0),
                        muc_ton_toi_thieu: parseInt(item['Mức tồn tối thiểu'] || 0)
                    }
                });
                
                // Calculate inventory value and update warehouse total value
                const inventoryValue = product.gia_thuc * inventoryRecord.ton_hien_tai;
                
                await prisma.warehouse.update({
                    where: { ma_kho: item['Mã kho'] },
                    data: {
                        tong_gia_tri_ton_kho: {
                            increment: inventoryValue
                        }
                    }
                });
                
                results.success.push(inventoryRecord);
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
            message: `Import thành công ${results.success.length} kho hàng, thất bại ${results.errors.length} kho hàng`,
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
            message: "Lỗi khi import kho hàng từ Excel",
            error: error.message
        });
    }
};

// Generate template Excel file for inventory
export const generateInventoryTemplate = (req, res) => {
    try {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        
        // Define columns
        const headers = [
            'Mã kho hàng',
            'Năm',
            'Mã hàng',
            'Mã kho',
            'Tồn trước đó',
            'Tổng nhập',
            'Tổng xuất',
            'Tồn hiện tại',
            'Mức tồn tối thiểu'
        ];
        
        // Create a sample row
        const sampleData = [{
            'Mã kho hàng': 'INV-SP001-K001-2025',
            'Năm': 2025,
            'Mã hàng': 'SP001',
            'Mã kho': 'K001',
            'Tồn trước đó': 0,
            'Tổng nhập': 100,
            'Tổng xuất': 20,
            'Tồn hiện tại': 80,
            'Mức tồn tối thiểu': 10
        }];
        
        // Create worksheet with data
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        
        // Add column widths
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Kho hàng');
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory_template.xlsx');
        
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