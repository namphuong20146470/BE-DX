import * as XLSX from 'xlsx';

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