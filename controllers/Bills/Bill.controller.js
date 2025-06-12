import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all bills with optional pagination
export const getAllBills = async (req, res) => {
    try {
        const { page, limit, sortBy = 'stt', sortDir = 'asc' } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Get total count for metadata
        const totalCount = await prisma.bills.count();
        
        // Get all bills without pagination
        const bills = await prisma.bills.findMany({
            orderBy,
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true,
                        email: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách bills thành công",
            data: bills,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách bills",
            error: error.message
        });
    }
};
// Get bill by ID
export const getBillById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const bill = await prisma.bills.findUnique({
            where: { ma_bill: id },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true,
                        email: true
                    }
                },
                stock_in: true,
                order_details_order_details_hawb_1Tobills: true,
                order_details_order_details_hawb_2Tobills: true,
                order_details_order_details_hawb_3Tobills: true,
                order_details_order_details_hawb_4Tobills: true,
                order_details_order_details_hawb_5Tobills: true
            }
        });
        
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bill"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin bill thành công",
            data: bill
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin bill",
            error: error.message
        });
    }
};

// Create new bill
export const createBill = async (req, res) => {
    try {
        const { 
            ma_bill, 
            nguoi_cap_nhat,
            ngay_cap_nhat,
            ghi_chu 
        } = req.body;
        
        // Validate required fields
        if (!ma_bill) {
            return res.status(400).json({
                success: false,
                message: "Mã bill là bắt buộc"
            });
        }
        
        // Check if bill with this code already exists
        const existingBill = await prisma.bills.findUnique({
            where: { ma_bill }
        });
        
        if (existingBill) {
            return res.status(400).json({
                success: false,
                message: `Bill với mã ${ma_bill} đã tồn tại`
            });
        }
        
        // Check if the referenced account exists
        if (nguoi_cap_nhat) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: `Tài khoản với mã ${nguoi_cap_nhat} không tồn tại`
                });
            }
        }
        
        // Get the highest stt value to avoid unique constraint error
        const maxSttResult = await prisma.bills.aggregate({
            _max: {
                stt: true
            }
        });
        
        const nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Create bill
        const bill = await prisma.bills.create({
            data: {
                stt: nextStt,
                ma_bill,
                nguoi_cap_nhat,
                ngay_cap_nhat: ngay_cap_nhat ? new Date(ngay_cap_nhat) : new Date(),
                ghi_chu
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo bill thành công",
            data: bill
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo bill",
            error: error.message
        });
    }
};

// Update bill
export const updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nguoi_cap_nhat,
            ngay_cap_nhat,
            ghi_chu 
        } = req.body;
        
        // Check if bill exists
        const existingBill = await prisma.bills.findUnique({
            where: { ma_bill: id }
        });
        
        if (!existingBill) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bill"
            });
        }
        
        // Check if the referenced account exists
        if (nguoi_cap_nhat) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: `Tài khoản với mã ${nguoi_cap_nhat} không tồn tại`
                });
            }
        }
        
        // Update bill
        const bill = await prisma.bills.update({
            where: { ma_bill: id },
            data: {
                nguoi_cap_nhat,
                ngay_cap_nhat: new Date(), // Always set to current date/time
                ghi_chu
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật bill thành công",
            data: bill
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật bill",
            error: error.message
        });
    }
};

// Delete bill
export const deleteBill = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if bill exists
        const bill = await prisma.bills.findUnique({
            where: { ma_bill: id }
        });
        
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bill"
            });
        }
        
        // Check for related order_details records
        const relatedOrderDetails = await prisma.order_details.findFirst({
            where: {
                OR: [
                    { hawb_1: id },
                    { hawb_2: id },
                    { hawb_3: id },
                    { hawb_4: id },
                    { hawb_5: id }
                ]
            }
        });
        
        if (relatedOrderDetails) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa bill vì đang được sử dụng trong chi tiết đơn hàng"
            });
        }
        
        // Check for related stock_in records
        const relatedStockIn = await prisma.stock_in.findFirst({
            where: { ma_bill: id }
        });
        
        if (relatedStockIn) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa bill vì đang được sử dụng trong nhập kho"
            });
        }
        
        // Delete bill
        await prisma.bills.delete({
            where: { ma_bill: id }
        });
        
        res.json({
            success: true,
            message: "Xóa bill thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa bill",
            error: error.message
        });
    }
};

