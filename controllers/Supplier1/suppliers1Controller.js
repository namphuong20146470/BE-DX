import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Set up multer for file upload
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

// Get all suppliers
export const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.suppliers.findMany({
            orderBy: {
                stt: 'asc'
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách nhà cung cấp thành công",
            data: suppliers
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách nhà cung cấp",
            error: error.message
        });
    }
};

// Get supplier by ID
export const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const supplier = await prisma.suppliers.findUnique({
            where: { ma_nha_cung_cap: id }
        });
        
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhà cung cấp"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin nhà cung cấp thành công",
            data: supplier
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin nhà cung cấp",
            error: error.message
        });
    }
};

// Create new supplier
export const createSupplier = async (req, res) => {
    try {
        const { 
            ma_nha_cung_cap, 
            ten_nha_cung_cap, 
            so_dien_thoai, 
            email, 
            dia_chi, 
            quoc_gia, 
            ma_so_thue, 
            trang_website, 
            trang_thai, 
            ngay_them_vao, 
            tong_no_phai_tra, 
            ghi_chu 
        } = req.body;
        
        // Validate required fields
        if (!ma_nha_cung_cap || !ten_nha_cung_cap) {
            return res.status(400).json({
                success: false,
                message: "Mã nhà cung cấp và tên nhà cung cấp là bắt buộc"
            });
        }
        
        // Check if supplier with this code already exists
        const existingSupplier = await prisma.suppliers.findUnique({
            where: { ma_nha_cung_cap }
        });
        
        if (existingSupplier) {
            return res.status(400).json({
                success: false,
                message: `Nhà cung cấp với mã ${ma_nha_cung_cap} đã tồn tại`
            });
        }
        
        // Get the highest stt value to avoid unique constraint error
        const maxSttResult = await prisma.suppliers.aggregate({
            _max: {
                stt: true
            }
        });
        
        const nextStt = (maxSttResult._max.stt || 0) + 1;
        
        const supplier = await prisma.suppliers.create({
            data: {
                stt: nextStt,
                ma_nha_cung_cap,
                ten_nha_cung_cap,
                so_dien_thoai,
                email,
                dia_chi,
                quoc_gia,
                ma_so_thue,
                trang_website,
                trang_thai,
                ngay_them_vao: ngay_them_vao ? new Date(ngay_them_vao) : new Date(),
                tong_no_phai_tra: tong_no_phai_tra || 0,
                ghi_chu
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo nhà cung cấp thành công",
            data: supplier
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo nhà cung cấp",
            error: error.message
        });
    }
};

// Update supplier
export const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ten_nha_cung_cap, 
            so_dien_thoai, 
            email, 
            dia_chi, 
            quoc_gia, 
            ma_so_thue, 
            trang_website, 
            trang_thai, 
            ngay_them_vao, 
            tong_no_phai_tra, 
            ghi_chu 
        } = req.body;
        
        // Check if supplier exists
        const existingSupplier = await prisma.suppliers.findUnique({
            where: { ma_nha_cung_cap: id }
        });
        
        if (!existingSupplier) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhà cung cấp"
            });
        }
        
        const supplier = await prisma.suppliers.update({
            where: { ma_nha_cung_cap: id },
            data: {
                ten_nha_cung_cap,
                so_dien_thoai,
                email,
                dia_chi,
                quoc_gia,
                ma_so_thue,
                trang_website,
                trang_thai,
                ngay_them_vao: ngay_them_vao ? new Date(ngay_them_vao) : undefined,
                tong_no_phai_tra,
                ghi_chu
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật nhà cung cấp thành công",
            data: supplier
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật nhà cung cấp",
            error: error.message
        });
    }
};

// Delete supplier
export const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if supplier exists
        const supplier = await prisma.suppliers.findUnique({
            where: { ma_nha_cung_cap: id }
        });
        
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhà cung cấp"
            });
        }
        
        // Check for related records before deleting
        // For example, check if this supplier is used in products
        const relatedProducts = await prisma.products.findMany({
            where: { ten_nha_cung_cap: id },
            take: 1
        });
        
        if (relatedProducts.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa nhà cung cấp vì đang được sử dụng trong hàng hóa"
            });
        }
        
        // Delete supplier
        await prisma.suppliers.delete({
            where: { ma_nha_cung_cap: id }
        });
        
        res.json({
            success: true,
            message: "Xóa nhà cung cấp thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa nhà cung cấp",
            error: error.message
        });
    }
};

/**
 * Generic function to import data from Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Options for import
 */
export const importExcelData = async (req, res, options) => {
    const {
        prismaModel,        // Prisma model to use (e.g., prisma.suppliers)
        tableName,          // Name of the table (suppliers, products, etc.)
        requiredFields,     // Array of required field names
        fieldMappings,      // Object mapping Excel column names to DB field names
        uniqueField,        // Field name to check for uniqueness
        recordName,         // Name of the record type (e.g., "nhà cung cấp") for messages
        defaultValues       // Default values for fields if missing
    } = options;
    
    try {
        console.log(`Starting Excel import for ${tableName}`);
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng tải lên tệp Excel"
            });
        }
        
        console.log(`File received: ${req.file.path}`);
        
        // Read Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        console.log(`Excel data parsed, rows: ${data.length}`);
        
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
        
        // Get the current highest stt value if the model has an stt field
        let nextStt = 1;
        
        try {
            const maxSttResult = await prismaModel.aggregate({
                _max: {
                    stt: true
                }
            });
            nextStt = (maxSttResult._max.stt || 0) + 1;
            console.log(`Starting with STT: ${nextStt}`);
        } catch (error) {
            console.log('No stt field or error getting max STT');
        }
        
        // Process each record in Excel file
        for (const [index, item] of data.entries()) {
            try {
                console.log(`Processing row ${index + 1}:`, JSON.stringify(item));
                
                // Initialize record data with default values
                const recordData = { ...defaultValues };
                
                // Add stt field if needed
                if ('stt' in recordData) {
                    recordData.stt = nextStt++;
                }
                
                // Map fields from Excel to database
                for (const [excelField, dbField] of Object.entries(fieldMappings)) {
                    // Skip if Excel field doesn't exist in the current row
                    if (item[excelField] === undefined) {
                        console.log(`Field "${excelField}" is missing in row ${index + 1}`);
                        continue;
                    }
                    
                    let value = item[excelField];
                    
                    // Handle different field types
                    if (typeof dbField === 'object') {
                        // Complex field definition with type
                        const { field, type, formatter } = dbField;
                        
                        if (type === 'date' && value) {
                            value = new Date(value);
                        } else if (type === 'number' && value) {
                            // Clean numeric values - handle spaces and comma/dot
                            if (typeof value === 'string') {
                                value = value.replace(/\s+/g, '').replace(',', '.');
                            }
                            value = parseFloat(value) || 0;
                        }
                        
                        // Apply custom formatter if provided
                        if (formatter && typeof formatter === 'function') {
                            value = formatter(value, item);
                        }
                        
                        recordData[field] = value;
                    } else {
                        // Simple string field mapping
                        recordData[dbField] = value;
                    }
                }
                
                console.log(`Mapped data for row ${index + 1}:`, JSON.stringify(recordData));
                
                // Validate required fields
                const missingRequiredFields = requiredFields.filter(field => 
                    recordData[field] === null || recordData[field] === undefined || recordData[field] === ''
                );
                
                if (missingRequiredFields.length > 0) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: `Thiếu thông tin bắt buộc: ${missingRequiredFields.join(', ')}`
                    });
                    console.log(`Missing required fields in row ${index + 1}:`, missingRequiredFields);
                    continue;
                }
                
                // Check if record with the unique field already exists
                if (uniqueField && recordData[uniqueField]) {
                    const existingRecord = await prismaModel.findUnique({
                        where: { [uniqueField]: recordData[uniqueField] }
                    });
                    
                    if (existingRecord) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `${recordName} với ${uniqueField} '${recordData[uniqueField]}' đã tồn tại`
                        });
                        console.log(`Duplicate record in row ${index + 1}:`, recordData[uniqueField]);
                        continue;
                    }
                }
                
                // Create record
                const createdRecord = await prismaModel.create({
                    data: recordData
                });
                
                console.log(`Successfully created record from row ${index + 1}`);
                results.success.push(createdRecord);
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
            message: `Import thành công ${results.success.length} ${recordName}, thất bại ${results.errors.length} ${recordName}`,
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
            message: `Lỗi khi import ${recordName} từ Excel`,
            error: error.message
        });
    }
};

// Import suppliers from Excel
export const importSuppliersFromExcel = async (req, res) => {
    const options = {
        prismaModel: prisma.suppliers,
        tableName: 'suppliers',
        requiredFields: ['ma_nha_cung_cap', 'ten_nha_cung_cap'],
        fieldMappings: {
            'Mã nhà cung cấp': 'ma_nha_cung_cap',
            'Tên nhà cung cấp': 'ten_nha_cung_cap',
            'Số điện thoại': 'so_dien_thoai',
            'Email': 'email',
            'Địa chỉ': 'dia_chi',
            'Quốc gia': 'quoc_gia',
            'Mã số thuế': 'ma_so_thue',
            'Trang website': 'trang_website',
            'Trạng thái': 'trang_thai',
            'Ngày thêm vào': { field: 'ngay_them_vao', type: 'date' },
            'Tổng nợ phải trả': { field: 'tong_no_phai_tra', type: 'number' },
            'Ghi chú': 'ghi_chu'
        },
        uniqueField: 'ma_nha_cung_cap',
        recordName: 'nhà cung cấp',
        defaultValues: {
            stt: null,
            ma_nha_cung_cap: null,
            ten_nha_cung_cap: null,
            so_dien_thoai: null,
            email: null,
            dia_chi: null,
            quoc_gia: null,
            ma_so_thue: null,
            trang_website: null,
            trang_thai: null,
            ngay_them_vao: new Date(),
            tong_no_phai_tra: 0,
            ghi_chu: null
        }
    };
    
    return importExcelData(req, res, options);
};

// Generate template Excel file for suppliers
export const generateSupplierTemplate = (req, res) => {
    try {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        
        // Define columns
        const headers = [
            'Mã nhà cung cấp', 
            'Tên nhà cung cấp', 
            'Số điện thoại', 
            'Email', 
            'Địa chỉ', 
            'Quốc gia', 
            'Mã số thuế',
            'Trang website', 
            'Trạng thái', 
            'Ngày thêm vào', 
            'Tổng nợ phải trả', 
            'Ghi chú'
        ];
        
        // Create a sample row
        const sampleData = [{
            'Mã nhà cung cấp': 'NCC006',
            'Tên nhà cung cấp': 'Công ty ABC',
            'Số điện thoại': '0987654321',
            'Email': 'contact@abc.com',
            'Địa chỉ': '123 Đường A, Quận B, TP.HCM',
            'Quốc gia': 'Việt Nam',
            'Mã số thuế': '0123456789',
            'Trang website': 'http://abc.com',
            'Trạng thái': 'Đang hợp tác',
            'Ngày thêm vào': '2025-04-22',
            'Tổng nợ phải trả': 5000000,
            'Ghi chú': 'Ghi chú về nhà cung cấp'
        }];
        
        // Create worksheet with data
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        
        // Add column widths
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Nhà cung cấp');
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=supplier_template.xlsx');
        
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