// Get bill with related order details
export const getBillWithOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const bill = await prisma.bills.findUnique({
            where: { ma_bill: id },
            include: {
                order_details_order_details_hawb_1Tobills: true,
                order_details_order_details_hawb_2Tobills: true,
                order_details_order_details_hawb_3Tobills: true,
                order_details_order_details_hawb_4Tobills: true,
                order_details_order_details_hawb_5Tobills: true
            }
        });
        
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bill"
            });
        }
        
        // Combine all order details from different relations
        const allOrderDetails = [
            ...bill.order_details_order_details_hawb_1Tobills || [],
            ...bill.order_details_order_details_hawb_2Tobills || [],
            ...bill.order_details_order_details_hawb_3Tobills || [],
            ...bill.order_details_order_details_hawb_4Tobills || [],
            ...bill.order_details_order_details_hawb_5Tobills || []
        ];
        
        // Remove the original complex relation arrays
        const { 
            order_details_order_details_hawb_1Tobills,
            order_details_order_details_hawb_2Tobills,
            order_details_order_details_hawb_3Tobills,
            order_details_order_details_hawb_4Tobills,
            order_details_order_details_hawb_5Tobills,
            ...billData
        } = bill;
        
        res.json({
            success: true,
            message: "Lấy thông tin bill và chi tiết đơn hàng thành công",
            data: {
                ...billData,
                order_details: allOrderDetails
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin bill và chi tiết đơn hàng",
            error: error.message
        });
    }
};

// Get bill with related stock in records
export const getBillWithStockIn = async (req, res) => {
    try {
        const { id } = req.params;
        
        const bill = await prisma.bills.findUnique({
            where: { ma_bill: id },
            include: {
                stock_in: true
            }
        });
        
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bill"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin bill và nhập kho thành công",
            data: bill
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin bill và nhập kho",
            error: error.message
        });
    }
};

// Get bill statistics
export const getBillStats = async (req, res) => {
    try {
        // Count total bills
        const totalBills = await prisma.bills.count();
        
        // Count bills created in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentBills = await prisma.bills.count({
            where: {
                ngay_cap_nhat: {
                    gte: thirtyDaysAgo
                }
            }
        });
        
        // Count bills by users who created them
        const billsByUser = await prisma.bills.groupBy({
            by: ['nguoi_cap_nhat'],
            _count: {
                ma_bill: true
            },
            orderBy: {
                _count: {
                    ma_bill: 'desc'
                }
            },
            take: 5
        });
        
        // Get user details for the top creators
        const userDetails = await Promise.all(
            billsByUser.map(async (item) => {
                if (!item.nguoi_cap_nhat) {
                    return {
                        nguoi_cap_nhat: null,
                        ten_nguoi_dung: 'Không xác định',
                        count: item._count.ma_bill
                    };
                }
                
                const user = await prisma.accounts.findUnique({
                    where: { ma_nguoi_dung: item.nguoi_cap_nhat },
                    select: { ho_va_ten: true }
                });
                
                return {
                    nguoi_cap_nhat: item.nguoi_cap_nhat,
                    ten_nguoi_dung: user?.ho_va_ten || 'Không xác định',
                    count: item._count.ma_bill
                };
            })
        );
        
        // Count bills with related order details
        const billsWithOrderDetails = await prisma.bills.count({
            where: {
                OR: [
                    { order_details_order_details_hawb_1Tobills: { some: {} } },
                    { order_details_order_details_hawb_2Tobills: { some: {} } },
                    { order_details_order_details_hawb_3Tobills: { some: {} } },
                    { order_details_order_details_hawb_4Tobills: { some: {} } },
                    { order_details_order_details_hawb_5Tobills: { some: {} } }
                ]
            }
        });
        
        // Count bills with related stock in records
        const billsWithStockIn = await prisma.bills.count({
            where: {
                stock_in: { some: {} }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê bill thành công",
            data: {
                totalBills,
                recentBills,
                topCreators: userDetails,
                billsWithOrderDetails,
                billsWithStockIn,
                billsWithoutRelations: totalBills - (billsWithOrderDetails + billsWithStockIn)
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê bill",
            error: error.message
        });
    }
};